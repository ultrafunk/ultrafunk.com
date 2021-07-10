<?php declare(strict_types=1);
/*
 * Main / index template
 *
 */

if (!defined('ABSPATH')) exit;

get_header();

if (have_posts())
{
  ?><gallery-layout><?php

  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', 'track');
  }

  ?></gallery-layout><?php
  
  \Ultrafunk\ThemeTags\content_pagination();
}
else
{
  get_template_part('template-parts/content', 'none');
}

get_footer(); 
