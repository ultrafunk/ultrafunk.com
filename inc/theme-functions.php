<?php declare(strict_types=1);
/*
 * Functions which enhance the theme by hooking into WordPress
 *
 */


namespace Ultrafunk\ThemeFunctions;


use SimpleXMLElement;
use function Ultrafunk\SharedRequest\request_get_navigation_vars;

use function Ultrafunk\Globals\ {
  console_log,
  is_shuffle,
  is_termlist,
  is_list_player,
  get_request_params,
  get_cached_title,
  set_cached_title,
  get_dev_prod_const,
};


/**************************************************************************************************************************/


//
// Get prev + next post/posts URLs + other navigation variables
//
function get_navigation_vars() : array
{
  $params   = get_request_params();
  $nav_vars = array(
    'prev' => null,
    'next' => null,
    'listItemsPerPage'    => isset($params['items_per_page'])
                             ? $params['items_per_page']
                             : get_dev_prod_const('player_items_per_page'),
    'galleryItemsPerPage' => (is_shuffle() || (is_list_player() && $params['is_list_player_shuffle']))
                             ? get_cookie_value('UF_TRACKS_PER_PAGE', 3, 24, intval(get_option('posts_per_page', 12)))
                             : intval(get_option('posts_per_page', 12)),
  );

  // Return defaults because get_next_posts_link() returns results even when a 404 happens
  if (is_404())
    return $nav_vars;

  if (is_termlist() || is_list_player())
    return request_get_navigation_vars($nav_vars);

  if (is_single())
  {
    $prevPost = get_previous_post();
    $nextPost = get_next_post();
    
    if (!empty($prevPost))
      $prevUrl = get_the_permalink($prevPost->ID);

    if (!empty($nextPost))
      $nextUrl = get_the_permalink($nextPost->ID);
    
    $nav_vars['prev'] = isset($prevUrl) ? esc_url($prevUrl) : null;
    $nav_vars['next'] = isset($nextUrl) ? esc_url($nextUrl) : null;
  }
  else
  {
    $prevLink = get_previous_posts_link('');
    $nextLink = get_next_posts_link('');
    
    if ($prevLink !== null)
      $prevUrl = new SimpleXMLElement($prevLink);
    
    if ($nextLink !== null)
      $nextUrl = new SimpleXMLElement($nextLink);
    
    $nav_vars['prev'] = isset($prevUrl) ? ((string) esc_url($prevUrl['href'])) : null;
    $nav_vars['next'] = isset($nextUrl) ? ((string) esc_url($nextUrl['href'])) : null;
  }

  return $nav_vars;
}

//
// Enhance search results by replacing special chars in query string
// This should be done by default in WordPress?
//
function modify_search_query(object $query) : void
{
  if (!is_admin() && $query->is_main_query() && $query->is_search)
  {
    // https://www.w3.org/wiki/Common_HTML_entities_used_for_typography
    $search  = array('&ndash;', '&mdash;', '&lsquo;', '&rsquo;', '&prime;', '&Prime;', '&ldquo;', '&rdquo;', '&quot;');
    $replace = array('-'      , '-'      , "'"      , "'"      , "'"      , '"'      , '"'      , '"'      , '"'     );

    $new_query_string = htmlentities($query->query['s']);
    $new_query_string = str_replace($search, $replace, $new_query_string);
    $new_query_string = html_entity_decode($new_query_string);

    // Category R&B needs special handling...
    $new_query_string = str_ireplace('r&b', 'r&amp;b', $new_query_string);

    if ($new_query_string !== $query->query['s'])
      $query->set('s', $new_query_string);
  }
}
add_action('parse_query', '\Ultrafunk\ThemeFunctions\modify_search_query');

//
// Get named cookie value if it exists with range check
//
function get_cookie_value(string $cookie_name, int $min_val, int $max_val, int $default_val) : int
{
  if (isset($_COOKIE[$cookie_name]))
  {
    $cookie_val = intval($_COOKIE[$cookie_name]);

    if (($cookie_val >= $min_val) && ($cookie_val <= $max_val))
      return $cookie_val;
  }

  return $default_val;
}

//
// Set number of posts (tracks) per page for Search + Shuffle based on user setting
//
function set_posts_per_page(object $query) : void
{
  if (!is_admin() && $query->is_main_query())
  {
    if ($query->is_search || is_shuffle())
      $query->set('posts_per_page', get_cookie_value('UF_TRACKS_PER_PAGE', 3, 24, intval(get_option('posts_per_page', 12))));
  }
}
add_action('pre_get_posts', '\Ultrafunk\ThemeFunctions\set_posts_per_page', 1);

//
// Get current title from context
//
function get_title() : string
{
  $title = get_cached_title();

  // This functions gets called many times per request, check if we have cached result first
  if ($title !== null)
    return $title;

  $params = get_request_params();

  if (is_shuffle())
  {
    $title = isset($params['slug_name']) ? $params['slug_name'] : 'All Tracks';
  }
  else if (is_termlist())
  {
    $title = $params['is_termlist_artists'] ? ('Artists: ' . strtoupper($params['first_letter'])) : 'All Channels';
  }
  else if (is_list_player())
  {
    $title = $params['title_parts']['title'];
  }
  else
  {
    // wp_title() always returns spaces at the start of the result string!
    $title = trim(wp_title('', false));

    if (empty($title))
      $title = 'All Tracks';
  }

  set_cached_title($title);
  
  return $title;
}

//
// Customize page titles
//
function customize_title(array $title) : array
{
  $params = get_request_params();

  if (is_shuffle())
  {
    $title['title']   = esc_html('Shuffle: ' . get_title());
    $title['tagline'] = '';
    $title['site']    = esc_html(get_bloginfo('name'));
  }
  else if (is_termlist())
  {
    if ($params['max_pages'] > 1)
      $title['title'] = esc_html(get_title() . ' - Page ' . $params['current_page']);
    else
      $title['title'] = esc_html(get_title());
  }
  else if (is_list_player())
  {
    $title_parts = $params['is_list_player_shuffle'] ? ($params['title_parts']['prefix'] . ': ' . get_title()) : get_title();

    if ($params['max_pages'] > 1)
      $title_parts .= ' - Page ' . $params['current_page'];

    $title['title'] = esc_html($title_parts);
  }
  
  return $title;
}
add_filter('document_title_parts', '\Ultrafunk\ThemeFunctions\customize_title');

//
// Add uniqid and other custom options for SoundCloud and YouTube iframe embeds
//
function embed_iframe_setparams(string $cached_html) : string
{
  if (stripos($cached_html, 'youtube.com/') !== false)
  {
  //$cached_html = str_ireplace('<iframe', sprintf('<iframe id="youtube-uid-%s" loading="eager"', uniqid()), $cached_html);
    $cached_html = str_ireplace('<iframe', sprintf('<iframe id="youtube-uid-%s"', uniqid()), $cached_html);
    $cached_html = str_ireplace('?feature=oembed', sprintf('?feature=oembed&enablejsapi=1&origin=%s', get_dev_prod_const('iframe_origin')), $cached_html);
  }
  else if (stripos($cached_html, 'soundcloud.com/') !== false)
  {
  //$cached_html = str_ireplace('<iframe', sprintf('<iframe id="soundcloud-uid-%s" allow="autoplay" loading="eager"', uniqid()), $cached_html);
    $cached_html = str_ireplace('<iframe', sprintf('<iframe id="soundcloud-uid-%s" allow="autoplay"', uniqid()), $cached_html);
    $cached_html = str_ireplace('?visual=true', '?visual=true&single_active=false', $cached_html);
  }
  
  return $cached_html;
}
add_filter('embed_oembed_html', '\Ultrafunk\ThemeFunctions\embed_iframe_setparams', 10, 1);

//
// Add noindex meta tag to all 404 and shuffle pages
//
function wp_robots_noindex(array $robots) : array
{
  if (is_404() || is_shuffle() || (is_list_player() && get_request_params()['is_list_player_shuffle']))
    $robots['noindex'] = true;

  return $robots;
}
add_filter('wp_robots', '\Ultrafunk\ThemeFunctions\wp_robots_noindex');

//
// Disable iframe lazy loading
//
function disable_iframe_lazy_loading(bool $default, string $tag_name, string $context) : bool
{
  if ('iframe' === $tag_name)
    return false;  

  return $default;
}
add_filter('wp_lazy_loading_enabled', '\Ultrafunk\ThemeFunctions\disable_iframe_lazy_loading', 10, 3);

//
// Customize the default WordPress search form
//
function style_search_form(string $form) : string
{
  if (stripos($form, '<input type="search"') !== false)
    $form = str_ireplace('<input type="search"', '<input type="search" required', $form);
  
  return $form;
}
add_filter('get_search_form', '\Ultrafunk\ThemeFunctions\style_search_form'); 

//
// Get shuffle menu item URL from current context
//
function get_shuffle_path() : string
{
  $params = get_request_params();

  if (is_list_player())
  {
    $request_path = '/list/shuffle/all/';

    if ($params['is_list_player_shuffle'])
      $request_path = '/' . $params['route_path'] . '/';
    else if ($params['is_list_player_channel'] || $params['is_list_player_artist'])
      $request_path = '/' . str_ireplace('list/', 'list/shuffle/', $params['route_path']) . '/';
    
    return $request_path;
  }

  $request_path = '/shuffle/all/';

  if (is_shuffle())
  {
    $request_path = '/shuffle/' . $params['path'] . '/';
  }
  else
  {
    $queried_object = get_queried_object();

    if (isset($queried_object) && isset($queried_object->taxonomy) && isset($queried_object->slug))
    {
      if ($queried_object->taxonomy === 'category')
        $request_path = '/shuffle/channel/' . $queried_object->slug . '/';
  
      if ($queried_object->taxonomy === 'post_tag')
        $request_path = '/shuffle/artist/' . $queried_object->slug . '/';
    }
  }

  return $request_path;
}

//
// Get shuffle menu item title from current context
//
function get_shuffle_title() : string
{
  if (is_list_player())
    return ('Shuffle: ' . get_request_params()['title_parts']['title']);

  $title = '';

  if (is_shuffle())
    $title = 'Shuffle: ' . get_title();
  else
    $title = single_term_title('Shuffle: ', false);

  return (!empty($title) ? $title : 'Shuffle: All Tracks');
}

//
// Do needed magic to the nav menu items here from context
//
function setup_nav_menu_item(object $menu_item) : object
{
  if (!is_admin())
  {
    $menu_item_all_id     = get_dev_prod_const('menu_item_all_id');
    $menu_item_shuffle_id = get_dev_prod_const('menu_item_shuffle_id');
  
    if (is_list_player())
    {
      $params = get_request_params();
  
      if ($menu_item->ID === $menu_item_all_id)
        $menu_item->url = '/list/';
      else
        $menu_item->url = str_replace('ultrafunk.com', 'ultrafunk.com/list', $menu_item->url);
  
      if (($menu_item->ID === $menu_item_all_id) && ($params['is_list_player_all']))
        $menu_item->classes[] = 'current-menu-item';
    
      if (($menu_item->ID === $menu_item_shuffle_id) && ($params['is_list_player_shuffle']))
        $menu_item->classes[] = 'current-menu-item';
  
      if (isset($params['WP_Term']) && ($params['WP_Term']->term_id === intval($menu_item->object_id)))
        $menu_item->classes[] = 'current-menu-item';
    }
    else
    {
      if (($menu_item->ID === $menu_item_all_id) && is_front_page() && !is_shuffle())
        $menu_item->classes[] = 'current-menu-item';
    
      if (($menu_item->ID === $menu_item_shuffle_id) && is_shuffle())
        $menu_item->classes[] = 'current-menu-item';
    }
  }
 
  return $menu_item;
}
add_filter('wp_setup_nav_menu_item', '\Ultrafunk\ThemeFunctions\setup_nav_menu_item');

//
// Set data-attribute for shuffle menu item
//
function nav_menu_link_attributes(array $attributes, object $menu_item) : array
{
  if (!is_admin())
  {
    if ($menu_item->ID === get_dev_prod_const('menu_item_shuffle_id'))
    {
      $attributes['href']              = '#';
      $attributes['data-shuffle-path'] = esc_url(get_shuffle_path());
      $attributes['title']             = esc_attr(get_shuffle_title());
      $attributes['class']             = 'reshuffle-menu-item';
    }
  }
  
  return $attributes;
}
add_filter('nav_menu_link_attributes', '\Ultrafunk\ThemeFunctions\nav_menu_link_attributes', 10, 2);
