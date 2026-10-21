/**
 * OtoMarket - Logic & Ứng dụng chính (JavaScript)
 * Quản lý LocalStorage, Yêu thích, Tin đăng demo, Xác thực mẫu, Toasts, Báo cáo vi phạm
 */

const STORAGE_KEYS = {
  FAVORITES: 'otomarket_favorites',
  CUSTOM_LISTINGS: 'otomarket_custom_listings',
  AUTH_USER: 'otomarket_user',
  REGISTERED_USERS: 'otomarket_registered_users',
  REPORTS: 'otomarket_reports'
};

// Chuẩn hóa trạng thái tin đăng
const LISTING_STATUS = {
  DRAFT: 'draft',       // Bản nháp
  PENDING: 'pending',   // Chờ Showroom duyệt, không công khai
  ACTIVE: 'active',     // Đã duyệt và đang công khai
  REJECTED: 'rejected', // Bị từ chối, có lý do
  HIDDEN: 'hidden',     // Người bán chủ động ẩn
  SOLD: 'sold'          // Xe đã bán
};

// Tuyên bố kiểm duyệt thống nhất
const OTOMARKET_DISCLAIMER = "OtoMarket chỉ kiểm duyệt nội dung tin đăng. Việc phê duyệt không đồng nghĩa với xác nhận chất lượng, quyền sở hữu hoặc tình trạng pháp lý của xe. Người mua cần trực tiếp kiểm tra xe và giấy tờ trước khi giao dịch.";

if (typeof window !== 'undefined') {
  window.LISTING_STATUS = LISTING_STATUS;
  window.OTOMARKET_DISCLAIMER = OTOMARKET_DISCLAIMER;
}

// Chuẩn hóa cấu trúc tin đăng
function normalizeListing(item) {
  if (!item || typeof item !== 'object') return item;

  const status = item.status && Object.values(LISTING_STATUS).includes(item.status)
    ? item.status
    : LISTING_STATUS.PENDING;

  const condition = (item.condition === 'new' || item.condition === 'used')
    ? item.condition
    : (item.isNew ? 'new' : 'used');

  const isNew = condition === 'new';
  const mileage = isNew ? 0 : (item.mileage !== undefined ? item.mileage : 0);
  const mileageDisplay = isNew ? "Xe mới" : (item.mileageDisplay || `${mileage.toLocaleString()} km`);

  let createdAt = item.createdAt;
  if (!createdAt) {
    if (item.postedDate && typeof item.postedDate === 'string') {
      const parts = item.postedDate.split('/');
      if (parts.length === 3) {
        createdAt = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T08:00:00.000Z`).toISOString();
      }
    }
    if (!createdAt) {
      createdAt = new Date('2026-10-06T08:00:00.000Z').toISOString();
    }
  }

  const submittedAt = item.submittedAt !== undefined
    ? item.submittedAt
    : (status === LISTING_STATUS.DRAFT ? null : createdAt);

  const reviewedAt = item.reviewedAt !== undefined
    ? item.reviewedAt
    : (status === LISTING_STATUS.ACTIVE || status === LISTING_STATUS.REJECTED ? createdAt : null);

  const reviewedBy = item.reviewedBy !== undefined
    ? item.reviewedBy
    : (status === LISTING_STATUS.ACTIVE ? 'Quản lý Showroom' : null);

  const rejectReason = item.rejectReason !== undefined ? item.rejectReason : null;

  let reviewHistory = Array.isArray(item.reviewHistory) ? [...item.reviewHistory] : [];
  if (reviewHistory.length === 0) {
    if (submittedAt) {
      reviewHistory.push({
        action: 'submit',
        status: LISTING_STATUS.PENDING,
        timestamp: submittedAt,
        by: item.ownerId || 'user-demo-1',
        note: 'Gửi yêu cầu đăng tin'
      });
    }
    if (reviewedAt) {
      reviewHistory.push({
        action: status === LISTING_STATUS.ACTIVE ? 'approve' : 'review',
        status: status,
        timestamp: reviewedAt,
        by: reviewedBy || 'Quản lý Showroom',
        reason: rejectReason,
        note: status === LISTING_STATUS.ACTIVE ? 'Đã phê duyệt tin đăng' : 'Đã xem xét tin đăng'
      });
    }
  }

  const isShowroom = (item.sourceType === 'showroom') || 
                     (item.sellerType && (item.sellerType.includes('Đại lý') || item.sellerType.includes('Showroom') || item.sellerType.includes('Salon')));
  const sourceType = isShowroom ? 'showroom' : 'external';
  const sellerType = isShowroom ? 'Xe Showroom' : 'Người bán cá nhân';

  return {
    ...item,
    ownerId: item.ownerId || 'user-demo-1',
    status: status,
    condition: condition,
    isNew: isNew,
    sourceType: sourceType,
    sellerType: sellerType,
    isShowroom: isShowroom,
    mileage: mileage,
    mileageDisplay: mileageDisplay,
    rejectReason: rejectReason,
    createdAt: createdAt,
    submittedAt: submittedAt,
    reviewedAt: reviewedAt,
    reviewedBy: reviewedBy,
    reviewHistory: reviewHistory
  };
}

// Khởi tạo dữ liệu mẫu LocalStorage
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTINGS)) {
    const defaultUserListings = [
      normalizeListing({
        id: "custom-1",
        title: "Honda CR-V L 2023",
        brand: "Honda",
        model: "CR-V",
        version: "1.5L Turbo",
        year: 2023,
        price: 998000000,
        priceDisplay: "998 triệu",
        mileage: 16000,
        mileageDisplay: "16.000 km",
        fuel: "Xăng",
        transmission: "Tự động",
        bodyType: "SUV",
        seats: 7,
        color: "Đen ánh kim",
        interiorColor: "Đen",
        origin: "Lắp ráp trong nước",
        location: "Hà Nội",
        sellerType: "Chính chủ",
        sellerName: "Nguyễn Hoàng Nam",
        sellerPhone: "0912 345 678",
        sellerAddress: "Hoàng Mai, Hà Nội",
        image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80",
        images: ["https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"],
        isFeatured: false,
        isNew: false,
        condition: "used",
        postedDate: "06/10/2026",
        viewCount: 142,
        ownerId: "user-demo-1",
        status: LISTING_STATUS.ACTIVE,
        rejectReason: null,
        createdAt: "2026-10-06T08:00:00.000Z",
        submittedAt: "2026-10-06T08:30:00.000Z",
        reviewedAt: "2026-10-06T09:00:00.000Z",
        reviewedBy: "Quản lý Showroom",
        reviewHistory: [
          { action: "submit", status: LISTING_STATUS.PENDING, timestamp: "2026-10-06T08:30:00.000Z", by: "user-demo-1", note: "Gửi yêu cầu đăng tin" },
          { action: "approve", status: LISTING_STATUS.ACTIVE, timestamp: "2026-10-06T09:00:00.000Z", by: "Quản lý Showroom", reason: null, note: "Đã phê duyệt tin đăng" }
        ],
        description: "Xe gia đình đi giữ gìn cẩn thận, bảo dưỡng định kỳ tại hãng. " + OTOMARKET_DISCLAIMER,
        specifications: { engine: "1.5L VTEC", power: "188 hp", drivetrain: "FWD", registrationExpiry: "Tháng 08/2027", warranty: "Theo quy định người bán" }
      }),
      normalizeListing({
        id: "custom-2",
        title: "Mazda CX-30 Premium 2023",
        brand: "Mazda",
        model: "CX-30",
        version: "2.0 Premium",
        year: 2023,
        price: 709000000,
        priceDisplay: "709 triệu",
        mileage: 11000,
        mileageDisplay: "11.000 km",
        fuel: "Xăng",
        transmission: "Tự động",
        bodyType: "SUV",
        seats: 5,
        color: "Đỏ pha lê",
        interiorColor: "Nâu phối xanh",
        origin: "Nhập khẩu Thái Lan",
        location: "TP. Hồ Chí Minh",
        sellerType: "Chính chủ",
        sellerName: "Nguyễn Hoàng Nam",
        sellerPhone: "0912 345 678",
        sellerAddress: "Quận 1, TP. Hồ Chí Minh",
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80",
        images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80"],
        isFeatured: false,
        isNew: false,
        condition: "used",
        postedDate: "09/10/2026",
        viewCount: 28,
        ownerId: "user-demo-1",
        status: LISTING_STATUS.PENDING,
        rejectReason: null,
        createdAt: "2026-10-09T08:00:00.000Z",
        submittedAt: "2026-10-09T08:15:00.000Z",
        reviewedAt: null,
        reviewedBy: null,
        reviewHistory: [
          { action: "submit", status: LISTING_STATUS.PENDING, timestamp: "2026-10-09T08:15:00.000Z", by: "user-demo-1", note: "Gửi yêu cầu đăng tin" }
        ],
        description: "Xe nhập khẩu nguyên chiếc từ Thái Lan. " + OTOMARKET_DISCLAIMER,
        specifications: { engine: "SkyActiv-G 2.0L", power: "153 hp", drivetrain: "FWD", registrationExpiry: "Tháng 10/2027", warranty: "Theo quy định" }
      }),
      normalizeListing({
        id: "custom-3",
        title: "Hyundai Tucson 2.0ATH Đặc Biệt 2021 Trắng",
        brand: "Hyundai",
        model: "Tucson",
        version: "2.0ATH Đặc Biệt",
        year: 2021,
        price: 620000000,
        priceDisplay: "620 triệu",
        mileage: 38000,
        mileageDisplay: "38.000 km",
        fuel: "Xăng",
        transmission: "Tự động",
        bodyType: "SUV",
        seats: 5,
        color: "Trắng",
        interiorColor: "Đen",
        origin: "Lắp ráp trong nước",
        location: "Đà Nẵng",
        sellerType: "Chính chủ",
        sellerName: "Nguyễn Hoàng Nam",
        sellerPhone: "0912 345 678",
        sellerAddress: "Hải Châu, Đà Nẵng",
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80",
        images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80"],
        isFeatured: false,
        isNew: false,
        condition: "used",
        postedDate: "12/10/2026",
        viewCount: 15,
        ownerId: "user-demo-1",
        status: LISTING_STATUS.REJECTED,
        rejectReason: "Ảnh chụp đuôi xe bị mờ và biển số chưa rõ nét. Vui lòng bổ sung ảnh chụp thực tế rõ ràng ngoài ánh sáng ban ngày.",
        createdAt: "2026-10-12T08:00:00.000Z",
        submittedAt: "2026-10-12T08:30:00.000Z",
        reviewedAt: "2026-10-12T09:15:00.000Z",
        reviewedBy: "Quản lý Showroom",
        reviewHistory: [
          { action: "submit", status: LISTING_STATUS.PENDING, timestamp: "2026-10-12T08:30:00.000Z", by: "user-demo-1", note: "Gửi yêu cầu đăng tin" },
          { action: "reject", status: LISTING_STATUS.REJECTED, timestamp: "2026-10-12T09:15:00.000Z", by: "Quản lý Showroom", reason: "Ảnh chụp đuôi xe bị mờ và biển số chưa rõ nét. Vui lòng bổ sung ảnh chụp thực tế rõ ràng ngoài ánh sáng ban ngày.", note: "Từ chối duyệt: Ảnh chụp đuôi xe bị mờ và biển số chưa rõ nét." }
        ],
        description: "Xe gia đình một chủ từ đầu, bảo dưỡng hãng đầy đủ. " + OTOMARKET_DISCLAIMER,
        specifications: { engine: "Nu 2.0L MPI", power: "155 hp", drivetrain: "FWD", registrationExpiry: "Tháng 05/2027", warranty: "Theo quy định" }
      })
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(defaultUserListings));
  }
}

function getRawSampleCars() {
  if (window.WP_CARS && Array.isArray(window.WP_CARS) && window.WP_CARS.length > 0) {
    return window.WP_CARS;
  }
  return typeof SAMPLE_CARS !== 'undefined' ? SAMPLE_CARS : [];
}

// 1. Hàm getPublicCars() chỉ trả về xe mẫu hợp lệ và tin user có status=active
function getPublicCars() {
  const customListings = getCustomListings();
  const activeCustom = customListings.filter(c => c.status === LISTING_STATUS.ACTIVE);
  const rawList = getRawSampleCars();
  const normalizedSamples = rawList.map(car => normalizeListing({
    ...car,
    status: LISTING_STATUS.ACTIVE,
    condition: car.condition || (car.isNew ? 'new' : 'used')
  }));
  return [...normalizedSamples, ...activeCustom];
}

function getAllCars(includePending = false) {
  const customListings = getCustomListings();
  let availableCustom = customListings;
  if (!includePending) {
    availableCustom = customListings.filter(c => c.status === LISTING_STATUS.ACTIVE);
  }
  const rawList = getRawSampleCars();
  const normalizedSamples = rawList.map(car => normalizeListing({
    ...car,
    status: LISTING_STATUS.ACTIVE,
    condition: car.condition || (car.isNew ? 'new' : 'used')
  }));
  return [...normalizedSamples, ...availableCustom];
}

function getCarById(id) {
  const all = getAllCars(true);
  return all.find(c => c.id === id || String(c.wp_id) === String(id) || String(c.id) === `wp-${id}`) || null;
}

function getCustomListings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTINGS);
    if (!data) return [];
    const list = JSON.parse(data);
    if (!Array.isArray(list)) return [];
    return list.map(item => normalizeListing(item));
  } catch (e) {
    console.error("Error reading custom listings:", e);
    return [];
  }
}

// Lưu tin đăng mới
function saveCustomListing(carData) {
  const listings = getCustomListings();
  const currentUser = getLoggedInUser();
  const now = new Date().toISOString();
  const ownerId = carData.ownerId || (currentUser ? (currentUser.id || currentUser.email) : 'user-demo-1');

  const newListing = normalizeListing({
    ...carData,
    ownerId: ownerId,
    status: carData.status || LISTING_STATUS.PENDING,
    rejectReason: carData.rejectReason !== undefined ? carData.rejectReason : null,
    createdAt: carData.createdAt || now,
    submittedAt: carData.submittedAt !== undefined
      ? carData.submittedAt
      : (carData.status === LISTING_STATUS.DRAFT ? null : now),
    reviewedAt: carData.reviewedAt !== undefined ? carData.reviewedAt : null,
    reviewedBy: carData.reviewedBy !== undefined ? carData.reviewedBy : null,
    reviewHistory: Array.isArray(carData.reviewHistory) && carData.reviewHistory.length > 0
      ? carData.reviewHistory
      : [
          {
            action: carData.status === LISTING_STATUS.DRAFT ? 'draft' : 'submit',
            status: carData.status || LISTING_STATUS.PENDING,
            timestamp: now,
            by: ownerId,
            note: carData.status === LISTING_STATUS.DRAFT ? 'Lưu bản nháp' : 'Gửi yêu cầu đăng tin'
          }
        ]
  });

  listings.unshift(newListing);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
  return newListing;
}

// Cập nhật trạng thái tin đăng với ghi nhận vào reviewHistory
function updateListingStatus(id, newStatus, reason = "", reviewer = null) {
  const listings = getCustomListings();
  const index = listings.findIndex(c => c.id === id);
  if (index !== -1) {
    const currentUser = getLoggedInUser();
    const now = new Date().toISOString();
    const item = listings[index];
    const prevStatus = item.status;
    const adminName = reviewer || (currentUser && currentUser.name) || 'Quản lý Showroom';

    item.status = newStatus;

    if (newStatus === LISTING_STATUS.REJECTED) {
      item.rejectReason = reason || "Không đạt tiêu chuẩn kiểm duyệt";
      item.reviewedAt = now;
      item.reviewedBy = adminName;
    } else if (newStatus === LISTING_STATUS.ACTIVE) {
      item.rejectReason = null;
      item.reviewedAt = now;
      item.reviewedBy = adminName;
    } else if (newStatus === LISTING_STATUS.PENDING) {
      item.submittedAt = now;
      item.rejectReason = null;
    }

    if (!Array.isArray(item.reviewHistory)) {
      item.reviewHistory = [];
    }

    let actionName = 'update';
    let noteText = `Chuyển trạng thái từ ${prevStatus} sang ${newStatus}`;
    if (newStatus === LISTING_STATUS.PENDING) {
      actionName = 'submit';
      noteText = 'Gửi yêu cầu xét duyệt tin đăng';
    } else if (newStatus === LISTING_STATUS.ACTIVE) {
      actionName = 'approve';
      noteText = 'Phê duyệt tin đăng thành công';
    } else if (newStatus === LISTING_STATUS.REJECTED) {
      actionName = 'reject';
      noteText = `Từ chối duyệt: ${item.rejectReason}`;
    } else if (newStatus === LISTING_STATUS.HIDDEN) {
      actionName = 'hide';
      noteText = 'Ẩn tin đăng';
    } else if (newStatus === LISTING_STATUS.SOLD) {
      actionName = 'sold';
      noteText = 'Đánh dấu xe đã bán';
    } else if (newStatus === LISTING_STATUS.DRAFT) {
      actionName = 'draft';
      noteText = 'Lưu bản nháp';
    }

    item.reviewHistory.push({
      action: actionName,
      status: newStatus,
      timestamp: now,
      by: (currentUser ? (currentUser.name || currentUser.email) : 'System'),
      reason: item.rejectReason,
      note: noteText
    });

    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
    return item;
  }
  return null;
}

// Cập nhật thông tin tin đăng
function updateListingData(id, updatedData) {
  const listings = getCustomListings();
  const index = listings.findIndex(c => c.id === id);
  if (index !== -1) {
    const currentUser = getLoggedInUser();
    const now = new Date().toISOString();
    const item = listings[index];

    const importantFieldsChanged = updatedData.price !== undefined && updatedData.price !== item.price ||
      updatedData.title !== undefined && updatedData.title !== item.title ||
      updatedData.description !== undefined && updatedData.description !== item.description;

    const newStatus = (item.status === LISTING_STATUS.ACTIVE && importantFieldsChanged)
      ? LISTING_STATUS.PENDING
      : item.status;

    const updated = normalizeListing({
      ...item,
      ...updatedData,
      status: newStatus,
      submittedAt: newStatus === LISTING_STATUS.PENDING ? now : item.submittedAt
    });

    if (!Array.isArray(updated.reviewHistory)) {
      updated.reviewHistory = [];
    }

    updated.reviewHistory.push({
      action: newStatus === LISTING_STATUS.PENDING ? 'submit' : 'edit',
      status: newStatus,
      timestamp: now,
      by: (currentUser ? (currentUser.name || currentUser.email) : 'User'),
      note: newStatus === LISTING_STATUS.PENDING ? 'Chỉnh sửa nội dung quan trọng, yêu cầu duyệt lại' : 'Cập nhật thông tin tin đăng'
    });

    listings[index] = updated;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
    return updated;
  }
  return null;
}

// Xóa tin
function deleteCustomListing(id) {
  let listings = getCustomListings();
  listings = listings.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
}

// Quản lý yêu thích theo tài khoản (userId hoặc guest)
function getCurrentUserId() {
  const user = getLoggedInUser();
  if (user && (user.id || user.email)) {
    return user.id || user.email;
  }
  return 'guest';
}

function getFavorites() {
  const userId = getCurrentUserId();
  const key = `otomarket_favorites_${userId}`;
  try {
    let list = JSON.parse(localStorage.getItem(key) || 'null');
    // Nếu danh sách của tài khoản hiện tại đang trống, tự động gộp từ guest hoặc key cũ
    if (!list || list.length === 0) {
      const guestData = JSON.parse(localStorage.getItem('otomarket_favorites_guest') || 'null');
      const legacyData = JSON.parse(localStorage.getItem('otomarket_favorites') || 'null');
      const fallback = (guestData && guestData.length > 0) ? guestData : ((legacyData && legacyData.length > 0) ? legacyData : null);
      if (fallback && fallback.length > 0) {
        list = fallback;
        localStorage.setItem(key, JSON.stringify(list));
      }
    }
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  const userId = getCurrentUserId();
  const key = `otomarket_favorites_${userId}`;
  localStorage.setItem(key, JSON.stringify(favs));
}

function isFavorite(carId) {
  const favs = getFavorites();
  return favs.includes(carId);
}

function toggleFavorite(carId) {
  const allCars = getAllCars(true);
  const car = allCars.find(c => c.id === carId);
  if (!car || car.status !== LISTING_STATUS.ACTIVE) {
    showToast("Chỉ có thể lưu các tin đang hoạt động vào yêu thích", "warning");
    return false;
  }

  const user = getLoggedInUser();
  let favs = getFavorites();
  const index = favs.indexOf(carId);
  let added = false;
  if (index > -1) {
    favs.splice(index, 1);
    showToast("Đã xóa khỏi danh sách yêu thích", "info");
    added = false;
  } else {
    favs.push(carId);
    if (!user) {
      showToast("Đã lưu vào danh sách yêu thích (Chế độ Khách)", "success");
    } else {
      showToast("Đã thêm vào danh sách xe yêu thích", "success");
    }
    added = true;
  }
  saveFavorites(favs);
  updateFavoritesCountBadge();
  return added;
}

// Báo cáo vi phạm
function getReports() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  } catch(e) {
    return [];
  }
}

function saveReport(reportData) {
  const reports = getReports();
  const user = getLoggedInUser();
  const newReport = {
    id: `rep-${Date.now()}`,
    listingId: reportData.listingId,
    reporterId: user ? (user.id || user.email) : 'guest',
    reason: reportData.reason,
    description: reportData.description || '',
    status: 'pending', // pending, processing, resolved
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null
  };
  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  return newReport;
}

function updateReportStatus(reportId, status, adminName = 'Quản lý Showroom') {
  const reports = getReports();
  const report = reports.find(r => r.id === reportId);
  if (report) {
    report.status = status;
    const isResolved = status === 'resolved';
    report.resolvedAt = isResolved ? new Date().toISOString() : null;
    report.resolvedBy = isResolved ? adminName : null;
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }
}

// Chuẩn hóa hiển thị trạng thái
function getStatusBadgeHtml(status) {
  switch(status) {
    case 'draft': return `<span class="badge bg-secondary text-white">Bản nháp</span>`;
    case 'pending': return `<span class="badge bg-warning text-dark">Chờ duyệt</span>`;
    case 'active': return `<span class="badge bg-success text-white">Đang hiển thị</span>`;
    case 'rejected': return `<span class="badge bg-danger text-white">Bị từ chối</span>`;
    case 'hidden': return `<span class="badge bg-info text-dark">Đã ẩn</span>`;
    case 'sold': return `<span class="badge bg-dark text-white">Đã bán</span>`;
    default: return `<span class="badge bg-secondary">Khác</span>`;
  }
}

// Quản lý User đăng nhập
function getRegisteredUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function registerUser(userData) {
  const email = String(userData.email || '').trim().toLowerCase();
  if (!email || email === 'admin@otomarket.vn') {
    return { success: false, message: 'Email không hợp lệ hoặc đã được sử dụng.' };
  }

  const users = getRegisteredUsers();
  if (users.some(user => String(user.email).toLowerCase() === email)) {
    return { success: false, message: 'Email này đã được đăng ký.' };
  }

  const user = {
    id: `user-${Date.now()}`,
    name: String(userData.name || '').trim(),
    email,
    phone: String(userData.phone || '').trim(),
    password: String(userData.password || ''),
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));

  const { password, ...safeUser } = user;
  return { success: true, user: safeUser };
}

function updateUserProfile(profileData) {
  const currentUser = getLoggedInUser();
  if (!currentUser) return false;

  const updatedUser = {
    ...currentUser,
    name: String(profileData.name || currentUser.name || '').trim(),
    phone: String(profileData.phone || currentUser.phone || '').trim()
  };
  setLoggedInUser(updatedUser);

  const users = getRegisteredUsers();
  const index = users.findIndex(user =>
    (currentUser.id && user.id === currentUser.id) ||
    String(user.email).toLowerCase() === String(currentUser.email).toLowerCase()
  );
  if (index >= 0) {
    users[index] = { ...users[index], name: updatedUser.name, phone: updatedUser.phone };
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  }
  return true;
}

function getLoggedInUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!data) {
      if (typeof window !== 'undefined' && window.IS_WP_ADMIN === true && window.WP_CURRENT_USER) {
        const wpUser = {
          name: window.WP_CURRENT_USER.name || 'Quản lý Showroom',
          email: window.WP_CURRENT_USER.email || 'admin@otomarket.vn',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
        };
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(wpUser));
        return wpUser;
      }
      return null;
    }
    const user = JSON.parse(data);
    if (user && typeof user === 'object') {
      const email = String(user.email || '').trim().toLowerCase();
      const isAdmin = email === 'admin@otomarket.vn' || user.role === 'admin' || user.role === 'staff';
      const isLegacyAdminName = !user.name || 
        user.name.includes('Ban Quản Trị') || 
        user.name.toLowerCase() === 'admin' || 
        user.name.toLowerCase() === 'admin demo' ||
        user.name.toLowerCase() === 'quản trị viên';
      if (isAdmin && isLegacyAdminName) {
        user.name = 'Quản lý Showroom';
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      }
    }
    return user;
  } catch (e) {
    return null;
  }
}

function setLoggedInUser(user) {
  const email = String(user.email || '').trim().toLowerCase();
  const isAdmin = email === 'admin@otomarket.vn' || user.role === 'admin' || user.role === 'staff';
  const normalizedUser = {
    ...user,
    email: email,
    role: isAdmin ? 'admin' : 'user'
  };
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(normalizedUser));

  // Tự động gộp danh sách xe yêu thích từ chế độ Khách vào tài khoản
  try {
    const guestKey = 'otomarket_favorites_guest';
    const guestFavs = JSON.parse(localStorage.getItem(guestKey) || '[]');
    if (guestFavs && guestFavs.length > 0) {
      const userKey = `otomarket_favorites_${normalizedUser.id || normalizedUser.email}`;
      const userFavs = JSON.parse(localStorage.getItem(userKey) || '[]');
      const merged = Array.from(new Set([...userFavs, ...guestFavs]));
      localStorage.setItem(userKey, JSON.stringify(merged));
      localStorage.removeItem(guestKey);
    }
  } catch (e) {}
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  showToast("Đã đăng xuất thành công!", "info");
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Toast thông báo
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toastId = 'toast-' + Date.now();
  let bgClass = 'bg-success text-white';
  let icon = 'bi-check-circle-fill';

  if (type === 'error') {
    bgClass = 'bg-danger text-white';
    icon = 'bi-x-circle-fill';
  } else if (type === 'warning') {
    bgClass = 'bg-warning text-dark';
    icon = 'bi-exclamation-triangle-fill';
  } else if (type === 'info') {
    bgClass = 'bg-info text-dark';
    icon = 'bi-info-circle-fill';
  }

  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHtml);
  const toastElement = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastElement, { delay: 3500 });
  bsToast.show();

  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

function updateFavoritesCountBadge() {
  const favs = getFavorites();
  document.querySelectorAll('.favorites-badge-count').forEach(badge => {
    if (favs.length > 0) {
      badge.textContent = favs.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  });
}

function isUserAdmin(user) {
  if (window.IS_WP_ADMIN === true) return true;
  if (!user) user = getLoggedInUser();
  if (!user) return false;
  return user.role === 'admin' || user.role === 'staff' || String(user.email || '').trim().toLowerCase() === 'admin@otomarket.vn';
}

function syncHeaderUserUI() {
  const authSection = document.getElementById('navbar-auth-section');
  if (!authSection) return;

  const user = getLoggedInUser();
  if (user) {
    const isAdmin = isUserAdmin(user);
    authSection.innerHTML = `
      <div class="dropdown">
        <button class="topbar-user-btn dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="white-space: nowrap !important;">
          <span class="user-avatar-dot"><i class="bi bi-person-fill"></i></span>
          <span class="d-none d-sm-inline user-name-label" style="vertical-align: middle;">${user.name || user.email}</span>
          <i class="bi bi-chevron-down user-dropdown-caret" style="font-size: 0.68rem;"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 py-2 topbar-dropdown-menu" style="min-width: 240px; z-index: 99999 !important;">
          <li class="px-3 py-2 border-bottom mb-1 bg-light rounded-top-3">
            <div class="fw-bold text-dark small text-truncate" style="max-width: 200px;">${user.name || (isAdmin ? 'Quản lý Showroom' : 'Thành viên')}</div>
            <div class="text-muted" style="font-size: 0.74rem;">${user.email}</div>
          </li>
          <li><a class="dropdown-item py-2" href="profile.html"><i class="bi bi-person-badge me-2 text-primary"></i>Hồ sơ cá nhân</a></li>
          <li><a class="dropdown-item py-2" href="my-listings.html"><i class="bi bi-card-checklist me-2" style="color: #FF6B00;"></i>Quản lý tin đăng</a></li>
          <li><a class="dropdown-item py-2" href="favorites.html"><i class="bi bi-heart me-2 text-danger"></i>Xe yêu thích</a></li>
          <li><hr class="dropdown-divider my-1"></li>
          <li><button class="dropdown-item py-2 text-danger" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
        </ul>
      </div>
    `;
  } else {
    authSection.innerHTML = `
      <a href="login.html?v=20261021_login" class="topbar-user-btn text-decoration-none d-inline-flex align-items-center gap-1.5">
        <i class="bi bi-person-fill" style="color: #FF6B00;"></i>
        <span class="user-name-label">Đăng nhập</span>
      </a>
    `;
  }
}

function syncAdminLinksVisibility() {
  const isAdmin = isUserAdmin();

  document.querySelectorAll('.navbar-nav').forEach(nav => {
    // Tìm mục "Giới thiệu" để đặt mục Duyệt tin cạnh nó
    let aboutItem = null;
    nav.querySelectorAll('li.nav-item').forEach(li => {
      const link = li.querySelector('a');
      if (link) {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href.includes('about.html')) {
          aboutItem = li;
        }
      }
    });

    let adminItem = nav.querySelector('li.admin-nav-item, li.admin-only');

    if (isAdmin) {
      if (!adminItem) {
        adminItem = document.createElement('li');
        adminItem.className = 'nav-item admin-only admin-nav-item';
        const isCurrentAdminPage = window.location.pathname.includes('admin.html');
        adminItem.innerHTML = `
          <a class="nav-link nav-link-custom ${isCurrentAdminPage ? 'active' : ''}" href="admin.html" title="Trang duyệt tin xe dành cho Nhân viên Showroom">
            <i class="bi bi-shield-check me-1" style="color: #FF6B00;"></i>Duyệt tin Showroom
            <span class="badge bg-danger rounded-pill ms-1 nav-pending-count" style="font-size: 0.72rem; display: none;">0</span>
          </a>
        `;
        if (aboutItem) {
          aboutItem.insertAdjacentElement('afterend', adminItem);
        } else {
          nav.appendChild(adminItem);
        }
      }
      adminItem.classList.add('is-admin-visible');
      adminItem.style.display = '';

      // Cập nhật số lượng tin chờ duyệt vào badge
      const allCars = typeof getStoredCars === 'function' ? getStoredCars() : [];
      const pendingCount = allCars.filter(c => c.status === 'pending').length;
      const badge = adminItem.querySelector('.nav-pending-count');
      if (badge) {
        if (pendingCount > 0) {
          badge.textContent = pendingCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    } else {
      // Dạng người dùng thông thường hoặc khách: Ẩn hoàn toàn mục Duyệt tin
      if (adminItem) {
        adminItem.classList.remove('is-admin-visible');
        adminItem.style.display = 'none';
      }
    }
  });

  // Đồng bộ các phần tử admin-only khác trên trang
  document.querySelectorAll('.admin-only:not(.admin-nav-item)').forEach(el => {
    if (isAdmin) {
      el.classList.add('is-admin-visible');
      el.style.display = '';
    } else {
      el.classList.remove('is-admin-visible');
      el.style.display = 'none';
    }
  });
}

function enforcePagePermissions() {
  const path = window.location.pathname;
  const user = getLoggedInUser();
  const isAdmin = isUserAdmin(user);

  if (path.includes('post-car.html') || path.includes('my-listings.html')) {
    if (!user) {
      showToast("Vui lòng đăng nhập để tiếp tục", "warning");
      setTimeout(() => { window.location.href = 'login.html'; }, 500);
    }
  }

  if (path.includes('admin.html')) {
    if (!isAdmin) {
      showToast("Trang Duyệt tin chỉ dành cho Nhân viên Showroom", "error");
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
  }
}


// Menu Mua xe dùng chung: rê chuột để chọn xe mới/xe cũ, nhấn để xem tất cả.
function enhanceBuyCarNavigation() {
  document.querySelectorAll('.navbar-nav').forEach(nav => {
    const buyLink = Array.from(nav.querySelectorAll('a')).find(link => {
      const href = link.getAttribute('href');
      return href === 'cars.html' && link.closest('.nav-item');
    });
    if (!buyLink) return;

    nav.querySelectorAll('a[href="cars.html?condition=new"], a[href="cars.html?condition=used"]').forEach(link => {
      const item = link.closest('.nav-item');
      if (item) item.remove();
    });

    const item = buyLink.closest('.nav-item');
    item.classList.add('buy-car-dropdown');
    buyLink.classList.add('buy-car-main-link');
    buyLink.insertAdjacentHTML('beforeend', '<i class="bi bi-chevron-down buy-car-chevron"></i>');
    item.insertAdjacentHTML('beforeend', `
      <div class="buy-car-menu" role="menu">
        <a href="cars.html?condition=new" role="menuitem">
          <span class="buy-car-menu-icon new"><i class="bi bi-stars"></i></span>
          <span><strong>Xe mới</strong><small>Xe mới 100% từ đại lý</small></span>
        </a>
        <a href="cars.html?condition=used" role="menuitem">
          <span class="buy-car-menu-icon used"><i class="bi bi-car-front"></i></span>
          <span><strong>Xe đã qua sử dụng</strong><small>Tin xe cũ đang được rao bán</small></span>
        </a>
        <a class="buy-car-menu-all" href="cars.html" role="menuitem">
          Xem tất cả xe <i class="bi bi-arrow-right"></i>
        </a>
      </div>
    `);
  });
}

// Đồng bộ liên kết điều hướng trên thanh navbar
function cleanupNavbarNavigation() {
  document.querySelectorAll('.navbar-nav').forEach(nav => {
    // 1. Lọc và chuẩn hóa danh mục liên kết
    nav.querySelectorAll('li.nav-item').forEach(li => {
      const a = li.querySelector('a');
      if (!a) return;
      const text = (a.textContent || '').trim().toLowerCase();
      const href = (a.getAttribute('href') || '').toLowerCase();
      
      if (
        text.includes('hỗ trợ') || 
        text.includes('ho tro') || 
        href.includes('contact') || 
        href.includes('#contact') || 
        href.includes('about.html#contact')
      ) {
        li.remove();
      }
    });

    // 2. Khởi tạo liên kết Giới thiệu nếu chưa tồn tại
    let aboutLink = nav.querySelector('a[href="about.html"]');
    if (!aboutLink) {
      const aboutItem = document.createElement('li');
      aboutItem.className = 'nav-item';
      aboutItem.innerHTML = '<a class="nav-link nav-link-custom" href="about.html">Giới thiệu</a>';

      const postItem = nav.querySelector('a[href="post-car.html"]')?.closest('.nav-item');
      if (postItem) {
        postItem.insertAdjacentElement('afterend', aboutItem);
      } else {
        nav.appendChild(aboutItem);
      }
    }
  });
}

// Định dạng tiền tệ VNĐ
function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return "0 đ";
  if (amount >= 1000000000) {
    const billions = amount / 1000000000;
    return `${billions.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} tỷ`;
  } else if (amount >= 1000000) {
    const millions = amount / 1000000;
    return `${millions.toLocaleString('vi-VN')} triệu`;
  }
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function createCarCardHTML(car) {
  const isFav = isFavorite(car.id);
  const heartClass = isFav ? 'bi-heart-fill active' : 'bi-heart';
  const isNewCar = car.condition === 'new' || car.isNew;
  const isShowroom = car.sourceType === 'showroom' || car.isShowroom || (car.sellerType && (car.sellerType.includes('Đại lý') || car.sellerType.includes('Showroom') || car.sellerType.includes('Salon')));

  let badgeHtml = '';
  if (isShowroom) {
    badgeHtml = isNewCar
      ? `<span class="car-card-badge badge-source-showroom"><i class="bi bi-patch-check-fill me-1"></i>Showroom • Xe mới</span>`
      : `<span class="car-card-badge badge-source-showroom"><i class="bi bi-patch-check-fill me-1"></i>Showroom chính hãng</span>`;
  } else {
    badgeHtml = isNewCar
      ? `<span class="car-card-badge badge-source-new"><i class="bi bi-stars me-1"></i>Xe mới</span>`
      : `<span class="car-card-badge badge-source-external"><i class="bi bi-person-fill me-1"></i>Chính chủ bán</span>`;
  }

  const photoCount = (car.images && car.images.length > 0) ? car.images.length : (car.gallery && car.gallery.length > 0 ? car.gallery.length : 6);
  const photoBadgeHtml = `<span class="car-photo-badge"><i class="bi bi-camera"></i> ${photoCount} ảnh</span>`;
  const mileageText = isNewCar ? "Xe mới" : (car.mileageDisplay || `${(car.mileage || 0).toLocaleString()} km`);

  return `
    <div class="col-lg-4 col-md-6 mb-4 car-grid-item">
      <div class="car-card">
        <div class="car-card-img-wrapper">
          <img src="${car.image}" alt="${car.title}" class="car-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'">
          ${badgeHtml}
          ${photoBadgeHtml}
          <button class="car-fav-btn ${isFav ? 'active' : ''}" onclick="handleCardFavClick(event, '${car.id}')" title="Lưu xe yêu thích" aria-label="Yêu thích">
            <i class="bi ${heartClass}"></i>
          </button>
        </div>
        <div class="car-card-body">
          <a href="car-detail.html?id=${car.id}" class="car-card-title" title="${car.title}">${car.title}</a>
          
          <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-1 mb-1.5">
            <div class="car-card-price">${car.priceDisplay || formatCurrency(car.price)}</div>
            ${car.price >= 200000000 ? `<span class="small text-muted" style="font-size: 0.75rem;">Trả trước từ: <strong>${Math.round((car.price * 0.3) / 1000000)} tr</strong></span>` : ''}
          </div>

          ${isShowroom ? `<div class="mb-2"><span class="badge badge-showroom-check px-2 py-0.5" style="font-size: 0.71rem;"><i class="bi bi-shield-check me-1"></i>Đã thẩm định 176 hạng mục • Bảo hành chính hãng</span></div>` : ''}

          <div class="car-spec-grid">
            <div class="car-spec-item" title="Năm sản xuất">
              <i class="bi bi-calendar3"></i>
              <span>${car.year}</span>
            </div>
            <div class="car-spec-item" title="Số km đã đi (ODO)">
              <i class="bi bi-speedometer2"></i>
              <span>${mileageText}</span>
            </div>
            <div class="car-spec-item" title="Hộp số">
              <i class="bi bi-gear"></i>
              <span>${car.transmission}</span>
            </div>
            <div class="car-spec-item" title="Nhiên liệu">
              <i class="bi bi-fuel-pump"></i>
              <span>${car.fuel}</span>
            </div>
          </div>

          <div class="car-card-footer">
            <div class="car-seller-info">
              <i class="bi ${isShowroom ? 'bi-building text-orange-theme' : 'bi-person-circle text-muted'}"></i>
              <span class="${isShowroom ? 'fw-bold text-orange-theme' : ''}">${car.sellerName || (isShowroom ? 'Showroom OtoMarket' : 'Người bán cá nhân')}</span>
            </div>
            <div class="car-location" title="Khu vực xem xe">
              <i class="bi bi-geo-alt-fill text-orange-theme"></i>
              <span>${car.location}</span>
            </div>
          </div>

          <div class="mt-2.5 pt-2 border-top d-flex align-items-center gap-2">
            <a href="car-detail.html?id=${car.id}" class="btn btn-outline-dark btn-sm flex-grow-1 fw-semibold rounded-2 py-1.5" style="font-size: 0.82rem;">
              Xem xe <i class="bi bi-arrow-right ms-0.5" style="font-size: 0.7rem;"></i>
            </a>
            <a href="tel:${car.sellerPhone || '0901202626'}" class="btn btn-outline-orange btn-sm px-2.5 rounded-2 py-1.5" title="Gọi tư vấn: ${car.sellerPhone || '0901 202 626'}" onclick="event.stopPropagation();">
              <i class="bi bi-telephone-fill"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}


function handleCardFavClick(event, carId) {
  event.preventDefault();
  event.stopPropagation();
  const added = toggleFavorite(carId);
  const btn = event.currentTarget;
  const icon = btn.querySelector('i');
  if (added) {
    btn.classList.add('active');
    icon.classList.remove('bi-heart');
    icon.classList.add('bi-heart-fill');
  } else {
    btn.classList.remove('active');
    icon.classList.remove('bi-heart-fill');
    icon.classList.add('bi-heart');
  }
}

// Khôi phục dữ liệu gốc
function resetDemoData() {
  if (confirm("Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu mẫu ban đầu của OtoMarket?")) {
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_LISTINGS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    initializeStorage();
    showToast("Đã khôi phục dữ liệu mẫu ban đầu thành công!", "success");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
}

// Tự động khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  initializeStorage();
  cleanupNavbarNavigation();
  enhanceBuyCarNavigation();
  cleanupNavbarNavigation();
  updateFavoritesCountBadge();
  syncHeaderUserUI();
  syncAdminLinksVisibility();
  enforcePagePermissions();
});

// Khởi tạo và đồng bộ trạng thái thanh điều hướng
cleanupNavbarNavigation();
let _purgeCount = 0;
const _purgeTimer = setInterval(() => {
  cleanupNavbarNavigation();
  _purgeCount++;
  if (_purgeCount > 25) clearInterval(_purgeTimer);
}, 100);
window.addEventListener('load', cleanupNavbarNavigation);
