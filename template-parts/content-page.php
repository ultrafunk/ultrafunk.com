<?php
/*
 * Template part for displaying a page
 *
 * @package Ultrafunk
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\content_title(); ?>
    <div class="entry-meta">
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
  </div><!-- .entry-content -->
  <footer class="entry-footer">
  </footer><!-- .entry-footer -->
</article><!-- #post-<?php the_ID(); ?> -->

