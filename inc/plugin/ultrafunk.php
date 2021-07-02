<?php 
/*
Plugin Name: Ultrafunk Theme Extender
Plugin URI:  https://github.com/ultrafunk/ultrafunk.com
Description: Ultrafunk theme extended functionality plug-in
Author:      Ultrafunk
Author URI:  https://ultrafunk.com
Version:     1.30.1
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

//
// Register meta fields for REST API fetch
//
function register_meta_fields()
{
  register_meta('post', 'track_artist',
    array(
      'object_subtype' => 'uf_track',
      'type'           => 'string',
      'description'    => 'track_artist',
      'single'         => true,
      'show_in_rest'   => true,
    )
  );

  register_meta('post', 'track_title',
    array(
      'object_subtype' => 'uf_track',
      'type'           => 'string',
      'description'    => 'track_title',
      'single'         => true,
      'show_in_rest'   => true,
    )
  );

  register_meta('post', 'track_source_data',
    array(
      'object_subtype' => 'uf_track',
      'type'           => 'string',
      'description'    => 'track_source_data',
      'single'         => true,
      'show_in_rest'   => true,
    )
  );
}
add_action('rest_api_init', '\Ultrafunk\Plugin\register_meta_fields');
