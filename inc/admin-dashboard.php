<?php
/**
 * OtoMarket - Bảng Quản Trị Hệ Thống trong WP-Admin
 * Tích hợp toàn bộ 100% chức năng từ admin.html (GitHub) vào WordPress:
 * 1. 4 Thẻ KPI thống kê (Tổng người dùng, Chờ duyệt, Đang bán, Báo cáo vi phạm)
 * 2. Danh sách tin đăng chờ duyệt (Duyệt tin, Từ chối kèm lý do modal)
 * 3. Danh sách báo cáo vi phạm (Đang xử lý, Đã xong, Ẩn tin vi phạm)
 * 4. Kho xe toàn hệ thống với Bộ lọc trạng thái (Đang bán, Chờ duyệt, Bản nháp, v.v.)
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. Đăng ký trang Bảng Quản Trị vào thanh menu WP-Admin
 */
function otomarket_register_admin_dashboard_page() {
    add_menu_page(
        'Bảng Quản Trị Hệ Thống - OtoMarket',
        'Bảng Quản Trị',
        'manage_options',
        'otomarket-dashboard',
        'otomarket_render_dashboard_view',
        'dashicons-chart-pie',
        2
    );
}
add_action('admin_menu', 'otomarket_register_admin_dashboard_page');

/**
 * 2. Khởi tạo dữ liệu mẫu cho Báo cáo vi phạm & Tin chờ duyệt (nếu chưa có)
 */
function otomarket_init_admin_sample_data() {
    // Khởi tạo báo cáo vi phạm mẫu nếu trống
    if (get_option('otomarket_reports') === false) {
        $sample_reports = array(
            array(
                'id'          => 'rep-101',
                'listingId'   => 'wp-15',
                'carTitle'    => 'Toyota Corolla Cross 1.8V 2023',
                'reporter'    => 'khachhang_01@gmail.com',
                'reason'      => 'Sai lệch thông số hoặc giá bán',
                'description' => 'Giá hiển thị 785 triệu nhưng liên hệ hỏi thì đại lý báo giá khác.',
                'status'      => 'pending',
                'createdAt'   => current_time('mysql'),
            ),
            array(
                'id'          => 'rep-102',
                'listingId'   => 'wp-17',
                'carTitle'    => 'Mazda CX-5 Luxury 2021',
                'reporter'    => 'nguoimua_nhatrang@gmail.com',
                'reason'      => 'Nghi vấn lừa đảo / giả mạo',
                'description' => 'Số điện thoại liên hệ không đúng với chính chủ.',
                'status'      => 'processing',
                'createdAt'   => current_time('mysql'),
            )
        );
        update_option('otomarket_reports', $sample_reports);
    }

    // Đảm bảo có ít nhất 1 tin chờ duyệt mẫu để Admin trải nghiệm quy trình Duyệt tin
    $pending_cars = get_posts(array(
        'post_type'   => 'car',
        'post_status' => 'pending',
        'numberposts' => 1
    ));

    if (empty($pending_cars)) {
        $pending_id = wp_insert_post(array(
            'post_title'   => 'Kia Seltos 1.4 Turbo Premium 2024',
            'post_content' => 'Xe người dùng đăng bán cần kiểm duyệt thông tin hình ảnh và số km.',
            'post_status'  => 'pending',
            'post_type'    => 'car',
            'post_author'  => 1
        ));
        if ($pending_id && !is_wp_error($pending_id)) {
            wp_set_object_terms($pending_id, 'Kia', 'car_brand');
            wp_set_object_terms($pending_id, 'Xe cũ', 'car_condition');
            wp_set_object_terms($pending_id, 'Hà Nội', 'car_location');
            update_post_meta($pending_id, '_car_model', 'Seltos');
            update_post_meta($pending_id, '_car_version', '1.4 Turbo Premium');
            update_post_meta($pending_id, '_car_year', 2024);
            update_post_meta($pending_id, '_car_price', 689000000);
            update_post_meta($pending_id, '_car_price_display', '689 triệu');
            update_post_meta($pending_id, '_car_mileage', 12000);
            update_post_meta($pending_id, '_car_transmission', 'Tự động');
            update_post_meta($pending_id, '_car_fuel', 'Xăng');
            update_post_meta($pending_id, '_car_seller_name', 'Trần Hoài Nam');
            update_post_meta($pending_id, '_car_seller_phone', '0912 888 999');
            update_post_meta($pending_id, '_car_seller_address', 'Đống Đa, Hà Nội');
            update_post_meta($pending_id, '_car_image_url', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');
        }
    }
}
add_action('admin_init', 'otomarket_init_admin_sample_data');

/**
 * 3. Giao diện Bảng Quản Trị Hệ Thống (Admin Dashboard)
 */
function otomarket_render_dashboard_view() {
    // 1. Thống kê KPI
    $user_count = count_users();
    $total_users = isset($user_count['total_users']) ? $user_count['total_users'] : 1;

    $pending_cars = get_posts(array(
        'post_type'   => 'car',
        'post_status' => 'pending',
        'numberposts' => -1
    ));
    $pending_count = count($pending_cars);

    $active_cars = get_posts(array(
        'post_type'   => 'car',
        'post_status' => 'publish',
        'numberposts' => -1
    ));
    $active_count = count($active_cars);

    $reports = get_option('otomarket_reports', array());
    $reports_count = count($reports);

    // Toàn bộ xe (all status)
    $all_cars = get_posts(array(
        'post_type'   => 'car',
        'post_status' => array('publish', 'pending', 'draft'),
        'numberposts' => -1
    ));
    ?>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        .oto-admin-wrap { max-width: 1400px; margin: 20px auto 40px 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #1e293b; }
        .oto-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        .oto-title-group h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; display: flex; align-items: center; gap: 10px; }
        .oto-badge-ws { background: rgba(13, 148, 136, 0.12); color: #0d9488; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
        .oto-header-desc { color: #64748b; font-size: 13px; margin: 0; }
        
        /* 4 Thẻ KPI */
        .oto-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .oto-kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .oto-kpi-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
        .oto-kpi-blue .oto-kpi-icon { background: #eff6ff; color: #2563eb; }
        .oto-kpi-amber .oto-kpi-icon { background: #fffbeb; color: #d97706; }
        .oto-kpi-green .oto-kpi-icon { background: #f0fdf4; color: #16a34a; }
        .oto-kpi-red .oto-kpi-icon { background: #fef2f2; color: #dc2626; }
        .oto-kpi-label { font-size: 13px; color: #64748b; font-weight: 500; display: block; margin-bottom: 2px; }
        .oto-kpi-val { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
        .oto-kpi-amber .oto-kpi-val { color: #d97706; }
        .oto-kpi-green .oto-kpi-val { color: #16a34a; }
        .oto-kpi-red .oto-kpi-val { color: #dc2626; }

        /* Quick Nav Tabs */
        .oto-nav-tabs { display: flex; gap: 10px; margin-bottom: 24px; background: #ffffff; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .oto-tab-btn { text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; color: #334155; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1; background: #f8fafc; }
        .oto-tab-btn:hover { background: #f1f5f9; color: #0f172a; }

        /* Panels & Tables */
        .oto-panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .oto-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
        .oto-panel-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
        
        .oto-table { width: 100%; border-collapse: collapse; text-align: left; }
        .oto-table th { background: #f8fafc; padding: 12px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
        .oto-table td { padding: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 13px; }
        .oto-table tr:hover td { background: #fafafa; }
        
        /* Badges */
        .oto-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .oto-badge-pending { background: #fef3c7; color: #92400e; }
        .oto-badge-active { background: #dcfce7; color: #166534; }
        .oto-badge-rejected { background: #fee2e2; color: #991b1b; }
        .oto-badge-draft { background: #f1f5f9; color: #475569; }

        /* Action Buttons */
        .oto-btn-approve { background: #10b981; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
        .oto-btn-approve:hover { background: #059669; }
        .oto-btn-reject { background: #ef4444; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
        .oto-btn-reject:hover { background: #dc2626; }
        .oto-btn-outline { background: transparent; border: 1px solid #cbd5e1; color: #334155; padding: 5px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; text-decoration: none; }
        .oto-btn-outline:hover { background: #f1f5f9; color: #0f172a; }

        /* Modal Popup */
        .oto-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 99999; justify-content: center; align-items: center; }
        .oto-modal-box { background: #ffffff; width: 480px; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); }
        .oto-modal-title { font-size: 18px; font-weight: 700; color: #dc2626; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
    </style>

    <div class="oto-admin-wrap">
        <!-- Tiêu đề trang -->
        <div class="oto-header">
            <div class="oto-title-group">
                <h1>Bảng Quản Trị Hệ Thống <span class="oto-badge-ws">Admin Workspace</span></h1>
                <p class="oto-header-desc">Kiểm soát chất lượng tin đăng, xử lý báo cáo vi phạm và theo dõi vận hành sàn OtoMarket trên WordPress</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <a href="<?php echo admin_url('post-new.php?post_type=car'); ?>" class="oto-btn-approve" style="background: #0d9488; text-decoration: none; padding: 8px 14px; font-size: 13px;">
                    <i class="bi bi-plus-circle"></i> Đăng xe mới
                </a>
                <a href="<?php echo home_url('/'); ?>" target="_blank" class="oto-btn-outline" style="padding: 8px 14px; font-size: 13px;">
                    <i class="bi bi-box-arrow-up-right"></i> Xem Trang chủ Sàn
                </a>
            </div>
        </div>

        <!-- 4 Thẻ KPI Thống kê -->
        <div class="oto-kpi-grid">
            <div class="oto-kpi-card oto-kpi-blue">
                <div class="oto-kpi-icon"><i class="bi bi-people-fill"></i></div>
                <div>
                    <span class="oto-kpi-label">Tổng người dùng</span>
                    <h3 class="oto-kpi-val"><?php echo esc_html($total_users); ?></h3>
                </div>
            </div>
            <div class="oto-kpi-card oto-kpi-amber">
                <div class="oto-kpi-icon"><i class="bi bi-hourglass-split"></i></div>
                <div>
                    <span class="oto-kpi-label">Tin chờ duyệt</span>
                    <h3 class="oto-kpi-val" id="kpi-pending-num"><?php echo esc_html($pending_count); ?></h3>
                </div>
            </div>
            <div class="oto-kpi-card oto-kpi-green">
                <div class="oto-kpi-icon"><i class="bi bi-check-circle-fill"></i></div>
                <div>
                    <span class="oto-kpi-label">Tin đang bán</span>
                    <h3 class="oto-kpi-val" id="kpi-active-num"><?php echo esc_html($active_count); ?></h3>
                </div>
            </div>
            <div class="oto-kpi-card oto-kpi-red">
                <div class="oto-kpi-icon"><i class="bi bi-flag-fill"></i></div>
                <div>
                    <span class="oto-kpi-label">Báo cáo vi phạm</span>
                    <h3 class="oto-kpi-val" id="kpi-reports-num"><?php echo esc_html($reports_count); ?></h3>
                </div>
            </div>
        </div>

        <!-- Thanh chuyển nhanh tác vụ -->
        <div class="oto-nav-tabs">
            <a href="#pending-section" class="oto-tab-btn"><i class="bi bi-inbox-fill" style="color: #d97706;"></i> Duyệt tin đăng (<?php echo $pending_count; ?>)</a>
            <a href="#reports-section" class="oto-tab-btn"><i class="bi bi-flag-fill" style="color: #dc2626;"></i> Báo cáo vi phạm (<?php echo $reports_count; ?>)</a>
            <a href="#inventory-section" class="oto-tab-btn"><i class="bi bi-collection-fill" style="color: #0d9488;"></i> Kho xe toàn hệ thống (<?php echo count($all_cars); ?>)</a>
        </div>

        <!-- 1. Danh sách tin đăng chờ duyệt -->
        <div class="oto-panel" id="pending-section">
            <div class="oto-panel-header">
                <h2 class="oto-panel-title"><i class="bi bi-inbox-fill" style="color: #d97706;"></i> Danh sách tin đăng chờ duyệt (<span id="table-pending-count"><?php echo $pending_count; ?></span>)</h2>
                <span class="oto-badge oto-badge-pending">Kiểm duyệt chất lượng</span>
            </div>

            <?php if (empty($pending_cars)) : ?>
                <div id="no-pending-box" style="text-align: center; padding: 40px 20px;">
                    <i class="bi bi-check2-circle" style="font-size: 40px; color: #10b981; display: block; margin-bottom: 8px;"></i>
                    <h4 style="font-weight: 700; margin: 0 0 4px 0;">Hiện không có tin nào chờ duyệt!</h4>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">Tất cả các tin đăng xe đã được phê duyệt hợp lệ.</p>
                </div>
            <?php else : ?>
                <table class="oto-table" id="pending-table">
                    <thead>
                        <tr>
                            <th>Ảnh & Xe</th>
                            <th>Người đăng & SĐT</th>
                            <th>Giá & Khu vực</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th style="text-align: right;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($pending_cars as $pcar) : 
                            $img = get_post_meta($pcar->ID, '_car_image_url', true);
                            if (!$img) $img = get_the_post_thumbnail_url($pcar->ID, 'thumbnail');
                            $price_disp = get_post_meta($pcar->ID, '_car_price_display', true) ?: number_format(get_post_meta($pcar->ID, '_car_price', true)) . ' đ';
                            $seller = get_post_meta($pcar->ID, '_car_seller_name', true) ?: 'Chưa cập nhật';
                            $phone = get_post_meta($pcar->ID, '_car_seller_phone', true) ?: '—';
                            $loc = get_the_term_list($pcar->ID, 'car_location', '', ', ', '') ?: 'Toàn quốc';
                            $year = get_post_meta($pcar->ID, '_car_year', true);
                        ?>
                            <tr id="car-row-<?php echo $pcar->ID; ?>">
                                <td>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <img src="<?php echo esc_url($img ?: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'); ?>" style="width: 70px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;">
                                        <div>
                                            <a href="<?php echo get_edit_post_link($pcar->ID); ?>" style="font-weight: 700; color: #0f172a; text-decoration: none; font-size: 13px;"><?php echo esc_html($pcar->post_title); ?></a>
                                            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Năm <?php echo esc_html($year); ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style="font-weight: 600;"><?php echo esc_html($seller); ?></div>
                                    <div style="font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 2px;"><i class="bi bi-telephone"></i> <?php echo esc_html($phone); ?></div>
                                </td>
                                <td>
                                    <div style="font-weight: 700; color: #f97316; font-size: 14px;"><?php echo esc_html($price_disp); ?></div>
                                    <div style="font-size: 11px; color: #64748b;"><?php echo strip_tags($loc); ?></div>
                                </td>
                                <td style="color: #64748b; font-size: 12px;"><?php echo get_the_date('d/m/Y', $pcar->ID); ?></td>
                                <td><span class="oto-badge oto-badge-pending">Chờ duyệt</span></td>
                                <td style="text-align: right;">
                                    <button class="oto-btn-approve" onclick="otoApproveCar(<?php echo $pcar->ID; ?>)"><i class="bi bi-check-circle"></i> Duyệt</button>
                                    <button class="oto-btn-reject" onclick="otoOpenRejectModal(<?php echo $pcar->ID; ?>)"><i class="bi bi-x-circle"></i> Từ chối</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- 2. Danh sách Báo cáo vi phạm -->
        <div class="oto-panel" id="reports-section">
            <div class="oto-panel-header">
                <h2 class="oto-panel-title"><i class="bi bi-flag-fill" style="color: #dc2626;"></i> Báo cáo tin vi phạm từ người dùng (<?php echo $reports_count; ?>)</h2>
                <span class="oto-badge" style="background: #fee2e2; color: #991b1b;">Kiểm tra vi phạm</span>
            </div>

            <?php if (empty($reports)) : ?>
                <p style="color: #64748b; font-size: 13px; margin: 0;">Chưa có báo cáo vi phạm nào.</p>
            <?php else : ?>
                <table class="oto-table">
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tin bị báo cáo</th>
                            <th>Lý do vi phạm</th>
                            <th>Mô tả chi tiết</th>
                            <th>Trạng thái</th>
                            <th style="text-align: right;">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($reports as $idx => $rep) : 
                            $status_label = 'Chờ xử lý';
                            $status_class = 'oto-badge-pending';
                            if ($rep['status'] === 'processing') { $status_label = 'Đang xử lý'; $status_class = 'oto-badge'; }
                            if ($rep['status'] === 'resolved') { $status_label = 'Đã giải quyết'; $status_class = 'oto-badge-active'; }
                        ?>
                            <tr id="report-row-<?php echo $idx; ?>">
                                <td style="font-family: monospace; font-size: 12px;"><?php echo esc_html($rep['id']); ?></td>
                                <td style="font-weight: 600;"><?php echo esc_html($rep['carTitle']); ?></td>
                                <td style="color: #dc2626; font-weight: 600;"><?php echo esc_html($rep['reason']); ?></td>
                                <td style="color: #64748b; font-size: 12px;"><?php echo esc_html($rep['description'] ?: '—'); ?></td>
                                <td><span class="oto-badge <?php echo $status_class; ?>"><?php echo $status_label; ?></span></td>
                                <td style="text-align: right;">
                                    <button class="oto-btn-outline" onclick="otoUpdateReport(<?php echo $idx; ?>, 'processing')">Đang xử lý</button>
                                    <button class="oto-btn-outline" style="color: #10b981; border-color: #10b981;" onclick="otoUpdateReport(<?php echo $idx; ?>, 'resolved')">Đã xong</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- 3. Kho xe toàn hệ thống & Bộ lọc trạng thái -->
        <div class="oto-panel" id="inventory-section">
            <div class="oto-panel-header">
                <h2 class="oto-panel-title"><i class="bi bi-collection-fill" style="color: #0d9488;"></i> Toàn bộ danh mục xe hệ thống (<?php echo count($all_cars); ?>)</h2>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #475569; margin-right: 6px;">Lọc trạng thái:</label>
                    <select id="oto-status-filter" onchange="otoFilterCars(this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;">
                        <option value="all">Tất cả trạng thái</option>
                        <option value="publish">Đang hiển thị (Công khai)</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="draft">Bản nháp / Đã ẩn</option>
                    </select>
                </div>
            </div>

            <table class="oto-table" id="all-cars-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên xe</th>
                        <th>Hãng xe</th>
                        <th>Năm SX</th>
                        <th>Giá bán</th>
                        <th>Người bán</th>
                        <th>Trạng thái</th>
                        <th style="text-align: right;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($all_cars as $c) : 
                        $brand = get_the_term_list($c->ID, 'car_brand', '', ', ', '') ?: '—';
                        $year = get_post_meta($c->ID, '_car_year', true) ?: '—';
                        $price = get_post_meta($c->ID, '_car_price_display', true) ?: (number_format(get_post_meta($c->ID, '_car_price', true)) . ' đ');
                        $seller = get_post_meta($c->ID, '_car_seller_name', true) ?: 'Showroom';
                        
                        $st = $c->post_status;
                        $st_badge = '<span class="oto-badge oto-badge-active">Đang hiển thị</span>';
                        if ($st === 'pending') $st_badge = '<span class="oto-badge oto-badge-pending">Chờ duyệt</span>';
                        if ($st === 'draft') $st_badge = '<span class="oto-badge oto-badge-draft">Đã ẩn / Nháp</span>';
                    ?>
                        <tr class="oto-car-item status-<?php echo esc_attr($st); ?>">
                            <td style="color: #64748b; font-family: monospace;">#<?php echo $c->ID; ?></td>
                            <td>
                                <strong><a href="<?php echo get_edit_post_link($c->ID); ?>" style="text-decoration:none; color:#0f172a;"><?php echo esc_html($c->post_title); ?></a></strong>
                            </td>
                            <td><?php echo strip_tags($brand); ?></td>
                            <td><?php echo esc_html($year); ?></td>
                            <td style="font-weight: 700; color: #f97316;"><?php echo esc_html($price); ?></td>
                            <td style="color: #64748b;"><?php echo esc_html($seller); ?></td>
                            <td><?php echo $st_badge; ?></td>
                            <td style="text-align: right;">
                                <a href="<?php echo get_edit_post_link($c->ID); ?>" class="oto-btn-outline">Sửa</a>
                                <?php if ($st === 'publish') : ?>
                                    <button class="oto-btn-outline" onclick="otoToggleCarStatus(<?php echo $c->ID; ?>, 'draft')">Ẩn</button>
                                <?php else : ?>
                                    <button class="oto-btn-outline" style="color:#10b981; border-color:#10b981;" onclick="otoToggleCarStatus(<?php echo $c->ID; ?>, 'publish')">Hiện</button>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal Từ Chối Tin Đăng -->
    <div id="otoRejectModal" class="oto-modal-overlay">
        <div class="oto-modal-box">
            <h3 class="oto-modal-title"><i class="bi bi-x-circle"></i> Từ chối phê duyệt tin xe</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Vui lòng chọn hoặc nhập lý do từ chối để thông báo cho người đăng:</p>
            <input type="hidden" id="oto-reject-car-id" value="">
            
            <div style="margin-bottom: 12px;">
                <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;">Lý do từ chối:</label>
                <select id="oto-reject-select" onchange="document.getElementById('oto-reject-custom').value = this.value" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; margin-bottom: 8px;">
                    <option value="Hình ảnh mờ, không rõ biển số hoặc nội thất">Hình ảnh mờ, không rõ biển số hoặc nội thất</option>
                    <option value="Giá chào bán chưa hợp lý so với thị trường">Giá chào bán chưa hợp lý so với thị trường</option>
                    <option value="Thông tin thông số kỹ thuật thiếu chính xác">Thông tin thông số kỹ thuật thiếu chính xác</option>
                    <option value="Nghi vấn trùng lặp tin đăng">Nghi vấn trùng lặp tin đăng</option>
                    <option value="Khác">Lý do khác...</option>
                </select>
                <textarea id="oto-reject-custom" rows="3" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px;" placeholder="Nhập lý do chi tiết...">Hình ảnh mờ, không rõ biển số hoặc nội thất</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
                <button type="button" class="oto-btn-outline" onclick="otoCloseRejectModal()">Hủy bỏ</button>
                <button type="button" class="oto-btn-reject" onclick="otoConfirmReject()">Xác nhận từ chối</button>
            </div>
        </div>
    </div>

    <!-- Script xử lý AJAX tương tác thời gian thực -->
    <script>
        const ajaxUrl = "<?php echo admin_url('admin-ajax.php'); ?>";
        const otoNonce = "<?php echo wp_create_nonce('otomarket_admin_ajax_nonce'); ?>";

        function otoApproveCar(carId) {
            if (!confirm("Xác nhận phê duyệt tin đăng xe này để hiển thị công khai trên sàn?")) return;
            jQuery.post(ajaxUrl, {
                action: 'otomarket_approve_car_ajax',
                car_id: carId,
                nonce: otoNonce
            }, function(res) {
                if (res.success) {
                    alert("Đã phê duyệt tin xe thành công!");
                    location.reload();
                } else {
                    alert(res.data || "Có lỗi xảy ra");
                }
            });
        }

        function otoOpenRejectModal(carId) {
            document.getElementById('oto-reject-car-id').value = carId;
            document.getElementById('otoRejectModal').style.display = 'flex';
        }

        function otoCloseRejectModal() {
            document.getElementById('otoRejectModal').style.display = 'none';
        }

        function otoConfirmReject() {
            const carId = document.getElementById('oto-reject-car-id').value;
            const reason = document.getElementById('oto-reject-custom').value.trim();
            if (!reason) {
                alert("Vui lòng nhập lý do từ chối!");
                return;
            }

            jQuery.post(ajaxUrl, {
                action: 'otomarket_reject_car_ajax',
                car_id: carId,
                reason: reason,
                nonce: otoNonce
            }, function(res) {
                if (res.success) {
                    alert("Đã từ chối tin đăng xe!");
                    location.reload();
                } else {
                    alert(res.data || "Có lỗi xảy ra");
                }
            });
        }

        function otoToggleCarStatus(carId, newStatus) {
            const msg = newStatus === 'draft' ? "Ẩn tin đăng này khỏi sàn?" : "Hiển thị công khai tin đăng này?";
            if (!confirm(msg)) return;

            jQuery.post(ajaxUrl, {
                action: 'otomarket_toggle_car_ajax',
                car_id: carId,
                new_status: newStatus,
                nonce: otoNonce
            }, function(res) {
                if (res.success) {
                    location.reload();
                } else {
                    alert(res.data || "Có lỗi xảy ra");
                }
            });
        }

        function otoUpdateReport(index, status) {
            jQuery.post(ajaxUrl, {
                action: 'otomarket_update_report_ajax',
                report_idx: index,
                new_status: status,
                nonce: otoNonce
            }, function(res) {
                if (res.success) {
                    location.reload();
                }
            });
        }

        function otoFilterCars(status) {
            const rows = document.querySelectorAll('.oto-car-item');
            rows.forEach(r => {
                if (status === 'all' || r.classList.contains('status-' + status)) {
                    r.style.display = '';
                } else {
                    r.style.display = 'none';
                }
            });
        }
    </script>
    <?php
}

/**
 * 4. Xử lý các yêu cầu AJAX trong Bảng Quản Trị
 */
function otomarket_ajax_approve_car() {
    check_ajax_referer('otomarket_admin_ajax_nonce', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Không có quyền thao tác');
    }
    $car_id = intval($_POST['car_id']);
    $res = wp_update_post(array(
        'ID'          => $car_id,
        'post_status' => 'publish'
    ));
    if ($res) {
        delete_post_meta($car_id, '_car_reject_reason');
        wp_send_json_success();
    } else {
        wp_send_json_error('Không thể cập nhật trạng thái');
    }
}
add_action('wp_ajax_otomarket_approve_car_ajax', 'otomarket_ajax_approve_car');

function otomarket_ajax_reject_car() {
    check_ajax_referer('otomarket_admin_ajax_nonce', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Không có quyền thao tác');
    }
    $car_id = intval($_POST['car_id']);
    $reason = sanitize_text_field($_POST['reason']);
    $res = wp_update_post(array(
        'ID'          => $car_id,
        'post_status' => 'draft'
    ));
    if ($res) {
        update_post_meta($car_id, '_car_status', 'rejected');
        update_post_meta($car_id, '_car_reject_reason', $reason);
        wp_send_json_success();
    } else {
        wp_send_json_error('Không thể từ chối');
    }
}
add_action('wp_ajax_otomarket_reject_car_ajax', 'otomarket_ajax_reject_car');

function otomarket_ajax_toggle_car() {
    check_ajax_referer('otomarket_admin_ajax_nonce', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Không có quyền');
    }
    $car_id = intval($_POST['car_id']);
    $status = sanitize_text_field($_POST['new_status']);
    wp_update_post(array(
        'ID'          => $car_id,
        'post_status' => $status
    ));
    wp_send_json_success();
}
add_action('wp_ajax_otomarket_toggle_car_ajax', 'otomarket_ajax_toggle_car');

function otomarket_ajax_update_report() {
    check_ajax_referer('otomarket_admin_ajax_nonce', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Không có quyền');
    }
    $idx = intval($_POST['report_idx']);
    $status = sanitize_text_field($_POST['new_status']);
    $reports = get_option('otomarket_reports', array());
    if (isset($reports[$idx])) {
        $reports[$idx]['status'] = $status;
        update_option('otomarket_reports', $reports);
    }
    wp_send_json_success();
}
add_action('wp_ajax_otomarket_update_report_ajax', 'otomarket_ajax_update_report');
