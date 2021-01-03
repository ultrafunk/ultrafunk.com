<?php
/*
 * The search template file.
 *
 */

get_header();

if (have_posts())
{
  while (have_posts())
  {
    the_post();
    get_template_part('template-parts/content', (get_post_type() === 'post') ? 'track' : 'page');
  }
  
  \Ultrafunk\ThemeTags\content_pagination();
}
else
{
  get_template_part('template-parts/content', 'none');
}

get_footer(); 
