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
    $template_name = 'page';

    switch($post->post_name)
    {
      case 'artists':
      case 'channels':
      case 'settings':
        $template_name = $post->post_name;
        break;
    }

    get_template_part('template-parts/content', $template_name);
  }
}

get_footer(); 
