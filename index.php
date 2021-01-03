<?php
/*
 * The main / index template file.
 *
 */

if (!defined('ABSPATH')) exit;

get_header();

if (have_posts())
{
  ?><track-layout><?php

  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', 'track');
  }

  ?></track-layout><?php
  
  \Ultrafunk\ThemeTags\content_pagination();
}
else
{
  get_template_part('template-parts/content', 'none');
}

get_footer(); 
