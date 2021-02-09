<?php declare(strict_types=1);
/*
 * Termlist
 *
 */


namespace Ultrafunk\ContentTerms;


use function \Ultrafunk\RequestShared\request_pagination;


/**************************************************************************************************************************/


function term_list($request)
{
  $terms = get_terms(array(
    'taxonomy'     => $request->taxonomy,
    'orderby'      => 'name',
    'order'        => 'ASC',
    'hide_empty'   => true,
    'number'       => $request->terms_per_page,
    'offset'       => (($request->terms_per_page * $request->current_page) - $request->terms_per_page),
    'first_letter' => (isset($request->first_letter) ? $request->first_letter : null),
  ));

  if ($request->is_artists)
  {
    ?><div class="artist-letters-container"><?php

    foreach ($request->letters_range as $letter)
    {
      ?><div class="entry-content artist-letter <?php echo ($request->first_letter === $letter) ? 'current' : ''; ?>"><a href="/artists/<?php echo $letter; ?>/"><?php echo $letter; ?></a></div><?php
    }    

    ?></div><?php
  }

  if (!empty($terms))
  {
    ?>
    <term-list id="termlist-container" class="entry-content <?php echo "term-$request->term_type"; ?>" data-term-type="<?php echo $request->term_type; ?>">
      <?php if ($request->is_artists === false) { ?>
        <div class="termlist-title"><b>All Channels</b> (tracks)</div>
      <?php } ?>
      <?php term_list_entries($request, $terms); ?>
    </term-list>
    <?php

    request_pagination($request);
  }
  else
  {
    // ToDo: STUFF HERE IF LIST IS EMPTY!!!!
  }
}

function term_list_entries($request, $terms)
{
  $odd_even = $request->is_artists ? 1 : 0;

  foreach ($terms as $term)
  {
    $row_class = (($odd_even++ % 2) === 1) ? 'odd' : 'even';

    ?>
    <div id="<?php echo "term-$term->term_id"; ?>" class="termlist-entry" data-term-id="<?php echo $term->term_id; ?>">
      <div class="termlist-header <?php echo $row_class; ?>" title="Show more or less">
        <div class="termlist-name"><?php echo "$term->name <span class='light-text'>($term->count)</span>"; ?></div>
        <div class="termlist-icons">
          <div class="play-button" title="Play All - <?php echo $term->name; ?>"><a href="<?php echo "/$request->term_path/$term->slug/"; ?>" target="_blank"><span class="material-icons">play_arrow</span></a></div>
          <div class="shuffle-button" title="Shuffle &amp; Play All - <?php echo $term->name; ?>"><a href="<?php echo "/shuffle/$request->term_path/$term->slug/"; ?>" target="_blank"><span class="material-icons">shuffle</span></a></div>
          <div class="share-find-button" title="Share <?php echo $term->name; ?> / Find On" data-term-type="<?php echo $request->term_path; ?>" data-term-name="<?php echo $term->name; ?>" data-term-url="<?php echo esc_url(home_url()) . "/$request->term_path/$term->slug/"; ?>"><span class="material-icons">share</span></div>
          <div class="expand-toggle" title="Show more or less"><span class="material-icons">expand_more</span></div>
        </div>
      </div>
      <div class="termlist-body <?php echo $row_class; ?>">
        <div class="body-left">
          <?php echo (($request->term_type === 'tags') ? '<b>All Tracks<br>' : '<b>Latest Tracks<br>'); ?>&#8226;&#8226;&#8226;</b>
        </div>
        <div class="body-right">
          <div class="permalink"><b>Permalink</b><br><a href="<?php echo "/$request->term_path/$term->slug/"; ?>"><?php echo $term->name?></a></div>
          <?php if ($request->term_type === 'tags') { ?>
            <div class="artists"><b>Related Artists<br>&#8226;&#8226;&#8226;</b></div>
            <div class="channels"><b>In Channels<br>&#8226;&#8226;&#8226;</b></div>
          <?php } ?>
        </div>
      </div>
    </div>
    <?php
  }
}
