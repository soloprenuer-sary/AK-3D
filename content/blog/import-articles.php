<?php
/**
 * Uploads the Knowledge hub articles in this folder to WordPress. Run with WP-CLI from the
 * WordPress folder (see docs/BACKEND_TASK_BLOG.md):
 *
 *   wp eval-file import-articles.php            check only: says what would happen, writes nothing
 *   wp eval-file import-articles.php draft      uploads the pictures and creates the NEW articles
 *                                               as drafts; articles already live are not touched
 *   wp eval-file import-articles.php publish    publishes all of them, updating the live ones in place
 *
 * Add the word "force" after the mode to overwrite an article that somebody changed in WordPress.
 * Running it again is safe: pictures are not uploaded twice and articles are not duplicated.
 * Before any article is changed, the old version is saved in ~/backups.
 *
 * This is a one-off tool. Keep it outside the web folder; it is not a plugin.
 */

if ( ! defined( 'ABSPATH' ) || ! class_exists( 'WP_CLI' ) ) {
	exit;
}

$akr_args  = isset( $args ) ? (array) $args : array();
$akr_force = in_array( 'force', $akr_args, true );
$akr_modes = array_values( array_diff( $akr_args, array( 'force' ) ) );
$akr_mode  = isset( $akr_modes[0] ) ? $akr_modes[0] : 'check';
if ( count( $akr_modes ) > 1 || ! in_array( $akr_mode, array( 'check', 'draft', 'publish' ), true ) ) {
	WP_CLI::error( 'Use: check, draft or publish, optionally followed by force.' );
}

$akr_dir = file_exists( __DIR__ . '/posts.json' ) ? __DIR__ : getcwd();

/* ---------- 1. Read everything first, so a missing file stops the run before anything is written ---------- */

$akr_list = json_decode( (string) @file_get_contents( $akr_dir . '/posts.json' ), true );
if ( ! is_array( $akr_list ) || ! $akr_list ) {
	WP_CLI::error( "posts.json is missing or broken in $akr_dir" );
}
$akr_posts = array();
foreach ( $akr_list as $p ) {
	foreach ( array( 'slug', 'title', 'excerpt', 'category', 'cover', 'coverAlt' ) as $key ) {
		if ( empty( $p[ $key ] ) ) {
			WP_CLI::error( "posts.json: an article has no '$key'." );
		}
	}
	$html = (string) @file_get_contents( $akr_dir . '/' . $p['slug'] . '.html' );
	if ( '' === trim( $html ) ) {
		WP_CLI::error( "Missing article text: {$p['slug']}.html" );
	}
	$p['html']   = str_replace( "\r\n", "\n", trim( $html ) );
	$p['images'] = array( $p['cover'] => $p['coverAlt'] );
	preg_match_all( '#<img src="images/([^"]+)" alt="([^"]*)"#', $p['html'], $found, PREG_SET_ORDER );
	foreach ( $found as $f ) {
		$p['images'][ $f[1] ] = html_entity_decode( $f[2], ENT_QUOTES, 'UTF-8' );
	}
	foreach ( array_keys( $p['images'] ) as $file ) {
		if ( ! is_file( $akr_dir . '/images/' . $file ) ) {
			WP_CLI::error( "Missing picture: images/$file" );
		}
	}
	// Pictures that are already in the media library are linked by their full address.
	preg_match_all( '#<img src="(https://[^"]+)"#', $p['html'], $remote );
	$p['library'] = $remote[1];
	$akr_posts[]  = $p;
}

/* ---------- 2. Decide what happens to each article ---------- */

$akr_fingerprint = function ( $post ) {
	return md5( $post->post_title . "\n" . $post->post_excerpt . "\n" . $post->post_content );
};

$akr_find = function ( $slug ) {
	$base  = array(
		'post_type'   => 'post',
		'post_status' => array( 'publish', 'draft', 'pending', 'future', 'private' ),
		'numberposts' => 5,
	);
	$found = get_posts( $base + array( 'meta_key' => '_akr_blog_slug', 'meta_value' => $slug ) );
	if ( ! $found ) {
		$found = get_posts( $base + array( 'name' => $slug ) );
	}
	return $found;
};

$akr_plan   = array();
$akr_author = 0;
foreach ( $akr_posts as $i => $p ) {
	$found = $akr_find( $p['slug'] );
	$old   = $found ? $found[0] : null;
	$step  = array( 'post' => $p, 'old' => $old, 'order' => $i, 'action' => 'create', 'why' => '' );
	if ( count( $found ) > 1 ) {
		$step['action'] = 'skip';
		$step['why']    = 'more than one article uses this address; tidy up in WordPress first';
	} elseif ( $old ) {
		if ( ! $akr_author ) {
			$akr_author = (int) $old->post_author;
		}
		$hash = get_post_meta( $old->ID, '_akr_blog_hash', true );
		// Ours and unchanged, or one of the short placeholder posts that start "Sample article."
		$safe = $hash
			? $hash === $akr_fingerprint( $old )
			: 0 === strpos( trim( wp_strip_all_tags( $old->post_content ) ), 'Sample article.' );
		if ( 'draft' === $akr_mode && 'publish' === $old->post_status ) {
			$step['action'] = 'skip';
			$step['why']    = 'already live; publish will update it';
		} elseif ( ! $safe && ! $akr_force ) {
			$step['action'] = 'skip';
			$step['why']    = 'changed in WordPress; add force to overwrite';
		} else {
			$step['action'] = 'update';
		}
	}
	$akr_plan[] = $step;
}

WP_CLI::log( "Mode: $akr_mode" . ( $akr_force ? ' (force)' : '' ) );
foreach ( $akr_plan as $step ) {
	$old = $step['old'] ? "#{$step['old']->ID} {$step['old']->post_status}" : 'not in WordPress yet';
	WP_CLI::log( sprintf( '  %-6s %s (%s)%s', $step['action'], $step['post']['slug'], $old, $step['why'] ? ": {$step['why']}" : '' ) );
	foreach ( $step['post']['library'] as $url ) {
		if ( ! attachment_url_to_postid( $url ) ) {
			WP_CLI::warning( "Picture not found in the media library: $url" );
		}
	}
}

if ( 'check' === $akr_mode ) {
	WP_CLI::success( 'Check only. Nothing was changed.' );
	return;
}

/* ---------- 3. Save the old versions ---------- */

$akr_backup = array();
foreach ( $akr_plan as $step ) {
	if ( 'update' === $step['action'] ) {
		$old          = $step['old'];
		$akr_backup[] = array(
			'post'       => get_object_vars( $old ),
			'categories' => wp_get_post_categories( $old->ID ),
			'thumbnail'  => (int) get_post_thumbnail_id( $old->ID ),
		);
	}
}
if ( $akr_backup ) {
	$folder = rtrim( getenv( 'HOME' ) ? getenv( 'HOME' ) : dirname( ABSPATH ), '/' ) . '/backups';
	if ( ! is_dir( $folder ) && ! mkdir( $folder, 0700, true ) ) {
		WP_CLI::error( "Could not create $folder. Nothing was changed." );
	}
	$file = $folder . '/blog-articles-before-' . gmdate( 'Ymd-His' ) . '.json';
	if ( ! file_put_contents( $file, wp_json_encode( $akr_backup, JSON_PRETTY_PRINT ) ) ) {
		WP_CLI::error( "Could not write the backup $file. Nothing was changed." );
	}
	WP_CLI::log( "Old versions saved to $file" );
}

/* ---------- 4. Upload pictures and write the articles ---------- */

require_once ABSPATH . 'wp-admin/includes/image.php';

/** The media library entry for a picture file, uploading it only if this exact file is not there yet. */
$akr_picture = function ( $file, $alt ) use ( $akr_dir ) {
	$path = $akr_dir . '/images/' . $file;
	$md5  = md5_file( $path );
	$have = get_posts(
		array(
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'meta_key'    => '_akr_blog_md5',
			'meta_value'  => $md5,
			'numberposts' => 1,
		)
	);
	if ( $have ) {
		return (int) $have[0]->ID;
	}
	$upload = wp_upload_bits( 'akrinity-guide-' . $file, null, file_get_contents( $path ) );
	if ( ! empty( $upload['error'] ) ) {
		WP_CLI::error( "Upload failed for $file: {$upload['error']}" );
	}
	$id = wp_insert_attachment(
		array(
			'post_mime_type' => 'image/png',
			'post_title'     => ucfirst( str_replace( '-', ' ', basename( $file, '.png' ) ) ),
			'post_status'    => 'inherit',
		),
		$upload['file'],
		0,
		true
	);
	if ( is_wp_error( $id ) ) {
		WP_CLI::error( "Could not add $file to the media library: " . $id->get_error_message() );
	}
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	update_post_meta( $id, '_wp_attachment_image_alt', wp_slash( $alt ) );
	update_post_meta( $id, '_akr_blog_md5', $md5 );
	return (int) $id;
};

$akr_done = array( 'create' => 0, 'update' => 0, 'skip' => 0 );
$akr_now  = time();
foreach ( $akr_plan as $step ) {
	$p   = $step['post'];
	$old = $step['old'];
	if ( 'skip' === $step['action'] ) {
		++$akr_done['skip'];
		continue;
	}
	$ids = array();
	foreach ( $p['images'] as $file => $alt ) {
		$ids[ $file ] = $akr_picture( $file, $alt );
	}
	$content = preg_replace_callback(
		'#<img src="([^"]+)"#',
		function ( $m ) use ( $ids ) {
			$src = $m[1];
			if ( 0 === strpos( $src, 'images/' ) ) {
				$id  = $ids[ substr( $src, 7 ) ];
				$src = wp_get_attachment_url( $id );
			} else {
				$id = attachment_url_to_postid( $src );
			}
			// The wp-image class lets WordPress add the right sizes to the picture.
			return '<img ' . ( $id ? "class=\"wp-image-$id\" " : '' ) . 'src="' . esc_url( $src ) . '"';
		},
		$p['html']
	);

	$term = term_exists( $p['category'], 'category' );
	if ( ! $term ) {
		$term = wp_insert_term( $p['category'], 'category' );
	}
	if ( is_wp_error( $term ) ) {
		WP_CLI::error( "Category {$p['category']}: " . $term->get_error_message() );
	}

	$data = array(
		'post_type'     => 'post',
		'post_title'    => $p['title'],
		'post_name'     => $p['slug'],
		'post_excerpt'  => $p['excerpt'],
		'post_content'  => $content,
		'post_status'   => 'publish' === $akr_mode ? 'publish' : 'draft',
		'post_category' => array( (int) $term['term_id'] ),
	);
	if ( ! $old ) {
		$data['comment_status'] = 'closed';
		$data['ping_status']    = 'closed';
		if ( $akr_author ) {
			$data['post_author'] = $akr_author;
		}
	}
	// An article that goes live now gets today's date, one minute apart so the list keeps this order.
	// An article that is already live keeps its first date.
	if ( 'publish' === $akr_mode && ( ! $old || 'publish' !== $old->post_status ) ) {
		$stamp                 = $akr_now - 60 * $step['order'];
		$data['post_date_gmt'] = gmdate( 'Y-m-d H:i:s', $stamp );
		$data['post_date']     = get_date_from_gmt( $data['post_date_gmt'] );
		$data['edit_date']     = true;
	}

	if ( $old ) {
		$data['ID'] = $old->ID;
		$id         = wp_update_post( wp_slash( $data ), true );
	} else {
		$id = wp_insert_post( wp_slash( $data ), true );
	}
	if ( is_wp_error( $id ) || ! $id ) {
		WP_CLI::error( "Could not save {$p['slug']}" . ( is_wp_error( $id ) ? ': ' . $id->get_error_message() : '' ) );
	}
	set_post_thumbnail( $id, $ids[ $p['cover'] ] );
	update_post_meta( $id, '_akr_blog_slug', $p['slug'] );
	clean_post_cache( $id );
	$saved = get_post( $id );
	update_post_meta( $id, '_akr_blog_hash', $akr_fingerprint( $saved ) );
	if ( $saved->post_name !== $p['slug'] ) {
		WP_CLI::warning( "{$p['slug']} was saved with a different address: {$saved->post_name}" );
	}
	++$akr_done[ $step['action'] ];
	WP_CLI::log( "  saved #$id {$p['slug']} ({$saved->post_status})" );
}

WP_CLI::success( "Created {$akr_done['create']}, updated {$akr_done['update']}, skipped {$akr_done['skip']}." );
