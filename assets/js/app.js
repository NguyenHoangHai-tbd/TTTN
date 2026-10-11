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
  PENDING: 'pending',   // Chờ Admin duyệt, không công khai
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
    : (status === LISTING_STATUS.ACTIVE ? 'Ban Quản Trị OtoMarket' : null);

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
        by: reviewedBy || 'Ban Quản Trị OtoMarket',
        reason: rejectReason,
        note: status === LISTING_STATUS.ACTIVE ? 'Đã phê duyệt tin đăng' : 'Đã xem xét tin đăng'
      });
    }
  }

  return {
    ...item,
    ownerId: item.ownerId || 'user-demo-1',
    status: status,
    condition: condition,
    isNew: isNew,
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
        reviewedBy: "Ban Quản Trị OtoMarket",
        reviewHistory: [
          { action: "submit", status: LISTING_STATUS.PENDING, timestamp: "2026-10-06T08:30:00.000Z", by: "user-demo-1", note: "Gửi yêu cầu đăng tin" },
          { action: "approve", status: LISTING_STATUS.ACTIVE, timestamp: "2026-10-06T09:00:00.000Z", by: "Ban Quản Trị OtoMarket", reason: null, note: "Đã phê duyệt tin đăng" }
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
      })
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(defaultUserListings));
  }
}

// 1. Hàm getPublicCars() chỉ trả về xe mẫu hợp lệ và tin user có status=active
function getPublicCars() {
  const customListings = getCustomListings();
  const activeCustom = customListings.filter(c => c.status === LISTING_STATUS.ACTIVE);
  const normalizedSamples = SAMPLE_CARS.map(car => normalizeListing({
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
  const normalizedSamples = SAMPLE_CARS.map(car => normalizeListing({
    ...car,
    status: LISTING_STATUS.ACTIVE,
    condition: car.condition || (car.isNew ? 'new' : 'used')
  }));
  return [...normalizedSamples, ...availableCustom];
}

function getCarById(id) {
  const all = getAllCars(true);
  return all.find(c => c.id === id) || null;
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
    const adminName = reviewer || (currentUser && currentUser.name) || 'Ban Quản Trị OtoMarket';

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

// Quản lý yêu thích theo tài khoản (userId)
function getCurrentUserId() {
  const user = getLoggedInUser();
  if (user && (user.id || user.email)) {
    return user.id || user.email;
  }
  return null;
}

function getFavorites() {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const key = `otomarket_favorites_${userId}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  const userId = getCurrentUserId();
  if (!userId) return;
  const key = `otomarket_favorites_${userId}`;
  localStorage.setItem(key, JSON.stringify(favs));
}

function isFavorite(carId) {
  const favs = getFavorites();
  return favs.includes(carId);
}

function toggleFavorite(carId) {
  const user = getLoggedInUser();
  if (!user) {
    localStorage.setItem('otomarket_redirect_after_login', window.location.href);
    window.location.href = 'login.html';
    return false;
  }

  const allCars = getAllCars(true);
  const car = allCars.find(c => c.id === carId);
  if (!car || car.status !== LISTING_STATUS.ACTIVE) {
    showToast("Chỉ có thể lưu các tin đang hoạt động vào yêu thích", "warning");
    return false;
  }

  let favs = getFavorites();
  const index = favs.indexOf(carId);
  let added = false;
  if (index > -1) {
    favs.splice(index, 1);
    showToast("Đã xóa khỏi danh sách yêu thích", "info");
    added = false;
  } else {
    favs.push(carId);
    showToast("Đã thêm vào danh sách xe yêu thích", "success");
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

function updateReportStatus(reportId, status, adminName = 'Admin') {
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
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function setLoggedInUser(user) {
  const normalizedUser = {
    ...user,
    email: String(user.email || '').trim().toLowerCase(),
    role: String(user.email || '').trim().toLowerCase() === 'admin@otomarket.vn' ? 'admin' : 'user'
  };
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(normalizedUser));
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

function syncHeaderUserUI() {
  const authSection = document.getElementById('navbar-auth-section');
  if (!authSection) return;

  const user = getLoggedInUser();
  if (user) {
    const isAdmin = user.role === 'admin' && user.email === 'admin@otomarket.vn';
    authSection.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-custom dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle text-teal"></i>
          <span class="d-none d-xl-inline">${user.name || user.email}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2">
          <li><a class="dropdown-item py-2" href="my-listings.html"><i class="bi bi-card-checklist me-2 text-teal"></i>Quản lý tin đăng</a></li>
          <li><a class="dropdown-item py-2" href="favorites.html"><i class="bi bi-heart me-2 text-danger"></i>Xe yêu thích</a></li>
          ${isAdmin ? '<li><a class="dropdown-item py-2" href="admin.html"><i class="bi bi-shield-lock me-2 text-warning"></i>Trang quản trị (Admin)</a></li>' : ''}
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item py-2 text-danger" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
        </ul>
      </div>
    `;
  } else {
    authSection.innerHTML = `
      <a href="login.html" class="btn btn-outline-custom">
        <i class="bi bi-person"></i>
        <span>Đăng nhập</span>
      </a>
    `;
  }
}

function syncAdminLinksVisibility() {
  const user = getLoggedInUser();
  const isAdmin = user && user.role === 'admin' && user.email === 'admin@otomarket.vn';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

function enforcePagePermissions() {
  const path = window.location.pathname;
  const user = getLoggedInUser();
  const isAdmin = user && user.role === 'admin' && user.email === 'admin@otomarket.vn';

  if (path.includes('post-car.html') || path.includes('my-listings.html')) {
    if (!user) {
      showToast("Vui lòng đăng nhập để tiếp tục", "warning");
      setTimeout(() => { window.location.href = 'login.html'; }, 500);
    }
  }

  if (path.includes('admin.html')) {
    if (!isAdmin) {
      showToast("Bạn không có quyền truy cập trang quản trị", "error");
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
  }
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

// Render thẻ xe chung
function createCarCardHTML(car) {
  const isFav = isFavorite(car.id);
  const heartClass = isFav ? 'bi-heart-fill active' : 'bi-heart';
  const isNewCar = car.condition === 'new' || car.isNew;
  const badgeHtml = isNewCar
    ? `<span class="car-card-badge bg-primary text-white"><i class="bi bi-stars me-1"></i>Xe mới</span>`
    : (car.isFeatured 
        ? `<span class="car-card-badge badge-hot"><i class="bi bi-fire me-1"></i>Nổi bật</span>`
        : `<span class="car-card-badge"><i class="bi bi-shield-check me-1"></i>Kiểm duyệt</span>`);

  const mileageText = isNewCar ? "Xe mới 100%" : (car.mileageDisplay || `${(car.mileage || 0).toLocaleString()} km`);

  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="car-card">
        <div class="car-card-img-wrapper">
          <img src="${car.image}" alt="${car.title}" class="car-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80'">
          ${badgeHtml}
          <button class="car-fav-btn ${isFav ? 'active' : ''}" onclick="handleCardFavClick(event, '${car.id}')" title="Lưu xe yêu thích" aria-label="Yêu thích">
            <i class="bi ${heartClass}"></i>
          </button>
        </div>
        <div class="car-card-body">
          <a href="car-detail.html?id=${car.id}" class="car-card-title" title="${car.title}">${car.title}</a>
          <div class="car-card-price">${car.priceDisplay || formatCurrency(car.price)}</div>

          <div class="car-spec-grid">
            <div class="car-spec-item">
              <i class="bi bi-calendar3"></i>
              <span>${car.year}</span>
            </div>
            <div class="car-spec-item">
              <i class="bi bi-speedometer2"></i>
              <span>${mileageText}</span>
            </div>
            <div class="car-spec-item">
              <i class="bi bi-gear"></i>
              <span>${car.transmission}</span>
            </div>
            <div class="car-spec-item">
              <i class="bi bi-fuel-pump"></i>
              <span>${car.fuel}</span>
            </div>
          </div>

          <div class="car-card-footer">
            <div class="car-seller-info">
              <i class="bi bi-person-circle"></i>
              <span>${car.sellerType}</span>
            </div>
            <div class="car-location">
              <i class="bi bi-geo-alt"></i>
              <span>${car.location}</span>
            </div>
          </div>

          <div class="mt-3 pt-2">
            <a href="car-detail.html?id=${car.id}" class="btn btn-outline-dark btn-sm w-100 fw-semibold rounded-2 py-2">
              Xem chi tiết <i class="bi bi-arrow-right ms-1"></i>
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
  updateFavoritesCountBadge();
  syncHeaderUserUI();
  syncAdminLinksVisibility();
  enforcePagePermissions();
});
