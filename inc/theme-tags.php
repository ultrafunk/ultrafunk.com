<?php declare(strict_types=1);
/*
 * Custom tags for this theme
 *
 */


namespace Ultrafunk\ThemeTags;


use function Ultrafunk\Globals\ {
  console_log,
  is_termlist,
  is_list_player,
  is_shuffle,
  get_dev_prod_env,
  get_perf_data,
  get_request_params,
  get_navigation_vars,
  get_cached_home_url,
};

use function Ultrafunk\ThemeFunctions\ {
  get_title,
  get_shuffle_path,
  get_shuffle_title,
};


/**************************************************************************************************************************/


function get_user_layout_class() : string
{
  if (!is_singular() && !is_search() && !is_404())
  {
    global $wp_query;

    if (isset($wp_query) && ($wp_query->found_posts >= 3))
      return 'user-layout';
  }

  return '';
}

function pre_wp_head() : void
{
  ?>
  <script>
    const siteTheme      = localStorage.getItem('UF_SITE_THEME');
    let   siteThemeClass = 'site-theme-light';

    if (siteTheme !== null)
      siteThemeClass = (siteTheme === 'dark') ? 'site-theme-dark' : 'site-theme-light';

    document.documentElement.classList.add(siteThemeClass);

    if ((window.innerWidth > 1100) && (document.documentElement.classList.contains('user-layout')))
    {
      const galleryLayout      = localStorage.getItem('UF_GALLERY_LAYOUT');
      let   galleryLayoutClass = 'gallery-layout-3-column';

      if (galleryLayout !== null)
      {
        if (galleryLayout === '1-column')
          galleryLayoutClass = 'gallery-layout-1-column';
        else if (galleryLayout === '2-column')
          galleryLayoutClass = 'gallery-layout-2-column';
      }

      document.documentElement.classList.add(galleryLayoutClass);
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> 
  <?php

  global $ultrafunk_is_prod_build, $ultrafunk_js_preload_chunk;

  if (!empty($ultrafunk_js_preload_chunk) && $ultrafunk_is_prod_build)
    echo '<link rel="modulepreload" href="' . esc_url(get_template_directory_uri()) . $ultrafunk_js_preload_chunk . '" as="script" crossorigin>' . PHP_EOL;
}

function head() : void
{
  $meta_description = '<meta name="description" content="Ultrafunk is a free and open interactive playlist with carefully chosen and continually updated tracks rooted in Funk and other related genres you might like." />' . PHP_EOL;

  if (is_front_page() && !is_paged() && !is_shuffle())
    echo $meta_description;
  else if (get_the_ID() === get_dev_prod_env('page_about_id'))
    echo $meta_description;

  if (!is_page() && !is_list_player() && !is_termlist())
    echo '<script defer src="https://w.soundcloud.com/player/api.js"></script>' . PHP_EOL;

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

function body_attributes() : void
{
  global $wp_query;
  $gallery_track_count = 0;
  
  // 404 never has any posts / tracks
  if (isset($wp_query) && $wp_query->have_posts() && !is_404())
  {
    foreach($wp_query->posts as $post)
    {
      if ($post->post_type === 'uf_track')
        $gallery_track_count++;
    }
  }

  if (is_page())
    $classes[] = 'page-' . $wp_query->query_vars['pagename'];

  if (is_termlist())
    $classes[] = 'termlist';

  if (is_list_player())
    $classes[] = 'list-player';

  if (($gallery_track_count === 0) && !is_list_player())
    $classes[] = 'no-playback';
  else if ($gallery_track_count === 1)
    $classes[] = 'single-track';
  else if ($gallery_track_count > 1)
    $classes[] = 'multiple-tracks';

  body_class($classes);

  if ($gallery_track_count > 0)
    echo " data-gallery-track-count=\"$gallery_track_count\"";
}

function header_progress_controls() : void
{
  ?>
  <div id="progress-controls">
    <div class="progress-seek-control state-disabled" title="Track progress / seek"></div>
    <div class="progress-bar-control state-disabled"></div>
  </div>
  <?php
}

function header_site_branding() : void
{
  $nav_icons = get_nav_bar_icons();

  ?>
  <div class="site-branding">
    <?php echo $nav_icons['menu']; ?>
    <a href="<?php echo \Ultrafunk\Globals\is_list_player() ? get_cached_home_url('/list/') : get_cached_home_url('/'); ?>" aria-label="Home">
      <img src="<?php echo wp_get_attachment_image_src(get_theme_mod('custom_logo'), 'full')[0]; ?>" alt="">
    </a>
    <?php echo $nav_icons['search']; ?>
  </div>
  <?php
}

function header_playback_controls() : void
{
  ?>
  <div id="playback-controls">
    <div class="playback-details-control state-disabled" title="Single: Show current track&#010;Double: Toggle Fullscreen (f)">
      <span class="playback-details-artist"></span><br><span class="playback-details-title"></span>
    </div>
    <div class="playback-thumbnail-control state-disabled" title="Single: Show current track&#010;Double: Toggle Fullscreen (f)">
      <img src="<?php echo esc_url(get_template_directory_uri()); ?>/inc/img/thumbnail_placeholder.png" alt="">
    </div>
    <div class="playback-timer-control state-disabled" title="Single: Toggle Autoplay (shift + a)">
      <span class="playback-timer-position"></span><br><span class="playback-timer-duration"></span>
    </div>
    <div class="playback-prev-control state-disabled" title="Previous track / seek (arrow left)"><span class="material-icons">skip_previous</span></div>
    <div class="playback-play-pause-control state-disabled" title="Play / Pause (space)"><span class="material-icons">play_circle_filled</span></div>
    <div class="playback-next-control state-disabled" title="Next track (arrow right)"><span class="material-icons">skip_next</span></div>
    <div class="playback-repeat-control state-disabled" title="Repeat off" data-repeat-mode="0"><span class="material-icons">repeat</span></div>
    <div class="playback-shuffle-control state-disabled" title="<?php echo esc_attr(get_shuffle_title()); ?>">
      <span class="material-icons" data-shuffle-path="<?php echo esc_url(get_shuffle_path()); ?>">shuffle</span>
    </div>
    <div class="playback-mute-control state-disabled" title="Mute / Unmute (m)"><span class="material-icons">volume_up</span></div>
  </div>
  <?php
}

function get_nav_bar_icons() : array
{
  $nav_icons['search'] = '<div class="nav-search-toggle" title="Show / Hide search (s)"><span class="material-icons">search</span></div>';
  $nav_icons['menu']   = '<div class="nav-menu-toggle" title="Toggle Channel menu (c)"><span class="material-icons">menu</span></div>';

  return $nav_icons;
}

function get_nav_bar_arrows() : array
{
  $nav_vars = get_navigation_vars();
  
  if (($nav_vars['prev'] !== null) || ($nav_vars['next'] !== null))
  {
    if ($nav_vars['prev'] !== null)
      $nav_arrows['back'] = '<a href="' . $nav_vars['prev'] . '" class="nav-bar-prev-link"><span class="material-icons nav-bar-arrow-back" title="Previous track / page (shift + arrow left)">arrow_backward</span></a>';
    else
      $nav_arrows['back'] = '<span class="material-icons nav-bar-arrow-back disbled">arrow_backward</span>';

    if ($nav_vars['next'] !== null)
      $nav_arrows['fwd'] = '<a href="' . $nav_vars['next'] . '" class="nav-bar-next-link"><span class="material-icons nav-bar-arrow-fwd" title="Next track / page (shift + arrow right)">arrow_forward</span></a>';
    else
      $nav_arrows['fwd'] = '<span class="material-icons nav-bar-arrow-fwd disbled">arrow_forward</span>';
  }
  else
  {
    $nav_arrows['back'] = '<a href="" title="Go back" onclick="javascript:history.back();return false;" class="nav-bar-prev-link"><span class="material-icons nav-bar-arrow-back">arrow_backward</span></a>';
    $nav_arrows['fwd']  = '<span class="material-icons nav-bar-arrow-fwd disbled">arrow_forward</span>';
  }

  return $nav_arrows;
}

function header_nav_bars() : void
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

function get_wp_pagination(string $before = ' ( ', string $separator = ' / ', string $after = ' ) ') : string
{
  global $wp_query;
  $pagination = '';
  $pagednum   = (get_query_var('paged') ? get_query_var('paged') : 1);
  
  if (isset($wp_query) && ($wp_query->max_num_pages > 1))
    $pagination = $before . $pagednum . $separator . $wp_query->max_num_pages . $after;
  
  return $pagination;
}

function get_search_hits() : string
{
  global $wp_query;
    
  if (isset($wp_query) && ($wp_query->found_posts > 1))
  {
    if ($wp_query->max_num_pages <= 1)
      return ' (' . $wp_query->found_posts . ' hits)';
    else
      return ' (' . $wp_query->found_posts . ' hits - page ' . get_wp_pagination('', ' of ', ')');
  }

  return '';
}

function nav_bar_title() : void
{
  $prefix     = is_shuffle() ? '<b>Shuffle: </b>' : '<b>Channel: </b>';
  $title      = esc_html(get_title());
  $pagination = esc_html(get_wp_pagination());
  $params     = get_request_params();

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
  else if (is_termlist())
  {
    $prefix     = $params['is_termlist_artists'] ? '<b>All Artists</b>' : '<b>All Channels</b>';
    $title      = '';
    $pagination = '';
  
    if ($params['max_pages'] > 1)
      $prefix = $prefix . ' ( ' . $params['current_page'] . ' / ' . $params['max_pages'] . ' )';
    else if (isset($params['first_letter']))
      $prefix = '<b>Artists: </b><span class="normal-text">' . strtoupper($params['first_letter']) . '</span> ( ' . $params['item_count'] . ' found )';
    else
      $prefix = '<span class="go-back-to"><b>Go Back: </b><span class="go-back-title"></span></span>';
  }
  else if (is_list_player())
  {
    $prefix     = '<b>' . $params['title_parts']['prefix'] . ': </b>';
    $pagination = ($params['max_pages'] > 1) ? ' ( ' . $params['current_page'] . ' / ' . $params['max_pages'] . ' )' : '';
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
  else if (is_tax())
  {
    $prefix = is_tax('uf_channel') ? '<b>Channel: </b>' : '<b>Artist: </b>';
  }

  echo '<div class="nav-bar-title">' . $prefix . $title . $pagination . '</div>';
}

function content_pagination() : void
{
  $prefix = is_shuffle() ? 'Shuffle: ' : 'Channel: ';
  $title  = esc_html(get_title());
  
  if (is_search())
  {
    $prefix = 'Search results: ';
    $title  = get_search_query();
  }
  else if (is_tax())
  {
    $prefix = is_tax('uf_channel') ? '<b>Channel: </b>' : '<b>Artist: </b>';
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

function entry_title() : void
{
  if (is_singular())
    esc_html(the_title('<h2 class="entry-title">', '</h2>'));
  else
    esc_html(the_title(sprintf('<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>'));
}

function meta_controls(object $post) : void
{
  ?>
  <div class="entry-meta-controls">
    <div class="track-share-control">
      <span class="material-icons" title="Share track / Play On"
        data-track-artist="<?php echo esc_html($post->track_artist); ?>"
        data-track-title="<?php echo esc_html($post->track_title); ?>"
        data-track-url="<?php echo esc_url(get_permalink()); ?>">share</span>
    </div>
    <div class="crossfade-controls">
      <div class="crossfade-preset-control state-disabled"></div>
      <div class="crossfade-fadeto-control state-disabled">
        <img src="<?php echo esc_url(get_template_directory_uri()); ?>/inc/img/crossfade_icon.png" alt="" title="Crossfade to this track">
      </div>
    </div>
  </div>
  <?php
}

function content_excerpt() : void
{
  the_excerpt();

  ?>
  <p><a class="show-more" href="<?php echo esc_url(get_permalink()); ?>">Show More &#10095;&#10095;</a></p>
  <?php
}

function intro_banner() : void
{
  // Exit early since banners are not shown on paginated content
  if (is_paged())
    return;

  $property    = '';
  $content     = '';
  $show_banner = false;

  if (is_front_page() && !is_shuffle())
  {
    $property    = 'showFrontpageIntro';
    $post        = get_post(get_dev_prod_env('block_frontpage_intro_id'));
    $content     = apply_filters('the_content', wp_kses_post($post->post_content));
    $show_banner = true;
  }
  else if (is_tax('uf_channel', 'premium') && have_posts())
  {
    $property    = 'showPremiumIntro';
    $post        = get_post(get_dev_prod_env('block_premium_intro_id'));
    $content     = apply_filters('the_content', wp_kses_post($post->post_content));
    $show_banner = true;
  }
  else if (is_tax('uf_channel', 'promo') && have_posts())
  {
    $property    = 'showPromoIntro';
    $post        = get_post(get_dev_prod_env('block_promo_intro_id'));
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

function content_widgets() : void
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
    </aside>
    <?php
  }
}

function perf_results() : void
{
  global $ultrafunk_is_prod_build;
  $perf_data = get_perf_data();

  if ($perf_data['display_perf_results'])
  {
    $results = ($ultrafunk_is_prod_build ? 'PROD - ' : 'DEV - ') . get_num_queries() . ' queries in ' . timer_stop(0) . ' seconds';

    if ($perf_data['time_start'] !== 0)
      $results .= ' - cRnd: ' . $perf_data['create_rnd_transient'] . ' ms - gRnd: ' . $perf_data['get_rnd_transient'] . ' ms';

    echo '<!-- ' . esc_html($results) . ' -->';
  }
}

