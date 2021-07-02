<?php declare(strict_types=1);
/*
 * Shuffle requests
 *
 */


namespace Ultrafunk\RequestShuffle;


use function Ultrafunk\Globals\ {
  console_log,
  set_request_params,
  perf_start,
  perf_stop,
};


/**************************************************************************************************************************/


class RequestShuffle
{
  private $shuffle_all       = false;
  private $shuffle_all_page  = false;
  private $shuffle_slug      = false;
  private $shuffle_slug_page = false;

  public $params = array(
    'is_shuffle' => true,
    'type'       => 'all',
    'slug'       => null,
    'slug_name'  => null,
    'path'       => 'all',
    'page_num'   => 0,
  );

  //
  // Constructor -- Set all private class data / variables
  //
  public function __construct(object $wp_env, object $route_request)
  {
    switch ($route_request->matched_route)
    {
      case 'shuffle_all':
        $this->shuffle_all = true;
        break;

      case 'shuffle_all_page':
        $this->shuffle_all_page   = true;
        $this->params['page_num'] = intval($route_request->path_parts[3]);
        break;

      case 'shuffle_slug':
        $this->shuffle_slug   = true;
        $this->params['slug'] = sanitize_title($route_request->path_parts[2]);
        break;

      case 'shuffle_slug_page':
        $this->shuffle_slug_page  = true;
        $this->params['slug']     = sanitize_title($route_request->path_parts[2]);
        $this->params['page_num'] = intval($route_request->path_parts[4]);
        break;
    }

    $this->params['type'] = sanitize_title($route_request->path_parts[1]);

    if ($this->shuffle_slug || $this->shuffle_slug_page)
      $this->params['path'] = ($this->params['type'] . '/' . $this->params['slug']);
  }

  //
  // Set unique ID cookie for random shuffle
  //
  private function set_cookie(string $uid) : void
  {
    if (!isset($_COOKIE['UF_SHUFFLE_UID']))
    {
      $options = array(
        'expires'  => (time() + (60 * 60 * 24 * 30)),
        'path'     => '/',
        'secure'   => true,
        'httponly' => false,
        'samesite' => 'Strict',
      );
      
      setcookie('UF_SHUFFLE_UID', $uid, $options);
    }
  }

  //
  // Create get_posts() args with optional ['tax_query']
  //
  private function get_posts_args() : array
  {
    $args = array(
      'fields'         => 'ids',
      'post_type'      => 'uf_track',
      'posts_per_page' => -1,
    );
    
    if ($this->shuffle_slug)
    {
      $args['tax_query'] = array(
        array(
          'taxonomy' => 'uf_' . $this->params['type'],
          'field'    => 'slug',
          'terms'    => $this->params['slug'],
        )
      );
    }

    return $args;
  }

  //
  // Get term name from slug
  //
  public function set_slug_name() : void
  {
    $wp_term = get_term_by('slug', $this->params['slug'], 'uf_' . $this->params['type']);

    if ($wp_term !== false)
      $this->params['slug_name'] = $wp_term->name;
  }

  //
  // Get unique ID cookie for random shuffle
  //
  public function get_transient_name() : string
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
  // Create random shuffle transient for unique Ultrafunk ID
  //
  public function create_transient()
  {
    $posts_array['shuffle'] = $this->params['path'];
    $posts_array['postIds'] = get_posts($this->get_posts_args());

    if (!empty($posts_array['postIds']) && (shuffle($posts_array['postIds']) === true))
    {
      $transient_name = $this->get_transient_name();
      
      if (empty($transient_name))
      {
        $uid            = uniqid('', true);
        $transient_name = sprintf('random_shuffle_%s', $uid);
        $this->set_cookie($uid);
      }
  
      delete_transient($transient_name);
      
      if (set_transient($transient_name, $posts_array, DAY_IN_SECONDS) === true)
        return $posts_array;
    }  
    
    return false;
  }

  //
  // Get page number for the current shuffle type
  //
  public function get_page_num(int $max_page_num) : int
  {
    $page_num = 0;
    
    if ($this->shuffle_all || $this->shuffle_slug)
      return 1;

    if ($this->shuffle_all_page || $this->shuffle_slug_page)
      $page_num = $this->params['page_num'];

    if (($page_num >= 1) && ($page_num < $max_page_num))
      return $page_num;

    return 0;
  }
}


/**************************************************************************************************************************/


function shuffle_callback(bool $do_parse, object $wp_env, object $route_request) : bool
{
  $shuffle = new RequestShuffle($wp_env, $route_request);
  $paged   = $shuffle->get_page_num(9999);

  if ($paged !== 0)
  {
    $transient = false;

    if (($paged === 1) && isset($_COOKIE['UF_RESHUFFLE']))
    {
      setcookie('UF_RESHUFFLE', '', time() - 3600, '/');

      perf_start();
      $transient = $shuffle->create_transient();
      perf_stop('create_rnd_transient');
    }
    else
    {
      perf_start();
      $transient = get_transient($shuffle->get_transient_name());
  
      // We got a stored transient, check if it is the correct one for this request (path match)
      if (($transient !== false) && ($shuffle->params['path'] !== $transient['shuffle']))
        $transient = false;
  
      perf_stop('get_rnd_transient');
    }
  
    if ($transient !== false)
    {
      $shuffle->set_slug_name();
      set_request_params($shuffle->params);

      $wp_env->query_vars = array(
        'orderby'   => 'post__in',
        'post_type' => 'uf_track',
        'post__in'  => $transient['postIds'],
        'paged'     => $paged, 
      );

      // return false = We have parsed / handled this request, continue with our query_vars
      // https://developer.wordpress.org/reference/hooks/do_parse_request/
      return false;
    }
  }

  return $do_parse;
}
