<?php declare(strict_types=1);
/*
 * Custom request router
 *
 */


namespace Ultrafunk\RouteRequest;


/**************************************************************************************************************************/


const DEFAULT_ROUTES = array(
  'shuffle' => array(
    'callback' => '\Ultrafunk\RequestShuffle\shuffle_callback',
    'routes'   => array(
      'shuffle_all'       => '/^shuffle\/all$/',
      'shuffle_all_page'  => '/^shuffle\/all\/page\/(?!0)\d{1,6}$/',
      'shuffle_slug'      => '/^shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*$/',
      'shuffle_slug_page' => '/^shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*\/page\/(?!0)\d{1,6}$/',
  )),
  'artists' => array(
    'callback' => '\Ultrafunk\RequestTermlist\termlist_callback',
    'routes'   => array(
      'artists'             => '/^artists$/',
    //'artists_page'        => '/^artists\/page\/(?!0)\d{1,6}$/',
      'artists_letter'      => '/^artists\/[a-z]$/',
    //'artists_letter_page' => '/^artists\/[a-z]\/page\/(?!0)\d{1,6}$/',
  )),
  'channels' => array(
    'callback' => '\Ultrafunk\RequestTermlist\termlist_callback',
    'routes'   => array(
      'channels'      => '/^channels$/',
    //'channels_page' => '/^channels\/page\/(?!0)\d{1,6}$/',
  )),
  'list' => array(
    'callback' => '\Ultrafunk\RequestListPlayer\list_player_callback',
    'routes'   => array(
      'list_player_all'          => '/^list$/',
      'list_player_all_page'     => '/^list\/page\/(?!0)\d{1,6}$/',
      'list_player_artist'       => '/^list\/artist\/[a-z0-9-]*$/',
      'list_player_artist_page'  => '/^list\/artist\/[a-z0-9-]*\/page\/(?!0)\d{1,6}$/',
      'list_player_channel'      => '/^list\/channel\/[a-z0-9-]*$/',
      'list_player_channel_page' => '/^list\/channel\/[a-z0-9-]*\/page\/(?!0)\d{1,6}$/',
      'shuffle_all'              => '/^list\/shuffle\/all$/',
      'shuffle_all_page'         => '/^list\/shuffle\/all\/page\/(?!0)\d{1,6}$/',
      'shuffle_slug'             => '/^list\/shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*$/',
      'shuffle_slug_page'        => '/^list\/shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*\/page\/(?!0)\d{1,6}$/',
  )),
);


/**************************************************************************************************************************/


class RouteRequest
{
  public $request_path   = null;
  public $path_parts     = null;
  public $params         = null;
  public $matched_route  = null;
  public $route_callback = null;

  // Make routed URLs consistent with WP + pretty permalinks enabled
  private function request_needs_redirect(string $route_path) : bool
  {
    $page_1     = '/page/1';
    $url_params = ($this->params !== null) ? "?$this->params" : '';

    // Redirect when URL ends with /page/1 for WP + pretty permalinks behaviour
    if (substr_compare($this->request_path, $page_1, -strlen($page_1)) === 0)
    {
      wp_redirect('/' . substr($this->request_path, 0, -strlen($page_1)) . '/' . $url_params, 301);
      exit;
    }

    // This is better than using .htaccess "hacks" to add trailing path slash to ONLY custom routes
    // Trailing path slash is needed for page caching to work properly when using WP Fastest Cache...
    if ($route_path[strlen($route_path) - 1] !== '/')
    {
      wp_redirect('/' . $this->request_path . '/' . $url_params, 301);
      exit;
    }

    return false;
  }

  public function matches(string $request_url = NULL, array $routes = DEFAULT_ROUTES) : bool
  {
    if ($request_url === null)
      $request_url = $_SERVER['REQUEST_URI'];
    
    if (isset($request_url) && isset($routes))
    {
      $esc_request_url     = esc_url_raw($request_url);
      $url_parts           = explode('?', $esc_request_url, 2);
      $this->request_path = trim($url_parts[0], '/');

      if (!empty($this->request_path))
      {
        $this->path_parts = explode('/', $this->request_path, 25);
        $this->params     = isset($url_parts[1]) ? $url_parts[1] : null;
        $route_key        = $this->path_parts[0];

        if (isset($routes[$route_key]))
        {
          foreach($routes[$route_key]['routes'] as $key => $route)
          {
            if (preg_match($route, $this->request_path) === 1)
            {
              if ($this->request_needs_redirect($url_parts[0]) === false)
              {
                $this->matched_route  = $key;
                $this->route_callback = $routes[$route_key]['callback'];
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }
}


/**************************************************************************************************************************/


//
// wp_is_rest_request() does not work until AFTER do_parse_request: https://core.trac.wordpress.org/ticket/42061
// 
function is_rest_request() : bool
{
  return (isset($_SERVER['REQUEST_URI']) && (strpos($_SERVER['REQUEST_URI'], rest_get_url_prefix()) !== false));
}

//
// Filter do_parse_request to check for any custom routes
// This requires pretty permalinks to be enabled!
//
function parse_request(bool $do_parse, object $wp_env) : bool
{
  if ((is_admin()        === false) &&
      (wp_doing_ajax()   === false) &&
      (is_rest_request() === false) &&
      (get_option('permalink_structure')))
  {
    // ToDo: Better solution?
    // Make sure that only logged in users have access to custom routes when debug is enabled
    if (WP_DEBUG && (is_user_logged_in() === false))
      return $do_parse;
  
    $route_request = new RouteRequest();

    if ($route_request->matches() && !empty($route_request->route_callback))
      return call_user_func($route_request->route_callback, $do_parse, $wp_env, $route_request);
  }
  
  return $do_parse;
}
add_filter('do_parse_request', '\Ultrafunk\RouteRequest\parse_request', 10, 2);
