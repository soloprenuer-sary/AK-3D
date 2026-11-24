<?php
/**
 * Plugin Name: Akrinity quote payment on the storefront
 * Description: Lets the customer pay an approved custom quote on the website (Vercel) instead of on the WordPress pay page. The storefront asks this plugin for a Cashfree payment session; the Cashfree checkout then opens on the website. After paying, Cashfree sends the customer through the Cashfree plugin's own capture step (which marks the order paid, and with it the quote), and on to the website's /quote/paid page. Works with akrinity-quotes.php, akrinity-requests.php and the Cashfree plugin. Version 1.0.0.
 *
 * Route (shared key, called by the storefront server only):
 *   POST /akrinity/v1/quote/pay   {ref, exp, token}   ->  { ok, payment_session_id, mode, amount }
 *
 * Nothing to set. The Cashfree app id, secret and test or live mode come from WooCommerce > Settings > Payments > Cashfree.
 */

defined( 'ABSPATH' ) || exit;

/** The storefront page that opens the Cashfree checkout for a quote: the accept link with /quote/pay instead of /quote/accept. */
function akrq_pay_link( int $id ): string {
	$link = function_exists( 'akrq_quote_link' ) ? akrq_quote_link( $id ) : '';
	return '' === $link ? '' : str_replace( '/quote/accept?', '/quote/pay?', $link );
}

// The Cashfree plugin sends the customer back with a safe redirect: allow the storefront's host.
add_filter(
	'allowed_redirect_hosts',
	function ( $hosts ) {
		$front = function_exists( 'akr_frontend_url' ) ? akr_frontend_url() : '';
		$host  = '' === $front ? '' : wp_parse_url( $front, PHP_URL_HOST );
		if ( $host ) {
			$hosts[] = $host;
		}
		return $hosts;
	}
);

/** Checks the signed link. Like akrq_check_quote, but a quote already approved can still be paid after its acceptance window. */
function akrq_check_paying( WP_REST_Request $req ) {
	$ref   = (string) $req->get_param( 'ref' );
	$exp   = (int) $req->get_param( 'exp' );
	$token = (string) $req->get_param( 'token' );
	$id    = (int) preg_replace( '/\D+/', '', $ref );
	$post  = $id ? get_post( $id ) : null;
	if ( ! $post || 'akr_request' !== $post->post_type || akr_request_reference( $id ) !== strtoupper( $ref ) ) {
		return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
	}
	$price = (string) get_post_meta( $id, 'akr_quote_price', true );
	if ( '' === $price || '' === $token || ! function_exists( 'akrq_quote_token' ) || ! hash_equals( akrq_quote_token( $id, $exp, $price ), $token ) || $exp !== (int) get_post_meta( $id, 'akr_quote_exp', true ) ) {
		return new WP_REST_Response( array( 'code' => 'bad_token' ), 403 );
	}
	if ( $exp < time() && ! in_array( akr_request_status( $id ), array( 'awaiting_payment', 'paid' ), true ) ) {
		return new WP_REST_Response( array( 'code' => 'expired' ), 410 );
	}
	return $id;
}

function akrq_pay_start( WP_REST_Request $req ) {
	$p = $req->get_json_params();
	foreach ( array( 'ref', 'exp', 'token' ) as $k ) {
		if ( isset( $p[ $k ] ) ) {
			$req->set_param( $k, $p[ $k ] );
		}
	}
	$id = akrq_check_paying( $req );
	if ( $id instanceof WP_REST_Response ) {
		return $id;
	}
	$status = akr_request_status( $id );
	if ( 'paid' === $status ) {
		return new WP_REST_Response( array( 'ok' => true, 'status' => 'paid' ), 200 );
	}
	$order = function_exists( 'akrqt_order' ) ? akrqt_order( $id ) : null;
	if ( 'awaiting_payment' !== $status || ! $order || ! $order->needs_payment() ) {
		return new WP_REST_Response( array( 'code' => 'not_payable', 'status' => $status ), 409 );
	}
	try {
		if ( function_exists( 'wc_load_cart' ) ) {
			wc_load_cart(); // the REST request has no shop session; the Cashfree plugin needs one for its notices.
		}
		$gateways = WC()->payment_gateways()->payment_gateways();
		$gateway  = $gateways['cashfree'] ?? null;
		if ( ! $gateway || 'yes' !== $gateway->enabled ) {
			return new WP_REST_Response( array( 'code' => 'no_gateway' ), 503 );
		}
		if ( 'cashfree' !== $order->get_payment_method() ) {
			$order->set_payment_method( $gateway );
			$order->save();
		}
		$res = $gateway->process_payment( $order->get_id() );
		if ( 'success' !== ( $res['result'] ?? '' ) || empty( $res['redirect'] ) ) {
			error_log( 'akrinity quote pay: Cashfree did not start a payment for order ' . $order->get_id() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
			return new WP_REST_Response( array( 'code' => 'gateway_failed' ), 502 );
		}
		$query = array();
		parse_str( (string) wp_parse_url( (string) $res['redirect'], PHP_URL_QUERY ), $query );
		$session = (string) ( $query['cashfree-token'] ?? '' );
		if ( '' === $session ) {
			return new WP_REST_Response( array( 'code' => 'gateway_failed' ), 502 );
		}
		akr_request_log( $id, 'Payment page opened on the website (Cashfree).' );
		return new WP_REST_Response(
			array(
				'ok'                 => true,
				'payment_session_id' => $session,
				'mode'               => method_exists( $gateway, 'get_environment' ) ? $gateway->get_environment() : 'sandbox',
				'amount'             => (float) $order->get_total(),
			),
			200
		);
	} catch ( Throwable $e ) {
		error_log( 'akrinity quote pay: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
		return new WP_REST_Response( array( 'code' => 'gateway_failed' ), 502 );
	}
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/quote/pay',
			array(
				'methods'             => 'POST',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return function_exists( 'akr_secret_ok' ) && akr_secret_ok( $req );
				},
				'callback'            => 'akrq_pay_start',
			)
		);
	}
);
