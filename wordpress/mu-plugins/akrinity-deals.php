<?php
/**
 * Plugin Name: Akrinity offers and upsell
 * Description: Automatic cart offers set in WooCommerce under Marketing > Offers and upsell: a percentage off from a cart value, free delivery from a higher value, "buy 2 get 1 free" on chosen products or categories, and the products to suggest as upsells. Prices include GST; the offer is applied as a discount at checkout. When a customer's coupon gives more than the automatic offer, the coupon is used instead; they are never added together. Version 1.0.0.
 *
 * Public route for the storefront:  GET /wp-json/akrinity/v1/deals
 */

defined( 'ABSPATH' ) || exit;

/** The code of the automatic discount, as it appears on the order. */
const AKR_DEAL_CODE = 'akr-offer';

function akr_deals_settings(): array {
	$s = (array) get_option( 'akr_deals', array() );
	$s = array_merge(
		array(
			'cart_on'        => 1,
			'percent'        => 5,
			'percent_min'    => 999,
			'freeship_on'    => 1,
			'freeship_min'   => 1499,
			'bogo_on'        => 0,
			'bogo_buy'       => 2,
			'bogo_free'      => 1,
			'bogo_products'  => array(),
			'bogo_cats'      => array(),
			'upsell'         => array(),
		),
		$s
	);
	foreach ( array( 'bogo_products', 'bogo_cats', 'upsell' ) as $k ) {
		$s[ $k ] = array_values( array_filter( array_map( 'intval', (array) $s[ $k ] ) ) );
	}
	return $s;
}

/** Whether a product takes part in "buy N get M free": picked itself, or in a picked category (sub-categories count). */
function akr_deals_in_bogo( int $product_id, array $s ): bool {
	if ( in_array( $product_id, $s['bogo_products'], true ) ) {
		return true;
	}
	if ( ! $s['bogo_cats'] ) {
		return false;
	}
	foreach ( wc_get_product_term_ids( $product_id, 'product_cat' ) as $term ) {
		if ( in_array( (int) $term, $s['bogo_cats'], true ) || array_intersect( get_ancestors( (int) $term, 'product_cat', 'taxonomy' ), $s['bogo_cats'] ) ) {
			return true;
		}
	}
	return false;
}

/**
 * What the offers give for a cart. All amounts include GST.
 *   base     product value before offers
 *   free     value of the free items (buy N get M)
 *   percent  percentage discount, on what is left after the free items
 *   total    free + percent
 *   freeship true when what is left after the free items reaches the free delivery value
 */
function akr_deals_calculate( $cart, ?array $s = null ): array {
	$s        = $s ?? akr_deals_settings();
	$base     = 0.0;
	$eligible = array();
	foreach ( $cart->get_cart() as $item ) {
		if ( empty( $item['data'] ) ) {
			continue;
		}
		$unit = (float) wc_get_price_including_tax( $item['data'], array( 'qty' => 1 ) );
		$qty  = (int) $item['quantity'];
		$base += $unit * $qty;
		if ( $s['bogo_on'] && akr_deals_in_bogo( (int) $item['product_id'], $s ) ) {
			for ( $i = 0; $i < $qty; $i++ ) {
				$eligible[] = $unit;
			}
		}
	}
	$free  = 0.0;
	$group = (int) $s['bogo_buy'] + (int) $s['bogo_free'];
	if ( $eligible && $s['bogo_buy'] > 0 && $s['bogo_free'] > 0 ) {
		sort( $eligible ); // the cheapest items are the free ones
		$count = intdiv( count( $eligible ), $group ) * (int) $s['bogo_free'];
		$free  = array_sum( array_slice( $eligible, 0, $count ) );
	}
	$left    = max( 0.0, $base - $free );
	$percent = ( $s['cart_on'] && $s['percent'] > 0 && $left >= (float) $s['percent_min'] - 0.001 ) ? round( $left * (float) $s['percent'] / 100, 2 ) : 0.0;
	return array(
		'base'     => round( $base, 2 ),
		'free'     => round( $free, 2 ),
		'percent'  => $percent,
		'total'    => round( $free + $percent, 2 ),
		'freeship' => $s['freeship_on'] && $base > 0 && $left >= (float) $s['freeship_min'] - 0.001,
	);
}

// The automatic discount is a coupon that exists only in code; its amount follows the cart.
add_filter(
	'woocommerce_get_shop_coupon_data',
	function ( $data, $code ) {
		if ( AKR_DEAL_CODE !== strtolower( (string) $code ) ) {
			return $data;
		}
		$cart = function_exists( 'WC' ) ? WC()->cart : null;
		return array(
			'discount_type' => 'fixed_cart',
			'amount'        => $cart ? akr_deals_calculate( $cart )['total'] : 0,
		);
	},
	10,
	2
);

/** What the customer's own coupons would take off this cart. */
function akr_deals_coupon_value( $cart, string $code ): float {
	$discounts = new WC_Discounts( $cart );
	$result    = $discounts->apply_coupon( new WC_Coupon( $code ) );
	if ( is_wp_error( $result ) ) {
		return 0.0;
	}
	return (float) array_sum( $discounts->get_discounts_by_coupon() );
}

// Before the totals are worked out: keep either the automatic offer or the customer's coupon, whichever gives more.
add_action(
	'woocommerce_before_calculate_totals',
	function ( $cart ) {
		if ( ( is_admin() && ! defined( 'DOING_AJAX' ) ) || ! wc_coupons_enabled() ) {
			return;
		}
		$applied = array_map( 'strtolower', (array) $cart->get_applied_coupons() );
		$own     = array_values( array_diff( $applied, array( AKR_DEAL_CODE ) ) );
		$auto    = akr_deals_calculate( $cart )['total'];

		$valued = array(); // the customer's coupons that take money off (a free-delivery coupon takes none and stays)
		$sum    = 0.0;
		foreach ( $own as $code ) {
			$value = akr_deals_coupon_value( $cart, $code );
			if ( $value > 0 ) {
				$valued[] = $code;
				$sum     += $value;
			}
		}

		$next = $own;
		if ( $auto > 0 && $auto >= $sum ) {
			$next   = array_values( array_diff( $own, $valued ) );
			$next[] = AKR_DEAL_CODE;
		}
		if ( $next !== $applied ) {
			$cart->set_applied_coupons( $next );
		}
	},
	20
);

// A customer cannot type the automatic code themselves in a way that changes anything: its amount always follows the cart.
add_filter(
	'woocommerce_cart_totals_coupon_label',
	function ( $label, $coupon ) {
		return AKR_DEAL_CODE === strtolower( $coupon->get_code() ) ? 'Offer discount' : $label;
	},
	10,
	2
);

/* ---------- Free delivery ---------- */

// Shipping prices are cached per cart: add the offer state so a change shows at once.
add_filter(
	'woocommerce_cart_shipping_packages',
	function ( $packages ) {
		if ( function_exists( 'WC' ) && WC()->cart ) {
			$free = akr_deals_calculate( WC()->cart )['freeship'] ? 1 : 0;
			foreach ( $packages as $i => $p ) {
				$packages[ $i ]['akr_free_delivery'] = $free;
			}
		}
		return $packages;
	}
);

add_filter(
	'woocommerce_package_rates',
	function ( $rates, $package ) {
		if ( empty( $package['akr_free_delivery'] ) ) {
			return $rates;
		}
		foreach ( $rates as $rate ) {
			$rate->set_cost( 0 );
			$rate->set_taxes( array_map( '__return_zero', $rate->get_taxes() ) );
			$rate->set_label( 'Free delivery' );
		}
		return $rates;
	},
	100,
	2
);

/* ---------- For the storefront ---------- */

function akr_deals_public(): array {
	$s    = akr_deals_settings();
	$bogo = array();
	if ( $s['bogo_on'] ) {
		$ids = $s['bogo_products'];
		if ( $s['bogo_cats'] ) {
			$found = get_posts(
				array(
					'post_type'   => 'product',
					'post_status' => 'publish',
					'numberposts' => 500,
					'fields'      => 'ids',
					'tax_query'   => array( array( 'taxonomy' => 'product_cat', 'terms' => $s['bogo_cats'] ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
				)
			);
			$ids   = array_merge( $ids, $found );
		}
		$bogo = array_values( array_unique( array_map( 'intval', $ids ) ) );
	}
	return array(
		'percent'      => $s['cart_on'] ? (float) $s['percent'] : 0,
		'percent_min'  => $s['cart_on'] ? (float) $s['percent_min'] : 0,
		'freeship_min' => $s['freeship_on'] ? (float) $s['freeship_min'] : 0,
		'bogo'         => array(
			'buy'         => (int) $s['bogo_buy'],
			'free'        => (int) $s['bogo_free'],
			'product_ids' => $bogo,
		),
		'upsell_ids'   => $s['upsell'],
	);
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/deals',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => function () {
					return new WP_REST_Response( akr_deals_public(), 200 );
				},
			)
		);
	}
);

/* ---------- Admin: WooCommerce > Marketing > Offers and upsell ---------- */

add_action(
	'admin_menu',
	function () {
		global $submenu;
		$parent = isset( $submenu['woocommerce-marketing'] ) ? 'woocommerce-marketing' : 'woocommerce';
		add_submenu_page( $parent, 'Offers and upsell', 'Offers and upsell', 'manage_woocommerce', 'akrinity-deals', 'akr_deals_page' );
	},
	99
);

add_action(
	'admin_enqueue_scripts',
	function () {
		if ( 'akrinity-deals' !== ( $_GET['page'] ?? '' ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		wp_enqueue_style( 'woocommerce_admin_styles' );
		wp_enqueue_script( 'wc-enhanced-select' );
	}
);

/** A search box to pick several products. */
function akr_deals_product_field( string $name, array $ids ): void {
	echo '<select class="wc-product-search" multiple style="width:420px;max-width:100%" name="' . esc_attr( $name ) . '[]" data-placeholder="Search for products" data-action="woocommerce_json_search_products">';
	foreach ( $ids as $id ) {
		$p = wc_get_product( $id );
		if ( $p ) {
			echo '<option value="' . (int) $id . '" selected>' . esc_html( wp_strip_all_tags( $p->get_formatted_name() ) ) . '</option>';
		}
	}
	echo '</select>';
}

function akr_deals_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	if ( isset( $_POST['akr_deals_save'] ) ) {
		check_admin_referer( 'akr_deals_save' );
		$num = function ( string $k, float $max ) {
			return max( 0.0, min( $max, (float) ( $_POST[ $k ] ?? 0 ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
		};
		$ids = function ( string $k ) {
			return array_values( array_filter( array_map( 'absint', (array) ( $_POST[ $k ] ?? array() ) ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
		};
		update_option(
			'akr_deals',
			array(
				'cart_on'       => empty( $_POST['cart_on'] ) ? 0 : 1,
				'percent'       => $num( 'percent', 90 ),
				'percent_min'   => $num( 'percent_min', 1000000 ),
				'freeship_on'   => empty( $_POST['freeship_on'] ) ? 0 : 1,
				'freeship_min'  => $num( 'freeship_min', 1000000 ),
				'bogo_on'       => empty( $_POST['bogo_on'] ) ? 0 : 1,
				'bogo_buy'      => (int) max( 1, $num( 'bogo_buy', 20 ) ),
				'bogo_free'     => (int) max( 1, $num( 'bogo_free', 20 ) ),
				'bogo_products' => $ids( 'bogo_products' ),
				'bogo_cats'     => $ids( 'bogo_cats' ),
				'upsell'        => $ids( 'upsell' ),
			)
		);
		if ( class_exists( 'WC_Cache_Helper' ) ) {
			WC_Cache_Helper::get_transient_version( 'shipping', true );
		}
		echo '<div class="notice notice-success is-dismissible"><p>Offers saved. They apply to new checkouts at once; the website shows the new text within a few minutes.</p></div>';
	}
	$s     = akr_deals_settings();
	$terms = get_terms( array( 'taxonomy' => 'product_cat', 'hide_empty' => false ) );
	?>
	<div class="wrap woocommerce">
		<h1>Offers and upsell</h1>
		<p>Prices include GST. Cart values are counted on the products, before delivery. A customer's coupon is used instead of these discounts only when it gives more.</p>
		<form method="post">
			<?php wp_nonce_field( 'akr_deals_save' ); ?>
			<h2>Cart value offers</h2>
			<table class="form-table" role="presentation">
				<tr><th scope="row">Percentage off</th><td>
					<label><input type="checkbox" name="cart_on" value="1" <?php checked( $s['cart_on'] ); ?> /> On</label><br>
					Give <input type="number" class="small-text" name="percent" min="0" max="90" step="0.5" value="<?php echo esc_attr( $s['percent'] ); ?>" /> % off from &#8377; <input type="number" name="percent_min" min="0" step="1" value="<?php echo esc_attr( $s['percent_min'] ); ?>" />
				</td></tr>
				<tr><th scope="row">Free delivery</th><td>
					<label><input type="checkbox" name="freeship_on" value="1" <?php checked( $s['freeship_on'] ); ?> /> On</label><br>
					Free delivery from &#8377; <input type="number" name="freeship_min" min="0" step="1" value="<?php echo esc_attr( $s['freeship_min'] ); ?>" />
				</td></tr>
			</table>
			<h2>Buy and get free</h2>
			<table class="form-table" role="presentation">
				<tr><th scope="row">Offer</th><td>
					<label><input type="checkbox" name="bogo_on" value="1" <?php checked( $s['bogo_on'] ); ?> /> On</label><br>
					Buy <input type="number" class="small-text" name="bogo_buy" min="1" max="20" value="<?php echo esc_attr( $s['bogo_buy'] ); ?>" />, get <input type="number" class="small-text" name="bogo_free" min="1" max="20" value="<?php echo esc_attr( $s['bogo_free'] ); ?>" /> free (the cheapest ones)
				</td></tr>
				<tr><th scope="row">On these products</th><td><?php akr_deals_product_field( 'bogo_products', $s['bogo_products'] ); ?></td></tr>
				<tr><th scope="row">And on these categories</th><td>
					<select class="wc-enhanced-select" multiple style="width:420px;max-width:100%" name="bogo_cats[]" data-placeholder="Choose categories">
						<?php foreach ( is_array( $terms ) ? $terms : array() as $t ) : ?>
							<option value="<?php echo (int) $t->term_id; ?>" <?php selected( in_array( (int) $t->term_id, $s['bogo_cats'], true ) ); ?>><?php echo esc_html( $t->name ); ?></option>
						<?php endforeach; ?>
					</select>
					<p class="description">Chosen products and categories count together: any three of them make "buy 2 get 1".</p>
				</td></tr>
			</table>
			<h2>Upsell</h2>
			<table class="form-table" role="presentation">
				<tr><th scope="row">Products to suggest</th><td>
					<?php akr_deals_product_field( 'upsell', $s['upsell'] ); ?>
					<p class="description">Shown in the cart, and on product pages that have no upsells of their own. No extra discount.</p>
				</td></tr>
			</table>
			<p class="submit"><button type="submit" class="button button-primary" name="akr_deals_save" value="1">Save offers</button></p>
		</form>
	</div>
	<?php
}
