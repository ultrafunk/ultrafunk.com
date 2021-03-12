<?php declare(strict_types=1);
/*
 * Custom request router
 *
 */


namespace Ultrafunk\RouteRequest;


use function Ultrafunk\Globals\console_log;


/**************************************************************************************************************************/


class RouteRequest
{
  public $request_url    = null;
  public $url_parts      = null;
  public $trailing_slash = false;
  public $matched_route  = null;
  public $route_callback = null;

  private $routes = array(
    'shuffle' => array(
      'callback' => 'Ultrafunk\RequestShuffle\request_callback',
      'routes'   => array (
        'shuffle_all'       => '/^shuffle\/all$/',
        'shuffle_all_page'  => '/^shuffle\/all\/page\/(?!0)\d{1,6}$/',
        'shuffle_slug'      => '/^shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*$/',
        'shuffle_slug_page' => '/^shuffle\/(\bchannel\b|\bartist\b)*\/[a-z0-9-]*\/page\/(?!0)\d{1,6}$/',
      )),
    'artists' => array(
      'callback' => 'Ultrafunk\RequestTerms\request_callback',
      'routes'   => array(
        'artists'             => '/^artists$/',
      //'artists_page'        => '/^artists\/page\/(?!0)\d{1,6}$/',
        'artists_letter'      => '/^artists\/[a-z]$/',
      //'artists_letter_page' => '/^artists\/[a-z]\/page\/(?!0)\d{1,6}$/',
      )),
    'channels' => array(
      'callback' => 'Ultrafunk\RequestTerms\request_callback',
      'routes'   => array(
        'channels'      => '/^channels$/',
      //'channels_page' => '/^channels\/page\/(?!0)\d{1,6}$/',
    )),
    'player' => array(
      'callback' => 'Ultrafunk\RequestPlayer\request_callback',
      'routes'   => array(
        'player_all'          => '/^player$/',
        'player_all_page'     => '/^player\/page\/(?!0)\d{1,6}$/',
        'player_artist'       => '/^player\/artist\/[a-z0-9-]*$/',
      //'player_channel'      => '/^player\/channel\/[a-z0-9-]*$/',
      //'player_channel_page' => '/^player\/channel\/[a-z0-9-]\/page\/(?!0)\d{1,6}*$/',
      )
    )
  );

  public function matches() : bool
  {
    if (isset($_SERVER['REQUEST_URI']))
    {
      $esc_request_url   = esc_url_raw($_SERVER['REQUEST_URI']);
      $this->request_url = trim($esc_request_url, '/');

      if (!empty($this->request_url))
      {
        $this->url_parts = explode('/', $this->request_url, 25);
        $route_key       = $this->url_parts[0];

        if (isset($this->routes[$route_key]))
        {
          foreach($this->routes[$route_key]['routes'] as $key => $route)
          {
            if (preg_match($route, $this->request_url) === 1)
            {
              $this->trailing_slash = ($esc_request_url[strlen($esc_request_url) - 1] === '/');
              $this->matched_route  = $key;
              $this->route_callback = $this->routes[$route_key]['callback'];
              return true;
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
function is_rest_request()
{
  return (isset($_SERVER['REQUEST_URI']) && (strpos($_SERVER['REQUEST_URI'], rest_get_url_prefix()) !== false));
}

//
// Filter do_parse_request to check for any custom routes
//
function parse_request(bool $do_parse, object $wp_env) : bool
{
  if ((is_admin() === false) && (wp_doing_ajax() === false) && (is_rest_request() === false))
  {
    // ToDo: Better solution?
    if (WP_DEBUG && (is_user_logged_in() === false))
      return $do_parse;
  
    $route_request = new RouteRequest();

    if ($route_request->matches() && !empty($route_request->route_callback))
    {
      // This is better than using .htaccess "hacks" to add trailing path slash to ONLY custom routes
      // Trailing path slash is needed for static html page caching to work properly
      if ($route_request->trailing_slash === false)
      {
        wp_redirect('/' . $route_request->request_url . '/', 301);
        exit;
      }
      else
      {
        return call_user_func($route_request->route_callback, $do_parse, $wp_env, $route_request->matched_route, $route_request->url_parts);
      }
    }
  }
  
  return $do_parse;
}
add_filter('do_parse_request', '\Ultrafunk\RouteRequest\parse_request', 10, 2);

/*
function trailing_slash_redirect($route_request)
{
  $permalink_structure = get_option('permalink_structure');

  if ($permalink_structure !== false)
  {
    $permalink_trailing_slash = ($permalink_structure[strlen($permalink_structure) - 1] === '/');

    if (($permalink_trailing_slash === true) && ($route_request->trailing_slash === false))
    {
      wp_redirect('/' . $route_request->request_url . '/', 301);
      exit;
    }
    
    if (($permalink_trailing_slash() === false) && ($route_request->trailing_slash === true))
    {
      wp_redirect('/' . $route_request->request_url, 301);
      exit;
    }
  }

  return false;
}
*/
