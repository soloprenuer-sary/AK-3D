<?php
/**
 * Plugin Name: Akrinity offer email
 * Description: A designed "thank you, here is a code for your next order" email with a share button, sent after an order is placed. OFF until the owner turns it on in WooCommerce > Akrinity offers (on hold: the referral logic is still to be decided). Version 1.0.0.
 */

defined( 'ABSPATH' ) || exit;

/** The settings: on or off, the coupon code to show, and the wording. */
function akr_offer_settings(): array {
	$o = (array) get_option( 'akr_offer_settings', array() );
	return array(
		'enabled' => ! empty( $o['enabled'] ),
		'code'    => strtoupper( trim( (string) ( $o['code'] ?? '' ) ) ),
		'title'   => (string) ( $o['title'] ?? 'Thank you,' ),
	);
}

/** Sends the offer email for an order. Does nothing while the offer is off or has no code. */
function akr_send_offer_email( int $order_id ): void {
	$s     = akr_offer_settings();
	$order = wc_get_order( $order_id );
	if ( ! $s['enabled'] || '' === $s['code'] || ! $order || ! function_exists( 'akr_em_shell' ) || ! is_email( $order->get_billing_email() ) ) {
		return;
	}
	$base  = defined( 'AKRINITY_FRONTEND_URL' ) ? rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) : '';
	$first = trim( $order->get_billing_first_name() );
	$hi    = '' !== $first ? $first : 'there';
	$shop  = $base . '/shop';
	$html  = akr_em_shell(
		array(
			'tag'    => 'Thank you',
			'title'  => esc_html( $s['title'] ) . ' ' . akr_em_hl( 'Akrinity.' ),
			'head'   => 'Your offer',
			'pre'    => 'Thank you, ' . $hi,
			'intro'  => esc_html( 'Thank you for your order ' . $order->get_order_number() . ', ' . $hi . '. Here is a code for your next one.' ),
			'blocks' => array(
				'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#D8FF3A;border:1.5px solid #0B0B0C;border-radius:18px;"><tr><td align="center" style="padding:22px;font-family:Anton,Impact,sans-serif;font-size:40px;letter-spacing:2px;color:#0B0B0C;">' . esc_html( $s['code'] ) . '</td></tr></table>',
				'<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0B0B0C;margin:14px 0 0;">Use it at checkout on your next order. Share it with a friend who likes 3D prints: you both get a little something.</p>',
				akr_em_btn( 'Shop with this code', $shop ),
			),
			'help'   => 'Offer terms are on the site. Reply to this email with questions.',
		)
	);
	wp_mail( $order->get_billing_email(), 'A little thank you from Akrinity', $html, array( 'Content-Type: text/html; charset=UTF-8' ) );
}

// The trigger point: after an order is placed. Sends only when the owner has switched it on.
add_action(
	'woocommerce_checkout_order_processed',
	function ( $order_id ) {
		$id = (int) $order_id;
		add_action(
			'shutdown',
			function () use ( $id ) {
				akr_send_offer_email( $id );
			}
		);
	}
);

// Settings screen under WooCommerce.
add_action(
	'admin_menu',
	function () {
		add_submenu_page( 'woocommerce', 'Akrinity offers', 'Akrinity offers', 'manage_woocommerce', 'akrinity-offers', 'akr_offer_settings_page' );
	}
);

function akr_offer_settings_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	if ( isset( $_POST['akr_offer_save'] ) ) {
		check_admin_referer( 'akr_offer_save' );
		update_option(
			'akr_offer_settings',
			array(
				'enabled' => ! empty( $_POST['enabled'] ),
				'code'    => sanitize_text_field( wp_unslash( $_POST['code'] ?? '' ) ),
				'title'   => sanitize_text_field( wp_unslash( $_POST['title'] ?? '' ) ),
			)
		);
		echo '<div class="notice notice-success"><p>Saved.</p></div>';
	}
	$s = akr_offer_settings();
	?>
	<div class="wrap">
		<h1>Akrinity offers</h1>
		<p>Sends a thank-you email with a code after each order. Off until you switch it on. The coupon itself is created in WooCommerce &gt; Marketing &gt; Coupons.</p>
		<form method="post">
			<?php wp_nonce_field( 'akr_offer_save' ); ?>
			<table class="form-table" role="presentation">
				<tr><th scope="row">Send the offer email</th><td><label><input type="checkbox" name="enabled" value="1" <?php checked( $s['enabled'] ); ?> /> On</label></td></tr>
				<tr><th scope="row"><label for="code">Coupon code</label></th><td><input type="text" id="code" name="code" value="<?php echo esc_attr( $s['code'] ); ?>" class="regular-text" /></td></tr>
				<tr><th scope="row"><label for="title">Heading</label></th><td><input type="text" id="title" name="title" value="<?php echo esc_attr( $s['title'] ); ?>" class="regular-text" /></td></tr>
			</table>
			<p class="submit"><button type="submit" name="akr_offer_save" value="1" class="button button-primary">Save</button></p>
		</form>
	</div>
	<?php
}
