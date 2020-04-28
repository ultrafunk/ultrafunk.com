<?php
/*
 * Template part for displaying posts
 *
 * @package Ultrafunk
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\content_title(); ?>
    <div class="entry-meta">
      <div class="entry-meta-date-author">
        <?php \Ultrafunk\ThemeTags\meta_date_author(); ?>
      </div>
      <?php echo '<b>Channels:</b> ' . get_the_category_list(', '); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
      <?php echo get_the_tag_list('<br><b>Artists:</b> ', ', '); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
  </div><!-- .entry-content -->
  <footer class="entry-footer">
    <?php //the_category(); ?>
    <?php //the_tags(); ?>
  </footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->

