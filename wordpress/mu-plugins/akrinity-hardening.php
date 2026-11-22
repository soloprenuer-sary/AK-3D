<?php
/**
 * Plugin Name: Akrinity hardening
 * Description: Closes the information leaks and cheap attack routes found in the security check of admin.akrinity.in. Safe to add next to akrinity-headless-auth.php. Version 1.0.0.
 *
 * Put this file in wp-content/mu-plugins/ (same folder as akrinity-headless-auth.php). It has no settings,
 * and nothing secret in it. To undo any one rule, delete that block.
 *
 * What it does:
 *  1. Hides the list of usernames. Public visitors can no longer read /wp-json/wp/v2/users, the
 *     /?author=1 redirect, the author archives or the users sitemap (the check found the admin
 *     username "sujit" and a gravatar hash of the admin email there).
 *  2. Login errors are the same for "no such user" and "wrong password", on wp-login.php and on the
 *     JWT token route the storefront uses.
 *  3. Only the storefront may call the REST API from a browser (CORS). WordPress by default repeats back
 *     any website's Origin together with "allow credentials".
 *  4. Hides the 1.4 MB REST index (it listed every plugin) from visitors who are not signed in.
 *  5. Removes the WordPress version from the page head and feeds, turns off XML-RPC and the file editor.
 *  6. Adds basic browser-safety headers on the WordPress domain.
 *  7. Caps how many quote requests and uploads can arrive per hour overall, as a backstop to the
 *     storefront's own limits.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Websites allowed to call the REST API from a browser. Add the live domain when it is known. */
if ( ! defined( 'AKRINITY_ALLOWED_ORIGINS' ) ) {
	define(
		'AKRINITY_ALLOWED_ORIGINS',
		'https://akrinity.in,https://www.akrinity.in,https://ak-3-d.vercel.app,http://localhost:3000,http://localhost:3100'
	);
}

// ---------- 1. No username list for visitors ----------

add_filter(
	'rest_endpoints',
	function ( $endpoints ) {
		if ( ! is_user_logged_in() ) {
			foreach ( array_keys( $endpoints ) as $route ) {
				if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
					unset( $endpoints[ $route ] );
				}
			}
		}
		return $endpoints;
	}
);

// Users sitemap and author archives.
add_filter(
	'wp_sitemaps_add_provider',
	function ( $provider, $name ) {
		return 'users' === $name ? false : $provider;
	},
	10,
	2
);
add_action(
	'template_redirect',
	function () {
		if ( ( is_author() || isset( $_GET['author'] ) ) && ! is_user_logged_in() ) { // phpcs:ignore WordPress.Security.NonceVerification
			wp_safe_redirect( home_url( '/' ), 301 );
			exit;
		}
	},
	1
);

// ---------- 2. Same login error for every failure ----------

add_filter(
	'login_errors',
	function () {
		return 'Error: The username or password is not correct.';
	}
);
add_filter(
	'rest_post_dispatch',
	function ( $result, $server, $request ) {
		if ( '/jwt-auth/v1/token' !== $request->get_route() ) {
			return $result;
		}
		$data = $result instanceof WP_REST_Response ? $result->get_data() : null;
		$code = is_array( $data ) ? (string) ( $data['code'] ?? '' ) : '';
		if ( in_array( $code, array( '[jwt_auth] invalid_username', '[jwt_auth] invalid_email', '[jwt_auth] incorrect_password' ), true ) ) {
			$result->set_data(
				array(
					'code'    => '[jwt_auth] invalid_credentials',
					'message' => 'The email or password is not correct.',
					'data'    => array( 'status' => 403 ),
				)
			);
		}
		return $result;
	},
	10,
	3
);

// ---------- 3. CORS only for the storefront ----------

add_action(
	'rest_api_init',
	function () {
		remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
		add_filter(
			'rest_pre_serve_request',
			function ( $value ) {
				$origin  = get_http_origin();
				$allowed = array_map( 'trim', explode( ',', (string) AKRINITY_ALLOWED_ORIGINS ) );
				if ( $origin && in_array( $origin, $allowed, true ) ) {
					header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
					header( 'Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE' );
					header( 'Access-Control-Allow-Credentials: true' );
					header( 'Vary: Origin', false );
				}
				return $value;
			}
		);
	},
	15
);

// ---------- 4. Plugin list hidden from visitors ----------

add_filter(
	'rest_index',
	function ( $response ) {
		if ( is_user_logged_in() ) {
			return $response;
		}
		$data = $response->get_data();
		$keep = array( 'wc/store', 'wc/store/v1', 'akrinity/v1', 'jwt-auth/v1' );
		$data['namespaces'] = array_values( array_intersect( (array) ( $data['namespaces'] ?? array() ), array_merge( $keep, array( 'wp/v2' ) ) ) );
		$data['routes']     = array();
		$response->set_data( $data );
		return $response;
	}
);

// ---------- 5. Less to see, less to abuse ----------

remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );
add_filter( 'xmlrpc_enabled', '__return_false' );
if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
	define( 'DISALLOW_FILE_EDIT', true );
}

// ---------- 6. Browser-safety headers ----------

add_action(
	'send_headers',
	function () {
		if ( headers_sent() ) {
			return;
		}
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
		// The admin screens and the storefront are never shown inside someone else's page.
		header( 'X-Frame-Options: SAMEORIGIN' );
	}
);

// ---------- 7. Overall cap on form traffic ----------

add_filter(
	'rest_pre_dispatch',
	function ( $result, $server, $request ) {
		$limits = array(
			'/akrinity/v1/quote-request'    => array( 'quote', 60 ),
			'/akrinity/v1/business-request' => array( 'biz', 60 ),
			'/akrinity/v1/register'         => array( 'reg', 80 ),
			'/akrinity/v1/password/forgot'  => array( 'forgot', 80 ),
			'/akrinity/v1/contact'          => array( 'contact', 100 ),
			'/akrinity/v1/newsletter'       => array( 'news', 200 ),
			'/akrinity/v1/reviews'          => array( 'review', 60 ),
			'/akrinity/v1/order-lookup'     => array( 'lookup', 300 ),
			'/akrinity/v1/quote-file'       => array( 'file', 3000 ), // about 2 MB each
		);
		$route = $request->get_route();
		if ( ! isset( $limits[ $route ] ) || 'POST' !== $request->get_method() ) {
			return $result;
		}
		list( $name, $max ) = $limits[ $route ];
		$key   = 'akr_cap_' . $name . '_' . gmdate( 'YmdH' );
		$count = (int) get_transient( $key );
		if ( $count >= $max ) {
			return new WP_REST_Response( array( 'code' => 'busy' ), 429 );
		}
		set_transient( $key, $count + 1, HOUR_IN_SECONDS );
		return $result;
	},
	10,
	3
);
