<?php
/*
 * Template part for displaying artists
 *
 */

require get_template_directory() . '/inc/termlist.php';

if (\Ultrafunk\TermList\term_list('post_tag', '<b>Artist</b> (tracks)', 'artist') === false)
{
  get_template_part('template-parts/content', 'none');
}
