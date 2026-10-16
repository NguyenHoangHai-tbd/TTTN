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

    $page_map = array('', 'index', 'admin', 'cars', 'car-detail', 'post-car', 'about', 'favorites', 'my-listings', 'login', 'register', 'profile');
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
        ''            => 'index.html',
        'index'       => 'index.html',
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

// Tùy biến trang đăng nhập WordPress với Logo & Màu thương hiệu OtoMarket
function otomarket_custom_login_branding() {
    $logo_url = get_template_directory_uri() . '/assets/images/logo.png';
    $favicon_url = get_template_directory_uri() . '/assets/images/favicon.png';
    ?>
    <style type="text/css">
        body.login {
            background: #0B132B !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #login h1 a, .login h1 a {
            background-image: url('<?php echo esc_url($logo_url); ?>') !important;
            height: 52px !important;
            width: 215px !important;
            background-size: contain !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            padding-bottom: 0 !important;
            margin-bottom: 24px !important;
        }
        .login form {
            background: #FFFFFF !important;
            border-radius: 16px !important;
            border: 1px solid #E2E8F0 !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3) !important;
            padding: 30px !important;
        }
        .login #login_error, .login .message, .login .success {
            border-radius: 8px !important;
            border-left-color: #0D9488 !important;
        }
        .wp-core-ui .button-primary {
            background: #0D9488 !important;
            border-color: #0D9488 !important;
            border-radius: 8px !important;
            font-weight: 700 !important;
            transition: background 0.2s ease !important;
        }
        .wp-core-ui .button-primary:hover {
            background: #0F766E !important;
            border-color: #0F766E !important;
        }
        .login #backtoblog a, .login #nav a {
            color: #94A3B8 !important;
        }
        .login #backtoblog a:hover, .login #nav a:hover {
            color: #2DD4BF !important;
        }
    </style>
    <link rel="icon" type="image/png" href="<?php echo esc_url($favicon_url); ?>">
    <?php
}
add_action('login_enqueue_scripts', 'otomarket_custom_login_branding');

function otomarket_login_header_url() {
    return home_url();
}
add_filter('login_headerurl', 'otomarket_login_header_url');

function otomarket_login_header_title() {
    return 'OtoMarket - Nền tảng mua bán ô tô trực tuyến';
}
add_filter('login_headertext', 'otomarket_login_header_title');

// Favicon cho WordPress Admin
function otomarket_admin_favicon() {
    $favicon_url = get_template_directory_uri() . '/assets/images/favicon.png';
    echo '<link rel="icon" type="image/png" href="' . esc_url($favicon_url) . '">' . "\n";
}
add_action('admin_head', 'otomarket_admin_favicon');

