<?php declare(strict_types=1);
/*
 * Standalone player playlist template
 *
 */


namespace Ultrafunk\ContentPlayer;


use function Ultrafunk\Globals\console_log;
use function Ultrafunk\SharedRequest\request_pagination;


/**************************************************************************************************************************/


function content_player($request)
{
  $tracks = get_posts($request->query_args);

  if (!empty($tracks))
  {
    ?>
    <div id="player-playlist" class="player-container">
      <div class="embedded-container">
        <div class="wp-block-embed__wrapper">
          <div id="youtube-player"></div>
        </div>
      </div>
      <track-list id="tracklist-container">
        <?php
        if (tracklist_entries($request, $tracks) === 0)
        {
          ?>
          <h2>Oops, nothing here...</h2>
          <p>Something went wrong with your request, please try again by going back to the
          <a href="" title="Go back" onclick="javascript:history.back();return false;">previous page</a>
          or to the <a href="/">Ultrafunk front page</a>.</p>
          <?php
        }
        ?>
      </track-list>
    </div>
    <?php
    request_pagination($request);
  }
}

function find_video_id_pos($content)
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

function tracklist_entries($request, $tracks)
{
  $artist_title_regex = '/\s{1,}[–·-]\s{1,}/u'; // '/u' option MUST be set to handle Unicode
  $track_count        = 0;
  $home_url           = home_url();

  foreach($tracks as $track)
  {
    $artist_title = preg_split($artist_title_regex, $track->post_title);
    $video_id_pos = find_video_id_pos($track->post_content);

    if (isset($video_id_pos))
    {
      $youtube_video_id = substr($track->post_content, ($video_id_pos[0] + $video_id_pos[1]), 11);
      $track_url        = esc_url("$home_url/$track->post_name/"); // Faster than calling get_permalink() lots of times...
    //$track_terms      = get_the_terms($track, 'post_tag');
      $track_count++;

      ?>
      <div class="track-entry" id="<?php echo $youtube_video_id; ?>" data-artist-track-title="<?php echo esc_html($track->post_title); ?>" data-track-url="<?php echo $track_url; ?>" data-post-id="<?php //echo $track->ID; ?>" data-term-ids="<?php //echo implode(",", array_column($track_terms, 'term_id')); ?>">
        <div class="track-details">
          <div class="thumbnail" title="Play Track">
            <img src="https://img.youtube.com/vi/<?php echo $youtube_video_id; ?>/default.jpg" alt="Track thumbnail">
       <!-- <img src="/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png" alt="Track thumbnail"> -->
          </div>
          <div class="artist-title text-nowrap-ellipsis"><span><b><?php echo esc_html($artist_title[0]); ?></b></span><br><span><?php echo esc_html($artist_title[1]); ?></span></div>
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

  return $track_count;
}
