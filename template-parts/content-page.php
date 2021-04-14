<?php
/*
 * Page template
 *
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
    <div class="entry-meta">
    </div>
  </header>
  <div class="entry-content">
    <?php
    if (is_search())
      \Ultrafunk\ThemeTags\content_excerpt();
    else
      the_content();
    ?>
  </div>
</article>
