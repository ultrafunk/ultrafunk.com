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
    global $post;
    get_template_part('template-parts/content', ($post->post_name === 'settings') ? 'settings' : 'page');
  }
}

get_footer(); 
