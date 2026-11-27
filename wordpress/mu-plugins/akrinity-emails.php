<?php
/**
 * Plugin Name: Akrinity emails
 * Description: The Akrinity look (lime poster, order tracker, product photos, more from the same category) for the WooCommerce emails, plus the "In transit" email. Needs akrinity-shop.php (version 1.1.0 or newer) for the In transit status. Version 1.0.0.
 *
 * Version 1.1.0: customer emails carry a "Stop marketing emails" link (GET /wp-json/akrinity/v1/optout).
 * Install: copy this file AND the folder akrinity-emails/ (render.php and stub.php) to wp-content/mu-plugins/.
 * Optional constants for wp-config.php, shown in the email footer:
 *   define( 'AKRINITY_WHATSAPP', '+91 98xxx xxxxx' );
 *   define( 'AKRINITY_GSTIN', '27ABCDE1234F1Z5' );
 *
 * What it restyles (WooCommerce > Settings > Emails still turns each one on or off and edits its subject):
 *   New order and Cancelled order and Failed order (to you); Processing order = order confirmed, Completed order,
 *   On-hold order and Invoice = payment needed, Failed order, Refunded order, Customer note, New account,
 *   Reset password (to the customer), and the new In transit order email.
 * The In transit email is sent once when an order is In transit and has a tracking ID (see akrinity-shop.php).
 */

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/akrinity-emails/render.php';

/** WooCommerce template file => the email it becomes. */
function akr_email_kinds(): array {
	return array(
		'emails/customer-processing-order.php'  => 'confirmed',
		'emails/customer-in-transit-order.php'  => 'shipped',
		'emails/customer-completed-order.php'   => 'completed',
		'emails/customer-on-hold-order.php'     => 'pending',
		'emails/customer-invoice.php'           => 'pending',
		'emails/customer-failed-order.php'      => 'failed',
		'emails/customer-refunded-order.php'    => 'refunded',
		'emails/customer-note.php'              => 'note',
		'emails/customer-new-account.php'       => 'welcome',
		'emails/customer-reset-password.php'    => 'reset',
		'emails/admin-new-order.php'            => 'neworder',
		'emails/admin-cancelled-order.php'      => 'cancelled',
		'emails/admin-failed-order.php'         => 'adminfailed',
		'emails/plain/customer-in-transit-order.php' => 'transit_plain',
	);
}

// Point WooCommerce at our one template for those emails.
add_filter(
	'wc_get_template',
	function ( $located, $template_name ) {
		$kinds = akr_email_kinds();
		if ( isset( $kinds[ $template_name ] ) ) {
			$GLOBALS['akr_email_kind'] = $kinds[ $template_name ];
			return __DIR__ . '/akrinity-emails/stub.php';
		}
		return $located;
	},
	20,
	2
);

// The design carries its own styles; WooCommerce's stylesheet would only get in the way.
add_filter(
	'woocommerce_email_styles',
	function () {
		return 'body{margin:0}';
	},
	99
);

// Subjects: ours, unless you have typed your own under WooCommerce > Settings > Emails.
function akr_email_subjects(): array {
	return array(
		'customer_processing_order' => 'Your Akrinity order #{order_number} is confirmed',
		'customer_completed_order'  => 'Your Akrinity order #{order_number} is complete',
		'customer_on_hold_order'    => 'Your Akrinity order #{order_number} is waiting for payment',
		'customer_invoice'          => 'Pay for your Akrinity order #{order_number}',
		'customer_failed_order'     => 'Your payment for order #{order_number} did not go through',
		'customer_refunded_order'   => 'Your Akrinity refund for order #{order_number}',
		'customer_note'             => 'A note about your Akrinity order #{order_number}',
		'customer_new_account'      => 'Welcome to Akrinity',
		'customer_in_transit_order' => 'Your Akrinity order #{order_number} is in transit',
		'new_order'                 => '[Akrinity] New order #{order_number} from {order_billing_full_name}',
		'cancelled_order'           => '[Akrinity] Order #{order_number} has been cancelled',
		'failed_order'              => '[Akrinity] Payment failed for order #{order_number}',
	);
}

add_action(
	'init',
	function () {
		foreach ( akr_email_subjects() as $id => $subject ) {
			add_filter(
				'woocommerce_email_subject_' . $id,
				function ( $current, $object, $email = null ) use ( $subject ) {
					if ( $email instanceof WC_Email && $email->get_option( 'subject' ) !== '' && $email->get_option( 'subject' ) !== $email->get_default_subject() ) {
						return $current; // you typed your own subject: keep it
					}
					return $email instanceof WC_Email ? $email->format_string( $subject ) : $current;
				},
				10,
				3
			);
		}
	}
);

// The new "In transit order" email, listed under WooCommerce > Settings > Emails.
add_filter(
	'woocommerce_email_classes',
	function ( $emails ) {
		if ( ! class_exists( 'AKR_Email_In_Transit' ) && class_exists( 'WC_Email' ) ) {
			class AKR_Email_In_Transit extends WC_Email {
				public function __construct() {
					$this->id             = 'customer_in_transit_order';
					$this->customer_email = true;
					$this->title          = 'In transit order';
					$this->description    = 'Sent to the customer once, when you set an order to In transit and save a tracking ID.';
					$this->template_html  = 'emails/customer-in-transit-order.php';
					$this->template_plain = 'emails/plain/customer-in-transit-order.php';
					$this->placeholders   = array(
						'{order_date}'   => '',
						'{order_number}' => '',
					);
					add_action( 'akr_order_in_transit_notification', array( $this, 'trigger' ), 10, 2 );
					parent::__construct();
				}

				public function get_default_subject() {
					return 'Your {site_title} order #{order_number} is in transit';
				}

				public function get_default_heading() {
					return 'Your order is on its way';
				}

				public function trigger( $order_id, $order = false ) {
					$this->setup_locale();
					if ( $order_id && ! is_a( $order, 'WC_Order' ) ) {
						$order = wc_get_order( $order_id );
					}
					if ( is_a( $order, 'WC_Order' ) ) {
						$this->object                         = $order;
						$this->recipient                      = $order->get_billing_email();
						$this->placeholders['{order_date}']   = wc_format_datetime( $order->get_date_created() );
						$this->placeholders['{order_number}'] = $order->get_order_number();
					}
					if ( $this->is_enabled() && $this->get_recipient() ) {
						$this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
					}
					$this->restore_locale();
				}

				public function get_content_html() {
					return wc_get_template_html(
						$this->template_html,
						array(
							'order'              => $this->object,
							'email_heading'      => $this->get_heading(),
							'additional_content' => $this->get_additional_content(),
							'sent_to_admin'      => false,
							'plain_text'         => false,
							'email'              => $this,
						)
					);
				}

				public function get_content_plain() {
					return wc_get_template_html(
						$this->template_plain,
						array(
							'order'              => $this->object,
							'email_heading'      => $this->get_heading(),
							'additional_content' => $this->get_additional_content(),
							'sent_to_admin'      => false,
							'plain_text'         => true,
							'email'              => $this,
						)
					);
				}
			}
		}
		if ( class_exists( 'AKR_Email_In_Transit' ) ) {
			$emails['AKR_Email_In_Transit'] = new AKR_Email_In_Transit();
		}
		return $emails;
	}
);

// "Forgot password" on the storefront uses WordPress's own email: send it in the same design.
add_filter(
	'retrieve_password_notification_email',
	function ( $defaults, $key, $user_login ) {
		$front = function_exists( 'akr_frontend_url' ) ? akr_frontend_url() : '';
		if ( '' === $front || ! is_array( $defaults ) ) {
			return $defaults;
		}
		$url                = $front . '/reset-password?key=' . rawurlencode( (string) $key ) . '&login=' . rawurlencode( (string) $user_login );
		$defaults['message'] = akr_em_build( 'reset', array( 'user_login' => $user_login, 'url' => $url ) );
		$headers            = is_array( $defaults['headers'] ) ? $defaults['headers'] : array_filter( array( (string) $defaults['headers'] ) );
		$headers[]          = 'Content-Type: text/html; charset=UTF-8';
		$defaults['headers'] = $headers;
		return $defaults;
	},
	20,
	3
);

/** Records "no marketing emails" for an address, when the signed token from the email matches. */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/optout',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => function ( WP_REST_Request $req ) {
					$email = strtolower( trim( (string) $req->get_param( 'email' ) ) );
					$token = (string) $req->get_param( 'token' );
					if ( ! is_email( $email ) || ! hash_equals( akr_optout_token( $email ), $token ) ) {
						return new WP_Error( 'akr_optout_invalid', 'This link is not valid.', array( 'status' => 400 ) );
					}
					$list = (array) get_option( 'akr_optout', array() );
					if ( ! in_array( $email, $list, true ) ) {
						$list[] = $email;
						update_option( 'akr_optout', $list, false );
					}
					return array( 'ok' => true );
				},
			)
		);
	}
);
