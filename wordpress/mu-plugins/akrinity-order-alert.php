<?php
/**
 * Plugin Name: Akrinity new order alert
 * Description: A designed email to the studio when an order is placed: items with photos and options, the total and a button to open the order. Replaces WooCommerce's plain "New order" email to the studio; if it cannot be built, WooCommerce's own email is sent instead, so no order alert is lost. Version 1.0.0.
 */

defined( 'ABSPATH' ) || exit;

/** The studio address for order alerts: WooCommerce's new-order recipient, else the site admin address. */
function akr_order_alert_to(): string {
	$opt = (array) get_option( 'woocommerce_new_order_settings', array() );
	$to  = (string) ( $opt['recipient'] ?? '' );
	return is_email( $to ) ? $to : (string) get_option( 'admin_email' );
}

/** Sends the designed alert. Returns false when it could not be built (the caller falls back to WooCommerce). */
function akr_order_alert_send( int $order_id ): bool {
	$order = wc_get_order( $order_id );
	if ( ! $order || ! function_exists( 'akr_em_shell' ) || ! function_exists( 'akr_em_order_card' ) ) {
		return false;
	}
	$to = akr_order_alert_to();
	if ( ! is_email( $to ) ) {
		return false;
	}
	$name    = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
	$who     = '' !== $name ? $name : 'a customer';
	$how     = 'cod' === $order->get_payment_method() ? 'to collect on delivery' : 'paid online';
	$intro   = 'New order #' . $order->get_order_number() . ' from ' . $who . ', ' . wp_strip_all_tags( wc_price( $order->get_total() ) ) . ' ' . $how . '. Check the items and options, then start printing.';
	$html    = akr_em_shell(
		array(
			'tag'    => 'New order',
			'title'  => 'New order ' . akr_em_hl( '#' . $order->get_order_number() ),
			'head'   => 'Studio',
			'pre'    => $intro,
			'intro'  => esc_html( $intro ),
			'blocks' => array(
				akr_em_order_card( $order ),
				akr_em_btn( 'Open the order in WordPress', admin_url( 'post.php?post=' . $order->get_id() . '&action=edit' ) ),
			),
			'help'   => 'Customer: ' . $order->get_billing_email() . ' · ' . $order->get_billing_phone(),
		)
	);
	return (bool) wp_mail( $to, '[Akrinity] New order #' . $order->get_order_number() . ' from ' . $who, $html, array( 'Content-Type: text/html; charset=UTF-8' ) );
}

/** Runs the designed alert; on any failure sends WooCommerce's own new-order email instead. */
function akr_order_alert( int $order_id ): void {
	try {
		if ( akr_order_alert_send( $order_id ) ) {
			return;
		}
	} catch ( Throwable $e ) {
		error_log( 'akrinity order alert: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions
	}
	if ( function_exists( 'WC' ) && WC()->mailer() ) {
		$mails = WC()->mailer()->get_emails();
		if ( isset( $mails['WC_Email_New_Order'] ) ) {
			$GLOBALS['akr_alert_fallback'] = true; // lets WooCommerce's email through the switch below, once
			$mails['WC_Email_New_Order']->trigger( $order_id );
			unset( $GLOBALS['akr_alert_fallback'] );
		}
	}
}

// WooCommerce's own studio email is switched off; the alert above takes its place (with that email as the fallback).
add_filter(
	'woocommerce_email_enabled_new_order',
	function ( $enabled ) {
		return ! empty( $GLOBALS['akr_alert_fallback'] ) && $enabled;
	}
);

// After the order is saved, send once the page has answered so checkout is not slowed.
add_action(
	'woocommerce_checkout_order_processed',
	function ( $order_id ) {
		$id = (int) $order_id;
		add_action(
			'shutdown',
			function () use ( $id ) {
				akr_order_alert( $id );
			}
		);
	}
);
