<?php
/**
 * Plugin Name: Akrinity headless account
 * Description: Customer sign-up, account details and orders for the headless storefront. The one approved WordPress snippet (decisions 20 and 32).
 * Version: 2.0.0
 *
 * Install: copy this file to wp-content/mu-plugins/ and add to wp-config.php:
 *   define( 'AKRINITY_FRONTEND_URL', 'https://www.example.com' );
 *   define( 'AKRINITY_SHARED_SECRET', '<a new random value, 40 or more characters>' );
 * The same secret value is set in Vercel as AKRINITY_SHARED_SECRET. Nothing secret lives in this file.
 *
 * What it does (all under /wp-json/akrinity/v1/):
 *  - Service routes, only for the storefront (they need the shared secret in the X-Akrinity-Key header):
 *      POST /register          creates a customer (role Customer, nothing else)
 *      POST /account/status    says whether an email has an account, only guest orders, or is new
 *      POST /password/forgot   emails a reset link to the storefront
 *      POST /password/reset    sets a new password from the emailed link
 *  - Customer routes, for a signed-in customer (their own sign-in token) and only about themselves:
 *      GET|POST /me            details and saved addresses
 *      POST /me/password       change password
 *      GET /orders             their orders
 *      GET /orders/{id}        one of their orders
 *  - Password-reset emails link to the storefront, and slow emails are sent after the reply.
 */

defined( 'ABSPATH' ) || exit;

function akr_frontend_url(): string {
	return defined( 'AKRINITY_FRONTEND_URL' ) ? rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) : '';
}

/** True when the request carries the shared secret. Without a long secret in wp-config.php nothing is allowed. */
function akr_secret_ok( WP_REST_Request $req ): bool {
	if ( ! defined( 'AKRINITY_SHARED_SECRET' ) || strlen( (string) AKRINITY_SHARED_SECRET ) < 32 ) {
		return false;
	}
	$sent = (string) $req->get_header( 'x-akrinity-key' );
	return '' !== $sent && hash_equals( (string) AKRINITY_SHARED_SECRET, $sent );
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
 * request early, the work simply runs at the end.
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

// WooCommerce's welcome email is skipped for accounts created through the API: it is a slow extra
// email, and the storefront signs the new customer in straight away.
add_filter(
	'woocommerce_email_enabled_customer_new_account',
	function ( $enabled ) {
		return ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ? false : $enabled;
	}
);

/* ---------- Helpers for account data ---------- */

const AKR_ADDRESS_KEYS = array( 'first_name', 'last_name', 'company', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country' );

/** One saved address (billing or shipping) as plain values. */
function akr_read_address( int $user_id, string $type ): array {
	$keys = AKR_ADDRESS_KEYS;
	if ( 'billing' === $type ) {
		$keys = array_merge( $keys, array( 'email', 'phone' ) );
	}
	$out = array();
	foreach ( $keys as $key ) {
		$out[ $key ] = (string) get_user_meta( $user_id, $type . '_' . $key, true );
	}
	return $out;
}

/** Saves the allowed fields of one address from a request body. Anything else is ignored. */
function akr_save_address( int $user_id, string $type, $data ): void {
	if ( ! is_array( $data ) ) {
		return;
	}
	$keys = AKR_ADDRESS_KEYS;
	if ( 'billing' === $type ) {
		$keys = array_merge( $keys, array( 'email', 'phone' ) );
	}
	foreach ( $keys as $key ) {
		if ( ! array_key_exists( $key, $data ) ) {
			continue;
		}
		$value = 'email' === $key ? sanitize_email( (string) $data[ $key ] ) : sanitize_text_field( (string) $data[ $key ] );
		update_user_meta( $user_id, $type . '_' . $key, substr( $value, 0, 200 ) );
	}
}

function akr_order_summary( WC_Order $o ): array {
	$created = $o->get_date_created();
	return array(
		'id'             => $o->get_id(),
		'number'         => (string) $o->get_order_number(),
		'status'         => $o->get_status(),
		'status_label'   => wc_get_order_status_name( $o->get_status() ),
		'date'           => $created ? $created->date( 'c' ) : '',
		'total'          => (string) $o->get_total(),
		'currency'       => $o->get_currency(),
		'item_count'     => (int) $o->get_item_count(),
		'payment_method' => (string) $o->get_payment_method_title(),
	);
}

function akr_order_detail( WC_Order $o ): array {
	$items = array();
	foreach ( $o->get_items() as $item ) {
		$meta = array();
		foreach ( $item->get_formatted_meta_data() as $m ) {
			$meta[] = array(
				'label' => wp_strip_all_tags( (string) $m->display_key ),
				'value' => wp_strip_all_tags( (string) $m->display_value ),
			);
		}
		$items[] = array(
			'name'     => $item->get_name(),
			'quantity' => (int) $item->get_quantity(),
			'total'    => (string) $item->get_total(),
			'meta'     => $meta,
		);
	}
	$paid = $o->get_date_paid();
	return array_merge(
		akr_order_summary( $o ),
		array(
			'items'          => $items,
			'subtotal'       => (string) $o->get_subtotal(),
			'shipping_total' => (string) $o->get_shipping_total(),
			'tax_total'      => (string) $o->get_total_tax(),
			'discount_total' => (string) $o->get_discount_total(),
			'date_paid'      => $paid ? $paid->date( 'c' ) : '',
			'note'           => (string) $o->get_customer_note(),
			'billing'        => $o->get_address( 'billing' ),
			'shipping'       => $o->get_address( 'shipping' ),
		)
	);
}

/* ---------- Routes ---------- */

add_action(
	'rest_api_init',
	function () {
		$service  = function ( WP_REST_Request $req ) {
			return akr_secret_ok( $req );
		};
		$customer = function () {
			return is_user_logged_in();
		};
		$route    = function ( string $path, string $method, callable $cb, callable $permission ) {
			register_rest_route(
				'akrinity/v1',
				$path,
				array(
					'methods'             => $method,
					'callback'            => $cb,
					'permission_callback' => $permission,
				)
			);
		};

		// ----- service routes (shared secret) -----

		// Creates a customer, and only a customer.
		$route(
			'/register',
			'POST',
			function ( WP_REST_Request $req ) {
				$p        = $req->get_json_params();
				$email    = sanitize_email( (string) ( $p['email'] ?? '' ) );
				$name     = trim( sanitize_text_field( (string) ( $p['name'] ?? '' ) ) );
				$phone    = sanitize_text_field( (string) ( $p['phone'] ?? '' ) );
				$password = (string) ( $p['password'] ?? '' );
				if ( ! is_email( $email ) || '' === $name || strlen( $password ) < 8 || strlen( $password ) > 128 ) {
					return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
				}
				if ( email_exists( $email ) ) {
					return new WP_REST_Response( array( 'code' => 'exists' ), 400 );
				}
				$parts = preg_split( '/\s+/', $name, 2 );
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
				// Orders placed earlier as a guest with this email are linked by WooCommerce (woocommerce_created_customer).
				update_user_meta( $id, 'billing_first_name', $parts[0] );
				update_user_meta( $id, 'billing_last_name', $parts[1] ?? '' );
				update_user_meta( $id, 'billing_email', $email );
				if ( '' !== $phone ) {
					update_user_meta( $id, 'billing_phone', $phone );
				}
				return new WP_REST_Response( array( 'id' => $id ), 201 );
			},
			$service
		);

		// account = has a login, guest = only ordered as a guest before, new = never seen.
		$route(
			'/account/status',
			'POST',
			function ( WP_REST_Request $req ) {
				$email = sanitize_email( (string) ( $req->get_json_params()['email'] ?? '' ) );
				if ( ! is_email( $email ) ) {
					return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
				}
				if ( email_exists( $email ) ) {
					return array( 'state' => 'account' );
				}
				$guest = wc_get_orders(
					array(
						'billing_email' => $email,
						'limit'         => 1,
						'return'        => 'ids',
					)
				);
				return array( 'state' => empty( $guest ) ? 'new' : 'guest' );
			},
			$service
		);

		// Always answers the same way, so it cannot be used to find out who has an account.
		$route(
			'/password/forgot',
			'POST',
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
			},
			$service
		);

		$route(
			'/password/reset',
			'POST',
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
				return array( 'ok' => true );
			},
			$service
		);

		// ----- customer routes (the customer's own sign-in token) -----

		$route(
			'/me',
			'GET',
			function () {
				$user = wp_get_current_user();
				return array(
					'id'           => $user->ID,
					'email'        => $user->user_email,
					'first_name'   => (string) get_user_meta( $user->ID, 'first_name', true ),
					'last_name'    => (string) get_user_meta( $user->ID, 'last_name', true ),
					'display_name' => $user->display_name,
					'phone'        => (string) get_user_meta( $user->ID, 'billing_phone', true ),
					'billing'      => akr_read_address( $user->ID, 'billing' ),
					'shipping'     => akr_read_address( $user->ID, 'shipping' ),
				);
			},
			$customer
		);

		$route(
			'/me',
			'POST',
			function ( WP_REST_Request $req ) {
				$p    = $req->get_json_params();
				$user = wp_get_current_user();
				$id   = $user->ID;
				$first = array_key_exists( 'first_name', $p ) ? sanitize_text_field( (string) $p['first_name'] ) : (string) get_user_meta( $id, 'first_name', true );
				$last  = array_key_exists( 'last_name', $p ) ? sanitize_text_field( (string) $p['last_name'] ) : (string) get_user_meta( $id, 'last_name', true );
				if ( '' === trim( $first . $last ) ) {
					return new WP_REST_Response( array( 'error' => 'Enter your name.' ), 400 );
				}
				wp_update_user(
					array(
						'ID'           => $id,
						'first_name'   => $first,
						'last_name'    => $last,
						'display_name' => trim( $first . ' ' . $last ),
					)
				);
				if ( array_key_exists( 'phone', $p ) ) {
					update_user_meta( $id, 'billing_phone', sanitize_text_field( (string) $p['phone'] ) );
				}
				akr_save_address( $id, 'billing', $p['billing'] ?? null );
				akr_save_address( $id, 'shipping', $p['shipping'] ?? null );
				return array( 'ok' => true );
			},
			$customer
		);

		$route(
			'/me/password',
			'POST',
			function ( WP_REST_Request $req ) {
				$p        = $req->get_json_params();
				$user     = wp_get_current_user();
				$current  = (string) ( $p['current'] ?? '' );
				$password = (string) ( $p['password'] ?? '' );
				if ( ! wp_check_password( $current, $user->user_pass, $user->ID ) ) {
					return new WP_REST_Response( array( 'error' => 'Your current password is not correct.' ), 400 );
				}
				if ( strlen( $password ) < 8 || strlen( $password ) > 128 ) {
					return new WP_REST_Response( array( 'error' => 'Use at least 8 characters.' ), 400 );
				}
				wp_set_password( $password, $user->ID );
				return array( 'ok' => true );
			},
			$customer
		);

		$route(
			'/orders',
			'GET',
			function () {
				$orders = wc_get_orders(
					array(
						'customer_id' => get_current_user_id(),
						'limit'       => 50,
						'orderby'     => 'date',
						'order'       => 'DESC',
					)
				);
				return array( 'orders' => array_map( 'akr_order_summary', $orders ) );
			},
			$customer
		);

		$route(
			'/orders/(?P<id>\d+)',
			'GET',
			function ( WP_REST_Request $req ) {
				$order = wc_get_order( (int) $req['id'] );
				// Someone else's order looks exactly like a missing one.
				if ( ! $order instanceof WC_Order || (int) $order->get_customer_id() !== get_current_user_id() ) {
					return new WP_REST_Response( array( 'error' => 'Order not found.' ), 404 );
				}
				return array( 'order' => akr_order_detail( $order ) );
			},
			$customer
		);
	}
);
