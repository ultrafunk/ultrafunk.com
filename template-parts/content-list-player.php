<?php declare(strict_types=1);
/*
 * List-player template
 *
 */


namespace Ultrafunk\ContentListPlayer;


use function Ultrafunk\Globals\console_log;
use function Ultrafunk\Globals\get_cached_home_url;
use function Ultrafunk\SharedRequest\request_pagination;


/**************************************************************************************************************************/


function content_list_player(object $request) : void
{
  $tracks = get_posts($request->query_args);

  if (!empty($tracks))
  {
    ?>
    <div id="list-player-container" class="player-container">
      <div class="embedded-container">
        <div class="wp-block-embed__wrapper">
          <div id="youtube-player"></div>
        </div>
      </div>
      <track-list id="tracklist-container"
        data-taxonomy="<?php echo isset($request->taxonomy) ? $request->taxonomy : ''; ?>"
        data-term-id="<?php echo isset($request->wp_term) ? $request->wp_term->term_id : ''; ?>"
        >
        <?php
        //$start = \microtime(1);
          tracklist_entries($request, $tracks);
        //$stop = \microtime(1);
        //console_log(($stop - $start) * 1000);
        ?>
      </track-list>
    </div>
    <?php
    request_pagination($request);
  }
}

function get_track_type(object $track, string $youtube_id_regex, array $default_track_type) : array
{
  // (track_source_type === 1): youtube track source data
  // (track_source_type === 2): soundcloud track source data
  if (intval($track->track_source_type) === 1)
  {
    preg_match($youtube_id_regex, $track->track_source_data, $video_id);

    return array(
      'thumnail_src' => "https://img.youtube.com/vi/$video_id[0]/default.jpg",
      'css_class'    => 'type-youtube',
      'video_id'     => $video_id[0],
    );
  }

  return $default_track_type;
}

function term_links(array $tags, string $path, $track_artist_id = -1) : void
{
  foreach ($tags as $tag)
  {
    $class = (($track_artist_id !== -1) && ($tag->term_id === (int)$track_artist_id)) ? 'primary' : 'secondary';    
    echo "<a class='$class' href='/list/$path/$tag->slug/'>$tag->name</a>";
  }
}

function tracklist_entries(object $request, array $tracks) : void
{
  global $ultrafunk_is_prod_build;
  
  $youtube_id_regex = '/[0-9A-Za-z_-]{10}[048AEIMQUYcgkosw]/';
  $home_url         = get_cached_home_url();
  
  $default_track_type = array(
    'thumnail_src' => '/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png',
    'css_class'    => 'type-soundcloud',
    'video_id'     => null,
  );

  foreach($tracks as $track)
  {
    $track_artist = esc_html($track->track_artist);
    $track_title  = esc_html($track->track_title);
    $track_url    = esc_url("$home_url/track/$track->post_name/");
    $track_type   = get_track_type($track, $youtube_id_regex, $default_track_type);
    $artists      = get_object_term_cache($track->ID, 'uf_artist');
    $channels     = get_object_term_cache($track->ID, 'uf_channel');

    ?>
    <div class="track-entry <?php echo $track_type['css_class']; ?>" id="<?php echo isset($track_type['video_id']) ? $track_type['video_id'] : ''; ?>"
      data-post-id="<?php echo $track->ID; ?>"
      data-track-artist="<?php echo $track_artist; ?>"
      data-track-title="<?php echo $track_title; ?>"
      data-track-url="<?php echo $track_url; ?>"
      >
      <div class="track-artists-links"><?php term_links($artists, 'artist', $track->track_artist_id); ?></div>
      <div class="track-channels-links"><?php term_links($channels, 'channel'); ?></div>
      <div class="track-details">
        <div class="thumbnail" <?php echo isset($track_type['video_id']) ? 'title="Play Track"' : 'title="SoundCloud Track"'; ?>>
          <?php if ($ultrafunk_is_prod_build) { ?>
            <img src="<?php echo $track_type['thumnail_src']; ?>" alt="">
          <?php } else { ?>
            <img src="/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png" alt="">
          <?php } ?>
        </div>
        <?php if (isset($track_type['video_id'])) { ?>
          <div class="artist-title text-nowrap-ellipsis"><span><b><?php echo $track_artist; ?></b></span><br><span><?php echo $track_title; ?></span></div>
        <?php } else { ?>
          <div class="artist-title text-nowrap-ellipsis" title="Link: Play SoundCloud track">
            <a href="<?php echo $track_url; ?>"><span><b><?php echo $track_artist; ?></b></span><br><span><?php echo $track_title; ?></span></a>
          </div>
        <?php } ?>
      </div>
      <div class="track-more">
        <div class="track-duration"></div>
        <div class="share-playon-button" title="Share Track / Play On"><span class="material-icons">share</span></div>
        <div class="menu-button" title="Track Details"><span class="material-icons">more_vert</span></div>
      </div>
    </div>
    <?php
  }
}
