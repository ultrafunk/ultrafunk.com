<?php
/*
 * Custom tags for this theme
 *
 */


namespace Ultrafunk\ThemeTags;


use function Ultrafunk\Globals\ { get_version, is_shuffle, get_perf_data };
use function Ultrafunk\ThemeFunctions\ {
  get_prev_next_urls,
  get_title,
  get_shuffle_menu_item_url,
  get_shuffle_menu_item_title,
};


function pre_wp_head()
{
  $version      = get_version();
  $template_uri = esc_url(get_template_directory_uri());

  ?>
  <script>
    const siteTheme        = localStorage.getItem('UF_SITE_THEME');
    let   siteThemeClass   = 'site-theme-light';
    const trackLayout      = localStorage.getItem('UF_TRACK_LAYOUT');
    let   trackLayoutClass = 'track-layout-3-column';

    if (siteTheme !== null)
      siteThemeClass = (siteTheme === 'dark') ? 'site-theme-dark' : 'site-theme-light';

    document.documentElement.classList.add(siteThemeClass);

    if (trackLayout !== null)
    {
      if (trackLayout === 'list')
        trackLayoutClass = 'track-layout-list';
      else if (trackLayout === '2-column')
        trackLayoutClass = 'track-layout-2-column';
    }

    if (window.innerWidth > 1100)
      document.documentElement.classList.add(trackLayoutClass);
  </script>
  <link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://s.ytimg.com" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/common/debuglogger.js?ver='         . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/common/storage.js?ver='             . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/common/utils.js?ver='               . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/playback/eventlogger.js?ver='       . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/playback/mediaplayer.js?ver='       . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/playback/playback-controls.js?ver=' . $version; ?>" as="script" crossorigin>
  <link rel="preload" href="<?php echo $template_uri . '/js/playback/playback.js?ver='          . $version; ?>" as="script" crossorigin>
  <?php
}

function head()
{
  if (is_front_page() && !is_paged() && !is_shuffle())
  {
    ?>
    <meta name="description" content="Ultrafunk is a free and open interactive playlist with carefully chosen and continually updated tracks rooted in Funk and other related genres you might like." />
    <?php
  }

  ?>
  <noscript><link rel="stylesheet" href="<?php echo esc_url(get_template_directory_uri()); ?>/style-noscript.css" media="all" /></noscript>
  <?php

  if (true === WP_DEBUG)
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

function header_logo()
{
  ?>
  <img src="<?php echo wp_get_attachment_image_src(get_theme_mod('custom_logo'), 'full')[0]; ?>" alt="">
  <?php
}

function footer_logo()
{
  ?>
  <img src="<?php echo get_theme_mod('ultrafunk_footer_logo'); ?>" alt="">
  <?php
}

function nav_progress_controls()
{
  ?>
  <div id="progress-controls">
    <div class="seek-control state-disabled" title="Track progress / seek"></div>
    <div class="bar-control state-disabled"></div>
  </div>
  <?php
}

function nav_playback_controls()
{
  ?>
  <div id="playback-controls">
    <div class="details-control state-disabled" title="Current track"><span class="details-artist"></span><br><span class="details-title"></span></div>
    <div class="thumbnail-control state-disabled" title="Current track"><img src="<?php echo esc_url(get_template_directory_uri()); ?>/img/thumbnail_placeholder.png" alt=""></div>
    <div class="timer-control state-disabled" title="Track position &amp; duration"><span class="timer-position"></span><br><span class="timer-duration"></span></div>
    <div class="prev-control state-disabled" title="Previous track / seek (arrow left)"><i class="material-icons">skip_previous</i></div>
    <div class="play-pause-control state-disabled" title="Play / Pause (space)"><i class="material-icons">play_circle_filled</i></div>
    <div class="next-control state-disabled" title="Next track (arrow right)"><i class="material-icons">skip_next</i></div>
    <div class="shuffle-control state-disabled" title="<?php echo esc_attr(get_shuffle_menu_item_title()); ?>"><a href="<?php echo esc_url(get_shuffle_menu_item_url()); ?>"><i class="material-icons">shuffle</i></a></div>
    <div class="mute-control state-disabled" title="Mute / Unmute (m)"><i class="material-icons">volume_up</i></div>
  </div>
  <?php
}

function nav_search()
{
  ?>
  <div id="search-container"><?php get_search_form(); ?></div>
  <?php
}

function nav_items($class)
{
  ?>
  <div class="<?php echo $class; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>">
    <div class="nav-menu-toggle" title="Toggle menu (c)"><i class="material-icons">menu</i></div>
    <div class="nav-search-toggle" title="Show / Hide search (s)"><i class="material-icons">search</i></div>
  </div>
  <?php
}

function nav_pagination()
{
  $prev_next_urls = get_prev_next_urls();
  
  if (array_filter($prev_next_urls))
  {
    ?><div class="sub-navigation-pagination"><?php
    
    if (!empty($prev_next_urls['prevUrl']))
    {
      ?><a href="<?php echo $prev_next_urls['prevUrl']; ?>"><i class="material-icons sub-pagination-prev" title="Previous track / page (shift + arrow left)">arrow_backward</i></a><?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }
    else
    {
      ?><i class="material-icons sub-pagination-prev disbled">arrow_backward</i><?php
    }
    
    if (!empty($prev_next_urls['nextUrl']))
    {
      ?><a href="<?php echo $prev_next_urls['nextUrl']; ?>"><i class="material-icons sub-pagination-next" title="Next track / page (shift + arrow right)">arrow_forward</i></a><?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }
    else
    {
      ?><i class="material-icons sub-pagination-next disbled">arrow_forward</i><?php
    }

    ?></div><?php
  }
  else
  {
    ?>
    <div class="sub-navigation-pagination">
      <a href="" title="Go back" onclick="javascript:history.back();return false;"><i class="material-icons sub-pagination-prev">arrow_backward</i></a>
      <i class="material-icons sub-pagination-next disbled">arrow_forward</i>
    </div>
    <?php
  }
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
    
  if ($wp_query->found_posts > 1)
  {
    if ($wp_query->max_num_pages <= 1)
      return ' (' . $wp_query->found_posts . ' hits)';
    else
      return ' (' . $wp_query->found_posts . ' hits - page ' . get_pagination('', ' of ', ')');
  }

  return '';
}

function nav_title()
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
    $prefix     = '<b>' . $title . '</b>';
    $title      = '';
    $pagination = '';
  }
  else if (is_404())
  {
    $prefix     = '<b>Error / 404: </b>';
    $pagination = '';
  }
  else if (is_search())
  {
    $prefix = '<b>Search: </b>';
    $title  = get_search_query();
  }
  else if (is_tag())
  {
    $prefix = '<b>Artist: </b>';
  }

  echo $prefix . $title . $pagination; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function index_title()
{
  $prefix     = 'Channel:';
  $title      = get_title();
  $pagination = '';
  $show_title = (have_posts() && (1 === get_pagednum())) ? true : false;
  // Channels not shown in the header / nav menu
  $channels   = array('rock', 'pop', 'easy-listening', 'afrobeat', 'r-and-b', 'fusion', 'go-go', 'premium', 'low-tempo', 'promo');
  
  if (is_search() && have_posts())
  {
    $prefix     = 'Search results:';
    $title      = get_search_query();
    $pagination = get_search_hits();
  }
  else if (is_tag() && $show_title)
  {
    $prefix = 'Artist:';
    $title  = single_tag_title('', false);
  }
  else if (is_shuffle() && $show_title)
  {
    $prefix = 'Shuffle: ';
    $title  = get_title();
  }
  else if (is_date() && $show_title) // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
  {
    // Do nothing on purpose!
  }
  else if ($show_title && is_category($channels)) // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
  {
    // Do nothing on purpose!
  }
  else
  {
    return;
  }

  ?>
  <h1 class="content-header"><?php echo esc_html($prefix); ?> <span class="light-text"><?php echo esc_html($title); ?></span><span class="lightest-text"><?php echo esc_html($pagination); ?></span></h1>
  <?php
}

function footer_title()
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
  
  echo $title_pagination; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

function entry_title()
{
  if (is_singular())
    esc_html(the_title('<h2 class="entry-title">', '</h2>'));
  else
    esc_html(the_title(sprintf('<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>'));
}

function meta_date_author()
{
  ?>
  <span class="date-author-long" title="Monthly archive"> <a href="/<?php echo get_the_date('Y/m'); ?>/"><?php echo get_the_date(); ?></a></span>
  <span class="date-author-short" title="Monthly archive"><a href="/<?php echo get_the_date('Y/m'); ?>/"><?php echo get_the_date('d. M y'); ?></a></span>
  <?php
}

function intro_banner()
{
  $property = '';
  $content  = '';
  $display  = false;

  if (is_front_page() && !is_paged() && !is_shuffle())
  {
    $property = 'showFrontpageIntro';
    $post     = get_post((true === WP_DEBUG) ? 808 : 808);
    $content  = apply_filters('the_content', wp_kses_post($post->post_content)); // phpcs:ignore WPThemeReview.CoreFunctionality.PrefixAllGlobals.NonPrefixedHooknameFound
    $display  = true;
  }
  else if (is_category('premium') && have_posts() && !is_paged())
  {
    $property = 'showPremiumIntro';
    $post     = get_post((true === WP_DEBUG) ? 1500 : 1500);
    $content  = apply_filters('the_content', wp_kses_post($post->post_content)); // phpcs:ignore WPThemeReview.CoreFunctionality.PrefixAllGlobals.NonPrefixedHooknameFound
    $display  = true;
  }
  
  if (true === $display)
  {
    ?>
    <script>var bannerProperty = '<?php echo $property; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>';</script>
    <div id="intro-banner">
      <div class="intro-banner-container">
      <?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
      <div class="intro-banner-close-button">
        <div class="intro-banner-close-button-container">
        Close <span class="light-text">(and don't show again)</span>
        </div>
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
  <?php }
}

function perf_results()
{
  $perf_data = get_perf_data();

  if (true === $perf_data['display_perf_results'])
  {
    $results = get_num_queries() . ' queries in ' . timer_stop(0) . ' seconds';

    if (is_shuffle())
      $results .= ' - cRndTrans: ' . $perf_data['create_rnd_transient'] . ' ms - gRndTrans: ' . $perf_data['get_rnd_transient'] . ' ms';

    echo '<!-- ' . esc_html($results) . ' -->';
  }
}

?>
