<?php
/*
 * The page template file.
 *
 */

get_header();

if (have_posts())
{
  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', 'page');
  }
}

get_footer(); 
