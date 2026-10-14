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

// Nạp Custom Post Type và Meta Boxes cho Quản lý Xe Ô tô
require_once get_template_directory() . '/inc/car-cpt.php';

// Đổ dữ liệu xe từ WordPress Database ra biến window.WP_CARS cho frontend
function otomarket_inject_frontend_cars() {
    if (function_exists('otomarket_get_all_cars_data')) {
        $cars = otomarket_get_all_cars_data();
        if (!empty($cars)) {
            echo '<script id="otomarket-wp-cars-data">window.WP_CARS = ' . json_encode($cars, JSON_UNESCAPED_UNICODE) . ';</script>' . "\n";
        }
    }
}
add_action('wp_head', 'otomarket_inject_frontend_cars', 5);
