<?php
/*
 * The page-settings template file.
 *
 * Template Name: Settings
 * 
 */

get_header();

$version      = \Ultrafunk\Globals\get_version();
$template_uri = esc_url(get_template_directory_uri());

?>
<script type="module"   src='<?php echo $template_uri . '/js/src/common/settings-ui.js?ver='  . $version; ?>'></script>
<link rel="stylesheet" href='<?php echo $template_uri . '/js/src/common/settings-ui.css?ver=' . $version; ?>' media='all' />
<?php

if (have_posts())
{
  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', 'settings');
  }
}

get_footer(); 
