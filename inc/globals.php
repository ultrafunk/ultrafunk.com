<?php declare(strict_types=1);
/*
 * Minimal global variables & functions for the theme, not the best solution, but it will have to do for now...
 *
 */


namespace Ultrafunk\Globals;


/**************************************************************************************************************************/


// Overridden in build-env.php, this is the fallback value
$ultrafunk_is_prod_build = false;


/**************************************************************************************************************************/


class Globals
{
  public static $version = '1.19.2';

  public static $dev_prod_consts = array(
    'menu_item_all_id'         => WP_DEBUG ? 2556 :  115,
    'menu_item_shuffle_id'     => WP_DEBUG ? 2251 : 2251,
    'block_frontpage_intro_id' => WP_DEBUG ?  808 :  808,
    'block_premium_intro_id'   => WP_DEBUG ? 1500 : 1500,
    'block_promo_intro_id'     => WP_DEBUG ? 2385 : 2717,
    'page_about_id'            => WP_DEBUG ?  806 :  806,
    'iframe_origin'            => WP_DEBUG ? 'https://wordpress.ultrafunk.com' : 'https://ultrafunk.com',
  );

  public static $request_params = array();
  public static $cached_title   = null;

  public static $perf_data = array(
    'display_perf_results' => true,
    'time_start'           => 0,
    'create_rnd_transient' => 0,
    'get_rnd_transient'    => 0,
  );
}

function console_log($output)
{
  if (WP_DEBUG)
    echo '<script>console.log(' . json_encode($output, JSON_HEX_TAG) . ');</script>';
}

function get_version()               { return Globals::$version; }

function get_dev_prod_const($key)    { return Globals::$dev_prod_consts[$key]; }

function get_request_params()        { return Globals::$request_params;    }
function set_request_params($params) { Globals::$request_params = $params; }

function is_termlist()               { return isset(Globals::$request_params['is_termlist']); }
function is_player()                 { return isset(Globals::$request_params['is_player']);   }
function is_shuffle()                { return isset(Globals::$request_params['is_shuffle']);  }

function get_cached_title()          { return Globals::$cached_title;   }
function set_cached_title($title)    { Globals::$cached_title = $title; }

function get_perf_data()             { return Globals::$perf_data; }

function perf_start()
{
  Globals::$perf_data['time_start'] = hrtime(true);
}

function perf_stop($perfTimer)
{
  Globals::$perf_data[$perfTimer] = round(((hrtime(true) - Globals::$perf_data['time_start']) / 1e+6), 2);
}
