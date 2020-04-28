<?php
/*
 * The 404 template file.
 *
 * @package Ultrafunk
 */

get_header();

?>

  <section id="primary" class="content-area">
    <main id="main" class="site-main">
  
    <?php
    get_template_part('template-parts/content', 'none');
    ?>
  
    </main><!-- #main -->
  </section><!-- .content-area -->

<?php

// get_sidebar();
get_footer(); 

?>
