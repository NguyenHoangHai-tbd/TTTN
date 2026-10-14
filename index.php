<?php
/**
 * Entry point cho theme OtoMarket.
 * Tự động điều hướng các trang của hệ thống: index, admin, cars, car-detail, post-car, about, favorites, my-listings, login, register, profile
 *
 * @package OtoMarket
 */

if (! defined('ABSPATH')) {
    exit;
}

// Xác định tệp template HTML cần tải dựa trên URL
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

$target_file = isset($page_map[$rel_path]) ? $page_map[$rel_path] : 'index.html';
$template_path = get_template_directory() . '/' . $target_file;

if (! file_exists($template_path)) {
    $template_path = get_template_directory() . '/index.html';
}

status_header(200);

ob_start();
include $template_path;
$html = ob_get_clean();

$base_tag = sprintf(
    "\n  <base href=\"%s/\">",
    esc_url(get_template_directory_uri())
);

ob_start();
wp_head();
$head_injection = ob_get_clean();

ob_start();
wp_footer();
$footer_injection = ob_get_clean();

$html = preg_replace('/<head([^>]*)>/i', '<head$1>' . $base_tag, $html, 1);
$html = preg_replace('/<\/head>/i', $head_injection . '</head>', $html, 1);
$html = preg_replace('/<\/body>/i', $footer_injection . '</body>', $html, 1);

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
