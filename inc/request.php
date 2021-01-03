<?php declare(strict_types=1);
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


/**************************************************************************************************************************/


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
      $request_url = trim(esc_url_raw($_SERVER['REQUEST_URI']), '/');
      
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
      if ($this->url_parts[0] === 'shuffle')
      {
        if ($this->url_parts[1] === 'all')
        {
          if ($url_parts_count === 2)
          {
            $this->shuffle_all = true;
            return true;
          }
  
          if (($url_parts_count === 4) && ($this->url_parts[2] === 'page'))
          {
            $this->shuffle_all_page = true;
            return true;
          }
        }
        else if (($this->url_parts[1] === 'artist') || ($this->url_parts[1] === 'channel'))
        {
          if ($url_parts_count === 3)
          {
            $this->shuffle_slug = true;
            return true;
          }
  
          if (($url_parts_count === 5) && ($this->url_parts[3] === 'page'))
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
    if ($this->shuffle_slug)
    {
      $this->params['slug'] = sanitize_title($this->url_parts[2]); // sanitize_title_for_query() or esc_attr()?
      return;
    }
  
    // Is /shuffle/all/page/x number
    if ($this->shuffle_all_page)
    {
      $value = intval($this->url_parts[3]);
      $this->params['page_num'] = ($value < 0) ? 0 : $value;
      return;
    }
  
    // Is /shuffle/artist/artist-slug/page/x number
    // Is /shuffle/channel/channel-slug/page/x number
    if ($this->shuffle_slug_page)
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

    if ($this->shuffle_slug || $this->shuffle_slug_page)
      $this->params['path'] = ($this->params['type'] . '/' . $this->params['slug']);

    $shuffle_params               = &get_shuffle_params();
    $shuffle_params['is_shuffle'] = $this->is_shuffle;
    $shuffle_params['type']       = $this->params['type'];
    $shuffle_params['slug']       = $this->params['slug'];
    $shuffle_params['path']       = $this->params['path'];
  }

  public function is_valid()
  {
    if ($this->is_shuffle)
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
  if (!isset($_COOKIE['UF_SHUFFLE_UID']))
  {
    $options = array(
      'expires'  => (time() + (60 * 60 * 24 * 30)),
      'path'     => '/shuffle/',
      'secure'   => true,
      'httponly' => false,
      'samesite' => 'Strict',
    );
    
    setcookie('UF_SHUFFLE_UID', $uid, $options);
  }
}

//
// Get unique ID cookie for random shuffle
//
function get_transient_name()
{
  if (isset($_COOKIE['UF_SHUFFLE_UID']))
  {
    $cookie = sanitize_user(wp_unslash($_COOKIE['UF_SHUFFLE_UID']), true);
    
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

  if ($term !== false)
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
    'posts_per_page' => -1,
  );
  
  if ($request->shuffle_slug)
  {
    if ($request->params['type'] === 'artist')
      $args['tag_id'] = get_term_field_by_slug($request->params['slug'], 'post_tag', 'term_id');

    if ($request->params['type'] === 'channel')
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

  if ($args !== null)
  {
    $posts_array['shuffle'] = $request->params['path'];
    $posts_array['postIds'] = get_posts($args);

    if (shuffle($posts_array['postIds']) === true)
    {
      $transient_name = get_transient_name();
      
      if (empty($transient_name))
      {
        $uid            = uniqid('', true);
        $transient_name = sprintf('random_shuffle_%s', $uid);
        set_cookie($uid);
      }
  
      delete_transient($transient_name);
      
      if (set_transient($transient_name, $posts_array, DAY_IN_SECONDS) === true)
        return $posts_array;
    }  
  }
  
  return false;
}

//
// Get page number for the current shuffle type
//
function get_shuffle_page_num($request, $max_page_num)
{
  $page_num = 0;
  
  if ($request->shuffle_all || $request->shuffle_slug)
    return 1;

  if ($request->shuffle_all_page || $request->shuffle_slug_page)
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
  if ((is_admin() === false) && (wp_doing_ajax() === false))
  {
    $request = new Request();

    if ($request->is_valid())
    {
      $paged = get_shuffle_page_num($request, 9999);
    
      if ($paged !== 0)
      {
        $transient = false;
        $orderby   = 'DESC';
  
        if ($paged === 1)
        {
          perf_start();
          $transient = create_shuffle_transient($request);
          perf_stop('create_rnd_transient');
        }
        else
        {
          perf_start();
          $transient = get_transient(get_transient_name());

          if (($transient !== false) && ($request->params['path'] !== $transient['shuffle']))
            $transient = false;

          perf_stop('get_rnd_transient');
        }
  
        if ($transient === false)
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
