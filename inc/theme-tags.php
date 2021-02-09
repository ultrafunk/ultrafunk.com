<?php declare(strict_types=1);
/*
 * Custom tags for this theme
 *
 */


namespace Ultrafunk\ThemeTags;


use function Ultrafunk\Globals\ {
  console_log,
  is_termlist,
  is_shuffle,
  get_dev_prod_const,
  get_perf_data,
  get_request_params,
};

use function Ultrafunk\ThemeFunctions\ {
  get_prev_next_urls,
  get_title,
  get_shuffle_menu_item_url,
  get_shuffle_menu_item_title,
};


/**************************************************************************************************************************/


function get_user_layout_class()
{
  if (!is_singular() && !is_search() && !is_404())
  {
    global $wp_query;

    if (isset($wp_query) && ($wp_query->found_posts >= 3))
      return 'user-layout';
  }
}

function pre_wp_head()
{
  if (is_shuffle())
    echo '<meta name="robots" content="noindex">' . PHP_EOL;

  ?>
  <script>
    const siteTheme      = localStorage.getItem('UF_SITE_THEME');
    let   siteThemeClass = 'site-theme-light';

    if (siteTheme !== null)
      siteThemeClass = (siteTheme === 'dark') ? 'site-theme-dark' : 'site-theme-light';

    document.documentElement.classList.add(siteThemeClass);

    if ((window.innerWidth > 1100) && (document.documentElement.classList.contains('user-layout')))
    {
      const trackLayout      = localStorage.getItem('UF_TRACK_LAYOUT');
      let   trackLayoutClass = 'track-layout-3-column';

      if (trackLayout !== null)
      {
        if (trackLayout === 'list')
          trackLayoutClass = 'track-layout-list';
        else if (trackLayout === '2-column')
          trackLayoutClass = 'track-layout-2-column';
      }

      document.documentElement.classList.add(trackLayoutClass);
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> 
  <?php

  global $ultrafunk_is_prod_build, $ultrafunk_js_preload_chunk;

  if (!empty($ultrafunk_js_preload_chunk) && $ultrafunk_is_prod_build)
    echo '<link rel="preload" href="' . esc_url(get_template_directory_uri()) . $ultrafunk_js_preload_chunk . '" as="script" crossorigin>' . PHP_EOL;
}

function head()
{
  $meta_description = '<meta name="description" content="Ultrafunk is a free and open interactive playlist with carefully chosen and continually updated tracks rooted in Funk and other related genres you might like." />' . PHP_EOL;

  if (is_front_page() && !is_paged() && !is_shuffle())
    echo $meta_description;
  else if (get_the_ID() === get_dev_prod_const('page_about_id'))
    echo $meta_description;

  ?>
  <noscript><link rel="stylesheet" href="<?php echo esc_url(get_template_directory_uri()); ?>/inc/css/style-noscript.css" media="all" /></noscript>
  <?php

  if (WP_DEBUG)
  {
    ?>
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-116878-17"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-116878-17');
    </script>
    <?php
  }
  else
  {
    ?>
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-116878-16"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-116878-16');
    </script>
    <?php
  }
}

function body_attributes()
{
  global $wp_query;
  $track_count = 0;
  
  // 404 never has any posts / tracks
  if (isset($wp_query) && $wp_query->have_posts() && !is_404())
  {
    foreach ($wp_query->posts as $post)
    {
      if ($post->post_type === 'post')
        $track_count++;
    }
  }

  if (is_page())
    $classes[] = 'page-' . $wp_query->query_vars['pagename'];

  if (is_termlist() && !is_404())
    $classes[] = 'termlist';

  if ($track_count === 0)
    $classes[] = 'no-playback';
  else if ($track_count === 1)
    $classes[] = 'single-track';
  else if ($track_count > 1)
    $classes[] = 'multiple-tracks';

  body_class($classes);
  echo " data-track-count=\"$track_count\"";
}

function header_progress_controls()
{
  ?>
  <div id="progress-controls">
    <div class="seek-control state-disabled" title="Track progress / seek"></div>
    <div class="bar-control state-disabled"></div>
  </div>
  <?php
}

function header_site_branding()
{
  $nav_icons = get_nav_bar_icons();

  ?>
  <div class="site-branding">
    <?php echo $nav_icons['menu']; ?>
    <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Home"><img src="<?php echo wp_get_attachment_image_src(get_theme_mod('custom_logo'), 'full')[0]; ?>" alt=""></a>
    <?php echo $nav_icons['search']; ?>
  </div>
  <?php
}

function header_playback_controls()
{
  ?>
  <div id="playback-controls">
    <div class="details-control state-disabled" title="Single: Show current track&#010;Double: Toggle Fullscreen (f)"><span class="details-artist"></span><br><span class="details-title"></span></div>
    <div class="thumbnail-control state-disabled" title="Single: Show current track&#010;Double: Toggle Fullscreen (f)"><img src="<?php echo esc_url(get_template_directory_uri()); ?>/inc/img/thumbnail_placeholder.png" alt=""></div>
    <div class="timer-control state-disabled" title="Single: Toggle Autoplay (shift + a)"><span class="timer-position"></span><br><span class="timer-duration"></span></div>
    <div class="prev-control state-disabled" title="Previous track / seek (arrow left)"><i class="material-icons">skip_previous</i></div>
    <div class="play-pause-control state-disabled" title="Play / Pause (space)"><i class="material-icons">play_circle_filled</i></div>
    <div class="next-control state-disabled" title="Next track (arrow right)"><i class="material-icons">skip_next</i></div>
    <div class="shuffle-control state-disabled" title="<?php echo esc_attr(get_shuffle_menu_item_title()); ?>"><a href="<?php echo esc_url(get_shuffle_menu_item_url()); ?>"><i class="material-icons">shuffle</i></a></div>
    <div class="mute-control state-disabled" title="Mute / Unmute (m)"><i class="material-icons">volume_up</i></div>
  </div>
  <?php
}

function get_nav_bar_icons()
{
  $nav_icons['search'] = '<div class="nav-search-toggle" title="Show / Hide search (s)"><i class="material-icons">search</i></div>';
  $nav_icons['menu']   = '<div class="nav-menu-toggle" title="Toggle Channel menu (c)"><i class="material-icons">menu</i></div>';

  return $nav_icons;
}

function get_nav_bar_arrows()
{
  $prev_next_urls = get_prev_next_urls();
  
  if (array_filter($prev_next_urls))
  {
    if (!empty($prev_next_urls['prev']))
      $nav_arrows['back'] = '<a href="' . $prev_next_urls['prev'] . '" class="nav-bar-prev-link"><i class="material-icons nav-bar-arrow-back" title="Previous track / page (shift + arrow left)">arrow_backward</i></a>';
    else
      $nav_arrows['back'] = '<i class="material-icons nav-bar-arrow-back disbled">arrow_backward</i>';

    if (!empty($prev_next_urls['next']))
      $nav_arrows['fwd'] = '<a href="' . $prev_next_urls['next'] . '" class="nav-bar-next-link"><i class="material-icons nav-bar-arrow-fwd" title="Next track / page (shift + arrow right)">arrow_forward</i></a>';
    else
      $nav_arrows['fwd'] = '<i class="material-icons nav-bar-arrow-fwd disbled">arrow_forward</i>';
  }
  else
  {
    $nav_arrows['back'] = '<a href="" title="Go back" onclick="javascript:history.back();return false;" class="nav-bar-prev-link"><i class="material-icons nav-bar-arrow-back">arrow_backward</i></a>';
    $nav_arrows['fwd']  = '<i class="material-icons nav-bar-arrow-fwd disbled">arrow_forward</i>';
  }

  return $nav_arrows;
}

function header_nav_bars()
{
  $nav_icons  = get_nav_bar_icons();
  $nav_arrows = get_nav_bar_arrows();

  ?>
  <div class="nav-bar-container">
    <div class="nav-bar-arrows"><?php echo $nav_arrows['back'] . $nav_arrows['fwd']; ?></div>
    <?php nav_bar_title(); ?>
    <div class="nav-bar-icons"><?php echo $nav_icons['search'] . $nav_icons['menu']; ?></div>
  </div>
  <div class="nav-bar-container-mobile-top">
    <div class="nav-bar-arrow-single back"><?php echo $nav_arrows['back']; ?></div>
    <?php nav_bar_title(); ?>
    <div class="nav-bar-arrow-single fwd"><?php echo $nav_arrows['fwd']; ?></div>
  </div>
  <div class="nav-bar-container-mobile-up">
    <div class="nav-bar-up-left">
      <?php echo $nav_icons['menu'] ?>
      <div class="nav-bar-arrow-single"><?php echo $nav_arrows['back']; ?></div>
    </div>
    <?php nav_bar_title(); ?>
    <div class="nav-bar-up-right">
      <div class="nav-bar-arrow-single"><?php echo $nav_arrows['fwd']; ?></div>
      <?php echo $nav_icons['search'] ?>
    </div>
  </div>
  <?php
}

function get_pagednum()
{
  return (get_query_var('paged') ? get_query_var('paged') : 1);
}

function get_pagination($before = ' ( ', $separator = ' / ', $after = ' ) ')
{
  global $wp_query;
  $pagination = '';
  
  if (isset($wp_query) && ($wp_query->max_num_pages > 1))
    $pagination = $before . get_pagednum() . $separator . $wp_query->max_num_pages . $after;
  
  return $pagination;
}

function get_search_hits()
{
  global $wp_query;
    
  if (isset($wp_query) && ($wp_query->found_posts > 1))
  {
    if ($wp_query->max_num_pages <= 1)
      return ' (' . $wp_query->found_posts . ' hits)';
    else
      return ' (' . $wp_query->found_posts . ' hits - page ' . get_pagination('', ' of ', ')');
  }

  return '';
}

function nav_bar_title()
{
  $prefix     = is_shuffle() ? '<b>Shuffle: </b>' : '<b>Channel: </b>';
  $title      = esc_html(get_title());
  $pagination = esc_html(get_pagination());

  if (is_single())
  {
    $prefix     = '<b>Previous</b> or <b>Next</b> track';
    $title      = '';
    $pagination = '';
  }
  else if (is_page())
  {
    $prefix     = '<span class="go-back-to"><b>Go Back: </b><span class="go-back-title"></span></span>';
    $title      = '';
    $pagination = '';
  }
  else if (is_termlist() && !is_404())
  {
    $params     = get_request_params();
    $prefix     = $params['is_artists'] ? '<b>All Artists</b>' : '<b>All Channels</b>';
    $title      = '';
    $pagination = '';
  
    if ($params['max_pages'] > 1)
      $prefix = $prefix . ' ( ' . $params['current_page'] . ' / ' . $params['max_pages'] . ' )';
    else if (isset($params['first_letter']))
      $prefix = '<b>Artists: </b><span class="normal-text">' . strtoupper($params['first_letter']) . '</span> ( ' . $params['term_count'] . ' found )';
    else
      $prefix = '<span class="go-back-to"><b>Go Back: </b><span class="go-back-title"></span></span>';
  }
  else if (is_404())
  {
    $prefix     = '<b>Error / 404: </b>';
    $pagination = '';
  }
  else if (is_search())
  {
    $prefix     = '<b>Search: </b>';
    $title      = get_search_query();
    $pagination = esc_html(get_search_hits());
  }
  else if (is_tag())
  {
    $prefix = '<b>Artist: </b>';
  }

  echo '<div class="nav-bar-title">' . $prefix . $title . $pagination . '</div>';
}

function content_pagination()
{
  $prefix = is_shuffle() ? '<b>Shuffle: </b>' : '<b>Channel: </b>';
  $title  = esc_html(get_title());
  
  if (is_search())
  {
    $prefix = '<b>Search results: </b>';
    $title  = get_search_query();
  }
  else if (is_tag())
  {
    $prefix = '<b>Artist: </b>';
  }

  $title_pagination = get_the_posts_pagination(array(
    'mid_size'           => 4,
    'screen_reader_text' => ' ',
    'prev_text'          => '&#10094;&#10094; Prev.',
    'next_text'          => 'Next &#10095;&#10095;',
    'type'               => 'list',
  ));
  
  $title_pagination = str_ireplace('<h2 class="screen-reader-text">', sprintf('<h2 class="screen-reader-text">%s<span class="light-text">%s</span>', $prefix, $title), $title_pagination);
  
  echo $title_pagination;
}

function entry_title()
{
  if (is_singular())
    esc_html(the_title('<h2 class="entry-title">', '</h2>'));
  else
    esc_html(the_title(sprintf('<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>'));
}

function meta_controls()
{
  ?>
  <div class="entry-meta-controls">
    <div class="track-share-control"><span class="material-icons" title="Share track / Play On" data-artist-track-title="<?php echo esc_html(get_the_title()); ?>" data-track-url="<?php echo esc_url(get_permalink()); ?>">share</span></div>
    <div class="crossfade-controls">
      <div class="preset-control state-disabled"></div>
      <div class="fadeto-control state-disabled"><img src="<?php echo esc_url(get_template_directory_uri()); ?>/inc/img/crossfade_icon.png" alt="" title="Crossfade to this track"></div>
    </div>
  </div>
  <?php
}

function content_excerpt()
{
  the_excerpt();

  ?>
  <p><a class="show-more" href="<?php echo esc_url(get_permalink()); ?>">Show More &#10095;&#10095;</a></p>
  <?php
}

function intro_banner()
{
  $property    = '';
  $content     = '';
  $show_banner = false;

  if (is_front_page() && !is_paged() && !is_shuffle())
  {
    $property    = 'showFrontpageIntro';
    $post        = get_post(get_dev_prod_const('block_frontpage_intro_id'));
    $content     = apply_filters('the_content', wp_kses_post($post->post_content));
    $show_banner = true;
  }
  else if (is_category('premium') && have_posts() && !is_paged())
  {
    $property    = 'showPremiumIntro';
    $post        = get_post(get_dev_prod_const('block_premium_intro_id'));
    $content     = apply_filters('the_content', wp_kses_post($post->post_content));
    $show_banner = true;
  }
  else if (is_category('promo') && have_posts() && !is_paged())
  {
    $property    = 'showPromoIntro';
    $post        = get_post(get_dev_prod_const('block_promo_intro_id'));
    $content     = apply_filters('the_content', wp_kses_post($post->post_content));
    $show_banner = true;
  }

  if ($show_banner)
  {
    ?>
    <script>const bannerProperty = '<?php echo $property; ?>';</script>
    <div id="intro-banner">
      <div class="intro-banner-container">
        <?php echo $content; ?>
        <div class="intro-banner-close-button">
          Close <span class="light-text">(and don't show again)</span>
        </div>
      </div>
    </div>
    <?php
  }
}

function content_widgets()
{
  if (is_active_sidebar('content-widgets-1'))
  {
    ?>
    <aside class="widget-area" role="complementary">
      <?php
      if (is_active_sidebar('content-widgets-1'))
      {
        ?>
        <div class="widget-column content-widget-1">
          <?php dynamic_sidebar('content-widgets-1'); ?>
        </div>
        <?php
      }
      ?>
    </aside><!-- .widget-area -->
    <?php
  }
}

function perf_results()
{
  global $ultrafunk_is_prod_build;
  $perf_data = get_perf_data();

  if ($perf_data['display_perf_results'])
  {
    $results = ($ultrafunk_is_prod_build ? 'PROD - ' : 'DEV - ') . get_num_queries() . ' queries in ' . timer_stop(0) . ' seconds';

    if (is_shuffle())
      $results .= ' - cRndTrans: ' . $perf_data['create_rnd_transient'] . ' ms - gRndTrans: ' . $perf_data['get_rnd_transient'] . ' ms';

    echo '<!-- ' . esc_html($results) . ' -->';
  }
}

