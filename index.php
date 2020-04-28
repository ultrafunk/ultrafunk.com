<?php
/*
 * The main / index template file.
 *
 * @package Ultrafunk
 */

if (!defined('ABSPATH')) exit;

get_header();

?>

  <section id="primary" class="content-area">
    <main id="main" class="site-main">
  
    <?php
    \Ultrafunk\ThemeTags\index_title();
    
    if (have_posts())
    {
      while (have_posts())
      {
        the_post();

        if ('page' === get_post_type())
          get_template_part('template-parts/content', 'page');
        else
          get_template_part('template-parts/content');
      }
      
      \Ultrafunk\ThemeTags\footer_title();
    }
    else
    {
      get_template_part('template-parts/content', 'none');
    }
    ?>
  
    </main><!-- #main -->
  </section><!-- .content-area -->

<?php

// get_sidebar();
get_footer(); 

?>
