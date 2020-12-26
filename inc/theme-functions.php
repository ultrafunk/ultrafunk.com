<?php declare(strict_types=1);
/*
 * Functions which enhance the theme by hooking into WordPress
 *
 */


namespace Ultrafunk\ThemeFunctions;


use SimpleXMLElement;
use function Ultrafunk\Request\ { get_term_field_by_slug };
use function Ultrafunk\Globals\ {
  console_log,
  is_shuffle,
  get_shuffle_params,
  get_cached_title,
  set_cached_title,
  set_is_paged_404,
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
  
  if (is_single())
  {
    $prevPost = get_previous_post();
    $nextPost = get_next_post();
    
    if (!empty($prevPost))
      $prevUrl = get_the_permalink($prevPost->ID);

    if (!empty($nextPost))
      $nextUrl = get_the_permalink($nextPost->ID);
    
    return array(
      'prevUrl' => (isset($prevUrl) ? esc_url($prevUrl) : null),
      'nextUrl' => (isset($nextUrl) ? esc_url($nextUrl) : null),
    );
  }
  else
  {
    $prevLink = get_previous_posts_link('');
    $nextLink = get_next_posts_link('');
    
    if (null !== $prevLink)
      $prevUrl = new SimpleXMLElement($prevLink);
    
    if (null !== $nextLink)
      $nextUrl = new SimpleXMLElement($nextLink);
    
    return array(
      'prevUrl' => (isset($prevUrl) ? ((string) esc_url($prevUrl['href'])) : null),
      'nextUrl' => (isset($nextUrl) ? ((string) esc_url($nextUrl['href'])) : null),
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
// Setup custom pagination for term-list pages
//
function set_page_pagination($found_posts, $query)
{
  if (!is_admin() && $query->is_main_query())
  {
    if (is_page() && is_page(['artists', 'channels']))
    {
      $taxonomy   = ($query->query['pagename'] === 'artists') ? 'post_tag' : 'category';
      $term_count = get_terms(array('taxonomy' => $taxonomy, 'fields' => 'count'));
      
      $query->max_num_pages = ($term_count > 30) ? ceil($term_count / 30) : 0;
      $query->query_vars['posts_per_page'] = 30;

      if (get_query_var('paged') > $query->max_num_pages)
        set_is_paged_404();
    }
  }

  return $found_posts;
}
add_filter('found_posts', '\Ultrafunk\ThemeFunctions\set_page_pagination', 10, 2);

//
// Get current title from context
//
function get_title()
{
  $title = get_cached_title();

  // This functions gets called many times per request, check if we have cached result first
  if ($title !== null)
    return $title;

  if (!is_404() && is_shuffle())
  {
    $title = 'All';

    if ('artist' === get_shuffle_params()['type'])
      $title = get_term_field_by_slug(get_shuffle_params()['slug'], 'post_tag', 'name');

    if ('channel' === get_shuffle_params()['type'])
      $title = get_term_field_by_slug(get_shuffle_params()['slug'], 'category', 'name');
  }
  else
  {
    // wp_title() always returns spaces at the start of the result string!
    $title = trim(wp_title('', false));

    if (empty($title))
      $title = 'All';
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
  
  return $title;
}
add_filter('document_title_parts', '\Ultrafunk\ThemeFunctions\customize_title');

//
// Add CSS class to <body> if no posts are displayed
//
function add_body_class($classes)
{
  global $wp_query;
  $has_posts = false;
  
  // 404 never has any playback-controls
  if (isset($wp_query) && $wp_query->have_posts() && !is_404())
  {
    foreach ($wp_query->posts as $post)
    {
      if ('post' === $post->post_type)
      {
        $has_posts = true;
        break;
      }
    }
  }
  
  if (false === $has_posts)
    $classes[] = 'no-playback';
  
  return $classes;
}
add_filter('body_class', '\Ultrafunk\ThemeFunctions\add_body_class');

//
// Use webfonts loader for async CSS
//
function webfonts_script()
{
  ?>
  <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"></script>
  <script>
  WebFont.load({
    google: { families: ['Roboto:100,300,400,700&display=swap'] },
    classes: false, events: false,
  });
  </script>
  <?php
}
add_action('wp_body_open', '\Ultrafunk\ThemeFunctions\webfonts_script');

//
// Add uniqid and other custom options for SoundCloud and YouTube iframe embeds
//
function embed_iframe_setparams($cached_html)
{
  if (false !== stripos($cached_html, 'youtube.com/'))
  {
    $cached_html = str_ireplace('<iframe', sprintf('<iframe id="youtube-uid-%s" loading="eager"', uniqid()), $cached_html);
  //$cached_html = str_ireplace('www.youtube.com', 'www.youtube-nocookie.com', $cached_html);
    $cached_html = str_ireplace('?feature=oembed', sprintf('?feature=oembed&enablejsapi=1&origin=%s', get_dev_prod_const('iframe_origin')), $cached_html);
  }
  else if (false !== stripos($cached_html, 'soundcloud.com/'))
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
  if (false !== stripos($form, '<input type="search"'))
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
    $request_url = '/shuffle/' . get_shuffle_params()['path'] . '/';
  }
  else
  {
    $queried_object = get_queried_object();

    if (isset($queried_object) && isset($queried_object->taxonomy) && isset($queried_object->slug))
    {
      if ('category' === $queried_object->taxonomy)
        $request_url = '/shuffle/channel/' . $queried_object->slug . '/';
  
      if ('post_tag' === $queried_object->taxonomy)
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

  return (!empty($title) ? $title : 'Shuffle: All');
}

//
// Do needed magic to the menu items here from context
//
function setup_nav_menu_item($menu_item)
{
  if (is_admin())
    return $menu_item;

  if (is_front_page() && !is_shuffle() && (get_dev_prod_const('menu_item_all_id') === $menu_item->ID))
    $menu_item->classes[] = 'current-menu-item';
  
  if (!is_404() && is_shuffle() && (get_dev_prod_const('menu_item_shuffle_id') === $menu_item->ID))
    $menu_item->classes[] = 'current-menu-item';

  if (get_dev_prod_const('menu_item_shuffle_id') === $menu_item->ID)
  {
    $menu_item->url        = esc_url(get_shuffle_menu_item_url());
    $menu_item->attr_title = esc_attr(get_shuffle_menu_item_title());
  }
  
  return $menu_item;
}
add_filter('wp_setup_nav_menu_item', '\Ultrafunk\ThemeFunctions\setup_nav_menu_item');

?>
