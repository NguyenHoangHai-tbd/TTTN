<?php
/**
 * OtoMarket - Custom Post Type & Meta Boxes cho Xe Ô tô
 * Dựa trên cấu trúc dữ liệu nguyên bản của dự án OtoMarket
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 1. Đăng ký Custom Post Type 'car' và Taxonomies
 */
function otomarket_register_car_post_type() {
    $labels = array(
        'name'               => 'Quản lý Ô tô',
        'singular_name'      => 'Xe ô tô',
        'menu_name'          => 'Quản lý Ô tô',
        'name_admin_bar'     => 'Xe ô tô',
        'add_new'            => 'Thêm xe mới',
        'add_new_item'       => 'Thêm xe ô tô mới',
        'new_item'           => 'Xe mới',
        'edit_item'          => 'Chỉnh sửa thông tin xe',
        'view_item'          => 'Xem xe',
        'all_items'          => 'Tất cả xe đang có',
        'search_items'       => 'Tìm kiếm xe',
        'not_found'          => 'Chưa có xe nào trong hệ thống.',
        'not_found_in_trash' => 'Thùng rác trống.'
    );

    $args = array(
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'query_var'          => true,
        'rewrite'            => array('slug' => 'xe', 'with_front' => false),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 5,
        'menu_icon'          => 'dashicons-car',
        'supports'           => array('title', 'editor', 'thumbnail', 'author'),
        'show_in_rest'       => true,
    );

    register_post_type('car', $args);

    // Taxonomy: Hãng xe (Brand)
    register_taxonomy('car_brand', 'car', array(
        'labels' => array(
            'name'          => 'Hãng xe',
            'singular_name' => 'Hãng xe',
            'search_items'  => 'Tìm hãng xe',
            'all_items'     => 'Tất cả hãng xe',
            'edit_item'     => 'Sửa hãng xe',
            'add_new_item'  => 'Thêm hãng xe mới',
        ),
        'hierarchical' => true,
        'show_ui'      => true,
        'show_in_rest' => true,
        'rewrite'      => array('slug' => 'hang-xe'),
    ));

    // Taxonomy: Tình trạng (Condition: Xe mới / Xe cũ)
    register_taxonomy('car_condition', 'car', array(
        'labels' => array(
            'name'          => 'Tình trạng xe',
            'singular_name' => 'Tình trạng',
            'all_items'     => 'Tất cả tình trạng',
            'add_new_item'  => 'Thêm tình trạng',
        ),
        'hierarchical' => true,
        'show_ui'      => true,
        'show_in_rest' => true,
        'rewrite'      => array('slug' => 'tinh-trang'),
    ));

    // Taxonomy: Khu vực (Location)
    register_taxonomy('car_location', 'car', array(
        'labels' => array(
            'name'          => 'Khu vực / Tỉnh thành',
            'singular_name' => 'Khu vực',
            'all_items'     => 'Tất cả khu vực',
            'add_new_item'  => 'Thêm khu vực',
        ),
        'hierarchical' => true,
        'show_ui'      => true,
        'show_in_rest' => true,
        'rewrite'      => array('slug' => 'khu-vuc'),
    ));
}
add_action('init', 'otomarket_register_car_post_type');

/**
 * 2. Đăng ký Meta Box "Thông số kỹ thuật & Thông tin bán xe"
 */
function otomarket_add_car_meta_boxes() {
    add_meta_box(
        'otomarket_car_details',
        'Thông tin chi tiết xe (Dữ liệu OtoMarket)',
        'otomarket_render_car_meta_box',
        'car',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'otomarket_add_car_meta_boxes');

function otomarket_render_car_meta_box($post) {
    wp_nonce_field('otomarket_save_car_meta_action', 'otomarket_car_meta_nonce');

    // Lấy các giá trị đã lưu
    $model           = get_post_meta($post->ID, '_car_model', true);
    $version         = get_post_meta($post->ID, '_car_version', true);
    $year            = get_post_meta($post->ID, '_car_year', true);
    $price           = get_post_meta($post->ID, '_car_price', true);
    $price_display   = get_post_meta($post->ID, '_car_price_display', true);
    $mileage         = get_post_meta($post->ID, '_car_mileage', true);
    $fuel            = get_post_meta($post->ID, '_car_fuel', true);
    $transmission    = get_post_meta($post->ID, '_car_transmission', true);
    $body_type       = get_post_meta($post->ID, '_car_body_type', true);
    $seats           = get_post_meta($post->ID, '_car_seats', true);
    $color           = get_post_meta($post->ID, '_car_color', true);
    $interior_color  = get_post_meta($post->ID, '_car_interior_color', true);
    $origin          = get_post_meta($post->ID, '_car_origin', true);
    $is_featured     = get_post_meta($post->ID, '_car_is_featured', true);
    $image_url       = get_post_meta($post->ID, '_car_image_url', true);
    
    // Người bán
    $seller_type     = get_post_meta($post->ID, '_car_seller_type', true);
    $seller_name     = get_post_meta($post->ID, '_car_seller_name', true);
    $seller_phone    = get_post_meta($post->ID, '_car_seller_phone', true);
    $seller_address  = get_post_meta($post->ID, '_car_seller_address', true);

    // Thông số động cơ
    $engine          = get_post_meta($post->ID, '_car_engine', true);
    $power           = get_post_meta($post->ID, '_car_power', true);
    $drivetrain      = get_post_meta($post->ID, '_car_drivetrain', true);
    $warranty        = get_post_meta($post->ID, '_car_warranty', true);
    ?>
    <style>
        .oto-meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px; }
        .oto-meta-field { display: flex; flex-direction: column; }
        .oto-meta-field label { font-weight: 600; margin-bottom: 5px; color: #1e293b; font-size: 13px; }
        .oto-meta-field input, .oto-meta-field select { width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; }
        .oto-meta-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        .oto-meta-section-title { font-size: 14px; font-weight: 700; color: #0d9488; margin-bottom: 12px; }
    </style>

    <div class="oto-meta-section-title">1. Thông tin cơ bản & Giá bán</div>
    <div class="oto-meta-grid">
        <div class="oto-meta-field">
            <label>Dòng xe (Model):</label>
            <input type="text" name="_car_model" value="<?php echo esc_attr($model); ?>" placeholder="Ví dụ: Yaris Cross, VF 6, Santa Fe">
        </div>
        <div class="oto-meta-field">
            <label>Phiên bản (Version):</label>
            <input type="text" name="_car_version" value="<?php echo esc_attr($version); ?>" placeholder="Ví dụ: HEV, Plus, 2.2D Premium">
        </div>
        <div class="oto-meta-field">
            <label>Năm sản xuất:</label>
            <input type="number" name="_car_year" value="<?php echo esc_attr($year); ?>" placeholder="2026">
        </div>
        <div class="oto-meta-field">
            <label>Giá bán (VNĐ):</label>
            <input type="number" name="_car_price" value="<?php echo esc_attr($price); ?>" placeholder="Ví dụ: 765000000">
        </div>
        <div class="oto-meta-field">
            <label>Giá hiển thị (Nếu để trống sẽ tự tính):</label>
            <input type="text" name="_car_price_display" value="<?php echo esc_attr($price_display); ?>" placeholder="Ví dụ: 765 triệu, 1.185 tỷ">
        </div>
        <div class="oto-meta-field">
            <label>Số km đã đi (Odo):</label>
            <input type="number" name="_car_mileage" value="<?php echo esc_attr($mileage); ?>" placeholder="0 nếu là xe mới">
        </div>
    </div>

    <div class="oto-meta-grid">
        <div class="oto-meta-field">
            <label>Hộp số:</label>
            <select name="_car_transmission">
                <option value="Tự động" <?php selected($transmission, 'Tự động'); ?>>Tự động</option>
                <option value="Số sàn" <?php selected($transmission, 'Số sàn'); ?>>Số sàn</option>
            </select>
        </div>
        <div class="oto-meta-field">
            <label>Nhiên liệu:</label>
            <select name="_car_fuel">
                <option value="Xăng" <?php selected($fuel, 'Xăng'); ?>>Xăng</option>
                <option value="Dầu" <?php selected($fuel, 'Dầu'); ?>>Dầu (Diesel)</option>
                <option value="Điện" <?php selected($fuel, 'Điện'); ?>>Điện</option>
                <option value="Hybrid" <?php selected($fuel, 'Hybrid'); ?>>Hybrid</option>
            </select>
        </div>
        <div class="oto-meta-field">
            <label>Kiểu dáng xe:</label>
            <select name="_car_body_type">
                <option value="SUV" <?php selected($body_type, 'SUV'); ?>>SUV</option>
                <option value="Sedan" <?php selected($body_type, 'Sedan'); ?>>Sedan</option>
                <option value="Crossover" <?php selected($body_type, 'Crossover'); ?>>Crossover</option>
                <option value="Hatchback" <?php selected($body_type, 'Hatchback'); ?>>Hatchback</option>
                <option value="MPV" <?php selected($body_type, 'MPV'); ?>>MPV</option>
                <option value="Bán tải" <?php selected($body_type, 'Bán tải'); ?>>Bán tải</option>
            </select>
        </div>
        <div class="oto-meta-field">
            <label>Số chỗ ngồi:</label>
            <input type="number" name="_car_seats" value="<?php echo esc_attr($seats ?: '5'); ?>" placeholder="5 hoặc 7">
        </div>
        <div class="oto-meta-field">
            <label>Màu ngoại thất:</label>
            <input type="text" name="_car_color" value="<?php echo esc_attr($color); ?>" placeholder="Ví dụ: Trắng ngọc trai, Đen, Đỏ">
        </div>
        <div class="oto-meta-field">
            <label>Màu nội thất:</label>
            <input type="text" name="_car_interior_color" value="<?php echo esc_attr($interior_color); ?>" placeholder="Ví dụ: Đen, Nâu da bò, Kem">
        </div>
        <div class="oto-meta-field">
            <label>Xuất xứ:</label>
            <input type="text" name="_car_origin" value="<?php echo esc_attr($origin); ?>" placeholder="Ví dụ: Lắp ráp trong nước, Nhập khẩu Indonesia">
        </div>
        <div class="oto-meta-field" style="grid-column: span 2;">
            <label>Link ảnh xe ngoài (URL trực tiếp nếu không tải qua Media):</label>
            <input type="url" name="_car_image_url" value="<?php echo esc_attr($image_url); ?>" placeholder="https://images.unsplash.com/...">
        </div>
    </div>

    <div class="oto-meta-section">
        <div class="oto-meta-section-title">2. Thông tin người bán & Xem xe</div>
        <div class="oto-meta-grid">
            <div class="oto-meta-field">
                <label>Loại người bán:</label>
                <select name="_car_seller_type">
                    <option value="Đại lý chính hãng" <?php selected($seller_type, 'Đại lý chính hãng'); ?>>Đại lý chính hãng</option>
                    <option value="Cá nhân" <?php selected($seller_type, 'Cá nhân'); ?>>Cá nhân</option>
                </select>
            </div>
            <div class="oto-meta-field">
                <label>Tên người bán / Đại lý:</label>
                <input type="text" name="_car_seller_name" value="<?php echo esc_attr($seller_name); ?>" placeholder="Toyota Mỹ Đình, Anh Nam...">
            </div>
            <div class="oto-meta-field">
                <label>Số điện thoại liên hệ:</label>
                <input type="text" name="_car_seller_phone" value="<?php echo esc_attr($seller_phone); ?>" placeholder="0901 202 626">
            </div>
            <div class="oto-meta-field" style="grid-column: span 3;">
                <label>Địa chỉ xem xe:</label>
                <input type="text" name="_car_seller_address" value="<?php echo esc_attr($seller_address); ?>" placeholder="Ví dụ: Số 15 đường Trần Phú, Nha Trang">
            </div>
        </div>
    </div>

    <div class="oto-meta-section">
        <div class="oto-meta-section-title">3. Động cơ & Bảo hành</div>
        <div class="oto-meta-grid">
            <div class="oto-meta-field">
                <label>Động cơ:</label>
                <input type="text" name="_car_engine" value="<?php echo esc_attr($engine); ?>" placeholder="Ví dụ: Hybrid 1.5L, Điện 150kW, 2.0L Turbo">
            </div>
            <div class="oto-meta-field">
                <label>Công suất:</label>
                <input type="text" name="_car_power" value="<?php echo esc_attr($power); ?>" placeholder="Ví dụ: 110 mã lực, 201 hp">
            </div>
            <div class="oto-meta-field">
                <label>Hệ dẫn động:</label>
                <input type="text" name="_car_drivetrain" value="<?php echo esc_attr($drivetrain); ?>" placeholder="FWD, AWD, 4WD, RWD">
            </div>
            <div class="oto-meta-field" style="grid-column: span 3;">
                <label>Chính sách bảo hành:</label>
                <input type="text" name="_car_warranty" value="<?php echo esc_attr($warranty); ?>" placeholder="Ví dụ: Theo chính sách hãng, Bảo hành 5 năm hoặc 100.000km">
            </div>
        </div>
    </div>

    <div class="oto-meta-section" style="padding-bottom: 5px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; color: #0f172a;">
            <input type="checkbox" name="_car_is_featured" value="1" <?php checked($is_featured, '1'); ?>>
            <span>Đánh dấu là <strong>Xe mới đăng nổi bật</strong> (Hiển thị ưu tiên tại Trang chủ OtoMarket)</span>
        </label>
    </div>
    <?php
}

/**
 * 3. Lưu dữ liệu Meta Box khi lưu bài viết
 */
function otomarket_save_car_meta($post_id) {
    if (!isset($_POST['otomarket_car_meta_nonce']) || !wp_verify_nonce($_POST['otomarket_car_meta_nonce'], 'otomarket_save_car_meta_action')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $fields = array(
        '_car_model'          => 'sanitize_text_field',
        '_car_version'        => 'sanitize_text_field',
        '_car_year'           => 'absint',
        '_car_price'          => 'sanitize_text_field',
        '_car_price_display'  => 'sanitize_text_field',
        '_car_mileage'        => 'absint',
        '_car_fuel'           => 'sanitize_text_field',
        '_car_transmission'   => 'sanitize_text_field',
        '_car_body_type'      => 'sanitize_text_field',
        '_car_seats'          => 'absint',
        '_car_color'          => 'sanitize_text_field',
        '_car_interior_color' => 'sanitize_text_field',
        '_car_origin'         => 'sanitize_text_field',
        '_car_image_url'      => 'esc_url_raw',
        '_car_seller_type'    => 'sanitize_text_field',
        '_car_seller_name'    => 'sanitize_text_field',
        '_car_seller_phone'   => 'sanitize_text_field',
        '_car_seller_address' => 'sanitize_text_field',
        '_car_engine'         => 'sanitize_text_field',
        '_car_power'          => 'sanitize_text_field',
        '_car_drivetrain'     => 'sanitize_text_field',
        '_car_warranty'       => 'sanitize_text_field',
    );

    foreach ($fields as $key => $sanitize_cb) {
        if (isset($_POST[$key])) {
            $val = call_user_func($sanitize_cb, $_POST[$key]);
            update_post_meta($post_id, $key, $val);
        }
    }

    // Tự động tính giá hiển thị nếu trống
    if (empty($_POST['_car_price_display']) && !empty($_POST['_car_price'])) {
        $p = floatval($_POST['_car_price']);
        if ($p >= 1000000000) {
            $disp = rtrim(rtrim(number_format($p / 1000000000, 2, '.', ''), '0'), '.') . ' tỷ';
        } else {
            $disp = round($p / 1000000) . ' triệu';
        }
        update_post_meta($post_id, '_car_price_display', $disp);
    }

    // Checkbox nổi bật
    $featured = isset($_POST['_car_is_featured']) ? '1' : '0';
    update_post_meta($post_id, '_car_is_featured', $featured);
}
add_action('save_post_car', 'otomarket_save_car_meta');

/**
 * 4. Hiển thị các cột chuyên nghiệp trong danh sách xe ở WP-Admin
 */
function otomarket_car_admin_columns($columns) {
    $new_columns = array(
        'cb'           => $columns['cb'],
        'car_image'    => 'Ảnh xe',
        'title'        => 'Tiêu đề xe',
        'car_brand'    => 'Hãng xe',
        'car_price'    => 'Giá bán',
        'car_year'     => 'Năm SX',
        'car_mileage'  => 'Số Km',
        'car_location' => 'Khu vực',
        'car_featured' => 'Nổi bật',
        'date'         => 'Ngày đăng'
    );
    return $new_columns;
}
add_filter('manage_car_posts_columns', 'otomarket_car_admin_columns');

function otomarket_car_admin_custom_column($column, $post_id) {
    switch ($column) {
        case 'car_image':
            $img = get_the_post_thumbnail_url($post_id, 'thumbnail');
            if (!$img) {
                $img = get_post_meta($post_id, '_car_image_url', true);
            }
            if ($img) {
                echo '<img src="' . esc_url($img) . '" style="width: 55px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;">';
            } else {
                echo '<span style="color: #94a3b8; font-size: 11px;">Chưa có ảnh</span>';
            }
            break;

        case 'car_brand':
            $terms = get_the_term_list($post_id, 'car_brand', '', ', ', '');
            echo $terms ? $terms : '<span style="color:#94a3b8;">—</span>';
            break;

        case 'car_price':
            $price_display = get_post_meta($post_id, '_car_price_display', true);
            if ($price_display) {
                echo '<strong style="color: #0d9488;">' . esc_html($price_display) . '</strong>';
            } else {
                $p = get_post_meta($post_id, '_car_price', true);
                echo $p ? number_format($p) . ' đ' : '—';
            }
            break;

        case 'car_year':
            $year = get_post_meta($post_id, '_car_year', true);
            echo $year ? esc_html($year) : '—';
            break;

        case 'car_mileage':
            $mileage = get_post_meta($post_id, '_car_mileage', true);
            if ($mileage !== '') {
                echo $mileage == 0 ? '<span style="color:#10b981; font-weight:600;">Xe mới</span>' : number_format($mileage) . ' km';
            } else {
                echo '—';
            }
            break;

        case 'car_location':
            $loc = get_the_term_list($post_id, 'car_location', '', ', ', '');
            echo $loc ? $loc : '<span style="color:#94a3b8;">—</span>';
            break;

        case 'car_featured':
            $featured = get_post_meta($post_id, '_car_is_featured', true);
            if ($featured === '1') {
                echo '<span style="color: #f59e0b; font-size: 16px;">★</span>';
            } else {
                echo '<span style="color: #cbd5e1;">☆</span>';
            }
            break;
    }
}
add_action('manage_car_posts_custom_column', 'otomarket_car_admin_custom_column', 10, 2);

/**
 * 5. Tự động nạp 17 xe mẫu từ SAMPLE_CARS nếu database trống (chạy 1 lần duy nhất)
 */
function otomarket_seed_sample_cars_if_empty() {
    $count = wp_count_posts('car');
    if ($count && $count->publish > 0) {
        return; // Đã có xe, không cần tạo mẫu
    }

    // Danh sách xe mẫu chính xác từ data.js của dự án
    $sample_cars = array(
        array(
            'title' => 'Toyota Yaris Cross HEV 2026',
            'brand' => 'Toyota',
            'model' => 'Yaris Cross',
            'version' => 'HEV',
            'year' => 2026,
            'price' => 765000000,
            'priceDisplay' => '765 triệu',
            'mileage' => 0,
            'fuel' => 'Hybrid',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 5,
            'color' => 'Trắng ngọc trai',
            'interiorColor' => 'Đen',
            'origin' => 'Nhập khẩu Indonesia',
            'location' => 'Hà Nội',
            'condition' => 'Xe mới',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Toyota Mỹ Đình',
            'sellerPhone' => '0901 202 626',
            'sellerAddress' => 'Nam Từ Liêm, Hà Nội',
            'image' => 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Xe mới 100%, thông tin giá và chương trình bán hàng do đại lý đăng tải.',
            'engine' => 'Hybrid 1.5L',
            'power' => '110 mã lực',
            'drivetrain' => 'FWD',
            'warranty' => 'Theo chính sách hãng'
        ),
        array(
            'title' => 'VinFast VF 6 Plus 2026',
            'brand' => 'VinFast',
            'model' => 'VF 6',
            'version' => 'Plus',
            'year' => 2026,
            'price' => 855000000,
            'priceDisplay' => '855 triệu',
            'mileage' => 0,
            'fuel' => 'Điện',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 5,
            'color' => 'Xanh dương',
            'interiorColor' => 'Đen',
            'origin' => 'Lắp ráp trong nước',
            'location' => 'TP. Hồ Chí Minh',
            'condition' => 'Xe mới',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'VinFast Central',
            'sellerPhone' => '0906 202 626',
            'sellerAddress' => 'Quận 1, TP. Hồ Chí Minh',
            'image' => 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Xe điện mới 100%, cấu hình Plus dành cho khách hàng cần không gian đô thị linh hoạt.',
            'engine' => 'Mô-tơ điện 150 kW',
            'power' => '201 mã lực',
            'drivetrain' => 'FWD',
            'warranty' => 'Bảo hành pin 10 năm'
        ),
        array(
            'title' => 'Honda City RS 2026',
            'brand' => 'Honda',
            'model' => 'City',
            'version' => 'RS',
            'year' => 2026,
            'price' => 609000000,
            'priceDisplay' => '609 triệu',
            'mileage' => 0,
            'fuel' => 'Xăng',
            'transmission' => 'Tự động',
            'bodyType' => 'Sedan',
            'seats' => 5,
            'color' => 'Đỏ cá tính',
            'interiorColor' => 'Đen viền đỏ',
            'origin' => 'Lắp ráp trong nước',
            'location' => 'Đà Nẵng',
            'condition' => 'Xe mới',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Honda Ô tô Đà Nẵng',
            'sellerPhone' => '0908 202 626',
            'sellerAddress' => 'Hải Châu, Đà Nẵng',
            'image' => 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Sedan hạng B thể thao, trang bị gói an toàn Honda SENSING.',
            'engine' => '1.5L DOHC i-VTEC',
            'power' => '119 mã lực',
            'drivetrain' => 'FWD',
            'warranty' => '3 năm hoặc 100.000 km'
        ),
        array(
            'title' => 'Toyota Corolla Cross 1.8V 2023',
            'brand' => 'Toyota',
            'model' => 'Corolla Cross',
            'version' => '1.8V',
            'year' => 2023,
            'price' => 785000000,
            'priceDisplay' => '785 triệu',
            'mileage' => 18000,
            'fuel' => 'Xăng',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 5,
            'color' => 'Xám bạc',
            'interiorColor' => 'Nâu da bò',
            'origin' => 'Nhập khẩu Thái Lan',
            'location' => 'Hà Nội',
            'condition' => 'Xe cũ',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Toyota Sure Cầu Giấy',
            'sellerPhone' => '0912 345 678',
            'sellerAddress' => 'Cầu Giấy, Hà Nội',
            'image' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Xe gia đình sử dụng giữ gìn, bảo dưỡng định kỳ đầy đủ tại đại lý chính hãng.',
            'engine' => '1.8L 2ZR-FBE',
            'power' => '138 mã lực',
            'drivetrain' => 'FWD',
            'warranty' => 'Bảo hành chính hãng đến 2026'
        ),
        array(
            'title' => 'Hyundai Santa Fe Premium 2022',
            'brand' => 'Hyundai',
            'model' => 'Santa Fe',
            'version' => '2.2D Cao cấp HTRAC',
            'year' => 2022,
            'price' => 1050000000,
            'priceDisplay' => '1.050 tỷ',
            'mileage' => 32000,
            'fuel' => 'Dầu',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 7,
            'color' => 'Trắng ngọc trai',
            'interiorColor' => 'Nâu Cognac',
            'origin' => 'Lắp ráp trong nước',
            'location' => 'TP. Hồ Chí Minh',
            'condition' => 'Xe cũ',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Hyundai Đông Đô',
            'sellerPhone' => '0934 567 890',
            'sellerAddress' => 'Bình Tân, TP. Hồ Chí Minh',
            'image' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Phiên bản máy dầu cao cấp 2.2D HTRAC bền bỉ và tiết kiệm nhiên liệu.',
            'engine' => 'SmartStream D2.2',
            'power' => '202 mã lực',
            'drivetrain' => 'AWD (HTRAC)',
            'warranty' => 'Cam kết xe không đâm đụng ngập nước'
        ),
        array(
            'title' => 'Mazda CX-5 Luxury 2021',
            'brand' => 'Mazda',
            'model' => 'CX-5',
            'version' => '2.0 Luxury',
            'year' => 2021,
            'price' => 695000000,
            'priceDisplay' => '695 triệu',
            'mileage' => 45000,
            'fuel' => 'Xăng',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 5,
            'color' => 'Đỏ pha lê (Soul Red)',
            'interiorColor' => 'Đen',
            'origin' => 'Lắp ráp trong nước',
            'location' => 'Nha Trang',
            'condition' => 'Xe cũ',
            'sellerType' => 'Cá nhân',
            'sellerName' => 'Nguyễn Văn Hùng',
            'sellerPhone' => '0988 123 456',
            'sellerAddress' => 'Vĩnh Hải, Nha Trang',
            'image' => 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '1',
            'description' => 'Xe cá nhân đi làm hằng ngày tại Nha Trang, một đời chủ từ đầu.',
            'engine' => 'SkyActiv-G 2.0L',
            'power' => '154 mã lực',
            'drivetrain' => 'FWD',
            'warranty' => 'Bao test hãng toàn quốc'
        ),
        array(
            'title' => 'Ford Everest Titanium 2024',
            'brand' => 'Ford',
            'model' => 'Everest',
            'version' => 'Titanium+ 2.0L Bi-Turbo 4x4',
            'year' => 2024,
            'price' => 1350000000,
            'priceDisplay' => '1.350 tỷ',
            'mileage' => 9500,
            'fuel' => 'Dầu',
            'transmission' => 'Tự động',
            'bodyType' => 'SUV',
            'seats' => 7,
            'color' => 'Đen Ánh Kim',
            'interiorColor' => 'Đen Ebony cao cấp',
            'origin' => 'Nhập khẩu Thái Lan',
            'location' => 'Hà Nội',
            'condition' => 'Xe cũ',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Thăng Long Ford',
            'sellerPhone' => '0945 678 901',
            'sellerAddress' => 'Thanh Xuân, Hà Nội',
            'image' => 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '0',
            'description' => 'SUV 7 chỗ đỉnh cao đời 2024 lướt 9.500km như xe đập hộp.',
            'engine' => 'Bi-Turbo Diesel 2.0L',
            'power' => '210 mã lực',
            'drivetrain' => '4WD toàn thời gian',
            'warranty' => 'Bảo hành chính hãng Ford'
        ),
        array(
            'title' => 'Mercedes-Benz C200 Avantgarde Plus 2022',
            'brand' => 'Mercedes-Benz',
            'model' => 'C-Class',
            'version' => 'C200 Avantgarde Plus',
            'year' => 2022,
            'price' => 1390000000,
            'priceDisplay' => '1.390 tỷ',
            'mileage' => 21000,
            'fuel' => 'Xăng',
            'transmission' => 'Tự động',
            'bodyType' => 'Sedan',
            'seats' => 5,
            'color' => 'Trắng Polar',
            'interiorColor' => 'Nâu da cao cấp',
            'origin' => 'Lắp ráp trong nước',
            'location' => 'TP. Hồ Chí Minh',
            'condition' => 'Xe cũ',
            'sellerType' => 'Đại lý chính hãng',
            'sellerName' => 'Haxaco Sài Gòn',
            'sellerPhone' => '0977 890 123',
            'sellerAddress' => 'Bình Thạnh, TP. Hồ Chí Minh',
            'image' => 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
            'isFeatured' => '0',
            'description' => 'Sedan hạng sang thế hệ mới W206, bảo dưỡng full lịch sử tại Mercedes Haxaco.',
            'engine' => '1.5L Turbo kèm Mild-Hybrid EQ Boost',
            'power' => '204 mã lực',
            'drivetrain' => 'RWD',
            'warranty' => 'Bảo hành chính hãng Mercedes-Benz'
        )
    );

    foreach ($sample_cars as $c) {
        $post_id = wp_insert_post(array(
            'post_title'   => $c['title'],
            'post_content' => $c['description'],
            'post_status'  => 'publish',
            'post_type'    => 'car',
            'post_author'  => 1
        ));

        if ($post_id && !is_wp_error($post_id)) {
            // Set Taxonomies
            wp_set_object_terms($post_id, $c['brand'], 'car_brand');
            wp_set_object_terms($post_id, $c['condition'], 'car_condition');
            wp_set_object_terms($post_id, $c['location'], 'car_location');

            // Set Post Meta
            update_post_meta($post_id, '_car_model', $c['model']);
            update_post_meta($post_id, '_car_version', $c['version']);
            update_post_meta($post_id, '_car_year', $c['year']);
            update_post_meta($post_id, '_car_price', $c['price']);
            update_post_meta($post_id, '_car_price_display', $c['priceDisplay']);
            update_post_meta($post_id, '_car_mileage', $c['mileage']);
            update_post_meta($post_id, '_car_fuel', $c['fuel']);
            update_post_meta($post_id, '_car_transmission', $c['transmission']);
            update_post_meta($post_id, '_car_body_type', $c['bodyType']);
            update_post_meta($post_id, '_car_seats', $c['seats']);
            update_post_meta($post_id, '_car_color', $c['color']);
            update_post_meta($post_id, '_car_interior_color', $c['interiorColor']);
            update_post_meta($post_id, '_car_origin', $c['origin']);
            update_post_meta($post_id, '_car_image_url', $c['image']);
            update_post_meta($post_id, '_car_is_featured', $c['isFeatured']);
            update_post_meta($post_id, '_car_seller_type', $c['sellerType']);
            update_post_meta($post_id, '_car_seller_name', $c['sellerName']);
            update_post_meta($post_id, '_car_seller_phone', $c['sellerPhone']);
            update_post_meta($post_id, '_car_seller_address', $c['sellerAddress']);
            update_post_meta($post_id, '_car_engine', $c['engine']);
            update_post_meta($post_id, '_car_power', $c['power']);
            update_post_meta($post_id, '_car_drivetrain', $c['drivetrain']);
        }
    }
}

function otomarket_maybe_seed_sample_cars() {
    if (get_option('otomarket_sample_cars_seeded')) {
        return;
    }
    otomarket_seed_sample_cars_if_empty();
    update_option('otomarket_sample_cars_seeded', '1');
}
add_action('init', 'otomarket_maybe_seed_sample_cars', 20);

/**
 * 6. Lấy danh sách toàn bộ xe dưới dạng mảng JSON cho Frontend
 */
function otomarket_get_all_cars_data() {
    $cars_query = new WP_Query(array(
        'post_type'      => 'car',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC'
    ));

    $cars_list = array();

    if ($cars_query->have_posts()) {
        while ($cars_query->have_posts()) {
            $cars_query->the_post();
            $pid = get_the_ID();

            // Lấy taxonomy
            $brands = wp_get_post_terms($pid, 'car_brand', array('fields' => 'names'));
            $brand = !empty($brands) ? $brands[0] : get_post_meta($pid, '_car_brand', true);

            $conditions = wp_get_post_terms($pid, 'car_condition', array('fields' => 'names'));
            $condition_name = !empty($conditions) ? $conditions[0] : '';
            $is_new = ($condition_name === 'Xe mới' || get_post_meta($pid, '_car_mileage', true) == 0);

            $locations = wp_get_post_terms($pid, 'car_location', array('fields' => 'names'));
            $location = !empty($locations) ? $locations[0] : '';

            // Ảnh
            $image = get_the_post_thumbnail_url($pid, 'large');
            if (!$image) {
                $image = get_post_meta($pid, '_car_image_url', true);
            }
            if (!$image) {
                $image = 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80';
            }

            $price = floatval(get_post_meta($pid, '_car_price', true));
            $price_display = get_post_meta($pid, '_car_price_display', true);
            if (!$price_display && $price) {
                $price_display = ($price >= 1000000000) ? (round($price / 1000000000, 2) . ' tỷ') : (round($price / 1000000) . ' triệu');
            }

            $mileage = intval(get_post_meta($pid, '_car_mileage', true));
            $mileage_display = ($mileage === 0 || $is_new) ? 'Xe mới' : number_format($mileage) . ' km';

            $cars_list[] = array(
                'id'              => 'wp-' . $pid,
                'wp_id'           => $pid,
                'title'           => get_the_title(),
                'brand'           => $brand ?: 'Khác',
                'model'           => get_post_meta($pid, '_car_model', true),
                'version'         => get_post_meta($pid, '_car_version', true),
                'year'            => intval(get_post_meta($pid, '_car_year', true)),
                'price'           => $price,
                'priceDisplay'    => $price_display,
                'mileage'         => $mileage,
                'mileageDisplay'  => $mileage_display,
                'fuel'            => get_post_meta($pid, '_car_fuel', true) ?: 'Xăng',
                'transmission'    => get_post_meta($pid, '_car_transmission', true) ?: 'Tự động',
                'bodyType'        => get_post_meta($pid, '_car_body_type', true) ?: 'SUV',
                'seats'           => intval(get_post_meta($pid, '_car_seats', true)) ?: 5,
                'color'           => get_post_meta($pid, '_car_color', true),
                'interiorColor'   => get_post_meta($pid, '_car_interior_color', true),
                'origin'          => get_post_meta($pid, '_car_origin', true),
                'location'        => $location ?: 'Toàn quốc',
                'sellerType'      => get_post_meta($pid, '_car_seller_type', true) ?: 'Đại lý chính hãng',
                'sellerName'      => get_post_meta($pid, '_car_seller_name', true) ?: 'OtoMarket Partner',
                'sellerPhone'     => get_post_meta($pid, '_car_seller_phone', true) ?: '0901 202 626',
                'sellerAddress'   => get_post_meta($pid, '_car_seller_address', true),
                'image'           => $image,
                'images'          => array($image),
                'isFeatured'      => get_post_meta($pid, '_car_is_featured', true) === '1',
                'isNew'           => $is_new,
                'condition'       => $is_new ? 'new' : 'used',
                'postedDate'      => get_the_date('d/m/Y'),
                'viewCount'       => 100,
                'description'     => get_the_content(),
                'specifications'  => array(
                    'engine'     => get_post_meta($pid, '_car_engine', true),
                    'power'      => get_post_meta($pid, '_car_power', true),
                    'drivetrain' => get_post_meta($pid, '_car_drivetrain', true),
                    'warranty'   => get_post_meta($pid, '_car_warranty', true),
                )
            );
        }
        wp_reset_postdata();
    }

    return $cars_list;
}
