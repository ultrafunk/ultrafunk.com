<?php declare(strict_types=1);
/*
 * Functions which enhance the theme by hooking into WordPress
 *
 */


namespace Ultrafunk\ThemeFunctions;


use SimpleXMLElement;
use function Ultrafunk\RequestShared\request_get_prev_next_urls;

use function Ultrafunk\Globals\ {
  console_log,
  is_shuffle,
  is_termlist,
  get_request_params,
  get_cached_title,
  set_cached_title,
  get_dev_prod_const,
};


/**************************************************************************************************************************/


//
// Get previous and next post/posts URLs
//
function get_prev_next_urls()
{
  // Return empty Array because get_next_posts_link() returns results even when a 404 happens
  if (is_404())
    return array();

  if (is_termlist())
    return request_get_prev_next_urls(get_request_params());

  if (is_single())
  {
    $prevPost = get_previous_post();
    $nextPost = get_next_post();
    
    if (!empty($prevPost))
      $prevUrl = get_the_permalink($prevPost->ID);

    if (!empty($nextPost))
      $nextUrl = get_the_permalink($nextPost->ID);
    
    return array(
      'prev' => (isset($prevUrl) ? esc_url($prevUrl) : null),
      'next' => (isset($nextUrl) ? esc_url($nextUrl) : null),
    );
  }
  else
  {
    $prevLink = get_previous_posts_link('');
    $nextLink = get_next_posts_link('');
    
    if ($prevLink !== null)
      $prevUrl = new SimpleXMLElement($prevLink);
    
    if ($nextLink !== null)
      $nextUrl = new SimpleXMLElement($nextLink);
    
    return array(
      'prev' => (isset($prevUrl) ? ((string) esc_url($prevUrl['href'])) : null),
      'next' => (isset($nextUrl) ? ((string) esc_url($nextUrl['href'])) : null),
    );
  }
}

//
// Enhance search results by replacing special chars in query string
// This should be done by default in WordPress?
//
function modify_search_query($query)
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
// Set number of posts (tracks) per page for Search + Shuffle based on user setting
//
function set_posts_per_page($query)
{
  if (!is_admin() && $query->is_main_query())
  {
    if ($query->is_search || is_shuffle())
    {
      if (isset($_COOKIE['UF_TRACKS_PER_PAGE']))
      {
        $num_tracks = intval($_COOKIE['UF_TRACKS_PER_PAGE']);
  
        if (($num_tracks > 2) && ($num_tracks < 25))
          $query->set('posts_per_page', $num_tracks);
      }
    }
  }
}
add_action('pre_get_posts', '\Ultrafunk\ThemeFunctions\set_posts_per_page', 1);

//
// Get term field for slug
//
function get_term_field_by_slug($slug, $taxonomy, $field)
{
  $term = get_term_by('slug', $slug, $taxonomy);

  if ($term !== false)
    return $term->$field;

  return null;
}

//
// Get current title from context
//
function get_title()
{
  $title = get_cached_title();

  // This functions gets called many times per request, check if we have cached result first
  if ($title !== null)
    return $title;

  $params = get_request_params();

  if (!is_404() && is_shuffle())
  {
    $title = 'All Tracks';

    if ($params['type'] === 'artist')
      $title = get_term_field_by_slug($params['slug'], 'post_tag', 'name');

    if ($params['type'] === 'channel')
      $title = get_term_field_by_slug($params['slug'], 'category', 'name');
  }
  else if (!is_404() && is_termlist())
  {
    $title = $params['is_artists'] ? ('Artists: ' . strtoupper($params['first_letter'])) : 'All Channels';
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
function customize_title($title)
{
  if (!is_404() && is_shuffle())
  {
    $title['title']   = esc_html('Shuffle: ' . get_title());
    $title['tagline'] = '';
    $title['site']    = esc_html(get_bloginfo('name'));
  }
  else if (!is_404() && is_termlist())
  {
    if (get_request_params()['max_pages'] > 1)
      $title['title'] = esc_html(get_title() . ' - Page ' . get_request_params()['current_page']);
    else
      $title['title'] = esc_html(get_title());
  }
  
  return $title;
}
add_filter('document_title_parts', '\Ultrafunk\ThemeFunctions\customize_title');

//
// Add uniqid and other custom options for SoundCloud and YouTube iframe embeds
//
function embed_iframe_setparams($cached_html)
{
  if (stripos($cached_html, 'youtube.com/') !== false)
  {
    $cached_html = str_ireplace('<iframe', sprintf('<iframe id="youtube-uid-%s" loading="eager"', uniqid()), $cached_html);
  //$cached_html = str_ireplace('www.youtube.com', 'www.youtube-nocookie.com', $cached_html);
    $cached_html = str_ireplace('?feature=oembed', sprintf('?feature=oembed&enablejsapi=1&origin=%s', get_dev_prod_const('iframe_origin')), $cached_html);
  }
  else if (stripos($cached_html, 'soundcloud.com/') !== false)
  {
    $cached_html = str_ireplace('<iframe', sprintf('<iframe id="soundcloud-uid-%s" allow="autoplay" loading="eager"', uniqid()), $cached_html);
    $cached_html = str_ireplace('?visual=true', '?visual=true&single_active=false', $cached_html);
  }
  
  return $cached_html;
}
add_filter('embed_oembed_html', '\Ultrafunk\ThemeFunctions\embed_iframe_setparams', 10, 1);

//
// Customize the default WordPress search form
//
function style_search_form($form)
{
  if (stripos($form, '<input type="search"') !== false)
    $form = str_ireplace('<input type="search"', '<input type="search" required', $form);
  
  return $form;
}
add_filter('get_search_form', '\Ultrafunk\ThemeFunctions\style_search_form'); 

//
// Get shuffle menu item URL from current context
//
function get_shuffle_menu_item_url()
{
  $request_url = '/shuffle/all/';

  if (is_shuffle())
  {
    $request_url = '/shuffle/' . get_request_params()['path'] . '/';
  }
  else
  {
    $queried_object = get_queried_object();

    if (isset($queried_object) && isset($queried_object->taxonomy) && isset($queried_object->slug))
    {
      if ($queried_object->taxonomy === 'category')
        $request_url = '/shuffle/channel/' . $queried_object->slug . '/';
  
      if ($queried_object->taxonomy === 'post_tag')
        $request_url = '/shuffle/artist/' . $queried_object->slug . '/';
    }
  }

  return (get_site_url() . $request_url);
}

//
// Get shuffle menu item title from current context
//
function get_shuffle_menu_item_title()
{
  $title = '';

  if (!is_404() && is_shuffle())
    $title = 'Shuffle: ' . get_title();
  else
    $title = single_term_title('Shuffle: ', false);

  return (!empty($title) ? $title : 'Shuffle: All Tracks');
}

//
// Do needed magic to the menu items here from context
//
function setup_nav_menu_item($menu_item)
{
  if (is_admin())
    return $menu_item;

  if (is_front_page() && !is_shuffle() && ($menu_item->ID === get_dev_prod_const('menu_item_all_id')))
    $menu_item->classes[] = 'current-menu-item';
  
  if (!is_404() && is_shuffle() && ($menu_item->ID === get_dev_prod_const('menu_item_shuffle_id')))
    $menu_item->classes[] = 'current-menu-item';

  if ($menu_item->ID === get_dev_prod_const('menu_item_shuffle_id'))
  {
    $menu_item->url        = esc_url(get_shuffle_menu_item_url());
    $menu_item->attr_title = esc_attr(get_shuffle_menu_item_title());
  }
  
  return $menu_item;
}
add_filter('wp_setup_nav_menu_item', '\Ultrafunk\ThemeFunctions\setup_nav_menu_item');

