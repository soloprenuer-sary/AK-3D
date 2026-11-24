<?php
/**
 * Plugin Name: Akrinity Cashfree webhook guard
 * Description: Cashfree sends the "payment successful" webhook several times at almost the same moment. The Cashfree plugin checks "is this order already paid" before the first call has finished, so each call went through and the customer got the order emails more than once. This lets one webhook per order run at a time; the others are answered with OK and ignored.
 * Version: 1.0.0
 *
 * No settings, nothing secret. Only the webhook ("notify") is guarded. The customer's return to the shop ("capture") is not touched.
 * The lock is a short-lived row in the options table, added with INSERT IGNORE so that two calls cannot both get it.
 * It is removed when the call ends, and a lock older than 60 seconds is treated as left over and taken over, so a crash cannot block payments.
 */

defined( 'ABSPATH' ) || exit;

/** Tries to take the lock for one order. True when this call may go on. */
function akr_cf_take_lock( string $name ): bool {
	global $wpdb;
	$now = time();
	$got = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", $name, (string) $now ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	if ( 1 === (int) $got ) {
		return true;
	}
	$old = (string) $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $name ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	if ( '' === $old ) {
		return true; // released a moment ago; let this call go on
	}
	if ( ( $now - (int) $old ) >= 60 ) {
		// Left over from a crashed call: take it over, but only one call can win.
		return 1 === (int) $wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND option_value = %s", (string) $now, $name, $old ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	}
	return false;
}

add_action(
	'api_cashfree_notify',
	function ( $post_data, $order_key ) {
		global $wpdb;
		$name = 'akr_cf_lock_' . md5( (string) $order_key );
		if ( ! akr_cf_take_lock( $name ) ) {
			header( 'X-Akrinity-Webhook: duplicate-ignored' );
			status_header( 200 );
			exit;
		}
		register_shutdown_function(
			function () use ( $wpdb, $name ) {
				$wpdb->delete( $wpdb->options, array( 'option_name' => $name ) );
			}
		);
		header( 'X-Akrinity-Webhook: processing' );
	},
	1,
	2
);
