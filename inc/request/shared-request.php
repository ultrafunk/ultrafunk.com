<?php declare(strict_types=1);
/*
 * Shared request functions / utils
 *
 */


namespace Ultrafunk\SharedRequest;


use function Ultrafunk\Globals\ {
  console_log,
  get_request_params,
};


/**************************************************************************************************************************/


abstract class Request
{
  protected $is_valid = false;
  
  protected $default_query_args = array('posts_per_page' => 25);
  protected $route_query_args   = array();

  protected $default_term_args = array('orderby' => 'name', 'order' => 'ASC', 'hide_empty' => true);
  protected $route_term_args   = array();
  
  abstract public function is_valid();

  protected function set_query_args()
  {
    $this->query_args = array_merge($this->default_query_args, $this->route_query_args);
  }

  protected function set_term_args()
  {
    $this->term_args = array_merge($this->default_term_args, $this->route_term_args);
  }

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
  
    ?>
    <nav class="navigation pagination" role="navigation" aria-label=" ">
      <h2 class="screen-reader-text"><?php echo $request->pagination_header; ?></h2>
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
