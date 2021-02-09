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
  private $request_url    = null;
  private $url_parts      = null;
  private $matched_route  = null;
  private $route_callback = null;

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
        'artists_page'        => '/^artists\/page\/(?!0)\d{1,6}$/',
        'artists_letter'      => '/^artists\/[a-z0-9]$/',
      //'artists_letter_page' => '/^artists\/[a-z]\/page\/(?!0)\d{1,6}$/',
      )),
    'channels' => array(
      'callback' => 'Ultrafunk\RequestTerms\request_callback',
      'routes'   => array(
        'channels'      => '/^channels$/',
        'channels_page' => '/^channels\/page\/(?!0)\d{1,6}$/',
      )
    )
  );

  public function get_url_parts()      { return $this->url_parts;      }
  public function get_matched_route()  { return $this->matched_route;  }
  public function get_route_callback() { return $this->route_callback; }

  public function matches() : bool
  {
    if (isset($_SERVER['REQUEST_URI']))
    {
      $this->request_url = trim(esc_url_raw($_SERVER['REQUEST_URI']), '/');

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
// Filter do_parse_request to check for any custom routes
//
function parse_request(bool $do_parse, object $wp) : bool
{
  if ((is_admin() === false) && (wp_doing_ajax() === false))
  {
    // ToDo: Better solution?
    if (WP_DEBUG && (is_user_logged_in() === false))
      return $do_parse;
  
    $route_request = new RouteRequest();

    if ($route_request->matches() && !empty($route_request->get_route_callback()))
      return call_user_func($route_request->get_route_callback(), $do_parse, $wp, $route_request->get_matched_route(), $route_request->get_url_parts());
  }
  
  return $do_parse;
}
add_filter('do_parse_request', '\Ultrafunk\RouteRequest\parse_request', 10, 2);
