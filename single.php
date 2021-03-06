<?php declare(strict_types=1);
/*
 * Single post template
 *
 */

get_header();

if (have_posts())
{
  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', 'track');
    the_post_navigation(array(
      'prev_text' => '<b>&#10094;&#10094; Previous track</b><br>%title',
      'next_text' => '<b>Next track &#10095;&#10095;</b><br>%title',
    ));
  }
}

get_footer(); 
