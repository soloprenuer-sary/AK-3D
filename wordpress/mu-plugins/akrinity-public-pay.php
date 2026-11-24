<?php
/**
 * Plugin Name: Akrinity public pay page
 * Description: WooCommerce "Coming soon" mode hides every public page of admin.akrinity.in from visitors, including the payment page a customer opens from the quote or order email. This keeps only the pay page and the order-received page open, so customers can pay while the rest of the site stays hidden. Version 1.0.0.
 *
 * Install: copy this file to wp-content/mu-plugins/. Nothing to set. Remove it to hide the pay page again.
 * The pay page needs the order key from the email link, so it cannot be opened by guessing an order number.
 */

defined( 'ABSPATH' ) || exit;

add_filter(
	'woocommerce_coming_soon_exclude',
	function ( $excluded ) {
		if ( $excluded ) {
			return $excluded;
		}
		if ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'order-pay' ) || is_wc_endpoint_url( 'order-received' ) ) ) {
			return true;
		}
		return false;
	}
);
