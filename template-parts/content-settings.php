<?php
/*
 * Template part for displaying a settings page
 *
 */

$version      = \Ultrafunk\Globals\get_version();
$template_uri = esc_url(get_template_directory_uri());

?>
<script type="module"   src='<?php echo $template_uri . '/js/src/shared/settings-ui.js?ver='  . $version; ?>'></script>
<link rel="stylesheet" href='<?php echo $template_uri . '/js/src/shared/settings-ui.css?ver=' . $version; ?>' media='all' />

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
