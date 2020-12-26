<?php
/*
 * The header for our theme
 *
 */


use \Ultrafunk\ThemeTags as ultrafunk;


?>
<!doctype html>
<html <?php language_attributes(); ?> class="<?php echo ultrafunk\get_user_layout_class(); ?>">
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="profile" href="https://gmpg.org/xfn/11">
  <?php
  ultrafunk\pre_wp_head();
  wp_head();
  ultrafunk\head();
  ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link screen-reader-text" href="#site-content"><?php esc_html_e('Skip to content', 'ultrafunk'); ?></a>
<header id="site-header" class="hide-nav-menu">
  <?php ultrafunk\header_progress_controls(); ?>
  <div class="site-header-container">
    <div id="search-container"><?php get_search_form(); ?></div>
    <div class="site-branding-container">
      <?php
      ultrafunk\header_site_branding();
      ultrafunk\header_playback_controls();
      ?>
    </div>
    <nav id="site-navigation" class="main-navigation">
      <?php ultrafunk\header_nav_bars() ?>
      <div class="nav-menu-outer">
        <div class="nav-menu-inner">
          <?php wp_nav_menu(array('theme_location' => 'primary-menu')); ?>
        </div>
      </div>
    </nav><!-- #site-navigation -->
  </div><!-- .site-header-container -->
</header><!-- #site-header -->

<?php ultrafunk\intro_banner(); ?>

<main id="site-content">
