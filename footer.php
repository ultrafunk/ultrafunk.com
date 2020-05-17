<?php
/*
 * The template for displaying the footer
 *
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
        <a href="https://github.com/ultrafunk/">GitHub</a><br>
        <a href="mailto:contact@ultrafunk.com">Contact</a>
        <div class="footer-toggles">
          <a href="#" id="footer-autoplay-toggle" title="Toggle AutoPlay ON / OFF (shift + F12)">AutoPlay = <span class="autoplay-on-off">On</span></a>
          <a href="#" id="footer-site-theme-toggle" title="Light, Dark or Automatic (default) theme">Theme = <span class="site-theme-light-dark-auto">Auto</span></a>
          <a href="#" id="footer-track-layout-toggle" title="List, 2 or 3 column (default) track layout">Track Layout = <span class="track-layout-list-2x-3x">3 Column</span></a>
        </div>
      </div>
      <div class="site-info-2">
        <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><?php \Ultrafunk\ThemeTags\footer_logo(); ?></a>
      </div>
    </div><!-- .footer-wrapper -->
  </footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>

<?php \Ultrafunk\ThemeTags\perf_results(); ?>
