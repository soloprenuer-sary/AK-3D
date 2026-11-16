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

/* ---------- Slow work after the response ---------- */

/**
 * Runs $fn after the reply has gone back to the storefront, so sending email (which can take
 * several seconds over SMTP) does not hold the visitor up. If the server cannot finish the
 * request early, the work simply runs at the end, which is the old behaviour.
 */
function akr_after_response( callable $fn ): void {
	add_action(
		'shutdown',
		function () use ( $fn ) {
			if ( function_exists( 'fastcgi_finish_request' ) ) {
				fastcgi_finish_request();
			} elseif ( function_exists( 'litespeed_finish_request' ) ) {
				litespeed_finish_request();
			}
			$fn();
		},
		2
	);
}

// The storefront sends its own verification email, so WooCommerce's welcome email is skipped
// for accounts created through the API (it would be a second slow email).
add_filter(
	'woocommerce_email_enabled_customer_new_account',
	function ( $enabled ) {
		return ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ? false : $enabled;
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

/** Marks a new customer unverified and emails the link (after the reply). Skipped when the development switch is off. */
function akr_start_verification( WP_User $user ): void {
	// Development switch: define( 'AKRINITY_REQUIRE_VERIFIED_EMAIL', false ) in wp-config.php to skip verification.
	if ( defined( 'AKRINITY_REQUIRE_VERIFIED_EMAIL' ) && ! AKRINITY_REQUIRE_VERIFIED_EMAIL ) {
		return;
	}
	update_user_meta( $user->ID, 'akr_email_verified', '0' );
	akr_after_response(
		function () use ( $user ) {
			akr_send_verification( $user );
		}
	);
}

// Customers created through the WooCommerce REST API start unverified (older sign-up path).
add_action(
	'woocommerce_rest_insert_customer',
	function ( $user_data, $request, $creating ) {
		if ( $creating && $user_data instanceof WP_User ) {
			akr_start_verification( $user_data );
		}
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

		// Creates a customer, and only a customer. The storefront's service account (a Shop manager)
		// cannot create users through the WooCommerce API, and should not be given that power.
		$route(
			'/register',
			function ( WP_REST_Request $req ) {
				$p        = $req->get_json_params();
				$email    = sanitize_email( (string) ( $p['email'] ?? '' ) );
				$name     = trim( sanitize_text_field( (string) ( $p['name'] ?? '' ) ) );
				$phone    = sanitize_text_field( (string) ( $p['phone'] ?? '' ) );
				$password = (string) ( $p['password'] ?? '' );
				if ( ! is_email( $email ) || '' === $name || strlen( $password ) < 8 || strlen( $password ) > 128 ) {
					return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
				}
				$parts = preg_split( '/s+/', $name, 2 );
				$id    = wc_create_new_customer(
					$email,
					'',
					$password,
					array(
						'first_name'   => $parts[0],
						'last_name'    => $parts[1] ?? '',
						'display_name' => $name,
					)
				);
				if ( is_wp_error( $id ) ) {
					return new WP_REST_Response( array( 'code' => 'exists' ), 400 );
				}
				if ( '' !== $phone ) {
					update_user_meta( $id, 'billing_phone', $phone );
				}
				update_user_meta( $id, 'billing_first_name', $parts[0] );
				update_user_meta( $id, 'billing_last_name', $parts[1] ?? '' );
				update_user_meta( $id, 'billing_email', $email );
				$user = get_user_by( 'id', $id );
				if ( $user ) {
					akr_start_verification( $user );
				}
				return new WP_REST_Response( array( 'id' => $id ), 201 );
			}
		);

		// Always answers the same way, so it cannot be used to find out who has an account.
		$route(
			'/password/forgot',
			function ( WP_REST_Request $req ) {
				$email = sanitize_email( (string) ( $req->get_json_params()['email'] ?? '' ) );
				$user  = $email ? get_user_by( 'email', $email ) : false;
				if ( $user ) {
					$login = $user->user_login;
					akr_after_response(
						function () use ( $login ) {
							retrieve_password( $login );
						}
					);
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
						akr_after_response(
							function () use ( $user ) {
								akr_send_verification( $user );
							}
						);
					}
				}
				return array( 'ok' => true );
			}
		);
	}
);
