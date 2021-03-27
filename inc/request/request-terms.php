<?php declare(strict_types=1);
/*
 * Termlist requests
 *
 */


namespace Ultrafunk\RequestTerms;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\SharedRequest\get_max_pages;


/**************************************************************************************************************************/


class RequestTerms extends Request
{
  public function __construct(object $wp_env, string $matched_route, array $url_parts)
  {
    if (($matched_route === 'artists') || ($matched_route === 'artists_letter'))
    {
      add_filter('terms_clauses', function($clauses, $taxonomies, $args)
      {
        if(!isset($args['first_letter']))
          return $clauses;
      
        global $wpdb;
      
        $clauses['where'] .= ' AND ' . $wpdb->prepare("t.name LIKE %s", $wpdb->esc_like($args['first_letter']) . '%');
      
        return $clauses;
      }, 10, 3);

      $this->is_termlist_artists = true;
      $this->route_path     = 'artists';
      $this->first_letter   = ($matched_route === 'artists') ? 'a' : $url_parts[1];
      $this->letters_range  = range('a', 'z');
      $this->taxonomy       = 'post_tag';
      $this->term_type      = 'tags';
      $this->term_path      = 'artist';
      $this->item_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count', 'first_letter' => $this->first_letter)));
      $this->items_per_page = $this->item_count;
    }
    else
    {
      $this->is_termlist_artists = false;
      $this->route_path     = 'channels';
      $this->taxonomy       = 'category';
      $this->term_type      = 'categories';
      $this->term_path      = 'channel';
      $this->item_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count')));
      $this->items_per_page = 50;
      $this->current_page   = isset($url_parts[2]) ? intval($url_parts[2]) : 1;
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


function terms_callback(bool $do_parse, object $wp_env, string $matched_route, array $url_parts) : bool
{
  $request = new RequestTerms($wp_env, $matched_route, $url_parts);

  if ($request->is_valid())
    $request->render_content($wp_env, 'content-terms.php', '\Ultrafunk\ContentTerms\termlist');

  return $do_parse;
}
