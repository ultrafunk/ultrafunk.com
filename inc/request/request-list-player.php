<?php declare(strict_types=1);
/*
 * List-player requests
 *
 */


namespace Ultrafunk\RequestListPlayer;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\SharedRequest\get_max_pages;
use function Ultrafunk\Globals\get_request_params;


/**************************************************************************************************************************/


class RequestListPlayer extends Request
{
  public function __construct(object $wp_env, string $matched_route, array $url_parts)
  {
    parent::__construct();
    
    switch ($matched_route)
    {
      case 'list_player_all':
      case 'list_player_all_page':
        $this->is_list_player_all = true;
        $this->route_path   = 'list';
        $this->title_parts  = array('prefix' => 'Channel', 'title' => 'All Tracks');
        $this->current_page = isset($url_parts[2]) ? intval($url_parts[2]) : 1;
        $this->max_pages    = get_max_pages(intval(wp_count_posts()->publish), $this->items_per_page);
        $this->query_args   = array('paged' => $this->current_page, 'posts_per_page' => $this->items_per_page);
        $this->is_valid     = ($this->current_page <= $this->max_pages);
        break;

      case 'list_player_artist':
      case 'list_player_artist_page':
        $this->is_list_player_artist = true;
        $this->set_artist_channel_vars($url_parts, 'post_tag', 'tag', 'Artist');
        break;

      case 'list_player_channel':
      case 'list_player_channel_page':
        $this->is_list_player_channel = true;
        $this->set_artist_channel_vars($url_parts, 'category', 'category_name', 'Channel');
        break;

      case 'shuffle_all':
      case 'shuffle_all_page':
        $this->set_shuffle_vars($wp_env, $matched_route, $url_parts, 'All Tracks');
        break;

      case 'shuffle_slug':
      case 'shuffle_slug_page':
        $this->set_shuffle_vars($wp_env, $matched_route, $url_parts);
        break;
    }
  }

  private function set_artist_channel_vars(array $url_parts, string $taxonomy, string $term_name, string $title_prefix) : void
  {
    $slug           = sanitize_title($url_parts[2]);
    $this->taxonomy = $taxonomy;
    $this->WP_Term  = get_term_by('slug', $slug, $this->taxonomy);

    if (($this->WP_Term !== false) && ($this->WP_Term->count > 0))
    {
      $this->route_path   = 'list/' . strtolower($title_prefix) . '/' . $slug;
      $this->title_parts  = array('prefix' => $title_prefix, 'title' => $this->WP_Term->name);
      $this->current_page = isset($url_parts[4]) ? intval($url_parts[4]) : 1;
      $this->max_pages    = get_max_pages($this->WP_Term->count, $this->items_per_page);
      $this->query_args   = array($term_name => $slug, 'paged' => $this->current_page, 'posts_per_page' => $this->items_per_page);
      $this->is_valid     = ($this->current_page <= $this->max_pages);
    }
  }

  private function set_shuffle_vars(object $wp_env, string $matched_route, array $url_parts, string $title = null) : void
  {
    // Shift array to fit request-shuffle format = remove the first 'player' url part
    array_shift($url_parts);

    if (\Ultrafunk\RequestShuffle\shuffle_callback(true, $wp_env, $matched_route, $url_parts) === false)
    {
      $this->is_list_player_shuffle = true;
      $shuffle_params     = get_request_params();
      $this->route_path   = 'list/shuffle/' . $shuffle_params['path'];
      $this->title_parts  = array('prefix' => 'Shuffle', 'title' => (($title !== null) ? $title : $shuffle_params['slug_name']));
      $this->current_page = $wp_env->query_vars['paged'];
      $this->max_pages    = get_max_pages(count($wp_env->query_vars['post__in']), $this->items_per_page);
      $this->query_args   = $wp_env->query_vars;
      $this->query_args  += array('posts_per_page' => $this->items_per_page);
      $this->is_valid     = ($this->current_page <= $this->max_pages);
    }
  }

  public function is_valid() : bool
  {
    if ($this->is_valid)
    {
      $this->is_list_player = true;
      
      $this->set_request_params(array(
        'is_list_player',
        'is_list_player_all',
        'is_list_player_artist',
        'is_list_player_channel',
        'is_list_player_shuffle',
        ),
        array('WP_Term'),
      );
    }

    return $this->is_valid;
  }
}


/**************************************************************************************************************************/


function list_player_callback(bool $do_parse, object $wp_env, string $matched_route, array $url_parts) : bool
{
  $request = new RequestListPlayer($wp_env, $matched_route, $url_parts);

  if ($request->is_valid())
    $request->render_content($wp_env, 'content-list-player.php', '\Ultrafunk\ContentListPlayer\content_list_player');

  return $do_parse;
}
