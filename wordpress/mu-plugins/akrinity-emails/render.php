<?php
/**
 * Builds the Akrinity order emails (the lime poster design): header, order tracker, order card with product
 * photos, "more from this category" and footer. Used by akrinity-emails.php. Plain functions, no WooCommerce
 * template files, so the whole design lives in this one file.
 */

defined( 'ABSPATH' ) || exit;

/* ---------- small helpers ---------- */

function akr_em_c(): array {
	return array(
		'ink'    => '#0B0B0C',
		'paper'  => '#F3F1EA',
		'white'  => '#FFFFFF',
		'lime'   => '#D8FF3A',
		'muted'  => '#55514A',
		'line'   => '#D9D5C8',
		'stage'  => '#E9E6DC',
		'grey'   => '#8A857A',
		'body'   => "Inter,'Segoe UI',Helvetica,Arial,sans-serif",
		'disp'   => "Anton,Impact,'Arial Narrow Bold',Arial,sans-serif",
	);
}

/** "₹729.00" from a number. */
function akr_em_money( $n ): string {
	return html_entity_decode( wp_strip_all_tags( wc_price( (float) $n, array( 'currency' => 'INR' ) ) ), ENT_QUOTES, 'UTF-8' );
}

function akr_em_front(): string {
	return function_exists( 'akr_frontend_url' ) && '' !== akr_frontend_url() ? akr_frontend_url() : home_url();
}

function akr_em_p( string $html, string $extra = '' ): string {
	$c = akr_em_c();
	return '<p style="margin:0 0 14px;font-family:' . $c['body'] . ';font-size:16px;line-height:1.55;color:' . $c['ink'] . ';' . $extra . '">' . $html . '</p>';
}

function akr_em_small( string $html ): string {
	$c = akr_em_c();
	return '<div style="font-family:' . $c['body'] . ';font-size:13px;line-height:1.5;color:' . $c['muted'] . ';">' . $html . '</div>';
}

function akr_em_btn( string $label, string $href, string $style = 'ink', string $size = 'lg' ): string {
	$c   = akr_em_c();
	$bg  = array( 'ink' => $c['ink'], 'lime' => $c['lime'], 'white' => $c['white'] );
	$fg  = array( 'ink' => $c['lime'], 'lime' => $c['ink'], 'white' => $c['ink'] );
	$pad = 'sm' === $size ? '9px 18px' : '14px 26px';
	$fs  = 'sm' === $size ? '13px' : '15px';
	return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 12px 6px 0;display:inline-table"><tr><td bgcolor="' . $bg[ $style ] . '" style="border-radius:999px;border:1.5px solid ' . $c['ink'] . ';">' .
		'<a href="' . esc_url( $href ) . '" style="display:inline-block;padding:' . $pad . ';font-family:' . $c['body'] . ';font-size:' . $fs . ';font-weight:700;color:' . $fg[ $style ] . ';text-decoration:none;">' . esc_html( $label ) . '</a></td></tr></table>';
}

/** A word on a black label, as in the headings. */
function akr_em_hl( string $word ): string {
	$c = akr_em_c();
	return '<span style="background:' . $c['ink'] . ';color:' . $c['lime'] . ';padding:0 8px;">' . esc_html( $word ) . '</span>';
}

function akr_em_title( string $html ): string {
	$c = akr_em_c();
	return '<div class="d" style="font-family:' . $c['disp'] . ';font-size:26px;line-height:1.1;text-transform:uppercase;color:' . $c['ink'] . ';padding-bottom:6px;">' . $html . '</div>';
}

function akr_em_card_style(): string {
	$c = akr_em_c();
	return 'background:' . $c['paper'] . ';border:1.5px solid ' . $c['ink'] . ';border-radius:18px;';
}

function akr_em_row( string $label, string $value, bool $strong = false ): string {
	$c = akr_em_c();
	return '<tr><td style="padding:5px 0;font-family:' . $c['body'] . ';font-size:14.5px;color:' . ( $strong ? $c['ink'] : $c['muted'] ) . ';' . ( $strong ? 'font-weight:700;' : '' ) . '">' . $label . '</td>' .
		'<td align="right" style="padding:5px 0;font-family:' . $c['body'] . ';font-size:14.5px;color:' . $c['ink'] . ';font-weight:' . ( $strong ? '700' : '500' ) . ';">' . $value . '</td></tr>';
}

function akr_em_steps( array $items ): string {
	$c   = akr_em_c();
	$out = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
	foreach ( array_values( $items ) as $i => $t ) {
		$out .= '<tr><td width="34" valign="top" style="padding:6px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="26" height="26" bgcolor="' . $c['ink'] . '" style="border-radius:13px;font-family:' . $c['disp'] . ';font-size:13px;color:' . $c['lime'] . ';width:26px;height:26px;" class="d">' . ( $i + 1 ) . '</td></tr></table></td>' .
			'<td valign="top" style="padding:7px 0;font-family:' . $c['body'] . ';font-size:15px;line-height:1.5;color:' . $c['ink'] . ';">' . $t . '</td></tr>';
	}
	return $out . '</table>';
}

function akr_em_two_col( string $a_title, string $a_body, string $b_title, string $b_body ): string {
	$c    = akr_em_c();
	$cell = function ( $t, $b ) use ( $c ) {
		return '<td class="stack" width="50%" valign="top" style="padding:0 8px 0 0;"><div style="font-family:' . $c['body'] . ';font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $c['muted'] . ';padding-bottom:6px;">' . $t . '</div>' .
			'<div style="font-family:' . $c['body'] . ';font-size:14.5px;line-height:1.55;color:' . $c['ink'] . ';">' . $b . '</div></td>';
	};
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $cell( $a_title, $a_body ) . $cell( $b_title, $b_body ) . '</tr></table>';
}

/* ---------- order data ---------- */

function akr_em_status_step( WC_Order $o ): int {
	switch ( $o->get_status() ) {
		case 'completed':
			return 4;
		case 'in-transit':
			return 3;
		case 'processing':
			return 2;
		default:
			return 1;
	}
}

function akr_em_date( $ts, string $fmt = 'j M' ): string {
	return $ts ? wp_date( $fmt, (int) $ts ) : '';
}

/** Estimated delivery as a timestamp: the date typed on the order, else worked out from the dates and the settings. */
function akr_em_eta( WC_Order $o ): int {
	$typed = (string) $o->get_meta( '_akr_eta' );
	if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $typed ) ) {
		return (int) strtotime( $typed . ' 12:00:00' );
	}
	$days    = function_exists( 'akr_delivery_days' ) ? akr_delivery_days() : 5;
	$print   = function_exists( 'akr_print_days' ) ? akr_print_days() : 2;
	$shipped = (int) $o->get_meta( '_akr_shipped_at' );
	$from    = $shipped ? $shipped : ( $o->get_date_created() ? $o->get_date_created()->getTimestamp() : time() );
	$total   = $shipped ? $days : $print + $days;
	return function_exists( 'akr_add_working_days' ) ? akr_add_working_days( $from, $total ) : $from + $total * DAY_IN_SECONDS;
}

function akr_em_item_image( $item ): string {
	$product = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
	$id      = $product ? $product->get_image_id() : 0;
	$url     = $id ? wp_get_attachment_image_url( $id, 'woocommerce_thumbnail' ) : '';
	return $url ? $url : ( function_exists( 'wc_placeholder_img_src' ) ? wc_placeholder_img_src( 'woocommerce_thumbnail' ) : '' );
}

function akr_em_item_options( $item ): string {
	$parts = array();
	foreach ( $item->get_formatted_meta_data( '_', true ) as $m ) {
		$value = wp_strip_all_tags( (string) $m->display_value );
		if ( 'Made to order' === $m->key && 'Yes' === $value ) {
			$parts[] = 'Made to order';
		} elseif ( 'Options' === $m->key ) {
			$parts[] = $value;
		} else {
			$parts[] = wp_strip_all_tags( (string) $m->display_key ) . ': ' . $value;
		}
	}
	return implode( ' · ', array_filter( $parts ) );
}

/* ---------- pieces ---------- */

function akr_em_layers(): string {
	$c   = akr_em_c();
	$out = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
	foreach ( array( '46%', '64%', '82%', '100%' ) as $w ) {
		$out .= '<tr><td style="font-size:0;line-height:0;padding:0 0 3px;"><table role="presentation" width="' . $w . '" cellpadding="0" cellspacing="0"><tr><td bgcolor="' . $c['ink'] . '" height="9" style="font-size:0;line-height:0;height:9px;">&nbsp;</td></tr></table></td></tr>';
	}
	return $out . '</table>';
}

/** The four-step order tracker. $current is 1 to 4; $steps is a list of array( label, when ). */
function akr_em_track( int $current, array $steps ): string {
	$c = akr_em_c();
	$n = count( $steps );
	$w = (int) floor( 100 / max( 1, $n ) );
	$seg = function ( $color ) {
		return '<td width="50%" valign="middle" style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="4" bgcolor="' . $color . '" style="height:4px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td>';
	};
	$gap  = '<td width="50%" style="padding:0;font-size:0;line-height:0;">&nbsp;</td>';
	$cols = '';
	foreach ( array_values( $steps ) as $i => $s ) {
		$k     = $i + 1;
		$done  = $k < $current;
		$now   = $k === $current;
		$left  = 0 === $i ? $gap : $seg( $k <= $current ? $c['ink'] : $c['line'] );
		$right = $n - 1 === $i ? $gap : $seg( $k < $current ? $c['ink'] : $c['line'] );
		if ( $done ) {
			$circle = '<td align="center" valign="middle" width="34" height="34" bgcolor="' . $c['ink'] . '" style="width:34px;height:34px;border-radius:17px;border:2px solid ' . $c['ink'] . ';font-family:' . $c['body'] . ';font-size:16px;font-weight:700;color:' . $c['lime'] . ';">&#10003;</td>';
		} elseif ( $now ) {
			$circle = '<td align="center" valign="middle" width="34" height="34" bgcolor="' . $c['lime'] . '" style="width:34px;height:34px;border-radius:17px;border:2px solid ' . $c['ink'] . ';font-family:' . $c['body'] . ';font-size:15px;font-weight:700;color:' . $c['ink'] . ';">' . $k . '</td>';
		} else {
			$circle = '<td align="center" valign="middle" width="34" height="34" bgcolor="' . $c['white'] . '" style="width:34px;height:34px;border-radius:17px;border:2px solid ' . $c['line'] . ';font-family:' . $c['body'] . ';font-size:15px;font-weight:600;color:' . $c['grey'] . ';">' . $k . '</td>';
		}
		$cols .= '<td width="' . $w . '%" valign="top" align="center" style="padding:0 2px;">' .
			'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $left . '<td width="40" style="padding:0;width:40px;min-width:40px;"><table role="presentation" width="34" cellpadding="0" cellspacing="0" align="center" style="width:34px;min-width:34px;"><tr>' . $circle . '</tr></table></td>' . $right . '</tr></table>' .
			'<div style="font-family:' . $c['body'] . ';font-size:13px;font-weight:' . ( $now ? '800' : '600' ) . ';color:' . ( $k <= $current ? $c['ink'] : $c['grey'] ) . ';padding-top:10px;">' . esc_html( $s[0] ) . '</div>' .
			'<div style="font-family:' . $c['body'] . ';font-size:11.5px;line-height:1.4;color:' . $c['muted'] . ';padding-top:2px;">' . ( '' !== (string) $s[1] ? esc_html( $s[1] ) : '&nbsp;' ) . '</div></td>';
	}
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $cols . '</tr></table>';
}

/** The tracker for an order, with real dates where they are known. */
function akr_em_order_track( WC_Order $o, ?int $step = null ): string {
	$step    = $step ?? akr_em_status_step( $o );
	$created = $o->get_date_created() ? $o->get_date_created()->getTimestamp() : 0;
	$shipped = (int) $o->get_meta( '_akr_shipped_at' );
	$done_at = $o->get_date_completed() ? $o->get_date_completed()->getTimestamp() : 0;
	$eta     = akr_em_eta( $o );

	$printing = '';
	if ( $step > 2 ) {
		$printing = 'Done';
	} elseif ( 2 === $step ) {
		$printing = 'Now';
	}
	$ship = '';
	if ( $shipped && $step >= 3 ) {
		$ship = wp_date( 'j M', $shipped );
	} elseif ( 3 === $step ) {
		$ship = 'Now';
	}
	$arrive = '';
	if ( 4 === $step && $done_at ) {
		$arrive = wp_date( 'j M', $done_at );
	} elseif ( $step >= 2 ) {
		$arrive = 'By ' . wp_date( 'j M', $eta );
	}
	return akr_em_track(
		$step,
		array(
			array( 'Order placed', $created ? wp_date( 'j M, g:i a', $created ) : '' ),
			array( 'Printing', $printing ),
			array( 'Shipped', $ship ),
			array( 'Delivered', $arrive ),
		)
	);
}

/** The "Right now" card under the tracker. */
function akr_em_now_card( string $title, string $text, ?array $eta = null ): string {
	$c   = akr_em_c();
	$out = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:16px 20px;">' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="top" class="stack">' .
		'<div style="font-family:' . $c['body'] . ';font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $c['muted'] . ';">Right now</div>' .
		'<div class="d" style="font-family:' . $c['disp'] . ';font-size:24px;line-height:1.15;text-transform:uppercase;color:' . $c['ink'] . ';padding:4px 0;">' . esc_html( $title ) . '</div>' .
		'<div style="font-family:' . $c['body'] . ';font-size:14.5px;line-height:1.5;color:' . $c['ink'] . ';">' . $text . '</div></td>';
	if ( $eta ) {
		$out .= '<td class="stack" valign="top" align="right" width="170" style="padding-left:14px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="' . $c['lime'] . '" style="border:1.5px solid ' . $c['ink'] . ';border-radius:14px;padding:10px 14px;">' .
			'<div style="font-family:' . $c['body'] . ';font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . $c['ink'] . ';">' . esc_html( $eta[0] ) . '</div>' .
			'<div class="d" style="font-family:' . $c['disp'] . ';font-size:22px;line-height:1.15;text-transform:uppercase;color:' . $c['ink'] . ';padding-top:2px;">' . esc_html( $eta[1] ) . '</div></td></tr></table></td>';
	}
	return $out . '</tr></table></td></tr></table>';
}

/** The order: every item with its photo, then the totals and the GST already inside the total. */
function akr_em_order_card( WC_Order $o, bool $hide_fee = false ): string {
	$c        = akr_em_c();
	$items    = '';
	$subtotal = 0.0;
	foreach ( $o->get_items() as $item ) {
		$subtotal += (float) $item->get_subtotal() + (float) $item->get_subtotal_tax();
		$line      = (float) $item->get_total() + (float) $item->get_total_tax();
		$img       = akr_em_item_image( $item );
		$opts      = akr_em_item_options( $item );
		$items    .= '<tr><td width="84" valign="top" style="padding:14px 14px 14px 0;border-bottom:1.5px solid ' . $c['line'] . ';">' .
			( $img ? '<img src="' . esc_url( $img ) . '" width="84" height="84" alt="" style="display:block;width:84px;height:84px;border-radius:12px;border:1.5px solid ' . $c['ink'] . ';background:#ffffff;">' : '' ) . '</td>' .
			'<td valign="top" style="padding:14px 0;border-bottom:1.5px solid ' . $c['line'] . ';"><div style="font-family:' . $c['body'] . ';font-size:15px;line-height:1.35;font-weight:700;color:' . $c['ink'] . ';">' . esc_html( $item->get_name() ) . '</div>' .
			'<div style="font-family:' . $c['body'] . ';font-size:13px;line-height:1.45;color:' . $c['muted'] . ';padding-top:4px;">' . ( '' !== $opts ? esc_html( $opts ) . '<br>' : '' ) . 'Qty ' . (int) $item->get_quantity() . '</div>' .
			'<div style="font-family:' . $c['body'] . ';font-size:16px;font-weight:700;color:' . $c['ink'] . ';padding-top:6px;">' . esc_html( akr_em_money( $line ) ) . '</div></td></tr>';
	}
	$rows  = akr_em_row( 'Subtotal', esc_html( akr_em_money( $subtotal ) ) );
	$disc  = (float) $o->get_discount_total() + (float) $o->get_discount_tax();
	if ( $disc > 0 ) {
		$rows .= akr_em_row( 'Discount', '−' . esc_html( akr_em_money( $disc ) ) );
	}
	$ship  = (float) $o->get_shipping_total() + (float) $o->get_shipping_tax();
	$rows .= akr_em_row( 'Delivery', $ship > 0 ? esc_html( akr_em_money( $ship ) ) : 'Free' );
	if ( ! $hide_fee ) {
		foreach ( $o->get_fees() as $f ) {
			$rows .= akr_em_row( esc_html( $f->get_name() ), esc_html( akr_em_money( (float) $f->get_total() + (float) $f->get_total_tax() ) ) );
		}
	}
	$rows .= '<tr><td colspan="2" style="padding-top:6px;"><div style="border-top:1.5px solid ' . $c['ink'] . ';font-size:0;line-height:0;">&nbsp;</div></td></tr>' . akr_em_row( 'Total', esc_html( akr_em_money( $o->get_total() ) ), true );
	$gst   = array();
	foreach ( $o->get_tax_totals() as $t ) {
		$gst[] = esc_html( $t->label ) . ' ' . esc_html( akr_em_money( $t->amount ) );
	}
	$date = $o->get_date_created() ? wp_date( 'j M Y', $o->get_date_created()->getTimestamp() ) : '';
	return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:20px 24px;">' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="d" style="font-family:' . $c['disp'] . ';font-size:24px;text-transform:uppercase;color:' . $c['ink'] . ';">Order #' . esc_html( $o->get_order_number() ) . '</td>' .
		'<td align="right" style="font-family:' . $c['body'] . ';font-size:13px;color:' . $c['muted'] . ';">' . esc_html( $date ) . '</td></tr></table>' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $items . '</table>' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">' . $rows . '</table>' .
		'<div style="font-family:' . $c['body'] . ';font-size:12.5px;color:' . $c['muted'] . ';padding-top:8px;">' . ( $gst ? 'Includes GST: ' . implode( ', ', $gst ) . '. ' : '' ) . 'Prices include GST.</div></td></tr></table>';
}

function akr_em_address_block( WC_Order $o ): string {
	$addr = $o->get_formatted_shipping_address( $o->get_formatted_billing_address() );
	$html = '<b>' . esc_html( trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ) ) . '</b><br>' . wp_kses( $addr, array( 'br' => array() ) );
	if ( $o->get_billing_phone() ) {
		$html .= '<br>' . esc_html( $o->get_billing_phone() );
	}
	return $html;
}

function akr_em_payment_block( WC_Order $o ): string {
	if ( 'cod' === $o->get_payment_method() ) {
		return esc_html( $o->get_payment_method_title() ) . '<br>' . esc_html( akr_em_money( $o->get_total() ) ) . ' due on delivery';
	}
	return esc_html( $o->get_payment_method_title() ) . '<br>' . ( $o->is_paid() ? 'Paid' : 'Not paid yet' );
}

/** The category the order belongs to: the first real category of the first item that has one. */
function akr_em_order_category( WC_Order $o ): ?WP_Term {
	foreach ( $o->get_items() as $item ) {
		$product = is_callable( array( $item, 'get_product' ) ) ? $item->get_product() : null;
		if ( ! $product ) {
			continue;
		}
		$pid   = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
		$terms = get_the_terms( $pid, 'product_cat' );
		if ( ! is_array( $terms ) ) {
			continue;
		}
		$best = null;
		foreach ( $terms as $t ) {
			if ( 'uncategorized' === $t->slug ) {
				continue;
			}
			// The most specific category (a child) wins.
			if ( ! $best || ( $t->parent && ! $best->parent ) ) {
				$best = $t;
			}
		}
		if ( $best ) {
			return $best;
		}
	}
	return null;
}

/** Three in-stock products from the order's category, never one already in the order. Fills up from the parent category, then the newest products. */
function akr_em_upsell_products( WC_Order $o, ?WP_Term $cat ): array {
	$bought = array();
	foreach ( $o->get_items() as $item ) {
		$bought[] = is_callable( array( $item, 'get_product_id' ) ) ? (int) $item->get_product_id() : 0;
	}
	$found = array();
	$take  = function ( array $args ) use ( &$found, $bought ) {
		$args += array(
			'status'       => 'publish',
			'stock_status' => 'instock',
			'limit'        => 6,
			'exclude'      => array_merge( $bought, array_keys( $found ) ),
			'orderby'      => 'date',
			'order'        => 'DESC',
		);
		foreach ( wc_get_products( $args ) as $p ) {
			if ( count( $found ) < 3 && $p->get_image_id() ) {
				$found[ $p->get_id() ] = $p;
			}
		}
	};
	if ( $cat ) {
		$take( array( 'category' => array( $cat->slug ) ) );
		if ( count( $found ) < 3 && $cat->parent ) {
			$parent = get_term( $cat->parent, 'product_cat' );
			if ( $parent && ! is_wp_error( $parent ) ) {
				$take( array( 'category' => array( $parent->slug ) ) );
			}
		}
	}
	if ( count( $found ) < 3 ) {
		$take( array() );
	}
	return array_values( $found );
}

/** "More from [category]": three product cards and a link to the whole category. */
function akr_em_upsell( WC_Order $o, string $lead = '' ): string {
	$c        = akr_em_c();
	$cat      = akr_em_order_category( $o );
	$products = akr_em_upsell_products( $o, $cat );
	if ( count( $products ) < 2 ) {
		return '';
	}
	$front = akr_em_front();
	$cards = '';
	foreach ( $products as $i => $p ) {
		$img    = wp_get_attachment_image_url( $p->get_image_id(), 'woocommerce_thumbnail' );
		$cards .= '<td class="stack" width="33%" valign="top" style="padding:0 ' . ( $i < count( $products ) - 1 ? '8px' : '0' ) . ' 0 0;">' .
			'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . 'border-radius:16px;"><tr><td style="padding:0;">' .
			'<a href="' . esc_url( $front . '/product/' . $p->get_slug() ) . '"><img src="' . esc_url( (string) $img ) . '" width="170" alt="" style="display:block;width:100%;height:auto;border-radius:14px 14px 0 0;border-bottom:1.5px solid ' . $c['ink'] . ';background:#ffffff;"></a>' .
			'<div style="padding:12px 14px 14px;"><div style="font-family:' . $c['body'] . ';font-size:14px;line-height:1.35;font-weight:700;color:' . $c['ink'] . ';height:38px;overflow:hidden;">' . esc_html( preg_replace( '/^Akrinity\s+/i', '', $p->get_name() ) ) . '</div>' .
			'<div style="font-family:' . $c['body'] . ';font-size:13px;color:' . $c['muted'] . ';padding:6px 0 8px;">' . esc_html( akr_em_money( wc_get_price_including_tax( $p ) ) ) . ' incl. GST</div>' .
			akr_em_btn( 'View', $front . '/product/' . $p->get_slug(), 'ink', 'sm' ) . '</div></td></tr></table></td>';
	}
	$name  = $cat ? html_entity_decode( $cat->name, ENT_QUOTES, 'UTF-8' ) : '';
	$title = $name ? 'More from ' . esc_html( $name ) : 'You might also like';
	$lead  = '' !== $lead ? $lead : ( $name ? 'Picked from the same collection as your order.' : 'A few more prints from the studio.' );
	$link  = $cat ? $front . '/shop/' . ( $cat->parent && ( $par = get_term( $cat->parent, 'product_cat' ) ) && ! is_wp_error( $par ) ? $par->slug . '/' : '' ) . $cat->slug : $front . '/shop';
	return akr_em_title( $title ) . '<div style="font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';padding-bottom:12px;">' . esc_html( $lead ) . '</div>' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $cards . '</tr></table>' .
		'<div style="padding-top:12px;font-family:' . $c['body'] . ';font-size:14px;"><a href="' . esc_url( $link ) . '" style="color:' . $c['ink'] . ';font-weight:700;text-decoration:underline;">' . ( $name ? 'See all ' . esc_html( strtolower( $name ) ) : 'See all products' ) . ' &rarr;</a></div>';
}

/* ---------- the shell: the lime poster ---------- */

/**
 * $o: tag, title (HTML), intro (HTML), blocks (list of HTML), help (HTML), head (right side of the top bar), pre (preview text).
 */
function akr_em_shell( array $o ): string {
	$c     = akr_em_c();
	$parts = array();
	$parts[] = '<tr><td bgcolor="' . $c['lime'] . '" class="pad" style="padding:22px 32px 0;border-radius:18px 18px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' .
		'<td class="d" style="font-family:' . $c['disp'] . ';font-size:30px;letter-spacing:.5px;color:' . $c['ink'] . ';text-transform:uppercase;">AKRINITY<span>&nbsp;&#9679;</span></td>' .
		'<td align="right" style="font-family:' . $c['body'] . ';font-size:13px;font-weight:600;color:' . $c['ink'] . ';">' . ( $o['head'] ?? '' ) . '</td></tr></table></td></tr>';
	$parts[] = '<tr><td bgcolor="' . $c['lime'] . '" class="pad" style="padding:30px 32px 26px;">' .
		'<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="' . $c['ink'] . '" style="border-radius:999px;border:1.5px solid ' . $c['ink'] . ';padding:5px 14px;font-family:' . $c['body'] . ';font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:' . $c['lime'] . ';">' . esc_html( $o['tag'] ) . '</td></tr></table>' .
		'<h1 class="d h1" style="margin:18px 0 14px;font-family:' . $c['disp'] . ';font-size:64px;line-height:1.02;font-weight:400;text-transform:uppercase;color:' . $c['ink'] . ';">' . $o['title'] . '</h1>' .
		( ! empty( $o['intro'] ) ? akr_em_p( $o['intro'], 'max-width:480px;' ) : '' ) . '</td></tr>';
	$parts[] = '<tr><td bgcolor="' . $c['lime'] . '" style="font-size:0;line-height:0;">' . akr_em_layers() . '</td></tr>';
	$parts[] = '<tr><td bgcolor="' . $c['white'] . '" style="font-size:0;line-height:0;height:26px;">&nbsp;</td></tr>';
	foreach ( (array) ( $o['blocks'] ?? array() ) as $b ) {
		if ( '' !== $b ) {
			$parts[] = '<tr><td bgcolor="' . $c['white'] . '" class="pad" style="padding:0 32px 26px;">' . $b . '</td></tr>';
		}
	}
	$front = akr_em_front();
	$links = array(
		'Track an order' => $front . '/track-order',
		'Shipping'       => $front . '/shipping',
		'Returns'        => $front . '/returns',
		'Contact'        => $front . '/contact',
	);
	$nav = array();
	foreach ( $links as $label => $url ) {
		$nav[] = '<a href="' . esc_url( $url ) . '" style="color:' . $c['lime'] . ';text-decoration:underline;">' . esc_html( $label ) . '</a>';
	}
	$whatsapp = defined( 'AKRINITY_WHATSAPP' ) && AKRINITY_WHATSAPP ? esc_html( AKRINITY_WHATSAPP ) : '[WhatsApp number]';
	$gstin    = defined( 'AKRINITY_GSTIN' ) && AKRINITY_GSTIN ? esc_html( AKRINITY_GSTIN ) : '[YOUR GSTIN]';
	$site     = preg_replace( '#^https?://#', '', $front );
	$help     = ! empty( $o['help'] ) ? $o['help'] : 'Questions about your order? Reply to this email or message us on WhatsApp at ' . $whatsapp . '.';
	$parts[]  = '<tr><td bgcolor="' . $c['ink'] . '" class="pad" style="padding:28px 32px;border-radius:0 0 18px 18px;">' .
		'<div style="font-family:' . $c['body'] . ';font-size:15px;line-height:1.55;color:#F3F1EA;">' . $help . '</div>' .
		'<div style="padding-top:14px;font-family:' . $c['body'] . ';font-size:13px;line-height:1.9;">' . implode( ' &nbsp;·&nbsp; ', $nav ) . '</div>' .
		'<div style="padding-top:16px;border-top:1px solid #34343A;margin-top:16px;font-family:' . $c['body'] . ';font-size:12px;line-height:1.6;color:#B8B4A8;">Akrinity · 3D printing from Mumbai, India · GSTIN ' . $gstin . '<br>Prices include GST. You are getting this because of your activity on ' . esc_html( $site ) . '.</div></td></tr>';

	return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">' .
		'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap">' .
		'<style>body{margin:0;padding:0;background:' . $c['stage'] . ';-webkit-text-size-adjust:100%}table{border-collapse:separate}a{color:inherit}' .
		'@media (max-width:480px){.pad{padding-left:20px!important;padding-right:20px!important}.h1{font-size:44px!important}.stack{display:block!important;width:100%!important;padding:0 0 14px!important}}</style></head>' .
		'<body><div style="display:none;max-height:0;overflow:hidden;color:' . $c['stage'] . ';">' . esc_html( $o['pre'] ?? '' ) . '</div>' .
		'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="' . $c['stage'] . '"><tr><td align="center" style="padding:24px 10px;">' .
		'<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">' . implode( '', $parts ) . '</table></td></tr></table></body></html>';
}

/* ---------- the emails ---------- */

function akr_em_first_name( WC_Order $o ): string {
	$n = trim( $o->get_billing_first_name() );
	return '' !== $n ? $n : 'there';
}

function akr_em_whatsapp(): string {
	return defined( 'AKRINITY_WHATSAPP' ) && AKRINITY_WHATSAPP ? esc_html( AKRINITY_WHATSAPP ) : '[WhatsApp number]';
}

/**
 * Builds one email. $kind is one of: confirmed, shipped, completed, pending, failed, refunded, note, welcome,
 * reset, neworder, cancelled. $a holds what that email needs (the order, the note, the link, ...).
 */
function akr_em_build( string $kind, array $a ): string {
	/** @var WC_Order|null $o */
	$o     = $a['order'] ?? null;
	$front = akr_em_front();
	$track = $front . '/track-order';
	if ( $o instanceof WC_Order ) {
		$order_url = $front . '/order-confirmation?order=' . $o->get_id() . '&key=' . rawurlencode( $o->get_order_key() );
		$first     = akr_em_first_name( $o );
		$no        = esc_html( $o->get_order_number() );
		$total     = esc_html( akr_em_money( $o->get_total() ) );
		$cod       = 'cod' === $o->get_payment_method();
	}
	switch ( $kind ) {
		case 'confirmed':
			$eta = akr_em_eta( $o );
			return akr_em_shell(
				array(
					'tag'    => 'Order confirmed',
					'title'  => 'Order #' . $no . ' is ' . akr_em_hl( 'in.' ),
					'pre'    => 'We are starting your print. Total ' . wp_strip_all_tags( $total ) . '.',
					'intro'  => 'Thank you, ' . esc_html( $first ) . '. We have your order and are starting to print it. ' . ( $cod ? 'You pay ' . $total . ' in cash or UPI when it arrives.' : 'Your payment is confirmed.' ),
					'blocks' => array(
						akr_em_order_track( $o, 2 ),
						akr_em_now_card( 'Printing your order', 'We print it, check every part and pack it. You get a tracking link by email when it ships.', array( 'Estimated delivery', wp_date( 'D j M', $eta ) ) ),
						akr_em_btn( 'Track your order', $order_url ),
						akr_em_order_card( $o ),
						akr_em_two_col( 'Delivering to', akr_em_address_block( $o ), 'Payment', akr_em_payment_block( $o ) ),
						akr_em_upsell( $o ),
					),
				)
			);

		case 'shipped':
			$t    = function_exists( 'akr_order_tracking' ) ? akr_order_tracking( $o ) : array( 'courier' => '', 'awb' => '', 'url' => '' );
			$eta  = akr_em_eta( $o );
			$rows = akr_em_row( 'Delivery partner', esc_html( '' !== $t['courier'] ? $t['courier'] : 'Our courier' ) ) . akr_em_row( 'Tracking ID', '<b>' . esc_html( $t['awb'] ) . '</b>' ) . akr_em_row( 'Estimated delivery', esc_html( wp_date( 'D j M', $eta ) ) );
			return akr_em_shell(
				array(
					'tag'    => 'In transit',
					'title'  => 'On its ' . akr_em_hl( 'way.' ),
					'pre'    => 'Your order is on its way. Tracking ID ' . $t['awb'] . '.',
					'intro'  => esc_html( $first ) . ', your order left our studio. Use the tracking ID below to follow the parcel.',
					'blocks' => array(
						akr_em_order_track( $o, 3 ),
						akr_em_now_card( 'On the road', 'Your parcel is with ' . esc_html( '' !== $t['courier'] ? $t['courier'] : 'the courier' ) . '. Tracking updates can take a few hours to appear.', array( 'Estimated delivery', wp_date( 'D j M', $eta ) ) ),
						'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table>' .
							( '' !== $t['url'] ? akr_em_btn( 'Track the parcel', $t['url'], 'lime' ) : '' ) . akr_em_btn( 'See your order', $order_url, 'white' ) . '</td></tr></table>',
						akr_em_order_card( $o ),
						akr_em_two_col( 'Delivering to', akr_em_address_block( $o ), 'Payment', akr_em_payment_block( $o ) ),
						akr_em_upsell( $o ),
					),
				)
			);

		case 'completed':
			$first_item = null;
			foreach ( $o->get_items() as $it ) {
				$first_item = $it->get_product();
				break;
			}
			$review_url = $first_item ? $front . '/product/' . $first_item->get_slug() . '#reviews' : $front . '/shop';
			return akr_em_shell(
				array(
					'tag'    => 'Delivered',
					'title'  => 'It has ' . akr_em_hl( 'arrived.' ),
					'pre'    => 'Your order is complete. Tell us how it turned out.',
					'intro'  => 'Your order is complete, ' . esc_html( $first ) . '. We hope the print looks as good in your hands as it did on our printer. If anything is wrong, reply to this email and we will sort it out.',
					'blocks' => array(
						akr_em_order_track( $o, 4 ),
						akr_em_btn( 'Write a review', $review_url, 'lime' ),
						akr_em_order_card( $o ),
						akr_em_upsell( $o, 'Liked it? These come from the same collection.' ),
					),
				)
			);

		case 'pending':
			$pay = $o->needs_payment() ? $o->get_checkout_payment_url() : '';
			return akr_em_shell(
				array(
					'tag'    => 'Payment needed',
					'title'  => 'One step ' . akr_em_hl( 'left.' ),
					'pre'    => 'Your order starts printing once the payment goes through.',
					'intro'  => 'Your order #' . $no . ' is saved but not paid yet. We start printing as soon as the payment goes through.',
					'blocks' => array(
						akr_em_order_track( $o, 1 ),
						akr_em_now_card( 'Waiting for payment', 'The button opens a secure payment page. Card and UPI details are never typed on our website.' ),
						$pay ? akr_em_btn( 'Pay ' . akr_em_money( $o->get_total() ), $pay ) : akr_em_btn( 'See your order', $order_url ),
						akr_em_order_card( $o, true ),
					),
				)
			);

		case 'failed':
			$pay = $o->needs_payment() ? $o->get_checkout_payment_url() : $order_url;
			return akr_em_shell(
				array(
					'tag'    => 'Payment failed',
					'title'  => 'That payment ' . akr_em_hl( 'did not' ) . ' go through.',
					'pre'    => 'Your order is saved. Try paying again.',
					'intro'  => 'The payment for order #' . $no . ' did not complete, so we have not started printing. Your order is saved and you can try again. If money left your account, it returns in [X] working days.',
					'blocks' => array(
						akr_em_btn( 'Try paying again', $pay ) . akr_em_btn( 'Order again', $front . '/shop', 'white' ),
						akr_em_order_card( $o, true ),
					),
				)
			);

		case 'refunded':
			$amount = (float) $o->get_total_refunded();
			return akr_em_shell(
				array(
					'tag'    => 'Refund',
					'title'  => 'Refund on its ' . akr_em_hl( 'way.' ),
					'pre'    => akr_em_money( $amount ) . ' is on its way back to you.',
					'intro'  => 'We refunded ' . esc_html( akr_em_money( $amount ) ) . ' for order #' . $no . '. It reaches your original payment method in [X] working days, depending on your bank.',
					'blocks' => array(
						'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' .
							akr_em_row( 'Refund amount', esc_html( akr_em_money( $amount ) ), true ) . akr_em_row( 'Refunded to', esc_html( $o->get_payment_method_title() ?: 'Original payment method' ) ) . '</table></td></tr></table>',
						akr_em_order_card( $o ),
						akr_em_p( 'Questions about the refund? Reply to this email with your order number.' ),
					),
				)
			);

		case 'note':
			return akr_em_shell(
				array(
					'tag'    => 'A note from Akrinity',
					'title'  => 'About order ' . akr_em_hl( '#' . $o->get_order_number() ),
					'pre'    => 'We wrote you a short note about your order.',
					'intro'  => 'Hi ' . esc_html( $first ) . ', we have a short note for you about your order.',
					'blocks' => array(
						'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="' . akr_em_c()['lime'] . '" style="border-radius:18px;border:1.5px solid ' . akr_em_c()['ink'] . ';"><tr><td style="padding:20px 24px;font-family:' . akr_em_c()['body'] . ';font-size:16px;line-height:1.6;color:' . akr_em_c()['ink'] . ';">' . wp_kses_post( wpautop( (string) ( $a['note'] ?? '' ) ) ) . '</td></tr></table>',
						akr_em_order_card( $o ),
					),
				)
			);

		case 'welcome':
			$user = (string) ( $a['user_login'] ?? '' );
			return akr_em_shell(
				array(
					'tag'    => 'Welcome',
					'title'  => 'Your account is ' . akr_em_hl( 'ready.' ),
					'head'   => 'Account',
					'pre'    => 'Track orders and reorder in two taps.',
					'intro'  => 'Your Akrinity account is ready. Your username is <b>' . esc_html( $user ) . '</b>.',
					'blocks' => array(
						! empty( $a['set_password_url'] ) ? akr_em_btn( 'Set your password', (string) $a['set_password_url'] ) : akr_em_btn( 'Go to your account', $front . '/account' ),
						akr_em_title( 'With an account you can' ) . akr_em_steps( array( 'Follow every order from print to delivery.', 'Save your addresses for a faster checkout.', 'Reorder a print in two taps.' ) ),
						akr_em_small( 'Prices include GST. Business buyer? Add your GSTIN in your account for tax invoices.' ),
					),
					'help'   => 'Need help? Reply to this email or message us on WhatsApp at ' . akr_em_whatsapp() . '.',
				)
			);

		case 'reset':
			return akr_em_shell(
				array(
					'tag'    => 'Password',
					'title'  => 'Choose a ' . akr_em_hl( 'new' ) . ' password.',
					'head'   => 'Account',
					'pre'    => 'Use this link to set a new password.',
					'intro'  => 'Someone asked to reset the password for <b>' . esc_html( (string) ( $a['user_login'] ?? '' ) ) . '</b>. Use the button to choose a new one.',
					'blocks' => array(
						akr_em_btn( 'Choose a new password', (string) ( $a['url'] ?? $front ) ),
						akr_em_small( 'If you did not ask for this, ignore this email. Your password stays the same.' ),
					),
					'help'   => 'Did not ask for this? Reply to this email so we can look into it.',
				)
			);

		case 'neworder':
			$tiles = '';
			foreach ( array( 'Total' => $total, 'Payment' => esc_html( $o->get_payment_method_title() ), 'Ship to' => esc_html( $o->get_shipping_state() ? ( WC()->countries->get_states( $o->get_shipping_country() )[ $o->get_shipping_state() ] ?? $o->get_shipping_state() ) : '—' ) ) as $label => $val ) {
				$tiles .= '<td class="stack" width="33%" valign="top" style="padding:0 8px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . 'border-radius:14px;"><tr><td style="padding:12px 14px;"><div style="font-family:' . akr_em_c()['body'] . ';font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' . akr_em_c()['muted'] . ';">' . $label . '</div><div style="font-family:' . akr_em_c()['body'] . ';font-size:16px;font-weight:700;color:' . akr_em_c()['ink'] . ';padding-top:3px;">' . $val . '</div></td></tr></table></td>';
			}
			$notes = '';
			foreach ( $o->get_items() as $it ) {
				$opts   = akr_em_item_options( $it );
				$notes .= '<b>' . esc_html( $it->get_name() ) . '</b><br>' . ( '' !== $opts ? esc_html( $opts ) : 'No options' ) . '<br>';
			}
			$cust = $o->get_customer_note() ? '<br><b>Customer note:</b> ' . esc_html( $o->get_customer_note() ) : '';
			return akr_em_shell(
				array(
					'tag'    => 'New order',
					'title'  => 'Order ' . akr_em_hl( '#' . $o->get_order_number() ) . ' from ' . esc_html( $first ) . '.',
					'head'   => 'Studio',
					'pre'    => wp_strip_all_tags( $total ) . ', ' . $o->get_payment_method_title() . '.',
					'intro'  => 'A new order is in. Check the options below before you start printing.',
					'blocks' => array(
						'<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' . $tiles . '</tr></table>',
						akr_em_order_card( $o ),
						akr_em_two_col( 'Customer', akr_em_address_block( $o ) . '<br>' . esc_html( $o->get_billing_email() ), 'Print notes', $notes . $cust ),
						akr_em_btn( 'Open order in WooCommerce', $o->get_edit_order_url() ),
					),
					'help'   => 'Set the status to Processing, then In transit when it ships (pick the delivery partner and type the tracking ID), then Completed once delivered.',
				)
			);

		case 'cancelled':
		case 'adminfailed':
			$failed = 'adminfailed' === $kind;
			return akr_em_shell(
				array(
					'tag'    => $failed ? 'Payment failed' : 'Order cancelled',
					'title'  => 'Order ' . akr_em_hl( '#' . $o->get_order_number() ) . ( $failed ? ' failed.' : ' is off.' ),
					'head'   => 'Studio',
					'pre'    => 'Stop any printing for this order.',
					'intro'  => $failed ? 'The payment for order #' . $no . ' failed. Nothing needs printing yet.' : 'Order #' . $no . ' was cancelled. Stop any printing or packing for it. Stock for the item goes back on the shelf automatically.',
					'blocks' => array( akr_em_order_card( $o ), akr_em_btn( 'Open order in WooCommerce', $o->get_edit_order_url() ) ),
					'help'   => 'If the customer already paid, issue the refund from the order screen.',
				)
			);
	}
	return '';
}

/* ---------- notices: quote, bulk, contact, newsletter and review emails ---------- */

/**
 * A short email in the same design from plain lines. $d: tag, title (plain), hl (the highlighted last words),
 * head, intro (plain), summary ("Label: value" lines, one per line), steps (list), help.
 * A line that starts with "Open it:" becomes a button.
 */
function akr_em_notice( array $d ): string {
	$c      = akr_em_c();
	$rows   = '';
	$button = '';
	foreach ( preg_split( '/\r?\n/', (string) ( $d['summary'] ?? '' ) ) as $line ) {
		$line = trim( $line );
		if ( '' === $line || false === strpos( $line, ': ' ) ) {
			continue;
		}
		list( $label, $value ) = explode( ': ', $line, 2 );
		if ( 'Open it' === $label ) {
			$button = akr_em_btn( 'Open it in WordPress', $value );
			continue;
		}
		$rows .= '<tr><td valign="top" style="padding:6px 12px 6px 0;font-family:' . $c['body'] . ';font-size:14px;color:' . $c['muted'] . ';white-space:nowrap;">' . esc_html( $label ) . '</td>' .
			'<td valign="top" style="padding:6px 0;font-family:' . $c['body'] . ';font-size:14.5px;font-weight:600;color:' . $c['ink'] . ';overflow-wrap:anywhere;">' . nl2br( esc_html( $value ) ) . '</td></tr>';
	}
	$blocks = array();
	if ( '' !== $rows ) {
		$blocks[] = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="' . akr_em_card_style() . '"><tr><td style="padding:16px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table></td></tr></table>';
	}
	if ( ! empty( $d['steps'] ) ) {
		$blocks[] = akr_em_title( 'What happens next' ) . akr_em_steps( array_map( 'esc_html', (array) $d['steps'] ) );
	}
	if ( '' !== $button ) {
		$blocks[] = $button;
	}
	return akr_em_shell(
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
}
