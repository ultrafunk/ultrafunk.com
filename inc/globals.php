<?php declare(strict_types=1);
/*
 * Minimal global variables & functions for the theme, not the best solution, but it will have to do for now...
 *
 */


namespace Ultrafunk\Globals;


// Overridden in preload-chunk.php, this is the fallback value
$ultrafunk_is_prod_build = false;


class Globals
{
  public static $version = '1.15.0';

  public static $dev_prod_consts = array(
    'menu_item_all_id'         => WP_DEBUG ?  115 :  115,
    'menu_item_shuffle_id'     => WP_DEBUG ? 2251 : 2251,
    'block_frontpage_intro_id' => WP_DEBUG ?  808 :  808,
    'block_premium_intro_id'   => WP_DEBUG ? 1500 : 1500,
    'block_promo_intro_id'     => WP_DEBUG ? 2385 : 2717,
    'page_about_id'            => WP_DEBUG ?  806 :  806,
    'iframe_origin'            => WP_DEBUG ? 'https://wordpress.ultrafunk.com' : 'https://ultrafunk.com',
  );

  public static $shuffle_params = array(
    'is_shuffle' => false,
    'type'       => null,
    'slug'       => null,
    'path'       => null,
  );

  public static $cached_title = null;

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

function get_version()            { return Globals::$version;                      }

function get_dev_prod_const($key) { return Globals::$dev_prod_consts[$key];        }

function is_shuffle()             { return Globals::$shuffle_params['is_shuffle']; }

// Returns by reference so $shuffle_params[] can be changed if needed
function &get_shuffle_params()    { return Globals::$shuffle_params;               }

function get_cached_title()       { return Globals::$cached_title;                 }
function set_cached_title($title) { Globals::$cached_title = $title;               }

function get_perf_data()          { return Globals::$perf_data;                    }

function perf_start()
{
  Globals::$perf_data['time_start'] = microtime(true);
}

function perf_stop($perfTimer)
{
  Globals::$perf_data[$perfTimer] = round(((microtime(true) - Globals::$perf_data['time_start']) * 1000), 2);
}
