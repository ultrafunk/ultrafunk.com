<?php declare(strict_types=1);
/*
 * List-player template
 *
 */


namespace Ultrafunk\ContentListPlayer;


use function Ultrafunk\Globals\console_log;
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
        data-term-id="<?php echo isset($request->WP_Term) ? $request->WP_Term->term_id : ''; ?>"
        >
        <?php tracklist_entries($request, $tracks); ?>
      </track-list>
    </div>
    <?php
    request_pagination($request);
  }
}

function find_video_id_pos(string $content) : ?array
{
  $id_prefix_strings = array('/watch?v=', '/embed/', 'youtu.be/');

  foreach($id_prefix_strings as $find_string)
  {
    $find_pos = strripos($content, $find_string);

    if ($find_pos !== false)
      return array($find_pos, strlen($find_string));
  }

  return null;
}

function term_links(array $tags, string $path) : void
{
  foreach ($tags as $tag)
    echo "<a href='/list/$path/$tag->slug/'>$tag->name</a>";
}

function tracklist_entries(object $request, array $tracks) : void
{
  global $ultrafunk_is_prod_build;
  $artist_title_regex = '/\s{1,}[–·-]\s{1,}/u'; // '/u' option MUST be set to handle Unicode
  $home_url           = home_url();

  foreach($tracks as $track)
  {
    $artist_title = preg_split($artist_title_regex, $track->post_title);
    $track_url    = esc_url("$home_url/$track->post_name/"); // Faster than calling get_permalink() lots of times...
    $track_data   = ['thumnail_src' => '/wp-content/themes/ultrafunk/inc/img/soundcloud_icon.png', 'css_class' => 'type-soundcloud'];
    $video_id_pos = find_video_id_pos($track->post_content);

    if (isset($video_id_pos))
    {
      $youtube_video_id = substr($track->post_content, ($video_id_pos[0] + $video_id_pos[1]), 11);
      $track_data       = ['thumnail_src' => "https://img.youtube.com/vi/$youtube_video_id/default.jpg", 'css_class' => 'type-youtube'];
    }

    ?>
    <div class="track-entry <?php echo $track_data['css_class']; ?>" id="<?php echo isset($video_id_pos) ? $youtube_video_id : ''; ?>"
      data-post-id="<?php echo $track->ID; ?>"
      data-artist-track-title="<?php echo esc_html($track->post_title); ?>"
      data-track-url="<?php echo $track_url; ?>"
      >
      <div class="track-artists-links"><?php term_links(get_object_term_cache($track->ID, 'post_tag'), 'artist'); ?></div>
      <div class="track-channels-links"><?php term_links(get_object_term_cache($track->ID, 'category'), 'channel'); ?></div>
      <div class="track-details">
        <div class="thumbnail" <?php echo isset($video_id_pos) ? 'title="Play Track"' : 'title="SoundCloud Track"'; ?>>
          <?php if ($ultrafunk_is_prod_build) { ?>
            <img src="<?php echo $track_data['thumnail_src']; ?>" alt="">
          <?php } else { ?>
            <img src="/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png" alt="">
          <?php } ?>
        </div>
        <?php if (isset($video_id_pos)) { ?>
          <div class="artist-title text-nowrap-ellipsis"><span><b><?php echo esc_html($artist_title[0]); ?></b></span><br><span><?php echo esc_html($artist_title[1]); ?></span></div>
        <?php } else { ?>
          <div class="artist-title text-nowrap-ellipsis" title="Link: Play SoundCloud track">
            <a href="<?php echo $track_url; ?>"><span><b><?php echo esc_html($artist_title[0]); ?></b></span><br><span><?php echo esc_html($artist_title[1]); ?></span></a>
          </div>
        <?php } ?>
      </div>
      <div class="track-more">
        <div class="track-duration"></div>
        <div class="share-playon-button" title="Share Track / Play On"><span class="material-icons">share</span></div>
        <div class="menu-button" title="More Track Options"><span class="material-icons">more_vert</span></div>
      </div>
    </div>
    <?php
  }
}
