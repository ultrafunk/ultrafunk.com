<?php
/*
 * The header for our theme
 *
 */


use \Ultrafunk\ThemeTags as ultrafunk;


?>
<!doctype html>
<html <?php language_attributes(); ?>>
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
  <?php ultrafunk\nav_progress_controls(); ?>
  <div class="site-header-container">
    <?php ultrafunk\nav_search(); ?>
    <div class="site-branding-container">
      <div class="site-branding">
        <div class="nav-menu-toggle" title="Toggle Channel menu (c)"><i class="material-icons">menu</i></div>
        <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><?php ultrafunk\header_logo(); ?></a>
        <div class="nav-search-toggle" title="Show / Hide search (s)"><i class="material-icons">search</i></div>
      </div>
      <?php ultrafunk\nav_playback_controls(); ?>
    </div>
    <nav id="site-navigation" class="main-navigation">
      <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false"><?php esc_html_e('Primary Menu', 'ultrafunk'); ?></button>
      <?php ultrafunk\nav_bar() ?>
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
