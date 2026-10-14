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

// Nạp Bảng Quản Trị Hệ Thống OtoMarket (KPIs, Duyệt tin, Báo cáo vi phạm, Kho xe)
require_once get_template_directory() . '/inc/admin-dashboard.php';

// Đổ dữ liệu xe từ WordPress Database ra biến window.WP_CARS & thông tin Admin
function otomarket_inject_frontend_cars() {
    if (function_exists('otomarket_get_all_cars_data')) {
        $cars = otomarket_get_all_cars_data();
        if (!empty($cars)) {
            echo '<script id="otomarket-wp-cars-data">window.WP_CARS = ' . json_encode($cars, JSON_UNESCAPED_UNICODE) . ';</script>' . "\n";
        }
    }

    // Nếu người dùng đăng nhập tài khoản quản trị trong WordPress, cấp quyền admin trên frontend
    if (current_user_can('manage_options')) {
        $u = wp_get_current_user();
        echo '<script id="otomarket-wp-admin-auth">window.IS_WP_ADMIN = true; window.WP_CURRENT_USER = { name: "' . esc_js($u->display_name) . '", email: "' . esc_js($u->user_email) . '", role: "admin" };</script>' . "\n";
    }
}
add_action('wp_head', 'otomarket_inject_frontend_cars', 5);

// Chặn lỗi 404 cho các trang HTML của theme
function otomarket_prevent_404_for_html_pages($preempt, $wp_query) {
    $request_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $home_path = trim(parse_url(home_url(), PHP_URL_PATH), '/');
    $rel_path = preg_replace('#^' . preg_quote($home_path, '#') . '/?#', '', $request_path);
    $rel_path = preg_replace('/\.html$/i', '', $rel_path);

    $page_map = array('admin', 'cars', 'car-detail', 'post-car', 'about', 'favorites', 'my-listings', 'login', 'register', 'profile');
    if (in_array($rel_path, $page_map)) {
        status_header(200);
        return true;
    }
    return $preempt;
}
add_filter('pre_handle_404', 'otomarket_prevent_404_for_html_pages', 10, 2);

// Điều hướng các trang HTML (admin, cars, post-car,...)
function otomarket_route_html_pages($template) {
    global $wp_query;
    $request_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    $home_path = trim(parse_url(home_url(), PHP_URL_PATH), '/');
    $rel_path = preg_replace('#^' . preg_quote($home_path, '#') . '/?#', '', $request_path);
    $rel_path = preg_replace('/\.html$/i', '', $rel_path);

    $page_map = array(
        'admin'       => 'admin.html',
        'cars'        => 'cars.html',
        'car-detail'  => 'car-detail.html',
        'post-car'    => 'post-car.html',
        'about'       => 'about.html',
        'favorites'   => 'favorites.html',
        'my-listings' => 'my-listings.html',
        'login'       => 'login.html',
        'register'    => 'register.html',
        'profile'     => 'profile.html',
    );

    if (isset($page_map[$rel_path])) {
        $wp_query->is_404 = false;
        status_header(200);
        return get_template_directory() . '/index.php';
    }

    return $template;
}
add_filter('template_include', 'otomarket_route_html_pages', 99);
