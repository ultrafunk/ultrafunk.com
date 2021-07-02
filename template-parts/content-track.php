<?php
/*
 * Post / track template
 *
 */

?>

<single-track id="track-<?php the_ID(); ?>"
  data-track-artist="<?php echo esc_html($post->track_artist); ?>"
  data-track-title="<?php echo esc_html($post->track_title); ?>"
  data-track-source-data="<?php echo esc_html($post->track_source_data); ?>"
  <?php post_class(); ?>
  >
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
      <div class="entry-meta-channels"><b><a href="/channels/" title="Show All Channels">Channels: </a></b><?php the_terms(get_the_ID(), 'uf_channel'); ?></div>
      <div class="entry-meta-artists"><b><a href="/artists/" title="Show All Artists">Artists: </a></b><?php the_terms(get_the_ID(), 'uf_artist'); ?></div>
      <?php \Ultrafunk\ThemeTags\meta_controls($post); ?>
    </div>
  </header>
  <div class="entry-content">
    <?php the_content(); ?>
  </div>
</single-track>
