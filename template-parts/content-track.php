<?php
/*
 * Template part for displaying a post
 *
 */

?>

<single-track id="track-<?php the_ID(); ?>" data-artist-track-title="<?php echo esc_html(get_the_title()); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
      <?php
      echo '<div class="entry-meta-channels"><b><a href="/channels/">Channels:</a></b> ' . get_the_category_list(', ') . '</div>';
      echo get_the_tag_list('<div class="entry-meta-artists"><b><a href="/artists/">Artists:</a></b> ', ', ', '</div>');
      \Ultrafunk\ThemeTags\meta_controls();
      ?>
    </div>
  </header>
  <div class="entry-content">
    <?php the_content(); ?>
  </div>
</single-track>
