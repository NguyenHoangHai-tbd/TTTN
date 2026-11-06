/**
 * OTOMARKET MULTI-LANGUAGE SYSTEM (VI / EN / ZH)
 * Bản địa hóa giao diện tức thì toàn sàn (Topbar, Navbar, Nội dung, Footer)
 */

(function(window) {
  const I18N_DICT = {
  "Đường Trần Phú, TP. Nha Trang, Khánh Hòa": {
    "en": "Tran Phu St., Nha Trang City, Khanh Hoa",
    "zh": "庆和省芽庄市陈富路"
  },
  "Giờ mở cửa: 08:00 - 18:30 (Thứ 2 - CN)": {
    "en": "Open: 08:00 - 18:30 (Mon - Sun)",
    "zh": "营业时间：08:00 - 18:30（周一至周日）"
  },
  "Đăng nhập": {
    "en": "Login",
    "zh": "登录"
  },
  "Đăng ký": {
    "en": "Register",
    "zh": "注册"
  },
  "Quản lý Showroom": {
    "en": "Showroom Manager",
    "zh": "展厅经理"
  },
  "Nhân viên Showroom": {
    "en": "Showroom Staff",
    "zh": "展厅员工"
  },
  "Hồ sơ cá nhân": {
    "en": "My Profile",
    "zh": "个人资料"
  },
  "Tin đăng của tôi": {
    "en": "My Listings",
    "zh": "我的车源"
  },
  "Đăng xuất": {
    "en": "Logout",
    "zh": "退出登录"
  },
  "Trang chủ": {
    "en": "Home",
    "zh": "首页"
  },
  "Ô tô mới": {
    "en": "New Cars",
    "zh": "新车"
  },
  "Ô tô cũ": {
    "en": "Used Cars",
    "zh": "二手车"
  },
  "Tin tức & Đánh giá": {
    "en": "News & Reviews",
    "zh": "新闻与评测"
  },
  "Giới thiệu": {
    "en": "About Us",
    "zh": "关于我们"
  },
  "Duyệt tin Showroom": {
    "en": "Showroom Approval",
    "zh": "展厅审核"
  },
  "+ Đăng bán xe": {
    "en": "+ Post Car",
    "zh": "+ 发布卖车"
  },
  "+ Đăng bán xe mới": {
    "en": "+ Post New Car",
    "zh": "+ 发布新车"
  },
  "Danh sách xe yêu thích": {
    "en": "Favorite Cars",
    "zh": "收藏车源"
  },
  "Xe yêu thích": {
    "en": "Favorite Cars",
    "zh": "心仪收藏"
  },
  "Nền tảng công nghệ kết nối mua bán ô tô minh bạch hàng đầu Việt Nam. Cung cấp giải pháp số hóa toàn diện từ tìm kiếm, kiểm định thực tế đến kết nối liên hệ xem xe và hỗ trợ thanh toán an toàn.": {
    "en": "Vietnam's premier transparent car trading platform. Complete digital solutions from car search and physical inspection to direct seller connection and secure payment assistance.",
    "zh": "越南领先的透明汽车在线交易平台。提供从搜索、实车质检到直接预约看车及安全支付支持的全流程数字化解决方案。"
  },
  "Nền tảng công nghệ kết nối mua bán ô tô minh bạch hàng đầu Việt Nam.": {
    "en": "Vietnam's premier transparent car trading platform.",
    "zh": "越南领先的透明汽车在线交易平台。"
  },
  "Về OtoMarket": {
    "en": "About OtoMarket",
    "zh": "关于 OtoMarket"
  },
  "Giới thiệu công ty": {
    "en": "Company Profile",
    "zh": "公司介绍"
  },
  "Quy trình kiểm định": {
    "en": "Inspection Process",
    "zh": "质检验车流程"
  },
  "Quy định đăng tin": {
    "en": "Listing Policies",
    "zh": "发布管理规则"
  },
  "Câu hỏi thường gặp": {
    "en": "FAQs",
    "zh": "常见问题解答"
  },
  "Dành cho người dùng": {
    "en": "User Portal",
    "zh": "用户中心"
  },
  "Dành Cho Khách Hàng": {
    "en": "For Customers",
    "zh": "客户专属"
  },
  "Tìm kiếm xe đang bán": {
    "en": "Browse Cars for Sale",
    "zh": "查找在售车源"
  },
  "Ước tính vay trả góp": {
    "en": "Loan Calculator",
    "zh": "分期还款估算"
  },
  "Dự tính giá lăn bánh": {
    "en": "On-the-road Price",
    "zh": "落地价格测算"
  },
  "Đăng tin bán xe": {
    "en": "Post Car for Sale",
    "zh": "发布卖车信息"
  },
  "Quản lý tin đăng": {
    "en": "Manage My Listings",
    "zh": "管理我的发布"
  },
  "Thông tin tài khoản": {
    "en": "Account Info",
    "zh": "账户资料"
  },
  "Các Dòng Xe Tiêu Biểu": {
    "en": "Featured Models",
    "zh": "热门精选车型"
  },
  "Thông tin liên hệ": {
    "en": "Contact Us",
    "zh": "联系方式"
  },
  "Văn Phòng & Hotline": {
    "en": "Office & Hotline",
    "zh": "办公地址与热线"
  },
  "Trụ sở: TP. Nha Trang, Khánh Hòa": {
    "en": "HQ: Nha Trang City, Khanh Hoa",
    "zh": "总部：庆和省芽庄市"
  },
  "Văn phòng: Q. 1, TP. Hồ Chí Minh": {
    "en": "Branch: Dist. 1, Ho Chi Minh City",
    "zh": "分部：胡志明市第一郡"
  },
  "Hotline: 1900 6868": {
    "en": "Hotline: 1900 6868",
    "zh": "服务热线: 1900 6868"
  },
  "Email: support@otomarket.vn": {
    "en": "Email: support@otomarket.vn",
    "zh": "电子邮箱: support@otomarket.vn"
  },
  "Đường Trần Phú, TP. Nha Trang": {
    "en": "Tran Phu St., Nha Trang City",
    "zh": "芽庄市陈富路"
  },
  "2026 OtoMarket - Sàn Giao Dịch Xe Uy Tín Hàng Đầu": {
    "en": "2026 OtoMarket - Premier Trusted Car Trading Platform",
    "zh": "2026 OtoMarket - 领先可信的汽车交易平台"
  },
  "2026 OtoMarket - Sàn Giao Dịch Mua Bán Ô Tô Trực Tuyến": {
    "en": "2026 OtoMarket - Online Car Marketplace",
    "zh": "2026 OtoMarket - 在线汽车买卖交易平台"
  },
  "Tổng đài miễn cước 24/7": {
    "en": "Toll-free 24/7",
    "zh": "24/7 免费热线"
  },
  "Tìm Chiếc Xe Phù Hợp Theo Nhu Cầu Của Bạn": {
    "en": "Find the Perfect Car for Your Needs",
    "zh": "根据您的需求寻找理想座驾"
  },
  "Nền tảng kết nối trực tiếp người mua và người bán ô tô uy tín. Thông tin xe minh bạch, kiểm tra thực tế, liên hệ trực tiếp chính chủ.": {
    "en": "Direct connection between trusted car buyers and sellers. Transparent specs, verified inspections, direct owner contact.",
    "zh": "直接连接可信买家与卖家的汽车交易平台。车况透明，实车质检，直接联系车主。"
  },
  "Khám phá kho xe ngay": {
    "en": "Explore Inventory Now",
    "zh": "立即浏览车库"
  },
  "Cuộn để tìm xe": {
    "en": "Scroll to discover",
    "zh": "向下滚动找车"
  },
  "XE NỔI BẬT ĐÃ KIỂM ĐỊNH": {
    "en": "CERTIFIED FEATURED VEHICLES",
    "zh": "精选已质检认证车源"
  },
  "Xe Mới Về Showroom - Đang Chào Bán": {
    "en": "New Arrivals - Now Available",
    "zh": "展厅最新到店 - 火热在售"
  },
  "Xe đã qua kiểm định chất lượng, cam kết không đâm đụng, thủy kích. Đầy đủ giấy tờ hợp pháp.": {
    "en": "Quality-certified vehicles, guaranteed accident-free and flood-free. Full legal documentation.",
    "zh": "经过严谨质检，承诺无重大事故、无水泡，手续合法齐全。"
  },
  "Xem tất cả kho xe": {
    "en": "View All Cars",
    "zh": "查看全部车辆"
  },
  "Xem toàn bộ kho xe": {
    "en": "View Full Inventory",
    "zh": "浏览完整车库"
  },
  "TIN TỨC & ĐÁNH GIÁ CHUYÊN SÂU": {
    "en": "IN-DEPTH NEWS & REVIEWS",
    "zh": "汽车新闻与深度评测"
  },
  "Tin Tức & Đánh Giá Xe - Cẩm Nang Kinh Nghiệm": {
    "en": "Car News & Reviews - Expert Buying Guide",
    "zh": "汽车新闻评测 - 实用购车经验指南"
  },
  "Xem tất cả bài viết & đánh giá": {
    "en": "View all articles & reviews",
    "zh": "查看所有文章与评测"
  },
  "Xem tất cả bài viết": {
    "en": "View all articles",
    "zh": "查看全部文章"
  },
  "Vì Sao Nên Mua Bán Xe Tại OtoMarket?": {
    "en": "Why Buy & Sell on OtoMarket?",
    "zh": "为什么选择 OtoMarket？"
  },
  "Thông Tin Rõ Ràng": {
    "en": "Transparent Details",
    "zh": "信息真实透明"
  },
  "Mô tả thông số, hình ảnh thực tế và giá bán do người đăng cung cấp công khai minh bạch.": {
    "en": "Clear specifications, real vehicle photos, and transparent pricing directly from sellers.",
    "zh": "规格参数清晰、实车实景拍照、卖家公开真实报价。"
  },
  "Liên Hệ Trực Tiếp": {
    "en": "Direct Contact",
    "zh": "直接沟通联系"
  },
  "Người mua gọi điện hoặc nhắn tin trực tiếp với chủ xe, không qua trung gian môi giới.": {
    "en": "Buyers contact car owners directly with zero middleman fees or brokers.",
    "zh": "买家可直接与车主致电或在线沟通，无中间商中介费。"
  },
  "Hẹn Gặp Xem Xe": {
    "en": "Test Drive & Inspection",
    "zh": "预约试驾看车"
  },
  "Khuyến khích người mua gặp mặt trực tiếp để lái thử và kiểm tra tình trạng xe thực tế.": {
    "en": "Encouraging in-person meetings for test drives and direct condition inspections.",
    "zh": "鼓励买家现场试驾体验，实地核查车况与各项机械性能。"
  },
  "Giao Dịch Minh Bạch": {
    "en": "Secure Deal Closure",
    "zh": "合规安全过户"
  },
  "Hai bên chủ động kiểm tra giấy tờ gốc và thực hiện thủ tục mua bán theo quy định.": {
    "en": "Both parties independently review legal documents and complete paperwork per regulations.",
    "zh": "双方自主核验原始合法证件，依照法规合规办理过户手续。"
  },
  "Kho Ô Tô Đang Bán": {
    "en": "Cars for Sale",
    "zh": "在售车辆展厅"
  },
  "Kho Ô Tô Mới Chính Hãng": {
    "en": "Brand New Official Cars",
    "zh": "官方授权正品新车"
  },
  "Xe mới 100% nguyên bản, đầy đủ sổ bảo hành chính hãng, niêm yết giá minh bạch.": {
    "en": "100% brand new, authentic manufacturer warranty, transparent list pricing.",
    "zh": "100% 全新原厂正品，附带官方保修手册，全国统一透明报价。"
  },
  "Kho Ô Tô Đã Qua Sử Dụng Chất Lượng": {
    "en": "Certified Pre-Owned Cars",
    "zh": "严选高品质二手车"
  },
  "Xe lướt & chính chủ đã kiểm duyệt kỹ thuật, cam kết không đâm đụng, thủy kích.": {
    "en": "Inspected low-mileage & owner-listed cars, guaranteed accident-free and flood-free.",
    "zh": "准新车及一手车源，经过专业技术质检，保证无事故、无泡水。"
  },
  "Tất cả kho xe": {
    "en": "All Inventory",
    "zh": "全部车库"
  },
  "Hãng xe:": {
    "en": "Brand:",
    "zh": "汽车品牌:"
  },
  "BỘ LỌC TÌM KIẾM": {
    "en": "SEARCH FILTERS",
    "zh": "筛选条件"
  },
  "Đặt lại": {
    "en": "Reset",
    "zh": "重置"
  },
  "Đặt lại tất cả bộ lọc": {
    "en": "Reset All Filters",
    "zh": "重置全部筛选"
  },
  "TỪ KHÓA XE": {
    "en": "KEYWORD",
    "zh": "车型关键词"
  },
  "Nhập tên xe, mẫu xe...": {
    "en": "Enter car name, model...",
    "zh": "输入车名、车系..."
  },
  "KHOẢNG GIÁ BÁN": {
    "en": "PRICE RANGE",
    "zh": "价格预算区间"
  },
  "Dưới 600tr": {
    "en": "Under 600M",
    "zh": "6亿以下"
  },
  "600 - 900tr": {
    "en": "600 - 900M",
    "zh": "6亿 - 9亿"
  },
  "900tr - 1.2 tỷ": {
    "en": "900M - 1.2B",
    "zh": "9亿 - 12亿"
  },
  "Trên 1.2 tỷ": {
    "en": "Over 1.2B",
    "zh": "12亿以上"
  },
  "KIỂU DÁNG XE": {
    "en": "BODY TYPE",
    "zh": "车身款式"
  },
  "Bán tải": {
    "en": "Pickup",
    "zh": "皮卡"
  },
  "KHU VỰC XEM XE": {
    "en": "VIEWING LOCATION",
    "zh": "看车城市"
  },
  "Tất cả khu vực": {
    "en": "All Locations",
    "zh": "全部城市"
  },
  "Sắp xếp:": {
    "en": "Sort by:",
    "zh": "排序方式:"
  },
  "Mới đăng": {
    "en": "Newest",
    "zh": "最新发布"
  },
  "Giá thấp đến cao": {
    "en": "Price: Low to High",
    "zh": "价格从低到高"
  },
  "Giá cao đến thấp": {
    "en": "Price: High to Low",
    "zh": "价格从高到低"
  },
  "Năm sản xuất mới nhất": {
    "en": "Year: Newest",
    "zh": "出厂年份最新"
  },
  "Số km ít nhất": {
    "en": "Mileage: Lowest",
    "zh": "行驶里程最少"
  },
  "Trước": {
    "en": "Previous",
    "zh": "上一页"
  },
  "Sau": {
    "en": "Next",
    "zh": "下一页"
  },
  "Xe mới 100%": {
    "en": "100% New",
    "zh": "100%全新"
  },
  "Showroom chính hãng": {
    "en": "Official Showroom",
    "zh": "官方展厅"
  },
  "Chính chủ": {
    "en": "Direct Owner",
    "zh": "车主一手"
  },
  "Xe lướt": {
    "en": "Low Mileage",
    "zh": "准新车"
  },
  "Đã kiểm định": {
    "en": "Certified",
    "zh": "已认证"
  },
  "Xem chi tiết": {
    "en": "View Details",
    "zh": "查看详情"
  },
  "Tự động": {
    "en": "Automatic",
    "zh": "自动挡"
  },
  "Số sàn": {
    "en": "Manual",
    "zh": "手动挡"
  },
  "Xăng": {
    "en": "Gasoline",
    "zh": "汽油"
  },
  "Dầu": {
    "en": "Diesel",
    "zh": "柴油"
  },
  "Điện": {
    "en": "Electric",
    "zh": "纯电"
  },
  "triệu": {
    "en": "million",
    "zh": "百万"
  },
  "tỷ": {
    "en": "billion",
    "zh": "亿"
  },
  "Xe Tương Tự Cùng Phân Khúc & Tầm Giá": {
    "en": "Similar Cars in Same Segment & Price",
    "zh": "同级别及同价位推荐车源"
  },
  "Các mẫu xe đang chào bán sẵn tại showroom để bạn tham khảo thêm": {
    "en": "Available models at showroom for your reference and comparison",
    "zh": "展厅现车储备推荐供您对比参考"
  },
  "Thông tin kỹ thuật": {
    "en": "Technical Specifications",
    "zh": "技术参数详情"
  },
  "Năm sản xuất": {
    "en": "Manufacture Year",
    "zh": "出厂年份"
  },
  "Số km đã đi": {
    "en": "Odometer",
    "zh": "已行驶里程"
  },
  "Hộp số": {
    "en": "Transmission",
    "zh": "变速箱"
  },
  "Nhiên liệu": {
    "en": "Fuel Type",
    "zh": "燃料类型"
  },
  "Xuất xứ": {
    "en": "Origin",
    "zh": "产地来源"
  },
  "Màu sắc": {
    "en": "Exterior Color",
    "zh": "外观颜色"
  },
  "Bảo hành": {
    "en": "Warranty",
    "zh": "质保期限"
  },
  "Bảo hành chính hãng": {
    "en": "Factory Warranty",
    "zh": "官方原厂质保"
  },
  "Dự toán vay trả góp ngân hàng": {
    "en": "Bank Loan Installment Calculator",
    "zh": "银行分期购车还款测算"
  },
  "Mô tả chi tiết & Tuyên bố sàn": {
    "en": "Detailed Description & Platform Notice",
    "zh": "车辆详情描述与平台声明"
  },
  "Lưu ý giao dịch:": {
    "en": "Transaction Notice:",
    "zh": "交易注意事项:"
  },
  "Thông tin liên hệ người bán": {
    "en": "Seller Contact Info",
    "zh": "卖家联系方式"
  },
  "Gọi điện": {
    "en": "Call Now",
    "zh": "拨打电话"
  },
  "Nhắn Zalo": {
    "en": "Zalo Chat",
    "zh": "Zalo 咨询"
  },
  "Xem trang chi tiết xe": {
    "en": "View Car Page",
    "zh": "查看车辆主页"
  },
  "Tin Tức & Đánh Giá Xe": {
    "en": "Car News & In-depth Reviews",
    "zh": "汽车资讯与深度评测"
  },
  "Kinh nghiệm kiểm tra xe ô tô, đánh giá trải nghiệm thực tế và hướng dẫn thủ tục giấy tờ mua bán.": {
    "en": "Car inspection expertise, authentic road test reviews, and legal transfer procedures.",
    "zh": "实车质检技巧、真实道路试驾测评以及过户手续指南。"
  },
  "Tìm kiếm bài viết, kinh nghiệm, dòng xe...": {
    "en": "Search articles, buying guides, models...",
    "zh": "搜索文章、验车攻略、车系..."
  },
  "Chuyên mục:": {
    "en": "Categories:",
    "zh": "专栏分类:"
  },
  "Tất cả bài viết": {
    "en": "All Articles",
    "zh": "全部文章"
  },
  "Thị trường ô tô": {
    "en": "Auto Market",
    "zh": "车市动态"
  },
  "Đánh giá xe thực tế": {
    "en": "Hands-on Reviews",
    "zh": "实车评测"
  },
  "Kinh nghiệm xem xe cũ": {
    "en": "Used Car Tips",
    "zh": "二手车验车"
  },
  "Thủ tục & Pháp lý": {
    "en": "Legal & Paperwork",
    "zh": "手续与法规"
  },
  "Đọc tiếp": {
    "en": "Read More",
    "zh": "阅读全文"
  },
  "Kiến Tạo Chuẩn Mực Mới Trong Giao Dịch Ô Tô Trực Tuyến": {
    "en": "Creating New Standards in Online Car Trading",
    "zh": "树立在线汽车交易新标杆"
  },
  "Lượt tra cứu mỗi ngày": {
    "en": "Daily vehicle searches",
    "zh": "每日查询量"
  },
  "Tin xe đang hiển thị": {
    "en": "Active car listings",
    "zh": "在售有效车源"
  },
  "Kiểm duyệt tin nhanh chóng": {
    "en": "Rapid verification speed",
    "zh": "快速质检验核"
  },
  "Mạng lưới kết nối rộng rãi": {
    "en": "Nationwide network",
    "zh": "全国覆盖网络"
  },
  "Tỉnh": {
    "en": "Provinces",
    "zh": "省市"
  },
  "Phút": {
    "en": "Minutes",
    "zh": "分钟"
  },
  "Trụ sở chính: Đường Trần Phú, TP. Nha Trang, Tỉnh Khánh Hòa": {
    "en": "HQ: Tran Phu St., Nha Trang City, Khanh Hoa Province",
    "zh": "总部地址：庆和省芽庄市陈富路"
  },
  "Mô hình vận hành: Sàn kết nối trực tiếp Người Mua & Người Bán (C2C & B2C)": {
    "en": "Business Model: Direct Marketplace for Buyers & Sellers (C2C & B2C)",
    "zh": "运营模式：买卖双方直接撮合交易平台 (C2C & B2C)"
  },
  "Hotline hỗ trợ: 1900 6868 (08:00 – 18:30 hàng ngày)": {
    "en": "Hotline: 1900 6868 (08:00 – 18:30 daily)",
    "zh": "客服热线：1900 6868（每日 08:00 - 18:30）"
  },
  "Trạm Kiểm Duyệt & Quản Trị Showroom": {
    "en": "Showroom Inspection & Studio Admin",
    "zh": "展厅质检审核与管理中心"
  },
  "Trạm Duyệt Tin Xe": {
    "en": "Inspection Queue",
    "zh": "待审核车源"
  },
  "Báo Cáo Vi Phạm": {
    "en": "Violation Reports",
    "zh": "违规举报"
  },
  "Kho Xe Toàn Sàn": {
    "en": "Full Marketplace Inventory",
    "zh": "全平台车库"
  },
  "Hàng đợi thẩm định": {
    "en": "Pending Queue",
    "zh": "待审核队列"
  },
  "Bàn Thẩm Định Chi Tiết Xe": {
    "en": "Car Appraisal Desk",
    "zh": "实车核验工作台"
  },
  "Phê duyệt & Xuất bản lên sàn": {
    "en": "Approve & Publish",
    "zh": "通过并上架"
  },
  "Từ chối duyệt": {
    "en": "Reject Listing",
    "zh": "驳回审核"
  },
  "Đã chọn ngôn ngữ Tiếng Việt": {
    "en": "Language switched to Vietnamese",
    "zh": "已选择越南语"
  },
  "Language switched to English": {
    "en": "Language switched to English",
    "zh": "已切换为英语"
  },
  "已切换至中文语言": {
    "en": "Language switched to Chinese",
    "zh": "已切换至中文语言"
  }
};

  const DYNAMIC_PATTERNS = [
    {
      regex: /^Tìm thấy (\d+) xe phù hợp$/i,
      en: 'Found $1 matching cars',
      zh: '共找到 $1 辆匹配车源'
    },
    {
      regex: /^Trả trước:\s*(.*)$/i,
      en: 'Down payment: $1',
      zh: '首付款: $1'
    },
    {
      regex: /^(\d+)\s*phút đọc$/i,
      en: '$1 min read',
      zh: '$1 分钟阅读'
    },
    {
      regex: /^(\d+)\s*bài viết$/i,
      en: '$1 articles',
      zh: '$1 篇文章'
    },
    {
      regex: /^(\d+)\s*xe$/i,
      en: '$1 cars',
      zh: '$1 辆车'
    }
  ];

  function getStoredLanguage() {
    try {
      return localStorage.getItem('otomarket_lang') || 'vi';
    } catch(e) {
      return 'vi';
    }
  }

  function translateText(text, lang) {
    if (!text || lang === 'vi') return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. Direct dictionary match
    if (I18N_DICT[trimmed] && I18N_DICT[trimmed][lang]) {
      return text.replace(trimmed, I18N_DICT[trimmed][lang]);
    }

    // 2. Dynamic regex patterns
    for (const pat of DYNAMIC_PATTERNS) {
      if (pat.regex.test(trimmed)) {
        const replacement = pat[lang];
        if (replacement) {
          return text.replace(trimmed, trimmed.replace(pat.regex, replacement));
        }
      }
    }

    return text;
  }

  function walkAndTranslate(rootNode, lang) {
    if (!rootNode) return;

    // Process text nodes
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parentName = node.parentNode ? node.parentNode.nodeName : '';
          if (['SCRIPT', 'STYLE', 'CODE', 'NOSCRIPT', 'TEXTAREA'].includes(parentName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentNode && (node.parentNode.classList.contains('lang-opt') || node.parentNode.id === 'current-lang-text')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      if (currentNode._originalVi === undefined) {
        currentNode._originalVi = currentNode.nodeValue;
      }
      const original = currentNode._originalVi;
      if (lang === 'vi') {
        currentNode.nodeValue = original;
      } else {
        currentNode.nodeValue = translateText(original, lang);
      }
    }

    // Translate attributes: placeholder, title, aria-label
    const elements = rootNode.querySelectorAll ? rootNode.querySelectorAll('[placeholder], [title], [aria-label]') : [];
    elements.forEach(el => {
      if (el.classList.contains('lang-dropdown-container') || el.closest('.lang-dropdown-container')) return;

      ['placeholder', 'title', 'aria-label'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (val) {
          const prop = `_orig_${attr}`;
          if (el[prop] === undefined) {
            el[prop] = val;
          }
          const original = el[prop];
          if (lang === 'vi') {
            el.setAttribute(attr, original);
          } else {
            el.setAttribute(attr, translateText(original, lang));
          }
        }
      });
    });
  }

  function updateDropdownUI(lang) {
    const flagMap = { vi: '🇻🇳', en: '🇬🇧', zh: '🇨🇳' };
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };

    const flagEl = document.getElementById('current-lang-flag');
    const textEl = document.getElementById('current-lang-text');
    if (flagEl) flagEl.textContent = flagMap[lang] || '🇻🇳';
    if (textEl) textEl.textContent = textMap[lang] || 'Tiếng Việt';

    document.querySelectorAll('.lang-opt').forEach(opt => {
      opt.classList.remove('active');
    });
    const activeOpt = document.querySelector(`.lang-item-${lang}`);
    if (activeOpt) activeOpt.classList.add('active');
  }

  function mountLanguageSwitcher() {
    const container = document.querySelector('.lang-switch-container, .lang-dropdown-container');
    if (!container) return;

    const currentLang = getStoredLanguage();
    const flagMap = { vi: '🇻🇳', en: '🇬🇧', zh: '🇨🇳' };
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };

    container.className = 'dropdown lang-dropdown-container';
    container.style.display = 'inline-block';
    container.innerHTML = `
      <button class="topbar-lang-btn dropdown-toggle d-flex align-items-center gap-1.5" type="button" id="langDropdown" data-bs-toggle="dropdown" aria-expanded="false" title="Chọn ngôn ngữ / Select language">
        <span class="lang-flag" id="current-lang-flag" style="font-size: 1.05rem; line-height: 1;">${flagMap[currentLang] || '🇻🇳'}</span>
        <span class="lang-text fw-bold" id="current-lang-text" style="font-size: 0.8rem; letter-spacing: 0.2px;">${textMap[currentLang] || 'Tiếng Việt'}</span>
        <i class="bi bi-chevron-down ms-0.5" style="font-size: 0.65rem;"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 py-1.5 rounded-3" aria-labelledby="langDropdown" style="font-size: 0.85rem; min-width: 150px; z-index: 1060;">
        <li>
          <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-vi ${currentLang === 'vi' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('vi')">
            <span style="font-size: 1.05rem;">🇻🇳</span>
            <span class="fw-medium">Tiếng Việt</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-en ${currentLang === 'en' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('en')">
            <span style="font-size: 1.05rem;">🇬🇧</span>
            <span class="fw-medium">English</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-zh ${currentLang === 'zh' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('zh')">
            <span style="font-size: 1.05rem;">🇨🇳</span>
            <span class="fw-medium">中文 (China)</span>
          </a>
        </li>
      </ul>
    `;
  }

  function setSiteLanguage(lang, showNotification = true) {
    if (!['vi', 'en', 'zh'].includes(lang)) lang = 'vi';
    try {
      localStorage.setItem('otomarket_lang', lang);
    } catch(e) {}

    updateDropdownUI(lang);
    walkAndTranslate(document.body, lang);

    if (showNotification && typeof window.showToast === 'function') {
      const msg = {
        vi: 'Đã chọn ngôn ngữ Tiếng Việt',
        en: 'Language switched to English',
        zh: '已切换至中文语言'
      }[lang];
      window.showToast(msg, 'info');
    }
  }

  // Public APIs
  window.setSiteLanguage = setSiteLanguage;
  window.switchLanguage = function(lang) {
    const l = String(lang).toLowerCase();
    if (l.includes('en')) setSiteLanguage('en');
    else if (l.includes('zh') || l.includes('cn')) setSiteLanguage('zh');
    else setSiteLanguage('vi');
  };
  window.applyCurrentSiteLanguage = function(rootEl) {
    const lang = getStoredLanguage();
    walkAndTranslate(rootEl || document.body, lang);
  };

  // Auto initialize on DOM ready
  function initI18n() {
    mountLanguageSwitcher();
    const currentLang = getStoredLanguage();
    updateDropdownUI(currentLang);
    if (currentLang !== 'vi') {
      walkAndTranslate(document.body, currentLang);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }

  // Observe dynamic content updates (e.g. filtered car cards, modal opening)
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      const currentLang = getStoredLanguage();
      if (currentLang === 'vi') return;
      
      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          for (const n of m.addedNodes) {
            if (n.nodeType === Node.ELEMENT_NODE && !n.classList.contains('lang-dropdown-container')) {
              walkAndTranslate(n, currentLang);
            }
          }
        }
      }
    });
    
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

})(window);
