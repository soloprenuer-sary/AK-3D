<?php
/**
 * Plugin Name: Akrinity quote workflow
 * Description: Custom quote requests from first contact to a closed order. Create, update and delete a quote; send a quote with the reasons for the price and an accept link; on approval a WooCommerce order with a payment link is created; a customer email for every status (in review, quoted, awaiting payment, paid, in production, ready, shipped, completed, cancelled, refunded, returned). Works with akrinity-headless-auth.php, akrinity-requests.php, akrinity-emails.php, akrinity-shop.php and akrinity-invoices.php. Version 1.0.0.
 *
 * Optional wp-config.php constants:
 *   define( 'AKRINITY_QUOTE_ACCEPT_PAGE', true ); // turn on the Accept button in the quote email once the storefront page /quote/accept is live (default off: the customer replies to approve)
 *   define( 'AKRINITY_QUOTE_GST', 18 );        // GST percentage added to quote lines (default 18)
 *   define( 'AKRINITY_QUOTE_DAYS', 7 );        // days a sent quote can be accepted (default 7)
 *
 * The flow (every step sends the customer an email; a tick box on the request lets you hold one back):
 *   New -> In review (you set it) -> Quoted ("Send quote") -> Awaiting payment (customer accepts, or you set it; a WooCommerce order
 *   is made and its payment link emailed) -> Paid (the payment goes through, or you set it) -> In production -> Ready to ship ->
 *   Shipped (partner, tracking ID, GST invoice attached) -> Completed (order closed).  Cancelled, Refunded and Returned end it.
 */

defined( 'ABSPATH' ) || exit;

/* =====================================================================================
 * Basics
 * ===================================================================================== */

function akrqt_gst_pct(): float {
	return defined( 'AKRINITY_QUOTE_GST' ) ? max( 0.0, (float) AKRINITY_QUOTE_GST ) : 18.0;
}

/** True once the storefront's /quote/accept page is live: then the quote email has an Accept button. Set define( 'AKRINITY_QUOTE_ACCEPT_PAGE', true ); in wp-config.php. */
function akrqt_accept_page_on(): bool {
	return defined( 'AKRINITY_QUOTE_ACCEPT_PAGE' ) && (bool) AKRINITY_QUOTE_ACCEPT_PAGE;
}

/** A WhatsApp chat link with the quote reference filled in, from AKRINITY_WHATSAPP in wp-config.php. Empty when no number is set. */
function akrqt_whatsapp_link( string $ref ): string {
	$number = apply_filters( 'akrqt_whatsapp_number', defined( 'AKRINITY_WHATSAPP' ) ? (string) AKRINITY_WHATSAPP : '' );
	$digits = preg_replace( '/\D+/', '', (string) $number );
	// No link until the real number is set: the temporary 9000000000 number would send customers nowhere.
	if ( strlen( (string) $digits ) < 10 || preg_match( '/^(91)?9000000000$/', (string) $digits ) ) {
		return '';
	}
	return 'https://wa.me/' . $digits . '?text=' . rawurlencode( 'Hi Akrinity, about my quote ' . $ref );
}

function akrqt_days(): int {
	return defined( 'AKRINITY_QUOTE_DAYS' ) ? max( 1, (int) AKRINITY_QUOTE_DAYS ) : 7;
}

/** Quote requests that can be quoted: from the website form (custom), bulk requests, and ones made in WordPress. */
function akrqt_is_quotable( int $id ): bool {
	$post = get_post( $id );
	return $post && 'akr_request' === $post->post_type && ! in_array( (string) get_post_meta( $id, 'akr_kind', true ), array( 'contact', 'newsletter', 'order_request' ), true );
}

function akrqt_money( $n ): string {
	return '₹' . number_format( (float) $n, 2 );
}

function akrqt_ref( int $id ): string {
	return function_exists( 'akr_request_reference' ) ? akr_request_reference( $id ) : 'QR-' . $id;
}

/** Quote lines: label, reason, amount before GST. Rows without a label or amount are dropped. */
function akrqt_clean_lines( $rows ): array {
	$out = array();
	foreach ( is_array( $rows ) ? $rows : array() as $r ) {
		if ( ! is_array( $r ) ) {
			continue;
		}
		$label  = sanitize_text_field( (string) ( $r['label'] ?? '' ) );
		$reason = sanitize_text_field( (string) ( $r['reason'] ?? '' ) );
		$amount = round( (float) ( $r['amount'] ?? 0 ), 2 );
		if ( '' !== $label && $amount > 0 ) {
			$out[] = array( 'label' => $label, 'reason' => $reason, 'amount' => $amount );
		}
	}
	return array_slice( $out, 0, 12 );
}

function akrqt_totals( array $lines ): array {
	$sub = 0.0;
	$gst = 0.0;
	foreach ( $lines as $l ) {
		$sub += $l['amount'];
		$gst += round( $l['amount'] * akrqt_gst_pct() / 100, 2 );
	}
	return array( 'subtotal' => round( $sub, 2 ), 'gst' => round( $gst, 2 ), 'total' => round( $sub + $gst, 2 ) );
}

function akrqt_lines( int $id ): array {
	$l = get_post_meta( $id, 'akr_quote_lines', true );
	return is_array( $l ) ? akrqt_clean_lines( $l ) : array();
}

/** The studio's address for replies and copies. */
function akrqt_studio(): string {
	return (string) get_option( 'admin_email' );
}

/* =====================================================================================
 * Emails (the designs approved in the preview)
 * ===================================================================================== */

/** The progress strip. $done = steps finished (0-6), $now = the step in progress (1-6, 0 = none). */
function akrqt_tracker( int $done, int $now ): string {
	$c     = akr_em_c();
	$names = array( 'Received', 'In review', 'Quote', 'Payment', 'Making', 'Delivered' );
	$cells = '';
	foreach ( $names as $i => $name ) {
		$n = $i + 1;
		if ( $n <= $done ) {
			$bg = $c['ink']; $fg = $c['lime']; $bd = $c['ink']; $txt = '&#10003;'; $lc = $c['ink']; $w = 400;
		} elseif ( $n === $now ) {
			$bg = $c['lime']; $fg = $c['ink']; $bd = $c['ink']; $txt = (string) $n; $lc = $c['ink']; $w = 700;
		} else {
			$bg = '#FFFFFF'; $fg = '#8A857A'; $bd = '#D9D5C8'; $txt = (string) $n; $lc = '#8A857A'; $w = 400;
		}
		$cells .= '<td align="center" valign="top" width="16.6%" style="padding:0 2px;"><table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" valign="middle" width="30" height="30" bgcolor="' . $bg . '" style="width:30px;height:30px;border-radius:15px;border:2px solid ' . $bd . ';font-family:' . $c['body'] . ';font-size:13px;font-weight:700;color:' . $fg . ';">' . $txt . '</td></tr></table>' .
			'<div style="font-family:' . $c['body'] . ';font-size:11px;font-weight:' . $w . ';color:' . $lc . ';padding-top:6px;">' . esc_html( $name ) . '</div></td>';
	}
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $cells . '</tr></table>';
}

/** A card of label and value rows. */
function akrqt_rows_card( array $rows ): string {
	$c  = akr_em_c();
	$tr = '';
	foreach ( $rows as $label => $value ) {
		if ( '' === trim( (string) $value ) ) {
			continue;
		}
		$tr .= '<tr><td valign="top" style="padding:6px 12px 6px 0;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';white-space:nowrap;">' . esc_html( (string) $label ) . '</td><td valign="top" align="right" style="padding:6px 0;font-family:' . $c['body'] . ';font-size:14.5px;font-weight:600;color:' . $c['ink'] . ';overflow-wrap:anywhere;">' . nl2br( esc_html( (string) $value ) ) . '</td></tr>';
	}
	if ( '' === $tr ) {
		return '';
	}
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $tr . '</table></td></tr></table>';
}

/** A big highlighted amount box. */
function akrqt_amount_box( string $label, string $amount, string $line = '', bool $lime = true ): string {
	$c  = akr_em_c();
	$bg = $lime ? $c['lime'] : $c['ink'];
	$fg = $lime ? $c['ink'] : $c['lime'];
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $bg . ';border:1.5px solid ' . $c['ink'] . ';border-radius:16px;"><tr><td style="padding:16px 20px;"><div style="font-family:' . $c['body'] . ';font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $fg . ';">' . esc_html( $label ) . '</div>' .
		'<div class="d" style="font-family:' . $c['disp'] . ';font-size:36px;line-height:1.1;color:' . $fg . ';">' . esc_html( $amount ) . '</div>' .
		( '' !== $line ? '<div style="font-family:' . $c['body'] . ';font-size:13px;color:' . $fg . ';padding-top:4px;">' . nl2br( esc_html( $line ) ) . '</div>' : '' ) . '</td></tr></table>';
}

/** "Why this price": every line with its reason, GST and the total. */
function akrqt_quote_table( array $lines ): string {
	$c  = akr_em_c();
	$t  = akrqt_totals( $lines );
	$tr = '<tr><td colspan="2" bgcolor="' . $c['paper'] . '" style="padding:10px 18px;border-bottom:1.5px solid ' . $c['ink'] . ';font-family:' . $c['body'] . ';font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $c['muted'] . ';">Why this price</td></tr>';
	foreach ( $lines as $l ) {
		$tr .= '<tr><td valign="top" style="padding:10px 18px;border-bottom:1px solid #D9D5C8;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['ink'] . ';"><b>' . esc_html( $l['label'] ) . '</b>' . ( '' !== $l['reason'] ? '<div style="color:' . $c['muted'] . ';font-size:12.5px;">' . esc_html( $l['reason'] ) . '</div>' : '' ) . '</td><td valign="top" align="right" style="padding:10px 18px;border-bottom:1px solid #D9D5C8;font-family:' . $c['body'] . ';font-size:14px;font-weight:700;white-space:nowrap;">' . esc_html( akrqt_money( $l['amount'] ) ) . '</td></tr>';
	}
	$pct = rtrim( rtrim( number_format( akrqt_gst_pct(), 2 ), '0' ), '.' );
	$tr .= '<tr><td style="padding:8px 18px 2px;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';">Subtotal</td><td align="right" style="padding:8px 18px 2px;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';">' . esc_html( akrqt_money( $t['subtotal'] ) ) . '</td></tr>';
	$tr .= '<tr><td style="padding:2px 18px 10px;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';">GST ' . esc_html( $pct ) . '%</td><td align="right" style="padding:2px 18px 10px;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';">' . esc_html( akrqt_money( $t['gst'] ) ) . '</td></tr>';
	$tr .= '<tr><td bgcolor="' . $c['ink'] . '" style="padding:12px 18px;font-family:' . $c['body'] . ';font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $c['lime'] . ';">Total, including GST</td><td bgcolor="' . $c['ink'] . '" align="right" style="padding:10px 18px;font-family:' . $c['disp'] . ';font-size:30px;line-height:1;color:' . $c['lime'] . ';">' . esc_html( akrqt_money( $t['total'] ) ) . '</td></tr>';
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid ' . $c['ink'] . ';border-radius:16px;border-collapse:separate;overflow:hidden;">' . $tr . '</table>';
}

/** One email of the workflow, sent to the customer. $a holds extra values (order, note, attachments). Returns whether it went. */
function akrqt_send_status_email( int $id, string $kind, array $a = array() ): bool {
	$to = sanitize_email( (string) get_post_meta( $id, 'akr_email', true ) );
	if ( ! is_email( $to ) || ! function_exists( 'akr_em_shell' ) ) {
		return false;
	}
	$c      = akr_em_c();
	$ref    = akrqt_ref( $id );
	$name   = trim( (string) get_post_meta( $id, 'akr_name', true ) );
	$first  = '' !== $name ? explode( ' ', $name )[0] : '';
	$hi     = '' !== $first ? 'Hi ' . $first . ', ' : '';
	$job    = trim( implode( ' · ', array_filter( array( (string) get_post_meta( $id, 'akr_job', true ), (string) get_post_meta( $id, 'akr_material', true ), get_post_meta( $id, 'akr_quantity', true ) ? 'Qty ' . get_post_meta( $id, 'akr_quantity', true ) : '' ) ) ) );
	$order  = $a['order'] ?? null;
	$total  = (float) get_post_meta( $id, 'akr_quote_price', true );
	$lead   = (string) get_post_meta( $id, 'akr_quote_lead', true );
	$front  = function_exists( 'akr_frontend_url' ) ? akr_frontend_url() : '';
	$note   = (string) ( $a['note'] ?? '' );
	$d      = array( 'head' => $ref . ( $order instanceof WC_Order ? ' · Order #' . $order->get_order_number() : '' ), 'blocks' => array(), 'attach' => (array) ( $a['attach'] ?? array() ) );
	$steps  = function ( array $items ) {
		return akr_em_title( 'What happens next' ) . akr_em_steps( array_map( 'esc_html', $items ) );
	};
	$subject = '';
	$plain   = '';
	$close   = 'Reply to this email and mention ' . $ref . ' if you need anything.';

	switch ( $kind ) {
		case 'new':
			$subject = 'We have your request ' . $ref;
			$d += array( 'tag' => 'Request received', 'title' => 'We have your', 'hl' => 'request.', 'intro' => $hi . 'we got your custom print request. A person at the studio will look at your file and reply with a price.' );
			$d['blocks'] = array( akrqt_tracker( 0, 1 ), akrqt_rows_card( array( 'Reference' => $ref, 'Job' => $job, 'Your file' => (string) get_post_meta( $id, 'akr_file_name', true ) ) ), $steps( array( 'We check your file, the material and the print time.', 'We email you a price with the reasons behind it, and a button to accept.', 'You approve it, pay, and we print. You pay nothing until you approve.' ) ) );
			$plain = 'We have your request ' . $ref . '. We will reply with a price.';
			break;
		case 'review':
			$subject = $ref . ': we are reviewing your request';
			$d += array( 'tag' => 'In review by Akrinity', 'title' => 'We are', 'hl' => 'on it.', 'intro' => $hi . 'a person at the studio is now checking your file, the material and the print time, so the price we send is the real one.' );
			$d['blocks'] = array( akrqt_tracker( 1, 2 ), akrqt_rows_card( array( 'Expected reply' => 'Within 1 working day', 'Reference' => $ref, 'Job' => $job ) ), $steps( array( 'That the file prints well: wall thickness, overhangs and size.', 'How much material and machine time it needs.', 'Any finishing it needs. If something will not print well, we tell you before we quote.' ) ) );
			$plain = $ref . ' is in review. We will send a price within 1 working day.';
			break;
		case 'quote':
			$lines = akrqt_lines( $id );
			$exp   = (int) get_post_meta( $id, 'akr_quote_exp', true );
			$link  = function_exists( 'akrq_quote_link' ) ? akrq_quote_link( $id ) : '';
			$msg   = (string) get_post_meta( $id, 'akr_quote_msg', true );
			$subject = 'Your Akrinity quote ' . $ref . ': ' . akrqt_money( $total );
			$d += array( 'tag' => 'Your quote', 'title' => 'Your quote is', 'hl' => 'ready.', 'intro' => $hi . 'here is the price for your request and what it is made of. Approving costs nothing: you pay only after you approve.' );
			$blocks = array( akrqt_tracker( 2, 3 ), akrqt_quote_table( $lines ) );
			$blocks[] = akrqt_rows_card( array( 'Ready in' => $lead, 'Valid until' => $exp ? wp_date( 'j M Y', $exp ) : '' ) );
			if ( '' !== $msg ) {
				$blocks[] = '<div style="font-family:' . $c['body'] . ';font-size:14px;color:' . $c['ink'] . ';"><b>Note from the studio:</b> ' . nl2br( esc_html( $msg ) ) . '</div>';
			}
			$wa = akrqt_whatsapp_link( $ref );
			if ( akrqt_accept_page_on() ) {
				$blocks[] = akr_em_btn( 'Accept this quote', $link );
				if ( '' !== $wa ) {
					$blocks[] = akr_em_btn( 'Chat on WhatsApp', $wa, 'lime' );
				}
				$d['help'] = 'Want something changed? Just reply to this email and mention ' . $ref . '.';
				$plain     = 'Your quote ' . $ref . ': ' . akrqt_money( $total ) . " including GST. Accept it here: " . $link . ( '' !== $wa ? "
Questions? Chat with us on WhatsApp: " . $wa : '' );
			} else {
				// The storefront's accept page is not live yet: the customer approves by replying, and the studio sets Awaiting payment.
				$blocks[] = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' . $c['lime'] . ';border:1.5px solid ' . $c['ink'] . ';border-radius:16px;"><tr><td style="padding:16px 20px;font-family:' . $c['body'] . ';font-size:15px;color:' . $c['ink'] . ';"><b>To approve this quote, reply to this email</b> with the word "approved" and your delivery address. We then send you the payment link.</td></tr></table>';
				if ( '' !== $wa ) {
					$blocks[] = akr_em_btn( 'Chat on WhatsApp', $wa, 'lime' );
				}
				$d['help'] = 'Want something changed first? Reply to this email and mention ' . $ref . '.';
				$plain     = 'Your quote ' . $ref . ': ' . akrqt_money( $total ) . " including GST. To approve it, reply to this email with the word approved and your delivery address, and we will send you the payment link.";
			}
			$d['blocks'] = $blocks;
			break;
		case 'approved':
			$pay = $order instanceof WC_Order ? $order->get_checkout_payment_url() : '';
			$subject = $ref . ' approved: pay ' . akrqt_money( $order instanceof WC_Order ? $order->get_total() : $total ) . ' to start printing';
			$amt = akrqt_money( $order instanceof WC_Order ? $order->get_total() : $total );
			$d += array( 'tag' => 'Awaiting payment', 'title' => 'Quote', 'hl' => 'approved.', 'intro' => 'Thank you' . ( '' !== $first ? ', ' . $first : '' ) . '. Your quote ' . $ref . ' is approved. Pay below and we start printing straight away.' );
			$d['blocks'] = array(
				akrqt_tracker( 3, 4 ),
				akrqt_rows_card( array( 'Your print' => $job, 'Ready in' => '' !== $lead ? $lead . ' after payment' : '', 'Pay by' => wp_date( 'j M Y', time() + 7 * DAY_IN_SECONDS ) ) ),
				akrqt_amount_box( 'Amount due, incl. GST', $amt, '', false ),
				akr_em_btn( 'Pay ' . $amt . ' now', $pay ),
				'<div style="font-family:' . $c['body'] . ';font-size:13px;color:' . $c['muted'] . ';">Secure payment by Cashfree: UPI, cards and net banking. The link opens your order on our website.</div>',
				'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:12px 16px;font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['ink'] . ';"><b>Prefer to pay another way?</b> Reply to this email and we will send UPI or bank details. Once we see the payment, we mark it paid and you get a receipt.</td></tr></table>',
			);
			$d['help'] = 'Changed your mind? Reply before you pay and we will cancel the quote. Nothing is charged until you pay.';
			$plain = $ref . ' approved. Pay ' . $amt . ' here: ' . $pay;
			break;
		case 'paid':
			$amt  = akrqt_money( $order instanceof WC_Order ? $order->get_total() : $total );
			$ready = (int) get_post_meta( $id, 'akrqt_ready_by', true );
			$via  = $order instanceof WC_Order ? trim( wp_strip_all_tags( (string) $order->get_payment_method_title() ) ) : '';
			$subject = 'Payment received for ' . $ref;
			$d += array( 'tag' => 'Paid', 'title' => 'Payment', 'hl' => 'received.', 'intro' => 'Thank you' . ( '' !== $first ? ', ' . $first : '' ) . '. We have your payment, and your print is now in the queue.' );
			$d['blocks'] = array(
				akrqt_tracker( 4, 0 ),
				akrqt_amount_box( 'Receipt', $amt, 'Paid ' . wp_date( 'j M Y' ) . ( '' !== $via ? ' via ' . $via : '' ) . ( $order instanceof WC_Order && $order->get_transaction_id() ? "\nTransaction " . $order->get_transaction_id() : '' ) ),
				$ready ? akrqt_rows_card( array( 'Estimated ready' => wp_date( 'D j M', $ready ) ) ) : '',
				$steps( array( 'We print it and check every part.', 'We pack it and hand it to the courier.', 'You get the tracking link and your GST invoice (PDF) by email.' ) ),
			);
			$d['help'] = 'Keep this email as your payment receipt. The GST tax invoice comes with the shipping email.';
			$plain = 'Payment of ' . $amt . ' received for ' . $ref . '.';
			break;
		case 'making':
			$ready = (int) get_post_meta( $id, 'akrqt_ready_by', true );
			$subject = $ref . ': we are printing your order';
			$d += array( 'tag' => 'In production', 'title' => 'Now', 'hl' => 'printing.', 'intro' => $hi . 'your order is on the printer. Layer by layer, it is taking shape.' );
			$d['blocks'] = array( akrqt_tracker( 4, 5 ), $ready ? akrqt_rows_card( array( 'Estimated ready' => wp_date( 'D j M', $ready ), 'After printing' => 'We remove the supports, sand the edges and check each piece.' ) ) : '', '' !== $note ? '<div style="font-family:' . $c['body'] . ';font-size:14px;color:' . $c['ink'] . ';"><b>Note from the studio:</b> ' . nl2br( esc_html( $note ) ) . '</div>' : '' );
			$d['help'] = 'No action needed. We will email you again when it ships.';
			$plain = $ref . ' is being printed.';
			break;
		case 'ready':
			$subject = $ref . ' is packed and ready';
			$d += array( 'tag' => 'Ready to ship', 'title' => 'Packed and', 'hl' => 'ready.', 'intro' => $hi . 'your order is printed, finished and checked. It is packed and waiting for the courier.' );
			$d['blocks'] = array( akrqt_tracker( 5, 0 ), akrqt_rows_card( array( 'Hand over to courier' => 'Today or next working day', 'In the box' => $job ) ), '' !== $note ? '<div style="font-family:' . $c['body'] . ';font-size:14px;color:' . $c['ink'] . ';"><b>Note from the studio:</b> ' . nl2br( esc_html( $note ) ) . '</div>' : '' );
			$d['help'] = 'Need to change the delivery address? Reply now, before it ships.';
			$plain = $ref . ' is packed and ready to ship.';
			break;
		case 'shipped':
			$partner = (string) get_post_meta( $id, 'akrqt_partner', true );
			$awb     = (string) get_post_meta( $id, 'akrqt_awb', true );
			$url     = esc_url_raw( (string) get_post_meta( $id, 'akrqt_track_url', true ) );
			$eta     = (string) get_post_meta( $id, 'akrqt_eta', true );
			$etats   = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $eta ) ? (int) strtotime( $eta . ' 12:00:00' ) : akrq_add_working_days( time(), function_exists( 'akr_delivery_days' ) ? akr_delivery_days() : 5 );
			$subject = $ref . ' is on its way';
			$d += array( 'tag' => 'Shipped', 'title' => 'On its', 'hl' => 'way.', 'intro' => $hi . 'your parcel has left the studio.' . ( '' !== $url ? ' Track it with the button below.' : '' ) );
			$blocks = array( akrqt_tracker( 5, 6 ), akrqt_rows_card( array( 'Delivery partner' => $partner, 'Tracking ID' => $awb, 'Estimated delivery' => wp_date( 'D j M', $etats ) ) ) );
			if ( '' !== $url ) {
				$blocks[] = akr_em_btn( 'Track the parcel', $url );
			}
			if ( ! empty( $d['attach'] ) ) {
				$blocks[] = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:12px 16px;font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['ink'] . ';"><b>Your GST tax invoice is attached</b> (PDF).</td></tr></table>';
			}
			$d['blocks'] = $blocks;
			$d['help'] = 'When it arrives, unpack it and have a look. If anything is wrong, reply to this email within 7 days and we will fix it.';
			$plain = $ref . ' has shipped. ' . $partner . ' ' . $awb;
			break;
		case 'completed':
			$subject = $ref . ' is complete: thank you';
			$d += array( 'tag' => 'Completed', 'title' => 'All', 'hl' => 'done.', 'intro' => $hi . 'your order has arrived and we have closed it. Thank you for printing with Akrinity.' );
			$d['blocks'] = array(
				akrqt_tracker( 6, 0 ),
				'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:16px 20px;"><div class="d" style="font-family:' . $c['disp'] . ';font-size:26px;text-transform:uppercase;color:' . $c['ink'] . ';">How did it turn out?</div><div style="font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['muted'] . ';padding:4px 0 12px;">Tell us what you think. It helps us make the next one better.</div>' . ( '' !== $front ? akr_em_btn( 'Tell us how it went', $front . '/contact' ) : '' ) . '</td></tr></table>',
				akrqt_rows_card( array( 'Total paid' => $order instanceof WC_Order ? akrqt_money( $order->get_total() ) . ' incl. GST' : akrqt_money( $total ) . ' incl. GST', 'GST invoice' => ( $order instanceof WC_Order && '' !== (string) $order->get_meta( '_akrinv_number' ) ) ? (string) $order->get_meta( '_akrinv_number' ) . ' (PDF attached)' : '' ) ),
				'<div style="font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['ink'] . ';">This request is now closed. If something is wrong with the parcel, reply to this email within 7 days and we will reopen it and put it right.</div>',
			);
			$d['help'] = 'Need another print? Reply with your file, or start a new request on our website.';
			$plain = $ref . ' is complete. Thank you.';
			break;
		case 'cancelled':
			$subject = $ref . ' is cancelled';
			$d += array( 'tag' => 'Cancelled', 'title' => 'Request', 'hl' => 'cancelled.', 'intro' => $hi . 'we have cancelled quote request ' . $ref . '. Nothing more will be printed.' );
			$d['blocks'] = array( akrqt_rows_card( array( 'Reference' => $ref, 'Reason' => '' !== $note ? $note : 'At your request', 'Payment' => $order instanceof WC_Order && $order->is_paid() ? 'You have paid: a refund email follows' : 'Nothing was paid, nothing is due' ) ), $front ? akr_em_btn( 'Start a new request', $front . '/quote' ) : '' );
			$d['blocks'] = array_merge( $d['blocks'], function_exists( 'akrq_back_blocks' ) ? akrq_back_blocks() : array() );
			$d['help'] = 'A mistake, or you changed your mind again? Reply to this email and we will reopen it.';
			$plain = $ref . ' is cancelled.';
			break;
		case 'refunded':
			$subject = 'Refund issued for ' . $ref;
			$amt = akrqt_money( $order instanceof WC_Order ? $order->get_total() : $total );
			$d += array( 'tag' => 'Refunded', 'title' => 'Refund', 'hl' => 'issued.', 'intro' => $hi . 'we have refunded your payment.' );
			$d['blocks'] = array( akrqt_amount_box( 'Refunded', $amt, 'Back to your original payment method, issued ' . wp_date( 'j M Y' ) . '.' ), akrqt_rows_card( array( 'When you will see it' => 'In 5 to 7 working days', 'Reason' => $note ) ), '<div style="font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['ink'] . ';">The time depends on your bank. If it has not arrived after 7 working days, reply to this email and we will chase it.</div>' );
			$d['blocks'] = array_merge( $d['blocks'], function_exists( 'akrq_back_blocks' ) ? akrq_back_blocks() : array() );
			$d['help'] = $close;
			$plain = 'Refund of ' . $amt . ' issued for ' . $ref . '.';
			break;
		case 'returned':
			$subject = 'Return received for ' . $ref;
			$d += array( 'tag' => 'Returned', 'title' => 'Return', 'hl' => 'received.', 'intro' => $hi . 'your parcel is back with us and we have checked it. Here is what happens now.' );
			$d['blocks'] = array( akrqt_rows_card( array( 'Received back' => wp_date( 'D j M Y' ), 'Our check' => $note ) ), '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:14px 18px;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['ink'] . ';"><b>Option A: refund.</b> We refund your payment to the original method.<br><br><b>Option B: reprint.</b> We print it again at no cost and ship it as a new order.</td></tr></table>', '<div style="font-family:' . $c['body'] . ';font-size:13.5px;color:' . $c['ink'] . ';">Tell us which you prefer by replying to this email. If we do not hear from you in 3 days, we refund by default.</div>' );
			$d['blocks'] = array_merge( $d['blocks'], function_exists( 'akrq_back_blocks' ) ? akrq_back_blocks() : array() );
			$d['help'] = $close;
			$plain = 'Return received for ' . $ref . '.';
			break;
		default:
			return false;
	}

	$d['blocks'] = array_values( array_filter( $d['blocks'] ) );
	$html = akr_em_shell(
		array(
			'tag'    => $d['tag'],
			'title'  => esc_html( $d['title'] ) . ' ' . akr_em_hl( $d['hl'] ),
			'head'   => esc_html( $d['head'] ),
			'pre'    => $d['intro'],
			'intro'  => esc_html( $d['intro'] ),
			'blocks' => $d['blocks'],
			'help'   => esc_html( $d['help'] ?? $close ),
		)
	);
	$headers = array( 'Content-Type: text/html; charset=UTF-8' );
	$studio  = akrqt_studio();
	if ( is_email( $studio ) ) {
		$headers[] = 'Reply-To: ' . $studio;
	}
	$sent = (bool) wp_mail( $to, $subject, $html, $headers, $d['attach'] );
	akr_request_log( $id, ( $sent ? 'Email sent to the customer: ' : 'Email could not be sent: ' ) . $subject );
	return $sent;
}

/* =====================================================================================
 * Status changes: one place that updates, logs, does the side effects and sends the email
 * ===================================================================================== */

/** Which email goes with which status. */
function akrqt_status_kinds(): array {
	return array(
		'reviewing'        => 'review',
		'awaiting_payment' => 'approved',
		'paid'             => 'paid',
		'in_production'    => 'making',
		'ready'            => 'ready',
		'shipped'          => 'shipped',
		'completed'        => 'completed',
		'cancelled'        => 'cancelled',
		'refunded'         => 'refunded',
		'returned'         => 'returned',
	);
}

function akrqt_order( int $id ): ?WC_Order {
	$oid = (int) get_post_meta( $id, 'akrqt_order_id', true );
	$o   = $oid ? wc_get_order( $oid ) : false;
	return $o instanceof WC_Order ? $o : null;
}

/** The WooCommerce order for a quote: made once, with one line per quote line, so the GST invoice can be drawn from it. */
function akrqt_ensure_order( int $id ): ?WC_Order {
	$existing = akrqt_order( $id );
	if ( $existing ) {
		return $existing;
	}
	$lines = akrqt_lines( $id );
	if ( ! $lines || ! function_exists( 'wc_create_order' ) ) {
		return null;
	}
	$name  = trim( (string) get_post_meta( $id, 'akr_name', true ) );
	$parts = explode( ' ', $name, 2 );
	$state = (string) get_post_meta( $id, 'akr_addr_state', true );
	$addr  = array(
		'first_name' => $parts[0],
		'last_name'  => $parts[1] ?? '',
		'company'    => (string) get_post_meta( $id, 'akr_company', true ),
		'address_1'  => (string) get_post_meta( $id, 'akr_addr_1', true ),
		'address_2'  => (string) get_post_meta( $id, 'akr_addr_2', true ),
		'city'       => (string) get_post_meta( $id, 'akr_addr_city', true ),
		'state'      => '' !== $state ? $state : ( defined( 'AKRINITY_SELLER_STATE' ) ? (string) AKRINITY_SELLER_STATE : 'MH' ), // no address yet: the seller's state, edit it on the order when known
		'postcode'   => (string) get_post_meta( $id, 'akr_addr_pin', true ),
		'country'    => 'IN',
	);
	$order = wc_create_order( array( 'status' => 'pending', 'created_via' => 'akrinity-quote' ) );
	if ( is_wp_error( $order ) ) {
		return null;
	}
	foreach ( $lines as $l ) {
		$item = new WC_Order_Item_Product();
		$item->set_name( $l['label'] . ( '' !== $l['reason'] ? ' (' . $l['reason'] . ')' : '' ) );
		$item->set_quantity( 1 );
		$item->set_subtotal( $l['amount'] );
		$item->set_total( $l['amount'] );
		$item->set_tax_class( '' );
		$order->add_item( $item );
	}
	$order->set_address( array_merge( $addr, array( 'email' => (string) get_post_meta( $id, 'akr_email', true ), 'phone' => (string) get_post_meta( $id, 'akr_phone', true ) ) ), 'billing' );
	$order->set_address( $addr, 'shipping' );
	$gstin = (string) get_post_meta( $id, 'akr_gstin', true );
	if ( '' !== $gstin ) {
		$order->update_meta_data( '_billing_gstin', $gstin );
	}
	$order->update_meta_data( '_akrqt_request', $id );
	$order->calculate_taxes();
	$order->calculate_totals( false );
	$order->add_order_note( 'Made from custom quote ' . akrqt_ref( $id ) . '.' );
	$order->save();
	update_post_meta( $id, 'akrqt_order_id', $order->get_id() );
	akr_request_log( $id, 'Order #' . $order->get_order_number() . ' made for payment (' . akrqt_money( $order->get_total() ) . ').' );
	return $order;
}

/** The GST invoice for an order as a file ready to attach; an empty array when it cannot be made yet. */
function akrqt_invoice_attachment( ?WC_Order $order ): array {
	if ( ! $order || ! function_exists( 'akrinv_pdf' ) || ! akrinv_may_invoice( $order ) ) {
		return array();
	}
	$pdf = akrinv_pdf( $order );
	if ( '' === $pdf ) {
		return array();
	}
	$path = trailingslashit( akrinv_cache_dir() ) . akrinv_filename( $order );
	return false !== file_put_contents( $path, $pdf ) ? array( $path ) : array();
}

/** Marks the order paid without WooCommerce's own customer email (ours goes instead). */
function akrqt_mark_order_paid( WC_Order $o, string $via = '' ): void {
	if ( $o->is_paid() ) {
		return;
	}
	if ( '' !== $via ) {
		$o->set_payment_method_title( $via );
		$o->add_order_note( 'Marked paid by hand: ' . $via . '.' );
	}
	$o->payment_complete();
	// A quote order has no shippable product, so WooCommerce would call it Completed. It is only Completed when the parcel has arrived.
	$o = wc_get_order( $o->get_id() );
	if ( $o && 'processing' !== $o->get_status() ) {
		$o->set_status( 'processing', 'Paid; being made.' );
		$o->save();
	}
}

/**
 * Sets the status of a request, writes History, does what that status needs on the order, and emails the customer.
 * $opts: note, email (default true), via (how it was paid by hand), source.
 */
function akrqt_set_status( int $id, string $new, array $opts = array() ): void {
	$all = akr_statuses();
	if ( ! isset( $all[ $new ] ) ) {
		return;
	}
	$old = akr_request_status( $id );
	if ( $old !== $new ) {
		update_post_meta( $id, 'akr_status', $new );
		akr_request_log( $id, 'Status changed from ' . $all[ $old ] . ' to ' . $all[ $new ] . ( ! empty( $opts['note'] ) ? '. Note: ' . $opts['note'] : '' ) . ( ! empty( $opts['source'] ) ? ' (' . $opts['source'] . ')' : '' ) );
	}
	akrqt_run_status( $id, $new, $opts );
}

/** The side effects and the email for a status that has just been set. */
function akrqt_run_status( int $id, string $status, array $opts = array() ): void {
	update_post_meta( $id, 'akrqt_last_status', $status );
	if ( ! akrqt_is_quotable( $id ) ) {
		return;
	}
	$kinds = akrqt_status_kinds();
	$order = akrqt_order( $id );
	$send  = ! isset( $opts['email'] ) || $opts['email'];
	$extra = array( 'note' => (string) ( $opts['note'] ?? '' ) );

	switch ( $status ) {
		case 'awaiting_payment':
			$order = akrqt_ensure_order( $id );
			if ( ! $order ) {
				akr_request_log( $id, 'No order was made: send a quote with at least one priced line first.' );
				$send = false;
			}
			break;
		case 'paid':
			$order = $order ?: akrqt_ensure_order( $id );
			if ( $order ) {
				akrqt_mark_order_paid( $order, (string) ( $opts['via'] ?? '' ) );
			}
			$lead = (string) get_post_meta( $id, 'akr_quote_lead', true );
			if ( preg_match( '/(\d+)/', $lead, $m ) ) {
				update_post_meta( $id, 'akrqt_ready_by', akrq_add_working_days( time(), (int) $m[1] ) );
			}
			update_post_meta( $id, 'akrqt_paid_at', time() );
			break;
		case 'shipped':
			if ( $order ) {
				$order->update_meta_data( '_akr_partner', (string) get_post_meta( $id, 'akrqt_partner', true ) );
				$order->update_meta_data( '_akr_courier', (string) get_post_meta( $id, 'akrqt_partner', true ) );
				$order->update_meta_data( '_akr_awb', (string) get_post_meta( $id, 'akrqt_awb', true ) );
				$order->update_meta_data( '_akr_tracking_url', (string) get_post_meta( $id, 'akrqt_track_url', true ) );
				$order->update_meta_data( '_akr_eta', (string) get_post_meta( $id, 'akrqt_eta', true ) );
				$order->update_meta_data( '_akr_shipped_at', time() );
				$order->update_meta_data( '_akr_transit_sent', (string) get_post_meta( $id, 'akrqt_awb', true ) ); // stops the shop snippet sending its own in-transit email
				$order->set_status( 'in-transit', 'Parcel shipped from the quote workflow.' );
				$order->save();
				$extra['attach'] = akrqt_invoice_attachment( $order );
			}
			break;
		case 'completed':
			if ( $order && 'completed' !== $order->get_status() ) {
				$order->set_status( 'completed', 'Quote ' . akrqt_ref( $id ) . ' completed.' );
				$order->save();
			}
			$extra['attach'] = akrqt_invoice_attachment( $order );
			break;
		case 'cancelled':
			if ( $order && in_array( $order->get_status(), array( 'pending', 'on-hold' ), true ) ) {
				$order->update_status( 'cancelled', 'Quote ' . akrqt_ref( $id ) . ' cancelled.' );
			}
			break;
	}
	if ( 'awaiting_payment' === $status && $order ) {
		$extra['order'] = $order;
	} elseif ( $order ) {
		$extra['order'] = akrqt_order( $id );
	}
	if ( $send && isset( $kinds[ $status ] ) ) {
		akrqt_send_status_email( $id, $kinds[ $status ], $extra );
	} elseif ( isset( $kinds[ $status ] ) ) {
		akr_request_log( $id, 'The customer email for this status was not sent (turned off).' );
	}
}

// A status picked on the request screen: WordPress's own box has saved it and logged it. This adds the side effects and the email.
add_action(
	'save_post_akr_request',
	function ( $post_id ) {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! isset( $_POST['akrqt_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrqt_nonce'] ) ), 'akrqt_box' ) || ! current_user_can( 'edit_post', $post_id ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$post_id = (int) $post_id;
		akrqt_save_fields( $post_id );
		// The Send quote and Withdraw quote buttons submit this same form (admin-post.php cannot be used: the form's own "action" field wins there).
		$do = isset( $_POST['akrqt_do'] ) ? sanitize_key( wp_unslash( $_POST['akrqt_do'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( 'send' === $do ) {
			$err = akrqt_send_quote(
				$post_id,
				akrqt_clean_lines( wp_unslash( $_POST['akrqt_lines'] ?? array() ) ), // phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput
				sanitize_text_field( wp_unslash( $_POST['akrqt_lead'] ?? '' ) ), // phpcs:ignore WordPress.Security.NonceVerification
				sanitize_textarea_field( wp_unslash( $_POST['akrqt_msg'] ?? '' ) ) // phpcs:ignore WordPress.Security.NonceVerification
			);
			akrqt_notice( '' === $err, '' === $err ? 'Quote sent to the customer.' : 'Quote not sent: ' . $err );
			return;
		}
		if ( 'withdraw' === $do ) {
			$err = akrqt_withdraw( $post_id );
			akrqt_notice( '' === $err, '' === $err ? 'Quote withdrawn. The customer\'s link no longer works.' : $err );
			return;
		}
		$now  = akr_request_status( $post_id );
		$last = (string) get_post_meta( $post_id, 'akrqt_last_status', true );
		if ( '' === $last ) {
			$last = 'new';
		}
		if ( $now === $last ) {
			return;
		}
		akrqt_run_status(
			$post_id,
			$now,
			array(
				'note'  => isset( $_POST['akr_status_note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['akr_status_note'] ) ) : '',
				'email' => ! empty( $_POST['akrqt_notify'] ),
				'via'   => isset( $_POST['akrqt_paid_via'] ) ? sanitize_text_field( wp_unslash( $_POST['akrqt_paid_via'] ) ) : '',
			)
		);
	},
	20
);

/* ---------- when the customer pays through WooCommerce ---------- */

function akrqt_order_paid( $order_id ): void {
	$order = wc_get_order( $order_id );
	if ( ! $order instanceof WC_Order ) {
		return;
	}
	$rid = (int) $order->get_meta( '_akrqt_request' );
	if ( ! $rid || 'akr_request' !== get_post_type( $rid ) ) {
		return;
	}
	if ( 'awaiting_payment' !== akr_request_status( $rid ) ) {
		return;
	}
	akrqt_set_status( $rid, 'paid', array( 'source' => 'online payment' ) );
	$fresh = wc_get_order( $order->get_id() );
	if ( $fresh && 'processing' !== $fresh->get_status() && 'paid' === akr_request_status( $rid ) ) {
		$fresh->set_status( 'processing', 'Paid; being made.' );
		$fresh->save();
	}
	akrq_mail(
		akrqt_studio(),
		'[Akrinity] Payment received for ' . akrqt_ref( $rid ) . ': ' . akrqt_money( $order->get_total() ),
		'Payment received for ' . akrqt_ref( $rid ),
		array(
			'tag'    => 'Payment received',
			'title'  => 'Payment',
			'hl'     => 'received.',
			'head'   => 'Studio',
			'intro'  => akrqt_ref( $rid ) . ' is paid. Start printing, then move the request to In production.',
			'rows'   => array( 'Reference' => akrqt_ref( $rid ), 'Customer' => (string) get_post_meta( $rid, 'akr_name', true ), 'Amount' => akrqt_money( $order->get_total() ), 'Order' => '#' . $order->get_order_number() ),
			'button' => array( 'Open the request', admin_url( 'post.php?post=' . $rid . '&action=edit' ) ),
		)
	);
}
add_action( 'woocommerce_payment_complete', 'akrqt_order_paid' );
add_action(
	'woocommerce_order_status_changed',
	function ( $order_id, $from, $to ) {
		if ( in_array( $to, array( 'processing', 'completed' ), true ) ) {
			$order = wc_get_order( $order_id );
			if ( $order && $order->is_paid() ) {
				akrqt_order_paid( $order_id );
			}
		}
	},
	10,
	3
);

// After paying on Cashfree, a quote order goes back to the storefront's quote page (not the shop's order page). It reads the quote status.
add_filter(
	'woocommerce_get_return_url',
	function ( $url, $order ) {
		if ( ! $order instanceof WC_Order || ! function_exists( 'akrq_quote_link' ) ) {
			return $url;
		}
		$rid = (int) $order->get_meta( '_akrqt_request' );
		if ( ! $rid ) {
			return $url;
		}
		$link = akrq_quote_link( $rid );
		return '' !== $link ? str_replace( '/quote/accept?', '/quote/paid?', $link ) : $url;
	},
	20,
	2
);

// The customer already gets the quote workflow's own emails, so WooCommerce's customer emails stay off for these orders.
foreach ( array( 'customer_processing_order', 'customer_completed_order', 'customer_on_hold_order', 'customer_in_transit_order', 'customer_invoice' ) as $akrqt_email ) {
	add_filter(
		'woocommerce_email_enabled_' . $akrqt_email,
		function ( $enabled, $order ) {
			return ( $order instanceof WC_Order && $order->get_meta( '_akrqt_request' ) ) ? false : $enabled;
		},
		20,
		2
	);
}

// The New order email has no {order_billing_full_name} in its subject, but our subject uses it: fill it in.
add_filter(
	'woocommerce_email_format_string',
	function ( $string, $email ) {
		if ( is_string( $string ) && false !== strpos( $string, '{order_billing_full_name}' ) && isset( $email->object ) && $email->object instanceof WC_Order ) {
			$string = str_replace( '{order_billing_full_name}', trim( $email->object->get_billing_first_name() . ' ' . $email->object->get_billing_last_name() ), $string );
		}
		return $string;
	},
	20,
	2
);

/* =====================================================================================
 * Approving a quote
 * ===================================================================================== */

/** The customer accepted (link or a hand-set status). Makes the order and sends the payment email. $address: optional delivery address from the accept page. */
function akrqt_approve( int $id, array $address = array() ): void {
	if ( 'quoted' !== akr_request_status( $id ) ) {
		return;
	}
	$map = array( 'line1' => 'akr_addr_1', 'line2' => 'akr_addr_2', 'city' => 'akr_addr_city', 'state' => 'akr_addr_state', 'pincode' => 'akr_addr_pin' );
	foreach ( $map as $k => $meta ) {
		if ( isset( $address[ $k ] ) && '' !== trim( (string) $address[ $k ] ) ) {
			update_post_meta( $id, $meta, sanitize_text_field( (string) $address[ $k ] ) );
		}
	}
	update_post_meta( $id, 'akr_quote_accepted', time() );
	akrqt_set_status( $id, 'awaiting_payment', array( 'source' => 'customer accepted the quote' ) );
	akrq_mail(
		akrqt_studio(),
		'[Akrinity] Quote ' . akrqt_ref( $id ) . ' accepted: ' . akrqt_money( get_post_meta( $id, 'akr_quote_price', true ) ),
		akrqt_ref( $id ) . ' was accepted. A payment link has been emailed.',
		array(
			'tag'    => 'Quote accepted',
			'title'  => 'Quote',
			'hl'     => 'accepted.',
			'head'   => 'Studio',
			'intro'  => 'The customer accepted ' . akrqt_ref( $id ) . '. An order was made and the payment link was emailed. The request is Awaiting payment.',
			'rows'   => array( 'Reference' => akrqt_ref( $id ), 'Customer' => (string) get_post_meta( $id, 'akr_name', true ), 'Phone' => (string) get_post_meta( $id, 'akr_phone', true ), 'Amount' => akrqt_money( get_post_meta( $id, 'akr_quote_price', true ) ) ),
			'button' => array( 'Open the request', admin_url( 'post.php?post=' . $id . '&action=edit' ) ),
		)
	);
}

/** Extra fields for the storefront's quote page. */
function akrqt_quote_extra( int $id ): array {
	$lines = akrqt_lines( $id );
	$t     = akrqt_totals( $lines );
	$order = akrqt_order( $id );
	return array(
		'lines'    => $lines,
		'subtotal' => number_format( $t['subtotal'], 2, '.', '' ),
		'gst'      => number_format( $t['gst'], 2, '.', '' ),
		'gst_pct'  => akrqt_gst_pct(),
		'pay_url'  => ( $order && $order->needs_payment() ) ? $order->get_checkout_payment_url() : '',
	);
}

/* =====================================================================================
 * Sending, updating and withdrawing a quote
 * ===================================================================================== */

/** Saves the lines and details of a quote and emails it. Returns an error text, or '' when sent. */
function akrqt_send_quote( int $id, array $lines, string $lead, string $message ): string {
	if ( ! akrqt_is_quotable( $id ) ) {
		return 'This kind of entry cannot be quoted.';
	}
	if ( in_array( akr_request_status( $id ), array( 'paid', 'in_production', 'ready', 'shipped', 'completed', 'refunded', 'returned' ), true ) ) {
		return 'This request is already paid or finished, so its quote cannot change.';
	}
	if ( ! is_email( (string) get_post_meta( $id, 'akr_email', true ) ) ) {
		return 'This request has no valid customer email.';
	}
	$lines = akrqt_clean_lines( $lines );
	if ( ! $lines ) {
		return 'Add at least one line with a label and an amount.';
	}
	if ( '' === akrq_front_url() || ! defined( 'AKRINITY_SHARED_SECRET' ) ) {
		return 'The storefront address or the shared secret is not set in wp-config.php.';
	}
	$revision = '' !== (string) get_post_meta( $id, 'akr_quote_price', true );
	$t        = akrqt_totals( $lines );
	$exp      = time() + akrqt_days() * DAY_IN_SECONDS;
	update_post_meta( $id, 'akr_quote_lines', $lines );
	update_post_meta( $id, 'akr_quote_subtotal', number_format( $t['subtotal'], 2, '.', '' ) );
	update_post_meta( $id, 'akr_quote_gst', number_format( $t['gst'], 2, '.', '' ) );
	update_post_meta( $id, 'akr_quote_price', number_format( $t['total'], 2, '.', '' ) );
	update_post_meta( $id, 'akr_quote_lead', $lead );
	update_post_meta( $id, 'akr_quote_msg', $message );
	update_post_meta( $id, 'akr_quote_exp', $exp );
	update_post_meta( $id, 'akr_quote_sent', time() );
	delete_post_meta( $id, 'akr_quote_accepted' );
	// An unpaid order from an earlier accepted quote is replaced by a new one when this quote is accepted.
	$old = akrqt_order( $id );
	if ( $old && in_array( $old->get_status(), array( 'pending', 'on-hold' ), true ) ) {
		$GLOBALS['akrq_skip_cancel'] = true; // an internal change: no cancel email to the customer
		$old->update_status( 'cancelled', 'Replaced by a revised quote.' );
		unset( $GLOBALS['akrq_skip_cancel'] );
		delete_post_meta( $id, 'akrqt_order_id' );
	}
	$old_status = akr_request_status( $id );
	update_post_meta( $id, 'akr_status', 'quoted' );
	akr_request_log( $id, ( $revision ? 'Quote revised and sent' : 'Quote sent' ) . ': ' . akrqt_money( $t['total'] ) . ( '' !== $lead ? ', ready in ' . $lead : '' ) . '. Valid until ' . wp_date( 'j M Y', $exp ) . ( $old_status !== 'quoted' ? '. Status changed from ' . ( akr_statuses()[ $old_status ] ?? $old_status ) . ' to Quoted' : '' ) . '.' );
	update_post_meta( $id, 'akrqt_last_status', 'quoted' );
	akrqt_send_status_email( $id, 'quote' );
	return '';
}

function akrq_front_url(): string {
	return function_exists( 'akr_frontend_url' ) ? akr_frontend_url() : '';
}

/** Takes a sent quote back: the old link stops working and the request goes back to In review. */
function akrqt_withdraw( int $id ): string {
	if ( in_array( akr_request_status( $id ), array( 'awaiting_payment', 'paid', 'in_production', 'ready', 'shipped', 'completed', 'refunded', 'returned' ), true ) ) {
		return 'This quote was already accepted, so it cannot be withdrawn. Cancel the request instead.';
	}
	if ( '' === (string) get_post_meta( $id, 'akr_quote_price', true ) ) {
		return 'There is no sent quote to withdraw.';
	}
	delete_post_meta( $id, 'akr_quote_price' ); // the signed link depends on the price, so it stops working
	delete_post_meta( $id, 'akr_quote_exp' );
	delete_post_meta( $id, 'akr_quote_sent' );
	update_post_meta( $id, 'akr_status', 'reviewing' );
	update_post_meta( $id, 'akrqt_last_status', 'reviewing' );
	akr_request_log( $id, 'Quote withdrawn. The link no longer works and the request is back In review.' );
	return '';
}

/* =====================================================================================
 * The request screen: quote box, customer details, shipping, email switch
 * ===================================================================================== */

add_action(
	'add_meta_boxes',
	function () {
		add_meta_box( 'akrqt_quote', 'Quote', 'akrqt_quote_box', 'akr_request', 'normal', 'high' );
		add_meta_box( 'akrqt_customer', 'Customer, job and delivery (edit)', 'akrqt_customer_box', 'akr_request', 'normal', 'default' );
		add_meta_box( 'akrqt_notify', 'Customer email and shipping', 'akrqt_notify_box', 'akr_request', 'side', 'high' );
	}
);

function akrqt_quote_box( $post ) {
	$id = (int) $post->ID;
	if ( ! akrqt_is_quotable( $id ) ) {
		echo '<p>Quotes can only be sent on quote requests.</p>';
		return;
	}
	wp_nonce_field( 'akrqt_box', 'akrqt_nonce' );
	echo '<input type="hidden" name="akrqt_post_id" value="' . $id . '">';
	$lines = akrqt_lines( $id );
	if ( ! $lines ) {
		$lines = array( array( 'label' => '', 'reason' => '', 'amount' => '' ) );
	}
	$sent  = (int) get_post_meta( $id, 'akr_quote_sent', true );
	$exp   = (int) get_post_meta( $id, 'akr_quote_exp', true );
	$price = (string) get_post_meta( $id, 'akr_quote_price', true );
	$order = akrqt_order( $id );
	echo '<style>.akrqt-l{display:grid;grid-template-columns:1.1fr 1.8fr 110px 32px;gap:6px;margin-bottom:6px}.akrqt-l input{width:100%;min-width:0}.akrqt-h{font-weight:600;color:#50575e}@media(max-width:700px){.akrqt-l{grid-template-columns:1fr}}</style>';
	echo '<p class="description">Each line says what you charge for and why. The customer sees these as "Why this price". Amounts are before GST; GST ' . esc_html( rtrim( rtrim( number_format( akrqt_gst_pct(), 2 ), '0' ), '.' ) ) . '% is added.</p>';
	echo '<div class="akrqt-l akrqt-h"><span>What</span><span>Why (the reason for the price)</span><span>Amount, &#8377;</span><span></span></div><div id="akrqt-lines">';
	foreach ( $lines as $i => $l ) {
		printf(
			'<div class="akrqt-l"><input type="text" name="akrqt_lines[%1$d][label]" value="%2$s" placeholder="Printing"><input type="text" name="akrqt_lines[%1$d][reason]" value="%3$s" placeholder="PLA+ black, 142 g, 6 h 40 min"><input type="number" step="0.01" min="0" name="akrqt_lines[%1$d][amount]" value="%4$s" placeholder="0.00"><button type="button" class="button-link akrqt-del" style="color:#b32d2e" aria-label="Remove line">&times;</button></div>',
			(int) $i,
			esc_attr( $l['label'] ),
			esc_attr( $l['reason'] ),
			esc_attr( '' === $l['amount'] ? '' : number_format( (float) $l['amount'], 2, '.', '' ) )
		);
	}
	echo '</div><p><button type="button" class="button" id="akrqt-add">+ Add line</button></p>';
	echo '<p><label><strong>Ready in</strong> (for example "5 working days")<br><input type="text" name="akrqt_lead" value="' . esc_attr( (string) ( get_post_meta( $id, 'akr_quote_lead_draft', true ) ?: get_post_meta( $id, 'akr_quote_lead', true ) ) ) . '" style="width:100%;max-width:360px"></label></p>';
	echo '<p><label><strong>Note to the customer</strong> (optional)<br><textarea name="akrqt_msg" rows="3" style="width:100%">' . esc_textarea( (string) get_post_meta( $id, 'akr_quote_msg', true ) ) . '</textarea></label></p>';
	echo '<p><button type="submit" class="button button-primary" name="akrqt_do" value="send">' . ( '' !== $price ? 'Send revised quote' : 'Send quote' ) . '</button> ';
	if ( '' !== $price && ! in_array( akr_request_status( $id ), array( 'awaiting_payment', 'paid', 'in_production', 'ready', 'shipped', 'completed', 'refunded', 'returned' ), true ) ) {
		echo '<button type="submit" class="button" style="color:#b32d2e;border-color:#b32d2e" name="akrqt_do" value="withdraw" onclick="return confirm(\'Withdraw the quote? The link the customer has stops working.\');">Withdraw quote</button>';
	}
	echo '</p>';
	echo '<p class="description">Sending emails the customer the price, the reasons and an Accept button. Update on the right only saves your lines.';
	if ( '' !== $price ) {
		echo '<br><b>Last sent ' . esc_html( wp_date( 'j M Y, g:i a', $sent ) ) . ': ' . esc_html( akrqt_money( $price ) ) . ', valid until ' . esc_html( wp_date( 'j M Y', $exp ) ) . '.</b>';
	}
	if ( $order ) {
		echo '<br><b>Order <a href="' . esc_url( admin_url( 'post.php?post=' . (int) $order->get_id() . '&action=edit' ) ) . '">#' . esc_html( $order->get_order_number() ) . '</a></b>: ' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . '.';
	}
	echo '</p>';
	?>
	<script>
	jQuery(function ($) {
		var n = <?php echo (int) count( $lines ); ?>;
		$('#akrqt-add').on('click', function () {
			$('#akrqt-lines').append('<div class="akrqt-l"><input type="text" name="akrqt_lines[' + n + '][label]" placeholder="What"><input type="text" name="akrqt_lines[' + n + '][reason]" placeholder="Why"><input type="number" step="0.01" min="0" name="akrqt_lines[' + n + '][amount]" placeholder="0.00"><button type="button" class="button-link akrqt-del" style="color:#b32d2e" aria-label="Remove line">&times;</button></div>');
			n++;
		});
		$('#akrqt-lines').on('click', '.akrqt-del', function () { $(this).closest('.akrqt-l').remove(); });
	});
	</script>
	<?php
}

function akrqt_customer_box( $post ) {
	$id = (int) $post->ID;
	if ( ! akrqt_is_quotable( $id ) ) {
		echo '<p>Not a quote request.</p>';
		return;
	}
	$f = function ( string $key, string $label, string $type = 'text' ) use ( $id ) {
		printf( '<p style="margin:0 0 8px"><label><strong>%s</strong><br><input type="%s" name="akrqt_f[%s]" value="%s" style="width:100%%"></label></p>', esc_html( $label ), esc_attr( $type ), esc_attr( $key ), esc_attr( (string) get_post_meta( $id, 'akr_' . $key, true ) ) );
	};
	echo '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 16px">';
	$f( 'name', 'Name' );
	$f( 'phone', 'Phone' );
	$f( 'email', 'Email', 'email' );
	$f( 'company', 'Company' );
	$f( 'gstin', 'Buyer GSTIN' );
	$f( 'job', 'Job' );
	$f( 'material', 'Material' );
	$f( 'quantity', 'Quantity' );
	$f( 'addr_1', 'Delivery address line 1' );
	$f( 'addr_2', 'Delivery address line 2' );
	$f( 'addr_city', 'City' );
	$f( 'addr_pin', 'PIN code' );
	echo '<p style="margin:0 0 8px"><label><strong>State</strong><br><select name="akrqt_f[addr_state]" style="width:100%"><option value="">Choose a state</option>';
	$states = function_exists( 'WC' ) && WC()->countries ? (array) WC()->countries->get_states( 'IN' ) : array();
	$cur    = (string) get_post_meta( $id, 'akr_addr_state', true );
	foreach ( $states as $code => $name ) {
		printf( '<option value="%s"%s>%s</option>', esc_attr( $code ), selected( $cur, $code, false ), esc_html( $name ) );
	}
	echo '</select></label></p></div>';
	echo '<p style="margin:8px 0 0"><label><strong>Notes</strong><br><textarea name="akrqt_f[notes]" rows="3" style="width:100%">' . esc_textarea( (string) get_post_meta( $id, 'akr_notes', true ) ) . '</textarea></label></p>';
	echo '<p class="description">Edit anything the customer got wrong, then press Update. The delivery address goes on the order and the GST invoice.</p>';
}

function akrqt_notify_box( $post ) {
	$id = (int) $post->ID;
	if ( ! akrqt_is_quotable( $id ) ) {
		echo '<p>Not a quote request.</p>';
		return;
	}
	echo '<p><label><input type="checkbox" name="akrqt_notify" value="1" checked> <strong>Email the customer when I change the status</strong></label></p>';
	echo '<p class="description">Every status has its own email (in review, awaiting payment, paid, in production, ready, shipped, completed, cancelled, refunded, returned). Untick to change a status quietly.</p><hr>';
	echo '<p><label><strong>If you set Paid by hand, paid via</strong><br><input type="text" name="akrqt_paid_via" value="" placeholder="UPI / bank transfer" style="width:100%"></label></p><hr>';
	echo '<p><strong>Shipping (used when you set Shipped)</strong></p>';
	$partners = function_exists( 'akr_delivery_partners' ) ? array_keys( akr_delivery_partners() ) : array();
	$cur      = (string) get_post_meta( $id, 'akrqt_partner', true );
	echo '<p><label>Delivery partner<br><select name="akrqt_partner" style="width:100%"><option value="">Choose</option>';
	foreach ( $partners as $p ) {
		printf( '<option value="%1$s"%2$s>%1$s</option>', esc_attr( $p ), selected( $cur, $p, false ) );
	}
	echo '</select></label></p>';
	echo '<p><label>Tracking ID<br><input type="text" name="akrqt_awb" value="' . esc_attr( (string) get_post_meta( $id, 'akrqt_awb', true ) ) . '" style="width:100%"></label></p>';
	echo '<p><label>Tracking link (optional)<br><input type="url" name="akrqt_track_url" value="' . esc_attr( (string) get_post_meta( $id, 'akrqt_track_url', true ) ) . '" style="width:100%"></label></p>';
	echo '<p><label>Expected delivery (optional)<br><input type="date" name="akrqt_eta" value="' . esc_attr( (string) get_post_meta( $id, 'akrqt_eta', true ) ) . '" style="width:100%"></label></p>';
}

/** Saves the customer fields, the shipping fields and the draft quote lines. */
function akrqt_save_fields( int $id ): void {
	if ( ! akrqt_is_quotable( $id ) ) {
		return;
	}
	if ( isset( $_POST['akrqt_f'] ) && is_array( $_POST['akrqt_f'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification -- checked by the caller.
		$in = wp_unslash( $_POST['akrqt_f'] ); // phpcs:ignore WordPress.Security.NonceVerification
		foreach ( array( 'name', 'phone', 'company', 'gstin', 'job', 'material', 'quantity', 'addr_1', 'addr_2', 'addr_city', 'addr_pin', 'addr_state' ) as $k ) {
			if ( isset( $in[ $k ] ) ) {
				update_post_meta( $id, 'akr_' . $k, sanitize_text_field( (string) $in[ $k ] ) );
			}
		}
		if ( isset( $in['email'] ) ) {
			update_post_meta( $id, 'akr_email', sanitize_email( (string) $in['email'] ) );
		}
		if ( isset( $in['notes'] ) ) {
			update_post_meta( $id, 'akr_notes', sanitize_textarea_field( (string) $in['notes'] ) );
		}
	}
	foreach ( array( 'akrqt_partner', 'akrqt_awb', 'akrqt_eta' ) as $k ) { // phpcs:ignore WordPress.Security.NonceVerification
		if ( isset( $_POST[ $k ] ) ) {
			update_post_meta( $id, $k, sanitize_text_field( wp_unslash( $_POST[ $k ] ) ) );
		}
	}
	if ( isset( $_POST['akrqt_track_url'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$url     = esc_url_raw( wp_unslash( $_POST['akrqt_track_url'] ) );
		$partner = (string) get_post_meta( $id, 'akrqt_partner', true );
		$awb     = (string) get_post_meta( $id, 'akrqt_awb', true );
		if ( '' === $url && '' !== $awb && '' !== $partner && function_exists( 'akr_delivery_partners' ) ) {
			$list = akr_delivery_partners();
			if ( ! empty( $list[ $partner ] ) ) {
				$url = esc_url_raw( str_replace( '{id}', rawurlencode( $awb ), $list[ $partner ] ) );
			}
		}
		update_post_meta( $id, 'akrqt_track_url', $url );
	}
	if ( isset( $_POST['akrqt_lines'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		update_post_meta( $id, 'akr_quote_lines', akrqt_clean_lines( wp_unslash( $_POST['akrqt_lines'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput
		if ( isset( $_POST['akrqt_lead'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			update_post_meta( $id, 'akr_quote_lead_draft', sanitize_text_field( wp_unslash( $_POST['akrqt_lead'] ) ) );
		}
	}
}

/** A message for the studio, shown once on the next request screen. */
function akrqt_notice( bool $ok, string $text ): void {
	set_transient( 'akrqt_notice_' . get_current_user_id(), array( 'ok' => $ok, 'text' => $text ), 120 );
}

add_action(
	'admin_notices',
	function () {
		$n = get_transient( 'akrqt_notice_' . get_current_user_id() );
		if ( is_array( $n ) ) {
			delete_transient( 'akrqt_notice_' . get_current_user_id() );
			echo '<div class="notice ' . ( $n['ok'] ? 'notice-success' : 'notice-error' ) . ' is-dismissible"><p>' . esc_html( (string) $n['text'] ) . '</p></div>';
		}
		if ( isset( $_GET['akrq'] ) && 'withdrawn' === $_GET['akrq'] ) { // phpcs:ignore WordPress.Security.NonceVerification
			echo '<div class="notice notice-success is-dismissible"><p>Quote withdrawn. The customer\'s link no longer works.</p></div>';
		}
		if ( isset( $_GET['akrqt'] ) && 'created' === $_GET['akrqt'] ) { // phpcs:ignore WordPress.Security.NonceVerification
			echo '<div class="notice notice-success is-dismissible"><p>Quote request created. Add the quote lines below and press Send quote.</p></div>';
		}
	}
);

/* =====================================================================================
 * Add a quote request by hand (phone, WhatsApp, walk-in)
 * ===================================================================================== */

add_action(
	'admin_menu',
	function () {
		add_submenu_page( 'edit.php?post_type=akr_request', 'Add quote request', 'Add quote request', 'edit_posts', 'akrqt-add', 'akrqt_add_page' );
	}
);

function akrqt_add_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	echo '<div class="wrap"><h1>Add a quote request</h1><p>For a customer who asked by phone, WhatsApp or in person. After you save, you add the quote lines and send the quote from the request.</p>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php?action=akrqt_create' ) ) . '" style="max-width:720px">';
	wp_nonce_field( 'akrqt_create', 'akrqt_create_nonce' );
	$f = function ( string $key, string $label, string $type = 'text', bool $req = false ) {
		printf( '<p><label><strong>%s%s</strong><br><input type="%s" name="%s" class="regular-text" style="width:100%%"%s></label></p>', esc_html( $label ), $req ? ' *' : '', esc_attr( $type ), esc_attr( $key ), $req ? ' required' : '' );
	};
	$f( 'name', 'Customer name', 'text', true );
	$f( 'phone', 'Phone', 'text', true );
	$f( 'email', 'Email (needed to send the quote)', 'email' );
	$f( 'company', 'Company' );
	$f( 'gstin', 'Buyer GSTIN' );
	$f( 'job', 'What they want printed' );
	$f( 'material', 'Material' );
	$f( 'quantity', 'Quantity' );
	echo '<p><label><strong>Notes</strong><br><textarea name="notes" rows="4" style="width:100%"></textarea></label></p>';
	echo '<p><label><input type="checkbox" name="notify" value="1" checked> Email the customer that we have their request (needs an email)</label></p>';
	echo '<p><button class="button button-primary" type="submit">Create request</button></p></form></div>';
}

add_action(
	'admin_post_akrqt_create',
	function () {
		if ( ! current_user_can( 'edit_posts' ) || ! isset( $_POST['akrqt_create_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrqt_create_nonce'] ) ), 'akrqt_create' ) ) {
			wp_die( 'Not allowed.', '', array( 'response' => 403 ) );
		}
		$g     = function ( string $k, string $kind = 'text' ) {
			$v = isset( $_POST[ $k ] ) ? wp_unslash( $_POST[ $k ] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput
			return 'email' === $kind ? sanitize_email( (string) $v ) : ( 'area' === $kind ? sanitize_textarea_field( (string) $v ) : sanitize_text_field( (string) $v ) );
		};
		$name  = $g( 'name' );
		$phone = $g( 'phone' );
		if ( '' === $name || '' === $phone ) {
			wp_die( 'Name and phone are needed. Go back and fill them in.' );
		}
		$job = $g( 'job' );
		$id  = wp_insert_post( array( 'post_type' => 'akr_request', 'post_status' => 'publish', 'post_title' => 'Custom quote: ' . $name . ( '' !== $job ? ' (' . $job . ')' : '' ) ) );
		if ( is_wp_error( $id ) || ! $id ) {
			wp_die( 'The request could not be saved.' );
		}
		foreach ( array( 'name' => $name, 'phone' => $phone, 'email' => $g( 'email', 'email' ), 'company' => $g( 'company' ), 'gstin' => $g( 'gstin' ), 'job' => $job, 'material' => $g( 'material' ), 'quantity' => $g( 'quantity' ), 'notes' => $g( 'notes', 'area' ) ) as $k => $v ) {
			update_post_meta( $id, 'akr_' . $k, $v );
		}
		update_post_meta( $id, 'akr_kind', 'custom' );
		update_post_meta( $id, 'akr_status', 'new' );
		update_post_meta( $id, 'akrqt_last_status', 'new' );
		update_post_meta( $id, 'akr_created_by_hand', get_current_user_id() );
		akr_request_log( $id, 'Created by hand in WordPress.' );
		if ( ! empty( $_POST['notify'] ) && is_email( $g( 'email', 'email' ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			akrqt_send_status_email( $id, 'new' );
		}
		wp_safe_redirect( add_query_arg( array( 'post' => $id, 'action' => 'edit', 'akrqt' => 'created' ), admin_url( 'post.php' ) ) );
		exit;
	}
);

// Deleting a request for good also removes its unpaid order, so no payment link is left open.
add_action(
	'before_delete_post',
	function ( $post_id ) {
		if ( 'akr_request' !== get_post_type( $post_id ) ) {
			return;
		}
		$order = akrqt_order( (int) $post_id );
		if ( $order && in_array( $order->get_status(), array( 'pending', 'on-hold' ), true ) ) {
			$GLOBALS['akrq_skip_cancel'] = true; // an internal change: no cancel email to the customer
			$order->update_status( 'cancelled', 'The quote request was deleted.' );
			unset( $GLOBALS['akrq_skip_cancel'] );
		}
	},
	5
);
