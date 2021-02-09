<?php declare(strict_types=1);
/*
 * Theme custom widgets
 *
 */

class UF_Widget_Taxonomies extends WP_Widget
{
  public function __construct()
  {
    $widget_ops = array( 
      'classname'   => 'widget-taxonomies',
      'description' => 'Show Taxonomies',
    );
    
    parent::__construct('taxonomies', 'Taxonomies', $widget_ops);
  }

  public function widget($args, $instance)
  {
    if (!isset($args['widget_id']))
      $args['widget_id'] = $this->id;
    
    $title    = (!empty($instance['title']))    ? $instance['title']          : 'Taxonomy';
    $taxonomy = (!empty($instance['taxonomy'])) ? $instance['taxonomy']       : 'category';
    $number   = (!empty($instance['number']))   ? absint($instance['number']) : 10;

    $listArgs = array(
      'echo'       => 1,
      'order'      => 'DESC',
      'orderby'    => 'count',
      'show_count' => 1,
      'number'     => $number,
      'taxonomy'   => $taxonomy,
      'title_li'   => '',
    );
    
    echo $args['before_widget'];
    echo $args['before_title'] . $title . $args['after_title'];
    
    ?><ul><?php
    wp_list_categories($listArgs);
    ?></ul><?php
    
    echo $args['after_widget'];
  }

  public function update($new_instance, $old_instance)
  {
    $instance             = $old_instance;
    $instance['title']    = sanitize_text_field($new_instance['title']);
    $instance['taxonomy'] = sanitize_text_field($new_instance['taxonomy']);
    $instance['number']   = (int) $new_instance['number'];
    
    return $instance;
  }

  public function form($instance)
  {
    $title    = isset($instance['title'])    ? esc_attr($instance['title'])    : '';
    $taxonomy = isset($instance['taxonomy']) ? esc_attr($instance['taxonomy']) : '';
    $number   = isset($instance['number'])   ? absint($instance['number'])     : 10;
    
    ?>
    <p><label for="<?php echo $this->get_field_id('title'); ?>">Title:</label>
    <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" name="<?php echo $this->get_field_name('title'); ?>" type="text" value="<?php echo $title; ?>" /></p>

    <p><label for="<?php echo $this->get_field_id('taxonomy'); ?>">Taxonomy:</label>
    <input class="widefat" id="<?php echo $this->get_field_id('taxonomy'); ?>" name="<?php echo $this->get_field_name('taxonomy'); ?>" type="text" value="<?php echo $taxonomy; ?>" /></p>

    <p><label for="<?php echo $this->get_field_id('number'); ?>">Number to show:</label>
    <input class="small-text" id="<?php echo $this->get_field_id('number'); ?>" name="<?php echo $this->get_field_name('number'); ?>" type="number" step="1" min="1" value="<?php echo $number; ?>" size="3" /></p>
    <?php
  }
}

add_action('widgets_init', function()
{
  register_widget('UF_Widget_Taxonomies');
});

