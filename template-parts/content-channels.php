<?php
/*
 * Template part for displaying channels
 *
 */

require get_template_directory() . '/inc/termlist.php';

if (\Ultrafunk\TermList\term_list('category', '<b>Channel</b> (tracks)', 'channel') === false)
{
  get_template_part('template-parts/content', 'none');
}
