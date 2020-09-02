<?php
/*
 * Template part for displaying a page
 *
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php
    if (is_search())
      \Ultrafunk\ThemeTags\content_excerpt();
    else
      the_content();
    ?>
  </div><!-- .entry-content -->
</article><!-- #post-<?php the_ID(); ?> -->

