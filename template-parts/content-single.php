<?php
/*
 * Template part for displaying single post
 *
 */

?>

<article id="post-<?php the_ID(); ?>" data-entry-title="<?php echo esc_html(get_the_title()); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
      <?php // \Ultrafunk\ThemeTags\meta_date_author(); ?>
      <?php
      echo '<div class="entry-meta-channels"><b>Channels:</b> ' . get_the_category_list(', ') . '</div>';
      echo get_the_tag_list('<div class="entry-meta-artists"><b>Artists:</b> ', ', ', '</div>');
      ?>
    </div><!-- .entry-meta -->
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
  </div><!-- .entry-content -->
</article><!-- #post-<?php the_ID(); ?> -->

