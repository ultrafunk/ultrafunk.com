<?php declare(strict_types=1);
/*
 * Footer template
 *
 */

?>

</main>

<footer id="site-footer">
  <div class="site-footer-container">
    <div class="site-info-1">
      <a href="/channels/">All Channels</a><br>
      <a href="/artists/">All Artists</a>
      <div class="footer-site-block">
        <a href="/about/">About</a><br>
        <a href="/help/">Help</a><br>
        <a href="/privacy-policy/">Privacy Policy</a><br>
        <a href="mailto:contact@ultrafunk.com">Contact</a><br>
        <a href="https://github.com/ultrafunk/">GitHub</a>
      </div>
      <div class="footer-settings-block">
        <a href="/settings/"><b><u>SETTINGS</u></b></a>
        <div class="footer-toggles">
          <a href="<?php echo \Ultrafunk\Globals\is_list_player() ? '/' : '/list/'; ?>" id="footer-player-toggle" title="Gallery or List Player">Player = <span class="player-gallery-list">...</span></a>
          <div id="footer-autoplay-toggle" title="Toggle Autoplay On / Off (shift + a)">Autoplay = <span class="autoplay-on-off">...</span></div>
          <div id="footer-crossfade-toggle" title="Toggle Auto Crossfade On / Off (x)">Auto Crossfade = <span class="crossfade-on-off">...</span></div>
          <div id="footer-site-theme-toggle" title="Light, Dark or Automatic theme (shift + t)">Theme = <span class="site-theme-light-dark-auto">...</span></div>
          <div id="footer-gallery-layout-toggle" title="Gallery Player: 1, 2 or 3 / 4 column layout (shift + l)">Gallery = <span class="gallery-layout-1x-2x-3x">...</span></div>
        </div>
      </div>
    </div>
    <div class="site-info-2">
      <a href="<?php echo \Ultrafunk\Globals\get_cached_home_url('/'); ?>" aria-label="Home"><img src="<?php echo esc_url(get_theme_mod('ultrafunk_footer_logo')); ?>" loading="lazy" alt=""></a>
    </div>
  </div>
</footer>

<div id="nav-menu-modal-overlay"></div>

</body>
</html>

<?php \Ultrafunk\ThemeTags\perf_results(); ?>
