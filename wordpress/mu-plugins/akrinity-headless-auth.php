<?php
/**
 * Plugin Name: Akrinity headless auth
 * Description: Password-reset and email-verification links for the headless storefront. The one approved WordPress snippet (decision 20).
 * Version: 1.0.0
 *
 * Install: copy this file to wp-content/mu-plugins/ and add to wp-config.php:
 *   define( 'AKRINITY_FRONTEND_URL', 'https://www.example.com' );
 *
 * What it does:
 *  - Reset and verification emails link to the storefront, not to WordPress.
 *  - New customers created through the WooCommerce REST API must verify their email before they can sign in.
 *  - Adds four routes under /wp-json/akrinity/v1/ for the storefront's account service. They need a signed-in
 *    user who can manage WooCommerce (the shop-manager service account), so the public cannot call them directly.
 * No secrets live in this file.
 */

defined( 'ABSPATH' ) || exit;

const AKR_VERIFY_TTL = DAY_IN_SECONDS * 2;
const AKR_RESEND_GAP = 60;

function akr_frontend_url(): string {
	return defined( 'AKRINITY_FRONTEND_URL' ) ? rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) : '';
}

/* ---------- Password reset email ---------- */

add_filter(
	'retrieve_password_message',
	function ( $message, $key, $user_login ) {
		$base = akr_frontend_url();
		if ( ! $base ) {
			return $message;
		}
		$url = $base . '/reset-password?key=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user_login );
		return "Someone asked to reset the password for your Akrinity account.\r\n\r\n"
			. "Choose a new password here. The link works for 24 hours:\r\n{$url}\r\n\r\n"
			. "If this was not you, ignore this email. Your password stays the same.\r\n";
	},
	10,
	3
);

add_filter(
	'retrieve_password_title',
	function () {
		return 'Reset your Akrinity password';
	}
);

/* ---------- Email verification ---------- */

function akr_send_verification( WP_User $user ): void {
	$base = akr_frontend_url();
	if ( ! $base ) {
		return;
	}
	$key = bin2hex( random_bytes( 24 ) );
	update_user_meta(
		$user->ID,
		'akr_verify',
		array(
			'hash'    => hash( 'sha256', $key ),
			'expires' => time() + AKR_VERIFY_TTL,
			'sent'    => time(),
		)
	);
	$url = $base . '/verify-email?key=' . rawurlencode( $key ) . '&login=' . rawurlencode( $user->user_login );
	wp_mail(
		$user->user_email,
		'Verify your Akrinity email',
		"Welcome to Akrinity.\r\n\r\nConfirm your email to finish creating your account. The link works for 2 days:\r\n{$url}\r\n\r\n"
		. "If you did not create an account, ignore this email.\r\n"
	);
}

// New customers created by the storefront's account service start unverified.
add_action(
	'woocommerce_rest_insert_customer',
	function ( $user_data, $request, $creating ) {
		if ( ! $creating || ! ( $user_data instanceof WP_User ) ) {
			return;
		}
		update_user_meta( $user_data->ID, 'akr_email_verified', '0' );
		akr_send_verification( $user_data );
	},
	10,
	3
);

// Unverified accounts cannot sign in. Accounts without the flag (existing users) are unaffected.
add_filter(
	'authenticate',
	function ( $user ) {
		if ( $user instanceof WP_User && '0' === get_user_meta( $user->ID, 'akr_email_verified', true ) ) {
			return new WP_Error( 'email_not_verified', 'Please verify your email before signing in.' );
		}
		return $user;
	},
	40
);

/* ---------- Routes for the account service ---------- */

add_action(
	'rest_api_init',
	function () {
		$can = function () {
			return current_user_can( 'manage_woocommerce' );
		};
		$route = function ( string $path, callable $cb ) use ( $can ) {
			register_rest_route(
				'akrinity/v1',
				$path,
				array(
					'methods'             => 'POST',
					'callback'            => $cb,
					'permission_callback' => $can,
				)
			);
		};

		// Always answers the same way, so it cannot be used to find out who has an account.
		$route(
			'/password/forgot',
			function ( WP_REST_Request $req ) {
				$email = sanitize_email( (string) ( $req->get_json_params()['email'] ?? '' ) );
				$user  = $email ? get_user_by( 'email', $email ) : false;
				if ( $user ) {
					retrieve_password( $user->user_login );
				}
				return array( 'ok' => true );
			}
		);

		$route(
			'/password/reset',
			function ( WP_REST_Request $req ) {
				$p        = $req->get_json_params();
				$login    = sanitize_user( (string) ( $p['login'] ?? '' ) );
				$key      = (string) ( $p['key'] ?? '' );
				$password = (string) ( $p['password'] ?? '' );
				if ( strlen( $password ) < 8 || strlen( $password ) > 128 ) {
					return new WP_REST_Response( array( 'error' => 'Use at least 8 characters.' ), 400 );
				}
				$user = check_password_reset_key( $key, $login );
				if ( is_wp_error( $user ) ) {
					return new WP_REST_Response( array( 'error' => 'This reset link is invalid or has expired.' ), 400 );
				}
				reset_password( $user, $password );
				// Receiving the reset email proves the address belongs to them.
				update_user_meta( $user->ID, 'akr_email_verified', '1' );
				delete_user_meta( $user->ID, 'akr_verify' );
				return array( 'ok' => true );
			}
		);

		$route(
			'/email/verify',
			function ( WP_REST_Request $req ) {
				$p     = $req->get_json_params();
				$user  = get_user_by( 'login', sanitize_user( (string) ( $p['login'] ?? '' ) ) );
				$key   = (string) ( $p['key'] ?? '' );
				$saved = $user ? get_user_meta( $user->ID, 'akr_verify', true ) : null;
				if ( ! $user || ! is_array( $saved ) || $saved['expires'] < time() || ! hash_equals( $saved['hash'], hash( 'sha256', $key ) ) ) {
					return new WP_REST_Response( array( 'error' => 'This verification link is invalid or has expired.' ), 400 );
				}
				update_user_meta( $user->ID, 'akr_email_verified', '1' );
				delete_user_meta( $user->ID, 'akr_verify' );
				return array( 'ok' => true );
			}
		);

		$route(
			'/email/resend',
			function ( WP_REST_Request $req ) {
				$email = sanitize_email( (string) ( $req->get_json_params()['email'] ?? '' ) );
				$user  = $email ? get_user_by( 'email', $email ) : false;
				if ( $user && '0' === get_user_meta( $user->ID, 'akr_email_verified', true ) ) {
					$saved = get_user_meta( $user->ID, 'akr_verify', true );
					if ( ! is_array( $saved ) || ( $saved['sent'] ?? 0 ) + AKR_RESEND_GAP < time() ) {
						akr_send_verification( $user );
					}
				}
				return array( 'ok' => true );
			}
		);
	}
);
