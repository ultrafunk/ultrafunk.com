<?php declare(strict_types=1);
/*
 * Termlist
 *
 */


namespace Ultrafunk\TermList;


use function Ultrafunk\ThemeTags\ { content_pagination, get_pagednum };


/**************************************************************************************************************************/


//
// https://wordpress.stackexchange.com/questions/228011/how-to-create-a-paginated-list-of-all-categories-on-my-site
//
function term_list($taxonomy, $title, $term_path)
{
  global $wp_query;
  
  $terms_per_page = $wp_query->query_vars['posts_per_page'];

  $terms = get_terms(array(
    'taxonomy'   => $taxonomy,
    'orderby'    => 'name',
    'order'      => 'ASC',
    'hide_empty' => true,
    'number'     => $terms_per_page,
    'offset'     => (($terms_per_page * get_pagednum()) - $terms_per_page),
  ));

  if (!empty($terms))
  {
    $term_type = ($taxonomy === 'category') ? 'categories' : 'tags';

    ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
      <div class="entry-content">
        <div id="termlist-container" class="<?php echo "term-$term_type"; ?>" data-term-type="<?php echo $term_type; ?>">
          <?php term_list_entries($term_type, $terms, $title, $term_path); ?>
        </div>
      </div>
    </article>
    <?php
  
    content_pagination();

    return true;
  }

  return false;
}

function term_list_entries($term_type, $terms, $title, $term_path)
{
  $odd_even = 0;

  ?>
  <div class="termlist-title"><?php echo $title; ?></div>
  <?php

  foreach ($terms as $term)
  {
    $color_class = (($odd_even++ % 2) === 1) ? 'odd' : 'even';

    ?>
    <div class="termlist-entry" data-term-id="<?php echo $term->term_id; ?>">
      <div class="termlist-header <?php echo $color_class; ?>" title="Show more or less">
        <div class="termlist-name"><?php echo "$term->name <span class='light-text'>($term->count)</span>"; ?></div>
        <div class="termlist-icons">
          <div class="play-button" title="Play All - <?php echo $term->name; ?>"><a href="<?php echo "/$term_path/$term->slug/"; ?>" target="_blank"><span class="material-icons">play_arrow</span></a></div>
          <div class="shuffle-button" title="Shuffle &amp Play All - <?php echo $term->name; ?>"><a href="<?php echo "/shuffle/$term_path/$term->slug/"; ?>" target="_blank"><span class="material-icons">shuffle</span></a></div>
          <div class="share-find-button" title="Share <?php echo $term->name; ?> / Find On" data-term-type="<?php echo $term_path; ?>" data-term-name="<?php echo $term->name; ?>" data-term-url="<?php echo esc_url(home_url()) . "/$term_path/$term->slug/"; ?>"><span class="material-icons">share</span></div>
          <div class="expand-toggle" title="Show more or less"><span class="material-icons">expand_more</span></div>
        </div>
      </div>
      <div class="termlist-body <?php echo $color_class; ?>">
        <div class="body-left">
          <?php echo ($term_type === 'categories') ? '<b>Latest Tracks<br>' : '<b>All Tracks<br>'; ?>&#8226;&#8226;&#8226;</b>
        </div>
        <div class="body-right">
          <div class="permalink"><b>Permalink</b><br><a href="<?php echo "/$term_path/$term->slug/"; ?>"><?php echo $term->name?></a></div>
          <?php if ($term_type === 'tags') { ?>
            <div class="artists"><b>Related Artists<br>&#8226;&#8226;&#8226;</b></div>
            <div class="channels"><b>In Channels<br>&#8226;&#8226;&#8226;</b></div>
          <?php } ?>
        </div>
      </div>
    </div>
    <?php
  }
}

?>
