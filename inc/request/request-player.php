<?php declare(strict_types=1);
/*
 * Standalone player requests
 *
 */


namespace Ultrafunk\RequestPlayer;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\Globals\set_request_params;


/**************************************************************************************************************************/


class RequestPlayer extends Request
{
  public function __construct(string $matched_route, array $url_parts)
  {
    switch ($matched_route)
    {
      case 'player_artist':
        $this->is_player_artist = true;
        $slug                   = sanitize_title($url_parts[2]);
        $this->WP_Term          = get_term_by('slug', $slug, 'post_tag');
        $this->route_query_args = array('tag' => $slug, 'posts_per_page' => 50);
        $this->is_valid         = (($this->WP_Term !== false) && ($this->WP_Term->count > 0)) ? true : false;
        break;

      case 'player_all':
      case 'player_all_page':
        $this->is_player_artist  = false;
        $this->route_path        = 'player';
        $this->pagination_header = 'Channel: <span class="light-text">All Tracks</span>';
        $post_count_object       = wp_count_posts();
        $item_count              = $post_count_object->publish;
        $items_per_page          = 30;
        $this->current_page      = isset($url_parts[2]) ? intval($url_parts[2]) : 1;
        $this->max_pages         = ($item_count > $items_per_page) ? ceil($item_count / $items_per_page) : 1;
        $this->route_query_args  = array('offset' => (($items_per_page * $this->current_page) - $items_per_page), 'posts_per_page' => $items_per_page);
        $this->is_valid          = ($this->current_page <= $this->max_pages) ? true : false;
        break;
    }
  }

  public function is_valid()
  {
    if ($this->is_valid)
    {
      $this->set_query_args();

      set_request_params(array(
        'is_player'        => true,
        'is_player_artist' => (isset($this->is_player_artist) ? $this->is_player_artist : null),
        'WP_Term'          => (isset($this->WP_Term)          ? $this->WP_Term          : null),
        'route_path'       => (isset($this->route_path)       ? $this->route_path       : null),
        'current_page'     => (isset($this->current_page)     ? $this->current_page     : null),
        'max_pages'        => (isset($this->max_pages)        ? $this->max_pages        : null),
      ));
    }

    return $this->is_valid;
  }
}


/**************************************************************************************************************************/


function request_callback(bool $do_parse, object $wp_env, string $matched_route, array $url_parts) : bool
{
  $request = new RequestPlayer($matched_route, $url_parts);

  if ($request->is_valid())
    $request->render_content($wp_env, 'content-player.php', '\Ultrafunk\ContentPlayer\content_player');

  return $do_parse;
}
