<?php
/*
 * Template part for displaying channels
 *
 */

require get_template_directory() . '/inc/termlist.php';

if (false === \Ultrafunk\TermList\term_list('category', '<b>Channel</b> (tracks)', 'channel'))
{
  get_template_part('template-parts/content', 'none');
}
