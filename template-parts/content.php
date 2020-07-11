<?php
/*
 * Template part for displaying posts
 *
 */

?>

<article id="post-<?php the_ID(); ?>" data-entry-title="<?php echo esc_html(get_the_title()); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
      <?php // \Ultrafunk\ThemeTags\meta_date_author(); ?>
      <?php \Ultrafunk\ThemeTags\meta_controls(); ?>
      <?php
      echo '<div class="entry-meta-channels"><b>Channels:</b> ' . get_the_category_list(', ') . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
      echo get_the_tag_list('<div class="entry-meta-artists"><b>Artists:</b> ', ', ', '</div>');          // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
      ?>
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
  </div><!-- .entry-content -->
</article><!-- #post-<?php the_ID(); ?> -->

