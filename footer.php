<?php
/*
 * The template for displaying the footer
 *
 * @package Ultrafunk
 */

?>

  </div><!-- #content -->

  <footer id="colophon" class="site-footer">
    <div class="site-footer-container">
      <div class="site-info-1">
        <a href="<?php echo esc_url(home_url()); ?>/about/">About</a><br>
        <a href="<?php echo esc_url(home_url()); ?>/help/">Help</a><br>
        <a href="https://old.ultrafunk.com">Previous Projects</a><br>
        <a href="https://old.ultrafunk.com/about/">Our History</a><br>
        <a href="<?php echo esc_url(home_url()); ?>/privacy-policy/">Privacy Policy</a><br>
        <a href="mailto:contact@ultrafunk.com">Contact</a>
        <div class="footer-toggles">
          <a href="#" id="footer-autoplay-toggle" title="Toggle AutoPlay ON / OFF">AutoPlay = <span class="autoplay-on-off">ON</span></a>
          <a href="#" id="footer-theme-toggle" title="Light, Dark or Automatic (default) theme">Theme = <span class="theme-light-dark-auto">AUTO</span></a>
        </div>
      </div>
      <div class="site-info-2">
        <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><img src="<?php echo esc_url(get_template_directory_uri());?>/img/ultrafunk_logo_light_07.png" alt=""></a>
      </div>
    </div><!-- .footer-wrapper -->
  </footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>

<?php \Ultrafunk\ThemeTags\perf_results(); ?>
