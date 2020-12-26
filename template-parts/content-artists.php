<?php
/*
 * Template part for displaying artists
 *
 */

require get_template_directory() . '/inc/termlist.php';

if (false === \Ultrafunk\TermList\term_list('post_tag', '<b>Artist</b> (tracks)', 'artist'))
{
  get_template_part('template-parts/content', 'none');
}
