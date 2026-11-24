<?php
/**
 * Plugin Name: Akrinity reminders
 * Description: Timers for the automatic customer emails (review request, abandoned cart) with a settings page under WooCommerce > Akrinity reminders. Needs akrinity-headless-auth.php (akr_mail and akr_frontend_url). Version 1.0.0.
 *
 * Install: copy this file to wp-content/mu-plugins/ next to the other Akrinity files.
 *
 * Where to set the timers: WordPress admin > WooCommerce > Akrinity reminders.
 *   - Review request: how many days after an order is marked Completed the email goes out (default 5, 0 = off).
 *   - Abandoned cart: hours after a cart is left before the reminder goes out (default 24, 0 = off).
 *     The reminder needs the storefront to send the cart and the email to this plugin; until that is built it
 *     does nothing, so keep it at its default.
 *
 * Uses Action Scheduler (bundled with WooCommerce) when it is there, otherwise WP-Cron.
 */

defined( 'ABSPATH' ) || exit;

const AKR_RM_OPTION_REVIEW_DAYS = 'akr_rm_review_days';
const AKR_RM_OPTION_CART_HOURS  = 'akr_rm_cart_hours';
const AKR_RM_HOOK_REVIEW        = 'akr_rm_send_review_request';
const AKR_RM_HOOK_CART          = 'akr_rm_send_cart_reminder';

function akr_rm_review_days(): int {
	return max( 0, (int) get_option( AKR_RM_OPTION_REVIEW_DAYS, 5 ) );
}

function akr_rm_cart_hours(): int {
	return max( 0, (int) get_option( AKR_RM_OPTION_CART_HOURS, 24 ) );
}

/** Schedules one job, through Action Scheduler when it is available. */
function akr_rm_schedule( int $timestamp, string $hook, array $args ): void {
	if ( function_exists( 'as_schedule_single_action' ) ) {
		as_schedule_single_action( $timestamp, $hook, $args, 'akrinity' );
		return;
	}
	wp_schedule_single_event( $timestamp, $hook, $args );
}

/* ---------- Settings page ---------- */

add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'woocommerce',
			'Akrinity reminders',
			'Akrinity reminders',
			'manage_woocommerce',
			'akrinity-reminders',
			'akr_rm_settings_page'
		);
	}
);

function akr_rm_settings_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	if ( isset( $_POST['akr_rm_save'] ) ) {
		check_admin_referer( 'akr_rm_save' );
		update_option( AKR_RM_OPTION_REVIEW_DAYS, max( 0, min( 60, (int) ( $_POST['review_days'] ?? 5 ) ) ) );
		update_option( AKR_RM_OPTION_CART_HOURS, max( 0, min( 240, (int) ( $_POST['cart_hours'] ?? 24 ) ) ) );
		echo '<div class="notice notice-success"><p>Saved. New timers apply to orders completed and carts left from now on.</p></div>';
	}
	?>
	<div class="wrap">
		<h1>Akrinity reminders</h1>
		<p>Automatic customer emails and how long to wait before each one. Set a timer to 0 to turn that email off.</p>
		<form method="post">
			<?php wp_nonce_field( 'akr_rm_save' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="review_days">Review request (days after Completed)</label></th>
					<td>
						<input type="number" id="review_days" name="review_days" min="0" max="60" value="<?php echo esc_attr( akr_rm_review_days() ); ?>" class="small-text" />
						<p class="description">Default 5. Sent once per order, with a link to review the first product in the order.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="cart_hours">Abandoned cart (hours after it is left)</label></th>
					<td>
						<input type="number" id="cart_hours" name="cart_hours" min="0" max="240" value="<?php echo esc_attr( akr_rm_cart_hours() ); ?>" class="small-text" />
						<p class="description">Default 24. Waits for the storefront to send carts (not built yet).</p>
					</td>
				</tr>
			</table>
			<p class="submit"><button type="submit" name="akr_rm_save" value="1" class="button button-primary">Save timers</button></p>
		</form>
	</div>
	<?php
}

/* ---------- Review request ---------- */

// Schedules the review request when an order becomes Completed.
add_action(
	'woocommerce_order_status_completed',
	function ( $order_id ) {
		$days = akr_rm_review_days();
		if ( $days <= 0 || ! function_exists( 'akr_mail' ) ) {
			return;
		}
		$order = wc_get_order( $order_id );
		if ( ! $order || '' === (string) $order->get_billing_email() ) {
			return;
		}
		if ( $order->get_meta( '_akr_review_scheduled' ) ) {
			return;
		}
		$order->update_meta_data( '_akr_review_scheduled', time() );
		$order->save();
		akr_rm_schedule( time() + $days * DAY_IN_SECONDS, AKR_RM_HOOK_REVIEW, array( (int) $order_id ) );
	}
);

// Sends the review request when the timer runs out.
add_action(
	AKR_RM_HOOK_REVIEW,
	function ( $order_id ) {
		$order = wc_get_order( (int) $order_id );
		if ( ! $order || ! function_exists( 'akr_mail' ) ) {
			return;
		}
		if ( $order->get_meta( '_akr_review_sent' ) || 'completed' !== $order->get_status() ) {
			return;
		}
		$product_url = '';
		foreach ( $order->get_items() as $item ) {
			$product = $item->get_product();
			if ( $product && function_exists( 'akr_frontend_url' ) && '' !== akr_frontend_url() ) {
				$product_url = akr_frontend_url() . '/product/' . $product->get_slug() . '#reviews';
				break;
			}
		}
		$ref   = $order->get_order_number();
		$name  = trim( (string) $order->get_billing_first_name() );
		$hello = '' !== $name ? "Hi $name,\r\n\r\n" : "Hello,\r\n\r\n";
		$text  = $hello . "Thank you for your order #$ref. We hope it arrived well.\r\n\r\n"
			. ( '' !== $product_url ? "If you have a minute, tell other buyers what you think: $product_url\r\n\r\n" : '' )
			. "If anything is wrong, reply to this email.\r\n";

		akr_mail(
			$order->get_billing_email(),
			"How was your order #$ref?",
			$text,
			array(),
			array(
				'tag'   => 'Review request',
				'title' => 'How was',
				'hl'    => 'your order?',
				'head'  => '#' . $ref,
				'intro' => 'We hope it arrived well. A short review helps other buyers choose.',
				'help'  => 'Reply to this email if anything is wrong.',
			)
		);
		$order->update_meta_data( '_akr_review_sent', time() );
		$order->save();
	}
);

/* ---------- Abandoned cart ---------- */

// The reminder runs only when a cart is stored with its email (the storefront part is not built yet).
// This hook is ready for it: akr_rm_schedule( time() + hours * HOUR_IN_SECONDS, AKR_RM_HOOK_CART, array( $cart_id ) ).
add_action(
	AKR_RM_HOOK_CART,
	function ( $cart_id ) {
		// Intentionally empty until carts are captured. See the note at the top of this file.
		unset( $cart_id );
	}
);
