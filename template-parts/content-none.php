<?php declare(strict_types=1);
/*
 * Content cannot be found template
 *
*/

?>

<div class="entry-content">
  <?php if (is_404()) { ?>
    <h1 class="entry-header">Sorry, unable to find the content you were looking for...</h1>
  <?php } else { ?>
    <h1 class="entry-header">Sorry, no content matched your search criteria...</h1>
  <?php } ?>
  <?php echo get_search_form(); ?>
</div>

<?php \Ultrafunk\ThemeTags\content_widgets(); ?>
