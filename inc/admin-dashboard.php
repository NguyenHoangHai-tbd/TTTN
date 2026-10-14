<?php
/**
 * OtoMarket - Trung Tâm Kỹ Thuật & Bảo Trì Hệ Thống (SuperAdmin Hub)
 * Dành riêng cho Đơn Vị Phát Triển / SuperAdmin kỹ thuật:
 * - Theo dõi tình trạng sức khỏe hệ thống (Site Health, PHP, MySQL, Apache)
 * - Cấu hình thông tin Showroom đối tác (Khách hàng mua dự án)
 * - Công cụ bảo trì: Sao lưu CSDL, tối ưu bảng, xóa cache
 * - Cầu nối truy cập nhanh sang Bảng Quản Trị Showroom (Dành cho Admin duyệt tin)
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. Đăng ký menu SuperAdmin Bảo Trì vào thanh menu WP-Admin
 */
function otomarket_register_superadmin_maintenance_menu() {
    add_menu_page(
        'Trung Tâm Kỹ Thuật & Bảo Trì - OtoMarket',
        'Bảo Trì Kỹ Thuật',
        'manage_options',
        'otomarket-maintenance',
        'otomarket_render_superadmin_maintenance_view',
        'dashicons-admin-tools',
        2
    );
}
add_action('admin_menu', 'otomarket_register_superadmin_maintenance_menu');

/**
 * 2. Lưu cấu hình Showroom & Xử lý công cụ bảo trì
 */
function otomarket_handle_maintenance_post() {
    if (!isset($_POST['otomarket_save_maintenance_nonce']) || !wp_verify_nonce($_POST['otomarket_save_maintenance_nonce'], 'otomarket_save_maintenance_action')) {
        return;
    }
    if (!current_user_can('manage_options')) {
        return;
    }

    // Lưu thông tin showroom
    if (isset($_POST['otomarket_save_showroom'])) {
        $settings = array(
            'showroom_name'    => sanitize_text_field($_POST['showroom_name']),
            'showroom_phone'   => sanitize_text_field($_POST['showroom_phone']),
            'showroom_address' => sanitize_text_field($_POST['showroom_address']),
            'tech_email'       => sanitize_email($_POST['tech_email']),
            'maintenance_mode' => isset($_POST['maintenance_mode']) ? '1' : '0'
        );
        update_option('otomarket_showroom_settings', $settings);
        set_transient('otomarket_admin_notice', 'Đã cập nhật thông tin cấu hình Showroom đối tác thành công!', 45);
    }

    // Tối ưu CSDL
    if (isset($_POST['otomarket_optimize_db'])) {
        global $wpdb;
        $wpdb->query("OPTIMIZE TABLE {$wpdb->posts}, {$wpdb->postmeta}, {$wpdb->options}");
        set_transient('otomarket_admin_notice', 'Đã tối ưu hóa các bảng Cơ sở dữ liệu MySQL thành công!', 45);
    }

    // Xóa Cache
    if (isset($_POST['otomarket_clear_cache'])) {
        wp_cache_flush();
        set_transient('otomarket_admin_notice', 'Đã xóa toàn bộ bộ nhớ đệm (Cache) của hệ thống!', 45);
    }
}
add_action('admin_init', 'otomarket_handle_maintenance_post');

/**
 * 3. Xuất file Sao lưu dữ liệu xe (Export JSON)
 */
function otomarket_handle_export_cars() {
    if (isset($_GET['action']) && $_GET['action'] === 'otomarket_export_cars' && current_user_can('manage_options')) {
        check_admin_referer('otomarket_export_cars_nonce');
        $cars = function_exists('otomarket_get_all_cars_data') ? otomarket_get_all_cars_data() : array();
        
        $json = json_encode($cars, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $filename = 'otomarket-cars-backup-' . date('Y-m-d-His') . '.json';

        header('Content-Description: File Transfer');
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . strlen($json));
        echo $json;
        exit;
    }
}
add_action('admin_init', 'otomarket_handle_export_cars');

/**
 * 4. Giao diện Trung Tâm Kỹ Thuật & Bảo Trì (SuperAdmin)
 */
function otomarket_render_superadmin_maintenance_view() {
    $settings = get_option('otomarket_showroom_settings', array(
        'showroom_name'    => 'Showroom OtoMarket Nha Trang',
        'showroom_phone'   => '0901 202 626',
        'showroom_address' => 'Số 15 đường Trần Phú, TP. Nha Trang',
        'tech_email'       => 'superadmin@otomarket.vn',
        'maintenance_mode' => '0'
    ));

    $cars_count = wp_count_posts('car');
    $total_cars = $cars_count ? ($cars_count->publish + $cars_count->pending + $cars_count->draft) : 0;
    $users_count = count_users();
    $total_users = isset($users_count['total_users']) ? $users_count['total_users'] : 1;

    $notice = get_transient('otomarket_admin_notice');
    if ($notice) {
        delete_transient('otomarket_admin_notice');
    }
    ?>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        .super-wrap { max-width: 1300px; margin: 20px auto 40px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; }
        .super-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .super-title h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px; }
        .super-badge { background: #0f172a; color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .super-desc { color: #64748b; font-size: 13px; margin: 0; }
        
        .super-bridges { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .super-bridge-card { background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
        .super-bridge-card.light { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; }
        .super-bridge-btn { background: #0d9488; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .super-bridge-btn:hover { background: #0f766e; color: #ffffff; }

        .super-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .super-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .super-card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }

        .sys-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sys-table td { padding: 10px 6px; border-bottom: 1px solid #f8fafc; }
        .sys-table td:first-child { font-weight: 600; color: #64748b; width: 45%; }
        .sys-table td:last-child { font-weight: 700; color: #0f172a; }

        .super-form-group { margin-bottom: 14px; }
        .super-form-group label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px; }
        .super-form-group input, .super-form-group select { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; }
        
        .super-btn { background: #2563eb; color: #ffffff; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .super-btn:hover { background: #1d4ed8; }
        .super-btn-dark { background: #334155; }
        .super-btn-dark:hover { background: #1e293b; }
        .super-btn-warning { background: #d97706; }
        .super-btn-warning:hover { background: #b45309; }

        .super-alert { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    </style>

    <div class="super-wrap">
        <!-- Thông báo thao tác -->
        <?php if ($notice) : ?>
            <div class="super-alert">
                <i class="bi bi-check-circle-fill"></i> <?php echo esc_html($notice); ?>
            </div>
        <?php endif; ?>

        <!-- Tiêu đề trang SuperAdmin -->
        <div class="super-header">
            <div class="super-title">
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
                    <img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo-light.png" alt="OtoMarket" style="height: 38px; width: auto; object-fit: contain;">
                    <span class="super-badge">SuperAdmin Technical Console</span>
                </div>
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">Trung Tâm Kỹ Thuật & Bảo Trì Hệ Thống</h1>
                <p class="super-desc">Dành riêng cho đơn vị phát triển kỹ thuật: Quản trị hạ tầng, sao lưu CSDL, cấu hình Showroom và bảo trì vận hành.</p>
            </div>
            <div>
                <span style="font-size: 12px; color: #64748b; font-weight: 600;">
                    <i class="bi bi-person-badge text-primary me-1"></i> Tài khoản: <strong><?php echo esc_html(wp_get_current_user()->user_login); ?></strong> (SuperAdmin)
                </span>
            </div>
        </div>

        <!-- 2 Cầu nối truy cập nhanh -->
        <div class="super-bridges">
            <div class="super-bridge-card">
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">Bảng Quản Trị Showroom (Khách hàng)</h3>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">Dành cho Admin của Showroom duyệt tin xe cũ bên ngoài và quản lý xe showroom.</p>
                </div>
                <a href="<?php echo home_url('/admin.html'); ?>" target="_blank" class="super-bridge-btn">
                    <i class="bi bi-speedometer2"></i> Mở Bảng Quản Trị
                </a>
            </div>

            <div class="super-bridge-card light">
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 700;">Giao Diện Người Mua / Bán (Frontend)</h3>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Xem trực tiếp trang chủ sàn giao dịch, tìm kiếm xe và các chức năng của khách.</p>
                </div>
                <a href="<?php echo home_url('/'); ?>" target="_blank" class="super-bridge-btn" style="background: #0f172a;">
                    <i class="bi bi-box-arrow-up-right"></i> Xem Trang Chủ
                </a>
            </div>
        </div>

        <!-- Nội dung chính 2 cột -->
        <div class="super-grid">
            <!-- Cột trái: Cấu hình Showroom Đối Tác -->
            <div>
                <div class="super-card">
                    <h2 class="super-card-title"><i class="bi bi-building-gear text-primary"></i> 1. Cấu Hình Thông Tin Showroom Đối Tác</h2>
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                        Thông tin của công ty/showroom đã mua dự án này. Các thông tin này sẽ hiển thị ở chân trang và trong thẻ liên hệ của các xe thuộc quyền Showroom.
                    </p>

                    <form method="POST" action="">
                        <?php wp_nonce_field('otomarket_save_maintenance_action', 'otomarket_save_maintenance_nonce'); ?>
                        
                        <div class="super-form-group">
                            <label>Tên Showroom / Doanh nghiệp:</label>
                            <input type="text" name="showroom_name" value="<?php echo esc_attr($settings['showroom_name']); ?>" required>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                            <div class="super-form-group">
                                <label>Hotline Showroom:</label>
                                <input type="text" name="showroom_phone" value="<?php echo esc_attr($settings['showroom_phone']); ?>" required>
                            </div>
                            <div class="super-form-group">
                                <label>Email kỹ thuật nhận sự cố:</label>
                                <input type="email" name="tech_email" value="<?php echo esc_attr($settings['tech_email']); ?>" required>
                            </div>
                        </div>

                        <div class="super-form-group">
                            <label>Địa chỉ Showroom trưng bày:</label>
                            <input type="text" name="showroom_address" value="<?php echo esc_attr($settings['showroom_address']); ?>" required>
                        </div>

                        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">
                                <input type="checkbox" name="maintenance_mode" value="1" <?php checked($settings['maintenance_mode'], '1'); ?>>
                                <span>Kích hoạt Chế độ Bảo trì (Tạm khóa website để nâng cấp)</span>
                            </label>
                            <button type="submit" name="otomarket_save_showroom" class="super-btn">
                                <i class="bi bi-save"></i> Lưu cấu hình Showroom
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Công cụ Bảo trì & Sao lưu -->
                <div class="super-card">
                    <h2 class="super-card-title"><i class="bi bi-tools text-warning"></i> 2. Công Cụ Bảo Trì Kỹ Thuật & Sao Lưu CSDL</h2>
                    <p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                        Các tác vụ phục vụ kiểm tra, tối ưu hiệu năng và sao lưu dữ liệu cho công ty showroom.
                    </p>

                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        <!-- Nút Export Backup -->
                        <?php 
                        $export_url = wp_nonce_url(admin_url('admin.php?page=otomarket-maintenance&action=otomarket_export_cars'), 'otomarket_export_cars_nonce');
                        ?>
                        <a href="<?php echo esc_url($export_url); ?>" class="super-btn" style="background: #10b981; text-decoration: none;">
                            <i class="bi bi-download"></i> Sao lưu CSDL xe (Export JSON)
                        </a>

                        <!-- Nút Tối ưu CSDL -->
                        <form method="POST" style="display: inline;">
                            <?php wp_nonce_field('otomarket_save_maintenance_action', 'otomarket_save_maintenance_nonce'); ?>
                            <button type="submit" name="otomarket_optimize_db" class="super-btn super-btn-dark" onclick="return confirm('Tối ưu hóa các bảng MySQL?')">
                                <i class="bi bi-database-check"></i> Tối ưu bảng CSDL
                            </button>
                        </form>

                        <!-- Nút Xóa Cache -->
                        <form method="POST" style="display: inline;">
                            <?php wp_nonce_field('otomarket_save_maintenance_action', 'otomarket_save_maintenance_nonce'); ?>
                            <button type="submit" name="otomarket_clear_cache" class="super-btn super-btn-warning">
                                <i class="bi bi-arrow-clockwise"></i> Xóa bộ nhớ đệm (Flush Cache)
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Cột phải: Thông số Kỹ thuật Hệ thống -->
            <div>
                <div class="super-card">
                    <h2 class="super-card-title"><i class="bi bi-cpu text-info"></i> Thông Số Kỹ Thuật</h2>
                    <table class="sys-table">
                        <tr>
                            <td>Phiên bản WordPress:</td>
                            <td><?php bloginfo('version'); ?></td>
                        </tr>
                        <tr>
                            <td>Phiên bản PHP:</td>
                            <td><?php echo phpversion(); ?></td>
                        </tr>
                        <tr>
                            <td>Web Server:</td>
                            <td><?php echo isset($_SERVER['SERVER_SOFTWARE']) ? esc_html($_SERVER['SERVER_SOFTWARE']) : 'Apache'; ?></td>
                        </tr>
                        <tr>
                            <td>Cơ sở dữ liệu:</td>
                            <td>MySQL (<?php echo esc_html(DB_NAME); ?>)</td>
                        </tr>
                        <tr>
                            <td>PHP Memory Limit:</td>
                            <td><?php echo esc_html(ini_get('memory_limit')); ?></td>
                        </tr>
                        <tr>
                            <td>Max Upload Size:</td>
                            <td><?php echo esc_html(ini_get('upload_max_filesize')); ?></td>
                        </tr>
                        <tr>
                            <td>Tổng số xe trong CSDL:</td>
                            <td><strong style="color: #0d9488;"><?php echo esc_html($total_cars); ?> xe</strong></td>
                        </tr>
                        <tr>
                            <td>Tổng tài khoản User:</td>
                            <td><?php echo esc_html($total_users); ?> tài khoản</td>
                        </tr>
                        <tr>
                            <td>Trạng thái vận hành:</td>
                            <td><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px;">Hoạt động tốt</span></td>
                        </tr>
                    </table>
                </div>

                <div class="super-card" style="background: #f8fafc; border: 1px dashed #cbd5e1;">
                    <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
                        <i class="bi bi-shield-lock-fill text-primary"></i> Phân Định Trách Nhiệm
                    </h4>
                    <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0;">
                        <strong>Showroom Admin:</strong> Trực tiếp kinh doanh, đăng xe của showroom, xét duyệt tin xe cũ cá nhân bên ngoài tại giao diện Frontend Dashboard.<br><br>
                        <strong>SuperAdmin (Bạn):</strong> Chỉ can thiệp bảo trì, nâng cấp mã nguồn, sửa lỗi khi showroom yêu cầu hỗ trợ kỹ thuật.
                    </p>
                </div>
            </div>
        </div>
    </div>
    <?php
}
