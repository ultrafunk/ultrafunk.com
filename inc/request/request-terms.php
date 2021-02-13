<?php declare(strict_types=1);
/*
 * Term requests
 *
 */


namespace Ultrafunk\RequestTerms;


use function Ultrafunk\Globals\ {
  console_log,
  set_request_params,
};


/**************************************************************************************************************************/


class RequestTerms
{
  public function __construct(string $matched_route, array $url_parts)
  {
    if (($matched_route === 'artists') || ($matched_route === 'artists_letter'))
    {
      add_filter('terms_clauses', 'Ultrafunk\RequestTerms\modify_term_clauses', 10, 3);

      $this->is_artists     = true;
      $this->first_letter   = ($matched_route === 'artists') ? 'a' : $url_parts[1];
      $this->letters_range  = range('a', 'z');
      $this->taxonomy       = 'post_tag';
      $this->term_type      = 'tags';
      $this->term_path      = 'artist';
      $this->term_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count', 'first_letter' => $this->first_letter)));
      $this->terms_per_page = $this->term_count;
      $this->current_page   = 1;
      $this->max_pages      = 1;
    }
    else
    {
      $this->is_artists     = false;
      $this->taxonomy       = 'category';
      $this->term_type      = 'categories';
      $this->term_path      = 'channel';
      $this->term_count     = intval(get_terms(array('taxonomy' => $this->taxonomy, 'fields' => 'count')));
      $this->terms_per_page = 30;
      $this->current_page   = isset($url_parts[2]) ? intval($url_parts[2]) : 1;
      $this->max_pages      = ($this->term_count > $this->terms_per_page) ? ceil($this->term_count / $this->terms_per_page) : 1;
    }

    set_request_params(array(
      'is_termlist'   => true,
      'is_artists'    => $this->is_artists,
      'term_count'    => $this->term_count,
      'current_page'  => $this->current_page,
      'max_pages'     => $this->max_pages,
      'first_letter'  => (isset($this->first_letter)  ? $this->first_letter  : null),
      'letters_range' => (isset($this->letters_range) ? $this->letters_range : null),
    ));
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


function request_callback(bool $do_parse, object $wp, string $matched_route, array $url_parts) : bool
{
  $request = new RequestTerms($matched_route, $url_parts);
  
  if ($request->current_page <= $request->max_pages)
  {
    require_once get_template_directory() . '/template-parts/content-terms.php';

    $wp->send_headers();
    
    get_header();
    \Ultrafunk\ContentTerms\term_list($request);
    get_footer();

  //console_log($request);
    
    exit;
  }

  return $do_parse;
}
