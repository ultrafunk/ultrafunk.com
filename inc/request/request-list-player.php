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
  public function __construct(object $wp_env, object $route_request)
  {
    parent::__construct($wp_env, $route_request);
    
    switch ($route_request->matched_route)
    {
      case 'list_player_all':
      case 'list_player_all_page':
        {
          $this->is_list_player_all = true;
          $this->route_path   = 'list';
          $this->title_parts  = array('prefix' => 'Channel', 'title' => 'All Tracks');
          $this->current_page = isset($route_request->path_parts[2]) ? intval($route_request->path_parts[2]) : 1;
          $this->max_pages    = get_max_pages(intval(wp_count_posts('uf_track')->publish), $this->items_per_page);
          $this->is_valid     = ($this->current_page <= $this->max_pages);

          $this->query_args = array(
            'post_type'      => 'uf_track',
            'paged'          => $this->current_page,
            'posts_per_page' => $this->items_per_page,
          );
        }
        break;

      case 'list_player_artist':
      case 'list_player_artist_page':
        $this->is_list_player_artist = true;
        $this->set_artist_channel_vars('uf_artist', 'Artist');
        break;

      case 'list_player_channel':
      case 'list_player_channel_page':
        $this->is_list_player_channel = true;
        $this->set_artist_channel_vars('uf_channel', 'Channel');
        break;

      case 'shuffle_all':
      case 'shuffle_all_page':
        $this->set_shuffle_vars('All Tracks');
        break;

      case 'shuffle_slug':
      case 'shuffle_slug_page':
        $this->set_shuffle_vars();
        break;
    }
  }

  private function set_artist_channel_vars(string $taxonomy, string $title_prefix) : void
  {
    $slug           = sanitize_title($this->route_request->path_parts[2]);
    $this->taxonomy = $taxonomy;
    $this->wp_term  = get_term_by('slug', $slug, $this->taxonomy);

    if (($this->wp_term !== false) && ($this->wp_term->count > 0))
    {
      $this->route_path   = 'list/' . strtolower($title_prefix) . '/' . $slug;
      $this->title_parts  = array('prefix' => $title_prefix, 'title' => $this->wp_term->name);
      $this->current_page = isset($this->route_request->path_parts[4]) ? intval($this->route_request->path_parts[4]) : 1;
      $this->max_pages    = get_max_pages($this->wp_term->count, $this->items_per_page);
      $this->is_valid     = ($this->current_page <= $this->max_pages);

      $this->query_args = array(
        'post_type'      => 'uf_track',
        'paged'          => $this->current_page,
        'posts_per_page' => $this->items_per_page,
        'tax_query'      => array(
          array(
            'taxonomy' => $taxonomy,
            'field'    => 'slug',
            'terms'    => $slug,
          ),
        ),
      );
    }
  }

  private function set_shuffle_vars(string $title = null) : void
  {
    // Shift array to fit request-shuffle format = remove the first 'player' url part
    array_shift($this->route_request->path_parts);

    if (\Ultrafunk\RequestShuffle\shuffle_callback(true, $this->wp_env, $this->route_request) === false)
    {
      $this->is_list_player_shuffle = true;
      $shuffle_params     = get_request_params();
      $this->route_path   = 'list/shuffle/' . $shuffle_params['path'];
      $this->title_parts  = array('prefix' => 'Shuffle', 'title' => (($title !== null) ? $title : $shuffle_params['slug_name']));
      $this->current_page = $this->wp_env->query_vars['paged'];
      $this->max_pages    = get_max_pages(count($this->wp_env->query_vars['post__in']), $this->items_per_page);
      $this->is_valid     = ($this->current_page <= $this->max_pages);

      $this->query_args   = $this->wp_env->query_vars;
      $this->query_args  += array('posts_per_page' => $this->items_per_page);
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
        array('wp_term'),
      );
    }

    return $this->is_valid;
  }
}


/**************************************************************************************************************************/


function list_player_callback(bool $do_parse, object $wp_env, object $route_request) : bool
{
  $request = new RequestListPlayer($wp_env, $route_request);
  $request->render_content('content-list-player.php', '\Ultrafunk\ContentListPlayer\content_list_player');
  return $do_parse;
}
