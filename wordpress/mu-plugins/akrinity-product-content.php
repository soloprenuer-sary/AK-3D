<?php
/**
 * Plugin Name: Akrinity product page content
 * Description: A "Product page content" box on each WooCommerce product that mirrors the product page sections in order (Key features, Intro, Section blocks with pictures, Package includes, Product Details, Product specs) and delivers them to the storefront in the Store API as extensions.akrinity_content, plus the signed draft preview link. Own code, no ACF.
 * Version: 3.0.0
 *
 * Needs WooCommerce only. No settings. No secrets in this file.
 *
 * Everything is saved in ONE product custom field, "akrc_data". The box writes it as an array. An import (for example the
 * Amazon capture CSV, column "Meta: akrc_data") may write it as a JSON text; both are read the same way. JSON shape:
 *   { "features": ["Lead: sentence", ...], "description": ["paragraph", ...], "package": ["1 x Rack"],
 *     "details": ["Label: Value", ...],
 *     "blocks": [ { "title": "Heading", "text": "Sentences", "id": 123, "url": "https://...", "alt": "..." } ],
 *     "specs": [ { "label": "Brand", "value": "Akrinity" } ] }
 * A block's picture is an Media Library attachment "id", or, until it is saved to the library, an https "url".
 *
 * Store API shape (GET /wp-json/wc/store/v1/products?slug=...):
 *   extensions.akrinity_content = {
 *     layout:   "pictures" | "text"      "pictures" when any block has a picture, else "text"
 *     features: [ "line" ]               Key features (ticks)
 *     description: [ "paragraph" ]       Intro text
 *     about:    [ { title, text, picture: null | { id, url, full, width, height, alt } } ]   section blocks, in order
 *     pictures: [ { id, url, full, width, height, alt, caption } ]   the pictures of the blocks, in order; caption = that block's heading
 *     package:  [ "line" ]               Package includes
 *     details:  [ { label, value } ]     Product Details lines
 *     specs:    [ { label, value } ]     Product specs table
 *     has_content: bool
 *   }
 */

defined( 'ABSPATH' ) || exit;

const AKRC_META          = 'akrc_data';
const AKRC_MAX_BLOCKS    = 40;
const AKRC_MAX_SPECS     = 60;
const AKRC_MAX_FEATURES  = 30;
const AKRC_MAX_PACKAGE   = 30;
const AKRC_MAX_DETAILS   = 40;

/* ---------- Saved data ---------- */

/** One plain text value: trimmed, no tags. */
function akrc_text( $value ): string {
	// Entities are turned back into plain characters: the WooCommerce importer turns & into &amp; in custom field values, and the storefront escapes text itself.
	return trim( wp_specialchars_decode( wp_strip_all_tags( (string) $value ), ENT_QUOTES ) );
}

/** A list given as text (one per line) or as an array of strings, as clean lines. */
function akrc_lines( $value, int $max ): array {
	$items = is_array( $value ) ? $value : preg_split( '/\r\n|\r|\n/', (string) $value );
	$out   = array();
	foreach ( $items as $line ) {
		$line = is_scalar( $line ) ? akrc_text( $line ) : '';
		if ( '' !== $line ) {
			$out[] = $line;
		}
	}
	return array_slice( $out, 0, $max );
}

/** Paragraphs given as text (blank line between) or as an array of strings. */
function akrc_paragraphs( $value ): array {
	if ( is_array( $value ) ) {
		return akrc_lines( $value, 20 );
	}
	$out = array();
	foreach ( preg_split( '/(?:\r\n|\r|\n){2,}/', trim( (string) $value ) ) as $para ) {
		$para = akrc_text( preg_replace( '/\s*(?:\r\n|\r|\n)\s*/', ' ', $para ) );
		if ( '' !== $para ) {
			$out[] = $para;
		}
	}
	return $out;
}

/** An https address, or an empty string. */
function akrc_url( $value ): string {
	$url = esc_url_raw( trim( wp_specialchars_decode( (string) $value, ENT_QUOTES ) ), array( 'https' ) );
	return $url;
}

/** Turns what the form posted, a saved array or a JSON text into the clean saved shape. */
function akrc_clean( $in ): array {
	if ( is_string( $in ) ) {
		$decoded = json_decode( $in, true );
		$in      = is_array( $decoded ) ? $decoded : array();
	}
	$in = is_array( $in ) ? $in : array();

	$blocks = array();
	foreach ( is_array( $in['blocks'] ?? null ) ? $in['blocks'] : array() as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$b = array(
			'title' => akrc_text( $row['title'] ?? '' ),
			'text'  => akrc_text( $row['text'] ?? '' ),
			'id'    => absint( $row['id'] ?? 0 ),
			'url'   => akrc_url( $row['url'] ?? '' ),
			'alt'   => akrc_text( $row['alt'] ?? '' ),
		);
		if ( '' !== $b['title'] || '' !== $b['text'] || $b['id'] || '' !== $b['url'] ) {
			$blocks[] = $b;
		}
	}

	$specs = array();
	foreach ( is_array( $in['specs'] ?? null ) ? $in['specs'] : array() as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$label = akrc_text( $row['label'] ?? '' );
		$value = akrc_text( $row['value'] ?? '' );
		if ( '' !== $label || '' !== $value ) {
			$specs[] = array( 'label' => $label, 'value' => $value );
		}
	}

	return array(
		'features'    => akrc_lines( $in['features'] ?? '', AKRC_MAX_FEATURES ),
		'description' => akrc_paragraphs( $in['description'] ?? '' ),
		'blocks'      => array_slice( $blocks, 0, AKRC_MAX_BLOCKS ),
		'package'     => akrc_lines( $in['package'] ?? '', AKRC_MAX_PACKAGE ),
		'details'     => akrc_lines( $in['details'] ?? '', AKRC_MAX_DETAILS ),
		'specs'       => array_slice( $specs, 0, AKRC_MAX_SPECS ),
	);
}

/* ---------- The box on the product screen ---------- */

add_action(
	'add_meta_boxes_product',
	function () {
		add_meta_box( 'akrc_content', 'Product page content', 'akrc_render_box', 'product', 'normal', 'default' );
	}
);

add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || 'product' !== get_post_type() ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_script( 'jquery-ui-sortable' );
	}
);

/** A multi-line field of a section. $value is an array of lines (or paragraphs). */
function akrc_area( string $name, string $value, string $label, int $rows, string $help ): string {
	$id = 'akrc_' . $name;
	return '<p class="akrc-f"><label for="' . esc_attr( $id ) . '"><strong>' . esc_html( $label ) . '</strong></label>'
		. '<span class="description">' . esc_html( $help ) . '</span>'
		. '<textarea id="' . esc_attr( $id ) . '" name="akrc[' . esc_attr( $name ) . ']" rows="' . (int) $rows . '" class="large-text">' . esc_textarea( $value ) . '</textarea></p>';
}

/** The picture of a block, as a thumbnail address ('' when none). */
function akrc_block_thumb( array $b ): string {
	if ( ! empty( $b['id'] ) ) {
		$src = wp_get_attachment_image_url( (int) $b['id'], 'thumbnail' );
		if ( $src ) {
			return $src;
		}
	}
	return ! empty( $b['url'] ) ? $b['url'] : '';
}

/** One row of a list, as HTML. $i is the row number (or the placeholder {{i}} for the template). */
function akrc_row_html( string $list, $i, array $v ): string {
	$n = 'akrc[' . $list . '][' . $i . ']';
	$h = '<div class="akrc-row"><span class="akrc-grip" title="Drag to reorder">&#8942;&#8942;</span><div class="akrc-cells">';
	if ( 'specs' === $list ) {
		$h .= '<input type="text" name="' . $n . '[label]" value="' . esc_attr( $v['label'] ?? '' ) . '" placeholder="Label, e.g. Brand" class="akrc-w35">';
		$h .= '<input type="text" name="' . $n . '[value]" value="' . esc_attr( $v['value'] ?? '' ) . '" placeholder="Value, e.g. Akrinity" class="akrc-w65">';
	} else { // blocks
		$thumb = akrc_block_thumb( $v );
		$h    .= '<span class="akrc-pic"><span class="akrc-thumb">' . ( $thumb ? '<img src="' . esc_url( $thumb ) . '" alt="" referrerpolicy="no-referrer">' : '' ) . '</span>'
			. '<span class="akrc-picbtns"><button type="button" class="button akrc-pick">' . ( $thumb ? 'Change picture' : 'Choose picture' ) . '</button>'
			. '<button type="button" class="button-link akrc-unpick"' . ( $thumb ? '' : ' hidden' ) . '>Remove picture</button></span>'
			. '<input type="hidden" class="akrc-pic-id" name="' . $n . '[id]" value="' . (int) ( $v['id'] ?? 0 ) . '">'
			. '<input type="hidden" class="akrc-pic-url" name="' . $n . '[url]" value="' . esc_attr( $v['url'] ?? '' ) . '"></span>';
		$h    .= '<span class="akrc-col"><input type="text" name="' . $n . '[title]" value="' . esc_attr( $v['title'] ?? '' ) . '" placeholder="Heading (also the picture caption)" class="akrc-full">'
			. '<textarea name="' . $n . '[text]" rows="2" placeholder="Text, one or two sentences" class="akrc-full">' . esc_textarea( $v['text'] ?? '' ) . '</textarea>'
			. '<input type="text" name="' . $n . '[alt]" value="' . esc_attr( $v['alt'] ?? '' ) . '" placeholder="Picture alt text (describes the picture)" class="akrc-full akrc-alt">';
		if ( empty( $v['id'] ) && ! empty( $v['url'] ) ) {
			$h .= '<span class="description akrc-remote">Picture hosted outside the Media Library. Choose a picture to replace it, or ask the WordPress agent to save it to the library.</span>';
		}
		$h .= '</span>';
	}
	return $h . '</div><button type="button" class="button-link akrc-del" aria-label="Remove row">Remove</button></div>';
}

function akrc_render_box( $post ) {
	$d = akrc_clean( get_post_meta( $post->ID, AKRC_META, true ) );
	wp_nonce_field( 'akrc_save', 'akrc_nonce' );
	?>
	<style>
	#akrc_content .akrc-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #c3c4c7;margin:0 0 12px}
	#akrc_content .akrc-tab{padding:8px 12px;border:1px solid #c3c4c7;border-bottom:0;background:#f6f7f7;cursor:pointer;border-radius:3px 3px 0 0}
	#akrc_content .akrc-tab[aria-selected=true]{background:#fff;font-weight:600;margin-bottom:-1px}
	#akrc_content .akrc-panel[hidden]{display:none}
	#akrc_content .akrc-note{background:#f0f6fc;border-left:4px solid #72aee6;padding:8px 12px;margin:0 0 12px}
	#akrc_content .akrc-sec{border:1px solid #dcdcde;border-radius:4px;padding:12px 14px;margin:0 0 14px;background:#fff}
	#akrc_content .akrc-sec>h4{margin:0 0 4px;font-size:14px}
	#akrc_content .akrc-sec>.description{display:block;margin:0 0 8px}
	#akrc_content .akrc-f{display:flex;flex-direction:column;gap:4px;margin:0 0 8px}
	#akrc_content .akrc-row{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid #dcdcde;background:#fafafa;margin-bottom:6px;border-radius:3px}
	#akrc_content .akrc-grip{cursor:grab;color:#8c8f94;padding-top:6px;letter-spacing:-2px;user-select:none}
	#akrc_content .akrc-cells{flex:1;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;min-width:0}
	#akrc_content .akrc-cells input[type=text],#akrc_content .akrc-cells textarea{min-width:0;box-sizing:border-box}
	#akrc_content .akrc-w35{flex:1 1 30%}#akrc_content .akrc-w65{flex:1 1 55%}
	#akrc_content .akrc-col{flex:1 1 260px;display:flex;flex-direction:column;gap:6px;min-width:0}
	#akrc_content .akrc-full{width:100%}
	#akrc_content .akrc-pic{display:flex;flex-direction:column;gap:6px;align-items:flex-start;flex:0 0 96px}
	#akrc_content .akrc-picbtns{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
	#akrc_content .akrc-thumb{display:grid;place-items:center;width:96px;height:96px;background:#e8e8ea;border:1px solid #c3c4c7;color:#8c8f94;font-size:11px;text-align:center}
	#akrc_content .akrc-thumb:empty::before{content:"No picture"}
	#akrc_content .akrc-thumb img{max-width:100%;max-height:100%}
	#akrc_content .akrc-del,#akrc_content .akrc-unpick{color:#b32d2e}
	#akrc_content .akrc-del{padding-top:6px}
	</style>
	<div class="akrc-note">The sections below are in the same order as on the product page. Fill them in, then click <strong>Save draft</strong> (or Update) and use Preview. A product with at least one block picture shows the picture layout; with none it shows the text layout.</div>
	<div class="akrc-tabs" role="tablist">
		<button type="button" class="akrc-tab" role="tab" data-t="page" aria-selected="true">Page content</button>
		<button type="button" class="akrc-tab" role="tab" data-t="specs" aria-selected="false">Product specs</button>
	</div>

	<div class="akrc-panel" data-p="page">
		<div class="akrc-sec">
			<h4>1. Key features</h4>
			<?php echo akrc_area( 'features', implode( "\n", $d['features'] ), 'Features (one per line)', 7, 'Example: 18-car display capacity: Designed to showcase up to 18 cars. Shown as a ticked list.' ); ?>
		</div>
		<div class="akrc-sec">
			<h4>2. Intro</h4>
			<?php echo akrc_area( 'description', implode( "\n\n", $d['description'] ), 'Intro text', 6, 'Plain text. Leave a blank line between paragraphs.' ); ?>
		</div>
		<div class="akrc-sec">
			<h4>3. Section blocks and pictures (A+ content)</h4>
			<span class="description">Each block has an optional picture, a heading and a short text. The heading is also the caption on the picture. Blocks show in this order; the pictures form the picture grid. Leave out pictures if the product has none.</span>
			<div class="akrc-list" data-list="blocks"><?php foreach ( $d['blocks'] as $i => $row ) { echo akrc_row_html( 'blocks', $i, $row ); } ?></div>
			<p><button type="button" class="button akrc-add" data-list="blocks">+ Add block</button></p>
		</div>
		<div class="akrc-sec">
			<h4>4. Package includes</h4>
			<?php echo akrc_area( 'package', implode( "\n", $d['package'] ), 'Items (one per line)', 3, 'Example: 1 x Car display rack. Leave empty to hide the section.' ); ?>
		</div>
		<div class="akrc-sec">
			<h4>5. Product Details</h4>
			<?php echo akrc_area( 'details', implode( "\n", $d['details'] ), 'Lines (Label: Value, one per line)', 5, 'Example: Design: Hexagonal Geometric Frame.' ); ?>
		</div>
	</div>

	<div class="akrc-panel" data-p="specs" hidden>
		<div class="akrc-note">Rows of the "Product specs" table. Type any label and value. This table does not use the Attributes tab, so attributes stay free for variations.</div>
		<div class="akrc-list" data-list="specs"><?php foreach ( $d['specs'] as $i => $row ) { echo akrc_row_html( 'specs', $i, $row ); } ?></div>
		<p><button type="button" class="button akrc-add" data-list="specs">+ Add row</button></p>
	</div>

	<script type="text/html" id="akrc-tpl-blocks"><?php echo akrc_row_html( 'blocks', '{{i}}', array() ); ?></script>
	<script type="text/html" id="akrc-tpl-specs"><?php echo akrc_row_html( 'specs', '{{i}}', array() ); ?></script>
	<script>
	jQuery(function ($) {
		var $box = $('#akrc_content');
		var next = { blocks: 1000, specs: 1000 };
		$box.on('click', '.akrc-tab', function () {
			var t = $(this).data('t');
			$box.find('.akrc-tab').attr('aria-selected', 'false');
			$(this).attr('aria-selected', 'true');
			$box.find('.akrc-panel').attr('hidden', true).filter('[data-p="' + t + '"]').removeAttr('hidden');
		});
		$box.find('.akrc-list').sortable({ handle: '.akrc-grip', items: '.akrc-row', axis: 'y' });
		$box.on('click', '.akrc-add', function () {
			var l = $(this).data('list');
			var html = $('#akrc-tpl-' + l).html().replace(/\{\{i\}\}/g, next[l]++);
			var $row = $(html).appendTo($box.find('.akrc-list[data-list="' + l + '"]'));
			$row.find('input[type=text],textarea').first().trigger('focus');
		});
		$box.on('click', '.akrc-del', function () { $(this).closest('.akrc-row').remove(); });
		$box.on('click', '.akrc-unpick', function () {
			var $row = $(this).closest('.akrc-row');
			$row.find('.akrc-pic-id, .akrc-pic-url').val('');
			$row.find('.akrc-thumb').empty();
			$row.find('.akrc-remote').remove();
			$row.find('.akrc-pick').text('Choose picture');
			$(this).attr('hidden', true);
		});
		$box.on('click', '.akrc-pick', function () {
			var $row = $(this).closest('.akrc-row'), $btn = $(this);
			var frame = wp.media({ title: 'Choose a picture', multiple: false, library: { type: 'image' } });
			frame.on('select', function () {
				var a = frame.state().get('selection').first().toJSON();
				var url = (a.sizes && a.sizes.thumbnail) ? a.sizes.thumbnail.url : a.url;
				$row.find('.akrc-pic-id').val(a.id);
				$row.find('.akrc-pic-url').val('');
				$row.find('.akrc-remote').remove();
				$row.find('.akrc-thumb').empty().append($('<img>', { src: url, alt: '' }));
				$btn.text('Change picture');
				$row.find('.akrc-unpick').removeAttr('hidden');
				var $alt = $row.find('.akrc-alt');
				if (!$alt.val() && a.alt) { $alt.val(a.alt); }
			});
			frame.open();
		});
	});
	</script>
	<?php
}

add_action(
	'save_post_product',
	function ( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! isset( $_POST['akrc_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['akrc_nonce'] ) ), 'akrc_save' ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$posted = isset( $_POST['akrc'] ) ? wp_unslash( $_POST['akrc'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- cleaned by akrc_clean().
		$clean  = akrc_clean( $posted );
		if ( ! array_filter( $clean ) ) {
			delete_post_meta( $post_id, AKRC_META );
		} else {
			update_post_meta( $post_id, AKRC_META, $clean );
		}
	}
);

/* ---------- Reading the data for the storefront ---------- */

/** A picture for the Store API: from the Media Library, or an https address until it is saved there. Null when there is none. */
function akrc_picture( array $b ): ?array {
	$alt = $b['alt'];
	if ( $b['id'] > 0 && 'attachment' === get_post_type( $b['id'] ) ) {
		$large = wp_get_attachment_image_src( $b['id'], 'large' );
		$full  = wp_get_attachment_image_src( $b['id'], 'full' );
		if ( $large && $full ) {
			return array(
				'id'     => (int) $b['id'],
				'url'    => $large[0],
				'full'   => $full[0],
				'width'  => (int) $full[1],
				'height' => (int) $full[2],
				'alt'    => '' !== $alt ? $alt : akrc_text( get_post_meta( $b['id'], '_wp_attachment_image_alt', true ) ),
			);
		}
	}
	if ( '' !== $b['url'] ) {
		return array( 'id' => 0, 'url' => $b['url'], 'full' => $b['url'], 'width' => 0, 'height' => 0, 'alt' => $alt );
	}
	return null;
}

/** The product page content for one product, only the parts that are filled in. */
function akrc_content( int $product_id ): array {
	$d = akrc_clean( get_post_meta( $product_id, AKRC_META, true ) );

	$about    = array();
	$pictures = array();
	foreach ( $d['blocks'] as $b ) {
		$pic     = akrc_picture( $b );
		$about[] = array( 'title' => $b['title'], 'text' => $b['text'], 'picture' => $pic );
		if ( $pic ) {
			$pictures[] = $pic + array( 'caption' => $b['title'] );
		}
	}

	$details = array();
	foreach ( $d['details'] as $line ) {
		$pos       = strpos( $line, ':' );
		$details[] = false === $pos
			? array( 'label' => '', 'value' => $line )
			: array( 'label' => trim( substr( $line, 0, $pos ) ), 'value' => trim( substr( $line, $pos + 1 ) ) );
	}

	$specs = array();
	foreach ( $d['specs'] as $row ) {
		if ( '' !== $row['label'] && '' !== $row['value'] ) {
			$specs[] = $row;
		}
	}

	return array(
		'layout'      => $pictures ? 'pictures' : 'text',
		'features'    => $d['features'],
		'description' => $d['description'],
		'about'       => $about,
		'pictures'    => $pictures,
		'package'     => $d['package'],
		'details'     => $details,
		'specs'       => $specs,
		'has_content' => (bool) ( $d['features'] || $d['description'] || $about || $d['package'] || $details || $specs ),
	);
}

/* ---------- Delivery to the storefront ---------- */

add_action(
	'woocommerce_blocks_loaded',
	function () {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}
		$endpoint = class_exists( '\Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema' )
			? \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER
			: 'product';
		$arr      = function ( string $description ) {
			return array(
				'description' => $description,
				'type'        => 'array',
				'context'     => array( 'view' ),
				'readonly'    => true,
			);
		};
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => $endpoint,
				'namespace'       => 'akrinity_content',
				'data_callback'   => function ( $product ) {
					return akrc_content( (int) $product->get_id() );
				},
				'schema_callback' => function () use ( $arr ) {
					return array(
						'layout'      => array(
							'description' => '"pictures" when the product has A+ pictures, otherwise "text".',
							'type'        => 'string',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
						'features'    => $arr( 'Key features lines (text layout).' ),
						'description' => $arr( 'Description paragraphs (text layout).' ),
						'package'     => $arr( 'Package includes lines (text layout).' ),
						'about'       => $arr( 'About this product text blocks.' ),
						'details'     => $arr( 'Product Details lines.' ),
						'pictures'    => $arr( 'About pictures.' ),
						'specs'       => $arr( 'Product specs table rows.' ),
						'has_content' => array(
							'description' => 'True when any product page content is filled in.',
							'type'        => 'boolean',
							'context'     => array( 'view' ),
							'readonly'    => true,
						),
					);
				},
				'schema_type'     => ARRAY_A,
			)
		);
	}
);

/* ---------- Draft preview on the storefront ---------- */

/*
 * The Preview button on a product in WordPress opens the storefront (AKRINITY_FRONTEND_URL) at /api/preview with a signed,
 * time-limited link:  /api/preview?id=<product id>&exp=<unix time>&token=<signature>
 * The storefront server then asks WordPress for the draft with the same three values plus the shared key:
 *   GET /wp-json/akrinity/v1/preview/product?id=&exp=&token=     header X-Akrinity-Key: <AKRINITY_SHARED_SECRET>
 * The answer is the product in the same shape as the Store API (so the same page code renders it), plus a "preview" block.
 * Nothing about a draft is ever public: the route needs the shared key AND a valid signature, and the link stops working after 24 hours.
 * Tip for editors: click "Save draft" first, then Preview, so the latest field values are saved.
 */

function akrc_preview_secret(): string {
	return ( defined( 'AKRINITY_SHARED_SECRET' ) && strlen( (string) AKRINITY_SHARED_SECRET ) >= 32 ) ? (string) AKRINITY_SHARED_SECRET : '';
}

function akrc_preview_token( int $id, int $exp ): string {
	return hash_hmac( 'sha256', "akr-preview|{$id}|{$exp}", akrc_preview_secret() );
}

add_filter(
	'preview_post_link',
	function ( $link, $post ) {
		if ( ! $post || 'product' !== $post->post_type || '' === akrc_preview_secret() || ! defined( 'AKRINITY_FRONTEND_URL' ) ) {
			return $link;
		}
		$exp = time() + DAY_IN_SECONDS;
		return add_query_arg(
			array(
				'id'    => (int) $post->ID,
				'exp'   => $exp,
				'token' => akrc_preview_token( (int) $post->ID, $exp ),
			),
			rtrim( (string) AKRINITY_FRONTEND_URL, '/' ) . '/api/preview'
		);
	},
	20,
	2
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'akrinity/v1',
			'/preview/product',
			array(
				'methods'             => 'GET',
				'permission_callback' => function ( WP_REST_Request $req ) {
					$secret = akrc_preview_secret();
					$sent   = (string) $req->get_header( 'x-akrinity-key' );
					return '' !== $secret && '' !== $sent && hash_equals( $secret, $sent );
				},
				'callback'            => function ( WP_REST_Request $req ) {
					$id    = (int) $req->get_param( 'id' );
					$exp   = (int) $req->get_param( 'exp' );
					$token = (string) $req->get_param( 'token' );
					if ( $id < 1 || '' === $token || ! hash_equals( akrc_preview_token( $id, $exp ), $token ) ) {
						return new WP_REST_Response( array( 'code' => 'bad_token' ), 403 );
					}
					if ( $exp < time() ) {
						return new WP_REST_Response( array( 'code' => 'expired' ), 410 );
					}
					$post = get_post( $id );
					if ( ! $post || 'product' !== $post->post_type || in_array( $post->post_status, array( 'trash', 'auto-draft' ), true ) ) {
						return new WP_REST_Response( array( 'code' => 'not_found' ), 404 );
					}
					// Build the product exactly as the Store API would (same schema, same extensions), without its published-only check.
					$product = wc_get_product( $id );
					$data    = null;
					if ( $product && class_exists( '\Automattic\WooCommerce\StoreApi\StoreApi' ) ) {
						try {
							$schema = \Automattic\WooCommerce\StoreApi\StoreApi::container()->get( \Automattic\WooCommerce\StoreApi\SchemaController::class )->get( 'product' );
							$data   = json_decode( wp_json_encode( $schema->get_item_response( $product ) ), true );
						} catch ( \Throwable $e ) {
							$data = null;
						}
					}
					if ( ! is_array( $data ) ) {
						return new WP_REST_Response( array( 'code' => 'not_available' ), 502 );
					}
					$data['preview'] = array(
						'status'  => $post->post_status,
						'expires' => $exp,
					);
					$out = new WP_REST_Response( $data, 200 );
					$out->header( 'X-Robots-Tag', 'noindex, nofollow' );
					$out->header( 'Cache-Control', 'no-store' );
					return $out;
				},
			)
		);
	}
);
