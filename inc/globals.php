<?php
/*
 * Minimal global variables & functions for the theme, not the best solution, but it will have to do for now...
 *
 */


namespace Ultrafunk\Globals;


class Globals
{
  public $version = '1.6.3';

  public $shuffle_params = array(
    'is_shuffle' => false,
    'type'       => null,
    'slug'       => null,
    'path'       => null,
  );

  public $cached_title = null;

  public $perf_data = array(
    'display_perf_results' => true,
    'time_start'           => 0,
    'create_rnd_transient' => 0,
    'get_rnd_transient'    => 0,
  );
}

function console_log($output)
{
  if (true === WP_DEBUG)
    echo '<script>console.log(' . json_encode($output, JSON_HEX_TAG) . ');</script>';
}

function instance()                      { return $GLOBALS['ultrafunk_globals'];            }

function get_version()                   { return instance()->version;                      }

function is_shuffle()                    { return instance()->shuffle_params['is_shuffle']; }

// Returns by reference so $shuffle_params[] can be changed if needed
function &get_shuffle_params()           { return instance()->shuffle_params;               }

function get_cached_title()              { return instance()->cached_title;                 }
function set_cached_title($title)        { instance()->cached_title = $title;               }

function get_perf_data()                 { return instance()->perf_data;                    }

function perf_start()
{
  instance()->perf_data['time_start'] = microtime(true);
}

function perf_stop($perfTimer)
{
  instance()->perf_data[$perfTimer] = round(((microtime(true) - instance()->perf_data['time_start']) * 1000), 2);
}
