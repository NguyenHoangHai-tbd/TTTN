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
  SOLD: 'sold'// Xe đã bán
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
  if (!user) {
    try {
      const stored = localStorage.getItem('otomarket_user');
      if (stored) user = JSON.parse(stored);
    } catch (e) {}
  }
  if (!user) return false;
  const name = String(user.name || '').trim().toLowerCase();
  const email = String(user.email || '').trim().toLowerCase();
  const role = String(user.role || '').trim().toLowerCase();
  return role === 'admin' || 
         role === 'staff' || 
         name === 'quản lý showroom' || 
         name.includes('showroom') || 
         name.includes('quản lý') ||
         email === 'admin@otomarket.vn' ||
         email.includes('admin');
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

  // Quét tất cả các thanh menu trên trang (cả .navbar-nav, .portal-navbar-clean ul.nav, nav ul.nav, ul.nav)
  const allNavs = document.querySelectorAll('.navbar-nav, .portal-navbar-clean ul.nav, nav ul.nav, ul.nav');
  allNavs.forEach(nav => {
    // Tìm tất cả các mục li có liên kết admin.html
    const adminLis = Array.from(nav.querySelectorAll('li')).filter(li => {
      const a = li.querySelector('a');
      return a && (a.getAttribute('href') || '').includes('admin.html');
    });

    const isCurrentAdminPage = window.location.pathname.includes('admin.html');

    if (isAdmin) {
      // 1. KHI ĐĂNG NHẬP NHÂN VIÊN SHOWROOM / ADMIN: HIỂN THỊ ĐẦY ĐỦ DUYỆT TIN SHOWROOM
      if (adminLis.length === 0) {
        const adminItem = document.createElement('li');
        adminItem.className = 'nav-item admin-only admin-nav-item is-admin-visible';
        adminItem.innerHTML = `
          <a class="nav-link-portal ${isCurrentAdminPage ? 'active' : ''}" href="admin.html" title="Trạm Kiểm Duyệt & Quản Trị Showroom">
            Duyệt tin Showroom
            <span class="badge bg-danger rounded-pill ms-1 nav-pending-count" style="font-size: 0.72rem; display: none;">0</span>
          </a>
        `;
        let aboutItem = null;
        nav.querySelectorAll('li').forEach(li => {
          const a = li.querySelector('a');
          if (a && (a.getAttribute('href') || '').includes('about.html')) {
            aboutItem = li;
          }
        });
        if (aboutItem) {
          aboutItem.insertAdjacentElement('afterend', adminItem);
        } else {
          nav.appendChild(adminItem);
        }
      } else {
        adminLis.forEach((li, idx) => {
          if (idx === 0) {
            li.className = 'nav-item admin-only admin-nav-item is-admin-visible';
            li.style.removeProperty('display');
            li.style.display = 'list-item';
            const a = li.querySelector('a');
            if (a) {
              a.classList.remove('d-none');
              if (isCurrentAdminPage) {
                a.classList.add('active');
              }
            }
          } else {
            li.remove();
          }
        });
      }

      // Cập nhật số lượng tin chờ duyệt vào badge
      const allCars = typeof getStoredCars === 'function' ? getStoredCars() : [];
      const pendingCount = allCars.filter(c => c && c.status === 'pending').length;
      const targetLi = nav.querySelector('li a[href*="admin.html"]')?.closest('li');
      if (targetLi) {
        let badge = targetLi.querySelector('.nav-pending-count');
        if (!badge) {
          const a = targetLi.querySelector('a');
          if (a) {
            badge = document.createElement('span');
            badge.className = 'badge bg-danger rounded-pill ms-1 nav-pending-count';
            badge.style.fontSize = '0.72rem';
            a.appendChild(badge);
          }
        }
        if (badge) {
          if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    } else {
      // 2. KHI ĐĂNG XUẤT HOẶC KHÁCH / USER THƯỜNG: XÓA HOÀN TOÀN MỤC DUYỆT TIN KHỎI NAVBAR
      adminLis.forEach(li => {
        li.remove();
      });
    }
  });

  // Đồng bộ tất cả các thành phần admin-only khác trên trang
  document.querySelectorAll('.admin-nav-item, .admin-only').forEach(el => {
    if (isAdmin) {
      el.classList.add('is-admin-visible');
      el.style.removeProperty('display');
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
      // Tự động cấp quyền admin demo khi người dùng truy cập trực tiếp trang Trạm kiểm duyệt
      const demoAdmin = {
        id: 'admin-1',
        name: 'Quản lý Showroom',
        email: 'admin@otomarket.vn',
        phone: '1900 6868',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(demoAdmin));
      syncHeaderUserUI();
      syncAdminLinksVisibility();
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

// Chuyển đổi ngôn ngữ VI / EN toàn sàn
if (typeof window.switchLanguage !== 'function') {
  window.switchLanguage = function(lang, el) {
    document.querySelectorAll('.lang-pill-btn').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');
    if (typeof showToast === 'function') {
      showToast(lang.toUpperCase() === 'VI' ? 'Đã chọn ngôn ngữ Tiếng Việt' : 'Language switched to English', 'info');
    }
  };
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









// ==========================================================================
// OTOMARKET MULTI-LANGUAGE SYSTEM (VI / EN / ZH)
// Hỗ trợ dịch tự động toàn sàn: Topbar, Navbar, Nội dung, Footer
// ==========================================================================

(function() {
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
    "en": "Manage Listings",
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
    "en": "Explore Cars Now",
    "zh": "立即浏览车库"
  },
  "Cuộn để tìm xe": {
    "en": "Scroll to browse cars",
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
    "en": "Transaction notice:",
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
    "en": "Reports",
    "zh": "违规举报"
  },
  "Kho Xe Toàn Sàn": {
    "en": "Full Inventory",
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
    "en": "Reject",
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
  },
  "Tìm Chiếc Xe Phù Hợp": {
    "en": "Find the Perfect Car",
    "zh": "寻找理想汽车"
  },
  "Theo Nhu Cầu Của Bạn": {
    "en": "Matching Your Needs",
    "zh": "满足您的个性需求"
  },
  "Nền tảng kết nối trực tiếp người mua và người bán ô tô uy tín.": {
    "en": "Direct marketplace between verified car buyers and sellers.",
    "zh": "直接连接可信买家与卖家的汽车交易平台。"
  },
  "Thông tin xe minh bạch, kiểm tra thực tế, liên hệ trực tiếp chính chủ.": {
    "en": "Transparent vehicle specs, verified inspections, direct owner contact.",
    "zh": "车况透明真实、实车质检认证、直接联系车主。"
  },
  "Tìm thấy": {
    "en": "Found",
    "zh": "共找到"
  },
  "xe phù hợp": {
    "en": "matching cars",
    "zh": "辆合适车源"
  },
  "Trả trước:": {
    "en": "Down payment:",
    "zh": "首付款:"
  },
  "Danh sách xe ô tô mới và đã qua sử dụng, thông tin rõ ràng, liên hệ trực tiếp người bán.": {
    "en": "Verified new and pre-owned car listings, transparent details, direct seller contact.",
    "zh": "在售新车与严选二手车清单，车况透明，直联卖家看车。"
  },
  "Kho Xe Ô Tô Đang Bán": {
    "en": "Cars for Sale Inventory",
    "zh": "在售车辆展库"
  },
  "Kho xe đang bán": {
    "en": "Cars for Sale",
    "zh": "在售车库"
  },
  "xe trong kho": {
    "en": "cars in stock",
    "zh": "辆库存在售"
  },
  "Chi tiết": {
    "en": "Details",
    "zh": "详情"
  },
  "Quy trình duyệt tin": {
    "en": "Approval Process",
    "zh": "审核流程"
  },
  "Tất cả xe đang bán": {
    "en": "All Cars on Sale",
    "zh": "全部在售车辆"
  },
  "Quản lý tin đăng bán": {
    "en": "Manage My Listings",
    "zh": "管理我的发布"
  },
  "Điều khoản sử dụng": {
    "en": "Terms of Service",
    "zh": "使用条款"
  },
  "Khôi phục dữ liệu gốc": {
    "en": "Reset to Demo Data",
    "zh": "恢复默认数据"
  },
  "Trụ sở:": {
    "en": "HQ:",
    "zh": "总部:"
  },
  "Văn phòng:": {
    "en": "Office:",
    "zh": "分部:"
  },
  "Tổng đài hỗ trợ (08:00 - 18:30)": {
    "en": "Support Hotline (08:00 - 18:30)",
    "zh": "客服热线 (08:00 - 18:30)"
  },
  "Nền tảng công nghệ kết nối mua bán ô tô trực tiếp giữa người mua và người bán. Cung cấp thông tin xe rõ ràng, hỗ trợ kết nối liên hệ xem xe thực tế. Nền tảng chưa hỗ trợ thanh toán hoặc đặt cọc trực tuyến.": {
    "en": "Direct online car marketplace connecting buyers and sellers. Providing verified vehicle data and supporting in-person viewing. The platform currently does not handle online payments or deposits.",
    "zh": "直接撮合买卖双方的在线汽车交易平台。提供透明真实车况，支持实车现场查验，平台暂不支持线上代收定金或直接转账付款。"
  },
  "Đọc tiếp →": {
    "en": "Read More →",
    "zh": "阅读全文 →"
  },
  "Bản Thẩm Định Chi Tiết Xe": {
    "en": "Car Appraisal Desk",
    "zh": "实车核验工作台"
  }
};
  const SVG_FLAGS = {"vi": "<svg class=\"flag-icon\" viewBox=\"0 0 640 480\" width=\"18\" height=\"13.5\" style=\"border-radius: 2px; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.15);\"><rect width=\"640\" height=\"480\" fill=\"#da251d\"/><polygon points=\"320,150 357,264 477,264 380,335 417,450 320,379 223,450 260,335 163,264 283,264\" fill=\"#ff0\"/></svg>", "en": "<svg class=\"flag-icon\" viewBox=\"0 0 640 480\" width=\"18\" height=\"13.5\" style=\"border-radius: 2px; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.15);\"><path fill=\"#012169\" d=\"M0 0h640v480H0z\"/><path fill=\"#FFF\" d=\"m75 0 245 180L565 0h75v50L405 240l235 170v70h-75L320 300 75 480H0v-50l235-170L0 70V0h75z\"/><path fill=\"#C8102E\" d=\"m424 281 216 156v43L370 281h54zm-208-82L0 43V0l270 199h-54zM0 437l199-147h54L37 480H0v-43zm640-394L441 190h-54l253-190h0v43z\"/><path fill=\"#FFF\" d=\"M250 0h140v480H250zM0 170h640v140H0z\"/><path fill=\"#C8102E\" d=\"M280 0h80v480h-80zM0 200h640v80H0z\"/></svg>", "zh": "<svg class=\"flag-icon\" viewBox=\"0 0 640 480\" width=\"18\" height=\"13.5\" style=\"border-radius: 2px; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.15);\"><rect width=\"640\" height=\"480\" fill=\"#ee1c25\"/><polygon points=\"128,64 148,126 213,126 160,165 181,227 128,188 75,227 96,165 43,126 108,126\" fill=\"#ff0\"/><polygon points=\"256,38 250,59 269,50 256,66 274,75 253,74 256,95 243,78 233,96 236,75\" fill=\"#ff0\"/><polygon points=\"307,89 296,108 317,105 300,117 313,131 296,123 293,144 286,124 271,138 280,119\" fill=\"#ff0\"/><polygon points=\"307,166 293,184 314,187 295,196 305,214 291,202 283,222 281,201 263,211 276,195\" fill=\"#ff0\"/><polygon points=\"256,230 248,251 268,245 253,259 269,271 249,267 248,288 238,269 226,286 233,266\" fill=\"#ff0\"/></svg>"};

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

  function translateSingleString(str, lang) {
    if (!str || lang === 'vi') return str;
    const trimmed = str.trim();
    if (!trimmed) return str;

    // 1. Exact match
    if (I18N_DICT[trimmed] && I18N_DICT[trimmed][lang]) {
      return str.replace(trimmed, I18N_DICT[trimmed][lang]);
    }

    // 2. Dynamic patterns
    for (const pat of DYNAMIC_PATTERNS) {
      if (pat.regex.test(trimmed)) {
        const rep = pat[lang];
        if (rep) {
          return str.replace(trimmed, trimmed.replace(pat.regex, rep));
        }
      }
    }

    // 3. Substring key replacements (from longest phrase to shortest)
    const sortedKeys = Object.keys(I18N_DICT).filter(k => k.length > 3).sort((a, b) => b.length - a.length);
    let result = str;
    let matched = false;
    for (const key of sortedKeys) {
      if (result.includes(key)) {
        const target = I18N_DICT[key][lang];
        if (target) {
          result = result.split(key).join(target);
          matched = true;
        }
      }
    }
    if (matched) return result;

    return str;
  }

  function walkAndTranslate(rootNode, lang) {
    if (!rootNode) return;

    // TreeWalker for all text nodes
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          const parent = node.parentNode;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const parentName = parent.nodeName;
          if (['SCRIPT', 'STYLE', 'CODE', 'NOSCRIPT', 'TEXTAREA'].includes(parentName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList && (parent.classList.contains('lang-opt') || parent.id === 'current-lang-text')) {
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
        currentNode.nodeValue = translateSingleString(original, lang);
      }
    }

    // Attributes: placeholder, title, aria-label
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
            el.setAttribute(attr, translateSingleString(original, lang));
          }
        }
      });
    });
  }

  function updateDropdownUI(lang) {
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };

    const flagEl = document.getElementById('current-lang-flag');
    const textEl = document.getElementById('current-lang-text');
    if (flagEl) flagEl.innerHTML = SVG_FLAGS[lang] || SVG_FLAGS['vi'];
    if (textEl) textEl.textContent = textMap[lang] || 'Tiếng Việt';

    document.querySelectorAll('.lang-opt').forEach(opt => {
      opt.classList.remove('active');
    });
    const activeOpt = document.querySelector(`.lang-item-${lang}`);
    if (activeOpt) activeOpt.classList.add('active');
  }

  function mountLanguageSwitcher() {
    const containers = document.querySelectorAll('.lang-switch-container, .lang-dropdown-container');
    if (containers.length === 0) return;

    const currentLang = getStoredLanguage();
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };

    containers.forEach(container => {
      container.className = 'dropdown lang-dropdown-container';
      container.style.display = 'inline-block';
      container.innerHTML = `
        <button class="topbar-lang-btn dropdown-toggle d-flex align-items-center gap-1.5" type="button" id="langDropdown" data-bs-toggle="dropdown" aria-expanded="false" title="Chọn ngôn ngữ / Select language">
          <span class="lang-flag d-inline-flex align-items-center me-1" id="current-lang-flag">${SVG_FLAGS[currentLang] || SVG_FLAGS['vi']}</span>
          <span class="lang-text fw-bold me-1" id="current-lang-text" style="font-size: 0.8rem; letter-spacing: 0.2px;">${textMap[currentLang] || 'Tiếng Việt'}</span>
          <i class="bi bi-chevron-down" style="font-size: 0.65rem;"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 py-1.5 rounded-3" aria-labelledby="langDropdown" style="font-size: 0.85rem; min-width: 155px; z-index: 1060;">
          <li>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-vi ${currentLang === 'vi' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('vi')">
              <span class="d-inline-flex align-items-center">${SVG_FLAGS['vi']}</span>
              <span class="fw-medium">Tiếng Việt (VN)</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-en ${currentLang === 'en' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('en')">
              <span class="d-inline-flex align-items-center">${SVG_FLAGS['en']}</span>
              <span class="fw-medium">English</span>
            </a>
          </li>
          <li>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2 lang-opt lang-item-zh ${currentLang === 'zh' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('zh')">
              <span class="d-inline-flex align-items-center">${SVG_FLAGS['zh']}</span>
              <span class="fw-medium">中文 (China)</span>
            </a>
          </li>
        </ul>
      `;
    });
  }

  window.setSiteLanguage = function(lang, showNotification = true) {
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
  };

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

  // MutationObserver to auto-translate dynamically inserted content
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      const currentLang = getStoredLanguage();
      if (currentLang === 'vi') return;
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
})();
