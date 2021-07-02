<?php declare(strict_types=1);
/*
 * Termlist requests
 *
 */


namespace Ultrafunk\RequestTermlist;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\SharedRequest\get_max_pages;


/**************************************************************************************************************************/


class RequestTermlist extends Request
{
  public function __construct(object $wp_env, object $route_request)
  {
    parent::__construct($wp_env, $route_request);

    if (($route_request->matched_route === 'artists') || ($route_request->matched_route === 'artists_letter'))
    {
      add_filter('terms_clauses', function(array $clauses, array $taxonomies, array $args) : array
      {
        if (!isset($args['first_letter']))
          return $clauses;
      
        global $wpdb;
      
        $clauses['where'] .= ' AND ' . $wpdb->prepare("t.name LIKE %s", $wpdb->esc_like($args['first_letter']) . '%');
      
        return $clauses;
      }, 10, 3);

      $this->is_termlist_artists = true;
      $this->route_path     = 'artists';
      $this->first_letter   = ($route_request->matched_route === 'artists') ? 'a' : $route_request->path_parts[1];
      $this->letters_range  = range('a', 'z');
      $this->taxonomy       = 'uf_artist';
      $this->term_type      = 'artists';
      $this->term_path      = 'artist';
      $this->item_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count', 'first_letter' => $this->first_letter)));
      $this->items_per_page = $this->item_count;
    }
    else
    {
      $this->is_termlist_artists = false;
      $this->route_path     = 'channels';
      $this->taxonomy       = 'uf_channel';
      $this->term_type      = 'channels';
      $this->term_path      = 'channel';
      $this->item_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count')));
      $this->items_per_page = 50;
      $this->current_page   = isset($route_request->path_parts[2]) ? intval($route_request->path_parts[2]) : 1;
      $this->max_pages      = get_max_pages($this->item_count, $this->items_per_page);
    }
  }

  public function is_valid() : bool
  {
    if ($this->current_page <= $this->max_pages)
    {
      $this->is_valid    = true;
      $this->is_termlist = true;
      $this->set_request_params(array('is_termlist', 'is_termlist_artists'), array('item_count', 'first_letter', 'letters_range'));
    }

    return $this->is_valid;
  }
}


/**************************************************************************************************************************/


function termlist_callback(bool $do_parse, object $wp_env, object $route_request) : bool
{
  $request = new RequestTermlist($wp_env, $route_request);
  $request->render_content('content-termlist.php', '\Ultrafunk\ContentTermlist\content_termlist');
  return $do_parse;
}
