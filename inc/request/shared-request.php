<?php declare(strict_types=1);
/*
 * Shared request functions / utils
 *
 */


namespace Ultrafunk\SharedRequest;


use function Ultrafunk\Globals\ {
  console_log,
  get_request_params,
  set_request_params,
};


/**************************************************************************************************************************/


abstract class Request
{
  protected $is_valid = false;
  
  public $items_per_page = WP_DEBUG ? 36 : 36;
  public $current_page   = 1;
  public $max_pages      = 1;
  public $query_args     = array();
  
  protected function set_request_params(array $bool_params = array(), array $null_params = array())
  {
    foreach ($bool_params as $key)
      $params[$key] = isset($this->$key) ? $this->$key : false;

    foreach ($null_params as $key)
      $params[$key] = isset($this->$key) ? $this->$key : null;

    $params['route_path']   = (isset($this->route_path)  ? $this->route_path  : null);
    $params['title_parts']  = (isset($this->title_parts) ? $this->title_parts : null);
    $params['current_page'] = $this->current_page;
    $params['max_pages']    = $this->max_pages;

    set_request_params($params);
  }

  abstract public function is_valid() : bool;

  public function render_content($wp_env, $template_name, $template_function)
  {
  //console_log($this);
  //console_log(get_request_params());

    require get_template_directory() . '/template-parts/' . $template_name;

    $wp_env->send_headers();
    
    get_header();
    call_user_func($template_function, $this);
    get_footer();

    exit;
  }
}


/**************************************************************************************************************************/


function get_max_pages($item_count, $items_per_page)
{
  return ($item_count > $items_per_page) ? ceil($item_count / $items_per_page) : 1;  
}

function request_pagination($request)
{
  if (isset($request->max_pages) && ($request->max_pages > 1))
  {
    $args = array(
      'base'      => "/$request->route_path/%_%",
      'format'    => 'page/%#%/',
      'total'     => $request->max_pages,
      'current'   => $request->current_page,
      'type'      => 'list',
      'mid_size'  => 4,
      'prev_text' => '&#10094;&#10094; Prev.',
      'next_text' => 'Next &#10095;&#10095;',
    );

    $nav_header_text = $request->title_parts['prefix'] . ': <span class="light-text">' . $request->title_parts['title'] . '</span>';
  
    ?>
    <nav class="navigation pagination" role="navigation" aria-label=" ">
      <h2 class="screen-reader-text"><?php echo $nav_header_text; ?></h2>
      <div class="nav-links">
        <?php echo paginate_links($args); ?>
      </div>
    </nav>
    <?php
  }
}

function request_get_prev_next_urls()
{
  $params   = get_request_params();
  $path     = isset($params['route_path']) ? $params['route_path'] : '';
  $prevNext = array('prev' => null, 'next' => null);

  if (isset($params['max_pages']) && ($params['max_pages'] > 1))
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