<?php
/*
 * The header for our theme
 *
 * @package Ultrafunk
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
<div id="page" class="site">
  <a class="skip-link screen-reader-text" href="#content"><?php esc_html_e('Skip to content', 'ultrafunk'); ?></a>
  <header id="masthead" class="site-header">
    <?php ultrafunk\nav_progress_bar(); ?>
    <div class="site-header-container">
      <?php ultrafunk\nav_search(); ?>
      <div class="site-branding-flex-container">
        <div class="site-branding">
          <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><img src="<?php echo esc_url(get_template_directory_uri());?>/img/ultrafunk_logo_06.png" alt=""></a>
        </div><!-- .site-branding -->
        <?php ultrafunk\nav_playback_controls(); ?>
      </div>
      <nav id="site-navigation" class="main-navigation">
        <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false"><?php esc_html_e('Primary Menu', 'ultrafunk'); ?></button>
        <div class="main-navigation-menu-outer">
          <div class="main-navigation-menu-inner">
            <?php wp_nav_menu(array('theme_location' => 'primary-menu')); ?>
          </div>
          <?php ultrafunk\nav_items('main-navigation-nav-items'); ?>
        </div>
        <div class="sub-navigation-menu-outer">
          <?php ultrafunk\nav_pagination(); ?>
          <div class="sub-navigation-details">
            <?php ultrafunk\nav_title(); ?>
          </div>
          <?php ultrafunk\nav_items('sub-navigation-nav-items'); ?>
        </div>
      </nav><!-- #site-navigation -->
    </div><!-- .header-wrapper -->
  </header><!-- #masthead -->
  
  <?php ultrafunk\intro_banner(); ?>

  <div id="content" class="site-content">
