<?php
/*
 * The page template file.
 *
 */

get_header();

?>

  <section id="primary" class="content-area">
    <main id="main" class="site-main">
  
    <?php
    if (have_posts())
    {
      while (have_posts())
      {
        the_post();
        get_template_part('template-parts/content', 'page');
      }
    }
    ?>
  
    </main><!-- #main -->
  </section><!-- .content-area -->

<?php

// get_sidebar();
get_footer(); 

?>
