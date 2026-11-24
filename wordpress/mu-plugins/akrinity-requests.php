<?php
/**
 * Plugin Name: Akrinity requests and reminders
 * Description: (1) Review-request and order-delayed emails. (2) "Send quote" on a quote request, with a signed accept link for the customer. (3) One-tap cancel or return request for an order. Works with akrinity-headless-auth.php (2.6.0 or newer), akrinity-shop.php (1.1.0 or newer) and akrinity-emails.php. Version 1.2.0.
 *
 * Install: copy this file to wp-content/mu-plugins/. No settings are required. Optional constants for wp-config.php:
 *   define( 'AKRINITY_REVIEW_EMAILS', true );      // ask for a review after delivery (default true)
 *   define( 'AKRINITY_REVIEW_DAYS', 7 );           // days after an order is Completed (default 7)
 *   define( 'AKRINITY_DELAY_EMAILS', true );       // tell the customer when an order is late (default true)
 *   define( 'AKRINITY_DELAY_GRACE_DAYS', 2 );      // working days past the print time before an order counts as late (default 2)
 *   define( 'AKRINITY_QUOTE_DAYS', 7 );            // days a sent quote can be accepted (default 7)
 *   define( 'AKRINITY_RETURN_DAYS', 7 );           // days after delivery a return can be requested (default 7)
 *
 * All routes are under /wp-json/akrinity/v1/ and need the storefront's shared secret (X-Akrinity-Key):
 *   GET  /quote/view?ref=QR-12&exp=...&token=...      what the customer is asked to accept
 *   POST /quote/accept   {ref, exp, token}            the customer accepts; the request becomes "Awaiting payment"
 *   POST /order-request  {order, contact|key, type: cancel|return, reason, note}
 *
 * A cancel or return request stays on the WooCommerce order (no separate record): an order note, the flag
 * _akrq_req (type, reason, note, time, state), a "Cancel or return request" box on the order screen with the
 * Approve buttons, and a Request badge in the Orders list. For an order made from a custom quote every step is
 * also written to that quote request's History. The reference given to the customer is the order number.
 * Nothing is cancelled or refunded by itself: you approve it. The customer emails for Cancelled, Return approved,
 * Return received and Refunded are built here (one design, every way of cancelling or refunding).
 * Requests made before 25 Nov 2026 were saved as CM-numbers under Quote requests; those still work.
 */

defined( 'ABSPATH' ) || exit;

/* =====================================================================================
 * Small helpers
 * ===================================================================================== */

function akrq_front(): string {
	return function_exists( 'akr_frontend_url' ) ? akr_frontend_url() : '';
}

function akrq_flag( string $const, bool $default = true ): bool {
	return defined( $const ) ? (bool) constant( $const ) : $default;
}

function akrq_int( string $const, int $default ): int {
	return defined( $const ) ? max( 0, (int) constant( $const ) ) : $default;
}

function akrq_admin_to(): string {
	return (string) get_option( 'admin_email' );
}

function akrq_money( $n ): string {
	return '₹' . number_format( (float) $n, 2 );
}

/** An email in the Akrinity design, with an optional button. Falls back to plain text if the design file is missing. */
function akrq_mail( $to, string $subject, string $plain, array $d = array(), array $headers = array() ): bool {
	if ( ! $to ) {
		return false;
	}
	if ( function_exists( 'akr_em_shell' ) && function_exists( 'akr_em_btn' ) && function_exists( 'akr_em_c' ) ) {
		$c      = akr_em_c();
		$blocks = array();
		$rows   = '';
		foreach ( (array) ( $d['rows'] ?? array() ) as $label => $value ) {
			if ( '' === trim( (string) $value ) ) {
				continue;
			}
			$rows .= '<tr><td valign="top" style="padding:6px 12px 6px 0;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';white-space:nowrap;">' . esc_html( (string) $label ) . '</td>' .
				'<td valign="top" style="padding:6px 0;font-family:' . $c['body'] . ';font-size:14.5px;font-weight:600;color:' . $c['ink'] . ';overflow-wrap:anywhere;">' . nl2br( esc_html( (string) $value ) ) . '</td></tr>';
		}
		if ( '' !== $rows ) {
			$blocks[] = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:16px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table></td></tr></table>';
		}
		if ( ! empty( $d['steps'] ) ) {
			$blocks[] = akr_em_title( 'What happens next' ) . akr_em_steps( array_map( 'esc_html', (array) $d['steps'] ) );
		}
		if ( ! empty( $d['button'] ) ) {
			$blocks[] = akr_em_btn( (string) $d['button'][0], (string) $d['button'][1] );
		}
		$html      = akr_em_shell(
			array(
				'tag'    => (string) ( $d['tag'] ?? '' ),
				'title'  => esc_html( (string) ( $d['title'] ?? '' ) ) . ( ! empty( $d['hl'] ) ? ' ' . akr_em_hl( (string) $d['hl'] ) : '' ),
				'head'   => esc_html( (string) ( $d['head'] ?? '' ) ),
				'pre'    => (string) ( $d['intro'] ?? '' ),
				'intro'  => esc_html( (string) ( $d['intro'] ?? '' ) ),
				'blocks' => $blocks,
				'help'   => isset( $d['help'] ) ? esc_html( (string) $d['help'] ) : '',
			)
		);
		$headers[] = 'Content-Type: text/html; charset=UTF-8';
		return (bool) wp_mail( $to, $subject, $html, $headers );
	}
	return (bool) wp_mail( $to, $subject, $plain, $headers );
}

/** The storefront page for a product (for the review link). */
function akrq_product_url( WC_Order $o ): string {
	$front = akrq_front();
	foreach ( $o->get_items() as $item ) {
		$p = $item->get_product();
		if ( $p ) {
			$parent = $p->get_parent_id() ? wc_get_product( $p->get_parent_id() ) : $p;
			$slug   = $parent ? $parent->get_slug() : '';
			if ( '' !== $slug && '' !== $front ) {
				return $front . '/product/' . rawurlencode( $slug ) . '#reviews';
			}
		}
	}
	return '' !== $front ? $front . '/shop' : '';
}

/* =====================================================================================
 * 1. Review-request and order-delayed emails (twice a day)
 * ===================================================================================== */

add_action(
	'init',
	function () {
		if ( ! wp_next_scheduled( 'akrq_daily' ) ) {
			wp_schedule_event( time() + 600, 'twicedaily', 'akrq_daily' );
		}
	}
);
add_action( 'akrq_daily', 'akrq_run_order_emails' );

/** Working days (Monday to Saturday) added to a time. Uses the shop's own helper when it is there. */
function akrq_add_working_days( int $from, int $days ): int {
	if ( function_exists( 'akr_add_working_days' ) ) {
		return (int) akr_add_working_days( $from, $days );
	}
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
 * Sends the emails that are due. $now is a time (for tests), $only limits it to some order numbers,
 * and $dry only reports what it would send. Returns lines describing what happened.
 */
function akrq_run_order_emails( $now = null, array $only = array(), bool $dry = false ): array {
	$now = $now ? (int) $now : time();
	$out = array();
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return $out;
	}

	// The review request is sent by akrinity-reminders.php (with its own timer page) when that file is installed.
	if ( akrq_flag( 'AKRINITY_REVIEW_EMAILS' ) && ! function_exists( 'akr_rm_review_days' ) ) {
		$after = akrq_int( 'AKRINITY_REVIEW_DAYS', 7 ) * DAY_IN_SECONDS;
		foreach ( wc_get_orders( array( 'status' => 'completed', 'limit' => 50, 'date_completed' => ( $now - 30 * DAY_IN_SECONDS ) . '...' . ( $now - $after ), 'orderby' => 'date', 'order' => 'DESC' ) ) as $o ) {
			if ( ( $only && ! in_array( (int) $o->get_id(), $only, true ) ) || $o->get_meta( '_akrq_review_sent' ) || ! is_email( $o->get_billing_email() ) ) {
				continue;
			}
			$link = akrq_product_url( $o );
			$out[] = ( $dry ? 'would send' : 'sent' ) . ' review request for order ' . $o->get_id();
			if ( $dry ) {
				continue;
			}
			$o->update_meta_data( '_akrq_review_sent', $now );
			$o->save();
			akrq_mail(
				$o->get_billing_email(),
				'How is your Akrinity order #' . $o->get_order_number() . '?',
				"Hi " . $o->get_billing_first_name() . ",\r\n\r\nYour order should have reached you by now. We would love to hear how it turned out. Leaving a review takes a minute:\r\n" . $link . "\r\n\r\nThank you,\r\nAkrinity\r\n",
				array(
					'tag'    => 'Your review',
					'title'  => 'How did it',
					'hl'     => 'turn out?',
					'head'   => 'Order #' . $o->get_order_number(),
					'intro'  => 'Hi ' . $o->get_billing_first_name() . ', your order should be with you by now. A short review helps other people choose, and tells us what to make better.',
					'button' => array( 'Write a review', $link ),
					'help'   => 'Something is wrong with your order? Reply to this email and we will sort it out first.',
				)
			);
		}
	}

	if ( akrq_flag( 'AKRINITY_DELAY_EMAILS' ) ) {
		$limit_days = ( function_exists( 'akr_print_days' ) ? akr_print_days() : 2 ) + akrq_int( 'AKRINITY_DELAY_GRACE_DAYS', 2 );
		foreach ( wc_get_orders( array( 'status' => 'processing', 'limit' => 50, 'date_created' => ( $now - 60 * DAY_IN_SECONDS ) . '...' . $now ) ) as $o ) {
			if ( ( $only && ! in_array( (int) $o->get_id(), $only, true ) ) || $o->get_meta( '_akrq_delay_sent' ) ) {
				continue;
			}
			$created = $o->get_date_created();
			if ( ! $created || akrq_add_working_days( $created->getTimestamp(), $limit_days ) > $now ) {
				continue;
			}
			$out[] = ( $dry ? 'would send' : 'sent' ) . ' delayed notice for order ' . $o->get_id();
			if ( $dry ) {
				continue;
			}
			$o->update_meta_data( '_akrq_delay_sent', $now );
			$o->save();
			$num  = $o->get_order_number();
			$link = akrq_front() . '/order-confirmation?order=' . (int) $o->get_id() . '&key=' . rawurlencode( $o->get_order_key() );
			if ( is_email( $o->get_billing_email() ) ) {
				akrq_mail(
					$o->get_billing_email(),
					'Your Akrinity order #' . $num . ' is taking longer than planned',
					"Hi " . $o->get_billing_first_name() . ",\r\n\r\nWe are sorry: your order #" . $num . " is taking longer than we planned. It is still being made. We will email you the tracking details the moment it ships.\r\n\r\nSee your order: " . $link . "\r\n",
					array(
						'tag'    => 'Order update',
						'title'  => 'Taking a little',
						'hl'     => 'longer.',
						'head'   => 'Order #' . $num,
						'intro'  => 'Hi ' . $o->get_billing_first_name() . ', we are sorry: your order is taking longer than we planned. It is still being made, and we will email you the tracking details the moment it ships.',
						'button' => array( 'See your order', $link ),
						'help'   => 'Need it sooner, or want to change something? Reply to this email.',
					)
				);
			}
			akrq_mail(
				akrq_admin_to(),
				'[Akrinity] Order #' . $num . ' is late',
				'Order #' . $num . " has been Processing longer than planned. The customer has been told.\r\n" . admin_url( 'post.php?post=' . (int) $o->get_id() . '&action=edit' ),
				array(
					'tag'    => 'Late order',
					'title'  => 'Order is',
					'hl'     => 'late.',
					'head'   => 'Studio',
					'intro'  => 'Order #' . $num . ' has been Processing for longer than planned. The customer was sent a short apology.',
					'button' => array( 'Open the order', admin_url( 'post.php?post=' . (int) $o->get_id() . '&action=edit' ) ),
				)
			);
		}
	}
	return $out;
}

/* =====================================================================================
 * 2. Send quote, and the customer's accept link
 * ===================================================================================== */

function akrq_quote_token( int $id, int $exp, string $price ): string {
	if ( ! defined( 'AKRINITY_SHARED_SECRET' ) || strlen( (string) AKRINITY_SHARED_SECRET ) < 32 ) {
		return '';
	}
	return hash_hmac( 'sha256', 'akr-quote|' . $id . '|' . $exp . '|' . $price, (string) AKRINITY_SHARED_SECRET );
}

function akrq_quote_link( int $id ): string {
	$exp   = (int) get_post_meta( $id, 'akr_quote_exp', true );
	$price = (string) get_post_meta( $id, 'akr_quote_price', true );
	return akrq_front() . '/quote/accept?' . http_build_query( array( 'ref' => akr_request_reference( $id ), 'exp' => $exp, 'token' => akrq_quote_token( $id, $exp, $price ) ) );
}

/** Saves a quote on a request, sets it to Quoted and emails the customer. Returns an error text, or '' when sent. */
function akrq_send_quote( int $id, float $price, string $lead, string $message ): string {
	$post = get_post( $id );
	if ( ! $post || 'akr_request' !== $post->post_type ) {
		return 'Request not found.';
	}
	if ( in_array( (string) get_post_meta( $id, 'akr_kind', true ), array( 'contact', 'newsletter', 'order_request' ), true ) ) {
		return 'This kind of entry cannot be quoted.';
	}
	$email = sanitize_email( (string) get_post_meta( $id, 'akr_email', true ) );
	if ( ! is_email( $email ) ) {
		return 'This request has no valid customer email.';
	}
	if ( $price <= 0 ) {
		return 'Enter the price (with GST).';
	}
	if ( '' === akrq_front() || ! defined( 'AKRINITY_SHARED_SECRET' ) ) {
		return 'The storefront address or the shared secret is not set in wp-config.php.';
	}
	$exp      = time() + akrq_int( 'AKRINITY_QUOTE_DAYS', 7 ) * DAY_IN_SECONDS;
	$price_s  = number_format( $price, 2, '.', '' );
	update_post_meta( $id, 'akr_quote_price', $price_s );
	update_post_meta( $id, 'akr_quote_lead', $lead );
	update_post_meta( $id, 'akr_quote_msg', $message );
	update_post_meta( $id, 'akr_quote_exp', $exp );
	update_post_meta( $id, 'akr_quote_sent', time() );
	update_post_meta( $id, 'akr_status', 'quoted' );
	akr_request_log( $id, 'Quote sent: ' . akrq_money( $price ) . ( '' !== $lead ? ', ' . $lead : '' ) . '. Valid until ' . wp_date( 'j M Y', $exp ) . '.' );

	$ref  = akr_request_reference( $id );
	$link = akrq_quote_link( $id );
	$name = (string) get_post_meta( $id, 'akr_name', true );
	akrq_mail(
		$email,
		'Your Akrinity quote ' . $ref . ': ' . akrq_money( $price ),
		'Hi ' . $name . ",\r\n\r\nHere is your quote " . $ref . ': ' . akrq_money( $price ) . " including GST" . ( '' !== $lead ? ', ready in ' . $lead : '' ) . ".\r\n\r\n" . ( '' !== $message ? $message . "\r\n\r\n" : '' ) . 'Accept it here (valid until ' . wp_date( 'j M Y', $exp ) . "):\r\n" . $link . "\r\n",
		array(
			'tag'     => 'Your quote',
			'title'   => 'Your quote is',
			'hl'      => 'ready.',
			'head'    => $ref,
			'intro'   => ( '' !== $name ? 'Hi ' . $name . ', ' : '' ) . 'here is the price for your request. Check it, and press the button to accept. Nothing is charged by accepting.',
			'rows'    => array(
				'Reference'  => $ref,
				'Price'      => akrq_money( $price ) . ' including GST',
				'Ready in'   => $lead,
				'Valid until' => wp_date( 'j M Y', $exp ),
				'Note'       => $message,
			),
			'steps'   => array( 'You accept the quote.', 'We send you the payment details.', 'We print it and ship it.' ),
			'button'  => array( 'Accept this quote', $link ),
			'help'    => 'Want something changed? Reply to this email and mention ' . $ref . '.',
		)
	);
	return '';
}

/** The box on a quote request: price, lead time and note, with a Send quote button. */
add_action(
	'add_meta_boxes',
	function () {
		if ( function_exists( 'akrqt_send_quote' ) ) {
			return; // akrinity-quotes.php has the full Quote box
		}
		add_meta_box(
			'akrq_quote',
			'Send a quote',
			function ( $post ) {
				$kind = (string) get_post_meta( $post->ID, 'akr_kind', true );
				if ( in_array( $kind, array( 'contact', 'newsletter', 'order_request' ), true ) ) {
					echo '<p>Quotes can only be sent on quote requests.</p>';
					return;
				}
				$price = (string) get_post_meta( $post->ID, 'akr_quote_price', true );
				$sent  = (int) get_post_meta( $post->ID, 'akr_quote_sent', true );
				$exp   = (int) get_post_meta( $post->ID, 'akr_quote_exp', true );
				wp_nonce_field( 'akrq_send_quote', 'akrq_nonce' );
				echo '<input type="hidden" name="akrq_post_id" value="' . (int) $post->ID . '">';
				echo '<p><label><strong>Price in rupees, including GST</strong><br><input type="number" step="0.01" min="0" name="akrq_price" value="' . esc_attr( $price ) . '" style="width:100%"></label></p>';
				echo '<p><label><strong>Ready in</strong> (for example "5 working days")<br><input type="text" name="akrq_lead" value="' . esc_attr( (string) get_post_meta( $post->ID, 'akr_quote_lead', true ) ) . '" style="width:100%"></label></p>';
				echo '<p><label><strong>Note to the customer</strong> (optional)<br><textarea name="akrq_msg" rows="3" style="width:100%">' . esc_textarea( (string) get_post_meta( $post->ID, 'akr_quote_msg', true ) ) . '</textarea></label></p>';
				echo '<p><button type="submit" class="button button-primary" formmethod="post" formaction="' . esc_url( admin_url( 'admin-post.php?action=akrq_send_quote' ) ) . '">Send quote</button></p>';
				echo '<p class="description">Emails the customer the price with an Accept button. The link works for ' . (int) akrq_int( 'AKRINITY_QUOTE_DAYS', 7 ) . ' days.' . ( $sent ? ' Last sent ' . esc_html( wp_date( 'j M Y, g:i a', $sent ) ) . ( $exp ? ', valid until ' . esc_html( wp_date( 'j M Y', $exp ) ) : '' ) . '.' : '' ) . ' Saving the request does not send anything.</p>';
			},
			'akr_request',
			'side',
			'high'
		);
	}
);

add_action(
	'admin_post_akrq_send_quote',
	function () {
		$id = absint( $_POST['akrq_post_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! $id || ! current_user_can( 'edit_post', $id ) || ! isset( $_POST['akrq_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrq_nonce'] ) ), 'akrq_send_quote' ) ) {
			wp_die( 'Not allowed.', '', array( 'response' => 403 ) );
		}
		$error = akrq_send_quote(
			$id,
			(float) ( $_POST['akrq_price'] ?? 0 ),
			sanitize_text_field( wp_unslash( $_POST['akrq_lead'] ?? '' ) ),
			sanitize_textarea_field( wp_unslash( $_POST['akrq_msg'] ?? '' ) )
		);
		wp_safe_redirect( add_query_arg( array( 'post' => $id, 'action' => 'edit', 'akrq' => '' === $error ? 'sent' : rawurlencode( $error ) ), admin_url( 'post.php' ) ) );
		exit;
	}
);

add_action(
	'admin_notices',
	function () {
		if ( empty( $_GET['akrq'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$v = sanitize_text_field( wp_unslash( $_GET['akrq'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		if ( 'sent' === $v ) {
			echo '<div class="notice notice-success is-dismissible"><p>Quote sent to the customer.</p></div>';
		} elseif ( 'cancelled' === $v ) {
			echo '<div class="notice notice-success is-dismissible"><p>Order cancelled and the customer emailed.</p></div>';
		} else {
			echo '<div class="notice notice-error is-dismissible"><p>Quote not sent: ' . esc_html( $v ) . '</p></div>';
		}
	}
);

/** Checks the three values from an accept link. Returns the request id, or a WP_REST_Response error. */
function akrq_check_quote( WP_REST_Request $req ) {
	$ref   = (string) $req->get_param( 'ref' );
	$exp   = (int) $req->get_param( 'exp' );
	$token = (string) $req->get_param( 'token' );
	$id    = (int) preg_replace( '/\D+/', '', $ref );
	$post  = $id ? get_post( $id ) : null;
	if ( ! $post || 'akr_request' !== $post->post_type || akr_request_reference( $id ) !== strtoupper( $ref ) ) {
		return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
	}
	$price = (string) get_post_meta( $id, 'akr_quote_price', true );
	if ( '' === $price || '' === $token || ! hash_equals( akrq_quote_token( $id, $exp, $price ), $token ) || $exp !== (int) get_post_meta( $id, 'akr_quote_exp', true ) ) {
		return new WP_REST_Response( array( 'code' => 'bad_token' ), 403 ); // also the answer when a newer quote replaced this one
	}
	if ( $exp < time() && 'quoted' === akr_request_status( $id ) ) { // an accepted or paid quote keeps its link, so the payment page can still show its status
		return new WP_REST_Response( array( 'code' => 'expired' ), 410 );
	}
	return $id;
}

function akrq_quote_data( int $id ): array {
	return ( function_exists( 'akrqt_quote_extra' ) ? akrqt_quote_extra( $id ) : array() ) + array(
		'ref'      => akr_request_reference( $id ),
		'name'     => (string) get_post_meta( $id, 'akr_name', true ),
		'summary'  => trim( implode( ' · ', array_filter( array( (string) get_post_meta( $id, 'akr_job', true ), (string) get_post_meta( $id, 'akr_material', true ), get_post_meta( $id, 'akr_quantity', true ) ? 'Qty ' . get_post_meta( $id, 'akr_quantity', true ) : '' ) ) ) ),
		'price'    => (string) get_post_meta( $id, 'akr_quote_price', true ),
		'lead'     => (string) get_post_meta( $id, 'akr_quote_lead', true ),
		'message'  => (string) get_post_meta( $id, 'akr_quote_msg', true ),
		'expires'  => (int) get_post_meta( $id, 'akr_quote_exp', true ),
		'status'   => akr_request_status( $id ),
		'accepted' => in_array( akr_request_status( $id ), array( 'awaiting_payment', 'paid', 'in_production', 'ready', 'shipped', 'completed' ), true ),
	);
}

add_action(
	'rest_api_init',
	function () {
		$perm = function ( WP_REST_Request $req ) {
			return function_exists( 'akr_secret_ok' ) && akr_secret_ok( $req );
		};
		register_rest_route(
			'akrinity/v1',
			'/quote/view',
			array(
				'methods'             => 'GET',
				'permission_callback' => $perm,
				'callback'            => function ( WP_REST_Request $req ) {
					$id = akrq_check_quote( $req );
					return $id instanceof WP_REST_Response ? $id : new WP_REST_Response( akrq_quote_data( $id ), 200 );
				},
			)
		);
		register_rest_route(
			'akrinity/v1',
			'/quote/accept',
			array(
				'methods'             => 'POST',
				'permission_callback' => $perm,
				'callback'            => function ( WP_REST_Request $req ) {
					$p = $req->get_json_params();
					foreach ( array( 'ref', 'exp', 'token' ) as $k ) {
						if ( isset( $p[ $k ] ) ) {
							$req->set_param( $k, $p[ $k ] );
						}
					}
					$id = akrq_check_quote( $req );
					if ( $id instanceof WP_REST_Response ) {
						return $id;
					}
					$status = akr_request_status( $id );
					if ( 'quoted' === $status && function_exists( 'akrqt_approve' ) ) {
						akrqt_approve( $id, is_array( $p['address'] ?? null ) ? $p['address'] : array() );
					} elseif ( 'quoted' === $status ) {
						update_post_meta( $id, 'akr_status', 'awaiting_payment' );
						update_post_meta( $id, 'akr_quote_accepted', time() );
						akr_request_log( $id, 'The customer accepted the quote (' . akrq_money( get_post_meta( $id, 'akr_quote_price', true ) ) . ').' );
						$ref   = akr_request_reference( $id );
						$email = sanitize_email( (string) get_post_meta( $id, 'akr_email', true ) );
						$price = akrq_money( get_post_meta( $id, 'akr_quote_price', true ) );
						akrq_mail(
							akrq_admin_to(),
							'[Akrinity] Quote ' . $ref . ' accepted: ' . $price,
							$ref . ' was accepted by the customer. Send them the payment details.',
							array(
								'tag'    => 'Quote accepted',
								'title'  => 'Quote',
								'hl'     => 'accepted.',
								'head'   => 'Studio',
								'intro'  => 'The customer accepted quote ' . $ref . '. The request is now Awaiting payment. Send them the payment details.',
								'rows'   => array( 'Reference' => $ref, 'Price' => $price . ' including GST', 'Customer' => (string) get_post_meta( $id, 'akr_name', true ), 'Phone' => (string) get_post_meta( $id, 'akr_phone', true ), 'Email' => $email ),
								'button' => array( 'Open the request', admin_url( 'post.php?post=' . $id . '&action=edit' ) ),
							)
						);
						if ( is_email( $email ) ) {
							akrq_mail(
								$email,
								'Thank you: quote ' . $ref . ' accepted',
								'Thank you for accepting quote ' . $ref . ". We will send you the payment details shortly.\r\n",
								array(
									'tag'   => 'Quote accepted',
									'title' => 'Thank you,',
									'hl'    => 'accepted.',
									'head'  => $ref,
									'intro' => 'You accepted quote ' . $ref . ' for ' . $price . '. Nothing has been charged. We will send you the payment details shortly.',
									'steps' => array( 'We email you the payment details.', 'You pay, and we start printing.', 'We ship it and send you the tracking.' ),
									'help'  => 'Questions? Reply to this email and mention ' . $ref . '.',
								)
							);
						}
					}
					return new WP_REST_Response( array( 'ok' => true, 'quote' => akrq_quote_data( $id ) ), 200 );
				},
			)
		);
		register_rest_route(
			'akrinity/v1',
			'/order-request',
			array(
				'methods'             => 'POST',
				'permission_callback' => $perm,
				'callback'            => 'akrq_handle_order_request',
			)
		);
	}
);

/* =====================================================================================
 * 3. Cancel or return request for an order
 * ===================================================================================== */

function akrq_reasons(): array {
	return array(
		'faulty'      => 'It arrived faulty or damaged',
		'wrong_item'  => 'Wrong item received',
		'not_as_described' => 'Not as described',
		'changed_mind' => 'I changed my mind',
		'ordered_by_mistake' => 'Ordered by mistake',
		'other'       => 'Other reason',
	);
}

/** The order the customer proves they own: with the order key, or the email or phone used. */
function akrq_find_order( string $number, string $key, string $contact ) {
	$id    = (int) preg_replace( '/\D+/', '', $number );
	$order = $id ? wc_get_order( $id ) : false;
	if ( ! $order instanceof WC_Order || 'shop_order_refund' === $order->get_type() ) {
		return false;
	}
	if ( '' !== $key && hash_equals( (string) $order->get_order_key(), $key ) ) {
		return $order;
	}
	if ( '' !== $contact ) {
		if ( is_email( $contact ) ) {
			return strtolower( (string) $order->get_billing_email() ) === strtolower( $contact ) ? $order : false;
		}
		$d    = preg_replace( '/\D+/', '', $contact );
		$tail = strlen( $d ) >= 10 ? substr( $d, -10 ) : $d;
		$have = preg_replace( '/\D+/', '', (string) $order->get_billing_phone() );
		$have = strlen( $have ) >= 10 ? substr( $have, -10 ) : $have;
		return ( strlen( $tail ) >= 10 && '' !== $have && $tail === $have ) ? $order : false;
	}
	return false;
}

/** Whether this order may be cancelled or returned now. Returns '' when it may, else a short code. */
function akrq_order_rule( WC_Order $o, string $type, string $reason, ?int $now = null ): string {
	$now    = $now ?: time();
	$status = $o->get_status();
	if ( 'cancel' === $type ) {
		return in_array( $status, array( 'pending', 'on-hold', 'processing' ), true ) ? '' : 'not_cancellable';
	}
	if ( ! in_array( $status, array( 'in-transit', 'completed' ), true ) ) {
		return 'not_delivered_yet';
	}
	$from = $o->get_date_completed();
	if ( ! $from ) {
		$shipped = (int) $o->get_meta( '_akr_shipped_at' );
		$from    = $shipped ? akrq_add_working_days( $shipped, function_exists( 'akr_delivery_days' ) ? akr_delivery_days() : 5 ) : ( $o->get_date_modified() ? $o->get_date_modified()->getTimestamp() : $now );
	} else {
		$from = $from->getTimestamp();
	}
	if ( $now > $from + akrq_int( 'AKRINITY_RETURN_DAYS', 7 ) * DAY_IN_SECONDS ) {
		return 'return_window_closed';
	}
	foreach ( $o->get_items() as $item ) {
		if ( 'Yes' === (string) $item->get_meta( 'Made to order' ) && 'faulty' !== $reason ) {
			return 'made_to_order'; // made-to-order and personalised items are returned only when faulty
		}
	}
	return '';
}

/* ---- The request lives on the WooCommerce order (no separate record) ---- */

/** The cancel or return request kept on an order: type, reason, note, at, state (requested, approved, received, closed). */
function akrq_req( WC_Order $o ): array {
	$r = $o->get_meta( '_akrq_req' );
	return ( is_array( $r ) && ! empty( $r['type'] ) ) ? $r : array();
}

function akrq_req_label( array $r ): string {
	if ( ! $r ) {
		return '';
	}
	$cancel = 'cancel' === ( $r['type'] ?? '' );
	switch ( $r['state'] ?? 'requested' ) {
		case 'requested':
			return $cancel ? 'Cancel requested' : 'Return requested';
		case 'approved':
			return $cancel ? 'Cancel approved' : 'Return approved';
		case 'received':
			return 'Return received';
	}
	return $cancel ? 'Cancel request closed' : 'Return request closed';
}

/** True while a request is still open (asked, approved or received but not closed). */
function akrq_req_open( array $r ): bool {
	return $r && in_array( $r['state'] ?? 'requested', array( 'requested', 'approved', 'received' ), true );
}

/** One line on the order notes and, for an order made from a custom quote, on that quote request's History. */
function akrq_trace( WC_Order $o, string $text ): void {
	$o->add_order_note( $text );
	$rid = (int) $o->get_meta( '_akrqt_request' );
	if ( $rid && 'akr_request' === get_post_type( $rid ) && function_exists( 'akr_request_log' ) ) {
		akr_request_log( $rid, 'Order #' . $o->get_order_number() . ': ' . $text );
	}
}

/** The order object from what an admin screen hands over (an order on the new screen, a post on the old one). */
function akrq_order_of( $obj ): ?WC_Order {
	if ( $obj instanceof WC_Order ) {
		return $obj;
	}
	if ( $obj instanceof WP_Post && 'shop_order' === $obj->post_type ) {
		$o = wc_get_order( $obj->ID );
		return $o instanceof WC_Order ? $o : null;
	}
	return null;
}

function akrq_handle_order_request( WP_REST_Request $req ) {
	$p       = $req->get_json_params();
	$type    = sanitize_key( (string) ( $p['type'] ?? '' ) );
	$reason  = sanitize_key( (string) ( $p['reason'] ?? '' ) );
	$note    = mb_substr( sanitize_textarea_field( (string) ( $p['note'] ?? '' ) ), 0, 1000 );
	if ( ! in_array( $type, array( 'cancel', 'return' ), true ) || ! isset( akrq_reasons()[ $reason ] ) ) {
		return new WP_REST_Response( array( 'code' => 'invalid' ), 400 );
	}
	// A small cap on how many requests can arrive per hour, as a backstop to the storefront's own limits.
	$cap_key = 'akrq_cap_' . gmdate( 'YmdH' );
	$count   = (int) get_transient( $cap_key );
	if ( $count >= 60 ) {
		return new WP_REST_Response( array( 'code' => 'busy' ), 429 );
	}
	set_transient( $cap_key, $count + 1, HOUR_IN_SECONDS );

	$order = akrq_find_order( (string) ( $p['order'] ?? '' ), (string) ( $p['key'] ?? '' ), trim( (string) ( $p['contact'] ?? '' ) ) );
	if ( ! $order ) {
		return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
	}
	$num = $order->get_order_number();
	// Requests made before 25 Nov 2026 were saved as their own entry (CM-number): those still count.
	$legacy = (int) $order->get_meta( '_akrq_request_' . $type );
	if ( $legacy && get_post( $legacy ) && ! in_array( akr_request_status( $legacy ), array( 'cancelled', 'refunded', 'returned', 'completed' ), true ) ) {
		return new WP_REST_Response( array( 'code' => 'already_requested', 'reference' => akr_request_reference( $legacy ) ), 409 );
	}
	if ( akrq_req_open( akrq_req( $order ) ) ) {
		return new WP_REST_Response( array( 'code' => 'already_requested', 'reference' => '#' . $num ), 409 );
	}
	$rule = akrq_order_rule( $order, $type, $reason );
	if ( '' !== $rule ) {
		return new WP_REST_Response( array( 'code' => $rule ), 409 );
	}

	$topic = 'cancel' === $type ? 'Cancel request' : 'Return request';
	$name  = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
	$order->update_meta_data( '_akrq_req', array( 'type' => $type, 'reason' => $reason, 'note' => $note, 'at' => time(), 'state' => 'requested' ) );
	$order->save();
	akrq_trace( $order, $topic . ' from the customer: ' . akrq_reasons()[ $reason ] . ( '' !== $note ? ' - ' . $note : '' ) );

	$ref = '#' . $num;
	$sum = array( 'Order' => $ref, 'Order status' => wc_get_order_status_name( $order->get_status() ), 'Customer' => $name, 'Phone' => (string) $order->get_billing_phone(), 'Email' => (string) $order->get_billing_email(), 'Reason' => akrq_reasons()[ $reason ], 'Note' => $note, 'Total' => akrq_money( $order->get_total() ) . ' (' . $order->get_payment_method_title() . ')' );
	akr_after_response(
		function () use ( $order, $topic, $num, $ref, $sum, $type ) {
			akrq_mail(
				akrq_admin_to(),
				'[Akrinity] ' . $topic . ' for order ' . $ref,
				$topic . ' for order #' . $num . "\r\n\r\n" . wp_strip_all_tags( implode( "\r\n", array_map( function ( $k, $v ) { return $k . ': ' . $v; }, array_keys( $sum ), $sum ) ) ),
				array(
					'tag'    => $topic,
					'title'  => 'Order #' . $num,
					'hl'     => 'cancel' === $type ? 'cancel.' : 'return.',
					'head'   => 'Studio',
					'intro'  => 'A customer asked to ' . ( 'cancel' === $type ? 'cancel' : 'return' ) . ' this order. Nothing has changed yet. Open the order and press Approve, or reply to the customer.',
					'rows'   => $sum,
					'button' => array( 'Open the order', $order->get_edit_order_url() ),
				),
				is_email( $order->get_billing_email() ) ? array( 'Reply-To: ' . $order->get_billing_email() ) : array()
			);
			if ( is_email( $order->get_billing_email() ) ) {
				akrq_mail(
					$order->get_billing_email(),
					'We got your ' . strtolower( $topic ) . ' for order #' . $num,
					'We received your ' . strtolower( $topic ) . ' for order #' . $num . ". We will reply by email soon.\r\n",
					array(
						'tag'   => $topic,
						'title' => 'We got your',
						'hl'    => 'request.',
						'head'  => 'Order #' . $num,
						'intro' => 'We received your ' . strtolower( $topic ) . ' for order #' . $num . '. We will look at it and reply by email soon. Nothing is cancelled or refunded until we confirm.',
						'rows'  => array( 'Order' => $ref, 'Reason' => $sum['Reason'], 'Note' => $sum['Note'] ),
						'steps' => 'cancel' === $type ? array( 'We check the order has not been printed yet.', 'We confirm the cancellation by email.', 'Any payment is refunded to you.' ) : array( 'We look at your request and the reason.', 'We email you how to send the item back.', 'Once it is checked, we refund you.' ),
						'help'  => 'Reply to this email and mention order #' . $num . ' if you need to add something.',
						'button' => array( 'Continue shopping', akrq_front() . '/shop' ),
					)
				);
			}
		}
	);
	return new WP_REST_Response( array( 'ok' => true, 'reference' => $ref, 'order' => (string) $num ), 200 );
}

// The order page asks what is happening to an order: add the open request to that answer.
add_filter(
	'rest_request_after_callbacks',
	function ( $result, $handler, $request ) {
		if ( ! $result instanceof WP_REST_Response || 200 !== $result->get_status() || '/akrinity/v1/order-lookup' !== $request->get_route() ) {
			return $result;
		}
		$data = $result->get_data();
		if ( ! is_array( $data ) || empty( $data['id'] ) ) {
			return $result;
		}
		$o = wc_get_order( (int) $data['id'] );
		$r = $o instanceof WC_Order ? akrq_req( $o ) : array();
		$data['request'] = $r ? array( 'type' => (string) $r['type'], 'state' => (string) ( $r['state'] ?? 'requested' ), 'label' => akrq_req_label( $r ), 'open' => akrq_req_open( $r ) && ! ( 'cancel' === $r['type'] && 'approved' === ( $r['state'] ?? '' ) ), 'at' => gmdate( 'c', (int) ( $r['at'] ?? time() ) ) ) : null;
		$result->set_data( $data );
		return $result;
	},
	10,
	3
);

/* ---- The studio side: a box on the order, a badge in the Orders list ---- */

add_action(
	'add_meta_boxes',
	function ( $type = '', $obj = null ) {
		$o = akrq_order_of( $obj );
		if ( ! $o || ! akrq_req( $o ) ) {
			return;
		}
		$screen = function_exists( 'wc_get_page_screen_id' ) ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';
		add_meta_box( 'akrq_req', 'Cancel or return request', 'akrq_req_box', $screen, 'side', 'high' );
	},
	10,
	2
);

function akrq_req_box( $obj ): void {
	$o = akrq_order_of( $obj );
	$r = $o ? akrq_req( $o ) : array();
	if ( ! $o || ! $r ) {
		return;
	}
	$cancel = 'cancel' === $r['type'];
	$state  = (string) ( $r['state'] ?? 'requested' );
	echo '<p><span style="display:inline-block;padding:3px 12px;border-radius:999px;background:' . ( 'requested' === $state ? '#d63638' : '#787c82' ) . ';color:#fff;font-weight:600;">' . esc_html( akrq_req_label( $r ) ) . '</span></p>';
	echo '<p><b>Reason:</b> ' . esc_html( akrq_reasons()[ $r['reason'] ] ?? (string) $r['reason'] ) . ( '' !== (string) $r['note'] ? '<br><b>Note:</b> ' . nl2br( esc_html( (string) $r['note'] ) ) : '' ) . '<br><b>Asked:</b> ' . esc_html( wp_date( 'j M Y, g:i a', (int) $r['at'] ) ) . '</p>';
	if ( ! akrq_req_open( $r ) ) {
		return;
	}
	wp_nonce_field( 'akrq_req', 'akrq_req_nonce' );
	if ( $cancel && 'requested' === $state ) {
		if ( in_array( $o->get_status(), array( 'pending', 'on-hold', 'processing' ), true ) ) {
			echo '<p><button type="submit" class="button button-primary" name="akrq_order_do" value="approve_cancel">Approve: cancel the order</button></p>';
			echo '<p class="description">Cancels the order, puts the stock back and emails the customer. A payment made online is refunded from the Refund button on this order.</p>';
		} else {
			echo '<p class="description">The order is now ' . esc_html( wc_get_order_status_name( $o->get_status() ) ) . ', so it cannot be cancelled here. Close the request.</p>';
		}
	} elseif ( ! $cancel && 'requested' === $state ) {
		echo '<p><label for="akrq_return_note"><b>How to send it back</b> (goes in the email)</label><textarea id="akrq_return_note" name="akrq_return_note" rows="3" style="width:100%;" placeholder="Return address, how to pack it, which courier"></textarea></p>';
		echo '<p><button type="submit" class="button button-primary" name="akrq_order_do" value="approve_return">Approve the return</button></p>';
		echo '<p class="description">Emails the customer that the return is approved. Refund from the Refund button on this order once you have checked the item.</p>';
	} elseif ( ! $cancel && 'approved' === $state ) {
		echo '<p><button type="submit" class="button button-primary" name="akrq_order_do" value="return_received">Return received</button></p>';
		echo '<p class="description">Tells the customer the parcel is back with you. Then refund from the Refund button on this order.</p>';
	}
	echo '<p><button type="submit" class="button" name="akrq_order_do" value="close_request" onclick="return confirm(\'Close this request without doing anything?\');">Close without action</button></p>';
}

// The buttons submit the order form itself, so this runs while the order is saved.
add_action(
	'woocommerce_process_shop_order_meta',
	function ( $order_id, $maybe_order = null ) {
		if ( ! isset( $_POST['akrq_order_do'], $_POST['akrq_req_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrq_req_nonce'] ) ), 'akrq_req' ) || ! current_user_can( 'edit_shop_orders' ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$do = sanitize_key( wp_unslash( $_POST['akrq_order_do'] ) );
		$o  = $maybe_order instanceof WC_Order ? $maybe_order : wc_get_order( (int) $order_id );
		$r  = $o instanceof WC_Order ? akrq_req( $o ) : array();
		if ( ! $r || ! akrq_req_open( $r ) ) {
			return;
		}
		$state = (string) ( $r['state'] ?? 'requested' );
		$text  = '';
		$ok    = true;
		if ( 'approve_cancel' === $do && 'cancel' === $r['type'] && 'requested' === $state ) {
			if ( in_array( $o->get_status(), array( 'pending', 'on-hold', 'processing' ), true ) ) {
				$r['state'] = 'approved';
				$o->update_meta_data( '_akrq_req', $r );
				$o->save();
				akrq_trace( $o, 'Cancellation approved.' );
				$o->update_status( 'cancelled', 'Cancelled at the customer\'s request.' ); // the cancelled hook sends the customer's email
				$text = 'Order cancelled and the customer emailed.';
			} else {
				$ok   = false;
				$text = 'The order is ' . wc_get_order_status_name( $o->get_status() ) . ' and cannot be cancelled.';
			}
		} elseif ( 'approve_return' === $do && 'return' === $r['type'] && 'requested' === $state ) {
			$how        = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['akrq_return_note'] ?? '' ) ), 0, 1000 ); // phpcs:ignore WordPress.Security.NonceVerification
			$r['state'] = 'approved';
			$r['how']   = $how;
			$o->update_meta_data( '_akrq_req', $r );
			$o->save();
			akrq_trace( $o, 'Return approved.' . ( '' !== $how ? ' Customer told: ' . $how : '' ) );
			akrq_send_order_email( $o, 'return_approved', array( 'how' => $how ) );
			$text = 'Return approved and the customer emailed.';
		} elseif ( 'return_received' === $do && 'return' === $r['type'] && 'approved' === $state ) {
			$r['state'] = 'received';
			$o->update_meta_data( '_akrq_req', $r );
			$o->save();
			akrq_trace( $o, 'Return received back at the studio.' );
			$rid = (int) $o->get_meta( '_akrqt_request' );
			if ( $rid && 'akr_request' === get_post_type( $rid ) && function_exists( 'akrqt_set_status' ) && 'returned' !== akr_request_status( $rid ) ) {
				akrqt_set_status( $rid, 'returned', array( 'source' => 'return received on the order' ) ); // the quote workflow sends its own Return received email
			} else {
				akrq_send_order_email( $o, 'return_back' );
			}
			$text = 'Marked as received and the customer emailed.';
		} elseif ( 'close_request' === $do ) {
			$r['state'] = 'closed';
			$o->update_meta_data( '_akrq_req', $r );
			$o->save();
			akrq_trace( $o, 'The ' . $r['type'] . ' request was closed without action.' );
			$text = 'Request closed.';
		} else {
			return;
		}
		set_transient( 'akrqt_notice_' . get_current_user_id(), array( 'ok' => $ok, 'text' => $text ), 120 );
	},
	60,
	2
);

// A badge in the Orders list (new order screen and old one).
add_filter(
	'manage_woocommerce_page_wc-orders_columns',
	'akrq_list_column',
	20
);
add_filter( 'manage_edit-shop_order_columns', 'akrq_list_column', 20 );
function akrq_list_column( $cols ) {
	$out = array();
	foreach ( (array) $cols as $k => $v ) {
		$out[ $k ] = $v;
		if ( 'order_status' === $k ) {
			$out['akrq_req'] = 'Request';
		}
	}
	if ( ! isset( $out['akrq_req'] ) ) {
		$out['akrq_req'] = 'Request';
	}
	return $out;
}
function akrq_list_cell( $column, $order = null ): void {
	if ( 'akrq_req' !== $column ) {
		return;
	}
	if ( ! $order instanceof WC_Order ) {
		$order = wc_get_order( (int) $order );
	}
	$r = $order instanceof WC_Order ? akrq_req( $order ) : array();
	if ( ! $r ) {
		echo '<span aria-hidden="true">&ndash;</span>';
		return;
	}
	echo '<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:' . ( 'requested' === ( $r['state'] ?? 'requested' ) ? '#d63638' : '#787c82' ) . ';color:#fff;font-size:12px;font-weight:600;white-space:nowrap;">' . esc_html( akrq_req_label( $r ) ) . '</span>';
}
add_action( 'manage_woocommerce_page_wc-orders_custom_column', 'akrq_list_cell', 10, 2 );
add_action( 'manage_shop_order_posts_custom_column', 'akrq_list_cell', 10, 2 );

/* ---- The customer emails for a cancelled, returned or refunded order (one place, every way in) ---- */

/** The button back to the shop and the line under it, shared by every one of these emails. */
function akrq_back_blocks(): array {
	if ( ! function_exists( 'akr_em_btn' ) ) {
		return array();
	}
	$front = akrq_front();
	if ( '' === $front ) {
		return array();
	}
	$c = akr_em_c();
	$a = 'style="color:' . $c['ink'] . ';text-decoration:underline;font-weight:600;"';
	return array(
		akr_em_btn( 'Continue shopping', $front . '/shop' ),
		'<div style="font-family:' . $c['body'] . ';font-size:14px;line-height:1.55;color:' . $c['ink'] . ';">Looking for something else? Browse <a href="' . esc_url( $front . '/shop' ) . '" ' . $a . '>ready-made prints</a> or <a href="' . esc_url( $front . '/quote' ) . '" ' . $a . '>request a custom quote</a>.</div>',
	);
}

/** Whether money for this order reached us online (cash on delivery is paid at the door, so a cancel has nothing to refund). */
function akrq_paid_online( WC_Order $o ): bool {
	return 'cod' !== $o->get_payment_method() && ( null !== $o->get_date_paid() || '' !== (string) $o->get_transaction_id() || $o->get_total_refunded() > 0 );
}

/** What happens to the money, in words, for this order and payment method. */
function akrq_money_words( WC_Order $o, string $kind, float $amount = 0.0 ): string {
	$cod   = 'cod' === $o->get_payment_method();
	$total = akrq_money( $amount > 0 ? $amount : $o->get_total() );
	$via   = (string) $o->get_payment_method_title();
	switch ( $kind ) {
		case 'cancelled':
			if ( $cod ) {
				return 'You chose cash on delivery, so nothing was charged and there is nothing to refund.';
			}
			return akrq_paid_online( $o )
				? 'We refund ' . $total . ' to your original payment method' . ( '' !== $via ? ' (' . $via . ')' : '' ) . '. You get another email when it is issued; it reaches you in 5 to 7 working days, depending on your bank.'
				: 'You had not paid for this order, so nothing was charged.';
		case 'return_approved':
		case 'return_back':
			return $cod
				? 'You paid cash on delivery, so once we have checked the item we will contact you to arrange the refund by UPI or bank transfer. Please do not send card or bank details by email.'
				: 'Once we have checked the item we refund ' . $total . ' to your original payment method' . ( '' !== $via ? ' (' . $via . ')' : '' ) . '. You get another email when it is issued.';
		case 'refunded':
			return $cod
				? 'You paid cash on delivery, so we send this by the UPI or bank transfer we agreed with you.'
				: 'It goes back to your original payment method' . ( '' !== $via ? ' (' . $via . ')' : '' ) . ' and reaches you in 5 to 7 working days, depending on your bank.';
	}
	return '';
}

/** The HTML for one of these emails. $kind: cancelled, return_approved, return_back, refunded. */
function akrq_order_email_html( WC_Order $o, string $kind, array $a = array() ): string {
	if ( ! function_exists( 'akr_em_shell' ) ) {
		return '';
	}
	$c      = akr_em_c();
	$no     = esc_html( $o->get_order_number() );
	$first  = function_exists( 'akr_em_first_name' ) ? akr_em_first_name( $o ) : 'there';
	$front  = akrq_front();
	$items  = array();
	foreach ( $o->get_items() as $it ) {
		$items[] = $it->get_name() . ' × ' . (int) $it->get_quantity();
	}
	$rows   = akr_em_row( 'Order', '<b>#' . $no . '</b>' ) . akr_em_row( 'Items', nl2br( esc_html( implode( "\n", $items ) ) ) );
	$card   = function ( string $inner ) {
		return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $inner . '</table></td></tr></table>';
	};
	$say    = function ( string $text ) use ( $c ) {
		return '<div style="font-family:' . $c['body'] . ';font-size:14.5px;line-height:1.6;color:' . $c['ink'] . ';">' . esc_html( $text ) . '</div>';
	};
	$blocks = array();
	switch ( $kind ) {
		case 'cancelled':
			$tag   = 'Order cancelled';
			$title = 'Order ' . akr_em_hl( '#' . $o->get_order_number() ) . ' is off.';
			$pre   = 'Order #' . $o->get_order_number() . ' is cancelled.';
			$intro = esc_html( $first ) . ', your order #' . $no . ' is cancelled and nothing more will be printed.';
			$reason = akrq_req( $o );
			$rows  .= akr_em_row( 'Status', 'Cancelled' ) . akr_em_row( 'Total', esc_html( akrq_money( $o->get_total() ) ) . ( akrq_paid_online( $o ) ? ' (paid online)' : '' ) );
			if ( $reason && 'cancel' === $reason['type'] && isset( akrq_reasons()[ $reason['reason'] ] ) ) {
				$rows .= akr_em_row( 'Your reason', esc_html( akrq_reasons()[ $reason['reason'] ] ) );
			}
			$blocks[] = $card( $rows );
			$blocks[] = $say( akrq_money_words( $o, 'cancelled' ) );
			$blocks[] = akr_em_order_card( $o );
			break;
		case 'return_approved':
			$tag   = 'Return approved';
			$title = 'Return ' . akr_em_hl( 'approved.' );
			$pre   = 'We approved your return for order #' . $o->get_order_number() . '.';
			$intro = esc_html( $first ) . ', we approved your return for order #' . $no . '. Here is what to do now.';
			$how   = trim( (string) ( $a['how'] ?? '' ) );
			$blocks[] = $card( $rows . akr_em_row( 'Status', 'Return approved' ) );
			$blocks[] = akr_em_title( 'How to send it back' ) . $say( '' !== $how ? $how : 'Reply to this email and we will send you the return address and how to pack it.' );
			$blocks[] = $say( akrq_money_words( $o, 'return_approved' ) );
			$blocks[] = akr_em_order_card( $o );
			break;
		case 'return_back':
			$tag   = 'Return received';
			$title = 'Return ' . akr_em_hl( 'received.' );
			$pre   = 'Your parcel for order #' . $o->get_order_number() . ' is back with us.';
			$intro = esc_html( $first ) . ', your parcel for order #' . $no . ' is back with us. We are checking it now.';
			$blocks[] = $card( $rows . akr_em_row( 'Status', 'Return received' ) );
			$blocks[] = $say( akrq_money_words( $o, 'return_back' ) );
			$blocks[] = akr_em_order_card( $o );
			break;
		case 'refunded':
			$amount   = (float) $o->get_total_refunded();
			$partial  = ! empty( $a['partial'] );
			$tag      = 'Refund';
			$title    = 'Refund on its ' . akr_em_hl( 'way.' );
			$pre      = akr_em_money( $amount ) . ' is on its way back to you.';
			$intro    = esc_html( $first ) . ', we refunded ' . esc_html( akr_em_money( $amount ) ) . ( $partial ? ' (part of your payment)' : '' ) . ' for order #' . $no . '.';
			$blocks[] = $card( $rows . akr_em_row( 'Refund amount', esc_html( akr_em_money( $amount ) ), true ) . akr_em_row( 'Refunded to', esc_html( $o->get_payment_method_title() ?: 'Original payment method' ) ) );
			$blocks[] = $say( akrq_money_words( $o, 'refunded', $amount ) );
			$blocks[] = akr_em_order_card( $o );
			break;
		default:
			return '';
	}
	$blocks = array_merge( $blocks, akrq_back_blocks() );
	return akr_em_shell(
		array(
			'tag'    => $tag,
			'title'  => $title,
			'pre'    => $pre,
			'intro'  => $intro,
			'head'   => 'Order #' . $no,
			'blocks' => $blocks,
			'help'   => 'Questions? Reply to this email and mention order #' . $no . '.',
		)
	);
}

/** Sends one of these emails to the customer of an order and notes it on the order. */
function akrq_send_order_email( WC_Order $o, string $kind, array $a = array() ): bool {
	$to = (string) $o->get_billing_email();
	if ( ! is_email( $to ) ) {
		return false;
	}
	$html = akrq_order_email_html( $o, $kind, $a );
	if ( '' === $html ) {
		return false;
	}
	$no       = $o->get_order_number();
	$subjects = array(
		'cancelled'       => 'Your Akrinity order #' . $no . ' is cancelled',
		'return_approved' => 'Return approved for your Akrinity order #' . $no,
		'return_back'     => 'We received your return for order #' . $no,
		'refunded'        => 'Your Akrinity refund for order #' . $no,
	);
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	if ( is_email( akrq_admin_to() ) ) {
		$headers[] = 'Reply-To: ' . akrq_admin_to();
	}
	$sent = (bool) wp_mail( $to, $subjects[ $kind ] ?? 'About your order #' . $no, $html, $headers );
	$o->add_order_note( ( $sent ? 'Customer emailed: ' : 'Email to the customer could not be sent: ' ) . ( $subjects[ $kind ] ?? $kind ) );
	return $sent;
}

// An order set to Cancelled, by the Approve button or by hand in WooCommerce: the customer gets the same designed email.
add_action(
	'woocommerce_order_status_cancelled',
	function ( $order_id, $order = null ) {
		$o = $order instanceof WC_Order ? $order : wc_get_order( $order_id );
		if ( ! $o instanceof WC_Order || ! empty( $GLOBALS['akrq_skip_cancel'] ) || doing_action( 'woocommerce_cancel_unpaid_orders' ) ) {
			return; // the quote workflow cancelling its own order, or WooCommerce dropping an unpaid checkout after the stock hold
		}
		$rid = (int) $o->get_meta( '_akrqt_request' );
		if ( $rid && 'akr_request' === get_post_type( $rid ) ) {
			// An order from a custom quote: the quote workflow owns the emails. Bring the request in line (it sends its own Cancelled email).
			if ( function_exists( 'akrqt_set_status' ) && 'cancelled' !== akr_request_status( $rid ) && (int) get_post_meta( $rid, 'akrqt_order_id', true ) === (int) $o->get_id() ) {
				akrqt_set_status( $rid, 'cancelled', array( 'source' => 'order cancelled in WooCommerce' ) );
			}
			return;
		}
		if ( '' !== (string) $o->get_meta( '_akrq_cancel_mailed' ) || ! apply_filters( 'akrq_send_cancel_email', true, $o ) ) {
			return;
		}
		$o->update_meta_data( '_akrq_cancel_mailed', time() );
		$o->save_meta_data();
		akrq_send_order_email( $o, 'cancelled' );
	},
	20,
	2
);

// The refund email WooCommerce sends is replaced by the same design (order, items, money wording, way back to the shop).
add_filter(
	'wc_get_template',
	function ( $located, $name ) {
		if ( 'emails/customer-refunded-order.php' === $name && function_exists( 'akr_em_shell' ) ) {
			return __DIR__ . '/akrinity-requests/refund-stub.php';
		}
		return $located;
	},
	30,
	2
);

// For an order from a custom quote a full refund is handled by the quote workflow (its Refunded email), so WooCommerce's own is held back.
add_filter(
	'woocommerce_email_enabled_customer_refunded_order',
	function ( $enabled, $order = null, $email = null ) {
		if ( $order instanceof WC_Order && $order->get_meta( '_akrqt_request' ) && ! ( $email && ! empty( $email->partial_refund ) ) ) {
			return false;
		}
		return $enabled;
	},
	20,
	3
);
add_action(
	'woocommerce_order_status_refunded',
	function ( $order_id, $order = null ) {
		$o   = $order instanceof WC_Order ? $order : wc_get_order( $order_id );
		$rid = $o instanceof WC_Order ? (int) $o->get_meta( '_akrqt_request' ) : 0;
		if ( $rid && 'akr_request' === get_post_type( $rid ) && function_exists( 'akrqt_set_status' ) && 'refunded' !== akr_request_status( $rid ) ) {
			akrqt_set_status( $rid, 'refunded', array( 'source' => 'refund on the order' ) );
		}
	},
	20,
	2
);

/** A box on a cancel or return request: the order, and for a cancel request a button that cancels it. */
add_action(
	'add_meta_boxes',
	function () {
		add_meta_box(
			'akrq_order_request',
			'Order',
			function ( $post ) {
				$oid = (int) get_post_meta( $post->ID, 'akrq_order_id', true );
				if ( ! $oid || ! ( $order = wc_get_order( $oid ) ) ) {
					echo '<p>This is not a cancel or return request.</p>';
					return;
				}
				$type = (string) get_post_meta( $post->ID, 'akrq_type', true );
				echo '<p><a href="' . esc_url( admin_url( 'post.php?post=' . $oid . '&action=edit' ) ) . '"><strong>Open order #' . esc_html( $order->get_order_number() ) . '</strong></a><br>Status: ' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . '<br>Total: ' . esc_html( wp_strip_all_tags( wc_price( $order->get_total() ) ) ) . ' (' . esc_html( $order->get_payment_method_title() ) . ')</p>';
				if ( 'cancel' === $type && in_array( $order->get_status(), array( 'pending', 'on-hold', 'processing' ), true ) ) {
					wp_nonce_field( 'akrq_approve_cancel', 'akrq_cancel_nonce' );
					echo '<input type="hidden" name="akrq_req_id" value="' . (int) $post->ID . '">';
					echo '<p><button type="submit" class="button button-primary" name="akrq_do" value="approve_cancel">Approve: cancel the order</button></p>';
					echo '<p class="description">Cancels the order, puts the stock back and emails the customer. A payment made online must still be refunded from the order screen.</p>';
				} elseif ( 'return' === $type ) {
					echo '<p class="description">For a return, reply to the customer with how to send the item back. After you check it, refund from the order screen and set this request to Returned or Refunded.</p>';
				}
			},
			'akr_request',
			'side',
			'high'
		);
	}
);

// The button submits the request form itself (admin-post.php cannot be used: the form's own "action" field wins there).
add_action(
	'save_post_akr_request',
	function ( $id ) {
		$id = (int) $id;
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! isset( $_POST['akrq_do'] ) || 'approve_cancel' !== sanitize_key( wp_unslash( $_POST['akrq_do'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		if ( ! $id || ! current_user_can( 'edit_post', $id ) || ! current_user_can( 'edit_shop_orders' ) || ! isset( $_POST['akrq_cancel_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrq_cancel_nonce'] ) ), 'akrq_approve_cancel' ) ) {
			return;
		}
		$order = wc_get_order( (int) get_post_meta( $id, 'akrq_order_id', true ) );
		$msg   = 'Order not found.';
		if ( $order && in_array( $order->get_status(), array( 'pending', 'on-hold', 'processing' ), true ) ) {
			$order->update_status( 'cancelled', 'Cancelled at the customer\'s request (' . akr_request_reference( $id ) . '). ' );
			update_post_meta( $id, 'akr_status', 'cancelled' );
			akr_request_log( $id, 'Cancellation approved; order #' . $order->get_order_number() . ' cancelled.' );
			// the customer's email goes from the order's Cancelled hook, the same for every way of cancelling
			$msg = 'cancelled';
		}
		set_transient( 'akrqt_notice_' . get_current_user_id(), array( 'ok' => 'cancelled' === $msg, 'text' => 'cancelled' === $msg ? 'Order cancelled and the customer emailed.' : $msg ), 120 );
	},
	30
);
