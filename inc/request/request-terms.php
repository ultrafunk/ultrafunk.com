<?php declare(strict_types=1);
/*
 * Term requests
 *
 */


namespace Ultrafunk\RequestTerms;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\Globals\set_request_params;


/**************************************************************************************************************************/


class RequestTerms extends Request
{
  public function __construct(string $matched_route, array $url_parts)
  {
    if (($matched_route === 'artists') || ($matched_route === 'artists_letter'))
    {
      add_filter('terms_clauses', 'Ultrafunk\RequestTerms\modify_term_clauses', 10, 3);

      $this->is_termlist_artists = true;
      $this->route_path     = 'artists';
      $this->first_letter   = ($matched_route === 'artists') ? 'a' : $url_parts[1];
      $this->letters_range  = range('a', 'z');
      $this->taxonomy       = 'post_tag';
      $this->term_type      = 'tags';
      $this->term_path      = 'artist';
      $this->item_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count', 'first_letter' => $this->first_letter)));
      $this->items_per_page = $this->item_count;
      $this->current_page   = 1;
      $this->max_pages      = 1;
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
      $this->max_pages      = ($this->item_count > $this->items_per_page) ? ceil($this->item_count / $this->items_per_page) : 1;
    }
  }

  public function is_valid()
  {
    if ($this->current_page <= $this->max_pages)
    {
      $this->is_valid = true;
      
      set_request_params(array(
        'is_termlist'         => true,
        'is_termlist_artists' => $this->is_termlist_artists,
        'route_path'          => $this->route_path,
        'item_count'          => $this->item_count,
        'current_page'        => $this->current_page,
        'max_pages'           => $this->max_pages,
        'first_letter'        => (isset($this->first_letter)  ? $this->first_letter  : null),
        'letters_range'       => (isset($this->letters_range) ? $this->letters_range : null),
      ));
    }

    return $this->is_valid;
  }
}

function modify_term_clauses($clauses, $taxonomies, $args)
{
  if(!isset($args['first_letter']))
    return $clauses;

  global $wpdb;

  $clauses['where'] .= ' AND ' . $wpdb->prepare("t.name LIKE %s", $wpdb->esc_like($args['first_letter']) . '%');

  return $clauses;
}


/**************************************************************************************************************************/


function request_callback(bool $do_parse, object $wp_env, string $matched_route, array $url_parts) : bool
{
  $request = new RequestTerms($matched_route, $url_parts);

  if ($request->is_valid())
    $request->render_content($wp_env, 'content-terms.php', '\Ultrafunk\ContentTerms\termlist');

  return $do_parse;
}
