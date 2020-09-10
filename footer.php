<?php
/*
 * The template for displaying the footer
 *
 */

?>

</main><!-- #site-content -->

<footer id="site-footer">
  <div class="site-footer-container">
    <div class="site-info-1">
      <a href="<?php echo esc_url(home_url()); ?>/about/">About</a><br>
      <a href="<?php echo esc_url(home_url()); ?>/help/">Help</a><br>
      <a href="https://old.ultrafunk.com">Previous Projects</a><br>
      <a href="https://old.ultrafunk.com/about/">Our History</a><br>
      <a href="<?php echo esc_url(home_url()); ?>/privacy-policy/">Privacy Policy</a><br>
      <a href="https://github.com/ultrafunk/">GitHub</a><br>
      <a href="mailto:contact@ultrafunk.com">Contact</a>
      <div class="footer-settings-block">
        <a href="<?php echo esc_url(home_url()); ?>/settings/"><b><u>SETTINGS</u></b></a>
        <div class="footer-toggles">
          <a href="#" id="footer-autoplay-toggle" title="Toggle Autoplay On / Off (shift + F12)">Autoplay = <span class="autoplay-on-off">On</span></a>
          <a href="#" id="footer-crossfade-toggle" title="Toggle Auto Crossfade On / Off (x)">Auto Crossfade = <span class="crossfade-on-off">Off</span></a>
          <a href="#" id="footer-site-theme-toggle" title="Light, Dark or Automatic (default) theme">Theme = <span class="site-theme-light-dark-auto">Auto</span></a>
          <a href="#" id="footer-track-layout-toggle" title="List, 2 or 3 / 4 Column (default) track layout">Layout = <span class="track-layout-list-2x-3x">3 / 4 Column</span></a>
        </div>
      </div>
    </div>
    <div class="site-info-2">
      <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><img src="<?php echo esc_url(get_theme_mod('ultrafunk_footer_logo')); ?>" alt=""></a>
    </div>
  </div><!-- .site-footer-container -->
</footer><!-- #site-footer -->

<?php wp_footer(); ?>

<div id="nav-menu-modal-overlay"></div>

</body>
</html>

<?php \Ultrafunk\ThemeTags\perf_results(); ?>
