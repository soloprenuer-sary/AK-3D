<?php
/**
 * The one template WooCommerce loads for the customer's Refunded order email (see akrinity-requests.php). It hands the
 * order to the builder in that file, so the refund email has the order, the items, wording for the payment method and a
 * way back to the shop.
 */

defined( 'ABSPATH' ) || exit;

$akr_vars = get_defined_vars();
$akr_o    = isset( $akr_vars['order'] ) ? $akr_vars['order'] : null;
if ( $akr_o instanceof WC_Order && function_exists( 'akrq_order_email_html' ) ) {
	echo akrq_order_email_html( $akr_o, 'refunded', array( 'partial' => ! empty( $akr_vars['partial_refund'] ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput -- the builder escapes every value it prints
}
