<?php
/**
 * Plugin Name: Akrinity headless account
 * Description: Customer sign-up, account details and orders, bulk prices and bulk quote requests for the headless storefront. The one approved WordPress snippet (decisions 20, 32 and 34).
 * Version: 2.7.0
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
 *  - Bulk prices: ACF fields on the product, in pairs of MOQ and price (MOQ-1 with price-moq-1, and so on), appear in the Store API as extensions.akrinity.bulk_tiers.
 *  - POST /business-request (shared secret): saves a bulk quote request under Quote requests and emails the admin and the customer.
 *  - POST /contact and POST /newsletter (shared secret): saved under Quote requests as Message (CM-) and Newsletter entries; GET /reviews?product=ID lists approved reviews, POST /reviews (shared secret) saves a new one as pending for approval.
 *  - Password-reset emails link to the storefront, and slow emails are sent after the reply.
 */

defined( 'ABSPATH' ) || exit;

function akr_frontend_url(): string {
	return defined( 'AKRINITY_FRONTEND_URL' ) ? rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) : '';
}

/** Makes a new one-time token for the customer, stores only its hash for 7 days, and emails the link. */
function akr_send_verify_email( int $id ): void {
	$user = get_user_by( 'id', $id );
	$base = akr_frontend_url();
	if ( ! $user || '' === $base || ! function_exists( 'akr_mail' ) ) {
		return;
	}
	$token = wp_generate_password( 40, false );
	update_user_meta( $id, 'akr_verify_hash', wp_hash( $token ) );
	update_user_meta( $id, 'akr_verify_until', time() + 7 * DAY_IN_SECONDS );
	$url   = $base . '/verify?id=' . $id . '&token=' . rawurlencode( $token );
	$first = trim( (string) get_user_meta( $id, 'first_name', true ) );
	$hello = '' !== $first ? "Hi $first,\r\n\r\n" : "Hello,\r\n\r\n";
	$text  = $hello . "Welcome to Akrinity. Please confirm your email address with this link (it works for 7 days):\r\n{$url}\r\n\r\n"
		. "If you did not create an account, ignore this email.\r\n";
	akr_after_response(
		function () use ( $user, $text, $url ) {
			akr_mail(
				$user->user_email,
				'Confirm your email for Akrinity',
				$text,
				array(),
				array(
					'tag'   => 'Confirm email',
					'title' => 'Confirm your',
					'hl'    => 'email.',
					'head'  => 'Welcome',
					'intro' => 'One click confirms your address. You can shop before you do.',
					'steps' => array(),
					'help'  => 'If you did not create an account, ignore this email.',
				)
			);
		}
	);
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

/**
 * Sends an email. With a $style (and the Akrinity email design from akrinity-emails.php present) it goes out as the
 * lime-poster HTML email built from $style['summary'] ("Label: value" lines); otherwise as the plain text given.
 */
function akr_mail( $to, $subject, $plain, $headers = array(), $style = null ) {
	if ( is_array( $style ) && function_exists( 'akr_em_notice' ) ) {
		$headers   = is_array( $headers ) ? $headers : array_filter( array( (string) $headers ) );
		$headers[] = 'Content-Type: text/html; charset=UTF-8';
		return wp_mail( $to, $subject, akr_em_notice( $style ), $headers );
	}
	return wp_mail( $to, $subject, $plain, $headers );
}

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
				// Soft email check: the account works at once, a banner asks the customer to confirm the address.
				update_user_meta( $id, 'akr_email_verified', '0' );
				akr_send_verify_email( (int) $id );
				return new WP_REST_Response( array( 'id' => $id ), 201 );
			},
			$service
		);

		// Confirms the link from the verification email: POST { id, token }.
		$route(
			'/verify',
			'POST',
			function ( WP_REST_Request $req ) {
				$p     = $req->get_json_params();
				$id    = (int) ( $p['id'] ?? 0 );
				$token = (string) ( $p['token'] ?? '' );
				$hash  = (string) get_user_meta( $id, 'akr_verify_hash', true );
				$until = (int) get_user_meta( $id, 'akr_verify_until', true );
				if ( $id <= 0 || '' === $token || '' === $hash || time() > $until || ! hash_equals( $hash, wp_hash( $token ) ) ) {
					return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
				}
				update_user_meta( $id, 'akr_email_verified', '1' );
				delete_user_meta( $id, 'akr_verify_hash' );
				delete_user_meta( $id, 'akr_verify_until' );
				return new WP_REST_Response( array( 'ok' => true ), 200 );
			},
			$service
		);

		// Sends a new link. The answer is the same whether or not the email has an account.
		$route(
			'/verify/resend',
			'POST',
			function ( WP_REST_Request $req ) {
				$p     = $req->get_json_params();
				$email = sanitize_email( (string) ( $p['email'] ?? '' ) );
				$user  = is_email( $email ) ? get_user_by( 'email', $email ) : false;
				if ( $user && '0' === (string) get_user_meta( $user->ID, 'akr_email_verified', true ) ) {
					akr_send_verify_email( (int) $user->ID );
				}
				return new WP_REST_Response( array( 'ok' => true ), 200 );
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
					'email_verified' => '0' !== (string) get_user_meta( $user->ID, 'akr_email_verified', true ),
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

/* ---------- Bulk pricing (ACF fields on the product) ---------- */

/** Lower-case a field name and turn every run of other characters into one underscore: "price-moq-1" becomes "price_moq_1". */
function akr_norm_key( $key ): string {
	return trim( preg_replace( '/[^a-z0-9]+/', '_', strtolower( (string) $key ) ), '_' );
}

/**
 * Every plain value saved on a product, with group fields opened up and names normalised.
 * Works whether the fields sit inside an ACF group (such as "bulk-quote") or stand alone.
 */
function akr_flat_fields( int $product_id ): array {
	$flat = array();
	if ( function_exists( 'get_fields' ) ) {
		$all = get_fields( $product_id );
		if ( is_array( $all ) ) {
			foreach ( $all as $key => $value ) {
				if ( is_array( $value ) && ! isset( $value[0] ) ) {
					foreach ( $value as $inner_key => $inner_value ) {
						$flat[ akr_norm_key( $inner_key ) ] = $inner_value;
					}
				} else {
					$flat[ akr_norm_key( $key ) ] = $value;
				}
			}
		}
	}
	// Also the raw custom fields (a group saves them as bulk_quote_moq_1 and so on).
	foreach ( (array) get_post_meta( $product_id ) as $key => $values ) {
		$name = akr_norm_key( $key );
		if ( '' === (string) $key || '_' === substr( (string) $key, 0, 1 ) || isset( $flat[ $name ] ) ) {
			continue;
		}
		$flat[ $name ] = is_array( $values ) ? ( $values[0] ?? '' ) : $values;
	}
	return $flat;
}

/** One price range, or null when it is not filled in properly. */
function akr_tier( $from, $to, $price ): ?array {
	$from  = (int) $from;
	$to    = ( null === $to || '' === (string) $to ) ? null : (int) $to;
	$price = (float) $price;
	if ( $from < 1 || $price <= 0 || ( null !== $to && $to < $from ) ) {
		return null;
	}
	return array(
		'from'  => $from,
		'to'    => $to,
		'price' => (string) $price,
	);
}

/**
 * Bulk price ranges for a product, lowest quantity first. They are filled in with ACF fields on
 * the product, in pairs: a minimum order quantity (MOQ) and the price per piece from that quantity.
 * Any field name that contains "moq" and ends in a number is read, for example MOQ-1 with
 * price-moq-1, MOQ-2 with price-moq-2. A range runs up to the next MOQ; the last one is "and up".
 */
function akr_bulk_tiers( int $product_id ): array {
	$from  = array();
	$price = array();
	foreach ( akr_flat_fields( $product_id ) as $key => $value ) {
		if ( is_array( $value ) || false === strpos( $key, 'moq' ) || ! preg_match( '/(\d+)$/', $key, $m ) ) {
			continue;
		}
		if ( false !== strpos( $key, 'price' ) ) {
			$price[ (int) $m[1] ] = $value;
		} else {
			$from[ (int) $m[1] ] = $value;
		}
	}
	$starts = array();
	foreach ( $from as $i => $quantity ) {
		if ( isset( $price[ $i ] ) && akr_tier( $quantity, null, $price[ $i ] ) ) {
			$starts[] = array(
				'from'  => (int) $quantity,
				'price' => $price[ $i ],
			);
		}
	}
	usort(
		$starts,
		function ( $a, $b ) {
			return $a['from'] <=> $b['from'];
		}
	);
	$tiers = array();
	foreach ( $starts as $n => $start ) {
		$to      = isset( $starts[ $n + 1 ] ) ? $starts[ $n + 1 ]['from'] - 1 : null;
		$tiers[] = akr_tier( $start['from'], $to, $start['price'] );
	}
	return array_values( array_filter( $tiers ) );
}

// The ranges ride along on each product in the WooCommerce Store API, under extensions.akrinity.bulk_tiers.
add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}
		$endpoint = class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema' )
			? \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER
			: 'product';
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => $endpoint,
				'namespace'       => 'akrinity',
				'data_callback'   => function ( $product ) {
					return array(
						'bulk_tiers'    => akr_bulk_tiers( (int) $product->get_id() ),
						// Product ids from the "Linked products" box (Upsells and Cross-sells) on the product.
						'cross_sell_ids' => array_values( array_map( 'intval', $product->get_cross_sell_ids() ) ),
						'upsell_ids'     => array_values( array_map( 'intval', $product->get_upsell_ids() ) ),
					);
				},
				'schema_callback' => function () {
					return array(
						'bulk_tiers' => array(
							'description' => 'Bulk price ranges for this product.',
							'type'        => 'array',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
						'cross_sell_ids' => array(
							'description' => 'Cross-sell product ids set on this product.',
							'type'        => 'array',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
						'upsell_ids' => array(
							'description' => 'Upsell product ids set on this product.',
							'type'        => 'array',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);
	}
);

/* ---------- Bulk quote requests ---------- */

// Requests are kept in WordPress under "Quote requests" in the admin menu, so none is lost.
add_action(
	'init',
	function () {
		register_post_type(
			'akr_request',
			array(
				'labels'          => array(
					'name'          => 'Quote requests',
					'singular_name' => 'Quote request',
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_icon'       => 'dashicons-email-alt',
				'supports'        => array( 'title' ),
				'capability_type' => 'post',
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'    => true,
			)
		);
	}
);

/** The label shown for a request's kind. Older requests have no kind and are bulk requests. */
function akr_request_kind_label( $post_id ) {
	$labels = array(
		'custom'     => 'Custom quote',
		'contact'    => 'Message',
		'newsletter' => 'Newsletter',
	);
	return $labels[ get_post_meta( $post_id, 'akr_kind', true ) ] ?? 'Bulk quote';
}

function akr_request_reference( $post_id ) {
	$prefix = array(
		'custom'     => 'QR-',
		'contact'    => 'CM-',
		'newsletter' => 'NL-',
	);
	return ( $prefix[ get_post_meta( $post_id, 'akr_kind', true ) ] ?? 'BQ-' ) . $post_id;
}

add_action(
	'add_meta_boxes',
	function () {
		add_meta_box(
			'akr_request_details',
			'Request details',
			function ( $post ) {
				$rows = array(
					'Reference'  => akr_request_reference( $post->ID ),
					'Type'       => akr_request_kind_label( $post->ID ),
					'Received'   => get_the_date( 'j M Y, g:i a', $post ),
					'Company'    => get_post_meta( $post->ID, 'akr_company', true ),
					'GSTIN'      => get_post_meta( $post->ID, 'akr_gstin', true ),
					'Contact'    => get_post_meta( $post->ID, 'akr_name', true ),
					'Phone'      => get_post_meta( $post->ID, 'akr_phone', true ),
					'Email'      => get_post_meta( $post->ID, 'akr_email', true ),
					'Job'        => get_post_meta( $post->ID, 'akr_job', true ),
					'Material'   => get_post_meta( $post->ID, 'akr_material', true ),
					'Needs'      => get_post_meta( $post->ID, 'akr_need', true ),
					'Quantity'   => get_post_meta( $post->ID, 'akr_quantity', true ),
					'Product'    => get_post_meta( $post->ID, 'akr_product_name', true ),
					'File name'  => get_post_meta( $post->ID, 'akr_file_name', true ),
					'File size'  => get_post_meta( $post->ID, 'akr_file_size', true ),
					'Topic'      => get_post_meta( $post->ID, 'akr_topic', true ),
					'Order no.'  => get_post_meta( $post->ID, 'akr_order', true ),
					'Message'    => get_post_meta( $post->ID, 'akr_message', true ),
					'Notes'      => get_post_meta( $post->ID, 'akr_notes', true ),
				);
				echo '<table class="widefat striped"><tbody>';
				foreach ( $rows as $label => $value ) {
					$value = (string) $value;
					if ( '' === $value ) {
						continue;
					}
					printf(
						'<tr><th style="width:140px">%s</th><td>%s</td></tr>',
						esc_html( $label ),
						nl2br( esc_html( $value ) )
					);
				}
				echo '</tbody></table>';
			},
			'akr_request',
			'normal',
			'high'
		);
	}
);

/* ---------- Quote request status, customer file and history ---------- */

/** The stages a request goes through, like WooCommerce order statuses. The first is the default. */
function akr_statuses() {
	return array(
		'new'              => 'New',
		'reviewing'        => 'Reviewing',
		'quoted'           => 'Quoted',
		'awaiting_payment' => 'Awaiting payment',
		'paid'             => 'Paid',
		'in_production'    => 'In production',
		'ready'            => 'Ready to ship',
		'shipped'          => 'Shipped',
		'completed'        => 'Completed',
		'cancelled'        => 'Cancelled',
		'refunded'         => 'Refunded',
		'returned'         => 'Returned',
	);
}

/** Statuses that mean the job is over, so the customer's file can be deleted. */
function akr_closed_statuses() {
	return array( 'completed', 'cancelled', 'refunded', 'returned' );
}

function akr_status_colors() {
	return array(
		'new'              => array( '#dcdcde', '#1d2327' ),
		'reviewing'        => array( '#d0e4f7', '#0a4b78' ),
		'quoted'           => array( '#e2d9f3', '#3c2a74' ),
		'awaiting_payment' => array( '#fcf0c3', '#7a5b00' ),
		'paid'             => array( '#c6e8c9', '#0b4a1b' ),
		'in_production'    => array( '#ffe1c2', '#8a3b00' ),
		'ready'            => array( '#d8ff3a', '#1d2327' ),
		'shipped'          => array( '#b9e8f0', '#06505e' ),
		'completed'        => array( '#2c3338', '#ffffff' ),
		'cancelled'        => array( '#f6c9c9', '#7a1212' ),
		'refunded'         => array( '#f0d2e6', '#6b1a50' ),
		'returned'         => array( '#e6d2c0', '#5a3412' ),
	);
}

function akr_request_status( $post_id ) {
	$s   = (string) get_post_meta( $post_id, 'akr_status', true );
	$all = akr_statuses();
	return isset( $all[ $s ] ) ? $s : 'new';
}

/** A coloured label for a status, safe to print. */
function akr_status_badge( $status ) {
	$all    = akr_statuses();
	$colors = akr_status_colors();
	$c      = $colors[ $status ] ?? array( '#dcdcde', '#1d2327' );
	return sprintf(
		'<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;background:%s;color:%s">%s</span>',
		esc_attr( $c[0] ),
		esc_attr( $c[1] ),
		esc_html( $all[ $status ] ?? $status )
	);
}

/** Adds a line to a request's history (who did what, and when). */
function akr_request_log( $post_id, $text ) {
	$log = get_post_meta( $post_id, 'akr_log', true );
	if ( ! is_array( $log ) ) {
		$log = array();
	}
	$user  = wp_get_current_user();
	$log[] = array(
		'time' => time(),
		'who'  => ( $user && $user->exists() ) ? $user->display_name : 'Website',
		'text' => (string) $text,
	);
	update_post_meta( $post_id, 'akr_log', $log );
}

/** The private folder for customer files. Closed to the web, and file names are random. */
function akr_private_dir() {
	$dir = trailingslashit( WP_CONTENT_DIR ) . 'akr-private';
	if ( ! is_dir( $dir ) ) {
		wp_mkdir_p( $dir );
		file_put_contents( $dir . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n" );
		file_put_contents( $dir . '/index.php', "<?php\n// Silence.\n" );
	}
	return $dir;
}

/** Full path of a request's stored file, or an empty string. */
function akr_file_path( $post_id ) {
	if ( 'stored' !== get_post_meta( $post_id, 'akr_file_state', true ) ) {
		return '';
	}
	$rel = basename( (string) get_post_meta( $post_id, 'akr_file_path', true ) );
	if ( '' === $rel ) {
		return '';
	}
	$path = akr_private_dir() . '/' . $rel;
	return is_file( $path ) ? $path : '';
}

/** Deletes a request's stored file and any half-uploaded part. Returns true if something was removed. */
function akr_remove_file( $post_id ) {
	$removed = false;
	$path    = akr_file_path( $post_id );
	if ( '' !== $path && @unlink( $path ) ) {
		$removed = true;
	}
	$part = akr_private_dir() . '/' . (int) $post_id . '.part';
	if ( is_file( $part ) && @unlink( $part ) ) {
		$removed = true;
	}
	return $removed;
}

/** A token that lets the browser that sent a request upload its file, for two hours. */
function akr_upload_token( $post_id, $expires ) {
	if ( ! defined( 'AKRINITY_SHARED_SECRET' ) ) {
		return '';
	}
	return hash_hmac( 'sha256', (int) $post_id . '|' . (int) $expires, (string) AKRINITY_SHARED_SECRET );
}

const AKR_FILE_MAX_BYTES  = 314572800; // 300 MB.
const AKR_CHUNK_MAX_BYTES = 4194304; // 4 MB per piece.

/** File types a customer may upload for a quote. */
function akr_file_types() {
	return array( 'stl', '3mf', 'obj', 'step', 'stp', 'iges', 'igs', 'jpg', 'jpeg', 'png', 'pdf' );
}

// The list of requests: reference, type, status, file, contact and date at a glance.
add_filter(
	'manage_akr_request_posts_columns',
	function () {
		return array(
			'cb'         => '<input type="checkbox" />',
			'akr_ref'    => 'Reference',
			'title'      => 'Request',
			'akr_kind'   => 'Type',
			'akr_status' => 'Status',
			'akr_file'   => 'File',
			'akr_phone'  => 'Phone',
			'akr_email'  => 'Email',
			'date'       => 'Received',
		);
	}
);
add_action(
	'manage_akr_request_posts_custom_column',
	function ( $column, $post_id ) {
		if ( 'akr_ref' === $column ) {
			echo esc_html( akr_request_reference( $post_id ) );
		} elseif ( 'akr_kind' === $column ) {
			echo esc_html( akr_request_kind_label( $post_id ) );
		} elseif ( 'akr_status' === $column ) {
			echo akr_status_badge( akr_request_status( $post_id ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts.
		} elseif ( 'akr_file' === $column ) {
			$state  = (string) get_post_meta( $post_id, 'akr_file_state', true );
			$labels = array(
				'stored'    => 'Stored',
				'uploading' => 'Uploading',
				'pending'   => 'Waiting',
				'deleted'   => 'Deleted',
			);
			echo esc_html( $labels[ $state ] ?? '' );
		} elseif ( 'akr_phone' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, 'akr_phone', true ) );
		} elseif ( 'akr_email' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, 'akr_email', true ) );
		}
	},
	10,
	2
);

// Filter the list by status.
add_action(
	'restrict_manage_posts',
	function ( $post_type ) {
		if ( 'akr_request' !== $post_type ) {
			return;
		}
		$cur = isset( $_GET['akr_status'] ) ? sanitize_key( wp_unslash( $_GET['akr_status'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		echo '<select name="akr_status"><option value="">All statuses</option>';
		foreach ( akr_statuses() as $key => $label ) {
			printf( '<option value="%s"%s>%s</option>', esc_attr( $key ), selected( $cur, $key, false ), esc_html( $label ) );
		}
		echo '</select>';
	}
);
add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( ! is_admin() || ! $q->is_main_query() || 'akr_request' !== $q->get( 'post_type' ) ) {
			return;
		}
		$s = isset( $_GET['akr_status'] ) ? sanitize_key( wp_unslash( $_GET['akr_status'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( '' === $s || ! isset( akr_statuses()[ $s ] ) ) {
			return;
		}
		if ( 'new' === $s ) {
			$q->set(
				'meta_query',
				array(
					'relation' => 'OR',
					array(
						'key'     => 'akr_status',
						'value'   => 'new',
					),
					array(
						'key'     => 'akr_status',
						'compare' => 'NOT EXISTS',
					),
				)
			);
		} else {
			$q->set(
				'meta_query',
				array(
					array(
						'key'   => 'akr_status',
						'value' => $s,
					),
				)
			);
		}
	}
);

/** Saves a custom quote request (the quote page), then emails the admin and, if given, the customer. */
function akr_handle_quote_request( WP_REST_Request $req ) {
	$p   = $req->get_json_params();
	$job = ( 'design' === ( $p['job'] ?? '' ) ) ? 'Design and print' : 'Print my file';
	$f   = array(
		'name'      => sanitize_text_field( (string) ( $p['name'] ?? '' ) ),
		'phone'     => sanitize_text_field( (string) ( $p['phone'] ?? '' ) ),
		'email'     => sanitize_email( (string) ( $p['email'] ?? '' ) ),
		'material'  => sanitize_text_field( (string) ( $p['material'] ?? '' ) ),
		'quantity'  => sanitize_text_field( (string) ( $p['quantity'] ?? '' ) ),
		'company'   => sanitize_text_field( (string) ( $p['company'] ?? '' ) ),
		'gstin'     => strtoupper( sanitize_text_field( (string) ( $p['gstin'] ?? '' ) ) ),
		'notes'     => sanitize_textarea_field( (string) ( $p['notes'] ?? '' ) ),
		'file_name' => sanitize_file_name( (string) ( $p['fileName'] ?? '' ) ),
		'file_size' => sanitize_text_field( (string) ( $p['fileSize'] ?? '' ) ),
	);
	$email_given = '' !== trim( (string) ( $p['email'] ?? '' ) );
	if ( '' === $f['name'] || '' === $f['phone'] || ( $email_given && ! is_email( $f['email'] ) ) ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}
	// Only the known file types are accepted.
	$ext = strtolower( pathinfo( $f['file_name'], PATHINFO_EXTENSION ) );
	if ( '' !== $f['file_name'] && ! in_array( $ext, akr_file_types(), true ) ) {
		return new WP_REST_Response( array( 'code' => 'bad_file_type' ), 400 );
	}

	$id = wp_insert_post(
		array(
			'post_type'   => 'akr_request',
			'post_status' => 'publish',
			'post_title'  => 'Custom quote: ' . $f['name'] . ' (' . $job . ')',
		)
	);
	if ( is_wp_error( $id ) || ! $id ) {
		return new WP_REST_Response( array( 'code' => 'save_failed' ), 500 );
	}
	foreach ( $f as $key => $value ) {
		update_post_meta( $id, 'akr_' . $key, $value );
	}
	update_post_meta( $id, 'akr_job', $job );
	update_post_meta( $id, 'akr_kind', 'custom' );
	update_post_meta( $id, 'akr_status', 'new' );
	akr_request_log( $id, 'Request received from the website.' );

	$reply_data = array(
		'id'        => $id,
		'reference' => 'QR-' . $id,
	);
	if ( '' !== $f['file_name'] ) {
		update_post_meta( $id, 'akr_file_state', 'pending' );
		$expires                    = time() + 2 * HOUR_IN_SECONDS;
		$reply_data['upload_token'] = akr_upload_token( $id, $expires );
		$reply_data['upload_exp']   = $expires;
	}

	$ref   = 'QR-' . $id;
	$lines = array(
		'Reference: ' . $ref,
		'Job: ' . $job,
		'Name: ' . $f['name'],
		'Phone: ' . $f['phone'],
		'Email: ' . ( '' !== $f['email'] ? $f['email'] : 'not given' ),
		'Material: ' . ( '' !== $f['material'] ? $f['material'] : 'not given' ),
		'Quantity: ' . ( '' !== $f['quantity'] ? $f['quantity'] : 'not given' ),
		'Company: ' . ( '' !== $f['company'] ? $f['company'] : 'none' ),
		'GSTIN: ' . ( '' !== $f['gstin'] ? $f['gstin'] : 'not given' ),
		'File: ' . ( '' !== $f['file_name'] ? $f['file_name'] . ( '' !== $f['file_size'] ? ' (' . $f['file_size'] . ')' : '' ) . ' - uploading from the website, open the request to download it' : 'none chosen' ),
		'Notes: ' . ( '' !== $f['notes'] ? $f['notes'] : 'none' ),
		'Open it: ' . admin_url( 'post.php?post=' . $id . '&action=edit' ),
	);
	$summary = implode( "\r\n", $lines );
	$admin   = get_option( 'admin_email' );
	$reply   = '' !== $f['email'] ? 'Reply-To: ' . str_replace( array( "\r", "\n", '<', '>' ), '', $f['name'] ) . ' <' . $f['email'] . '>' : '';
	$email   = $f['email'];

	akr_after_response(
		function () use ( $admin, $email, $ref, $summary, $reply, $job, $f ) {
			akr_mail(
				$admin,
				'New custom quote request ' . $ref . ' (' . $job . ')',
				"Someone asked for a custom quote on the website.\r\n\r\n" . $summary . "\r\n",
				'' !== $reply ? array( $reply ) : array(),
				array(
					'tag'     => 'New quote request',
					'title'   => 'Quote',
					'hl'      => $ref,
					'head'    => 'Studio',
					'intro'   => 'Someone asked for a custom quote on the website.',
					'summary' => $summary,
					'help'    => 'Reply to this email to answer the customer. Set the status on the request as you go.',
				)
			);
			if ( '' !== $email ) {
				akr_mail(
					$email,
					'We received your quote request (' . $ref . ')',
					"Thank you. We have received your quote request and will reply with a price and lead time.\r\n\r\n" . ( '' !== $f['file_name'] ? 'If your file did not finish uploading on the website, please send it to us on WhatsApp or by replying to this email, and mention ' . $ref . ".\r\n\r\n" : '' ) . "Here is what you sent us:\r\n\r\n" . $summary . "\r\n",
					array(),
					array(
						'tag'     => 'Quote request',
						'title'   => 'We have your',
						'hl'      => 'request.',
						'head'    => $ref,
						'intro'   => 'Thank you. We will look at it and reply with a price and lead time. Pay only after you approve the quote.' . ( '' !== $f['file_name'] ? ' If your file did not finish uploading, send it to us by replying to this email and mention ' . $ref . '.' : '' ),
						'summary' => preg_replace( '/^(Open it|Email|Company|GSTIN): .*$/m', '', $summary ),
						'steps'   => array( 'We check your file and the material.', 'We email you a price and lead time.', 'You approve the quote, pay, and we print.' ),
						'help'    => 'Questions? Reply to this email and mention ' . $ref . '.',
					)
				);
			}
		}
	);

	return new WP_REST_Response( $reply_data, 201 );
}

/**
 * Receives a customer's file in pieces (about 2 MB each) straight from the browser. The token from
 * the quote request proves the upload belongs to that request. The file goes to a private folder.
 */
function akr_handle_quote_file( WP_REST_Request $req ) {
	$id      = (int) $req->get_param( 'id' );
	$exp     = (int) $req->get_param( 'exp' );
	$token   = (string) $req->get_param( 'token' );
	$index   = (int) $req->get_param( 'index' );
	$total   = (int) $req->get_param( 'total' );
	$expect  = akr_upload_token( $id, $exp );
	if ( $id < 1 || '' === $expect || time() > $exp || ! hash_equals( $expect, $token ) ) {
		return new WP_REST_Response( array( 'code' => 'forbidden' ), 403 );
	}
	if ( 'akr_request' !== get_post_type( $id ) || 'custom' !== get_post_meta( $id, 'akr_kind', true ) ) {
		return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
	}
	$state = (string) get_post_meta( $id, 'akr_file_state', true );
	if ( ! in_array( $state, array( 'pending', 'uploading' ), true ) ) {
		return new WP_REST_Response( array( 'code' => 'closed' ), 409 );
	}
	if ( $total < 1 || $total > 200 || $index < 0 || $index >= $total ) {
		return new WP_REST_Response( array( 'code' => 'bad_piece' ), 400 );
	}
	$next = (int) get_post_meta( $id, 'akr_file_next', true );
	if ( 'pending' === $state ) {
		$next = 0;
	}
	if ( $index !== $next ) {
		return new WP_REST_Response( array( 'code' => 'out_of_order', 'next' => $next ), 409 );
	}
	$body = (string) $req->get_body();
	$len  = strlen( $body );
	if ( $len < 1 || $len > AKR_CHUNK_MAX_BYTES ) {
		return new WP_REST_Response( array( 'code' => 'bad_size' ), 413 );
	}
	$name = (string) get_post_meta( $id, 'akr_file_name', true );
	$ext  = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
	if ( ! in_array( $ext, akr_file_types(), true ) ) {
		return new WP_REST_Response( array( 'code' => 'bad_file_type' ), 400 );
	}

	$dir  = akr_private_dir();
	$part = $dir . '/' . $id . '.part';
	if ( 0 === $index && is_file( $part ) ) {
		@unlink( $part );
	}
	if ( false === file_put_contents( $part, $body, FILE_APPEND | LOCK_EX ) ) {
		return new WP_REST_Response( array( 'code' => 'write_failed' ), 500 );
	}
	clearstatcache( true, $part );
	if ( filesize( $part ) > AKR_FILE_MAX_BYTES ) {
		@unlink( $part );
		update_post_meta( $id, 'akr_file_state', 'pending' );
		return new WP_REST_Response( array( 'code' => 'too_big' ), 413 );
	}
	update_post_meta( $id, 'akr_file_next', $index + 1 );
	update_post_meta( $id, 'akr_file_state', 'uploading' );

	if ( $index + 1 < $total ) {
		return new WP_REST_Response( array( 'done' => false, 'next' => $index + 1 ), 200 );
	}
	$final = bin2hex( random_bytes( 16 ) ) . '.' . $ext;
	if ( ! @rename( $part, $dir . '/' . $final ) ) {
		return new WP_REST_Response( array( 'code' => 'write_failed' ), 500 );
	}
	$bytes = (int) filesize( $dir . '/' . $final );
	update_post_meta( $id, 'akr_file_path', $final );
	update_post_meta( $id, 'akr_file_bytes', $bytes );
	update_post_meta( $id, 'akr_file_state', 'stored' );
	update_post_meta( $id, 'akr_file_stored_at', time() );
	delete_post_meta( $id, 'akr_file_next' );
	akr_request_log( $id, 'The customer uploaded the file (' . size_format( $bytes ) . ').' );
	return new WP_REST_Response( array( 'done' => true ), 200 );
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/quote-request',
			array(
				'methods'             => 'POST',
				'callback'            => 'akr_handle_quote_request',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return akr_secret_ok( $req );
				},
			)
		);
		// Called by the customer's browser, so it is protected by the upload token instead of the shared key.
		register_rest_route(
			'akrinity/v1',
			'/quote-file',
			array(
				'methods'             => 'POST',
				'callback'            => 'akr_handle_quote_file',
				'permission_callback' => '__return_true',
			)
		);
	}
);

// Boxes on the request screen: status (side), customer file, history.
add_action(
	'add_meta_boxes_akr_request',
	function () {
		add_meta_box( 'akr_request_status', 'Status', 'akr_status_box', 'akr_request', 'side', 'high' );
		add_meta_box( 'akr_request_file', 'Customer file', 'akr_file_box', 'akr_request', 'normal', 'default' );
		add_meta_box( 'akr_request_history', 'History', 'akr_history_box', 'akr_request', 'normal', 'low' );
	}
);

function akr_status_box( $post ) {
	wp_nonce_field( 'akr_status_save', 'akr_status_nonce' );
	$cur = akr_request_status( $post->ID );
	echo '<p>' . akr_status_badge( $cur ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput -- built from escaped parts.
	echo '<p><label for="akr_status"><strong>Change status</strong></label><br><select name="akr_status" id="akr_status" style="width:100%">';
	foreach ( akr_statuses() as $key => $label ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $key ), selected( $cur, $key, false ), esc_html( $label ) );
	}
	echo '</select></p>';
	echo '<p><label for="akr_status_note"><strong>Note (optional)</strong></label><br><textarea name="akr_status_note" id="akr_status_note" rows="3" style="width:100%"></textarea></p>';
	echo '<p class="description">Press Update to save. Every change is written to History.</p>';
}

add_action(
	'save_post_akr_request',
	function ( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		$nonce = isset( $_POST['akr_status_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['akr_status_nonce'] ) ) : '';
		if ( '' === $nonce || ! wp_verify_nonce( $nonce, 'akr_status_save' ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$new  = isset( $_POST['akr_status'] ) ? sanitize_key( wp_unslash( $_POST['akr_status'] ) ) : '';
		$note = isset( $_POST['akr_status_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['akr_status_note'] ) ) : '';
		$all  = akr_statuses();
		$old  = akr_request_status( $post_id );
		if ( isset( $all[ $new ] ) && $new !== $old ) {
			update_post_meta( $post_id, 'akr_status', $new );
			akr_request_log( $post_id, 'Status changed from ' . $all[ $old ] . ' to ' . $all[ $new ] . ( '' !== $note ? '. Note: ' . $note : '' ) );
		} elseif ( '' !== $note ) {
			akr_request_log( $post_id, 'Note: ' . $note );
		}
	}
);

function akr_file_box( $post ) {
	$id    = $post->ID;
	$state = (string) get_post_meta( $id, 'akr_file_state', true );
	$name  = (string) get_post_meta( $id, 'akr_file_name', true );
	if ( '' === $name && '' === $state ) {
		echo '<p>No file was added to this request.</p>';
		return;
	}
	if ( 'stored' === $state ) {
		$bytes = (int) get_post_meta( $id, 'akr_file_bytes', true );
		$when  = (int) get_post_meta( $id, 'akr_file_stored_at', true );
		printf(
			'<p><strong>%s</strong> &middot; %s%s</p>',
			esc_html( $name ),
			esc_html( size_format( $bytes ) ),
			$when ? ' &middot; uploaded ' . esc_html( wp_date( 'j M Y, g:i a', $when ) ) : ''
		);
		$dl  = wp_nonce_url( admin_url( 'admin-post.php?action=akr_file_download&request=' . $id ), 'akr_file_' . $id );
		$del = wp_nonce_url( admin_url( 'admin-post.php?action=akr_file_delete&request=' . $id ), 'akr_file_' . $id );
		printf( '<p><a class="button button-primary" href="%s">Download file</a> ', esc_url( $dl ) );
		printf(
			'<a class="button" style="color:#b32d2e;border-color:#b32d2e" href="%s" onclick="return confirm(\'Delete the customer file for this request? This cannot be undone.\');">Delete file</a></p>',
			esc_url( $del )
		);
		echo '<p class="description">Open the downloaded file in your slicer or 3D software to prepare the quote.</p>';
		if ( in_array( akr_request_status( $id ), akr_closed_statuses(), true ) ) {
			echo '<p style="padding:8px 12px;background:#fcf0c3;border-left:4px solid #dba617"><strong>This request is closed.</strong> Delete the file when you no longer need it.</p>';
		}
	} elseif ( 'uploading' === $state || 'pending' === $state ) {
		printf( '<p>The customer chose <strong>%s</strong>, but the upload has not finished.</p>', esc_html( $name ) );
		echo '<p class="description">If it never completes, ask the customer to send the file on WhatsApp or by email, quoting ' . esc_html( akr_request_reference( $id ) ) . '.</p>';
	} elseif ( 'deleted' === $state ) {
		$when = (int) get_post_meta( $id, 'akr_file_deleted_at', true );
		echo '<p>The file was deleted' . ( $when ? ' on ' . esc_html( wp_date( 'j M Y, g:i a', $when ) ) : '' ) . '.</p>';
	}
}

function akr_history_box( $post ) {
	$log = get_post_meta( $post->ID, 'akr_log', true );
	if ( ! is_array( $log ) || ! $log ) {
		echo '<p>Nothing yet.</p>';
		return;
	}
	echo '<table class="widefat striped"><thead><tr><th style="width:170px">When</th><th style="width:140px">Who</th><th>What</th></tr></thead><tbody>';
	foreach ( array_reverse( $log ) as $row ) {
		printf(
			'<tr><td>%s</td><td>%s</td><td>%s</td></tr>',
			esc_html( wp_date( 'j M Y, g:i a', (int) ( $row['time'] ?? 0 ) ) ),
			esc_html( (string) ( $row['who'] ?? '' ) ),
			nl2br( esc_html( (string) ( $row['text'] ?? '' ) ) )
		);
	}
	echo '</tbody></table>';
}

// Download and delete buttons. Both need a signed-in user who can edit the request, and a nonce.
add_action(
	'admin_post_akr_file_download',
	function () {
		$id    = isset( $_GET['request'] ) ? (int) $_GET['request'] : 0;
		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! $id || ! current_user_can( 'edit_post', $id ) || ! wp_verify_nonce( $nonce, 'akr_file_' . $id ) ) {
			wp_die( 'You are not allowed to do that.', 'Not allowed', array( 'response' => 403 ) );
		}
		$path = akr_file_path( $id );
		if ( '' === $path ) {
			wp_die( 'The file is not available.', 'Not found', array( 'response' => 404 ) );
		}
		$name = str_replace( array( '"', "\r", "\n" ), '', (string) get_post_meta( $id, 'akr_file_name', true ) );
		akr_request_log( $id, 'File downloaded.' );
		nocache_headers();
		header( 'Content-Type: application/octet-stream' );
		header( 'Content-Disposition: attachment; filename="' . $name . '"' );
		header( 'Content-Length: ' . filesize( $path ) );
		readfile( $path );
		exit;
	}
);

add_action(
	'admin_post_akr_file_delete',
	function () {
		$id    = isset( $_GET['request'] ) ? (int) $_GET['request'] : 0;
		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! $id || ! current_user_can( 'edit_post', $id ) || ! wp_verify_nonce( $nonce, 'akr_file_' . $id ) ) {
			wp_die( 'You are not allowed to do that.', 'Not allowed', array( 'response' => 403 ) );
		}
		akr_remove_file( $id );
		update_post_meta( $id, 'akr_file_state', 'deleted' );
		update_post_meta( $id, 'akr_file_deleted_at', time() );
		delete_post_meta( $id, 'akr_file_path' );
		delete_post_meta( $id, 'akr_file_next' );
		akr_request_log( $id, 'The customer file was deleted.' );
		wp_safe_redirect( (string) get_edit_post_link( $id, 'url' ) );
		exit;
	}
);

// Deleting a request for good also removes its file.
add_action(
	'before_delete_post',
	function ( $post_id ) {
		if ( 'akr_request' === get_post_type( $post_id ) ) {
			akr_remove_file( $post_id );
		}
	}
);

/** Saves a business quote request, then emails the admin and sends the customer a copy. */
function akr_handle_business_request( WP_REST_Request $req ) {
	$p = $req->get_json_params();
	$f = array(
		'company'  => sanitize_text_field( (string) ( $p['company'] ?? '' ) ),
		'gstin'    => strtoupper( sanitize_text_field( (string) ( $p['gstin'] ?? '' ) ) ),
		'name'     => sanitize_text_field( (string) ( $p['name'] ?? '' ) ),
		'phone'    => sanitize_text_field( (string) ( $p['phone'] ?? '' ) ),
		'email'    => sanitize_email( (string) ( $p['email'] ?? '' ) ),
		'need'     => sanitize_text_field( (string) ( $p['need'] ?? '' ) ),
		'quantity' => sanitize_text_field( (string) ( $p['quantity'] ?? '' ) ),
		'notes'    => sanitize_textarea_field( (string) ( $p['notes'] ?? '' ) ),
	);
	if ( '' === $f['company'] || '' === $f['name'] || '' === $f['phone'] || ! is_email( $f['email'] ) ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}

	// The product the request came from, if it is a real published product.
	$product_name = '';
	$product_url  = '';
	$slug         = sanitize_title( (string) ( $p['product'] ?? '' ) );
	if ( '' !== $slug ) {
		$post = get_page_by_path( $slug, OBJECT, 'product' );
		if ( $post && 'publish' === $post->post_status ) {
			$product_name = get_the_title( $post );
			$product_url  = akr_frontend_url() . '/product/' . $slug;
		}
	}

	$id = wp_insert_post(
		array(
			'post_type'   => 'akr_request',
			'post_status' => 'publish',
			'post_title'  => 'Bulk quote: ' . $f['company'] . ' (' . $f['name'] . ')',
		)
	);
	if ( is_wp_error( $id ) || ! $id ) {
		return new WP_REST_Response( array( 'code' => 'save_failed' ), 500 );
	}
	foreach ( $f as $key => $value ) {
		update_post_meta( $id, 'akr_' . $key, $value );
	}
	update_post_meta( $id, 'akr_product_name', $product_name );
	update_post_meta( $id, 'akr_product_url', $product_url );
	update_post_meta( $id, 'akr_kind', 'bulk' );

	$ref   = 'BQ-' . $id;
	$lines = array(
		'Reference: ' . $ref,
		'Company: ' . $f['company'],
		'GSTIN: ' . ( '' !== $f['gstin'] ? $f['gstin'] : 'not given' ),
		'Contact: ' . $f['name'],
		'Phone: ' . $f['phone'],
		'Email: ' . $f['email'],
		'What they need: ' . $f['need'],
		'Quantity: ' . ( '' !== $f['quantity'] ? $f['quantity'] : 'not given' ),
		'Product: ' . ( '' !== $product_name ? $product_name . ' (' . $product_url . ')' : 'none chosen' ),
		'Notes: ' . ( '' !== $f['notes'] ? $f['notes'] : 'none' ),
	);
	$summary = implode( "\r\n", $lines );
	$admin   = get_option( 'admin_email' );
	$reply   = 'Reply-To: ' . str_replace( array( "\r", "\n", '<', '>' ), '', $f['name'] ) . ' <' . $f['email'] . '>';
	$email   = $f['email'];

	akr_after_response(
		function () use ( $admin, $email, $ref, $summary, $reply, $product_name ) {
			akr_mail(
				$admin,
				'New bulk quote request ' . $ref . ( '' !== $product_name ? ' for ' . $product_name : '' ),
				"A business sent a bulk quote request.\r\n\r\n" . $summary . "\r\n",
				array( $reply ),
				array(
					'tag'     => 'New bulk request',
					'title'   => 'Bulk quote',
					'hl'      => $ref,
					'head'    => 'Studio',
					'intro'   => 'A business sent a bulk quote request.',
					'summary' => $summary,
					'help'    => 'Reply to this email to answer the buyer.',
				)
			);
			akr_mail(
				$email,
				'We received your bulk quote request (' . $ref . ')',
				"Thank you. We have received your bulk quote request and will reply with a quote.\r\n\r\nHere is what you sent us:\r\n\r\n" . $summary . "\r\n\r\nIf anything is wrong, just reply to this email.\r\n",
				array(),
				array(
					'tag'     => 'Bulk quote',
					'title'   => 'We have your',
					'hl'      => 'request.',
					'head'    => $ref,
					'intro'   => 'Thank you. We will reply with a quote. If anything below is wrong, just reply to this email.',
					'summary' => $summary,
					'steps'   => array( 'We check the quantity and the product.', 'We email you a quote with GST.', 'You approve it and we start.' ),
				)
			);
		}
	);

	return new WP_REST_Response(
		array(
			'id'        => $id,
			'reference' => $ref,
		),
		201
	);
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/business-request',
			array(
				'methods'             => 'POST',
				'callback'            => 'akr_handle_business_request',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return akr_secret_ok( $req );
				},
			)
		);
	}
);

/* ---------- Contact messages, newsletter sign-ups and product reviews (version 2.5.0) ---------- */

/** A short email-safe name such as "Asha K." from a full name. */
function akr_short_name( $name ) {
	$parts = preg_split( '/\s+/', trim( (string) $name ) );
	$first = (string) ( $parts[0] ?? '' );
	$last  = count( $parts ) > 1 ? (string) end( $parts ) : '';
	return '' !== $last ? $first . ' ' . mb_strtoupper( mb_substr( $last, 0, 1 ) ) . '.' : $first;
}

/** Saves a contact message under Quote requests (type Message) and emails the studio. */
function akr_handle_contact( WP_REST_Request $req ) {
	$p = $req->get_json_params();
	$f = array(
		'name'    => sanitize_text_field( (string) ( $p['name'] ?? '' ) ),
		'phone'   => sanitize_text_field( (string) ( $p['phone'] ?? '' ) ),
		'email'   => sanitize_email( (string) ( $p['email'] ?? '' ) ),
		'topic'   => sanitize_text_field( (string) ( $p['topic'] ?? '' ) ),
		'order'   => sanitize_text_field( (string) ( $p['order'] ?? '' ) ),
		'message' => sanitize_textarea_field( (string) ( $p['message'] ?? '' ) ),
	);
	$email_given = '' !== $f['email'];
	if ( '' === $f['name'] || '' === $f['phone'] || '' === $f['message'] || ( $email_given && ! is_email( $f['email'] ) ) ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}
	$id = wp_insert_post(
		array(
			'post_type'   => 'akr_request',
			'post_status' => 'publish',
			'post_title'  => 'Message: ' . $f['name'] . ( '' !== $f['topic'] ? ' (' . $f['topic'] . ')' : '' ),
		)
	);
	if ( is_wp_error( $id ) || ! $id ) {
		return new WP_REST_Response( array( 'code' => 'save_failed' ), 500 );
	}
	foreach ( $f as $key => $value ) {
		update_post_meta( $id, 'akr_' . $key, $value );
	}
	update_post_meta( $id, 'akr_kind', 'contact' );
	update_post_meta( $id, 'akr_status', 'new' );
	akr_request_log( $id, 'Message received from the website.' );

	$ref     = 'CM-' . $id;
	$summary = implode(
		"\r\n",
		array(
			'Reference: ' . $ref,
			'Name: ' . $f['name'],
			'Phone: ' . $f['phone'],
			'Email: ' . ( $email_given ? $f['email'] : 'not given' ),
			'Topic: ' . ( '' !== $f['topic'] ? $f['topic'] : 'not given' ),
			'Order number: ' . ( '' !== $f['order'] ? $f['order'] : 'none' ),
			'Message: ' . $f['message'],
			'Open it: ' . admin_url( 'post.php?post=' . $id . '&action=edit' ),
		)
	);
	$admin = get_option( 'admin_email' );
	$reply = $email_given ? 'Reply-To: ' . str_replace( array( "\r", "\n", '<', '>' ), '', $f['name'] ) . ' <' . $f['email'] . '>' : '';
	$email = $f['email'];
	akr_after_response(
		function () use ( $admin, $email, $ref, $summary, $reply, $f ) {
			akr_mail(
				$admin,
				'New website message ' . $ref . ( '' !== $f['topic'] ? ' (' . $f['topic'] . ')' : '' ),
				"Someone wrote to us on the website.\r\n\r\n" . $summary . "\r\n",
				'' !== $reply ? array( $reply ) : array(),
				array(
					'tag'     => 'New message',
					'title'   => 'Message',
					'hl'      => $ref,
					'head'    => 'Studio',
					'intro'   => 'Someone wrote to us on the website.',
					'summary' => $summary,
					'help'    => 'Reply to this email to answer them.',
				)
			);
			if ( '' !== $email ) {
				akr_mail(
					$email,
					'We got your message (' . $ref . ')',
					"Thank you for writing to Akrinity. We have your message and will reply soon.\r\n\r\nHere is what you sent us:\r\n\r\n" . $summary . "\r\n",
					array(),
					array(
						'tag'     => 'Message received',
						'title'   => 'We got your',
						'hl'      => 'message.',
						'head'    => $ref,
						'intro'   => 'Thank you for writing to Akrinity. We will reply soon. Here is what you sent us.',
						'summary' => preg_replace( '/^(Open it|Reference): .*$/m', '', $summary ),
					)
				);
			}
		}
	);
	return new WP_REST_Response( array( 'id' => $id, 'reference' => $ref ), 201 );
}

/** Keeps a newsletter address once, under Quote requests (type Newsletter). Always answers the same way. */
function akr_handle_newsletter( WP_REST_Request $req ) {
	$email = sanitize_email( (string) ( $req->get_json_params()['email'] ?? '' ) );
	if ( ! is_email( $email ) ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}
	$found = get_posts(
		array(
			'post_type'      => 'akr_request',
			'post_status'    => 'any',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array( 'key' => 'akr_kind', 'value' => 'newsletter' ),
				array( 'key' => 'akr_email', 'value' => $email ),
			),
		)
	);
	if ( empty( $found ) ) {
		$id = wp_insert_post(
			array(
				'post_type'   => 'akr_request',
				'post_status' => 'publish',
				'post_title'  => 'Newsletter: ' . $email,
			)
		);
		if ( is_wp_error( $id ) || ! $id ) {
			return new WP_REST_Response( array( 'code' => 'save_failed' ), 500 );
		}
		update_post_meta( $id, 'akr_kind', 'newsletter' );
		update_post_meta( $id, 'akr_email', $email );
		update_post_meta( $id, 'akr_status', 'completed' );
		akr_request_log( $id, 'Signed up on the website.' );
		akr_after_response(
			function () use ( $email ) {
				akr_mail(
					$email,
					'You are on the Akrinity list',
					"Thank you for signing up. We will write only when we have something worth sharing: new prints, offers and how-to guides.\r\n\r\nIf this was not you, just ignore this email.\r\n",
					array(),
					array(
						'tag'   => 'Welcome',
						'title' => 'You are on the',
						'hl'    => 'list.',
						'head'  => 'Newsletter',
						'intro' => 'Thank you for signing up. We will write only when we have something worth sharing: new prints, offers and how-to guides. If this was not you, just ignore this email.',
					)
				);
			}
		);
	}
	return new WP_REST_Response( array( 'ok' => true ), 201 );
}

/** Approved reviews of one product, newest first, with the average. Public: it only returns approved reviews. */
function akr_handle_reviews_list( WP_REST_Request $req ) {
	$product_id = (int) $req->get_param( 'product' );
	if ( $product_id < 1 || 'product' !== get_post_type( $product_id ) || 'publish' !== get_post_status( $product_id ) ) {
		return new WP_REST_Response( array( 'count' => 0, 'average' => 0, 'reviews' => array() ), 200 );
	}
	$comments = get_comments(
		array(
			'post_id' => $product_id,
			'status'  => 'approve',
			'type'    => 'review',
			'number'  => 50,
			'orderby' => 'comment_date_gmt',
			'order'   => 'DESC',
		)
	);
	$out = array();
	$sum = 0;
	foreach ( $comments as $c ) {
		$rating = (int) get_comment_meta( $c->comment_ID, 'rating', true );
		if ( $rating < 1 || $rating > 5 ) {
			continue;
		}
		$sum  += $rating;
		$out[] = array(
			'id'       => (int) $c->comment_ID,
			'name'     => akr_short_name( $c->comment_author ),
			'rating'   => $rating,
			'text'     => (string) $c->comment_content,
			'date'     => mysql2date( 'j M Y', $c->comment_date ),
			'verified' => (bool) get_comment_meta( $c->comment_ID, 'verified', true ),
		);
	}
	$n = count( $out );
	return new WP_REST_Response(
		array(
			'count'   => $n,
			'average' => $n ? round( $sum / $n, 1 ) : 0,
			'reviews' => $out,
		),
		200
	);
}

/** Saves a new review as pending, so nothing shows until it is approved in WordPress. */
function akr_handle_review_post( WP_REST_Request $req ) {
	$p          = $req->get_json_params();
	$product_id = (int) ( $p['product'] ?? 0 );
	$rating     = (int) ( $p['rating'] ?? 0 );
	$name       = sanitize_text_field( (string) ( $p['name'] ?? '' ) );
	$email      = sanitize_email( (string) ( $p['email'] ?? '' ) );
	$text       = sanitize_textarea_field( (string) ( $p['text'] ?? '' ) );
	if ( $product_id < 1 || 'product' !== get_post_type( $product_id ) || 'publish' !== get_post_status( $product_id ) ) {
		return new WP_REST_Response( array( 'code' => 'no_product' ), 404 );
	}
	if ( $rating < 1 || $rating > 5 || '' === $name || ! is_email( $email ) || strlen( $text ) < 10 ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}
	$already = get_comments(
		array(
			'post_id'      => $product_id,
			'author_email' => $email,
			'type'         => 'review',
			'status'       => 'all',
			'count'        => true,
		)
	);
	if ( (int) $already > 0 ) {
		return new WP_REST_Response( array( 'code' => 'duplicate' ), 409 );
	}
	$user     = get_user_by( 'email', $email );
	$verified = function_exists( 'wc_customer_bought_product' ) && wc_customer_bought_product( $email, $user ? $user->ID : 0, $product_id );
	$id       = wp_insert_comment(
		array(
			'comment_post_ID'      => $product_id,
			'comment_author'       => $name,
			'comment_author_email' => $email,
			'comment_content'      => $text,
			'comment_type'         => 'review',
			'comment_approved'     => 0,
			'user_id'              => $user ? $user->ID : 0,
		)
	);
	if ( ! $id ) {
		return new WP_REST_Response( array( 'code' => 'save_failed' ), 500 );
	}
	add_comment_meta( $id, 'rating', $rating );
	add_comment_meta( $id, 'verified', $verified ? 1 : 0 );
	$title = get_the_title( $product_id );
	akr_after_response(
		function () use ( $title, $name, $rating, $text, $id ) {
			akr_mail(
				get_option( 'admin_email' ),
				'New review waiting for approval: ' . $title,
				$name . ' gave ' . $rating . ' of 5 stars.' . "\r\n\r\n" . $text . "\r\n\r\nApprove or delete it: " . admin_url( 'comment.php?action=editcomment&c=' . $id ) . "\r\n",
				array(),
				array(
					'tag'     => 'New review',
					'title'   => 'Review',
					'hl'      => 'to approve.',
					'head'    => 'Studio',
					'intro'   => 'A customer posted a review. It shows on the product page once you approve it.',
					'summary' => 'Product: ' . $title . "\r\n" . 'From: ' . $name . "\r\n" . 'Rating: ' . $rating . ' of 5' . "\r\n" . 'Review: ' . preg_replace( '/\s+/', ' ', $text ) . "\r\n" . 'Open it: ' . admin_url( 'comment.php?action=editcomment&c=' . $id ),
				)
			);
		}
	);
	return new WP_REST_Response( array( 'ok' => true, 'status' => 'pending' ), 201 );
}

add_action(
	'rest_api_init',
	function () {
		$secret = function ( WP_REST_Request $req ) {
			return akr_secret_ok( $req );
		};
		register_rest_route( 'akrinity/v1', '/contact', array( 'methods' => 'POST', 'callback' => 'akr_handle_contact', 'permission_callback' => $secret ) );
		register_rest_route( 'akrinity/v1', '/newsletter', array( 'methods' => 'POST', 'callback' => 'akr_handle_newsletter', 'permission_callback' => $secret ) );
		register_rest_route( 'akrinity/v1', '/reviews', array( 'methods' => 'GET', 'callback' => 'akr_handle_reviews_list', 'permission_callback' => '__return_true' ) );
		register_rest_route( 'akrinity/v1', '/reviews', array( 'methods' => 'POST', 'callback' => 'akr_handle_review_post', 'permission_callback' => $secret ) );
	}
);
