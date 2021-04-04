<?php declare(strict_types=1);
/*
 * Player-playlist requests
 *
 */


namespace Ultrafunk\RequestPlayer;


use Ultrafunk\SharedRequest\Request;
use function Ultrafunk\SharedRequest\get_max_pages;
use function Ultrafunk\Globals\get_request_params;


/**************************************************************************************************************************/


class RequestPlayer extends Request
{
  public function __construct(object $wp_env, string $matched_route, array $url_parts)
  {
    parent::__construct();
    
    switch ($matched_route)
    {
      case 'player_all':
      case 'player_all_page':
        $this->is_player_all = true;
        $this->route_path    = 'player';
        $this->title_parts   = array('prefix' => 'Channel', 'title' => 'All Tracks');
        $this->current_page  = isset($url_parts[2]) ? intval($url_parts[2]) : 1;
        $this->max_pages     = get_max_pages(wp_count_posts()->publish, $this->items_per_page);
        $this->query_args    = array('paged' => $this->current_page, 'posts_per_page' => $this->items_per_page);
        $this->is_valid      = ($this->current_page <= $this->max_pages);
        break;

      case 'player_artist':
      case 'player_artist_page':
        $this->is_player_artist = true;
        $this->set_artist_channel_vars($url_parts, 'post_tag', 'tag', 'Artist');
        break;

      case 'player_channel':
      case 'player_channel_page':
        $this->is_player_channel = true;
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

  private function set_artist_channel_vars($url_parts, $taxonomy, $term_name, $title_prefix)
  {
    $slug           = sanitize_title($url_parts[2]);
    $this->taxonomy = $taxonomy;
    $this->WP_Term  = get_term_by('slug', $slug, $this->taxonomy);

    if (($this->WP_Term !== false) && ($this->WP_Term->count > 0))
    {
      $this->route_path   = 'player/' . strtolower($title_prefix) . '/' . $slug;
      $this->title_parts  = array('prefix' => $title_prefix, 'title' => $this->WP_Term->name);
      $this->current_page = isset($url_parts[4]) ? intval($url_parts[4]) : 1;
      $this->max_pages    = get_max_pages($this->WP_Term->count, $this->items_per_page);
      $this->query_args   = array($term_name => $slug, 'paged' => $this->current_page, 'posts_per_page' => $this->items_per_page);
      $this->is_valid     = ($this->current_page <= $this->max_pages);
    }
  }

  private function set_shuffle_vars($wp_env, $matched_route, $url_parts, $title = null)
  {
    // Shift array to fit request-shuffle format = remove the first 'player' url part
    array_shift($url_parts);

    if (\Ultrafunk\RequestShuffle\shuffle_callback(true, $wp_env, $matched_route, $url_parts) === false)
    {
      $this->is_player_shuffle = true;
      $shuffle_params     = get_request_params();
      $this->route_path   = 'player/shuffle/' . $shuffle_params['path'];
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
      $this->is_player = true;
      $this->set_request_params(array('is_player', 'is_player_all', 'is_player_artist', 'is_player_channel', 'is_player_shuffle'), array('WP_Term'));
    }

    return $this->is_valid;
  }
}


/**************************************************************************************************************************/


function player_callback(bool $do_parse, object $wp_env, string $matched_route, array $url_parts) : bool
{
  $request = new RequestPlayer($wp_env, $matched_route, $url_parts);

  if ($request->is_valid())
    $request->render_content($wp_env, 'content-player.php', '\Ultrafunk\ContentPlayer\content_player');

  return $do_parse;
}
