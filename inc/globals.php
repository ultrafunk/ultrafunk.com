<?php declare(strict_types=1);
/*
 * Minimal global variables & functions for the theme, not the best solution, but it will have to do for now...
 *
 */


namespace Ultrafunk\Globals;


/**************************************************************************************************************************/


// Overridden in build-env.php, this is the fallback value
$ultrafunk_is_prod_build = false;

// Set static global variables
Globals::$cached_home_url = esc_url(home_url());


/**************************************************************************************************************************/


class Globals
{
  const VERSION = '1.30.5';

  const DEV_PROD_ENV = array(
    'menu_item_all_id'         => WP_DEBUG ?  115 :  115,
    'menu_item_shuffle_id'     => WP_DEBUG ? 2251 : 2251,
    'block_frontpage_intro_id' => WP_DEBUG ?  808 :  808,
    'block_premium_intro_id'   => WP_DEBUG ? 1500 : 1500,
    'block_promo_intro_id'     => WP_DEBUG ? 2717 : 2717,
    'page_about_id'            => WP_DEBUG ?  806 :  806,
    'player_items_per_page'    => WP_DEBUG ?   20 :   50,
    'iframe_origin'            => WP_DEBUG ? 'https://wordpress.ultrafunk.com' : 'https://ultrafunk.com',
  );

  public static $request_params  = array();
  public static $navigation_vars = array();
  public static $cached_title    = null;
  public static $cached_home_url = null;

  public static $perf_data = array(
    'display_perf_results' => true,
    'time_start'           => 0,
    'create_rnd_transient' => 0,
    'get_rnd_transient'    => 0,
  );
}


/**************************************************************************************************************************/


function console_log($output) : void
{
  if (WP_DEBUG)
    echo '<script>console.log(' . json_encode($output, JSON_HEX_TAG) . ');</script>';
}

function get_version() : string
{
  return Globals::VERSION;
}

function get_dev_prod_env(string $key)
{
  return Globals::DEV_PROD_ENV[$key];
}

function get_request_params() : array
{
  return Globals::$request_params;
}

function set_request_params(array $params) : void
{
  Globals::$request_params = $params;
}

function get_navigation_vars() : array
{
  return Globals::$navigation_vars;
}

function set_navigation_vars(array $vars) : void
{
  Globals::$navigation_vars = $vars;
}

function is_termlist() : bool
{
  return isset(Globals::$request_params['is_termlist']);
}

function is_list_player() : bool
{
  return isset(Globals::$request_params['is_list_player']);
}

function is_shuffle() : bool
{
  return isset(Globals::$request_params['is_shuffle']);
}

function get_cached_title() : ?string
{
  return Globals::$cached_title;
}

function set_cached_title(string $title) : void
{
  Globals::$cached_title = $title;
}

function get_cached_home_url(string $path = '') : ?string
{
  return Globals::$cached_home_url . $path;
}

function get_perf_data() : array
{
  return Globals::$perf_data;
}

function perf_start() : void
{
  Globals::$perf_data['time_start'] = hrtime(true);
}

function perf_stop(string $perfTimer) : void
{
  Globals::$perf_data[$perfTimer] = round(((hrtime(true) - Globals::$perf_data['time_start']) / 1e+6), 2);
}
