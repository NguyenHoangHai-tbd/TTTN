<?php
/**
 * Thiết lập theme OtoMarket.
 *
 * @package OtoMarket
 */

if (! defined('ABSPATH')) {
    exit;
}

function otomarket_theme_setup()
{
    add_theme_support('title-tag');
    add_theme_support('custom-logo');
    add_theme_support('post-thumbnails');
    add_theme_support(
        'html5',
        array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script')
    );
}
add_action('after_setup_theme', 'otomarket_theme_setup');
