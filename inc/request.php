<?php
/*
 * Custom request URL parsing, validation, sanitization and handling
 *
 */


namespace Ultrafunk\Request;


use function Ultrafunk\Globals\ {
  console_log,
  get_shuffle_params,
  perf_start,
  perf_stop,
};


class Request
{
  public $url_parts         = null;
  public $is_shuffle        = false;
  public $shuffle_all       = false;
  public $shuffle_all_page  = false;
  public $shuffle_slug      = false;
  public $shuffle_slug_page = false;

  public $params = array(
    'type'     => 'all',
    'slug'     => '',
    'path'     => 'all',
    'page_num' => 0,
  );
 
  function __construct()
  {
    $this->url_parts  = $this->get_url_parts();
    $this->is_shuffle = $this->validate_url_parts();
  }

  private function get_url_parts()
  {
    if (isset($_SERVER['REQUEST_URI']))
    {
      $request_url = trim(esc_url_raw($_SERVER['REQUEST_URI']), '/'); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash
      
      if (!empty($request_url))
      {
        $url_parts = explode('/', strtolower($request_url), 10);
        
        if (!empty($url_parts))
          return $url_parts;
      }
    }
  
    return array();
  }

  //
  // The only URLs that are valid:
  // 2 url parts: /shuffle/all/
  // 3 url parts: /shuffle/artist/artist-slug/
  //              /shuffle/channel/channel-slug/
  // 4 url parts: /shuffle/all/page/x/ (where x > 1)
  // 5 url parts: /shuffle/artist/artist-slug/page/x/ (where x > 1)
  //              /shuffle/channel/channel-slug/page/x/ (where x > 1)
  //
  private function validate_url_parts()
  {
    $url_parts_count = count($this->url_parts);
  
    if (($url_parts_count >= 2) && ($url_parts_count < 6))
    {
      if ('shuffle' === $this->url_parts[0])
      {
        if ('all' === $this->url_parts[1])
        {
          if (2 === $url_parts_count)
          {
            $this->shuffle_all = true;
            return true;
          }
  
          if ((4 === $url_parts_count) && ('page' === $this->url_parts[2]))
          {
            $this->shuffle_all_page = true;
            return true;
          }
        }
        else if (('artist' === $this->url_parts[1]) || ('channel' === $this->url_parts[1]))
        {
          if (3 === $url_parts_count)
          {
            $this->shuffle_slug = true;
            return true;
          }
  
          if ((5 === $url_parts_count) && ('page' === $this->url_parts[3]))
          {
            $this->shuffle_slug_page = true;
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private function sanitize_url_parts()
  {
    // Is /shuffle/artist/artist-slug/
    // Is /shuffle/channel/channel-slug/
    if (true === $this->shuffle_slug)
    {
      $this->params['slug'] = sanitize_title($this->url_parts[2]); // sanitize_title_for_query() or esc_attr()?
      return;
    }
  
    // Is /shuffle/all/page/x number
    if (true === $this->shuffle_all_page)
    {
      $value = intval($this->url_parts[3]);
      $this->params['page_num'] = ($value < 0) ? 0 : $value;
      return;
    }
  
    // Is /shuffle/artist/artist-slug/page/x number
    // Is /shuffle/channel/channel-slug/page/x number
    if (true === $this->shuffle_slug_page)
    {
      $value = intval($this->url_parts[4]);
      $this->params['page_num'] = ($value < 0) ? 0 : $value;
      $this->params['slug']     = sanitize_title($this->url_parts[2]); // sanitize_title_for_query() or esc_attr()?
      return;
    }
  }

  private function set_shuffle_params()
  {
    $this->params['type'] = $this->url_parts[1];

    if ((true === $this->shuffle_slug) || (true === $this->shuffle_slug_page))
      $this->params['path'] = ($this->url_parts[1] . '/' . $this->url_parts[2]);

    $shuffle_params               = &get_shuffle_params();
    $shuffle_params['is_shuffle'] = $this->is_shuffle;
    $shuffle_params['type']       = $this->params['type'];
    $shuffle_params['slug']       = $this->params['slug'];
    $shuffle_params['path']       = $this->params['path'];
  }

  public function is_valid()
  {
    if (true === $this->is_shuffle)
    {
      $this->sanitize_url_parts();
      $this->set_shuffle_params();
      return true;
    }

    return false;
  }
}

//
// Set unique ID cookie for random shuffle
//
function set_cookie($uid)
{
  if (!isset($_COOKIE['ultrafunk_uid']))
    setcookie('ultrafunk_uid', $uid, (time() + (60 * 60 * 24 * 30)), '/shuffle/'); // 1 month expiry time + /shuffle/ path
}

//
// Get unique ID cookie for random shuffle
//
function get_transient_name()
{
  if (isset($_COOKIE['ultrafunk_uid']))
  {
    $cookie = sanitize_user(wp_unslash($_COOKIE['ultrafunk_uid']), true);
    
    if (strlen($cookie) < 50)
      return sprintf('random_shuffle_%s', $cookie);
  }
  
  return '';
}

//
// Get term field for slug
//
function get_term_field_by_slug($slug, $taxonomy, $field)
{
  $term = get_term_by('slug', $slug, $taxonomy);

  if (false !== $term)
    return $term->$field;

  return null;
}

//
// Create get_posts() args with optional 'tag_id' or 'cat'
//
function get_posts_args($request)
{
  $args = array(
    'fields'         => 'ids',
    'posts_per_page' => -1, // phpcs:ignore WPThemeReview.CoreFunctionality.PostsPerPage.posts_per_page_posts_per_page
  );
  
  if (true === $request->shuffle_slug)
  {
    if ('artist' === $request->params['type'])
      $args['tag_id'] = get_term_field_by_slug($request->params['slug'], 'post_tag', 'term_id');

    if ('channel' === $request->params['type'])
      $args['cat'] = get_term_field_by_slug($request->params['slug'], 'category', 'term_id');

    if (!isset($args['tag_id']) && !isset($args['cat']))
      return null;
  }

  return $args;
}

//
// Create random shuffle transient for unique Ultrafunk ID
//
function create_shuffle_transient($request)
{
  $args = get_posts_args($request);

//console_log($args);

  if (null !== $args)
  {
    $posts_array['shuffle'] = $request->params['path'];
    $posts_array['postIds'] = get_posts($args);

  //console_log($posts_array);
  
    if(true === shuffle($posts_array['postIds']))
    {
    //console_log($posts_array);
  
      $transient_name = get_transient_name();
      
      if (empty($transient_name))
      {
        $uid            = uniqid('', true);
        $transient_name = sprintf('random_shuffle_%s', $uid);
        set_cookie($uid);
      }
  
      delete_transient($transient_name);
      
      if (true === set_transient($transient_name, $posts_array, DAY_IN_SECONDS))
        return $posts_array;
    }  
  }
  
  return false;
}

//
// Get page number for the current shuffle type
//
function shuffle_page_num($request, $max_page_num)
{
  $page_num = 0;
  
  if ((true === $request->shuffle_all) || (true === $request->shuffle_slug))
    return 1;

  if ((true === $request->shuffle_all_page) || (true === $request->shuffle_slug_page))
    $page_num = $request->params['page_num'];

  if (($page_num >= 1) && ($page_num < $max_page_num))
    return $page_num;

  return 0;
}

//
// Add query_vars needed for random shuffled posts (tracks)
//
function do_parse_request($do_parse, $wp)
{
  if ((false === is_admin()) && (false === wp_doing_ajax()))
  {
    $request = new Request();

    if (true === $request->is_valid())
    {
      $paged = shuffle_page_num($request, 9999);
    
    //console_log($request);
  
      if (0 !== $paged)
      {
        $transient = false;
        $orderby   = 'DESC';
  
        if (1 === $paged)
        {
          perf_start();
          $transient = create_shuffle_transient($request);
          perf_stop('create_rnd_transient');
        }
        else
        {
          perf_start();
          $transient = get_transient(get_transient_name());

          if ((false !== $transient) && ($request->params['path'] !== $transient['shuffle']))
          {
          //console_log('transient[shuffle] does not match: (' . $request->params['path'] . ' !== ' . $transient['shuffle'] . ')');
            $transient = false;
          }

          perf_stop('get_rnd_transient');
        }
  
        if (false === $transient)
          return $do_parse;
        else
          $orderby = 'post__in';
  
        $wp->query_vars = array(
          'orderby'  => $orderby,
          'post__in' => $transient['postIds'],
          'paged'    => $paged, 
        );
  
        return false;
      }
    }
  }
  
  return $do_parse;
}
add_filter('do_parse_request', '\Ultrafunk\Request\do_parse_request', 10, 2);
