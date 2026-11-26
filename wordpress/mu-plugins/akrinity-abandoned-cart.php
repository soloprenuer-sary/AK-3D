<?php
/**
 * Plugin Name: Akrinity abandoned cart
 * Description: Keeps a shopper's cart once the storefront sends it (with the email, at checkout), and emails a reminder with the items and a "get my cart back" button after the hours set in WooCommerce > Akrinity reminders. No reminder is sent when an order with that email is placed. Works with akrinity-reminders.php and akrinity-headless-auth.php. Version 1.0.0.
 */

defined( 'ABSPATH' ) || exit;

const AKR_CART_POST = 'akr_cart';

add_action(
	'init',
	function () {
		register_post_type( AKR_CART_POST, array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ) ) );
	}
);

/** The open cart ids for one email. */
function akr_cart_ids_for( string $email, array $statuses ): array {
	$ids = array();
	foreach ( get_posts( array( 'post_type' => AKR_CART_POST, 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids', 'meta_key' => 'akr_cart_email', 'meta_value' => $email ) ) as $cid ) {
		if ( in_array( (string) get_post_meta( $cid, 'akr_cart_status', true ), $statuses, true ) ) {
			$ids[] = (int) $cid;
		}
	}
	return $ids;
}

/** Saves or replaces the open cart for an email. Returns the cart id, or 0. */
function akr_cart_save( string $email, string $name, array $lines ): int {
	$open = akr_cart_ids_for( $email, array( 'open' ) );
	if ( $open ) {
		$id = (int) $open[0];
	} else {
		$id = (int) wp_insert_post( array( 'post_type' => AKR_CART_POST, 'post_status' => 'publish', 'post_title' => $email ) );
		if ( ! $id ) {
			return 0;
		}
		update_post_meta( $id, 'akr_cart_email', $email );
		update_post_meta( $id, 'akr_cart_status', 'open' );
	}
	update_post_meta( $id, 'akr_cart_name', $name );
	update_post_meta( $id, 'akr_cart_items', $lines );
	update_post_meta( $id, 'akr_cart_updated', time() );
	if ( ! get_post_meta( $id, 'akr_cart_scheduled', true ) ) {
		akr_cart_schedule( $id, 0 );
	}
	return $id;
}

/** Schedules the one reminder job for a cart (never two at once). $delay 0 means the usual wait. */
function akr_cart_schedule( int $id, int $delay ): void {
	$hours = function_exists( 'akr_rm_cart_hours' ) ? akr_rm_cart_hours() : 24;
	if ( $hours <= 0 ) {
		return;
	}
	$when = time() + ( $delay > 0 ? $delay : $hours * HOUR_IN_SECONDS );
	update_post_meta( $id, 'akr_cart_scheduled', $when );
	if ( function_exists( 'akr_rm_schedule' ) ) {
		akr_rm_schedule( $when, 'akr_rm_send_cart_reminder', array( $id ) );
	} else {
		wp_schedule_single_event( $when, 'akr_rm_send_cart_reminder', array( $id ) );
	}
}

/** The reminder job: sends only if the cart is still open and has been left long enough. */
add_action(
	'akr_rm_send_cart_reminder',
	function ( $id ) {
		$id = (int) $id;
		delete_post_meta( $id, 'akr_cart_scheduled' );
		if ( AKR_CART_POST !== get_post_type( $id ) || 'open' !== get_post_meta( $id, 'akr_cart_status', true ) ) {
			return;
		}
		$hours = function_exists( 'akr_rm_cart_hours' ) ? akr_rm_cart_hours() : 24;
		if ( $hours <= 0 ) {
			return;
		}
		$due = (int) get_post_meta( $id, 'akr_cart_updated', true ) + $hours * HOUR_IN_SECONDS;
		if ( time() < $due ) {
			akr_cart_schedule( $id, $due - time() ); // the shopper changed the cart since: wait again
			return;
		}
		$lines = (array) get_post_meta( $id, 'akr_cart_items', true );
		if ( ! $lines ) {
			return;
		}
		$token = bin2hex( random_bytes( 20 ) );
		update_post_meta( $id, 'akr_cart_token', wp_hash( $token ) );
		update_post_meta( $id, 'akr_cart_status', 'reminded' );
		akr_cart_send_reminder( $id, $token );
	}
);

/** The reminder email: photos of the items and a button that puts the cart back. */
function akr_cart_html( string $name, array $lines, string $token ): string {
	$base  = defined( 'AKRINITY_FRONTEND_URL' ) ? rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) : '';
	$first = trim( (string) strtok( trim( $name ), ' ' ) );
	$hi    = '' !== $first ? $first : 'there';
	$rows  = '';
	foreach ( array_slice( $lines, 0, 6 ) as $l ) {
		$img   = ! empty( $l['image'] ) ? esc_url( (string) $l['image'] ) : '';
		$photo = '' !== $img
			? '<img src="' . $img . '" alt="" width="84" height="84" style="display:block;width:84px;height:84px;object-fit:contain;border:1.5px solid #0B0B0C;border-radius:14px;background:#FFFFFF;" />'
			: '<div style="width:84px;height:84px;border:1.5px solid #0B0B0C;border-radius:14px;background:#D8FF3A;"></div>';
		$rows .= '<tr><td width="96" valign="top" style="padding:8px 0;">' . $photo . '</td>'
			. '<td valign="middle" style="padding:8px 0 8px 12px;font-family:Inter,Arial,sans-serif;"><div style="font-size:15px;font-weight:700;color:#0B0B0C;">' . esc_html( (string) $l['name'] ) . '</div>'
			. '<div style="font-size:13px;color:#55514A;margin-top:4px;">Qty ' . (int) $l['qty'] . ( ! empty( $l['price'] ) ? ' · ' . esc_html( (string) $l['price'] ) : '' ) . '</div></td></tr>';
	}
	$blocks = array(
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table>',
		akr_em_btn( 'Get my cart back', $base . '/cart?restore=' . rawurlencode( $token ) ),
		'<p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#55514A;margin:10px 0 0;">Your items are kept for you. Nothing is reserved, and the prices are as shown on the site.</p>',
	);
	return akr_em_shell(
		array(
			'tag'    => 'Still thinking?',
			'title'  => 'You left something ' . akr_em_hl( 'behind.' ),
			'head'   => 'Your cart',
			'pre'    => 'Hi ' . $hi,
			'intro'  => 'Hi ' . esc_html( $hi ) . ', your cart is still waiting. Pick up where you left off in one click.',
			'blocks' => $blocks,
			'help'   => 'Need help choosing? Reply to this email.',
		)
	);
}

function akr_cart_send_reminder( int $id, string $token ): void {
	$email = (string) get_post_meta( $id, 'akr_cart_email', true );
	if ( ! is_email( $email ) || ! function_exists( 'akr_em_shell' ) ) {
		return;
	}
	$html = akr_cart_html( (string) get_post_meta( $id, 'akr_cart_name', true ), (array) get_post_meta( $id, 'akr_cart_items', true ), $token );
	wp_mail( $email, 'You left something in your Akrinity cart', $html, array( 'Content-Type: text/html; charset=UTF-8' ) );
}

/** When an order is placed with the same email, its open cart is closed: no reminder is sent. */
add_action(
	'woocommerce_checkout_order_processed',
	function ( $order_id ) {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order ) {
			return;
		}
		foreach ( akr_cart_ids_for( strtolower( (string) $order->get_billing_email() ), array( 'open', 'reminded' ) ) as $cid ) {
			update_post_meta( $cid, 'akr_cart_status', 'converted' );
		}
	}
);

/** Storefront routes (shared key): save the cart with the shopper's email, and read it back for the restore link. */
add_action(
	'rest_api_init',
	function () {
		$service = function ( WP_REST_Request $req ) {
			return function_exists( 'akr_secret_ok' ) && akr_secret_ok( $req );
		};
		register_rest_route(
			'akrinity/v1',
			'/cart',
			array(
				'methods'             => 'POST',
				'permission_callback' => $service,
				'callback'            => function ( WP_REST_Request $req ) {
					$email = strtolower( trim( (string) $req->get_param( 'email' ) ) );
					if ( ! is_email( $email ) ) {
						return new WP_REST_Response( array( 'code' => 'bad_email' ), 400 );
					}
					$raw   = $req->get_param( 'lines' );
					$lines = array();
					foreach ( is_array( $raw ) ? array_slice( $raw, 0, 30 ) : array() as $l ) {
						if ( ! is_array( $l ) || empty( $l['name'] ) ) {
							continue;
						}
						$lines[] = array(
							'id'    => sanitize_text_field( (string) ( $l['id'] ?? '' ) ),
							'slug'  => sanitize_title( (string) ( $l['slug'] ?? '' ) ),
							'name'  => sanitize_text_field( (string) $l['name'] ),
							'qty'   => max( 1, min( 100, (int) ( $l['qty'] ?? 1 ) ) ),
							'price' => sanitize_text_field( (string) ( $l['price'] ?? '' ) ),
							'image' => esc_url_raw( (string) ( $l['image'] ?? '' ) ),
							'mode'  => sanitize_text_field( (string) ( $l['mode'] ?? '' ) ),
							'madeToOrder' => ! empty( $l['madeToOrder'] ),
						);
					}
					if ( ! $lines ) {
						foreach ( akr_cart_ids_for( $email, array( 'open' ) ) as $cid ) {
							update_post_meta( $cid, 'akr_cart_items', array() ); // the shopper emptied the cart
						}
						return new WP_REST_Response( array( 'ok' => true ), 200 );
					}
					$id = akr_cart_save( $email, sanitize_text_field( (string) $req->get_param( 'name' ) ), $lines );
					return new WP_REST_Response( array( 'ok' => (bool) $id ), $id ? 200 : 500 );
				},
			)
		);
		register_rest_route(
			'akrinity/v1',
			'/cart/restore',
			array(
				'methods'             => 'POST',
				'permission_callback' => $service,
				'callback'            => function ( WP_REST_Request $req ) {
					$token = (string) $req->get_param( 'token' );
					if ( strlen( $token ) < 20 ) {
						return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
					}
					$found = get_posts( array( 'post_type' => AKR_CART_POST, 'post_status' => 'publish', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => 'akr_cart_token', 'meta_value' => wp_hash( $token ) ) );
					if ( ! $found || 'converted' === get_post_meta( $found[0], 'akr_cart_status', true ) ) {
						return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
					}
					return new WP_REST_Response( array( 'lines' => (array) get_post_meta( $found[0], 'akr_cart_items', true ) ), 200 );
				},
			)
		);
	}
);
