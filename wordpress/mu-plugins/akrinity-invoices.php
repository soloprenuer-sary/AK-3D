<?php
/**
 * Plugin Name: Akrinity GST invoice
 * Description: Our own numbered GST tax invoice (PDF) for each order: numbering, GST figures, the Akrinity layout, the PDF drawing, the download route for the storefront, the email attachments and a box on the order screen. No WordPress plugin is needed. The PDF is drawn by the open-source Dompdf library kept in the folder akrinity-invoices/vendor. Version 2.0.0.
 *
 * Install: copy this file AND the folder akrinity-invoices/ (vendor, fonts, invoice-html.php) to wp-content/mu-plugins/.
 * Seller details and numbering in wp-config.php (all optional, with temporary defaults):
 *   define( 'AKRINITY_LEGAL_NAME', 'Your registered business name' );
 *   define( 'AKRINITY_ADDRESS', "Street, Area\nBhiwandi 421302, Maharashtra" );
 *   define( 'AKRINITY_GSTIN', '27ABCDE1234F1Z5' );        // also shown in the email footers
 *   define( 'AKRINITY_HSN', '3926' );                      // default HSN code of the products (a product can override it with the custom field _akr_hsn)
 *   define( 'AKRINITY_SERVICE_SAC', '996812' );            // SAC code printed on the delivery and cash on delivery fee lines
 *   define( 'AKRINITY_SELLER_STATE', 'MH' );               // state code of the seller (default MH)
 *   define( 'AKRINITY_INVOICE_PREFIX', 'AK/26-27/' );      // start of every invoice number (default TEMP-)
 *   define( 'AKRINITY_INVOICE_PAD', 5 );                   // digits of the running number (default 5)
 *   define( 'AKRINITY_INVOICE_TEMP', false );              // while true (the default) a "temporary details" strip is printed on every invoice
 *
 * An invoice exists once the goods have shipped: the order is In transit or Completed, or it is Processing and already paid online.
 * The first time one is made it gets the next number in the series; the number and date are then kept on the order for good.
 *
 * Route (storefront server, needs the shared key X-Akrinity-Key):
 *   GET /wp-json/akrinity/v1/order-invoice?order=<number>&key=<order key>   (or &contact=<email or phone used>)
 *   200 { "number": "...", "filename": "...", "pdf": "<base64>" }
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/akrinity-invoices/invoice-html.php';

function akrinv_is_temp(): bool {
	return ! defined( 'AKRINITY_INVOICE_TEMP' ) || (bool) AKRINITY_INVOICE_TEMP;
}

/** GST state numbers, by WooCommerce's state code for India. */
function akrinv_state_codes(): array {
	return array(
		'JK' => '01', 'HP' => '02', 'PB' => '03', 'CH' => '04', 'UK' => '05', 'HR' => '06', 'DL' => '07', 'RJ' => '08', 'UP' => '09', 'BR' => '10',
		'SK' => '11', 'AR' => '12', 'NL' => '13', 'MN' => '14', 'MZ' => '15', 'TR' => '16', 'ML' => '17', 'AS' => '18', 'WB' => '19', 'JH' => '20',
		'OR' => '21', 'CT' => '22', 'MP' => '23', 'GJ' => '24', 'DD' => '26', 'DN' => '26', 'MH' => '27', 'KA' => '29', 'GA' => '30', 'LD' => '31',
		'KL' => '32', 'TN' => '33', 'PY' => '34', 'AN' => '35', 'TS' => '36', 'AP' => '37', 'LA' => '38',
	);
}

function akrinv_state_label( string $code ): string {
	$states = function_exists( 'WC' ) && WC()->countries ? WC()->countries->get_states( 'IN' ) : array();
	$name   = is_array( $states ) && isset( $states[ $code ] ) ? $states[ $code ] : $code;
	$nums   = akrinv_state_codes();
	return '' === $code ? '' : $name . ( isset( $nums[ $code ] ) ? ' (' . $nums[ $code ] . ')' : '' );
}

function akrinv_const( string $name, string $default ): string {
	return defined( $name ) && '' !== trim( (string) constant( $name ) ) ? (string) constant( $name ) : $default;
}

/** Amount in words, Indian style (lakh, crore). */
function akrinv_words( float $amount ): string {
	$rupees = (int) floor( $amount + 0.00001 );
	$paise  = (int) round( ( $amount - $rupees ) * 100 );
	$ones   = array( '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen' );
	$tens   = array( '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety' );
	$two    = function ( int $n ) use ( $ones, $tens ) {
		return $n < 20 ? $ones[ $n ] : trim( $tens[ intdiv( $n, 10 ) ] . ' ' . $ones[ $n % 10 ] );
	};
	$three = function ( int $n ) use ( $two, $ones ) {
		$h = intdiv( $n, 100 );
		$r = $n % 100;
		return trim( ( $h ? $ones[ $h ] . ' hundred' : '' ) . ( $h && $r ? ' ' : '' ) . ( $r ? $two( $r ) : '' ) );
	};
	$words = function ( int $n ) use ( $two, $three ) {
		if ( 0 === $n ) {
			return 'zero';
		}
		$parts = array();
		foreach ( array( 10000000 => 'crore', 100000 => 'lakh', 1000 => 'thousand' ) as $div => $name ) {
			if ( $n >= $div ) {
				$parts[] = $two( intdiv( $n, $div ) ) . ' ' . $name;
				$n      %= $div;
			}
		}
		if ( $n > 0 ) {
			$parts[] = $three( $n );
		}
		return implode( ' ', $parts );
	};
	$out = 'Rupees ' . $words( $rupees );
	if ( $paise > 0 ) {
		$out .= ' and ' . $words( $paise ) . ' paise';
	}
	return ucfirst( $out ) . ' only';
}

function akrinv_address( WC_Order $o, string $type ): string {
	$g     = function ( string $f ) use ( $o, $type ) {
		$m = 'get_' . $type . '_' . $f;
		return (string) $o->$m();
	};
	$state = $g( 'state' );
	$lines = array_filter(
		array(
			trim( $g( 'first_name' ) . ' ' . $g( 'last_name' ) ) . ( '' !== $g( 'company' ) ? ', ' . $g( 'company' ) : '' ),
			$g( 'address_1' ),
			$g( 'address_2' ),
			trim( $g( 'city' ) . ' ' . $g( 'postcode' ) ),
			'' !== $state ? akrinv_state_label( $state ) : '',
		)
	);
	return implode( "\n", $lines );
}

/** Everything the invoice shows, worked out from the order. */
function akrinv_data( WC_Order $o ): array {
	$seller_state = akrinv_const( 'AKRINITY_SELLER_STATE', 'MH' );
	$ship_state   = (string) ( $o->get_shipping_state() ?: $o->get_billing_state() );
	$intra        = null;
	foreach ( $o->get_items( 'tax' ) as $t ) {
		$intra = (bool) preg_match( '/CGST|SGST/i', (string) $t->get_label() ) ? true : ( null === $intra ? false : $intra );
	}
	if ( null === $intra ) {
		$intra = '' !== $ship_state && $ship_state === $seller_state;
	}
	$hsn_default = akrinv_const( 'AKRINITY_HSN', '3926' );
	$sac         = akrinv_const( 'AKRINITY_SERVICE_SAC', '996812' );
	$lines       = array();
	$add         = function ( string $name, string $meta, string $hsn, $qty, float $taxable, float $tax ) use ( &$lines ) {
		$lines[] = array(
			'name'    => $name,
			'meta'    => $meta,
			'hsn'     => $hsn,
			'qty'     => $qty,
			'rate'    => $qty > 0 ? $taxable / $qty : $taxable,
			'taxable' => $taxable,
			'tax'     => $tax,
			'pct'     => $taxable > 0 ? round( $tax / $taxable * 100, 2 ) : 0,
		);
	};
	foreach ( $o->get_items() as $item ) {
		$product = $item->get_product();
		$hsn     = $product ? (string) $product->get_meta( '_akr_hsn' ) : '';
		$meta    = array();
		foreach ( $item->get_formatted_meta_data() as $m ) {
			$meta[] = wp_strip_all_tags( (string) $m->display_key ) . ': ' . wp_strip_all_tags( (string) $m->display_value );
		}
		$sku = $product ? (string) $product->get_sku() : '';
		if ( '' !== $sku ) {
			$meta[] = 'SKU ' . $sku;
		}
		$add( $item->get_name(), implode( ' | ', $meta ), '' !== $hsn ? $hsn : $hsn_default, (int) $item->get_quantity(), (float) $item->get_total(), (float) $item->get_total_tax() );
	}
	foreach ( $o->get_items( 'shipping' ) as $item ) {
		$add( 'Delivery: ' . $item->get_name(), '', $sac, 1, (float) $item->get_total(), (float) $item->get_total_tax() );
	}
	foreach ( $o->get_items( 'fee' ) as $item ) {
		$add( $item->get_name(), '', $sac, 1, (float) $item->get_total(), (float) $item->get_total_tax() );
	}
	$taxable = array_sum( wp_list_pluck( $lines, 'taxable' ) );
	$tax     = array_sum( wp_list_pluck( $lines, 'tax' ) );
	$total   = (float) $o->get_total();
	return array(
		'seller'  => array(
			'name'    => akrinv_const( 'AKRINITY_LEGAL_NAME', 'Akrinity' ),
			'address' => akrinv_const( 'AKRINITY_ADDRESS', "Bhiwandi, Maharashtra\nIndia" ),
			'gstin'   => akrinv_const( 'AKRINITY_GSTIN', '' ),
			'state'   => akrinv_state_label( $seller_state ),
			'phone'   => akrinv_const( 'AKRINITY_WHATSAPP', '' ),
			'email'   => (string) get_option( 'woocommerce_email_from_address' ),
		),
		'buyer'   => array(
			'name'    => trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ) . ( '' !== $o->get_billing_company() ? ', ' . $o->get_billing_company() : '' ),
			'address' => implode( "\n", array_filter( array( $o->get_billing_address_1(), $o->get_billing_address_2(), trim( $o->get_billing_city() . ' ' . $o->get_billing_postcode() ), akrinv_state_label( (string) $o->get_billing_state() ) ) ) ),
			'gstin'   => (string) $o->get_meta( '_billing_gstin' ),
			'phone'   => (string) $o->get_billing_phone(),
		),
		'ship'    => array( 'address' => akrinv_address( $o, '' !== $o->get_shipping_address_1() ? 'shipping' : 'billing' ) ),
		'place'   => akrinv_state_label( $ship_state ),
		'intra'   => $intra,
		'lines'   => $lines,
		'taxable' => $taxable,
		'tax'     => $tax,
		'round'   => $total - ( $taxable + $tax ),
		'total'   => $total,
	);
}

/* ---------- numbering: our own series, one running number kept in the options table ---------- */

function akrinv_next_counter(): int {
	global $wpdb;
	$wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", 'akrinv_counter', '0' ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->options} SET option_value = LAST_INSERT_ID(option_value + 1) WHERE option_name = %s", 'akrinv_counter' ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	return (int) $wpdb->get_var( 'SELECT LAST_INSERT_ID()' );
}

/** The order's invoice number and date; made on first use and never changed afterwards. */
function akrinv_number_for( WC_Order $o ): array {
	$number = (string) $o->get_meta( '_akrinv_number' );
	$date   = (int) $o->get_meta( '_akrinv_date' );
	if ( '' === $number ) {
		$n      = akrinv_next_counter();
		$number = akrinv_const( 'AKRINITY_INVOICE_PREFIX', 'TEMP-' ) . str_pad( (string) $n, max( 1, (int) akrinv_const( 'AKRINITY_INVOICE_PAD', '5' ) ), '0', STR_PAD_LEFT );
		$date   = time();
		$o->update_meta_data( '_akrinv_number', $number );
		$o->update_meta_data( '_akrinv_date', $date );
		$o->add_order_note( 'GST invoice ' . $number . ' created.' );
		$o->save();
	}
	return array( $number, $date );
}

/* ---------- the PDF ---------- */

function akrinv_cache_dir(): string {
	$up  = wp_upload_dir( null, false );
	$dir = trailingslashit( $up['basedir'] ) . 'akrinity-invoice-cache';
	if ( ! is_dir( $dir ) ) {
		wp_mkdir_p( $dir );
		file_put_contents( $dir . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n" );
		file_put_contents( $dir . '/index.php', "<?php // Silence is golden.\n" );
	}
	return $dir;
}

function akrinv_engine_ready(): bool {
	static $ready = null;
	if ( null === $ready ) {
		if ( ! class_exists( '\WPO\IPS\Vendor\Dompdf\Dompdf', false ) ) {
			require_once __DIR__ . '/akrinity-invoices/vendor/strauss/autoload.php';
		}
		$ready = class_exists( '\WPO\IPS\Vendor\Dompdf\Dompdf' );
	}
	return $ready;
}

/** The invoice for an order as PDF bytes. Returns '' when it cannot be drawn. */
function akrinv_pdf( WC_Order $o ): string {
	if ( ! akrinv_engine_ready() ) {
		return '';
	}
	list( $number, $date ) = akrinv_number_for( $o );
	$inv                   = akrinv_data( $o );
	$paid                  = $o->is_paid() && 'cod' !== $o->get_payment_method();
	$cod                   = 'cod' === $o->get_payment_method();
	$paid_at               = $o->get_date_paid();
	$m                     = array(
		'number'        => $number,
		'date'          => wp_date( 'j M Y', $date ),
		'order'         => '#' . $o->get_order_number(),
		'payment_label' => $cod ? 'Cash on delivery' : ( $paid ? 'Paid online' : wp_strip_all_tags( (string) $o->get_payment_method_title() ) ),
		'buyer_email'   => (string) $o->get_billing_email(),
		'paid'          => $paid,
		'pay_title'     => $paid ? 'Paid in full' : ( $cod ? 'Payment due on delivery' : 'Payment pending' ),
		'pay_line'      => $paid ? 'via ' . wp_strip_all_tags( (string) $o->get_payment_method_title() ) : ( $cod ? 'in cash or UPI' : '' ),
		'pay_extra'     => $paid ? trim( ( $o->get_transaction_id() ? 'Transaction ' . $o->get_transaction_id() : '' ) . ( $paid_at ? ' · ' . $paid_at->date_i18n( 'j M Y' ) : '' ), ' ·' ) : '',
	);
	return akrinv_render( akrinv_html( $inv, $m ) );
}

/** Draws an invoice page (HTML) as PDF bytes. */
function akrinv_render( string $html ): string {
	if ( ! akrinv_engine_ready() ) {
		return '';
	}
	$cache  = akrinv_cache_dir();
	$opt    = new \WPO\IPS\Vendor\Dompdf\Options();
	$opt->set( 'fontDir', $cache );
	$opt->set( 'fontCache', $cache );
	$opt->set( 'tempDir', $cache );
	$opt->set( 'chroot', array( __DIR__ . '/akrinity-invoices' ) );
	$opt->set( 'isRemoteEnabled', false );
	$opt->set( 'isHtml5ParserEnabled', true );
	$opt->set( 'defaultFont', 'Open Sans' );
	$opt->set( 'dpi', 96 );
	$pdf = new \WPO\IPS\Vendor\Dompdf\Dompdf( $opt );
	$pdf->setPaper( 'A4', 'portrait' );
	$pdf->loadHtml( $html, 'UTF-8' );
	$pdf->render();
	return (string) $pdf->output();
}

/** Whether an invoice may be made for this order now. */
function akrinv_may_invoice( WC_Order $o ): bool {
	$s = $o->get_status();
	return in_array( $s, array( 'in-transit', 'completed' ), true ) || ( 'processing' === $s && $o->is_paid() && 'cod' !== $o->get_payment_method() );
}

function akrinv_filename( WC_Order $o ): string {
	return 'Akrinity-invoice-' . sanitize_file_name( str_replace( '/', '-', (string) $o->get_meta( '_akrinv_number' ) ?: (string) $o->get_order_number() ) ) . '.pdf';
}

/* ---------- email attachments ---------- */

add_filter(
	'woocommerce_email_attachments',
	function ( $attachments, $email_id, $order ) {
		if ( ! $order instanceof WC_Order || ! in_array( $email_id, array( 'customer_in_transit_order', 'customer_completed_order' ), true ) || ! akrinv_may_invoice( $order ) ) {
			return $attachments;
		}
		$pdf = akrinv_pdf( $order );
		if ( '' === $pdf ) {
			return $attachments;
		}
		$path = trailingslashit( akrinv_cache_dir() ) . akrinv_filename( $order );
		if ( false !== file_put_contents( $path, $pdf ) ) {
			$attachments[] = $path;
		}
		return $attachments;
	},
	20,
	3
);

// Attachments only need to live until the email has gone: tidy anything older than a day.
add_action(
	'init',
	function () {
		if ( get_transient( 'akrinv_tidy' ) ) {
			return;
		}
		set_transient( 'akrinv_tidy', 1, DAY_IN_SECONDS );
		foreach ( (array) glob( trailingslashit( akrinv_cache_dir() ) . 'Akrinity-invoice-*.pdf' ) as $f ) {
			if ( is_file( $f ) && filemtime( $f ) < time() - DAY_IN_SECONDS ) {
				unlink( $f );
			}
		}
	}
);

/* ---------- the download route for the storefront ---------- */

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/order-invoice',
			array(
				'methods'             => 'GET',
				'permission_callback' => function ( WP_REST_Request $req ) {
					return function_exists( 'akr_secret_ok' ) && akr_secret_ok( $req );
				},
				'callback'            => function ( WP_REST_Request $req ) {
					if ( ! function_exists( 'akrq_find_order' ) ) {
						return new WP_REST_Response( array( 'code' => 'unavailable' ), 503 );
					}
					$order = akrq_find_order( (string) $req->get_param( 'order' ), (string) $req->get_param( 'key' ), trim( (string) $req->get_param( 'contact' ) ) );
					if ( ! $order ) {
						return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
					}
					if ( ! akrinv_may_invoice( $order ) ) {
						return new WP_REST_Response( array( 'code' => 'not_yet' ), 409 ); // the invoice is made when the order ships
					}
					$pdf = akrinv_pdf( $order );
					if ( '' === $pdf ) {
						return new WP_REST_Response( array( 'code' => 'pdf_failed' ), 500 );
					}
					return new WP_REST_Response( array( 'number' => (string) $order->get_meta( '_akrinv_number' ), 'filename' => akrinv_filename( $order ), 'pdf' => base64_encode( $pdf ) ), 200 );
				},
			)
		);
	}
);

/* ---------- a box on the order screen for the studio ---------- */

add_action(
	'add_meta_boxes',
	function () {
		foreach ( array( 'shop_order', 'woocommerce_page_wc-orders' ) as $screen ) {
			add_meta_box(
				'akrinv_box',
				'GST invoice',
				function ( $post_or_order ) {
					$order = $post_or_order instanceof WC_Order ? $post_or_order : wc_get_order( $post_or_order->ID );
					if ( ! $order ) {
						return;
					}
					$number = (string) $order->get_meta( '_akrinv_number' );
					if ( '' !== $number ) {
						echo '<p>Invoice <b>' . esc_html( $number ) . '</b>, ' . esc_html( wp_date( 'j M Y', (int) $order->get_meta( '_akrinv_date' ) ) ) . '</p>';
					} else {
						echo '<p>No invoice yet. It is numbered the first time it is made.</p>';
					}
					if ( akrinv_may_invoice( $order ) ) {
						$url = wp_nonce_url( admin_url( 'admin-post.php?action=akrinv_download&order=' . (int) $order->get_id() ), 'akrinv_download_' . (int) $order->get_id() );
						echo '<p><a class="button button-primary" href="' . esc_url( $url ) . '">Download invoice (PDF)</a></p>';
					} else {
						echo '<p class="description">The invoice can be made once the order is In transit or Completed.</p>';
					}
				},
				$screen,
				'side',
				'default'
			);
		}
	}
);

add_action(
	'admin_post_akrinv_download',
	function () {
		$id = absint( $_GET['order'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! $id || ! current_user_can( 'edit_shop_order', $id ) || ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'akrinv_download_' . $id ) ) {
			wp_die( 'Not allowed.', '', array( 'response' => 403 ) );
		}
		$order = wc_get_order( $id );
		if ( ! $order || ! akrinv_may_invoice( $order ) ) {
			wp_die( 'The invoice can be made once the order is In transit or Completed.' );
		}
		$pdf = akrinv_pdf( $order );
		if ( '' === $pdf ) {
			wp_die( 'The PDF could not be made.' );
		}
		nocache_headers();
		header( 'Content-Type: application/pdf' );
		header( 'Content-Disposition: attachment; filename="' . akrinv_filename( $order ) . '"' );
		header( 'Content-Length: ' . strlen( $pdf ) );
		echo $pdf; // phpcs:ignore WordPress.Security.EscapeOutput
		exit;
	}
);
