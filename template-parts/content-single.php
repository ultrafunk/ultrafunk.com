<?php
/*
 * Template part for displaying single post
 *
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\content_title(); ?>
    <div class="entry-meta">
      <div class="entry-meta-date-author">
        <?php \Ultrafunk\ThemeTags\meta_date_author(); ?>
      </div>
      <?php
      echo '<div class="entry-meta-channels"><b>Channels:</b> ' . get_the_category_list(', ') . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
      echo get_the_tag_list('<div class="entry-meta-artists"><b>Artists:</b> ', ', ', '</div>');          // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
      ?>
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
  </div><!-- .entry-content -->
  <footer class="entry-footer">
  </footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->

