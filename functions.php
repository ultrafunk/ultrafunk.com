<?php
/*
 * Theme setup and customization
 *
 */

// Minimal global stuff for the theme
require get_template_directory() . '/inc/globals.php';

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

// Remove Gutenberg CSS for admins
// remove_action('admin_enqueue_scripts', 'wp_common_block_scripts_and_styles');

// Remove built in XML sitemaps
// add_filter( 'wp_sitemaps_enabled', '__return_false' );

//
// Theme setup
//
function ultrafunk_theme_setup()
{
  register_nav_menus(array(
    'primary-menu' => "Primary Menu",
  ));
  
  add_theme_support('html5', array('search-form', 'script', 'style'));
  add_theme_support('title-tag');
  add_theme_support('custom-logo');
}
add_action('after_setup_theme', 'ultrafunk_theme_setup');

// Add custom footer logo
function ultrafunk_customizer_setting($wp_customize)
{
  $wp_customize->add_setting('ultrafunk_footer_logo', array('sanitize_callback' => 'esc_url_raw'));

  $customize_options = array(
    'label'    => 'Footer Logo',
    'section'  => 'title_tagline',
    'settings' => 'ultrafunk_footer_logo',
    'priority' => 8,
  );

  $wp_customize->add_control(new WP_Customize_Image_Control($wp_customize, 'ultrafunk_footer_logo', $customize_options));
}
add_action('customize_register', 'ultrafunk_customizer_setting');
  
// Add theme taxonomy widget
function ultrafunk_widgets_init()
{
  register_sidebar(
    array(
      'name'          => 'Content widgets',
      'id'            => 'content-widgets-1',
      'before_widget' => '<section id="%1$s" class="widget %2$s">',
      'after_widget'  => '</section>',
      'before_title'  => '<h2 class="widget-title">',
      'after_title'   => '</h2>',
    )
  );
}
add_action('widgets_init', 'ultrafunk_widgets_init');

// Limit number of entries shown by the built-in Archive widget
function ultrafunk_limit_archives($args)
{
  $args['limit'] = 12;
  return $args;
}
add_filter('widget_archives_args', 'ultrafunk_limit_archives');

//
// Enqueue scripts and styles.
//
function ultrafunk_scripts()
{
  $version = \Ultrafunk\Globals\get_version();
  
  wp_enqueue_style('google-fonts-material-icons', 'https://fonts.googleapis.com/icon?family=Material+Icons&display=block', array(), null);
  wp_enqueue_script('soundcloud-api-script', 'https://w.soundcloud.com/player/api.js', array(), null);
  wp_enqueue_style('playback-controls-style', get_theme_file_uri('/js/playback/playback-controls.css'), array(), $version);
  wp_enqueue_style('utils-style', get_theme_file_uri('/js/common/utils.css'), array(), $version);
  wp_enqueue_script('interaction-script', get_theme_file_uri('/js/playback/interaction.js'), array(), $version);
  wp_enqueue_style('ultrafunk-style', get_stylesheet_uri(), array(), $version);
  wp_enqueue_script('ultrafunk-script', get_theme_file_uri('/js/index.js'), array(), $version);
  \Ultrafunk\ThemeFunctions\enqueue_style_track_layout($version);
  wp_localize_script('interaction-script', 'navigationVars', \Ultrafunk\ThemeFunctions\get_prev_next_urls());
}
add_action('wp_enqueue_scripts', 'ultrafunk_scripts');

// Customize enqueued script tags when needeed
function ultrafunk_modify_script_tag($tag, $handle, $source)
{
  if ('soundcloud-api-script' === $handle)
    $tag = str_ireplace('<script ', '<script defer ', $tag);
  else if (('interaction-script' === $handle) || ('ultrafunk-script' === $handle))
    $tag = str_ireplace('<script ', '<script type="module" ', $tag);

  return $tag;
}
add_filter('script_loader_tag', 'ultrafunk_modify_script_tag', 10, 3);

//
// Set custom "theme_color" in PWA app manifest JSON
//
function ultrafunk_web_app_manifest($manifest)
{
  $manifest['theme_color']      = '#0a1428';
  $manifest['background_color'] = '#0a1428';
  $manifest['display']          = 'standalone';
  $manifest['short_name']       = 'Ultrafunk';
  return $manifest;
}
add_filter('web_app_manifest', 'ultrafunk_web_app_manifest', 10, 3);

//
// Customize Admin interface
//
function ultrafunk_reusable_blocks_admin_menu()
{
  add_menu_page('Reusable Blocks', 'Reusable Blocks', 'edit_posts', 'edit.php?post_type=wp_block', '', 'dashicons-editor-table', 22);
}
add_action('admin_menu', 'ultrafunk_reusable_blocks_admin_menu');

//
// Get theme functions and tags
//
require get_template_directory() . '/inc/request.php';
require get_template_directory() . '/inc/theme-functions.php';
require get_template_directory() . '/inc/theme-tags.php';
require get_template_directory() . '/inc/theme-widgets.php';
