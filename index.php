<?php
/*
 * The main / index template file.
 *
 */

if (!defined('ABSPATH')) exit;

get_header();

/*
\Ultrafunk\ThemeTags\index_title();
*/

if (have_posts())
{
  ?><div id="track-layout"><?php

  while (have_posts())
  {
    the_post();

    if ('page' === get_post_type())
      get_template_part('template-parts/content', 'page');
    else
      get_template_part('template-parts/content');
  }

  ?></div><!-- #track-layout --><?php
  
  \Ultrafunk\ThemeTags\content_nav_title();
}
else
{
  get_template_part('template-parts/content', 'none');
}

get_footer(); 
