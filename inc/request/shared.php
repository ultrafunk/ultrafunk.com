<?php declare(strict_types=1);
/*
 * Shared request functions / utils
 *
 */


namespace Ultrafunk\RequestShared;


/**************************************************************************************************************************/


function request_pagination($request)
{
  if ($request->max_pages > 1)
  {
    $args = array(
      'base'      => ($request->is_artists ? '/artists/%_%' : '/channels/%_%'),
      'format'    => 'page/%#%/',
      'total'     => $request->max_pages,
      'current'   => $request->current_page,
      'type'      => 'list',
      'mid_size'  => 4,
      'prev_text' => '&#10094;&#10094; Prev.',
      'next_text' => 'Next &#10095;&#10095;',
    );
  
    ?>
    <nav class="navigation pagination" role="navigation" aria-label=" ">
      <h2 class="screen-reader-text"><?php echo ($request->is_artists ? 'All Artists'  : 'All Channels'); ?></h2>
      <div class="nav-links">
        <?php echo paginate_links($args); ?>
      </div>
    </nav>
    <?php
  }
}

function request_get_prev_next_urls($params)
{
  $path     = $params['is_artists'] ? 'artists' : 'channels';
  $prevNext = array('prev' => null, 'next' => null);

  if ($params['max_pages'] > 1)
  {
    if ($params['current_page'] === 1)
    {
      $prevNext['next'] = '/' . $path . '/page/' . ($params['current_page'] + 1) . '/';
    }
    else if ($params['current_page'] < $params['max_pages'])
    {
      $prevNext['prev'] = '/' . $path . '/page/' . ($params['current_page'] - 1) . '/';
      $prevNext['next'] = '/' . $path . '/page/' . ($params['current_page'] + 1) . '/';
    }
    else
    {
      $prevNext['prev'] = '/' . $path . '/page/' . ($params['current_page'] - 1) . '/';
    }
  
    if ($params['current_page'] === 2)
      $prevNext['prev'] = '/' . $path . '/';
  }
  else if (isset($params['first_letter']))
  {
    $letters = $params['letters_range'];
    $index   = array_search($params['first_letter'], $letters);

    if ($index === 0)
    {
      $prevNext['next'] = '/' . $path . '/b/';
    }
    else if (($index + 1) < count($letters))
    {
      $prevNext['prev'] = '/' . $path . '/' . $letters[$index - 1] . '/';
      $prevNext['next'] = '/' . $path . '/' . $letters[$index + 1] . '/';
    }
    else
    {
      $prevNext['prev'] = '/' . $path . '/' . $letters[$index - 1] . '/';
    }
  }

  return $prevNext;
}
