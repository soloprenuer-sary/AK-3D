<?php
/**
 * Plugin Name: Akrinity headless account
 * Description: Customer sign-up, account details and orders, bulk prices and bulk quote requests for the headless storefront. The one approved WordPress snippet (decisions 20, 32 and 34).
 * Version: 2.3.0
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
	return 'custom' === get_post_meta( $post_id, 'akr_kind', true ) ? 'Custom quote' : 'Bulk quote';
}

function akr_request_reference( $post_id ) {
	return ( 'custom' === get_post_meta( $post_id, 'akr_kind', true ) ? 'QR-' : 'BQ-' ) . $post_id;
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
				if ( 'custom' === get_post_meta( $post->ID, 'akr_kind', true ) && '' !== (string) get_post_meta( $post->ID, 'akr_file_name', true ) ) {
					echo '<p><em>The file itself is not stored here. Ask the customer to send it on WhatsApp or by email, quoting the reference.</em></p>';
				}
			},
			'akr_request',
			'normal',
			'high'
		);
	}
);

// The list of requests: reference, type, contact, phone, email and date at a glance.
add_filter(
	'manage_akr_request_posts_columns',
	function () {
		return array(
			'cb'        => '<input type="checkbox" />',
			'akr_ref'   => 'Reference',
			'title'     => 'Request',
			'akr_kind'  => 'Type',
			'akr_phone' => 'Phone',
			'akr_email' => 'Email',
			'date'      => 'Received',
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
		} elseif ( 'akr_phone' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, 'akr_phone', true ) );
		} elseif ( 'akr_email' === $column ) {
			echo esc_html( (string) get_post_meta( $post_id, 'akr_email', true ) );
		}
	},
	10,
	2
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
		'File: ' . ( '' !== $f['file_name'] ? $f['file_name'] . ( '' !== $f['file_size'] ? ' (' . $f['file_size'] . ')' : '' ) . ' - not uploaded, ask the customer to send it' : 'none chosen' ),
		'Notes: ' . ( '' !== $f['notes'] ? $f['notes'] : 'none' ),
	);
	$summary = implode( "\r\n", $lines );
	$admin   = get_option( 'admin_email' );
	$reply   = '' !== $f['email'] ? 'Reply-To: ' . str_replace( array( "\r", "\n", '<', '>' ), '', $f['name'] ) . ' <' . $f['email'] . '>' : '';
	$email   = $f['email'];

	akr_after_response(
		function () use ( $admin, $email, $ref, $summary, $reply, $job, $f ) {
			wp_mail(
				$admin,
				'New custom quote request ' . $ref . ' (' . $job . ')',
				"Someone asked for a custom quote on the website.\r\n\r\n" . $summary . "\r\n",
				'' !== $reply ? array( $reply ) : array()
			);
			if ( '' !== $email ) {
				wp_mail(
					$email,
					'We received your quote request (' . $ref . ')',
					"Thank you. We have received your quote request and will reply with a price and lead time.\r\n\r\n" . ( '' !== $f['file_name'] ? "Please send your file (" . $f['file_name'] . ") to us on WhatsApp or by reply to this email, and mention " . $ref . ".\r\n\r\n" : '' ) . "Here is what you sent us:\r\n\r\n" . $summary . "\r\n"
				);
			}
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
			'/quote-request',
			array(
				'methods'             => 'POST',
				'callback'            => 'akr_handle_quote_request',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return akr_secret_ok( $req );
				},
			)
		);
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
			wp_mail(
				$admin,
				'New bulk quote request ' . $ref . ( '' !== $product_name ? ' for ' . $product_name : '' ),
				"A business sent a bulk quote request.\r\n\r\n" . $summary . "\r\n",
				array( $reply )
			);
			wp_mail(
				$email,
				'We received your bulk quote request (' . $ref . ')',
				"Thank you. We have received your bulk quote request and will reply with a quote.\r\n\r\nHere is what you sent us:\r\n\r\n" . $summary . "\r\n\r\nIf anything is wrong, just reply to this email.\r\n"
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
