<?php declare(strict_types=1);
/*
Plugin Name: Ultrafunk Theme Extender
Plugin URI:  https://github.com/ultrafunk/ultrafunk.com
Description: Ultrafunk theme extended functionality plug-in
Author:      Ultrafunk
Author URI:  https://ultrafunk.com
Version:     1.30.4
License:     Apache License 2.0
License URI: https://www.apache.org/licenses/LICENSE-2.0
*/


namespace Ultrafunk\Plugin;


use function Ultrafunk\Globals\get_cached_home_url;


/**************************************************************************************************************************/


if (!defined('ABSPATH')) exit;

cleanup_wp_header();


/**************************************************************************************************************************/


//
// Activate the plugin
//
function plugin_activate() : void
{ 
  register_custom_post_types(); 
  flush_rewrite_rules(); 
}
register_activation_hook(__FILE__, '\Ultrafunk\Plugin\plugin_activate');

//
// Deactivate the plugin
//
function plugin_deactivate() : void
{
  unregister_post_type('uf_track');
  flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, '\Ultrafunk\Plugin\plugin_deactivate');

//
// Remove default WordPress header stuff that is not needed...
//
function cleanup_wp_header() : void
{
  // Remove WP-Emoji for visitors
  remove_action('wp_head', 'print_emoji_detection_script', 7);
  remove_action('wp_print_styles', 'print_emoji_styles');

  // Remove WP-Emoji for admins
  remove_action('admin_print_scripts', 'print_emoji_detection_script');
  remove_action('admin_print_styles', 'print_emoji_styles');

  // Remove support for embedding WordPress content
  remove_action('wp_head', 'wp_oembed_add_host_js');

  // Remove wlwmanifest.xml (needed to support windows live writer)
  remove_action('wp_head', 'wlwmanifest_link');

  // Remove Gutenberg CSS for visitors
  remove_action('wp_enqueue_scripts', 'wp_common_block_scripts_and_styles');

  // Remove RSD link
  remove_action('wp_head', 'rsd_link');

  // Remove Shortlink
  remove_action('wp_head', 'wp_shortlink_wp_head');
}


/**************************************************************************************************************************/


//
// Register Ultrafunk custom post types
//
function register_custom_post_types() : void
{
  //
  // Register Tracks custom post type
  //
  $labels = array(
    'add_new_item'             => 'Add New Track',
    'all_items'                => 'All Tracks',
    'archives'                 => 'Track Archives',
    'attributes'               => 'Track Attributes',
    'edit_item'                => 'Edit Track',
    'filter_items_list'        => 'Filter Tracks list',
    'insert_into_item'         => 'Insert into Track',
    'item_published'           => 'Track published.',
    'item_published_privately' => 'Track published privately.',
    'item_reverted_to_draft'   => 'Track reverted to draft.',
    'item_scheduled'           => 'Track scheduled.',
    'item_updated'             => 'Track updated.',
    'items_list'               => 'Tracks list',
    'items_list_navigation'    => 'Tracks list navigation',
    'menu_name'                => 'Tracks',
    'name'                     => 'Tracks',
    'name_admin_bar'           => 'Track',
    'new_item'                 => 'New Track',
    'not_found'                => 'No Tracks found.',
    'not_found_in_trash'       => 'No Tracks found in Trash.',
    'search_items'             => 'Search Tracks',
    'singular_name'            => 'Track',
    'uploaded_to_this_item'    => 'Uploaded to this Track',
    'view_item'                => 'View Track',
    'view_items'               => 'View Tracks',
  );     

  $args = array(
    'description'   => 'Track custom post type.',
    'labels'        => $labels,
    'public'        => true,
    'menu_icon'     => 'dashicons-album',
    'menu_position' => 5,
    'supports'      => array('title', 'editor', 'author', 'revisions', 'custom-fields', 'thumbnail'),
    'taxonomies'    => array('uf_channel', 'uf_artist'),
    'show_in_rest'  => true,
    'rest_base'     => 'tracks',
    'rewrite'       => array('slug' => 'track'),
  );
    
  register_post_type('uf_track', $args);
  
//add_rewrite_rule('^track\/([0-9]+)$', 'index.php?post_type=uf_track&p=$matches[1]', 'top');
}
add_action('init', '\Ultrafunk\Plugin\register_custom_post_types');

/*
//
// Set post type link for custom posts
//
function custom_post_type_link(string $post_link, object $post) : string
{
  if (isset($post) && ($post->post_type === 'uf_track'))
    return get_cached_home_url('/track/' . $post->ID . '/');

  return $post_link;
}
add_filter('post_type_link', 'Ultrafunk\Plugin\custom_post_type_link', 10, 2);
*/


/**************************************************************************************************************************/


//
// Register Ultrafunk custom taxonomies
//
function register_custom_taxonomies()
{
  //
  // Register Artists custom taxonomy
  //
  $labels = array(
    'name'              => 'Artists',
    'singular_name'     => 'Artist',
    'search_items'      => 'Search Artists',
    'all_items'         => 'All Artists',
    'view_item'         => 'View Artist',
    'edit_item'         => 'Edit Artist',
    'update_item'       => 'Update Artist',
    'add_new_item'      => 'Add New Artist',
    'new_item_name'     => 'New Artist Name',
    'not_found'         => 'No Artists Found',
    'back_to_items'     => 'Back to Artists',
    'menu_name'         => 'Artists',
  );
   
  $args = array(
    'labels'            => $labels,
    'hierarchical'      => false,
    'public'            => true,
    'show_ui'           => true,
    'show_admin_column' => true,
    'show_in_rest'      => true,
    'rest_base'         => 'artists',
    'query_var'         => true,
    'rewrite'           => array('slug' => 'artist'),
  );

  register_taxonomy('uf_artist', array('uf_track'), $args);

  //
  // Register Channels custom taxonomy
  //
  $labels = array(
    'name'              => 'Channels',
    'singular_name'     => 'Channel',
    'search_items'      => 'Search Channels',
    'all_items'         => 'All Channels',
    'view_item'         => 'View Channel',
    'parent_item'       => 'Parent Channel',
    'parent_item_colon' => 'Parent Channel:',
    'edit_item'         => 'Edit Channel',
    'update_item'       => 'Update Channel',
    'add_new_item'      => 'Add New Channel',
    'new_item_name'     => 'New Channel Name',
    'not_found'         => 'No Channels Found',
    'back_to_items'     => 'Back to Channels',
    'menu_name'         => 'Channels',
  );
   
  $args = array(
    'labels'            => $labels,
    'hierarchical'      => true,
    'public'            => true,
    'show_ui'           => true,
    'show_admin_column' => true,
    'show_in_rest'      => true,
    'rest_base'         => 'channels',
    'query_var'         => true,
    'rewrite'           => array('slug' => 'channel'),
  );

  register_taxonomy('uf_channel', array('uf_track'), $args);
}
add_action('init', '\Ultrafunk\Plugin\register_custom_taxonomies');


/**************************************************************************************************************************/


//
// Register meta fields for REST API fetch
//
function register_meta_fields()
{
  register_post_meta('uf_track', 'track_artist',
    array(
      'type'          => 'string',
      'description'   => 'track_artist',
      'single'        => true,
      'show_in_rest'  => true,
    )
  );

  register_post_meta('uf_track', 'track_artist_id',
    array(
      'type'          => 'number',
      'description'   => 'track_artist_id',
      'single'        => true,
      'show_in_rest'  => true,
    )
  );

  register_post_meta('uf_track', 'track_source_type',
    array(
      'type'          => 'number',
      'description'   => 'track_source_type',
      'single'        => true,
      'show_in_rest'  => true,
    )
  );

  register_post_meta('uf_track', 'track_source_data',
    array(
      'type'          => 'string',
      'description'   => 'track_source_data',
      'single'        => true,
      'show_in_rest'  => true,
    )
  );

  register_post_meta('uf_track', 'track_title',
    array(
      'type'          => 'string',
      'description'   => 'track_title',
      'single'        => true,
      'show_in_rest'  => true,
    )
  );
}
add_action('rest_api_init', '\Ultrafunk\Plugin\register_meta_fields');


/**************************************************************************************************************************/


//
// Automatically populate meta fields based on current edited $post object on save
//
function on_save_set_meta(int $post_id, object $post, bool $update) : void
{
  // Don't update on REST requests to avoid save_post_uf_track triggering twice using the Gutenberg editor...
  if (defined('REST_REQUEST') && REST_REQUEST)
    return;

  // Don't update meta fields on autosave...
  if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
    return;

  // Don't update meta fields on creation or when trashed...
  if (($post->post_status === 'auto-draft') || ($post->post_status === 'trash'))
    return;

  $track_source_data  = get_track_source_data($post->post_content);
  $track_artist_title = preg_split('/\s{1,}[–·-]\s{1,}/u', $post->post_title);

  if (($track_source_data  !== null)  &&
      ($track_artist_title !== false) &&
      (count($track_artist_title) === 2))
  {
    update_post_meta($post->ID, 'track_artist',      $track_artist_title[0]);
    update_post_meta($post->ID, 'track_title',       $track_artist_title[1]);
    update_post_meta($post->ID, 'track_source_type', $track_source_data[0]);
    update_post_meta($post->ID, 'track_source_data', $track_source_data[1]);

    $track_artist_slug = sanitize_title($track_artist_title[0]);
    $track_artist_term = get_term_by('slug', $track_artist_slug, 'uf_artist');

    if (($track_artist_term !== false) && ($track_artist_slug !== $post->track_artist_slug))
    {
      update_post_meta($post->ID, 'track_artist_id',   $track_artist_term->term_id);
      update_post_meta($post->ID, 'track_artist_slug', $track_artist_slug);

      set_admin_notice($post->ID, 'notice-success', "<b>\"$post->post_title\"</b> saved with <b>track_artist_id:</b> $track_artist_term->term_id and <b>track_artist_slug:</b> $track_artist_slug");
    }
    else
    {
      validate_id_and_slug($post);
    }
  }
  else
  {
    set_admin_notice($post->ID, 'notice-error', "Unable to set track metadata for <b>\"$post->post_title\"</b> with track_id: $post->ID");
  }
}
add_action('save_post_uf_track', '\Ultrafunk\Plugin\on_save_set_meta', 10, 3);

//
// Parse and return track source data from the post content
//
function get_track_source_data(string $post_content) : ?array
{
  $youtube_id_prefixes = array('/watch?v=', '/embed/', 'youtu.be/');

  foreach($youtube_id_prefixes as $find_string)
  {
    $find_pos = strripos($post_content, $find_string);

    if ($find_pos !== false)
      return array(1, 'youtube.com/watch?v=' . substr($post_content, ($find_pos + strlen($find_string)), 11));
  }

  $find_pos = stripos($post_content, 'soundcloud.com/');

  if ($find_pos !== false)
    return array(2, substr($post_content, $find_pos, (strpos($post_content, '"', $find_pos) - $find_pos)));

  return null;
}

//
// Validate and match track_artist_id and track_artist_slug as best we can...
//
function validate_id_and_slug(object $post) : void
{
  if (empty($post->track_artist_id))
    update_post_meta($post->ID, 'track_artist_id', -1);
    
  if (empty($post->track_artist_slug))
    update_post_meta($post->ID, 'track_artist_slug', 'N/A');

  if (((int)$post->track_artist_id === -1) && ($post->track_artist_slug === 'N/A'))
  {
    set_admin_notice($post->ID, 'notice-error', "<b>\"$post->post_title\"</b> has no valid <b>track_artist_id</b> and <b>track_artist_slug</b>");
  }
  else
  {
    $track_artist_id_term   = get_term_by('id',   $post->track_artist_id,   'uf_artist');
    $track_artist_slug_term = get_term_by('slug', $post->track_artist_slug, 'uf_artist');

    if (($track_artist_id_term !== false) && ($track_artist_slug_term !== false))
    {
      if ($track_artist_id_term->term_id !== $track_artist_slug_term->term_id)
        set_admin_notice($post->ID, 'notice-error', "<b>track_artist_id:</b> $post->track_artist_id and <b>track_artist_slug:</b> $post->track_artist_slug does not match for track: <b>\"$post->post_title\"</b>");
    }
    else
    {
      if ($track_artist_id_term === false)
        set_admin_notice($post->ID, 'notice-error', "Invalid <b>track_artist_id:</b> $post->track_artist_id for track: <b>\"$post->post_title\"</b>");
      else if ($track_artist_slug_term === false)
        set_admin_notice($post->ID, 'notice-error', "Invalid <b>track_artist_slug:</b> $post->track_artist_slug for track: <b>\"$post->post_title\"</b>");
    }
  }
}


/**************************************************************************************************************************/


const SET_META_NOTICE_TRANSIENT = 'on_save_set_meta_notice';

//
// Set transient notice information for admin notices
//
function set_admin_notice(int $post_id, string $type = 'notice-error', string $text = 'Unknown error!') : void
{
  set_transient(SET_META_NOTICE_TRANSIENT, array('post_id' => $post_id, 'type' => $type, 'text' => $text), (60 * 5));
}

//
// Show admin notice if transient is set and we are on the correct screen
//
function show_admin_notice()
{
  $screen = get_current_screen();

  // Notices do not work on Gutenberg edit screens
  if (isset($screen) && ($screen->base === 'post') && ($screen->post_type === 'uf_track'))
    return;

  $notice_data = get_transient(SET_META_NOTICE_TRANSIENT);

  if ($notice_data !== false)
  {
    delete_transient(SET_META_NOTICE_TRANSIENT);

    ?>
    <div class="notice <?php echo esc_attr($notice_data['type']); ?> is-dismissible">
      <style>b { font-weight: 700; }</style>
      <p>
        <?php echo wp_kses_post($notice_data['text']); ?>
        <?php if ($notice_data['type'] !== 'notice-success') { ?>
          &nbsp;&nbsp;&nbsp;<a href="/wp-admin/post.php?post=<?php echo absint($notice_data['post_id']); ?>&action=edit"><b>EDIT TRACK</b></a>
        <?php } ?>
      </p>
    </div>
    <?php
  }
}
add_action('admin_notices', '\Ultrafunk\Plugin\show_admin_notice');
