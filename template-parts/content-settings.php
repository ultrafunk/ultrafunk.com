<?php
/*
 * Template part for displaying a settings page
 *
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
  <header class="entry-header">
    <?php \Ultrafunk\ThemeTags\entry_title(); ?>
  </header><!-- .entry-header -->
  <div class="entry-content">
    <?php the_content(); ?>
    <div id="settings-container"></div>
    <div id="settings-save-reset">
      <div class="settings-save">Save Settings</div>
      <div class="settings-reset">Reset Settings</div>
    </div>
  </div><!-- .entry-content -->
</article>
