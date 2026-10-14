<?php
/**
 * Entry point cho theme OtoMarket.
 *
 * @package OtoMarket
 */

if (! defined('ABSPATH')) {
    exit;
}

$static_home = get_template_directory() . '/index.html';

if (! file_exists($static_home)) {
    status_header(500);
    echo esc_html__('Không tìm thấy tệp index.html của giao diện.', 'otomarket');
    return;
}

ob_start();
include $static_home;
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
