<?php
/**
 * Plugin Name: Akrinity product courier
 * Description: A delivery partner and a tracking-link pattern set on each product (WooCommerce > Edit product > Shipping). When an order is marked In transit, the order uses its first item's partner and link pattern, so the tracking box and the customer's tracking link are filled in without typing. Version 1.0.0.
 */

defined( 'ABSPATH' ) || exit;

/** The partner and link pattern of an order's first product that has one. Empty strings when none. */
function akr_product_courier( WC_Order $order ): array {
	foreach ( $order->get_items() as $item ) {
		$pid = (int) $item->get_product_id();
		if ( ! $pid ) {
			continue;
		}
		$partner = (string) get_post_meta( $pid, '_akr_partner', true );
		$tpl     = (string) get_post_meta( $pid, '_akr_track_template', true );
		if ( '' !== $partner || '' !== $tpl ) {
			return array( 'partner' => $partner, 'template' => $tpl );
		}
	}
	return array( 'partner' => '', 'template' => '' );
}

add_action(
	'woocommerce_product_options_shipping',
	function () {
		$partners = function_exists( 'akr_delivery_partners' ) ? array_keys( akr_delivery_partners() ) : array();
		echo '<div class="options_group">';
		echo '<p class="form-field"><label for="_akr_partner">Delivery partner</label><select id="_akr_partner" name="_akr_partner"><option value="">Choose a partner</option>';
		foreach ( $partners as $p ) {
			printf( '<option value="%1$s"%2$s>%1$s</option>', esc_attr( $p ), selected( get_post_meta( get_the_ID(), '_akr_partner', true ), $p, false ) );
		}
		echo '</select><span class="description"> Used when this product ships.</span></p>';
		woocommerce_wp_text_input(
			array(
				'id'          => '_akr_track_template',
				'label'       => 'Tracking link pattern',
				'desc_tip'    => true,
				'description' => 'Optional. Use {id} for the tracking number, for example https://track.example.com/{id}. Leave empty to use the partner default.',
			)
		);
		echo '</div>';
	}
);

add_action(
	'woocommerce_process_product_meta',
	function ( $post_id ) {
		$partners = function_exists( 'akr_delivery_partners' ) ? array_keys( akr_delivery_partners() ) : array();
		$partner  = isset( $_POST['_akr_partner'] ) ? sanitize_text_field( wp_unslash( $_POST['_akr_partner'] ) ) : '';
		update_post_meta( $post_id, '_akr_partner', in_array( $partner, $partners, true ) ? $partner : '' );
		$tpl = isset( $_POST['_akr_track_template'] ) ? esc_url_raw( wp_unslash( $_POST['_akr_track_template'] ) ) : '';
		update_post_meta( $post_id, '_akr_track_template', ( '' !== $tpl && false !== strpos( $tpl, '{id}' ) ) ? $tpl : '' );
	}
);
