<?php
/*
 * The singular template file.
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
        get_template_part('template-parts/content');
        the_post_navigation(array(
          'prev_text' => '<b>&#10094;&#10094; Previous track</b><br>%title',
          'next_text' => '<b>Next track &#10095;&#10095;</b><br>%title',
        ));
      }
    }
    ?>
  
    </main><!-- #main -->
  </section><!-- .content-area -->

<?php

// get_sidebar();
get_footer(); 

?>
