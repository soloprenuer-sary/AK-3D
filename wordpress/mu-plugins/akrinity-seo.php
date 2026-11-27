<?php
/**
 * Plugin Name: Akrinity SEO bridge
 * Description: (1) Lets Rank Math score a product on the text in the "Product page content" box, not only on the main description. (2) Sends the Rank Math SEO title and meta description of each product to the storefront, which shows them to Google. Nothing visible changes on a product until a title or description is typed in Rank Math. Works with akrinity-product-content.php and Rank Math. Version 1.0.0.
 *
 * Store API:  extensions.akrinity_seo = { title: "", description: "" }   (empty when not typed in Rank Math)
 */

defined( 'ABSPATH' ) || exit;

/** The Rank Math title and description typed for one product, with Rank Math variables filled in. */
function akrseo_data( int $id ): array {
	$out  = array(
		'title'       => '',
		'description' => '',
	);
	$post = get_post( $id );
	if ( ! $post ) {
		return $out;
	}
	foreach ( array( 'title' => 'rank_math_title', 'description' => 'rank_math_description' ) as $key => $meta ) {
		$value = trim( (string) get_post_meta( $id, $meta, true ) );
		if ( false !== strpos( $value, '%' ) && is_callable( array( '\RankMath\Helper', 'replace_vars' ) ) ) {
			$value = (string) \RankMath\Helper::replace_vars( $value, $post );
		}
		// A variable that could not be filled in must never reach Google.
		if ( '' === $value || preg_match( '/%[a-z_]+(\([^)]*\))?%/i', $value ) ) {
			continue;
		}
		$out[ $key ] = trim( wp_specialchars_decode( wp_strip_all_tags( $value ), ENT_QUOTES ) );
	}
	return $out;
}

add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}
		$schema = '\Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema';
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => class_exists( $schema ) ? $schema::IDENTIFIER : 'product',
				'namespace'       => 'akrinity_seo',
				'data_callback'   => function ( $product ) {
					return akrseo_data( (int) $product->get_id() );
				},
				'schema_callback' => function () {
					$text = function ( string $description ) {
						return array(
							'description' => $description,
							'type'        => 'string',
							'context'     => array( 'view' ),
							'readonly'    => true,
						);
					};
					return array(
						'title'       => $text( 'SEO title typed in Rank Math.' ),
						'description' => $text( 'Meta description typed in Rank Math.' ),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);
	}
);

/** On the product edit screen: hands the content box text to Rank Math's analysis, and refreshes it while typing. */
function akrseo_editor_script(): void {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || 'product' !== $screen->post_type ) {
		return;
	}
	?>
	<script id="akrseo-rank-math">
	( function ( $ ) {
		$( function () {
			var box = $( '#akrc_content' );
			if ( ! box.length || ! window.wp || ! wp.hooks ) {
				return;
			}
			function safe( s ) {
				return String( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
			}
			function clean( v ) {
				return $.trim( v || '' );
			}
			function field( name ) {
				return clean( box.find( '[name="akrc[' + name + ']"]' ).val() );
			}
			function list( title, name ) {
				var items = field( name ).split( /\r?\n/ ).map( clean ).filter( Boolean );
				return items.length ? '<h2>' + title + '</h2><ul><li>' + items.map( safe ).join( '</li><li>' ) + '</li></ul>' : '';
			}
			function content() {
				var out = list( 'Key features', 'features' );
				field( 'description' ).split( /\n\s*\n/ ).map( clean ).filter( Boolean ).forEach( function ( p ) {
					out += '<p>' + safe( p ) + '</p>';
				} );
				box.find( '.akrc-list[data-list="blocks"] .akrc-row' ).each( function () {
					var row = $( this ),
						title = clean( row.find( '[name$="[title]"]' ).val() ),
						text = clean( row.find( '[name$="[text]"]' ).val() ),
						alt = clean( row.find( '[name$="[alt]"]' ).val() ),
						src = row.find( '.akrc-thumb img' ).attr( 'src' );
					if ( title ) {
						out += '<h2>' + safe( title ) + '</h2>';
					}
					if ( text ) {
						out += '<p>' + safe( text ) + '</p>';
					}
					if ( src ) {
						out += '<img src="' + safe( src ) + '" alt="' + safe( alt || title ) + '">';
					}
				} );
				out += list( 'Package includes', 'package' ) + list( 'Product details', 'details' );
				var specs = [];
				box.find( '.akrc-list[data-list="specs"] .akrc-row' ).each( function () {
					var label = clean( $( this ).find( '[name$="[label]"]' ).val() ),
						value = clean( $( this ).find( '[name$="[value]"]' ).val() );
					if ( label && value ) {
						specs.push( safe( label + ': ' + value ) );
					}
				} );
				if ( specs.length ) {
					out += '<h2>Specifications</h2><ul><li>' + specs.join( '</li><li>' ) + '</li></ul>';
				}
				return out;
			}
			wp.hooks.addFilter( 'rank_math_content', 'akrinity/product-content', function ( existing ) {
				return ( existing || '' ) + content();
			} );
			var timer;
			function refresh() {
				clearTimeout( timer );
				timer = setTimeout( function () {
					if ( window.rankMathEditor ) {
						window.rankMathEditor.refresh( 'content' );
					}
				}, 600 );
			}
			box.on( 'input change', refresh ).on( 'click', '.akrc-del, .akrc-unpick', refresh );
			// Rank Math starts after the page loads: refresh a few times so its first score includes this text.
			[ 1500, 4000, 8000 ].forEach( function ( ms ) {
				setTimeout( refresh, ms );
			} );
		} );
	} )( jQuery );
	</script>
	<?php
}
add_action( 'admin_footer-post.php', 'akrseo_editor_script', 99 );
add_action( 'admin_footer-post-new.php', 'akrseo_editor_script', 99 );
