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

// Trả về danh sách xe lưu trữ (bao gồm xe từ WordPress / mẫu và tin người dùng, kể cả chờ duyệt)
function getStoredCars(includePending = true) {
  return getAllCars(includePending);
}

if (typeof window !== 'undefined') {
  window.getStoredCars = getStoredCars;
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
    phone: String(profileData.phone || currentUser.phone || '').trim(),
    city: profileData.city !== undefined ? String(profileData.city).trim() : currentUser.city
  };
  setLoggedInUser(updatedUser);

  const users = getRegisteredUsers();
  const index = users.findIndex(user =>
    (currentUser.id && user.id === currentUser.id) ||
    String(user.email).toLowerCase() === String(currentUser.email).toLowerCase()
  );
  if (index >= 0) {
    users[index] = {
      ...users[index],
      name: updatedUser.name,
      phone: updatedUser.phone,
      city: updatedUser.city
    };
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  }
  return true;
}

const DEMO_PASSWORDS_KEY = 'otomarket_demo_passwords';

function getBuiltInDemoAccounts() {
  return [
    {
      id: 'user-demo-1',
      name: 'Nguyễn Hoàng Nam',
      email: 'nam.nguyen@otomarket.vn',
      phone: '0912 345 678',
      defaultPassword: '12345678',
      role: 'user',
      city: 'TP. Nha Trang, Khánh Hòa',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'admin-1',
      name: 'Quản lý Showroom',
      email: 'admin@otomarket.vn',
      phone: '1900 6868',
      defaultPassword: 'admin123',
      role: 'admin',
      city: 'TP. Nha Trang, Khánh Hòa',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    }
  ];
}

function getDemoPasswordsMap() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_PASSWORDS_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function findAccountMatch(accountInput) {
  const normalized = String(accountInput || '').trim().toLowerCase();
  const cleanPhone = normalized.replace(/\D/g, '');
  if (!normalized) return null;

  const registered = getRegisteredUsers();
  const regIndex = registered.findIndex(u => {
    const uEmail = String(u.email || '').trim().toLowerCase();
    const uPhone = String(u.phone || '').replace(/\D/g, '');
    return uEmail === normalized || (cleanPhone.length >= 9 && uPhone === cleanPhone);
  });
  if (regIndex >= 0) {
    return { source: 'registered', index: regIndex, record: registered[regIndex] };
  }

  const demos = getBuiltInDemoAccounts();
  const demoMatch = demos.find(d => {
    const dEmail = d.email.toLowerCase();
    const dPhone = d.phone.replace(/\D/g, '');
    return dEmail === normalized || (cleanPhone.length >= 9 && dPhone === cleanPhone);
  });
  if (demoMatch) {
    const overrides = getDemoPasswordsMap();
    const activePassword = overrides[demoMatch.email] || demoMatch.defaultPassword;
    return { source: 'demo', record: { ...demoMatch, password: activePassword } };
  }

  return null;
}

function authenticateUserAccount(accountInput, passwordInput) {
  const match = findAccountMatch(accountInput);
  if (!match) {
    return {
      success: false,
      code: 'not_found',
      message: 'Tài khoản hoặc email chưa được đăng ký trên hệ thống!'
    };
  }

  const pwd = String(passwordInput || '');
  if (match.record.password !== pwd) {
    return {
      success: false,
      code: 'wrong_password',
      message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!'
    };
  }

  const { password, defaultPassword, ...safeUser } = match.record;
  return { success: true, user: safeUser };
}

function changeAccountPassword(currentPassword, newPassword) {
  const currentUser = getLoggedInUser();
  if (!currentUser) {
    return { success: false, message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!' };
  }

  const match = findAccountMatch(currentUser.email);
  if (!match) {
    return { success: false, message: 'Không tìm thấy thông tin tài khoản để cập nhật mật khẩu!' };
  }

  if (match.record.password !== String(currentPassword || '')) {
    return { success: false, message: 'Mật khẩu hiện tại không chính xác!' };
  }

  if (match.source === 'registered') {
    const users = getRegisteredUsers();
    users[match.index].password = String(newPassword);
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  } else {
    const overrides = getDemoPasswordsMap();
    overrides[match.record.email] = String(newPassword);
    localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(overrides));
  }

  return { success: true, message: 'Đã thay đổi mật khẩu tài khoản thành công!' };
}

function resetAccountPassword(emailInput, newPassword) {
  const match = findAccountMatch(emailInput);
  if (!match) {
    return { success: false, message: 'Email này chưa được đăng ký trên hệ thống OtoMarket!' };
  }

  if (match.source === 'registered') {
    const users = getRegisteredUsers();
    users[match.index].password = String(newPassword);
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
  } else {
    const overrides = getDemoPasswordsMap();
    overrides[match.record.email] = String(newPassword);
    localStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(overrides));
  }

  return { success: true, email: match.record.email, message: 'Khôi phục mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
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
  const email = String(user.email || '').trim().toLowerCase();
  const role = String(user.role || '').trim().toLowerCase();
  return role === 'admin' ||
         role === 'staff' ||
         email === 'admin@otomarket.vn';
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

    const isCurrentAdminPage = getCurrentPageSlug() === 'admin';

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

function getCurrentPageSlug() {
  const cleanPath = (window.location.pathname || '').replace(/\/+$/, '');
  const lastSeg = cleanPath.split('/').pop() || '';
  return lastSeg.replace(/\.html$/i, '').toLowerCase();
}

function enforcePagePermissions() {
  const pageSlug = getCurrentPageSlug();
  const user = getLoggedInUser();
  const isAdmin = isUserAdmin(user);

  const protectedUserPages = ['post-car', 'my-listings', 'profile'];
  if (protectedUserPages.includes(pageSlug)) {
    if (!user) {
      try {
        sessionStorage.setItem('otomarket_auth_message', 'Vui lòng đăng nhập để truy cập trang này!');
        sessionStorage.setItem('otomarket_redirect_after_login', window.location.href);
      } catch (e) {}
      if (typeof showToast === 'function') {
        showToast("Vui lòng đăng nhập để tiếp tục", "warning");
      }
      setTimeout(() => { window.location.href = 'login.html'; }, 400);
      return;
    }
  }

  if (pageSlug === 'admin') {
    if (!isAdmin) {
      if (!user) {
        try {
          sessionStorage.setItem('otomarket_auth_message', 'Vui lòng đăng nhập bằng tài khoản Quản lý Showroom để vào Trạm kiểm duyệt!');
          sessionStorage.setItem('otomarket_redirect_after_login', window.location.href);
        } catch (e) {}
        if (typeof showToast === 'function') {
          showToast("Yêu cầu đăng nhập tài khoản Quản lý Showroom!", "error");
        }
        setTimeout(() => { window.location.href = 'login.html'; }, 500);
      } else {
        if (typeof showToast === 'function') {
          showToast("Tài khoản của bạn không có quyền truy cập trang Quản trị Showroom!", "error");
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 700);
      }
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

/**
 * OTOMARKET MULTI-LANGUAGE SYSTEM (VI / EN / ZH)
 * Bản địa hóa giao diện tức thì toàn sàn 100% (Topbar, Navbar, Nội dung, Footer, Chi tiết xe, Tin tức, Giới thiệu)
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
    "zh": "查看全部车源"
  },
  "TIN TỨC & ĐÁNH GIÁ CHUYÊN SÂU": {
    "en": "IN-DEPTH NEWS & REVIEWS",
    "zh": "汽车资讯与深度测评"
  },
  "Tin Tức & Đánh Giá Xe - Cẩm Nang Kinh Nghiệm": {
    "en": "Automotive News & Reviews - Expert Buyer's Guide",
    "zh": "汽车资讯与专业测评 - 购车用车全能指南"
  },
  "Xem tất cả bài viết & đánh giá": {
    "en": "View all articles & reviews",
    "zh": "浏览全部资讯与评测"
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
    "en": "100% brand new original vehicles, full official warranty, transparent pricing.",
    "zh": "100% 原厂全新车辆，配备完整官方质保手册，透明明码标价。"
  },
  "Kho Ô Tô Đã Qua Sử Dụng Chất Lượng": {
    "en": "Certified Pre-Owned Cars",
    "zh": "严选高品质二手车"
  },
  "Xe lướt & chính chủ đã kiểm duyệt kỹ thuật, cam kết không đâm đụng, thủy kích.": {
    "en": "Low-mileage & verified private owner cars, guaranteed no major accident or flood damage.",
    "zh": "准新车及已核验个人一手车，郑重承诺无重大事故、无水泡火烧。"
  },
  "Tất cả kho xe": {
    "en": "All Inventory",
    "zh": "全部车源"
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
    "en": "KEYWORD SEARCH",
    "zh": "车辆关键词搜索"
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
    "zh": "车型车身结构"
  },
  "Bán tải": {
    "en": "Pickup",
    "zh": "皮卡"
  },
  "KHU VỰC XEM XE": {
    "en": "LOCATION",
    "zh": "看车所在地区"
  },
  "Tất cả khu vực": {
    "en": "All Locations",
    "zh": "全部城市"
  },
  "Sắp xếp:": {
    "en": "Sort by:",
    "zh": "排序方式："
  },
  "Mới đăng": {
    "en": "Newest",
    "zh": "最新发布"
  },
  "Giá thấp đến cao": {
    "en": "Price: Low to High",
    "zh": "价格由低到高"
  },
  "Giá cao đến thấp": {
    "en": "Price: High to Low",
    "zh": "价格由高到低"
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
    "en": "100% Brand New",
    "zh": "全新现车 100%"
  },
  "Showroom chính hãng": {
    "en": "Official Showroom",
    "zh": "官方授权展厅"
  },
  "Chính chủ": {
    "en": "Direct Owner",
    "zh": "车主一手"
  },
  "Xe lướt": {
    "en": "Pre-Owned",
    "zh": "优质准新车"
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
    "zh": "纯电动"
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
    "en": "Similar Cars in Segment & Price Range",
    "zh": "同级同价位推荐车源"
  },
  "Các mẫu xe đang chào bán sẵn tại showroom để bạn tham khảo thêm": {
    "en": "Available models at showroom for your reference",
    "zh": "展厅在售同级别精选现车供您参考"
  },
  "Thông tin kỹ thuật": {
    "en": "Technical Specifications",
    "zh": "技术参数详情"
  },
  "Năm sản xuất": {
    "en": "Manufacture year",
    "zh": "出厂年份"
  },
  "Số km đã đi": {
    "en": "Odometer",
    "zh": "已行驶里程"
  },
  "Hộp số": {
    "en": "Transmission",
    "zh": "变速箱类型"
  },
  "Nhiên liệu": {
    "en": "Fuel Type",
    "zh": "燃料类型"
  },
  "Xuất xứ": {
    "en": "Origin",
    "zh": "车辆产地"
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
    "en": "Official Manufacturer Warranty",
    "zh": "官方原厂质保"
  },
  "Dự toán vay trả góp ngân hàng": {
    "en": "Bank Installment Loan Calculator",
    "zh": "银行分期购车测算器"
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
    "en": "View Vehicle Detail Page",
    "zh": "查看车辆完整详情页"
  },
  "Tin Tức & Đánh Giá Xe": {
    "en": "Automotive News & Reviews",
    "zh": "汽车资讯与专业测评"
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
    "en": "Automotive Market",
    "zh": "汽车市场动态"
  },
  "Đánh giá xe thực tế": {
    "en": "Real-World Car Reviews",
    "zh": "真实车主试驾实评"
  },
  "Kinh nghiệm xem xe cũ": {
    "en": "Used Car Inspection Guide",
    "zh": "二手车验车宝典"
  },
  "Thủ tục & Pháp lý": {
    "en": "Procedures & Legal",
    "zh": "手续与法律规范"
  },
  "Đọc tiếp": {
    "en": "Read more",
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
    "en": "Operating Model: Direct Buyer-Seller Marketplace (C2C & B2C)",
    "zh": "运营模式：买家与卖家直连平台（C2C 与 B2C）"
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
    "en": "Vehicle Approval Desk",
    "zh": "车源核验工作站"
  },
  "Báo Cáo Vi Phạm": {
    "en": "Violation Reports",
    "zh": "违规举报处理"
  },
  "Kho Xe Toàn Sàn": {
    "en": "Marketplace Inventory",
    "zh": "全平台车库"
  },
  "Hàng đợi thẩm định": {
    "en": "Appraisal Queue",
    "zh": "待审核队列"
  },
  "Bàn Thẩm Định Chi Tiết Xe": {
    "en": "Vehicle Detailed Appraisal Desk",
    "zh": "实车全维核验操作台"
  },
  "Phê duyệt & Xuất bản lên sàn": {
    "en": "Approve & Publish to Marketplace",
    "zh": "审核通过并全网发布"
  },
  "Từ chối duyệt": {
    "en": "Reject Listing",
    "zh": "驳回审核申请"
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
  "Kho Xe Ô Tô Đang Bán": {
    "en": "Cars For Sale Inventory",
    "zh": "全部在售汽车展库"
  },
  "Danh sách xe ô tô mới và đã qua sử dụng, thông tin rõ ràng, liên hệ trực tiếp người bán.": {
    "en": "Catalog of new and used cars with transparent details, connect directly with sellers.",
    "zh": "全平台新车与优质二手车目录，车况信息透明，一键直连真实车主。"
  },
  "Từ khóa xe": {
    "en": "Keyword search",
    "zh": "车辆关键词搜索"
  },
  "Khoảng giá bán": {
    "en": "Price range",
    "zh": "价格预算区间"
  },
  "Kiểu dáng xe": {
    "en": "Body type",
    "zh": "车型车身结构"
  },
  "Khu vực xem xe": {
    "en": "Location",
    "zh": "看车所在地区"
  },
  "LOẠI NHIÊN LIỆU": {
    "en": "FUEL TYPE",
    "zh": "动力燃料类型"
  },
  "Loại nhiên liệu": {
    "en": "Fuel type",
    "zh": "动力燃料类型"
  },
  "HÃNG XE": {
    "en": "BRAND",
    "zh": "汽车品牌"
  },
  "Hãng xe": {
    "en": "Brand",
    "zh": "汽车品牌"
  },
  "NĂM SẢN XUẤT": {
    "en": "MANUFACTURE YEAR",
    "zh": "出厂年份"
  },
  "HỘP SỐ": {
    "en": "TRANSMISSION",
    "zh": "变速箱类型"
  },
  "TÌNH TRẠNG XE": {
    "en": "CONDITION",
    "zh": "车辆状况"
  },
  "Tình trạng xe": {
    "en": "Condition",
    "zh": "车辆状况"
  },
  "TẤT CẢ": {
    "en": "ALL",
    "zh": "全部"
  },
  "Tất cả": {
    "en": "All",
    "zh": "全部"
  },
  "All Inventory": {
    "en": "All Inventory",
    "zh": "全部车源"
  },
  "New Cars": {
    "en": "New Cars",
    "zh": "全新车"
  },
  "Used Cars": {
    "en": "Used Cars",
    "zh": "二手车"
  },
  "Dưới 600M": {
    "en": "Under 600M",
    "zh": "600万以下"
  },
  "Under 600M": {
    "en": "Under 600M",
    "zh": "600万以下"
  },
  "600 - 900M": {
    "en": "600 - 900M",
    "zh": "600 - 900万"
  },
  "900M - 1.2B": {
    "en": "900M - 1.2B",
    "zh": "900万 - 1.2亿"
  },
  "Trên 1.2B": {
    "en": "Over 1.2B",
    "zh": "1.2亿以上"
  },
  "Over 1.2B": {
    "en": "Over 1.2B",
    "zh": "1.2亿以上"
  },
  "Tất cả địa điểm": {
    "en": "All Locations",
    "zh": "所有城市地区"
  },
  "All Locations": {
    "en": "All Locations",
    "zh": "所有城市地区"
  },
  "Tất cả nhiên liệu": {
    "en": "All Fuels",
    "zh": "全部燃料"
  },
  "Tất cả hộp số": {
    "en": "All Transmissions",
    "zh": "全部变速箱"
  },
  "Tất cả hãng xe": {
    "en": "All Brands",
    "zh": "全部品牌"
  },
  "Nhập tên xe, model...": {
    "en": "Enter car name, model...",
    "zh": "输入车型名称、型号..."
  },
  "Enter car name, model...": {
    "en": "Enter car name, model...",
    "zh": "输入车型名称、型号..."
  },
  "SEARCH FILTERS": {
    "en": "SEARCH FILTERS",
    "zh": "筛选条件"
  },
  "Bộ lọc tìm kiếm": {
    "en": "Search filters",
    "zh": "筛选条件"
  },
  "Reset": {
    "en": "Reset",
    "zh": "重置"
  },
  "Xóa bộ lọc": {
    "en": "Clear filters",
    "zh": "清空筛选"
  },
  "Xóa lọc": {
    "en": "Clear",
    "zh": "清空"
  },
  "Sắp xếp theo:": {
    "en": "Sort by:",
    "zh": "排序方式："
  },
  "Sort by:": {
    "en": "Sort by:",
    "zh": "排序方式："
  },
  "Mới nhất": {
    "en": "Newest",
    "zh": "最新发布"
  },
  "Newest": {
    "en": "Newest",
    "zh": "最新发布"
  },
  "Price: Low to High": {
    "en": "Price: Low to High",
    "zh": "价格由低到高"
  },
  "Price: High to Low": {
    "en": "Price: High to Low",
    "zh": "价格由高到低"
  },
  "Year: Newest": {
    "en": "Year: Newest",
    "zh": "出厂年份最新"
  },
  "Odo thấp nhất": {
    "en": "Mileage: Lowest",
    "zh": "里程最少"
  },
  "Mileage: Lowest": {
    "en": "Mileage: Lowest",
    "zh": "里程最少"
  },
  "Trang trước": {
    "en": "Previous page",
    "zh": "上一页"
  },
  "Trang sau": {
    "en": "Next page",
    "zh": "下一页"
  },
  "Previous": {
    "en": "Previous",
    "zh": "上一页"
  },
  "Next": {
    "en": "Next",
    "zh": "下一页"
  },
  "Details": {
    "en": "Details",
    "zh": "查看详情"
  },
  "Xem chi tiết →": {
    "en": "View Details →",
    "zh": "查看详情 →"
  },
  "Xem toàn bộ kho xe →": {
    "en": "View Full Inventory →",
    "zh": "查看全部车源 →"
  },
  "Không tìm thấy xe phù hợp": {
    "en": "No matching cars found",
    "zh": "未找到符合条件的车源"
  },
  "Vui lòng điều chỉnh hoặc xóa bớt tiêu chí lọc để xem thêm xe trong kho.": {
    "en": "Please adjust or clear filter criteria to explore more inventory.",
    "zh": "请调整或清除筛选条件以浏览更多库存车源。"
  },
  "Xóa tất cả bộ lọc": {
    "en": "Clear all filters",
    "zh": "清空全部筛选条件"
  },
  "Người bán cá nhân": {
    "en": "Private Seller",
    "zh": "个人车主"
  },
  "Đã xác thực SĐT": {
    "en": "Phone Verified",
    "zh": "手机号已实名认证"
  },
  "SĐT chính chủ đã xác thực": {
    "en": "Verified owner phone number",
    "zh": "车主本人手机已认证"
  },
  "Đã xác thực": {
    "en": "Verified",
    "zh": "已官方认证"
  },
  "Showroom OtoMarket Nha Trang": {
    "en": "OtoMarket Nha Trang Showroom",
    "zh": "OtoMarket 芽庄直营展厅"
  },
  "Showroom • Xe mới": {
    "en": "Showroom • Brand New",
    "zh": "展厅现车 • 全新"
  },
  "Chính chủ bán": {
    "en": "Direct Owner",
    "zh": "个人一手车主"
  },
  "100% New": {
    "en": "100% Brand New",
    "zh": "100% 全新"
  },
  "Xe mới": {
    "en": "New Car",
    "zh": "全新车"
  },
  "Gọi người bán: 0915 789 654": {
    "en": "Call seller: 0915 789 654",
    "zh": "致电车主：0915 789 654"
  },
  "Gọi người bán: 0912 345 678": {
    "en": "Call seller: 0912 345 678",
    "zh": "致电车主：0912 345 678"
  },
  "Nhắn tin trao đổi Zalo": {
    "en": "Message via Zalo",
    "zh": "通过Zalo在线沟通"
  },
  "Nhắn tin tư vấn qua Zalo": {
    "en": "Consult via Zalo",
    "zh": "通过Zalo咨询车况"
  },
  "Xem thông tin liên hệ chi tiết": {
    "en": "View Detailed Contact Info",
    "zh": "查看详细联系方式"
  },
  "Lưu ý giao dịch an toàn:": {
    "en": "Safe Transaction Guidelines:",
    "zh": "安全交易防骗提示："
  },
  "Hẹn gặp người bán tại địa điểm công cộng hoặc garage uy tín": {
    "en": "Meet seller at a public location or reputable garage",
    "zh": "在公共场所或知名诚信汽修厂约定看车"
  },
  "Hẹn gặp trực tiếp tại Showroom/địa chỉ thực tế để xem xe": {
    "en": "Meet directly at the showroom/physical address to view the car",
    "zh": "直接前往展厅或实际物理地址实地查看实车"
  },
  "Đối chiếu giấy đăng ký, đăng kiểm và số khung/số máy gốc": {
    "en": "Cross-check vehicle registration, inspection certificate and chassis/engine numbers",
    "zh": "仔细核对行驶证、年检证书与原厂车架号/发动机号"
  },
  "Đối chiếu kỹ giấy đăng ký, đăng kiểm và số khung/số máy gốc": {
    "en": "Carefully verify registration, inspection certificate and original VIN/engine numbers",
    "zh": "严谨核对行驶证、检验合格证与原厂车架/发动机号"
  },
  "Trực tiếp lái thử xe để kiểm tra máy móc, khung gầm và hệ thống lái": {
    "en": "Test drive in person to inspect engine, chassis and steering system",
    "zh": "亲自试驾体验，细致核查发动机、底盘与转向操控系统"
  },
  "Yêu cầu lái thử thực tế và kiểm tra xe tại garage uy tín": {
    "en": "Request a test drive and pre-purchase inspection at a reputable shop",
    "zh": "要求实车试驾并在诚信第三方汽修厂进行全车检测"
  },
  "Chỉ thanh toán hoặc đặt cọc sau khi đã kiểm tra xe và hồ sơ pháp lý": {
    "en": "Only pay or deposit after verifying the car and legal documents",
    "zh": "仅在核验实车状况及完整合法权属材料后再行付款或定金"
  },
  "Không chuyển tiền đặt cọc khi chưa xác minh thực tế phương tiện": {
    "en": "Do not transfer deposit before physically inspecting the vehicle",
    "zh": "在未实地验核真实车辆前切勿转账支付任何定金"
  },
  "Báo cáo tin có dấu hiệu vi phạm": {
    "en": "Report suspicious listing",
    "zh": "举报疑似违规车源"
  },
  "Báo cáo tin đăng vi phạm": {
    "en": "Report listing violation",
    "zh": "举报违规车源"
  },
  "Báo cáo vi phạm": {
    "en": "Report violation",
    "zh": "举报违规"
  },
  "2 ảnh thực tế": {
    "en": "2 actual photos",
    "zh": "2 张实拍照片"
  },
  "6 ảnh thực tế": {
    "en": "6 actual photos",
    "zh": "6 张实拍照片"
  },
  "8 ảnh thực tế": {
    "en": "8 actual photos",
    "zh": "8 张实拍照片"
  },
  "Lưu tin": {
    "en": "Save Listing",
    "zh": "收藏车源"
  },
  "Đã lưu": {
    "en": "Saved",
    "zh": "已收藏"
  },
  "Chia sẻ": {
    "en": "Share",
    "zh": "分享"
  },
  "Đăng ngày:": {
    "en": "Posted:",
    "zh": "发布日期："
  },
  "Mã tin:": {
    "en": "Listing ID:",
    "zh": "车源编号："
  },
  "Giá niêm yết công khai": {
    "en": "Public Listed Price",
    "zh": "公开挂牌底价"
  },
  "Ước tính trả góp từ": {
    "en": "Est. installment from",
    "zh": "预估分期月供自"
  },
  "NĂM SX": {
    "en": "YEAR",
    "zh": "生产年份"
  },
  "Năm SX": {
    "en": "Year",
    "zh": "生产年份"
  },
  "SỐ ODO": {
    "en": "ODO",
    "zh": "表显里程"
  },
  "Số ODO": {
    "en": "ODO",
    "zh": "表显里程"
  },
  "SỐ CHỖ": {
    "en": "SEATS",
    "zh": "座位核载"
  },
  "Số chỗ": {
    "en": "Seats",
    "zh": "座位核载"
  },
  "5 chỗ": {
    "en": "5 seats",
    "zh": "5座"
  },
  "7 chỗ": {
    "en": "7 seats",
    "zh": "7座"
  },
  "4 chỗ": {
    "en": "4 seats",
    "zh": "4座"
  },
  "Lắp ráp trong nước": {
    "en": "Domestic Assembly",
    "zh": "国内组装"
  },
  "Nhập khẩu": {
    "en": "Imported",
    "zh": "整车进口"
  },
  "Thông số kỹ thuật chi tiết": {
    "en": "Detailed Specifications",
    "zh": "详细技术规格参数"
  },
  "Hãng sản xuất:": {
    "en": "Manufacturer:",
    "zh": "制造厂商："
  },
  "Dòng xe (Model):": {
    "en": "Model:",
    "zh": "车型系列："
  },
  "Phiên bản:": {
    "en": "Trim / Version:",
    "zh": "具体版本："
  },
  "Kiểu dáng (Body type):": {
    "en": "Body Type:",
    "zh": "车身结构："
  },
  "Màu ngoại thất:": {
    "en": "Exterior Color:",
    "zh": "外观颜色："
  },
  "Màu nội thất:": {
    "en": "Interior Color:",
    "zh": "内饰颜色："
  },
  "Động cơ:": {
    "en": "Engine:",
    "zh": "发动机："
  },
  "Công suất cực đại:": {
    "en": "Max Power:",
    "zh": "最大功率："
  },
  "Hệ dẫn động:": {
    "en": "Drivetrain:",
    "zh": "驱动方式："
  },
  "Chế độ bảo hành:": {
    "en": "Warranty:",
    "zh": "质保方案："
  },
  "Trắng tuyết": {
    "en": "Snow White",
    "zh": "雪白"
  },
  "Trắng ngọc trai": {
    "en": "Pearl White",
    "zh": "珍珠白"
  },
  "Đen huyền bí": {
    "en": "Obsidian Black",
    "zh": "曜石黑"
  },
  "Đen da cao cấp": {
    "en": "Premium Black Leather",
    "zh": "高级黑色真皮"
  },
  "Nâu da cao cấp": {
    "en": "Premium Brown Leather",
    "zh": "高级棕色真皮"
  },
  "Kem thanh lịch": {
    "en": "Elegant Beige",
    "zh": "优雅米色"
  },
  "Đỏ pha lê": {
    "en": "Crystal Red",
    "zh": "水晶红"
  },
  "Xanh đại dương": {
    "en": "Ocean Blue",
    "zh": "海蓝色"
  },
  "Xám titan": {
    "en": "Titanium Grey",
    "zh": "钛灰色"
  },
  "Cầu trước (FWD)": {
    "en": "Front-Wheel Drive (FWD)",
    "zh": "前轮驱动 (FWD)"
  },
  "Cầu sau (RWD)": {
    "en": "Rear-Wheel Drive (RWD)",
    "zh": "后轮驱动 (RWD)"
  },
  "Bốn bánh (AWD)": {
    "en": "All-Wheel Drive (AWD)",
    "zh": "四轮驱动 (AWD)"
  },
  "Bốn bánh (4WD)": {
    "en": "Four-Wheel Drive (4WD)",
    "zh": "分时四驱 (4WD)"
  },
  "Bảo hành lịch sử tại Hyundai Phạm Văn Đồng": {
    "en": "Official Service Warranty at Hyundai Pham Van Dong",
    "zh": "现代范文同4S店官方保修"
  },
  "186 mã lực / 4.000 rpm": {
    "en": "186 hp / 4,000 rpm",
    "zh": "186马力 / 4,000转"
  },
  "140 mã lực": {
    "en": "140 hp",
    "zh": "140马力"
  },
  "150 mã lực": {
    "en": "150 hp",
    "zh": "150马力"
  },
  "170 mã lực": {
    "en": "170 hp",
    "zh": "170马力"
  },
  "200 mã lực": {
    "en": "200 hp",
    "zh": "200马力"
  },
  "Động cơ điện đồng bộ": {
    "en": "Synchronous Electric Motor",
    "zh": "永磁同步电动机"
  },
  "1.8L DOHC 4 xy-lanh": {
    "en": "1.8L DOHC 4-Cylinder",
    "zh": "1.8L DOHC 直列四缸"
  },
  "2.0L Smartstream Dầu": {
    "en": "2.0L Smartstream Diesel",
    "zh": "2.0L Smartstream 柴油机"
  },
  "1.5L Turbo xăng": {
    "en": "1.5L Turbo Petrol",
    "zh": "1.5L 涡轮增压汽油"
  },
  "Hybrid": {
    "en": "Hybrid",
    "zh": "油电混动"
  },
  "Ước tính hạn mức vay và số tiền gốc + lãi trả hàng tháng": {
    "en": "Estimate loan limit and monthly principal + interest payments",
    "zh": "测算贷款额度与每月本息还款额"
  },
  "Tỷ lệ trả trước:": {
    "en": "Down payment ratio:",
    "zh": "首付比例："
  },
  "Thời hạn vay:": {
    "en": "Loan term:",
    "zh": "贷款期限："
  },
  "Lãi suất ưu đãi:": {
    "en": "Preferential interest rate:",
    "zh": "优惠年利率："
  },
  "Số tiền vay:": {
    "en": "Loan amount:",
    "zh": "贷款总额："
  },
  "Gốc trả hàng tháng:": {
    "en": "Monthly principal:",
    "zh": "每月本金："
  },
  "Lãi tháng đầu:": {
    "en": "First month interest:",
    "zh": "首月利息："
  },
  "Ước tính trả góp tháng đầu (Gốc + Lãi)": {
    "en": "Est. first month payment (Principal + Interest)",
    "zh": "预估首月还款总额（本金+利息）"
  },
  "Đăng ký tư vấn vay gói này": {
    "en": "Apply for this loan package",
    "zh": "申请此分期方案咨询"
  },
  "Đã thẩm định 176 hạng mục • Bảo hành chính hãng": {
    "en": "176 Items Certified • Official Warranty",
    "zh": "176 项全面严检 • 官方原厂质保"
  },
  "Tin đăng chưa công khai": {
    "en": "Listing Not Public",
    "zh": "车源尚未公开"
  },
  "Nút liên hệ mua xe chỉ hiển thị khi tin đăng ở trạng thái Đang hiển thị (Active).": {
    "en": "Contact buttons only display when the listing is in Active status.",
    "zh": "仅当车源处于公开展示（Active）状态时才显示联系方式。"
  },
  "Xem tất cả bài viết & đánh giá >": {
    "en": "View all articles & reviews >",
    "zh": "浏览全部资讯与评测 >"
  },
  "Danh Sách Bài Viết": {
    "en": "Article Catalog",
    "zh": "文章资讯列表"
  },
  "Tìm kiếm bài viết, cẩm nang...": {
    "en": "Search articles, guides...",
    "zh": "搜索文章、验车指南..."
  },
  "THỊ TRƯỜNG Ô TÔ": {
    "en": "AUTOMOTIVE MARKET",
    "zh": "汽车市场动态"
  },
  "KINH NGHIỆM XEM XE": {
    "en": "CAR INSPECTION GUIDE",
    "zh": "二手车验车宝典"
  },
  "Kinh nghiệm xem xe": {
    "en": "Car inspection guide",
    "zh": "二手车验车宝典"
  },
  "SO SÁNH CHI PHÍ": {
    "en": "COST COMPARISON",
    "zh": "用车成本横评"
  },
  "So sánh chi phí": {
    "en": "Cost comparison",
    "zh": "用车成本横评"
  },
  "THỦ TỤC PHÁP LÝ": {
    "en": "LEGAL PROCEDURES",
    "zh": "法律过户手续"
  },
  "Thủ tục pháp lý": {
    "en": "Legal procedures",
    "zh": "法律过户手续"
  },
  "TIÊU ĐIỂM ĐÁNH GIÁ": {
    "en": "FEATURED REVIEWS",
    "zh": "焦点深度测评"
  },
  "Tiêu điểm đánh giá": {
    "en": "Featured reviews",
    "zh": "焦点深度测评"
  },
  "CHĂM SÓC XE": {
    "en": "CAR CARE",
    "zh": "养车养护宝典"
  },
  "TƯ VẤN MUA XE": {
    "en": "BUYING ADVICE",
    "zh": "购车选车指南"
  },
  "LÁI THỬ XE CŨ": {
    "en": "TEST DRIVE GUIDE",
    "zh": "二手车试驾技巧"
  },
  "PHÁP LÝ Ô TÔ": {
    "en": "CAR LEGAL",
    "zh": "汽车法律合规"
  },
  "XE SANG CŨ": {
    "en": "USED LUXURY CARS",
    "zh": "二手豪华汽车"
  },
  "KINH NGHIỆM MUA XE": {
    "en": "CAR BUYING EXPERIENCE",
    "zh": "买车避坑指南"
  },
  "ĐÁNH GIÁ XE ĐIỆN": {
    "en": "EV REVIEW",
    "zh": "电动汽车测评"
  },
  "TƯ VẤN CHỌN XE": {
    "en": "CAR ADVISORY",
    "zh": "选车顾问指南"
  },
  "Tra cứu thủ tục pháp lý": {
    "en": "Legal Procedure Lookup",
    "zh": "查询法律过户手续"
  },
  "Thủ Tục Sang Tên Đổi Chủ & Phạt Nguội 2026": {
    "en": "Title Transfer & Traffic Fine Check 2026",
    "zh": "2026年车辆过户更名与交通违章罚款查缴指南"
  },
  "Xem hướng dẫn →": {
    "en": "View Guide →",
    "zh": "查看办事指南 →"
  },
  "Xem hướng dẫn": {
    "en": "View Guide",
    "zh": "查看办事指南"
  },
  "Đọc tiếp →": {
    "en": "Read more →",
    "zh": "阅读全文 →"
  },
  "Đọc bài viết đầy đủ →": {
    "en": "Read Full Article →",
    "zh": "阅读完整文章 →"
  },
  "Tác giả: Ban Biên Tập OtoMarket": {
    "en": "Author: OtoMarket Editorial Board",
    "zh": "作者：OtoMarket 编辑部"
  },
  "Ban Biên Tập OtoMarket": {
    "en": "OtoMarket Editorial Board",
    "zh": "OtoMarket 编辑部"
  },
  "Ban Biên Tập Tin Tức & Thị Trường OtoMarket": {
    "en": "OtoMarket News & Market Editorial Team",
    "zh": "OtoMarket 资讯与市场编辑部"
  },
  "VinFast Bàn Giao 70.085 Ô Tô Điện Và 286.039 Xe Máy, Xe Đạp Điện Trong Quý II/2026": {
    "en": "VinFast Delivers 70,085 Electric Cars & 286,039 Electric Bikes in Q2/2026",
    "zh": "VinFast 2026年第二季度交付 70,085 辆电动汽车与 286,039 辆两轮电动车"
  },
  "VinFast bàn giao 70.085 ô tô điện và 286.039 xe máy, xe đạp điện trong quý II/2026": {
    "en": "VinFast delivers 70,085 electric cars and 286,039 electric bikes in Q2/2026",
    "zh": "VinFast 2026年第二季度交付 70,085 辆电动汽车与 286,039 辆两轮电动车"
  },
  "Doanh số toàn cầu của VinFast ghi nhận mức tăng trưởng ấn tượng ở cả hai mảng ô tô điện và xe máy điện. Doanh thu bán xe đạt 28.833,1 tỷ đồng, tăng 92,7% so với cùng kỳ năm trước, nhờ lực kéo từ cả thị trường trong nước lẫn mở rộng quốc tế.": {
    "en": "VinFast's global sales recorded impressive growth in both electric cars and two-wheelers. Automotive revenue reached 28,833.1 billion VND, up 92.7% year-over-year, driven by strong domestic momentum and international expansion.",
    "zh": "VinFast全球销量在电动汽车与电动摩托车两大赛道均实现强劲增长。汽车业务收入达28.8331万亿越南盾，同比增长92.7%，得益于本土市场的持续向好以及全球出海战略的稳步扩张。"
  },
  "Doanh số toàn cầu của VinFast ghi nhận mức tăng trưởng ấn tượng ở cả hai mảng ô tô điện và xe máy điện. Doanh thu bán xe đạt 28.833,1 tỷ đồng, tăng 92,7% so với cùng kỳ năm trước.": {
    "en": "VinFast's global sales recorded impressive growth in both electric cars and electric scooters. Vehicle sales revenue reached 28,833.1 billion VND, up 92.7% year-over-year.",
    "zh": "VinFast全球销售在电动汽车与电动两轮车板块均录得亮眼增速，整车销售收入达28.8331万亿越南盾，较去年同期暴增92.7%。"
  },
  "Theo báo cáo kết quả tài chính chưa kiểm toán quý II/2026, VinFast ghi nhận sự bứt phá mạnh mẽ với 70.085 ô tô điện được bàn giao trên toàn cầu, tăng 20% so với quý trước và tăng trưởng ấn tượng 96% so với cùng kỳ năm 2025.": {
    "en": "According to the unaudited financial report for Q2/2026, VinFast achieved remarkable breakthrough with 70,085 electric cars delivered globally, up 20% from previous quarter and 96% year-over-year.",
    "zh": "根据2026年第二季度未经审计的财务报告，VinFast全球交付70,085辆纯电动汽车，环比上一季度增长20%，同比2025年同期大幅增长96%。"
  },
  "Các Bước Kiểm Tra Ô Tô Cũ Tránh Mua Phải Xe Bị Thủy Kích Hoặc Ngập Nước": {
    "en": "Steps to Inspect Used Cars to Avoid Hydro-Locked or Flood-Damaged Vehicles",
    "zh": "二手车避坑实操：手把手教你鉴别水泡车与涉水发动机水锁车"
  },
  "Các Bước Kiểm Tra Ô Tô Cũ Tránh Mua Phải Xe Bị Thủy Kích": {
    "en": "Steps to Inspect Used Cars to Avoid Water Damage & Hydro-Lock",
    "zh": "二手车避坑实操：教你鉴别水泡车与涉水发动机水锁车"
  },
  "Hướng dẫn chi tiết cách soi ốc giàn đầu, dây an toàn, mùi ẩm mốc gầm sàn và check lịch sử bảo dưỡng xe.": {
    "en": "Detailed guide on inspecting front-end bolts, seatbelts, floor musty odors, and checking dealer maintenance history.",
    "zh": "详尽教学：手电筒排查机舱螺丝拧动痕迹、安全带底部水渍霉迹、地毯底层霉味及调取4S店原厂维保记录。"
  },
  "Trải Nghiệm Thực Tế VinFast VF 8 Sau Quãng Đường Dài": {
    "en": "Real-World Experience with VinFast VF 8 on Long-Distance Trips",
    "zh": "长途实测体验：VinFast VF 8 跨城长途真实用车报告"
  },
  "Chi phí sạc điện so với xăng, hiệu quả trạm sạc trên các tuyến quốc lộ và cảm giác lái trên đường trường.": {
    "en": "Charging costs vs. petrol, highway fast-charging network efficiency, and long-range highway driving dynamics.",
    "zh": "深度对比：百公里电费与燃油成本差距、国道高功率快充桩补能效率及高速巡航真实操控质感。"
  },
  "Gợi Ý Mẫu SUV Đô Thị Tầm Giá 600 - 800 Triệu Phổ Biến": {
    "en": "Popular Urban SUVs in the 600 - 800 Million VND Price Range",
    "zh": "城市SUV精选导购：6亿至8亿越南盾（600-800百万）热门高性价比车型"
  },
  "So sánh chi phí sử dụng và độ bền bỉ giữa Toyota Corolla Cross, Mazda CX-5, Hyundai Creta và Kia Seltos.": {
    "en": "Comparing operating costs and long-term reliability among Toyota Corolla Cross, Mazda CX-5, Hyundai Creta, and Kia Seltos.",
    "zh": "深度横评：丰田卡罗拉锐放、马自达CX-5、现代Creta与起亚Seltos的综合养车成本与长期耐用度对比。"
  },
  "Quy Trình Sang Tên Đổi Chủ Và Kiểm Tra Phạt Nguội Ô Tô": {
    "en": "Car Title Transfer Process & Checking Electronic Traffic Fines",
    "zh": "车辆过户更名标准流程与全国非现场电子警察违章查缴指南"
  },
  "Hồ sơ cần chuẩn bị, chi phí công chứng và các bước đăng ký biển định danh theo quy định hiện hành.": {
    "en": "Required documents, notary fees, and step-by-step personal identity license plate registration under current regulations.",
    "zh": "办理要件清单、公证费用明细以及依据最新交管法规申领专属个人身份车牌的全套步骤。"
  },
  "So Sánh Chi Phí Nuôi SUV 7 Chỗ: Ford Everest vs Kia Carnival Sau 30.000 km": {
    "en": "7-Seater SUV Running Cost: Ford Everest vs Kia Carnival After 30,000 km",
    "zh": "7座SUV养车成本大PK：福特撼路者 vs 起亚嘉华 3万公里实测对比"
  },
  "Bảo Dưỡng Ô Tô Cũ Định Kỳ: Danh Mục Cần Thay Thế Sau 50.000 km": {
    "en": "Periodic Used Car Maintenance: Key Parts to Replace After 50,000 km",
    "zh": "二手车定期保养清单：行驶5万公里后必须更换的核心零部件"
  },
  "Những Lưu Ý Quan Trọng Khi Mua Xe Sang Đức Cũ (Mercedes, BMW, Audi)": {
    "en": "Important Tips When Buying Pre-Owned German Luxury Cars (Mercedes, BMW, Audi)",
    "zh": "二手德系豪华车避坑指南：购买老款奔驰、宝马、奥迪的必知秘籍"
  },
  "Kinh Nghiệm Lái Thử Ô Tô Cũ Trước Khi Xuống Tiền Đặt Cọc": {
    "en": "Used Car Test Driving Tips Before Putting Down a Deposit",
    "zh": "真金白银下定金前：老司机教你如何通过实车试驾摸清底细"
  },
  "Quy Trình Rút Hồ Sơ Gốc & Sang Tên Biển Số Định Danh Năm 2026": {
    "en": "Original File Extraction & Identity Plate Transfer Process in 2026",
    "zh": "2026年车辆档案迁出提档与专属身份号牌过户全流程指引"
  },
  "Gợi Ý Mẫu SUV Đô Thị Phù Hợp Tầm Giá 600 - 800 Triệu Đồng": {
    "en": "Top Urban SUVs Suited for 600 - 800 Million VND Budget",
    "zh": "600-800百万预算区间最值得购买的城市紧凑型SUV推荐"
  },
  "Đánh Giá Thực Tế VinFast VF 8 Sau 1 Năm: Chi Phí Sạc Điện Và Trải Nghiệm Đường Dài": {
    "en": "Real-World Review: 1 Year with VinFast VF 8 - Charging Costs & Road Trip Experience",
    "zh": "车主真实长测：VinFast VF 8 拥车满一周年充能开销与长途自驾实录"
  },
  "Kiến Tạo Chuẩn Mực Mới": {
    "en": "Creating New Standards",
    "zh": "开创行业崭新标杆"
  },
  "Trong Giao Dịch Ô Tô Trực Tuyến": {
    "en": "In Online Automotive Trading",
    "zh": "重塑线上汽车交易生态"
  },
  "OtoMarket là nền tảng công nghệ số hóa thị trường thương mại ô tô, ra đời nhằm thiết lập môi trường giao dịch": {
    "en": "OtoMarket is a digital automotive trading technology platform designed to establish a trading environment that is",
    "zh": "OtoMarket 是一家数字化汽车交易科技平台，旨在构建一个"
  },
  "minh bạch, tin cậy và không qua trung gian môi giới": {
    "en": "transparent, trustworthy, and free of unnecessary middleman brokers",
    "zh": "透明、可信赖且去除中介中转的阳光交易环境"
  },
  "minh bạch, tin cậy và không qua trung gian môi giới.": {
    "en": "transparent, trustworthy, and free of middleman brokers.",
    "zh": "透明、可信赖且去除中介中转的阳光交易环境。"
  },
  "Chúng tôi kết nối trực tiếp Người Cần Mua và Người Đang Bán, chuẩn hóa quy trình rà soát dữ liệu kỹ thuật và thẩm định thông tin xe thực tế.": {
    "en": "We directly connect Buyers with Sellers, standardizing vehicle technical data verification and physical inspection protocols.",
    "zh": "我们直接连接买卖双方，规范车辆技术数据核查与实车现场核验标准流程。"
  },
  ". Chúng tôi kết nối trực tiếp Người Cần Mua và Người Đang Bán, chuẩn hóa quy trình rà soát dữ liệu kỹ thuật và thẩm định thông tin xe thực tế.": {
    "en": ". We directly connect Buyers with Sellers, standardizing technical data verification and physical inspection protocols.",
    "zh": "。我们直接连接买卖双方，规范车辆技术数据核查与实车现场核验标准流程。"
  },
  "Sàn kết nối trực tiếp Người Mua & Người Bán (C2C & B2C)": {
    "en": "Direct Buyer-Seller Marketplace (C2C & B2C)",
    "zh": "买家与卖家直连平台（C2C 与 B2C）"
  },
  "Vì Sao OtoMarket Ra Đời?": {
    "en": "Why OtoMarket was Founded",
    "zh": "为何创立 OtoMarket？"
  },
  "Tại Việt Nam, giao dịch ô tô là quyết định tài chính quan trọng nhưng người dùng thường đối mặt với tin ảo phá giá câu view, tua đồng hồ ODO, che giấu lịch sử xe và các cuộc gọi môi giới phiền toái. OtoMarket ra đời để giải quyết triệt để rào cản này bằng công nghệ minh bạch.": {
    "en": "In Vietnam, buying a car is a major financial milestone, yet buyers frequently face fake listings, rolled-back odometers, concealed accident history, and annoying broker spam. OtoMarket was built to solve these pain points through transparent technology.",
    "zh": "在越南，汽车交易是重大的家庭财务决策，但消费者经常饱受虚假引流车源、恶意篡改里程表、隐瞒事故水泡暗病及骚扰电话之苦。OtoMarket 应运而生，用前沿数字化技术彻底破解这一诚信痛点。"
  },
  "Sứ Mệnh Doanh Nghiệp": {
    "en": "Corporate Mission",
    "zh": "企业核心使命"
  },
  "Minh bạch hóa thị trường mua bán xe ô tô, bảo vệ quyền lợi chính đáng của cả Người Cần Mua và Người Đang Bán. Mang đến một công cụ số chuẩn mực, giúp việc tìm kiếm xe, hẹn xem xe và hoàn tất thủ tục trở nên an tâm, thuận tiện.": {
    "en": "Transparentize the automotive marketplace, protecting the rightful interests of both buyers and sellers. Delivering a standardized digital platform making car discovery, inspection scheduling, and closing completely secure and effortless.",
    "zh": "打造阳光透明的汽车交易市场，全力捍卫买卖双方的合法权益。提供业界标杆级的数字化工具，让挑车比价、预约看车到合同交付全程舒心无忧。"
  },
  "Định Hướng Bền Vững": {
    "en": "Sustainable Vision",
    "zh": "可持续发展愿景"
  },
  "Xây dựng nền tảng thương mại điện tử ô tô đáng tin cậy cho cộng đồng người dùng, từng bước mở rộng trung tâm hỗ trợ kỹ thuật tại các đô thị trọng điểm, lấy sự trung thực và minh bạch dữ liệu làm kim chỉ nam vận hành.": {
    "en": "Building the most trusted automotive e-commerce platform for motorists, progressively expanding technical support inspection hubs across major cities, guided by integrity and data transparency.",
    "zh": "构筑深受广大车主与用户信赖的汽车电商基石，逐步在重点核心城市铺设实车检测技术中心，以数据真实与信息透明作为最高运营准则。"
  },
  "Giá Trị Cốt Lõi Định Hình OtoMarket": {
    "en": "Core Values Defining OtoMarket",
    "zh": "塑造 OtoMarket 的核心价值观"
  },
  "Mọi tính năng công nghệ, quy chế kiểm duyệt và chính sách vận hành của sàn đều dựa trên 4 nguyên tắc đạo đức nghề nghiệp:": {
    "en": "Every feature, moderation rule, and platform policy is anchored in our 4 core ethical principles:",
    "zh": "全平台每一项技术功能、审核规范与运营准则均牢牢植根于 4 项职业道德信条："
  },
  "Minh Bạch Thông Tin": {
    "en": "Information Transparency",
    "zh": "信息真实透明"
  },
  "Giá niêm yết là giá bán thực tế, không chi phí ẩn, không tạo sự mập mờ, hỗ trợ so sánh dữ liệu rõ ràng.": {
    "en": "Listed prices are actual transaction figures, with zero hidden markups or ambiguous fees, backed by transparent vehicle comparisons.",
    "zh": "标价即为真实出售报价，坚决杜绝隐性加价与含糊其辞，支持全维度参数清晰对比。"
  },
  "Kiểm Duyệt Nghiêm Ngặt": {
    "en": "Rigorous Moderation",
    "zh": "严苛前置审核"
  },
  "Từ chối tin ảo, ảnh mờ catalogue hoặc thông tin sai lệch. Mọi tin đăng đều trải qua quy trình kiểm soát nội dung.": {
    "en": "Zero tolerance for fake posts, blurry catalogue renders, or fraudulent details. Every listing passes through strict content screening.",
    "zh": "拒收一切虚假虚报、模糊网图及不实参数，全量上架信息均经人工与算法双重质检。"
  },
  "Không Môi Giới Phức Tạp": {
    "en": "No Middleman Hassles",
    "zh": "拒绝中介骚扰"
  },
  "Kết nối trực tiếp giữa người có xe và người cần mua. Người dùng chủ động liên hệ điện thoại hoặc Zalo xem xe.": {
    "en": "Direct bridge between legitimate car owners and real buyers. Contact sellers directly via phone or Zalo for inspection.",
    "zh": "直接打通一手车主与意向买家之间的沟通桥梁，支持电话或Zalo随时一键直联约见。"
  },
  "Đồng Hành Tận Tâm": {
    "en": "Dedicated Assistance",
    "zh": "全流程贴心护航"
  },
  "Tổng đài hỗ trợ giải đáp thắc mắc, cung cấp cẩm nang 3 bước giao dịch an toàn và tiếp nhận xử lý báo cáo vi phạm.": {
    "en": "Customer support hotline ready to answer questions, provide safe transaction guides, and promptly handle user violation reports.",
    "zh": "专业客服热线随时答疑解惑，免费提供三步安全购车指引，并全天候受理违规查实举证。"
  },
  "Quy Trình Kiểm Duyệt Tin Xe Thực Tế": {
    "en": "Physical Car Listing Moderation Workflow",
    "zh": "真实车源严格审核全流程"
  },
  "Để đảm bảo kho xe trực tuyến luôn chính xác và đáng tin cậy, đội ngũ quản trị sàn áp dụng 4 tiêu chuẩn thẩm duyệt bắt buộc đối với mỗi tin đăng:": {
    "en": "To guarantee our marketplace inventory remains accurate and reliable, our admin team enforces 4 mandatory verification standards for every listing:",
    "zh": "为保障全网在线车源绝对真实可信，平台运营审核团队对每一条上架信息严格执行 4 道准入审查关卡："
  },
  "Ảnh Chụp Thực Tế Rõ Nét": {
    "en": "Clear Physical Photos",
    "zh": "多角度高清实拍验真"
  },
  "Từ chối ảnh sao chép từ mạng xã hội, ảnh mờ không rõ biển số hoặc không phản ánh đúng ngoại thất xe thực tế.": {
    "en": "Reject stock photos copied from social media, blurry license plates, or pictures failing to reflect actual car exterior conditions.",
    "zh": "坚决下架网络抄袭盗图、车牌遮挡及无法真实体现外观漆面机械实况的劣质照片。"
  },
  "Giá Bán Niêm Yết Thật": {
    "en": "Authentic Pricing",
    "zh": "真实底价明码标示"
  },
  "Nghiêm cấm mức giá ảo 0đ, 1 triệu câu view. Người bán bắt buộc niêm yết đúng số tiền chuyển nhượng mong muốn.": {
    "en": "Strict prohibition of 0 VND or 1M VND bait pricing. Sellers must enter the exact intended transfer amount.",
    "zh": "严厉打击0元引流、100万钓鱼等虚假标价行为，卖家必须如实填写真实转让心理成交价。"
  },
  "Xác Thực Người Đăng Tin": {
    "en": "Seller Verification",
    "zh": "实名认证真实发布者"
  },
  "Mỗi tin đăng phải gắn liền với số điện thoại liên lạc hợp lệ để người mua kết nối trực tiếp, tránh tin nặc danh.": {
    "en": "Each listing must be bound to a verified valid phone number for direct connection, eliminating anonymous spam.",
    "zh": "每一则车源必须严格绑定实名有效手机号码以便买家直接联系，杜绝任何匿名散布虚假广告。"
  },
  "Ngăn Ngừa Tin Trùng Lặp & Spam": {
    "en": "Spam & Duplicate Prevention",
    "zh": "智能查重防刷防滥发"
  },
  "Hệ thống tự động phát hiện số khung (VIN) và biển số xe để hạn chế việc đăng lặp lại nhiều lần cùng một phương tiện.": {
    "en": "System automatically cross-references VINs and license plates to block duplicate posts of the same vehicle.",
    "zh": "智能系统深度匹配车架号（VIN）与车牌号码，强力遏制同车多次刷屏滥发行为。"
  },
  "Trung Tâm Công Nghệ OtoMarket": {
    "en": "OtoMarket Technology Center",
    "zh": "OtoMarket 科技研发中心"
  },
  "Đường Trần Phú, TP. Nha Trang, Tỉnh Khánh Hòa.": {
    "en": "Tran Phu St., Nha Trang City, Khanh Hoa Province.",
    "zh": "庆和省芽庄市陈富路。"
  },
  "Nơi đặt máy chủ điều hành, bộ phận kỹ thuật kiểm duyệt thông tin xe và văn phòng hỗ trợ khách hàng.": {
    "en": "Headquarters of primary cloud servers, vehicle data inspection engineering team, and customer support operations.",
    "zh": "云核心调度服务器、车源数据质检工程团队及客户服务中心的所在地。"
  },
  "Cẩm Nang 3 Bước Giao Dịch Xe Trực Tuyến An Toàn": {
    "en": "3-Step Safe Online Car Trading Handbook",
    "zh": "线上汽车安全交易 3 步避坑宝典"
  },
  "Khuyến nghị dành cho người mua xe nhằm đảm bảo quyền lợi pháp lý và kỹ thuật:": {
    "en": "Actionable recommendations for car buyers to guarantee technical condition and legal title:",
    "zh": "面向广大购车用户的切实验车建议，全方位护航合法车况与产权权属："
  },
  "Xem xe & Lái thử": {
    "en": "Inspect & Test Drive",
    "zh": "实地看车与实地试驾"
  },
  "Hẹn gặp người bán tại garage uy tín để kiểm tra thân vỏ, khung gầm và khoang máy.": {
    "en": "Meet the seller at a reputable third-party garage to inspect bodywork, chassis, and engine compartment.",
    "zh": "约定在信誉优良的独立第三方维修厂碰面，全面核验车漆钣金、底盘机件与发动机机舱。"
  },
  "Đối chiếu giấy tờ gốc": {
    "en": "Verify Original Documents",
    "zh": "核对全套原版证件"
  },
  "Kiểm tra Cà-vẹt (Đăng ký xe), sổ đăng kiểm và tra cứu dữ liệu phạt nguội chính thức.": {
    "en": "Carefully check vehicle registration certificate, periodic roadworthiness book, and national traffic fine database.",
    "zh": "仔细核验行驶证原件、机动车定期检验合格证，并现场联机官方交管数据库查询违章罚款。"
  },
  "Công chứng hợp đồng": {
    "en": "Notarize Sales Agreement",
    "zh": "公证处签订正式合同"
  },
  "Ký hợp đồng mua bán tại Văn phòng công chứng trước khi bàn giao xe và thanh toán.": {
    "en": "Sign sales transfer contract at a certified Notary Public office before handover of keys and payment transfer.",
    "zh": "在法定公证处当面签署机动车买卖合同并完成公证后，方可完成车钥匙交接与全额付款。"
  },
  "Giải Đáp Thắc Mắc Thường Gặp": {
    "en": "Frequently Asked Questions",
    "zh": "常见热点问题权威解答"
  },
  "Những câu hỏi phổ biến của khách hàng khi tham gia giao dịch trên sàn OtoMarket:": {
    "en": "Common inquiries from customers participating in transactions on OtoMarket:",
    "zh": "车友与买卖双方在 OtoMarket 交易过程中最常咨询的重点疑难解答："
  },
  "OtoMarket kiểm duyệt tin đăng bán xe như thế nào?": {
    "en": "How does OtoMarket moderate vehicle listings?",
    "zh": "OtoMarket 是如何对上架车源进行严格质检验真的？"
  },
  "Sau khi người bán gửi thông tin, đội ngũ quản trị sàn sẽ rà soát ảnh chụp thực tế, thông số kỹ thuật và tính hợp lý của giá bán trong vòng 15 phút. Khi đạt tiêu chuẩn tin sạch, bài đăng sẽ được xuất bản công khai.": {
    "en": "After submission, our audit team reviews actual photos, technical specifications, and price validity within 15 minutes. Once certified as clean data, the listing is published immediately.",
    "zh": "卖家提交车源后，平台审核团队将在15分钟内快速审查实拍照片、机械参数及标价合理性。核查无误达到优质标准后立即全网公开发布。"
  },
  "Đăng tin bán xe trên OtoMarket có mất phí không?": {
    "en": "Is posting a car listing on OtoMarket free of charge?",
    "zh": "在 OtoMarket 平台上发布个人卖车信息需要收费吗？"
  },
  "Hiện tại OtoMarket hỗ trợ đăng tin bán xe hoàn toàn miễn phí cho người dùng cá nhân có nhu cầu bán xe chính chủ, tiếp cận nhanh chóng đến người mua tiềm năng.": {
    "en": "Currently, OtoMarket provides 100% free car listing for individual private owners, allowing immediate reach to thousands of potential buyers.",
    "zh": "目前 OtoMarket 为广大个人一手真实车主提供完全免费的卖车发帖服务，助您零门槛高效触达海量意向买家。"
  },
  "Làm thế nào để người mua liên hệ và xem xe thực tế?": {
    "en": "How do buyers connect and schedule a physical vehicle viewing?",
    "zh": "买家如何与车主取得联系并预约实地看车？"
  },
  "Người mua có thể bấm nút Gọi điện hoặc Nhắn tin Zalo trực tiếp với người bán trên từng trang chi tiết xe. Hai bên chủ động hẹn thời gian và địa điểm xem xe thực tế mà không qua trung gian.": {
    "en": "Buyers can click 'Call' or 'Zalo' directly on any car detail page to schedule an inspection at mutually agreed time and place without third-party fees.",
    "zh": "买家可直接点击车辆详情页中的“致电”或“Zalo在线沟通”按钮直联车主，双方自由敲定验车时间与碰面地点，无任何中间差价。"
  },
  "Nếu phát hiện tin xe đăng giá ảo hoặc thông tin sai lệch thì sao?": {
    "en": "What happens if a fake price or inaccurate information is reported?",
    "zh": "如果发现虚假低价引流或信息严重不实的车源，该如何处理？"
  },
  "Bạn có thể sử dụng nút Báo cáo vi phạm ở cuối trang chi tiết xe. Đội ngũ kiểm duyệt sẽ xác minh trong vòng 24 giờ và gỡ bỏ ngay lập tức nếu vi phạm quy chế sàn.": {
    "en": "You can use the 'Report Violation' button at the bottom of the vehicle page. Our audit team will verify within 24 hours and take down infringing listings immediately.",
    "zh": "您可以直接点击详情页底部的“举报违规”按钮一键举证。核查团队将在24小时内核实事实，一经查实立即全网下架屏蔽该车源。"
  },
  "Trạm Kiểm Duyệt & Quản lý Showroom": {
    "en": "Showroom Inspection & Management Portal",
    "zh": "展厅车源审核与管理工作台"
  },
  "Trạm Kiểm Duyệt & Quản Trị Showroom - Sàn Xe OtoMarket": {
    "en": "Showroom Inspection & Admin Center - OtoMarket",
    "zh": "展厅车源审核与管理工作台 - OtoMarket"
  },
  "Khách cá nhân gửi": {
    "en": "Submitted by private owner",
    "zh": "个人车主申请提审"
  },
  "Khách cá nhân": {
    "en": "Private Seller",
    "zh": "个人卖家"
  },
  "Showroom gửi": {
    "en": "Submitted by Showroom",
    "zh": "官方展厅提审"
  },
  "-- Chọn lý do vi phạm --": {
    "en": "-- Select reason for violation --",
    "zh": "-- 请选择违规举报原因 --"
  },
  "Xe đã bán nhưng chưa hạ tin": {
    "en": "Car already sold but listing remains",
    "zh": "车辆已售但未及时下架"
  },
  "Giá ảo, không đúng giá thực tế": {
    "en": "Fake price, does not match actual amount",
    "zh": "虚假钓鱼标价，与实际售价不符"
  },
  "Thông tin sai sự thật (Giá, đời xe, ODO...)": {
    "en": "False details (Price, Year, Mileage...)",
    "zh": "车辆信息造假（虚报价格、年限、里程等）"
  },
  "Người bán không liên lạc được": {
    "en": "Seller cannot be contacted",
    "zh": "车主失联无法取得联系"
  },
  "Lý do khác": {
    "en": "Other reason",
    "zh": "其他违规原因"
  },
  "Gửi báo cáo": {
    "en": "Submit Report",
    "zh": "提交举报信息"
  },
  "Đóng": {
    "en": "Close",
    "zh": "关闭"
  },
  "Hủy": {
    "en": "Cancel",
    "zh": "取消"
  },
  "Xác nhận": {
    "en": "Confirm",
    "zh": "确认提交"
  },
  "Lý do từ chối": {
    "en": "Rejection reason",
    "zh": "驳回具体原因"
  },
  "Vui lòng chọn nhanh lý do hoặc ghi chi tiết để gửi phản hồi hướng dẫn cho người bán:": {
    "en": "Please choose a reason or enter details to provide guidance feedback to seller:",
    "zh": "请选择或输入具体原因，以便向车主发送针对性的整改修改指引："
  },
  "Gửi phản hồi từ chối": {
    "en": "Send Rejection Feedback",
    "zh": "发送整改通知并驳回"
  },
  "Hệ thống trong sạch, chưa có báo cáo vi phạm nào cần xử lý.": {
    "en": "Platform is clean. No pending violation reports require attention.",
    "zh": "平台生态环境优良，当前暂无需要处理的违规举报案件。"
  },
  "Đăng Nhập Tài Khoản - Sàn Giao Dịch Xe OtoMarket": {
    "en": "Account Login - OtoMarket",
    "zh": "账号登录 - OtoMarket"
  },
  "Đăng Nhập": {
    "en": "Login",
    "zh": "登录账号"
  },
  "Đăng Ký": {
    "en": "Register",
    "zh": "注册新账号"
  },
  "Email hoặc Số điện thoại": {
    "en": "Email or Phone Number",
    "zh": "邮箱或手机号"
  },
  "Mật khẩu": {
    "en": "Password",
    "zh": "登录密码"
  },
  "Ghi nhớ đăng nhập": {
    "en": "Remember me",
    "zh": "记住登录状态"
  },
  "Quên mật khẩu?": {
    "en": "Forgot password?",
    "zh": "忘记密码？"
  },
  "Chưa có tài khoản?": {
    "en": "Don't have an account?",
    "zh": "还没有账号？"
  },
  "Đã có tài khoản?": {
    "en": "Already have an account?",
    "zh": "已有账号？"
  },
  "Đăng ký ngay": {
    "en": "Register now",
    "zh": "立即免费注册"
  },
  "Đăng nhập ngay": {
    "en": "Login now",
    "zh": "立即登录"
  },
  "Họ và tên": {
    "en": "Full Name",
    "zh": "真实姓名"
  },
  "Số điện thoại": {
    "en": "Phone Number",
    "zh": "联系电话"
  },
  "Xác nhận mật khẩu": {
    "en": "Confirm Password",
    "zh": "确认密码"
  },
  "Tôi đồng ý với Điều khoản sử dụng & Chính sách bảo mật": {
    "en": "I agree to Terms of Service & Privacy Policy",
    "zh": "我已阅读并同意《服务条款》与《隐私政策》"
  },
  "Hồ Sơ Cá Nhân": {
    "en": "My Profile",
    "zh": "个人资料中心"
  },
  "Tin Đăng Của Tôi": {
    "en": "My Listings",
    "zh": "我的在售车源"
  },
  "Danh Sách Yêu Thích": {
    "en": "Favorites List",
    "zh": "我收藏的心仪车辆"
  },
  "Đăng Tin Bán Xe": {
    "en": "Post Car For Sale",
    "zh": "发布卖车信息"
  },
  "Đăng Tin Mới": {
    "en": "Post New Car",
    "zh": "发布新车源"
  },
  "Thông Tin Tài Khoản": {
    "en": "Account Info",
    "zh": "账户基本信息"
  },
  "Cập nhật thông tin": {
    "en": "Update Info",
    "zh": "保存更新资料"
  },
  "Lưu thay đổi": {
    "en": "Save Changes",
    "zh": "保存修改"
  },
  "Tên hiển thị": {
    "en": "Display Name",
    "zh": "公开展示昵称"
  },
  "Địa chỉ": {
    "en": "Address",
    "zh": "常驻联系地址"
  },
  "Tỉnh / Thành phố": {
    "en": "Province / City",
    "zh": "所在省份/城市"
  },
  "Chọn Tỉnh / Thành phố": {
    "en": "Select Province / City",
    "zh": "选择所在省市"
  },
  "Đổi mật khẩu": {
    "en": "Change Password",
    "zh": "修改密码"
  },
  "Mật khẩu hiện tại": {
    "en": "Current Password",
    "zh": "当前旧密码"
  },
  "Mật khẩu mới": {
    "en": "New Password",
    "zh": "新密码"
  },
  "Xác nhận mật khẩu mới": {
    "en": "Confirm New Password",
    "zh": "确认新密码"
  },
  "1. Thông tin xe": {
    "en": "1. Vehicle Details",
    "zh": "1. 车辆基本信息"
  },
  "2. Định giá & ODO": {
    "en": "2. Pricing & Mileage",
    "zh": "2. 拟售标价与里程"
  },
  "3. Tải ảnh thực tế": {
    "en": "3. Upload Photos",
    "zh": "3. 上传真实实拍图"
  },
  "4. Tiện nghi & Xuất bản": {
    "en": "4. Features & Publish",
    "zh": "4. 豪华配置与发布"
  },
  "Bước 01": {
    "en": "Step 01",
    "zh": "第一步"
  },
  "Bước 02": {
    "en": "Step 02",
    "zh": "第二步"
  },
  "Bước 03": {
    "en": "Step 03",
    "zh": "第三步"
  },
  "Bước 04": {
    "en": "Step 04",
    "zh": "第四步"
  },
  "Tiếp tục": {
    "en": "Continue",
    "zh": "下一步"
  },
  "Quay lại": {
    "en": "Back",
    "zh": "上一步"
  },
  "Gửi duyệt tin": {
    "en": "Submit for Approval",
    "zh": "提交审核发布"
  },
  "Bạn chưa lưu chiếc xe nào. Hãy bấm vào biểu tượng hình trái tim trên bất kỳ chiếc xe nào trong kho xe để lưu lại, theo dõi biến động giá và liên hệ nhanh khi cần.": {
    "en": "You haven't saved any cars yet. Click the heart icon on any car in the inventory to save it, track price updates, and contact sellers quickly.",
    "zh": "您当前尚未收藏任何车辆。只需在展厅列表中的任意车源上点击心形图标即可一键收藏，随时掌握降价动态并极速联系车主。"
  },
  "Bạn chưa có tin đăng nào trong danh mục này hoặc không khớp với từ khóa tìm kiếm.": {
    "en": "You have no listings in this category or no cars match your search keywords.",
    "zh": "您在此分类下暂无任何发布的车源，或搜索关键词未能匹配到记录。"
  },
  "Hà Nội": {
    "en": "Hanoi",
    "zh": "河内"
  },
  "TP. Hồ Chí Minh": {
    "en": "Ho Chi Minh City",
    "zh": "胡志明市"
  },
  "Nha Trang": {
    "en": "Nha Trang",
    "zh": "芽庄"
  },
  "Đà Nẵng": {
    "en": "Da Nang",
    "zh": "岘港"
  },
  "Hải Phòng": {
    "en": "Hai Phong",
    "zh": "海防"
  },
  "Cần Thơ": {
    "en": "Can Tho",
    "zh": "芹苴"
  },
  "Bình Dương": {
    "en": "Binh Duong",
    "zh": "平阳"
  },
  "Đồng Nai": {
    "en": "Dong Nai",
    "zh": "同奈"
  },
  "Khánh Hòa": {
    "en": "Khanh Hoa",
    "zh": "庆和省"
  },
  "Toàn quốc": {
    "en": "Nationwide",
    "zh": "全国范围"
  },
  "63 Tỉnh": {
    "en": "63 Provinces",
    "zh": "全国63省市"
  },
  "1,199 tỷ": {
    "en": "1.199 billion",
    "zh": "1.199 亿"
  },
  "1,259 tỷ": {
    "en": "1.259 billion",
    "zh": "1.259 亿"
  },
  "860 triệu": {
    "en": "860 million",
    "zh": "860 百万"
  },
  "735 triệu": {
    "en": "735 million",
    "zh": "735 百万"
  },
  "680 triệu": {
    "en": "680 million",
    "zh": "680 百万"
  },
  "750 triệu": {
    "en": "750 million",
    "zh": "750 百万"
  },
  "765 Triệu": {
    "en": "765 million",
    "zh": "765 百万"
  },
  "799 Triệu": {
    "en": "799 million",
    "zh": "799 百万"
  },
  "799 Tr": {
    "en": "799 M",
    "zh": "799 百万"
  },
  "650 Tr": {
    "en": "650 M",
    "zh": "650 百万"
  },
  "1.15 Tỷ": {
    "en": "1.15 billion",
    "zh": "1.15 亿"
  },
  "1.37 Tỷ": {
    "en": "1.37 billion",
    "zh": "1.37 亿"
  },
  "850 triệu": {
    "en": "850 million",
    "zh": "850 百万"
  },
  "Trả trước từ: 258 tr": {
    "en": "Down payment: 258 M",
    "zh": "首付款从: 258 百万"
  },
  "Trả trước từ: 360 tr": {
    "en": "Down payment: 360 M",
    "zh": "首付款从: 360 百万"
  },
  "Trả trước từ: 378 tr": {
    "en": "Down payment: 378 M",
    "zh": "首付款从: 378 百万"
  },
  "258 tr": {
    "en": "258 M",
    "zh": "258 百万"
  },
  "360 tr": {
    "en": "360 M",
    "zh": "360 百万"
  },
  "378 tr": {
    "en": "378 M",
    "zh": "378 百万"
  },
  "8,2 triệu/tháng": {
    "en": "8.2 million/month",
    "zh": "8.2 百万/月"
  },
  "8.2 million/tháng": {
    "en": "8.2 million/month",
    "zh": "8.2 百万/月"
  },
  "8,2 million/tháng": {
    "en": "8.2 million/month",
    "zh": "8.2 百万/月"
  },
  "18.000 km": {
    "en": "18,000 km",
    "zh": "18,000 公里"
  },
  "15 Phút": {
    "en": "15 Minutes",
    "zh": "15 分钟"
  },
  "5 phút đọc": {
    "en": "5 min read",
    "zh": "5 分钟阅读"
  },
  "6 phút đọc": {
    "en": "6 min read",
    "zh": "6 分钟阅读"
  },
  "2.450 lượt xem": {
    "en": "2,450 views",
    "zh": "2,450 次浏览"
  },
  "3.820 lượt xem": {
    "en": "3,820 views",
    "zh": "3,820 次浏览"
  },
  "5 năm (60 tháng)": {
    "en": "5 years (60 months)",
    "zh": "5 年（60 个月）"
  },
  "4 năm (48 tháng)": {
    "en": "4 years (48 months)",
    "zh": "4 年（48 个月）"
  },
  "3 năm (36 tháng)": {
    "en": "3 years (36 months)",
    "zh": "3 年（36 个月）"
  },
  "5 ảnh": {
    "en": "5 photos",
    "zh": "5 张照片"
  },
  "6 ảnh": {
    "en": "6 photos",
    "zh": "6 张照片"
  },
  "8 ảnh": {
    "en": "8 photos",
    "zh": "8 张照片"
  },
  "0 xe": {
    "en": "0 cars",
    "zh": "0 辆车"
  },
  "2 xe": {
    "en": "2 cars",
    "zh": "2 辆车"
  },
  "3 xe": {
    "en": "3 cars",
    "zh": "3 辆车"
  },
  "4 xe": {
    "en": "4 cars",
    "zh": "4 辆车"
  },
  "5 xe": {
    "en": "5 cars",
    "zh": "5 辆车"
  },
  "6 xe": {
    "en": "6 cars",
    "zh": "6 辆车"
  },
  "8 xe": {
    "en": "8 cars",
    "zh": "8 辆车"
  },
  "12 xe": {
    "en": "12 cars",
    "zh": "12 辆车"
  },
  "2 tin mới": {
    "en": "2 new listings",
    "zh": "2 条新车源"
  },
  "(08:00 – 18:30 hàng ngày)": {
    "en": "(08:00 – 18:30 daily)",
    "zh": "（每日 08:00 – 18:30）"
  },
  "08:00 - 18:30 (Thứ 2 đến Chủ Nhật)": {
    "en": "08:00 - 18:30 (Mon to Sun)",
    "zh": "08:00 - 18:30（周一至周日）"
  },
  "Giờ làm việc: 08:00 – 18:30 (Thứ 2 đến Chủ Nhật)": {
    "en": "Working hours: 08:00 – 18:30 (Mon to Sun)",
    "zh": "营业时间：08:00 – 18:30（周一至周日）"
  },
  "0 đ": {
    "en": "0 VND",
    "zh": "0 越南盾"
  },
  "1.000.000 đ": {
    "en": "1,000,000 VND",
    "zh": "1,000,000 越南盾"
  },
  "2.180.000 đ": {
    "en": "2,180,000 VND",
    "zh": "2,180,000 越南盾"
  },
  "12.804.000 đ": {
    "en": "12,804,000 VND",
    "zh": "12,804,000 越南盾"
  },
  "240.000.000 đ": {
    "en": "240,000,000 VND",
    "zh": "240,000,000 越南盾"
  },
  "500.000 đ": {
    "en": "500,000 VND",
    "zh": "500,000 越南盾"
  },
  "79.900.000 đ": {
    "en": "79,900,000 VND",
    "zh": "79,900,000 越南盾"
  },
  "9.316.000 đ": {
    "en": "9,316,000 VND",
    "zh": "9,316,000 越南盾"
  },
  "901.520.000 đ": {
    "en": "901,520,000 VND",
    "zh": "901,520,000 越南盾"
  },
  "< 10.000 km": {
    "en": "< 10,000 km",
    "zh": "< 10,000 公里"
  },
  "10.000 - 30.000 km": {
    "en": "10,000 - 30,000 km",
    "zh": "10,000 - 30,000 公里"
  },
  "> 50.000 km": {
    "en": "> 50,000 km",
    "zh": "> 50,000 公里"
  },
  "< 500 triệu": {
    "en": "< 500 million",
    "zh": "< 500 百万"
  },
  "Dưới 500 triệu": {
    "en": "Under 500 million",
    "zh": "500 百万以下"
  },
  "500 - 800 triệu": {
    "en": "500 - 800 million",
    "zh": "500 - 800 百万"
  },
  "800 tr - 1.2 tỷ": {
    "en": "800M - 1.2 billion",
    "zh": "800百万 - 1.2亿"
  },
  "800 triệu - 1.2 tỷ": {
    "en": "800M - 1.2 billion",
    "zh": "800百万 - 1.2亿"
  },
  "70% (559 triệu)": {
    "en": "70% (559 million)",
    "zh": "70%（559 百万）"
  },
  "12/10/2026 • 6 phút đọc": {
    "en": "12/10/2026 • 6 min read",
    "zh": "12/10/2026 • 6 分钟阅读"
  },
  "14/10/2026 • 5 phút đọc": {
    "en": "14/10/2026 • 5 min read",
    "zh": "14/10/2026 • 5 分钟阅读"
  },
  "2023 (12k km) vs 2022 (18k km)": {
    "en": "2023 (12k km) vs 2022 (18k km)",
    "zh": "2023年款（1.2万公里）对比 2022年款（1.8万公里）"
  },
  "Apple CarPlay": {
    "en": "Apple CarPlay",
    "zh": "Apple CarPlay"
  },
  "Camera 360": {
    "en": "360 Camera",
    "zh": "360度全景影像"
  },
  "Cảm biến lùi": {
    "en": "Reverse Sensors",
    "zh": "倒车雷达"
  },
  "Cốp điện": {
    "en": "Power Tailgate",
    "zh": "电动尾门"
  },
  "Cửa sổ trời": {
    "en": "Sunroof",
    "zh": "全景天窗"
  },
  "Cruise Control": {
    "en": "Cruise Control",
    "zh": "定速巡航"
  },
  "Ghế da cao cấp": {
    "en": "Premium Leather Seats",
    "zh": "高级真皮座椅"
  },
  "Phanh tay điện tử": {
    "en": "Electronic Parking Brake",
    "zh": "电子手刹 (EPB)"
  },
  "Tự động CVT": {
    "en": "CVT Automatic",
    "zh": "CVT 无级变速"
  },
  "Ly hợp kép": {
    "en": "Dual Clutch (DCT)",
    "zh": "双离合 (DCT)"
  },
  "BIDV (Từ 7.8%/năm)": {
    "en": "BIDV (From 7.8%/year)",
    "zh": "BIDV银行（年利率7.8%起）"
  },
  "Techcombank (Từ 8.2%/năm)": {
    "en": "Techcombank (From 8.2%/year)",
    "zh": "Techcombank（年利率8.2%起）"
  },
  "Vietcombank (Từ 7.5%/năm)": {
    "en": "Vietcombank (From 7.5%/year)",
    "zh": "Vietcombank（年利率7.5%起）"
  },
  "VPBank (Duyệt nhanh 4 giờ)": {
    "en": "VPBank (Fast 4h Approval)",
    "zh": "VPBank（4小时极速审批）"
  },
  "VIB (Hỗ trợ vay 80%)": {
    "en": "VIB (Up to 80% Loan)",
    "zh": "VIB银行（最高可贷80%）"
  },
  "BMW": {
    "en": "BMW",
    "zh": "宝马"
  },
  "Mercedes": {
    "en": "Mercedes",
    "zh": "奔驰"
  },
  "Mercedes-Benz": {
    "en": "Mercedes-Benz",
    "zh": "梅赛德斯-奔驰"
  },
  "Toyota": {
    "en": "Toyota",
    "zh": "丰田"
  },
  "Ford": {
    "en": "Ford",
    "zh": "福特"
  },
  "Kia": {
    "en": "Kia",
    "zh": "起亚"
  },
  "Hyundai": {
    "en": "Hyundai",
    "zh": "现代"
  },
  "Mazda": {
    "en": "Mazda",
    "zh": "马自达"
  },
  "Honda": {
    "en": "Honda",
    "zh": "本田"
  },
  "VinFast": {
    "en": "VinFast",
    "zh": "VinFast"
  },
  "Mitsubishi": {
    "en": "Mitsubishi",
    "zh": "三菱"
  },
  "Ford Ranger, Everest": {
    "en": "Ford Ranger, Everest",
    "zh": "福特游骑侠、撼路者"
  },
  "Hyundai Accent, Creta": {
    "en": "Hyundai Accent, Creta",
    "zh": "现代悦动、Creta"
  },
  "Mazda CX-5, Mazda 3": {
    "en": "Mazda CX-5, Mazda 3",
    "zh": "马自达CX-5、马自达3"
  },
  "Toyota Vios, Cross": {
    "en": "Toyota Vios, Cross",
    "zh": "丰田威驰、卡罗拉锐放"
  },
  "VinFast VF 6, VF 8": {
    "en": "VinFast VF 6, VF 8",
    "zh": "VinFast VF 6、VF 8"
  },
  "Ford Everest (1.15 Tỷ)": {
    "en": "Ford Everest (1.15B)",
    "zh": "福特撼路者（1.15亿）"
  },
  "Hyundai Tucson (765 Tr)": {
    "en": "Hyundai Tucson (765M)",
    "zh": "现代途胜（765百万）"
  },
  "Hyundai Tucson 2.0 Đỏ 2026": {
    "en": "Hyundai Tucson 2.0 Red 2026",
    "zh": "现代途胜 2.0 红色 2026款"
  },
  "Hyundai Tucson": {
    "en": "Hyundai Tucson",
    "zh": "现代途胜"
  },
  "Mazda CX-5 (799 Tr)": {
    "en": "Mazda CX-5 (799M)",
    "zh": "马自达CX-5（799百万）"
  },
  "Mazda CX-5": {
    "en": "Mazda CX-5",
    "zh": "马自达CX-5"
  },
  "Mercedes C200 (1.37 Tỷ)": {
    "en": "Mercedes C200 (1.37B)",
    "zh": "奔驰C200（1.37亿）"
  },
  "Toyota Cross (735 Tr)": {
    "en": "Toyota Cross (735M)",
    "zh": "丰田卡罗拉锐放（735百万）"
  },
  "Toyota Corolla Cross 1.8V 2023 Trắng Ngọc Trai": {
    "en": "Toyota Corolla Cross 1.8V 2023 Pearl White",
    "zh": "丰田卡罗拉锐放 1.8V 2023款 珍珠白"
  },
  "Toyota Corolla Cross 1.8V 2026": {
    "en": "Toyota Corolla Cross 1.8V 2026",
    "zh": "丰田卡罗拉锐放 1.8V 2026款"
  },
  "VinFast VF 8 (815 Tr)": {
    "en": "VinFast VF 8 (815M)",
    "zh": "VinFast VF 8（815百万）"
  },
  "VinFast VF 8 Plus 2026": {
    "en": "VinFast VF 8 Plus 2026",
    "zh": "VinFast VF 8 Plus 2026款"
  },
  "SUV": {
    "en": "SUV",
    "zh": "SUV"
  },
  "SUV / Crossover": {
    "en": "SUV / Crossover",
    "zh": "SUV / 跨界车"
  },
  "Sedan": {
    "en": "Sedan",
    "zh": "三厢轿车"
  },
  "Hatchback": {
    "en": "Hatchback",
    "zh": "两厢车"
  },
  "MPV": {
    "en": "MPV",
    "zh": "MPV商务车"
  },
  "MPV 7 chỗ": {
    "en": "7-Seater MPV",
    "zh": "7座MPV"
  },
  "Pickup": {
    "en": "Pickup Truck",
    "zh": "皮卡"
  },
  "Crossover": {
    "en": "Crossover",
    "zh": "跨界车"
  },
  "Xe điện EV": {
    "en": "Electric Vehicle (EV)",
    "zh": "纯电动汽车 (EV)"
  },
  "Lâm Đồng": {
    "en": "Lam Dong",
    "zh": "林同省"
  },
  "Đắk Lắk": {
    "en": "Dak Lak",
    "zh": "多乐省"
  },
  "TP. Nha Trang, Khánh Hòa": {
    "en": "Nha Trang City, Khanh Hoa",
    "zh": "庆和省芽庄市"
  },
  "TP.HCM": {
    "en": "HCMC",
    "zh": "胡志明市"
  },
  "TP.HCM (Trước bạ 10% • Biển 20tr)": {
    "en": "HCMC (10% Tax • 20M Plate)",
    "zh": "胡志明市（购置税10% • 牌照2000万）"
  },
  "Hà Nội (Trước bạ 12% • Biển 20tr)": {
    "en": "Hanoi (12% Tax • 20M Plate)",
    "zh": "河内（购置税12% • 牌照2000万）"
  },
  "Tỉnh / TP khác (Trước bạ 10% • Biển 1tr)": {
    "en": "Other Province/City (10% Tax • 1M Plate)",
    "zh": "其他省市（购置税10% • 牌照100万）"
  },
  "Tỉnh thành khác": {
    "en": "Other Provinces",
    "zh": "其他外省市"
  },
  "Tỉnh / Thành phố xem xe": {
    "en": "Viewing Province / City",
    "zh": "看车所在省市"
  },
  "Nơi đăng ký biển số": {
    "en": "License plate registration place",
    "zh": "号牌归属地"
  },
  "Địa điểm xe:": {
    "en": "Car location:",
    "zh": "车辆所在地："
  },
  "Trụ sở:": {
    "en": "Headquarters:",
    "zh": "总部地址："
  },
  "Trụ sở chính:": {
    "en": "Headquarters:",
    "zh": "总部地址："
  },
  "Văn phòng:": {
    "en": "Office:",
    "zh": "办事处："
  },
  "Trụ Sở Vận Hành": {
    "en": "Operational Headquarters",
    "zh": "全国运营调度总部"
  },
  "Nha Trang (Khánh Hòa)": {
    "en": "Nha Trang (Khanh Hoa)",
    "zh": "芽庄（庆和省）"
  },
  "Nha Trang vs Hà Nội": {
    "en": "Nha Trang vs Hanoi",
    "zh": "芽庄 对比 河内"
  },
  "Nha Trang, Khánh Hòa": {
    "en": "Nha Trang, Khanh Hoa",
    "zh": "庆和省芽庄市"
  },
  "BẢNG HÃNG THÔNG DỤNG": {
    "en": "POPULAR BRANDS",
    "zh": "主流热门品牌"
  },
  "Bảng tính tham khảo với mức lãi suất ước tính": {
    "en": "Reference calculator with estimated interest rate",
    "zh": "基于预估年利率的购车分期测算表"
  },
  "Bảo hiểm TNDS:": {
    "en": "Compulsory Liability Insurance:",
    "zh": "法定交强险："
  },
  "Bằng chữ: Bảy trăm năm mươi triệu đồng": {
    "en": "In words: Seven hundred fifty million VND",
    "zh": "大写金额：柒亿伍仟万越南盾整"
  },
  "Công cụ tính dự toán chi phí & trả góp": {
    "en": "Cost & Installment Calculator Tool",
    "zh": "全包落地价格与分期月供智能测算工具"
  },
  "Dự Tính Giá Lăn Bánh": {
    "en": "Estimated On-The-Road Price",
    "zh": "新车全包落地价测算"
  },
  "Dự toán ngân sách lăn bánh tham khảo và so sánh thông số các dòng xe trước khi giao dịch.": {
    "en": "Estimate on-the-road budget and compare vehicle specs before purchase.",
    "zh": "在购车成交前快捷测算全包落地预算，并一键多维度对比意向车系配置参数。"
  },
  "Góp từ 10.5 tr/th": {
    "en": "From 10.5M/mo",
    "zh": "月供 10.5百万起"
  },
  "Góp từ 15.5 tr/th": {
    "en": "From 15.5M/mo",
    "zh": "月供 15.5百万起"
  },
  "Góp từ 4.5 tr/th": {
    "en": "From 4.5M/mo",
    "zh": "月供 4.5百万起"
  },
  "Góp từ 6.8 tr/th": {
    "en": "From 6.8M/mo",
    "zh": "月供 6.8百万起"
  },
  "Gốc phải trả hàng tháng:": {
    "en": "Monthly principal payable:",
    "zh": "每月应还本金："
  },
  "Lệ phí trước bạ (10%):": {
    "en": "Registration tax (10%):",
    "zh": "车辆购置税 (10%)："
  },
  "Phí cấp biển số:": {
    "en": "License plate issuance fee:",
    "zh": "机动车号牌工本费："
  },
  "Đăng kiểm & đường bộ:": {
    "en": "Inspection & road maintenance:",
    "zh": "机动车年检与公路养路费："
  },
  "Tổng lăn bánh dự tính:": {
    "en": "Est. Total On-The-Road:",
    "zh": "预计全包落地总价："
  },
  "Trả góp tháng đầu:": {
    "en": "First month installment:",
    "zh": "首月预估月供："
  },
  "Vốn tự có cần chuẩn bị:": {
    "en": "Required self-funded down payment:",
    "zh": "需自备首付款金额："
  },
  "Tỷ lệ vay:": {
    "en": "Loan ratio:",
    "zh": "贷款成数比例："
  },
  "Mức thu nhập hàng tháng": {
    "en": "Monthly income level",
    "zh": "家庭月均净收入"
  },
  "Dưới 15 triệu/tháng": {
    "en": "Under 15 million/month",
    "zh": "1500万以下/月"
  },
  "Từ 15 - 30 triệu/tháng": {
    "en": "15 - 30 million/month",
    "zh": "1500万 - 3000万/月"
  },
  "Trên 30 triệu/tháng": {
    "en": "Over 30 million/month",
    "zh": "3000万以上/月"
  },
  "Ngân hàng ưu tiên": {
    "en": "Preferred bank",
    "zh": "首选按揭合作银行"
  },
  "Hồ sơ vay được xử lý trực tiếp bởi phòng tín dụng ngân hàng đối tác. Miễn phí thẩm định, không thu phí trung gian.": {
    "en": "Loan dossiers are processed directly by partner bank credit departments. Free appraisal, zero middleman charges.",
    "zh": "贷款材料由官方合作银行信贷审批部门直连受理。免费评估额度，全程不收取任何第三方中介杂费。"
  },
  "Lãi suất ưu đãi từ các ngân hàng đối tác liên kết": {
    "en": "Preferential rates from partner affiliate banks",
    "zh": "来自官方战略合作银行的专享优惠年利率"
  },
  "Đang tính toán gói vay...": {
    "en": "Calculating loan package...",
    "zh": "正在为您智能测算金融方案..."
  },
  "Đăng ký tư vấn gói vay ngân hàng": {
    "en": "Apply for bank loan consultation",
    "zh": "在线预约银行购车金融专家专属咨询"
  },
  "Ước Tính Vay Trả Góp": {
    "en": "Loan Installment Calculator",
    "zh": "分期购车智能测算"
  },
  "Ước tính theo biểu phí thực tế các tỉnh thành": {
    "en": "Estimated based on actual regional rate schedules",
    "zh": "依据越南各省市实际税费标准测算"
  },
  "Nhờ Showroom so sánh chọn gói tốt nhất": {
    "en": "Ask Showroom to pick best package",
    "zh": "委托展厅金融顾问对比精选最优方案"
  },
  "Tính Toán Chi Phí & So Sánh Nhanh": {
    "en": "Calculate Cost & Quick Compare",
    "zh": "一键核算落地成本与参数对比"
  },
  "Tính lại": {
    "en": "Recalculate",
    "zh": "重新测算"
  },
  "Chi tiết": {
    "en": "Details",
    "zh": "查看详情"
  },
  "Chi Tiết Xe - OtoMarket": {
    "en": "Car Details - OtoMarket",
    "zh": "车辆详情 - OtoMarket"
  },
  "Chia sẻ bài viết": {
    "en": "Share article",
    "zh": "分享文章"
  },
  "Chính sách bảo mật": {
    "en": "Privacy Policy",
    "zh": "隐私安全保护政策"
  },
  "Điều khoản sử dụng": {
    "en": "Terms of Service",
    "zh": "用户服务协议条款"
  },
  "Tôi đồng ý với": {
    "en": "I agree to",
    "zh": "我已阅读并同意"
  },
  "của OtoMarket": {
    "en": "of OtoMarket",
    "zh": "的全部条款规定"
  },
  "Chọn 2 mẫu xe để đối chiếu trực quan": {
    "en": "Select 2 models for visual comparison",
    "zh": "选择 2 款意向车型进行全维配置对比"
  },
  "CÁC TIN KHÁC": {
    "en": "OTHER LISTINGS",
    "zh": "更多相关车源推荐"
  },
  "CÔNG CỤ THAM KHẢO": {
    "en": "REFERENCE TOOLS",
    "zh": "购车助手与实用工具"
  },
  "Cài đặt thông báo": {
    "en": "Notification settings",
    "zh": "系统消息与推送设置"
  },
  "Các mẫu xe chất lượng trên sàn mà bạn có thể quan tâm": {
    "en": "Quality vehicles on platform you may like",
    "zh": "为您精心甄选的在售优质合规座驾"
  },
  "Cập nhật": {
    "en": "Update",
    "zh": "保存更新"
  },
  "Cập nhật mật khẩu": {
    "en": "Update password",
    "zh": "更新登录密码"
  },
  "DANH MỤC ĐỀ XUẤT": {
    "en": "SUGGESTED CATEGORIES",
    "zh": "热门推荐分类"
  },
  "Danh Sách Xe Yêu Thích": {
    "en": "Favorites List",
    "zh": "我的心愿单车库"
  },
  "Danh Sách Xe Yêu Thích - OtoMarket": {
    "en": "Favorites List - OtoMarket",
    "zh": "我的心愿单车库 - OtoMarket"
  },
  "Danh Sách Xe Yêu Thích Của Bạn Đang Trống": {
    "en": "Your Favorites List is Empty",
    "zh": "您的心愿单车库当前空空如也"
  },
  "Danh sách khiếu nại & Báo cáo (": {
    "en": "Complaints & Reports List (",
    "zh": "投诉与举报受理列表 ("
  },
  "Danh sách xe đã lưu": {
    "en": "Saved cars list",
    "zh": "已收藏的车源列表"
  },
  "Dòng xe (Model)": {
    "en": "Model",
    "zh": "车型系列 (Model)"
  },
  "Dữ liệu mẫu": {
    "en": "Sample data",
    "zh": "系统演示数据"
  },
  "Email dùng để đăng nhập và nhận thông báo kiểm duyệt tin.": {
    "en": "Email used to log in and receive moderation notices.",
    "zh": "用于账号安全登录及接收车源审核进度通知的官方邮箱。"
  },
  "Email là mã định danh cố định để đăng nhập và bảo mật tài khoản OtoMarket.": {
    "en": "Email is the fixed identifier for logging in and securing your OtoMarket account.",
    "zh": "邮箱是用于登录平台及保障账户资产安全的核心固定唯一标识。"
  },
  "Giá bán": {
    "en": "Selling price",
    "zh": "车辆售价"
  },
  "Giá bán niêm yết (VNĐ)": {
    "en": "Listed selling price (VND)",
    "zh": "公开挂牌出售价格（越南盾）"
  },
  "Giá niêm yết (VNĐ)": {
    "en": "Listed price (VND)",
    "zh": "挂牌售价（越南盾）"
  },
  "Giá xe niêm yết (VNĐ)": {
    "en": "Vehicle listed price (VND)",
    "zh": "车辆挂牌售价（越南盾）"
  },
  "Giá chưa hợp lý": {
    "en": "Price unreasonable",
    "zh": "定价与市场行情严重偏离"
  },
  "Giá giảm dần": {
    "en": "Price: High to Low",
    "zh": "按价格由高到低"
  },
  "Giá tăng dần": {
    "en": "Price: Low to High",
    "zh": "按价格由低到高"
  },
  "Giá: Cao đến thấp": {
    "en": "Price: High to Low",
    "zh": "价格：高到低"
  },
  "Giá: Thấp đến cao": {
    "en": "Price: Low to High",
    "zh": "价格：低到高"
  },
  "Cũ nhất": {
    "en": "Oldest",
    "zh": "发布时间最早"
  },
  "Gọi ngay": {
    "en": "Call Now",
    "zh": "立即拨号"
  },
  "Gọi điện thoại ngay": {
    "en": "Call phone now",
    "zh": "立即致电车主"
  },
  "Gợi Ý Xe Đang Được Quan Tâm": {
    "en": "Trending Recommended Cars",
    "zh": "全网车友高度关注车源"
  },
  "Gửi báo cáo vi phạm": {
    "en": "Submit violation report",
    "zh": "提交违规举报材料"
  },
  "Gửi phân tích định giá định kỳ cho các mẫu xe trong danh sách yêu thích của bạn.": {
    "en": "Send periodic valuation analysis for cars in your favorites list.",
    "zh": "定期为您心愿单中所关注的车型推送二手车行情估值与降价报告。"
  },
  "Gửi thông tin - Nhận kết quả duyệt sơ bộ": {
    "en": "Submit info - Get preliminary review result",
    "zh": "提交车源档案 - 极速获取初审预验报告"
  },
  "Hai bên chủ động kiểm tra giấy tờ gốc và thực hiện công chứng theo đúng quy định.": {
    "en": "Both parties independently verify original paperwork and notarize legally.",
    "zh": "双方线下当面查验车辆原版产权档案，并在公证处依法公证交割。"
  },
  "Hiển thị 9 / 9 bài viết": {
    "en": "Showing 9 / 9 articles",
    "zh": "显示 9 / 9 篇文章"
  },
  "Hotline hỗ trợ:": {
    "en": "Support Hotline:",
    "zh": "全国服务热线："
  },
  "Hoàn tất đăng ký": {
    "en": "Complete registration",
    "zh": "完成账户注册"
  },
  "Hàng đợi thẩm định (": {
    "en": "Appraisal Queue (",
    "zh": "待审核车源队列 ("
  },
  "Hàng đợi trống!": {
    "en": "Queue is empty!",
    "zh": "待审队列已清空！"
  },
  "Hình ảnh không đúng thực tế": {
    "en": "Images do not match actual car",
    "zh": "实拍照片与实车状况严重不符"
  },
  "Họ và tên của bạn": {
    "en": "Your Full Name",
    "zh": "您的真实姓名"
  },
  "Họ và tên hiển thị": {
    "en": "Display Name",
    "zh": "对外展示姓名"
  },
  "Họ và tên người bán": {
    "en": "Seller Full Name",
    "zh": "车主真实姓名"
  },
  "Hộp số & Nhiên liệu:": {
    "en": "Transmission & Fuel:",
    "zh": "变速箱与动力燃料："
  },
  "Hủy bỏ": {
    "en": "Cancel",
    "zh": "取消操作"
  },
  "KINH NGHIỆM": {
    "en": "GUIDE & TIPS",
    "zh": "用车验车秘籍"
  },
  "Kho Xe Toàn Sàn (": {
    "en": "Full Marketplace Inventory (",
    "zh": "全平台在售车源库 ("
  },
  "Kho Xe Ô Tô Đang Bán - OtoMarket": {
    "en": "Cars For Sale Inventory - OtoMarket",
    "zh": "在售汽车库存展厅 - OtoMarket"
  },
  "Kho Xe Đang Chào Bán": {
    "en": "Available Inventory For Sale",
    "zh": "在售热销现车展库"
  },
  "Khu vực": {
    "en": "Location",
    "zh": "看车所在地区"
  },
  "Khu vực / Tỉnh thành giao dịch": {
    "en": "Transaction Province / City",
    "zh": "看车与交易所在省市"
  },
  "Khuyến khích người mua gặp mặt trực tiếp để kiểm tra xe và trao đổi cụ thể.": {
    "en": "Encourage buyers to meet in person to inspect vehicle and discuss terms.",
    "zh": "强烈建议买卖双方当面碰面看车试驾，细致沟通具体过户细节。"
  },
  "Khách mua xe sẽ liên hệ gọi điện hoặc nhắn tin Zalo qua số này.": {
    "en": "Car buyers will call or message via Zalo using this number.",
    "zh": "意向购车用户将通过此实名认证手机号直接致电或发起Zalo在线沟通。"
  },
  "Khám Phá Hàng Ngàn Xe Ô Tô Chất Lượng": {
    "en": "Explore Thousands of Quality Cars",
    "zh": "探索数千辆严选真实在售车源"
  },
  "Khám phá kho so sánh xe chi tiết": {
    "en": "Explore detailed car comparison tool",
    "zh": "进入多车型深度横评对比工具箱"
  },
  "Khám phá kho xe đang bán": {
    "en": "Explore cars for sale inventory",
    "zh": "探索当前在售热销汽车展厅"
  },
  "Khám phá kho xe →": {
    "en": "Explore inventory →",
    "zh": "进入选车展库 →"
  },
  "Khám phá toàn bộ kho xe": {
    "en": "Explore full vehicle inventory",
    "zh": "浏览全平台海量认证车源"
  },
  "Khôi phục dữ liệu gốc": {
    "en": "Restore original demo data",
    "zh": "恢复系统初始演示数据"
  },
  "Không có xe chờ thẩm định": {
    "en": "No vehicles awaiting appraisal",
    "zh": "当前暂无等待核验提审的车源"
  },
  "Không tìm thấy tin đăng phù hợp": {
    "en": "No matching listings found",
    "zh": "未检索到匹配的已发布车源"
  },
  "Kiểm định 160 điểm": {
    "en": "160-Point Inspection",
    "zh": "160项专业技术深检"
  },
  "Kiểu dáng": {
    "en": "Body type",
    "zh": "车身类型"
  },
  "Kết nối trực tiếp": {
    "en": "Direct Connection",
    "zh": "买卖双方直联"
  },
  "Liên hệ lái thử • Mua trả góp • Báo giá lăn bánh": {
    "en": "Contact for test drive • Installments • Quotations",
    "zh": "预约试驾 • 分期咨询 • 全包落地报价"
  },
  "Lý do": {
    "en": "Reason",
    "zh": "原因说明"
  },
  "Lý do báo cáo": {
    "en": "Report reason",
    "zh": "举证原因"
  },
  "Lưu cài đặt thông báo": {
    "en": "Save notification settings",
    "zh": "保存通知订阅设置"
  },
  "Lưu nháp": {
    "en": "Save Draft",
    "zh": "保存草稿"
  },
  "Lưu thay đổi hồ sơ": {
    "en": "Save profile changes",
    "zh": "保存个人资料修改"
  },
  "Lượt xem": {
    "en": "Views",
    "zh": "浏览人次"
  },
  "Màu ngoại thất": {
    "en": "Exterior color",
    "zh": "外观车漆颜色"
  },
  "Mã báo cáo": {
    "en": "Report ID",
    "zh": "投诉案件编号"
  },
  "Mô hình vận hành:": {
    "en": "Operating Model:",
    "zh": "平台运作模式："
  },
  "Mô tả chi tiết": {
    "en": "Detailed description",
    "zh": "车辆详尽车况描述"
  },
  "Mô tả thông số, hình ảnh thực tế và giá bán do người đăng cung cấp công khai.": {
    "en": "Specifications, actual photos and selling price publicly provided by poster.",
    "zh": "车辆技术参数、高清实拍实况及出售底价均由发布者自主公开承诺。"
  },
  "Mô tả tình trạng xe": {
    "en": "Vehicle condition description",
    "zh": "真实车况描述说明"
  },
  "Mẫu Corolla Cross": {
    "en": "Corolla Cross Model",
    "zh": "卡罗拉锐放样本车"
  },
  "Mẫu Sedan": {
    "en": "Sedan Model",
    "zh": "轿车样本车"
  },
  "Mẫu xe A": {
    "en": "Car Model A",
    "zh": "对比车型 A"
  },
  "Mẫu xe B": {
    "en": "Car Model B",
    "zh": "对比车型 B"
  },
  "Mật khẩu nên chứa cả chữ hoa, chữ thường và chữ số để đảm bảo an toàn.": {
    "en": "Password should contain uppercase, lowercase letters and numbers for security.",
    "zh": "为保障账户资金安全，密码建议同时包含大小写字母与数字组合。"
  },
  "Mỗi tin xe đều hiển thị số điện thoại liên lạc trực tiếp của chủ xe. Người mua có thể gọi điện thoại hoặc kết nối qua Zalo để trao đổi chi tiết và hẹn thời gian xem xe.": {
    "en": "Every listing shows the owner's direct phone number. Buyers can call or connect via Zalo to discuss and schedule a viewing.",
    "zh": "每个车源详情均直观展示车主本人实名电话。买家可随时致电或添加Zalo，细致沟通车况并约定线下碰面验车。"
  },
  "Mới lưu gần đây": {
    "en": "Recently saved",
    "zh": "近期最新收藏"
  },
  "Mức giá mong muốn": {
    "en": "Target expected price",
    "zh": "期望转让售价"
  },
  "Mức giá nhanh:": {
    "en": "Quick price filter:",
    "zh": "快捷价格预算："
  },
  "Nghi vấn lừa đảo / giả mạo": {
    "en": "Suspected fraud / fake post",
    "zh": "疑似诈骗套路或虚假冒名顶替"
  },
  "Nguồn": {
    "en": "Source",
    "zh": "车源渠道属性"
  },
  "Người Việt Quan Tâm Đến Mẫu Xe Nào": {
    "en": "Which Cars Vietnamese Motorists Care About",
    "zh": "当前越南消费群体高度关注的热门车系排行"
  },
  "Người bán": {
    "en": "Seller",
    "zh": "发布车主/展厅"
  },
  "Người dùng có thể nhấn nút \"Báo cáo tin vi phạm\" trên trang chi tiết xe. Bộ phận kiểm duyệt sẽ tiến hành rà soát và tạm ẩn hoặc xóa tin đăng nếu xác nhận có hành vi gian lận.": {
    "en": "Users can click 'Report Listing' on car detail page. Moderation will review and hide or remove the post if fraud is verified.",
    "zh": "用户可随时在详情页点击“举报违规”按钮。平台风控质检组将火速调查，一经查实存在欺诈或虚假立即永久下架关停。"
  },
  "Người mua gọi điện hoặc nhắn tin trực tiếp với người bán, không qua trung gian.": {
    "en": "Buyers call or message directly with sellers, without intermediaries.",
    "zh": "意向买家与真实卖家一键直联通话，全程无任何黄牛中介从中加价抽佣。"
  },
  "Nhiều lựa chọn": {
    "en": "Abundant choices",
    "zh": "海量车源多重甄选"
  },
  "Nhận thông báo tức thì khi có khách để lại lời nhắn hoặc hỏi giá xe.": {
    "en": "Receive instant alerts when buyers leave messages or inquire about price.",
    "zh": "当有真实意向买家在线留言或议价咨询时，实时向您推送提醒通知。"
  },
  "Nhập khẩu Mỹ": {
    "en": "Imported from USA",
    "zh": "美国原装整车进口"
  },
  "Nhập khẩu Nhật Bản": {
    "en": "Imported from Japan",
    "zh": "日本原厂整车进口"
  },
  "Nhập khẩu Thái Lan": {
    "en": "Imported from Thailand",
    "zh": "泰国整车进口"
  },
  "Nhập khẩu khác": {
    "en": "Other Imported",
    "zh": "其他海外整车进口"
  },
  "Nhập xe vào Showroom": {
    "en": "Import car to showroom inventory",
    "zh": "将车辆入库至官方展厅"
  },
  "Nhắn tin trao đổi qua Zalo": {
    "en": "Chat directly via Zalo",
    "zh": "通过Zalo在线即时沟通"
  },
  "Năm SX & ODO:": {
    "en": "Year & ODO:",
    "zh": "出厂年份与表显里程："
  },
  "Năm sản xuất mới": {
    "en": "Recent model year",
    "zh": "新近出厂准新年份"
  },
  "Nền tảng công nghệ kết nối mua bán ô tô trực tiếp giữa người mua và người bán. Cung cấp thông tin xe rõ ràng, hỗ trợ kết nối liên hệ xem xe thực tế. Nền tảng chưa hỗ trợ thanh toán hoặc đặt cọc trực tuyến.": {
    "en": "Automotive technology marketplace directly connecting buyers with sellers. Providing transparent car data and physical inspection contact. Platform does not yet support online escrow deposits.",
    "zh": "连接买卖双方的直连汽车数字化科技平台，车况透明透明，协助预约实地验车。目前平台暂不支持线上网络全额代付或网络定金划转。"
  },
  "Nền tảng kết nối trực tiếp người mua và người bán ô tô uy tín.": {
    "en": "Trusted platform directly bridging reputable car buyers and sellers.",
    "zh": "值得万千车主信赖的高效直通汽车交易平台。"
  },
  "Nội dung được tổng hợp từ dữ liệu vận hành thực tế và các báo cáo tài chính chính thức.": {
    "en": "Content aggregated from operational telemetry data and official financial reports.",
    "zh": "全站数据深度综合自汽车实际道路行驶实测与主机厂官方公开发布的审计财报。"
  },
  "Quay lại danh sách tin": {
    "en": "Back to listings",
    "zh": "返回在售车源目录"
  },
  "Quay lại trang chủ": {
    "en": "Back to Home",
    "zh": "返回网站首页"
  },
  "Quy chế hoạt động": {
    "en": "Operating Regulations",
    "zh": "平台运作与风控守则"
  },
  "Quy trình duyệt tin": {
    "en": "Moderation Workflow",
    "zh": "车源质检与审核标准"
  },
  "Quản Lý Tin Đăng Xe": {
    "en": "Vehicle Listings Management",
    "zh": "我的车源与在售管理"
  },
  "Quản Lý Tin Đăng Xe - OtoMarket": {
    "en": "Vehicle Listings Management - OtoMarket",
    "zh": "我的车源与在售管理 - OtoMarket"
  },
  "Quản lý": {
    "en": "Manage",
    "zh": "管理中心"
  },
  "Quản lý thông tin liên hệ và tùy chọn tài khoản của bạn trên sàn OtoMarket": {
    "en": "Manage your contact info and account options on OtoMarket marketplace.",
    "zh": "便捷查看与维护您在 OtoMarket 平台的实名联系方式与账户配置项。"
  },
  "Quản lý tin đăng bán": {
    "en": "Manage vehicle listings",
    "zh": "管理已发布的在售车辆"
  },
  "Quản lý tin đăng của tôi": {
    "en": "Manage my listings",
    "zh": "管理我发布的所有车源"
  },
  "Sai thông số": {
    "en": "Incorrect specifications",
    "zh": "参数配置虚标严重不符"
  },
  "Sao chép số điện thoại": {
    "en": "Copy phone number",
    "zh": "复制车主电话号码"
  },
  "Showroom": {
    "en": "Showroom",
    "zh": "品牌展厅"
  },
  "So Sánh Nhanh Thông Số": {
    "en": "Quick Spec Comparison",
    "zh": "核心参数快速深度对比"
  },
  "Sàn giao dịch kết nối người mua và người bán uy tín, minh bạch hàng đầu Việt Nam": {
    "en": "Vietnam's premier transparent car marketplace connecting buyers and sellers.",
    "zh": "越南领先的透明诚信汽车买卖直联撮合交易平台"
  },
  "Số km đã đi (ODO)": {
    "en": "Mileage (ODO)",
    "zh": "表显行驶里程 (ODO)"
  },
  "Số điện thoại liên hệ": {
    "en": "Contact phone number",
    "zh": "实名联系电话"
  },
  "Số điện thoại liên hệ trực tiếp:": {
    "en": "Direct contact phone number:",
    "zh": "车主直接联系电话："
  },
  "Thao tác": {
    "en": "Actions",
    "zh": "操作"
  },
  "Theo Nhu Cầu Của Bạn": {
    "en": "Tailored To Your Needs",
    "zh": "契合您的全部个性化需求"
  },
  "Theo dõi các mẫu xe bạn quan tâm, cập nhật giá bán và liên hệ trực tiếp người bán": {
    "en": "Track cars you love, receive price updates, and connect directly with sellers.",
    "zh": "轻松追踪您中意的心仪车型，实时获取降价提醒并一键直连真实车主。"
  },
  "Theo dõi tiến độ duyệt tin, lượt xem và cập nhật thông tin xe bán của bạn": {
    "en": "Monitor moderation progress, view counts, and update your sale car info.",
    "zh": "随时随地掌握车源审核状态、浏览曝光热度并实时更新车辆在售信息。"
  },
  "Thông Tin Hồ Sơ Cá Nhân": {
    "en": "My Personal Profile",
    "zh": "个人资料管理中心"
  },
  "Thông báo kết quả duyệt tin từ đội ngũ kiểm duyệt viên Showroom.": {
    "en": "Moderation verdict notifications from showroom audit specialists.",
    "zh": "来自官方展厅专业审核专家团队的车源质检验真结果通知。"
  },
  "Thông tin cá nhân": {
    "en": "Personal Information",
    "zh": "个人基本信息"
  },
  "Thông tin xe minh bạch, kiểm tra thực tế, liên hệ trực tiếp chính chủ.": {
    "en": "Transparent car details, physical inspection, direct connection with owners.",
    "zh": "车况数据阳光透明，支持线下实地验车，零中介一键直联一手车主。"
  },
  "Thương Hiệu Phổ Biến": {
    "en": "Popular Automotive Brands",
    "zh": "全网热门车企品牌"
  },
  "Thẩm định & Biên soạn bởi OtoMarket": {
    "en": "Audited & Compiled by OtoMarket",
    "zh": "OtoMarket 技术专家组核验编撰"
  },
  "Thị Trường Ô Tô": {
    "en": "Automotive Market",
    "zh": "汽车市场大盘"
  },
  "Tin Tức & Đánh Giá Xe Ô Tô - OtoMarket": {
    "en": "Automotive News & Reviews - OtoMarket",
    "zh": "汽车资讯与专业测评 - OtoMarket"
  },
  "Tin chờ duyệt ngay": {
    "en": "Listings awaiting approval",
    "zh": "待审核车源队列"
  },
  "Tin nhắn & Liên hệ từ người mua": {
    "en": "Messages & inquiries from buyers",
    "zh": "来自买家的意向留言与咨询"
  },
  "Tin xe": {
    "en": "Car Listings",
    "zh": "车源动态"
  },
  "Tin đăng bán xe": {
    "en": "Car Sale Listing",
    "zh": "卖车车源信息"
  },
  "Tiêu đề bài viết": {
    "en": "Article Title",
    "zh": "资讯文章标题"
  },
  "Tiêu đề tin đăng": {
    "en": "Listing Title",
    "zh": "车源展示标题"
  },
  "Tiếp tục: Định giá & ODO": {
    "en": "Next: Pricing & Mileage",
    "zh": "下一步：定价格与里程"
  },
  "Toàn bộ danh mục xe hệ thống (": {
    "en": "Full System Inventory Catalog (",
    "zh": "全站系统在售库存目录 ("
  },
  "Toàn bộ xe ký gửi đã được xử lý xong.": {
    "en": "All consigned cars have been processed.",
    "zh": "所有个人寄售车源已全量审核处理完毕。"
  },
  "Trang bị tiện nghi nổi bật (Bấm để bật/tắt)": {
    "en": "Featured Comfort & Tech (Click to toggle)",
    "zh": "核心豪华亮点配置（点击即可开启/关闭）"
  },
  "Truy cập tài khoản để đăng tin và quản lý danh sách xe": {
    "en": "Access your account to post cars and manage inventory.",
    "zh": "登录您的专属账户以发布卖车信息并高效管理在售车辆。"
  },
  "Trạm Duyệt Tin Xe (": {
    "en": "Vehicle Approval Desk (",
    "zh": "车源核验工作站 ("
  },
  "Trạm Thẩm Định Showroom": {
    "en": "Showroom Appraisal Center",
    "zh": "展厅实车核验工作台"
  },
  "Trạng thái": {
    "en": "Status",
    "zh": "审核状态"
  },
  "Trạng thái duyệt tin đăng xe": {
    "en": "Vehicle listing moderation status",
    "zh": "车源上架审批进度"
  },
  "TÀI CHÍNH": {
    "en": "FINANCE",
    "zh": "金融理财"
  },
  "TÌM XE PHÙ HỢP": {
    "en": "FIND YOUR CAR",
    "zh": "智能精准选车"
  },
  "Tác giả:": {
    "en": "Author:",
    "zh": "本文作者："
  },
  "Tên này sẽ hiển thị công khai cho người mua khi bạn đăng tin bán xe.": {
    "en": "This name will be displayed publicly to buyers when you list a car.",
    "zh": "当您发布卖车帖子时，该昵称将对全网买家公开展示。"
  },
  "Tên xe & Thông số": {
    "en": "Car Name & Specifications",
    "zh": "车型全称与技术参数"
  },
  "Tìm Chiếc Xe Phù Hợp": {
    "en": "Find The Perfect Car",
    "zh": "挑选最契合您的心仪座驾"
  },
  "Tìm Xe Theo Ngân Sách Tham Khảo": {
    "en": "Find Cars by Target Budget",
    "zh": "按购车预算区间精选好车"
  },
  "Tìm thêm xe": {
    "en": "Find more cars",
    "zh": "浏览更多车源"
  },
  "Tìm thấy": {
    "en": "Found",
    "zh": "共找到"
  },
  "Tạo tin bán xe ngay": {
    "en": "Create Car Listing Now",
    "zh": "立即发布卖车信息"
  },
  "Tạo tài khoản OtoMarket": {
    "en": "Create OtoMarket Account",
    "zh": "注册 OtoMarket 新账号"
  },
  "Tất cả (": {
    "en": "All (",
    "zh": "全量 ("
  },
  "Tất cả kiểu dáng": {
    "en": "All body types",
    "zh": "所有车身结构"
  },
  "Tất cả mức giá": {
    "en": "All price tiers",
    "zh": "所有价格区间"
  },
  "Tất cả nguồn xe": {
    "en": "All vehicle sources",
    "zh": "全部车源渠道"
  },
  "Tất cả tin đăng xe đã được xử lý xong.": {
    "en": "All vehicle listings have been processed.",
    "zh": "所有待核验车源均已全部审核完毕。"
  },
  "Tất cả trạng thái": {
    "en": "All statuses",
    "zh": "全部审核状态"
  },
  "Tất cả xe": {
    "en": "All cars",
    "zh": "全部在售车辆"
  },
  "Tất cả xe (8)": {
    "en": "All cars (8)",
    "zh": "全部车源 (8)"
  },
  "Tất cả xe đang bán": {
    "en": "All cars for sale",
    "zh": "全部正在出售车源"
  },
  "Tổng tin:": {
    "en": "Total listings:",
    "zh": "车源总数："
  },
  "Tổng đài hỗ trợ (08:00 - 18:30)": {
    "en": "Support hotline (08:00 - 18:30)",
    "zh": "客户服务专线（08:00 - 18:30）"
  },
  "Tổng đã lưu": {
    "en": "Total saved",
    "zh": "累计收藏数"
  },
  "Từ 2018 - 2024": {
    "en": "From 2018 - 2024",
    "zh": "2018 - 2024年款"
  },
  "Từ chối phê duyệt tin": {
    "en": "Reject listing approval",
    "zh": "驳回该车源审核"
  },
  "Tự động (Xăng) vs Tự động (Xăng)": {
    "en": "Automatic (Petrol) vs Automatic (Petrol)",
    "zh": "自动挡 (汽油) 对比 自动挡 (汽油)"
  },
  "Về trang chủ": {
    "en": "Back to Home",
    "zh": "返回首页"
  },
  "XEM TẤT CẢ XE ĐANG BÁN": {
    "en": "VIEW ALL CARS FOR SALE",
    "zh": "查看全部在售现车"
  },
  "Xe Showroom": {
    "en": "Showroom Cars",
    "zh": "官方展厅现车"
  },
  "Xe Showroom (": {
    "en": "Showroom Cars (",
    "zh": "官方展厅现车 ("
  },
  "Xe ký gửi / Môi giới": {
    "en": "Consigned / Broker Cars",
    "zh": "个人寄售车源"
  },
  "Xe ký gửi đang bán": {
    "en": "Consigned cars for sale",
    "zh": "正在寄售中的车辆"
  },
  "Xe ô tô": {
    "en": "Automobiles",
    "zh": "汽车"
  },
  "Xe Đang Bán Nổi Bật": {
    "en": "Featured Cars For Sale",
    "zh": "精选热门在售好车"
  },
  "Xe đã bán nhưng vẫn đăng": {
    "en": "Car sold but still listed",
    "zh": "已售出但未及时下架"
  },
  "Xem trước tin đăng trên sàn OtoMarket": {
    "en": "Preview listing on OtoMarket",
    "zh": "在 OtoMarket 上预览展示效果"
  },
  "Xem tất cả các hãng xe": {
    "en": "View all car brands",
    "zh": "查看全部汽车品牌"
  },
  "Xem tất cả →": {
    "en": "View all →",
    "zh": "查看全部 →"
  },
  "Xu hướng": {
    "en": "Trends",
    "zh": "市场热点风向"
  },
  "Xuất xứ xe": {
    "en": "Vehicle origin",
    "zh": "车辆出厂产地"
  },
  "Xác nhận từ chối": {
    "en": "Confirm Rejection",
    "zh": "确认驳回"
  },
  "Xóa tất cả": {
    "en": "Clear all",
    "zh": "清空全部"
  },
  "Ô tô cũ (Lướt tuyển chọn)": {
    "en": "Used Cars (Certified Pre-Owned)",
    "zh": "二手汽车（严选准新车）"
  },
  "Ô tô mới (Chính hãng)": {
    "en": "New Cars (Official)",
    "zh": "全新汽车（官方正品）"
  },
  "Đang hiển thị": {
    "en": "Active (Public)",
    "zh": "正在展示中"
  },
  "Đang hiển thị (": {
    "en": "Active (",
    "zh": "公开展示中 ("
  },
  "Đang hiển thị:": {
    "en": "Active:",
    "zh": "公开展示中："
  },
  "Chờ duyệt": {
    "en": "Pending Approval",
    "zh": "待审核"
  },
  "Chờ duyệt (": {
    "en": "Pending Approval (",
    "zh": "待审核 ("
  },
  "Chờ duyệt:": {
    "en": "Pending:",
    "zh": "待审核："
  },
  "Cần sửa lại": {
    "en": "Needs Revision",
    "zh": "待修改完善"
  },
  "Cần sửa lại (": {
    "en": "Needs Revision (",
    "zh": "待修改完善 ("
  },
  "Cần sửa lại:": {
    "en": "Needs Revision:",
    "zh": "待修改完善："
  },
  "Bị từ chối": {
    "en": "Rejected",
    "zh": "已驳回"
  },
  "Đã ẩn (": {
    "en": "Hidden (",
    "zh": "已下架隐藏 ("
  },
  "Đang tải thông tin chi tiết xe...": {
    "en": "Loading vehicle details...",
    "zh": "正在加载车辆详细档案..."
  },
  "Điền thông tin và hình ảnh thực tế để tiếp cận hàng triệu người mua xe trên toàn quốc": {
    "en": "Fill in details and actual photos to reach millions of car buyers nationwide.",
    "zh": "完善车辆参数与实拍照片，高效对接全国数百万真实买家。"
  },
  "Đã hiểu": {
    "en": "Got it",
    "zh": "知道了"
  },
  "Đã qua sử dụng": {
    "en": "Pre-Owned / Used",
    "zh": "二手 / 已使用"
  },
  "Đăng Bán Xe Ô Tô - OtoMarket": {
    "en": "Sell Your Car - OtoMarket",
    "zh": "发布卖车 - OtoMarket"
  },
  "Đăng Ký Tài Khoản Mới - OtoMarket": {
    "en": "Create New Account - OtoMarket",
    "zh": "注册新账号 - OtoMarket"
  },
  "Đăng Tin Bán Xe Ô Tô": {
    "en": "Post Car For Sale",
    "zh": "发布在售汽车"
  },
  "Đăng ký tài khoản mới": {
    "en": "Register New Account",
    "zh": "注册新用户账号"
  },
  "Đăng ký để đăng tin bán xe, lưu xe yêu thích và nhận hỗ trợ tốt nhất": {
    "en": "Register to list cars, save favorites, and receive premium assistance.",
    "zh": "立即注册即可免费发帖卖车、收藏心仪车源并尊享专业服务。"
  },
  "Đăng nhập nhanh (Demo)": {
    "en": "Quick Demo Login",
    "zh": "一键演示登录"
  },
  "Đăng nhập tài khoản": {
    "en": "Account Login",
    "zh": "登录账户"
  },
  "Đăng nhập để đồng bộ": {
    "en": "Login to sync data",
    "zh": "登录以同步心愿单"
  },
  "Đăng xuất tài khoản": {
    "en": "Logout account",
    "zh": "退出当前登录"
  },
  "Đường Trần Phú, TP. Nha Trang, Tỉnh Khánh Hòa": {
    "en": "Tran Phu St., Nha Trang City, Khanh Hoa Province",
    "zh": "庆和省芽庄市陈富路"
  },
  "Địa chỉ Email": {
    "en": "Email Address",
    "zh": "电子邮箱地址"
  },
  "Địa chỉ Email (Định danh tài khoản)": {
    "en": "Email Address (Account ID)",
    "zh": "电子邮箱（核心登录标识）"
  },
  "Địa chỉ xem xe": {
    "en": "Viewing Address",
    "zh": "实地看车地址"
  },
  "Địa phương mặc định được tự động điền khi bạn tạo tin đăng bán xe mới.": {
    "en": "Default region automatically populated when you create a new car post.",
    "zh": "当您创建新卖车帖子时，系统将自动填充您保存的默认常驻城市。"
  },
  "Định giá chuẩn xác": {
    "en": "Accurate Valuation",
    "zh": "精准科学估值"
  },
  "Ảnh": {
    "en": "Photos",
    "zh": "相册实拍"
  },
  "Ảnh mờ / thiếu góc": {
    "en": "Blurry photos / missing angles",
    "zh": "照片模糊不清或关键角度缺失"
  },
  "xe phù hợp": {
    "en": "matching cars",
    "zh": "辆匹配车源"
  },
  "© 2026 OtoMarket - Sàn Giao Dịch Mua Bán Ô Tô Trực Tuyến.": {
    "en": "© 2026 OtoMarket - Online Automotive Trading Platform.",
    "zh": "© 2026 OtoMarket - 越南在线汽车交易优选平台。"
  },
  "© 2026 OtoMarket - Sàn Giao Dịch Xe Uy Tín Hàng Đầu": {
    "en": "© 2026 OtoMarket - Premier Trusted Car Marketplace",
    "zh": "© 2026 OtoMarket - 越南领先的诚信汽车交易平台"
  },
  "(3)": {
    "en": "(3)",
    "zh": "(3)"
  },
  "(7)": {
    "en": "(7)",
    "zh": "(7)"
  },
  "+ Camry": {
    "en": "+ Camry",
    "zh": "+ 凯美瑞"
  },
  "+ Corolla Cross": {
    "en": "+ Corolla Cross",
    "zh": "+ 卡罗拉锐放"
  },
  "+ Fortuner": {
    "en": "+ Fortuner",
    "zh": "+ 穿越者"
  },
  "+ Veloz Cross": {
    "en": "+ Veloz Cross",
    "zh": "+ 丰田Veloz"
  },
  "+ Vios": {
    "en": "+ Vios",
    "zh": "+ 威驰"
  },
  "+ Yaris Cross": {
    "en": "+ Yaris Cross",
    "zh": "+ 雅力士Cross"
  },
  "- Khách cá nhân": {
    "en": "- Private seller",
    "zh": "- 个人卖家"
  },
  "08:00 - 18:30 (Thứ 2 - CN)": {
    "en": "08:00 - 18:30 (Mon - Sun)",
    "zh": "08:00 - 18:30（周一至周日）"
  },
  "10.000+": {
    "en": "10,000+",
    "zh": "10,000+"
  },
  "3.500+": {
    "en": "3,500+",
    "zh": "3,500+"
  },
  "Bao gồm cả xe Showroom chính hãng và xe ký gửi từ người bán bên ngoài": {
    "en": "Includes both official showroom cars and external consigned vehicles",
    "zh": "包含官方授权展厅严选现车与个人寄售合规车源"
  },
  "Biến động giá thị trường ô tô": {
    "en": "Automotive market price trends",
    "zh": "汽车市场价格行情走势"
  },
  "Báo Cáo Vi Phạm (": {
    "en": "Violation Reports (",
    "zh": "违规举报 ("
  },
  "Bạn đang tìm chiếc xe ưng ý hoặc cần tư vấn trực tiếp?": {
    "en": "Looking for your dream car or need direct advice?",
    "zh": "正在找寻心仪座驾或需要专业购车咨询？"
  },
  "Bạn đang xem danh sách yêu thích lưu tạm trên trình duyệt này.": {
    "en": "You are viewing your temporarily saved favorites in this browser.",
    "zh": "您当前正在查看保存在本浏览器中的本地心愿单。"
  },
  "Bấm để tải ảnh lên hoặc kéo thả vào đây": {
    "en": "Click to upload photos or drag & drop here",
    "zh": "点击上传实拍照片或拖拽文件至此处"
  },
  "Bộ ảnh xe thực tế (Chọn gói mẫu hoặc tải ảnh mới)": {
    "en": "Actual photos (Select template package or upload new)",
    "zh": "车辆真实实拍图（选择预设包或直接上传）"
  },
  "Chính chủ bán (": {
    "en": "Direct Owner (",
    "zh": "一手车主 ("
  },
  "Chỉnh Sửa Thông Tin Tin Đăng": {
    "en": "Edit Vehicle Listing Details",
    "zh": "修改编辑车源展示信息"
  },
  "Cập nhật giá bán, số km lăn bánh và mô tả xe": {
    "en": "Update selling price, mileage, and description",
    "zh": "更新挂牌售价、表显里程与车辆详尽描述"
  },
  "Danh Sách Yêu Thích Của Bạn Đang Trống": {
    "en": "Your Favorites List is Empty",
    "zh": "您的心愿单车库当前空空如也"
  },
  "EN": {
    "en": "EN",
    "zh": "EN"
  },
  "VI": {
    "en": "VI",
    "zh": "VI"
  },
  "VS": {
    "en": "VS",
    "zh": "VS"
  },
  "km": {
    "en": "km",
    "zh": "公里"
  },
  "và": {
    "en": "and",
    "zh": "及"
  },
  "nam.nguyen@otomarket.vn": {
    "en": "nam.nguyen@otomarket.vn",
    "zh": "nam.nguyen@otomarket.vn"
  },
  "NAM NGUYEN": {
    "en": "NAM NGUYEN",
    "zh": "NAM NGUYEN"
  },
  "Nguyễn Hoàng Nam": {
    "en": "Nguyen Hoang Nam",
    "zh": "阮黄男 (Nguyen Hoang Nam)"
  },
  "Nguyễn Hoàng Nam • 0912 345 678": {
    "en": "Nguyen Hoang Nam • 0912 345 678",
    "zh": "阮黄男 • 0912 345 678"
  },
  "Giới Thiệu Về OtoMarket - Nền Tảng Mua Bán Ô Tô Trực Tuyến Minh Bạch": {
    "en": "About OtoMarket - Transparent Online Automotive Marketplace",
    "zh": "关于 OtoMarket - 阳光透明的在线汽车交易平台"
  },
  "Hỗ trợ JPG, PNG, WEBP (Bấm vào ảnh bất kỳ để đặt làm Ảnh bìa chính)": {
    "en": "Supports JPG, PNG, WEBP (Click any photo to set as Main Cover)",
    "zh": "支持 JPG, PNG, WEBP 格式（点击任意图片设为展示封面主图）"
  },
  "Hỗ trợ thông tin kỹ thuật, thẩm định xe và đăng ký lái thử các dòng xe ô tô.": {
    "en": "Technical data support, vehicle appraisal, and test drive registration.",
    "zh": "提供全车技术参数咨询、实车评估检测及免费预约试驾支持。"
  },
  "Minh Bạch Thủ Tục": {
    "en": "Transparent Procedures",
    "zh": "过户手续透明阳光"
  },
  "OtoMarket - Sàn Giao Dịch Mua Bán Ô Tô Trực Tuyến": {
    "en": "OtoMarket - Online Automotive Trading Platform",
    "zh": "OtoMarket - 线上汽车买卖撮合交易平台"
  },
  "OtoMarket là sàn kết nối trực tiếp Người Mua và Người Bán. Quý khách liên hệ xem xe thực tế và giao dịch trực tiếp. Nền tảng chưa hỗ trợ thanh toán hoặc đặt cọc trực tuyến.": {
    "en": "OtoMarket directly bridges Buyers and Sellers. Contact directly to inspect and transact. Platform does not yet support online escrow deposits.",
    "zh": "OtoMarket 为买卖双方直联撮合平台，双方直接联系线下验车并当面交割，平台目前暂不支持线上支付或定金托管。"
  },
  "OtoMarket là sàn kết nối trực tiếp Người Mua và Người Bán. Quý khách liên hệ xem xe thực tế và giao dịch trực tiếp. Nền tảng không thu phí môi giới trung gian.": {
    "en": "OtoMarket directly connects Buyers and Sellers. Contact directly to inspect and transact. Platform charges zero middleman broker fees.",
    "zh": "OtoMarket 直接连通买卖双方，支持直接联系实地看车并当面交易，平台绝不收取任何居间中介费。"
  },
  "Thông Tin Tài Khoản - Sàn Giao Dịch Xe OtoMarket": {
    "en": "Account Information - OtoMarket",
    "zh": "账户基本信息 - OtoMarket"
  },
  "Xe Showroom chính hãng": {
    "en": "Official Showroom Cars",
    "zh": "官方授权展厅严选现车"
  },
  "Hỗ trợ vay đến 80%": {
    "en": "Up to 80% Loan Support",
    "zh": "最高可贷80%"
  },
  "Giá trị xe": {
    "en": "Vehicle Price",
    "zh": "车辆总价"
  },
  "Tỷ lệ trả trước (Vốn tự có)": {
    "en": "Down Payment Ratio (Own Funds)",
    "zh": "首付比例（自有资金）"
  },
  "30% (Khuyên dùng)": {
    "en": "30% (Recommended)",
    "zh": "30%（推荐）"
  },
  "Vốn chuẩn bị trước:": {
    "en": "Required Upfront Funds:",
    "zh": "前期自备资金："
  },
  "Thời hạn vay": {
    "en": "Loan Term",
    "zh": "贷款期限"
  },
  "12 tháng (1 năm)": {
    "en": "12 months (1 year)",
    "zh": "12个月（1年）"
  },
  "24 tháng (2 năm)": {
    "en": "24 months (2 years)",
    "zh": "24个月（2年）"
  },
  "36 tháng (3 năm)": {
    "en": "36 months (3 years)",
    "zh": "36个月（3年）"
  },
  "48 tháng (4 năm)": {
    "en": "48 months (4 years)",
    "zh": "48个月（4年）"
  },
  "60 tháng (5 năm) - Phổ biến nhất": {
    "en": "60 months (5 years) - Most Popular",
    "zh": "60个月（5年）- 最热门"
  },
  "72 tháng (6 năm)": {
    "en": "72 months (6 years)",
    "zh": "72个月（6年）"
  },
  "84 tháng (7 năm) - Tối đa": {
    "en": "84 months (7 years) - Maximum",
    "zh": "84个月（7年）- 最长"
  },
  "60 tháng (5 năm)": {
    "en": "60 months (5 years)",
    "zh": "60个月（5年）"
  },
  "Lãi suất ưu đãi tham khảo:": {
    "en": "Referential preferential rate:",
    "zh": "参考优惠年利率："
  },
  "8.5% / năm (Cố định năm đầu)": {
    "en": "8.5% / year (Fixed first year)",
    "zh": "8.5% / 年（首年固定）"
  },
  "Số tiền ngân hàng cho vay:": {
    "en": "Bank Loan Amount:",
    "zh": "银行审批贷款额度："
  },
  "Tiền gốc hàng tháng:": {
    "en": "Monthly Principal:",
    "zh": "每月应还本金："
  },
  "Tiền lãi tháng đầu:": {
    "en": "First Month Interest:",
    "zh": "首月应还利息："
  },
  "Tính theo phương thức dư nợ giảm dần. Tiền lãi các tháng sau sẽ giảm dần theo số nợ gốc đã trả.": {
    "en": "Calculated by reducing balance method. Interest in subsequent months decreases as principal is repaid.",
    "zh": "按等额本金（递减还款）方式测算，后续月份利息将随已还本金逐月递减。"
  },
  "2.0 Dầu Đặc Biệt": {
    "en": "2.0 Diesel Special",
    "zh": "2.0 柴油尊享版"
  },
  "2.0 Dầu Đặc Biệt 2022": {
    "en": "2.0 Diesel Special 2022",
    "zh": "2.0 柴油尊享版 2022款"
  },
  "Hyundai Tucson 2.0 Dầu Đặc Biệt 2022": {
    "en": "Hyundai Tucson 2.0 Diesel Special 2022",
    "zh": "现代途胜 2.0 柴油尊享版 2022款"
  },
  "1.8V": {
    "en": "1.8V",
    "zh": "1.8V"
  },
  "1.8G": {
    "en": "1.8G",
    "zh": "1.8G"
  },
  "1.8HV": {
    "en": "1.8HV (Hybrid)",
    "zh": "1.8HV 油电混动"
  }
};

  // Build bidirectional reverse lookup index
  const REVERSE_LOOKUP = {};
  for (const viKey in I18N_DICT) {
    const entry = I18N_DICT[viKey];
    entry.vi = viKey;
    if (entry.en) {
      REVERSE_LOOKUP[entry.en.trim().toLowerCase()] = entry;
    }
    if (entry.zh) {
      REVERSE_LOOKUP[entry.zh.trim().toLowerCase()] = entry;
    }
  }

  const DYNAMIC_PATTERNS = [
    {
      regex: /^Tìm thấy\s*(\d+)\s*xe phù hợp$/i,
      en: 'Found $1 matching cars',
      zh: '共找到 $1 辆匹配车源'
    },
    {
      regex: /^Found\s*(\d+)\s*matching cars$/i,
      vi: 'Tìm thấy $1 xe phù hợp',
      zh: '共找到 $1 辆匹配车源'
    },
    {
      regex: /^(?:Trả trước từ|Trả trước):\s*(.*)$/i,
      en: 'Down payment: $1',
      zh: '首付款从: $1'
    },
    {
      regex: /^Down payment:\s*(.*)$/i,
      vi: 'Trả trước: $1',
      zh: '首付款: $1'
    },
    {
      regex: /^([0-9\.,]+)\s*(?:tỷ|Tỷ)$/i,
      en: '$1 billion',
      zh: '$1 亿'
    },
    {
      regex: /^([0-9\.,]+)\s*(?:triệu|Triệu)$/i,
      en: '$1 million',
      zh: '$1 百万'
    },
    {
      regex: /^([0-9\.,]+)\s*(?:tr|Tr)$/i,
      en: '$1 M',
      zh: '$1 百万'
    },
    {
      regex: /^([0-9\.,]+)\s*M$/i,
      vi: '$1 tr',
      zh: '$1 百万'
    },
    {
      regex: /^([0-9\.,]+)\s*billion$/i,
      vi: '$1 tỷ',
      zh: '$1 亿'
    },
    {
      regex: /^([0-9\.,]+)\s*million$/i,
      vi: '$1 triệu',
      zh: '$1 百万'
    },
    {
      regex: /^([0-9\.,]+)\s*(?:triệu|tr|million)\/tháng$/i,
      en: '$1 million/month',
      zh: '$1 百万/月'
    },
    {
      regex: /^([0-9\.,]+)\s*đ\s*\/\s*tháng$/i,
      en: '$1 VND / month',
      zh: '$1 越南盾 / 月'
    },
    {
      regex: /^([0-9\.,]+)\s*million\/month$/i,
      vi: '$1 triệu/tháng',
      zh: '$1 百万/月'
    },
    {
      regex: /^([0-9\.,]+)\s*VND\s*\/\s*month$/i,
      vi: '$1 đ / tháng',
      zh: '$1 越南盾 / 月'
    },
    {
      regex: /^Góp từ\s*([0-9\.,]+)\s*tr\/th$/i,
      en: 'From $1M/mo',
      zh: '月供 $1百万起'
    },
    {
      regex: /^(\d+)\s*ảnh(?:\s*thực\s*tế)?$/i,
      en: '$1 actual photos',
      zh: '$1 张实拍照片'
    },
    {
      regex: /^(\d+)\s*actual photos$/i,
      vi: '$1 ảnh thực tế',
      zh: '$1 张实拍照片'
    },
    {
      regex: /^([\d\.,]+)\s*lượt\s*xem$/i,
      en: '$1 views',
      zh: '$1 次浏览'
    },
    {
      regex: /^([\d\.,]+)\s*views$/i,
      vi: '$1 lượt xem',
      zh: '$1 次浏览'
    },
    {
      regex: /^(\d+)\s*phút\s*đọc$/i,
      en: '$1 min read',
      zh: '$1 分钟阅读'
    },
    {
      regex: /^(\d+)\s*min read$/i,
      vi: '$1 phút đọc',
      zh: '$1 分钟阅读'
    },
    {
      regex: /^Hiển thị\s*(\d+)\s*\/\s*(\d+)\s*bài\s*viết$/i,
      en: 'Showing $1 / $2 articles',
      zh: '显示 $1 / $2 篇文章'
    },
    {
      regex: /^Showing\s*(\d+)\s*\/\s*(\d+)\s*articles$/i,
      vi: 'Hiển thị $1 / $2 bài viết',
      zh: '显示 $1 / $2 篇文章'
    },
    {
      regex: /^(\d+)\s*bài\s*viết$/i,
      en: '$1 articles',
      zh: '$1 篇文章'
    },
    {
      regex: /^(\d+)\s*xe$/i,
      en: '$1 cars',
      zh: '$1 辆车'
    },
    {
      regex: /^(\d+)\s*cars$/i,
      vi: '$1 xe',
      zh: '$1 辆车'
    },
    {
      regex: /^(\d+)\s*chỗ$/i,
      en: '$1 seats',
      zh: '$1 座'
    },
    {
      regex: /^(\d+)\s*seats$/i,
      vi: '$1 chỗ',
      zh: '$1 座'
    },
    {
      regex: /^(\d+)\s*năm\s*\((\d+)\s*tháng\)$/i,
      en: '$1 years ($2 months)',
      zh: '$1 年（$2 个月）'
    },
    {
      regex: /^Bước\s*(\d+)$/i,
      en: 'Step $1',
      zh: '步骤 $1'
    },
    {
      regex: /^Đăng ngày:\s*(.*)$/i,
      en: 'Posted: $1',
      zh: '发布日期: $1'
    },
    {
      regex: /^Posted:\s*(.*)$/i,
      vi: 'Đăng ngày: $1',
      zh: '发布日期: $1'
    },
    {
      regex: /^Mã tin:\s*(.*)$/i,
      en: 'Listing ID: $1',
      zh: '车源编号: $1'
    },
    {
      regex: /^Listing ID:\s*(.*)$/i,
      vi: 'Mã tin: $1',
      zh: '车源编号: $1'
    },
    {
      regex: /^Gọi người bán:\s*(.*)$/i,
      en: 'Call seller: $1',
      zh: '致电车主: $1'
    },
    {
      regex: /^Call seller:\s*(.*)$/i,
      vi: 'Gọi người bán: $1',
      zh: '致电车主: $1'
    },
    {
      regex: /^Hotline:\s*(.*)$/i,
      en: 'Hotline: $1',
      zh: '服务热线: $1'
    },
    {
      regex: /^Tác giả:\s*(.*)$/i,
      en: 'Author: $1',
      zh: '作者: $1'
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
    if (!text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. Direct dictionary match by Vietnamese key
    if (I18N_DICT[trimmed]) {
      const target = (lang === 'vi') ? trimmed : I18N_DICT[trimmed][lang];
      if (target) return text.replace(trimmed, target);
    }

    // 2. Case-insensitive dictionary match by Vietnamese key
    const lower = trimmed.toLowerCase();
    for (const key in I18N_DICT) {
      if (key.toLowerCase() === lower) {
        const target = (lang === 'vi') ? key : I18N_DICT[key][lang];
        if (target) return text.replace(trimmed, target);
      }
    }

    // 3. Bidirectional Reverse lookup if text is in English or Chinese
    if (REVERSE_LOOKUP[lower]) {
      const entry = REVERSE_LOOKUP[lower];
      const target = entry[lang] || entry.vi;
      if (target) return text.replace(trimmed, target);
    }

    // 4. Dynamic regex patterns
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

  let isTranslating = false;

  function walkAndTranslate(rootNode, lang) {
    if (!rootNode) return;

    isTranslating = true;
    try {
      if (rootNode.nodeType === Node.TEXT_NODE) {
        if (rootNode._originalVi === undefined) {
          rootNode._originalVi = rootNode.nodeValue;
        }
        const original = rootNode._originalVi;
        const trans = (lang === 'vi') ? original : translateText(original, lang);
        if (rootNode.nodeValue !== trans) {
          rootNode.nodeValue = trans;
        }
        return;
      }

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
            if (node.parentNode && (node.parentNode.classList.contains('lang-opt') || node.parentNode.id === 'current-lang-text' || node.parentNode.closest('.lang-dropdown-container'))) {
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
        const translated = (lang === 'vi') ? (translateText(original, 'vi') || original) : translateText(original, lang);
        if (currentNode.nodeValue !== translated) {
          currentNode.nodeValue = translated;
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
            const translated = (lang === 'vi') ? (translateText(original, 'vi') || original) : translateText(original, lang);
            if (el.getAttribute(attr) !== translated) {
              el.setAttribute(attr, translated);
            }
          }
        });
      });
    } finally {
      isTranslating = false;
    }
  }

  function updateDropdownUI(lang) {
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };
    const textEl = document.getElementById('current-lang-text');
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
    const textMap = { vi: 'Tiếng Việt', en: 'English', zh: '中文' };

    container.className = 'dropdown lang-dropdown-container';
    container.style.display = 'inline-block';
    container.innerHTML = `
      <button class="topbar-lang-btn dropdown-toggle d-flex align-items-center gap-1" type="button" id="langDropdown" data-bs-toggle="dropdown" aria-expanded="false" title="Chọn ngôn ngữ / Select language">
        <span class="lang-text fw-bold" id="current-lang-text" style="font-size: 0.8rem; letter-spacing: 0.2px;">${textMap[currentLang] || 'Tiếng Việt'}</span>
        <i class="bi bi-chevron-down ms-1" style="font-size: 0.65rem;"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 py-1.5 rounded-3" aria-labelledby="langDropdown" style="font-size: 0.85rem; min-width: 120px; z-index: 1060;">
        <li>
          <a class="dropdown-item py-2 px-3 lang-opt lang-item-vi ${currentLang === 'vi' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('vi')">
            <span class="fw-medium">Tiếng Việt</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item py-2 px-3 lang-opt lang-item-en ${currentLang === 'en' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('en')">
            <span class="fw-medium">English</span>
          </a>
        </li>
        <li>
          <a class="dropdown-item py-2 px-3 lang-opt lang-item-zh ${currentLang === 'zh' ? 'active' : ''}" href="javascript:void(0)" onclick="setSiteLanguage('zh')">
            <span class="fw-medium">中文</span>
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

  // Observe dynamic content updates with loop protection & full text node support
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      if (isTranslating) return;
      const currentLang = getStoredLanguage();
      if (currentLang === 'vi') return;

      isTranslating = true;
      try {
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (const n of m.addedNodes) {
              if (n.nodeType === Node.ELEMENT_NODE) {
                if (!n.classList.contains('lang-dropdown-container') && !n.closest('.lang-dropdown-container')) {
                  walkAndTranslate(n, currentLang);
                }
              } else if (n.nodeType === Node.TEXT_NODE) {
                const p = n.parentNode;
                if (p && !['SCRIPT', 'STYLE', 'CODE', 'NOSCRIPT', 'TEXTAREA'].includes(p.nodeName) &&
                    !p.classList.contains('lang-opt') && p.id !== 'current-lang-text' && !p.closest('.lang-dropdown-container')) {
                  if (n._originalVi === undefined) {
                    n._originalVi = n.nodeValue;
                  }
                  const translated = translateText(n._originalVi, currentLang);
                  if (n.nodeValue !== translated) {
                    n.nodeValue = translated;
                  }
                }
              }
            }
          }
        }
      } finally {
        isTranslating = false;
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

})(window);
