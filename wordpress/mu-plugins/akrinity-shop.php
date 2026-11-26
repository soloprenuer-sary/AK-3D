<?php
/**
 * Plugin Name: Akrinity shop
 * Description: What the headless storefront needs from WooCommerce for checkout, orders and the 3D preview. Works with akrinity-headless-auth.php (version 2.5.0 or newer). Version 1.2.0.
 *
 * Install: copy this file to wp-content/mu-plugins/ next to the other Akrinity files. It uses the same
 * AKRINITY_FRONTEND_URL and AKRINITY_SHARED_SECRET constants. Optional constants for wp-config.php:
 *   define( 'AKRINITY_COD_FEE', 50 );      // cash on delivery fee in rupees, BEFORE GST (default 50; GST is added)
 *   define( 'AKRINITY_COD_LIMIT', 3000 );  // largest cart value (with GST) that may pay cash on delivery (default 3000)
 *   define( 'AKRINITY_PRINT_DAYS', 2 );    // working days to print and pack an order (default 2)
 *   define( 'AKRINITY_DELIVERY_DAYS', 5 ); // working days from dispatch to delivery (default 5)
 *
 * What it does:
 *  1. Bulk prices: the cart uses the bulk price for the quantity in each line (same ranges as the storefront shows).
 *  2. Item notes: the storefront sends the chosen options ("PLA+ - white - Medium - Name: Ann") with each item; they
 *     are kept on the order line so the print shop sees them. Items marked made-to-order cannot pay cash on delivery.
 *  3. Cash on delivery: hidden for made-to-order carts and for carts over the limit; adds a fee when chosen.
 *  4. After Cashfree payment the customer comes back to the storefront order page, not the WordPress thank-you page.
 *  5. POST /akrinity/v1/order-lookup (shared secret): the order page and the tracking page read an order with its order key,
 *     or with the order number plus the email or phone used.
 *  6. An "In transit" order status. Picking it on the order shows a box to choose the delivery partner and type the
 *     tracking ID (and, if wanted, the expected delivery date). Saving with a tracking ID emails the customer once
 *     (the email itself is in akrinity-emails.php).
 *  7. A "3D model" field on products (STL, GLB, GLTF, OBJ or 3MF) shown as extensions.akrinity_model in the Store API.
 */

defined( 'ABSPATH' ) || exit;

function akr_cod_fee(): float {
	return defined( 'AKRINITY_COD_FEE' ) ? max( 0.0, (float) AKRINITY_COD_FEE ) : 50.0;
}

function akr_cod_limit(): float {
	return defined( 'AKRINITY_COD_LIMIT' ) ? max( 0.0, (float) AKRINITY_COD_LIMIT ) : 3000.0;
}

/* ---------- 1. Bulk prices in the cart ---------- */

add_action(
	'woocommerce_before_calculate_totals',
	function ( $cart ) {
		if ( ( is_admin() && ! defined( 'DOING_AJAX' ) ) || ! function_exists( 'akr_bulk_tiers' ) ) {
			return;
		}
		foreach ( $cart->get_cart() as $item ) {
			$product = $item['data'] ?? null;
			if ( ! $product instanceof WC_Product ) {
				continue;
			}
			$qty = (int) $item['quantity'];
			foreach ( akr_bulk_tiers( (int) $item['product_id'] ) as $tier ) {
				if ( $qty >= $tier['from'] && ( null === $tier['to'] || $qty <= $tier['to'] ) ) {
					$product->set_price( (float) $tier['price'] );
					break;
				}
			}
		}
	},
	20
);

/* ---------- 2. Item notes from the storefront ---------- */

add_filter(
	'woocommerce_store_api_add_to_cart_data',
	function ( $data, $request ) {
		$note = trim( sanitize_text_field( (string) $request->get_param( 'akr_note' ) ) );
		if ( '' !== $note ) {
			$data['cart_item_data']['akr_note'] = mb_substr( $note, 0, 300 );
		}
		if ( '1' === (string) $request->get_param( 'akr_mto' ) ) {
			$data['cart_item_data']['akr_mto'] = 1;
		}
		return $data;
	},
	10,
	2
);

add_filter(
	'woocommerce_get_item_data',
	function ( $item_data, $cart_item ) {
		if ( ! empty( $cart_item['akr_note'] ) ) {
			$item_data[] = array(
				'key'   => 'Options',
				'value' => $cart_item['akr_note'],
			);
		}
		if ( ! empty( $cart_item['akr_mto'] ) ) {
			$item_data[] = array(
				'key'   => 'Made to order',
				'value' => 'Yes',
			);
		}
		return $item_data;
	},
	10,
	2
);

add_action(
	'woocommerce_checkout_create_order_line_item',
	function ( $item, $cart_item_key, $values ) {
		if ( ! empty( $values['akr_note'] ) ) {
			$item->add_meta_data( 'Options', $values['akr_note'] );
		}
		if ( ! empty( $values['akr_mto'] ) ) {
			$item->add_meta_data( 'Made to order', 'Yes' );
		}
	},
	10,
	3
);

/* ---------- 3. Cash on delivery ---------- */

// The storefront tells us which payment method is chosen, so the fee can be shown before the order is placed.
add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( function_exists( 'woocommerce_store_api_register_update_callback' ) ) {
			woocommerce_store_api_register_update_callback(
				array(
					'namespace' => 'akrinity',
					'callback'  => function ( $data ) {
						if ( function_exists( 'WC' ) && WC()->session ) {
							WC()->session->set( 'chosen_payment_method', sanitize_key( (string) ( $data['method'] ?? '' ) ) );
						}
					},
				)
			);
		}
	}
);

add_action(
	'woocommerce_cart_calculate_fees',
	function ( $cart ) {
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
			return;
		}
		$method = ( function_exists( 'WC' ) && WC()->session ) ? (string) WC()->session->get( 'chosen_payment_method' ) : '';
		if ( 'cod' === $method && akr_cod_fee() > 0 ) {
			$cart->add_fee( 'Cash on delivery fee', akr_cod_fee(), true );
		}
	}
);

add_filter(
	'woocommerce_available_payment_gateways',
	function ( $gateways ) {
		if ( is_admin() || ! isset( $gateways['cod'] ) || ! function_exists( 'WC' ) || ! WC()->cart ) {
			return $gateways;
		}
		$cart = WC()->cart;
		foreach ( $cart->get_cart() as $item ) {
			if ( ! empty( $item['akr_mto'] ) ) {
				unset( $gateways['cod'] );
				return $gateways;
			}
		}
		$value = (float) $cart->get_subtotal() + (float) $cart->get_subtotal_tax();
		if ( akr_cod_limit() > 0 && $value > akr_cod_limit() ) {
			unset( $gateways['cod'] );
		}
		return $gateways;
	}
);

/* ---------- 4. Back to the storefront after paying ---------- */

add_filter(
	'woocommerce_get_return_url',
	function ( $url, $order ) {
		if ( ! $order instanceof WC_Order || ! function_exists( 'akr_frontend_url' ) || '' === akr_frontend_url() ) {
			return $url;
		}
		return akr_frontend_url() . '/order-confirmation?order=' . (int) $order->get_id() . '&key=' . rawurlencode( $order->get_order_key() );
	},
	10,
	2
);

// Business buyers can add a GSTIN at checkout (extensions.akrinity.gstin); it is kept on the order for the GST invoice.
add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) || ! class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema' ) ) {
			return;
		}
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\CheckoutSchema::IDENTIFIER,
				'namespace'       => 'akrinity',
				'data_callback'   => function () {
					return array( 'gstin' => '' );
				},
				'schema_callback' => function () {
					return array(
						'gstin' => array(
							'description' => 'GSTIN of a business buyer.',
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
							'arg_options' => array(
								'validate_callback' => function ( $value ) {
									return '' === $value || (bool) preg_match( '/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/', strtoupper( (string) $value ) );
								},
							),
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);
	}
);

add_action(
	'woocommerce_store_api_checkout_update_order_from_request',
	function ( $order, $request ) {
		$ext   = $request->get_param( 'extensions' );
		$gstin = is_array( $ext ) ? strtoupper( sanitize_text_field( (string) ( $ext['akrinity']['gstin'] ?? '' ) ) ) : '';
		if ( '' !== $gstin ) {
			$order->update_meta_data( '_billing_gstin', $gstin );
			$order->add_order_note( 'Buyer GSTIN: ' . $gstin );
		}
	},
	10,
	2
);

// A signed-in customer who orders without being signed in on the checkout still gets the order in their account (same email).
add_action(
	'woocommerce_store_api_checkout_order_processed',
	function ( $order ) {
		if ( $order instanceof WC_Order && 0 === (int) $order->get_customer_id() ) {
			$user = get_user_by( 'email', (string) $order->get_billing_email() );
			if ( $user && in_array( 'customer', (array) $user->roles, true ) ) {
				$order->set_customer_id( (int) $user->ID );
				$order->save();
			}
		}
	}
);

/* ---------- 5. Order lookup for the order and tracking pages ---------- */

function akr_digits_tail( $phone ): string {
	$d = preg_replace( '/\D+/', '', (string) $phone );
	return strlen( $d ) >= 10 ? substr( $d, -10 ) : $d;
}

function akr_handle_order_lookup( WP_REST_Request $req ) {
	$p       = $req->get_json_params();
	$number  = preg_replace( '/\D+/', '', (string) ( $p['order'] ?? '' ) );
	$key     = (string) ( $p['key'] ?? '' );
	$contact = trim( (string) ( $p['contact'] ?? '' ) );
	$order   = '' !== $number ? wc_get_order( (int) $number ) : false;
	$not     = new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
	if ( ! $order instanceof WC_Order || 'shop_order_refund' === $order->get_type() ) {
		return $not;
	}
	$allowed = false;
	if ( '' !== $key && hash_equals( (string) $order->get_order_key(), $key ) ) {
		$allowed = true;
	} elseif ( '' !== $contact ) {
		$email = strtolower( (string) $order->get_billing_email() );
		$phone = akr_digits_tail( $order->get_billing_phone() );
		if ( is_email( $contact ) ) {
			$allowed = '' !== $email && strtolower( $contact ) === $email;
		} else {
			$tail    = akr_digits_tail( $contact );
			$allowed = strlen( $tail ) >= 10 && '' !== $phone && $tail === $phone;
		}
	}
	if ( ! $allowed ) {
		return $not;
	}

	$items    = array();
	$subtotal = 0.0; // item prices before any coupon, with GST
	foreach ( $order->get_items() as $item ) {
		$subtotal += (float) $item->get_subtotal() + (float) $item->get_subtotal_tax();
		$meta      = array();
		foreach ( $item->get_formatted_meta_data() as $m ) {
			$meta[] = wp_strip_all_tags( (string) $m->display_key ) . ': ' . wp_strip_all_tags( (string) $m->display_value );
		}
		$items[] = array(
			'name'     => $item->get_name(),
			'quantity' => (int) $item->get_quantity(),
			'total'    => wc_format_decimal( (float) $item->get_total() + (float) $item->get_total_tax(), 2 ),
			'meta'     => $meta,
		);
	}
	$taxes = array();
	foreach ( $order->get_tax_totals() as $t ) {
		$taxes[] = array(
			'label'  => (string) $t->label,
			'amount' => wc_format_decimal( (float) $t->amount, 2 ),
		);
	}
	$fees = array();
	foreach ( $order->get_fees() as $f ) {
		$fees[] = array(
			'name'  => $f->get_name(),
			'total' => wc_format_decimal( (float) $f->get_total() + (float) $f->get_total_tax(), 2 ),
		);
	}
	$created = $order->get_date_created();
	$paid    = $order->get_date_paid();
	return new WP_REST_Response(
		array(
			'id'             => $order->get_id(),
			'number'         => (string) $order->get_order_number(),
			'status'         => $order->get_status(),
			'status_label'   => wc_get_order_status_name( $order->get_status() ),
			'date'           => $created ? $created->date( 'c' ) : '',
			'date_paid'      => $paid ? $paid->date( 'c' ) : '',
			'is_paid'        => (bool) $order->is_paid(),
			'payment_method' => $order->get_payment_method(),
			'payment_title'  => (string) $order->get_payment_method_title(),
			'items'          => $items,
			'subtotal'       => wc_format_decimal( $subtotal, 2 ),
			'shipping_total' => wc_format_decimal( (float) $order->get_shipping_total() + (float) $order->get_shipping_tax(), 2 ),
			'discount_total' => wc_format_decimal( (float) $order->get_discount_total() + (float) $order->get_discount_tax(), 2 ),
			'fees'           => $fees,
			'taxes'          => $taxes,
			'total'          => wc_format_decimal( (float) $order->get_total(), 2 ),
			'name'           => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
			'city'           => (string) $order->get_shipping_city() ?: (string) $order->get_billing_city(),
			'state'          => (string) $order->get_shipping_state() ?: (string) $order->get_billing_state(),
			'tracking'       => akr_order_tracking( $order ),
			'email'          => (string) $order->get_billing_email(),
			'pay_url'        => $order->needs_payment() ? $order->get_checkout_payment_url() : '',
		),
		200
	);
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/order-lookup',
			array(
				'methods'             => 'POST',
				'callback'            => 'akr_handle_order_lookup',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return function_exists( 'akr_secret_ok' ) && akr_secret_ok( $req );
				},
			)
		);
	}
);

/* ---------- 6. The "In transit" status, delivery partner and tracking ---------- */

/** Working days between the order and the parcel arriving. Set the real numbers in wp-config.php. */
function akr_print_days(): int {
	return defined( 'AKRINITY_PRINT_DAYS' ) ? max( 0, (int) AKRINITY_PRINT_DAYS ) : 2;
}

function akr_delivery_days(): int {
	return defined( 'AKRINITY_DELIVERY_DAYS' ) ? max( 0, (int) AKRINITY_DELIVERY_DAYS ) : 5;
}

/** A date some working days later (Monday to Saturday count; Sunday does not). Returns a timestamp. */
function akr_add_working_days( int $from, int $days ): int {
	$ts = $from;
	while ( $days > 0 ) {
		$ts = strtotime( '+1 day', $ts );
		if ( 'Sun' !== wp_date( 'D', $ts ) ) {
			--$days;
		}
	}
	return $ts;
}

/**
 * Delivery partners shown in the list, with the address where a parcel is tracked ({id} becomes the tracking
 * number). The addresses are the partners' public tracking pages: VERIFY each one before launch, or type the
 * link by hand in the "Tracking link" box. Add or remove partners with the filter akr_delivery_partners.
 */
function akr_delivery_partners(): array {
	return apply_filters(
		'akr_delivery_partners',
		array(
			'Shiprocket'      => 'https://shiprocket.co/tracking/{id}',
			'Delhivery'       => 'https://www.delhivery.com/track/package/{id}',
			'Blue Dart'       => 'https://www.bluedart.com/tracking?trackFor=0&trackNo={id}',
			'DTDC'            => 'https://www.dtdc.in/tracking.asp',
			'Ecom Express'    => 'https://ecomexpress.in/tracking/?awb_field={id}',
			'Xpressbees'      => 'https://www.xpressbees.com/shipment/tracking',
			'Shadowfax'       => 'https://tracker.shadowfax.in/#/track/{id}',
			'Amazon Shipping' => 'https://track.amazon.in/tracking/{id}',
			'India Post'      => 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx',
			'Other'           => '',
		)
	);
}

function akr_order_tracking( WC_Order $o ): array {
	$eta = (string) $o->get_meta( '_akr_eta' );
	return array(
		'courier'    => (string) $o->get_meta( '_akr_courier' ),
		'awb'        => (string) $o->get_meta( '_akr_awb' ),
		'url'        => esc_url_raw( (string) $o->get_meta( '_akr_tracking_url' ) ),
		'eta'        => $eta,
		'shipped_at' => (int) $o->get_meta( '_akr_shipped_at' ),
	);
}

// The status itself: it sits after Processing in the order list, counts as paid, and has its own colour.
add_action(
	'init',
	function () {
		register_post_status(
			'wc-in-transit',
			array(
				'label'                     => 'In transit',
				'public'                    => true,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				/* translators: %s: number of orders */
				'label_count'               => _n_noop( 'In transit <span class="count">(%s)</span>', 'In transit <span class="count">(%s)</span>' ),
			)
		);
	}
);

add_filter(
	'wc_order_statuses',
	function ( $statuses ) {
		$out = array();
		foreach ( $statuses as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'wc-processing' === $key ) {
				$out['wc-in-transit'] = 'In transit';
			}
		}
		if ( ! isset( $out['wc-in-transit'] ) ) {
			$out['wc-in-transit'] = 'In transit';
		}
		return $out;
	}
);

foreach ( array( 'woocommerce_order_is_paid_statuses', 'woocommerce_reports_order_statuses', 'woocommerce_analytics_actionable_order_statuses' ) as $akr_hook ) {
	add_filter(
		$akr_hook,
		function ( $statuses ) {
			if ( is_array( $statuses ) && ! in_array( 'in-transit', $statuses, true ) ) {
				$statuses[] = 'in-transit';
			}
			return $statuses;
		}
	);
}

foreach ( array( 'bulk_actions-edit-shop_order', 'bulk_actions-woocommerce_page_wc-orders' ) as $akr_hook ) {
	add_filter(
		$akr_hook,
		function ( $actions ) {
			$actions['mark_in-transit'] = 'Change status to in transit';
			return $actions;
		}
	);
}

add_action(
	'admin_head',
	function () {
		echo '<style>mark.order-status.status-in-transit{background:#d8ff3a;color:#0b0b0c}.order-status.status-in-transit>span{color:#0b0b0c}#akr_order_tracking .akr-field{margin:0 0 12px}#akr_order_tracking label{font-weight:600;display:block;margin-bottom:3px}#akr_order_tracking input[type=text],#akr_order_tracking input[type=url],#akr_order_tracking input[type=date],#akr_order_tracking select{width:100%}</style>';
	}
);

// The tracking box.
add_action(
	'add_meta_boxes',
	function () {
		$screen = 'shop_order';
		if ( function_exists( 'wc_get_page_screen_id' ) && class_exists( '\Automattic\WooCommerce\Utilities\OrderUtil' ) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$screen = wc_get_page_screen_id( 'shop-order' );
		}
		add_meta_box(
			'akr_order_tracking',
			'In transit: delivery partner and tracking',
			function ( $post_or_order ) {
				$order = $post_or_order instanceof WC_Order ? $post_or_order : wc_get_order( $post_or_order->ID );
				if ( ! $order ) {
					return;
				}
				$t        = akr_order_tracking( $order );
				$partners = akr_delivery_partners();
				$picked   = (string) $order->get_meta( '_akr_partner' );
				if ( '' === $picked && function_exists( 'akr_product_courier' ) ) {
					$picked = akr_product_courier( $order )['partner'];
				}
				if ( '' === $picked && '' !== $t['courier'] ) {
					$picked = isset( $partners[ $t['courier'] ] ) ? $t['courier'] : 'Other';
				}
				wp_nonce_field( 'akr_tracking_save', 'akr_tracking_nonce' );
				echo '<p class="description" style="margin-top:0">Pick the delivery partner and type the tracking ID, then press Update. The customer gets the "in transit" email once, when the status is In transit and a tracking ID is saved.</p>';
				echo '<div class="akr-field"><label for="akr_partner">Delivery partner</label><select id="akr_partner" name="akr_partner"><option value="">Choose a partner</option>';
				foreach ( array_keys( $partners ) as $name ) {
					printf( '<option value="%1$s"%2$s>%1$s</option>', esc_attr( $name ), selected( $picked, $name, false ) );
				}
				echo '</select></div>';
				$other = ( 'Other' === $picked && ! isset( $partners[ $t['courier'] ] ) ) ? $t['courier'] : '';
				printf( '<div class="akr-field akr-other"><label for="akr_partner_other">Partner name</label><input type="text" id="akr_partner_other" name="akr_partner_other" value="%s"></div>', esc_attr( $other ) );
				printf( '<div class="akr-field"><label for="akr_awb">Tracking ID (AWB)</label><input type="text" id="akr_awb" name="akr_awb" value="%s" autocomplete="off"></div>', esc_attr( $t['awb'] ) );
				printf( '<div class="akr-field"><label for="akr_tracking_url">Tracking link (optional)</label><input type="url" id="akr_tracking_url" name="akr_tracking_url" value="%s" placeholder="Leave empty to use the partner\'s page"></div>', esc_attr( $t['url'] ) );
				printf( '<div class="akr-field"><label for="akr_eta">Expected delivery date (optional)</label><input type="date" id="akr_eta" name="akr_eta" value="%s"><span class="description">Empty = shipped date + %d working days.</span></div>', esc_attr( $t['eta'] ), akr_delivery_days() );
				$sent = (string) $order->get_meta( '_akr_transit_sent' );
				if ( '' !== $sent ) {
					echo '<p class="description">The in-transit email was sent for tracking ID <b>' . esc_html( $sent ) . '</b>. Changing the tracking ID sends it again.</p>';
				}
			},
			$screen,
			'side',
			'high'
		);
	}
);

// The box shows only while "In transit" is picked (or when tracking details already exist).
add_action(
	'admin_footer',
	function () {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || ! in_array( $screen->id, array( 'shop_order', 'woocommerce_page_wc-orders' ), true ) ) {
			return;
		}
		?>
		<script>
		jQuery(function ($) {
			var box = $('#akr_order_tracking'), status = $('#order_status'), partner = $('#akr_partner');
			if (!box.length || !status.length) { return; }
			function sync() {
				var on = status.val() === 'wc-in-transit' || $.trim($('#akr_awb').val()) !== '';
				box.toggle(on);
				$('.akr-other').toggle(partner.val() === 'Other');
			}
			status.on('change', sync);
			partner.on('change', sync);
			sync();
		});
		</script>
		<?php
	}
);

/** Saves the tracking details with the order. Runs before WooCommerce saves the new status. */
add_action(
	'woocommerce_process_shop_order_meta',
	function ( $order_id ) {
		$nonce = isset( $_POST['akr_tracking_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['akr_tracking_nonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( '' === $nonce || ! wp_verify_nonce( $nonce, 'akr_tracking_save' ) || ! current_user_can( 'edit_shop_order', $order_id ) ) {
			return;
		}
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		$partners = akr_delivery_partners();
		$partner  = sanitize_text_field( wp_unslash( $_POST['akr_partner'] ?? '' ) );
		if ( ! isset( $partners[ $partner ] ) ) {
			$partner = '';
		}
		$name = $partner;
		if ( 'Other' === $partner ) {
			$name = sanitize_text_field( wp_unslash( $_POST['akr_partner_other'] ?? '' ) );
			$name = '' !== $name ? $name : 'Other';
		}
		$awb = trim( sanitize_text_field( wp_unslash( $_POST['akr_awb'] ?? '' ) ) );
		$url = esc_url_raw( wp_unslash( $_POST['akr_tracking_url'] ?? '' ) );
		if ( '' === $url && '' !== $awb && '' !== $partner && function_exists( 'akr_product_courier' ) ) {
			$tpl = akr_product_courier( $order )['template'];
			if ( '' !== $tpl && $partner === akr_product_courier( $order )['partner'] ) {
				$url = esc_url_raw( str_replace( '{id}', rawurlencode( $awb ), $tpl ) );
			}
		}
		if ( '' === $url && '' !== $awb && '' !== $partner && ! empty( $partners[ $partner ] ) ) {
			$url = esc_url_raw( str_replace( '{id}', rawurlencode( $awb ), $partners[ $partner ] ) );
		}
		$eta = sanitize_text_field( wp_unslash( $_POST['akr_eta'] ?? '' ) );
		$eta = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $eta ) ? $eta : '';

		$order->update_meta_data( '_akr_partner', $partner );
		$order->update_meta_data( '_akr_courier', $name );
		$order->update_meta_data( '_akr_awb', $awb );
		$order->update_meta_data( '_akr_tracking_url', $url );
		$order->update_meta_data( '_akr_eta', $eta );
		$order->save();
	},
	20
);

/**
 * Sends the "in transit" email once per tracking ID, when the order is In transit and has a tracking ID.
 * Returns true when the email went out.
 */
function akr_maybe_send_in_transit( int $order_id ): bool {
	$order = wc_get_order( $order_id );
	if ( ! $order || 'in-transit' !== $order->get_status() ) {
		return false;
	}
	$awb = trim( (string) $order->get_meta( '_akr_awb' ) );
	if ( '' === $awb ) {
		set_transient( 'akr_missing_awb_' . get_current_user_id(), $order_id, 120 );
		return false;
	}
	if ( $awb === (string) $order->get_meta( '_akr_transit_sent' ) ) {
		return false;
	}
	if ( ! $order->get_meta( '_akr_shipped_at' ) ) {
		$order->update_meta_data( '_akr_shipped_at', time() );
	}
	if ( '' === (string) $order->get_meta( '_akr_eta' ) ) {
		$order->update_meta_data( '_akr_eta', wp_date( 'Y-m-d', akr_add_working_days( (int) $order->get_meta( '_akr_shipped_at' ), akr_delivery_days() ) ) );
	}
	$order->update_meta_data( '_akr_transit_sent', $awb );
	$order->save();
	do_action( 'akr_order_in_transit_notification', $order->get_id(), $order );
	$order->add_order_note(
		sprintf( 'In-transit email sent to the customer (%s, tracking ID %s).', (string) $order->get_meta( '_akr_courier' ) ?: 'delivery partner not set', $awb )
	);
	return true;
}

// From the order screen: after the status and the tracking details are both saved.
add_action(
	'woocommerce_process_shop_order_meta',
	function ( $order_id ) {
		$nonce = isset( $_POST['akr_tracking_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['akr_tracking_nonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( '' === $nonce || ! wp_verify_nonce( $nonce, 'akr_tracking_save' ) ) {
			return;
		}
		akr_maybe_send_in_transit( (int) $order_id );
	},
	60
);

// From anywhere else (a bulk change, the API): note the date, and send if a tracking ID is already there.
add_action(
	'woocommerce_order_status_in-transit',
	function ( $order_id ) {
		if ( is_admin() && isset( $_POST['akr_tracking_nonce'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return; // the order screen handles it after saving
		}
		akr_maybe_send_in_transit( (int) $order_id );
	}
);

add_action(
	'admin_notices',
	function () {
		$id = get_transient( 'akr_missing_awb_' . get_current_user_id() );
		if ( $id ) {
			delete_transient( 'akr_missing_awb_' . get_current_user_id() );
			printf( '<div class="notice notice-warning is-dismissible"><p>Order #%d is In transit but has no tracking ID, so the customer has not been emailed. Add the delivery partner and tracking ID, then press Update.</p></div>', (int) $id );
		}
	}
);

/* ---------- 7. 3D model on products ---------- */

add_filter(
	'upload_mimes',
	function ( $mimes ) {
		if ( current_user_can( 'upload_files' ) ) {
			$mimes['stl']  = 'model/stl';
			$mimes['glb']  = 'model/gltf-binary';
			$mimes['gltf'] = 'model/gltf+json';
			$mimes['obj']  = 'text/plain';
			$mimes['3mf']  = 'model/3mf';
		}
		return $mimes;
	}
);

// WordPress checks the real content of some files; these formats have no standard signature, so accept them by extension.
add_filter(
	'wp_check_filetype_and_ext',
	function ( $data, $file, $filename ) {
		$ext = strtolower( pathinfo( (string) $filename, PATHINFO_EXTENSION ) );
		if ( in_array( $ext, array( 'stl', 'glb', 'gltf', 'obj', '3mf' ), true ) && current_user_can( 'upload_files' ) ) {
			$types = array(
				'stl'  => 'model/stl',
				'glb'  => 'model/gltf-binary',
				'gltf' => 'model/gltf+json',
				'obj'  => 'text/plain',
				'3mf'  => 'model/3mf',
			);
			return array(
				'ext'             => $ext,
				'type'            => $types[ $ext ],
				'proper_filename' => false,
			);
		}
		return $data;
	},
	10,
	3
);

add_action(
	'acf/init',
	function () {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}
		acf_add_local_field_group(
			array(
				'key'      => 'group_akr_model_3d',
				'title'    => '3D model',
				'fields'   => array(
					array(
						'key'           => 'field_akr_model_3d',
						'label'         => '3D model file',
						'name'          => 'model_3d',
						'type'          => 'file',
						'instructions'  => 'Upload the product as .glb (best, keeps colours), .stl, .3mf or .obj. Keep it under 10 MB so the page stays fast. It shows in the 3D tab on the product page.',
						'return_format' => 'array',
						'library'       => 'all',
						'mime_types'    => 'glb,gltf,stl,obj,3mf',
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => 'product',
						),
					),
				),
				'position' => 'normal',
			)
		);
	}
);

function akr_product_model( int $product_id ): array {
	$file = function_exists( 'get_field' ) ? get_field( 'model_3d', $product_id ) : null;
	$url  = '';
	if ( is_array( $file ) && ! empty( $file['url'] ) ) {
		$url = (string) $file['url'];
	} elseif ( is_numeric( $file ) ) {
		$url = (string) wp_get_attachment_url( (int) $file );
	} elseif ( is_string( $file ) && '' !== $file ) {
		$url = $file;
	}
	if ( '' === $url ) {
		return array(
			'url'  => '',
			'type' => '',
		);
	}
	$ext = strtolower( pathinfo( wp_parse_url( $url, PHP_URL_PATH ) ?: '', PATHINFO_EXTENSION ) );
	return array(
		'url'  => esc_url_raw( $url ),
		'type' => in_array( $ext, array( 'stl', 'glb', 'gltf', 'obj', '3mf' ), true ) ? $ext : '',
	);
}

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
				'namespace'       => 'akrinity_model',
				'data_callback'   => function ( $product ) {
					return akr_product_model( (int) $product->get_id() );
				},
				'schema_callback' => function () {
					return array(
						'url'  => array(
							'description' => 'Address of the 3D model file, or empty.',
							'type'        => 'string',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
						'type' => array(
							'description' => 'File type: stl, glb, gltf, obj or 3mf.',
							'type'        => 'string',
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
