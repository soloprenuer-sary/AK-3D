<?php
/**
 * The one template WooCommerce loads for every email we restyle (see akrinity-emails.php). WooCommerce passes the
 * usual email variables ($order, $customer_note, $user_login, ...); this file hands them to the builder.
 */

defined( 'ABSPATH' ) || exit;

$akr_vars = get_defined_vars();
$akr_kind = isset( $GLOBALS['akr_email_kind'] ) ? (string) $GLOBALS['akr_email_kind'] : '';
$akr_args = array(
	'order'            => isset( $akr_vars['order'] ) ? $akr_vars['order'] : null,
	'note'             => isset( $akr_vars['customer_note'] ) ? $akr_vars['customer_note'] : '',
	'user_login'       => isset( $akr_vars['user_login'] ) ? $akr_vars['user_login'] : '',
	'set_password_url' => isset( $akr_vars['set_password_url'] ) ? $akr_vars['set_password_url'] : '',
);

if ( 'reset' === $akr_kind && isset( $akr_vars['reset_key'], $akr_vars['user_login'] ) ) {
	$akr_args['url'] = akr_em_front() . '/reset-password?key=' . rawurlencode( (string) $akr_vars['reset_key'] ) . '&login=' . rawurlencode( (string) $akr_vars['user_login'] );
}

if ( 'transit_plain' === $akr_kind ) {
	// Plain-text copy of the in-transit email.
	$akr_o = $akr_args['order'];
	if ( $akr_o instanceof WC_Order ) {
		$akr_t = function_exists( 'akr_order_tracking' ) ? akr_order_tracking( $akr_o ) : array( 'courier' => '', 'awb' => '', 'url' => '' );
		echo 'Your Akrinity order #' . esc_html( $akr_o->get_order_number() ) . " is in transit.\n\n";
		echo 'Delivery partner: ' . esc_html( $akr_t['courier'] ) . "\n";
		echo 'Tracking ID: ' . esc_html( $akr_t['awb'] ) . "\n";
		echo 'Estimated delivery: ' . esc_html( wp_date( 'D j M', akr_em_eta( $akr_o ) ) ) . "\n";
		if ( '' !== $akr_t['url'] ) {
			echo 'Track the parcel: ' . esc_url_raw( $akr_t['url'] ) . "\n";
		}
	}
	return;
}

if ( $akr_args['order'] instanceof WC_Order || in_array( $akr_kind, array( 'welcome', 'reset' ), true ) ) {
	echo akr_em_build( $akr_kind, $akr_args ); // phpcs:ignore WordPress.Security.EscapeOutput -- the builder escapes every value it prints
}
