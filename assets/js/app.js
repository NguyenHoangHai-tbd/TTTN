/**
 * OtoMarket - Logic & Ứng dụng chính (JavaScript)
 * Quản lý LocalStorage, Yêu thích, Tin đăng demo, Xác thực mẫu, Toasts
 */

const STORAGE_KEYS = {
  FAVORITES: 'otomarket_favorites',
  CUSTOM_LISTINGS: 'otomarket_custom_listings',
  AUTH_USER: 'otomarket_user'
};

// Khởi tạo dữ liệu mẫu cho LocalStorage nếu chưa có
function initializeStorage() {
  // 1. Khởi tạo danh sách yêu thích mặc định (2 xe mẫu đầu tiên)
  if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
    const initialFavorites = ['car-1', 'car-4'];
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(initialFavorites));
  }

  // 2. Khởi tạo tin đăng demo của người dùng nếu chưa có
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTINGS)) {
    const defaultUserListings = [
      {
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
        images: [
          "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80"
        ],
        isFeatured: false,
        isNew: false,
        postedDate: "06/10/2026",
        viewCount: 142,
        status: "active", // active | pending | rejected | sold
        description: "Xe gia đình đi giữ gìn cẩn thận, bảo dưỡng định kỳ 5.000km tại Honda Giải Phóng. Bản L trang bị cửa sổ trời toàn cảnh, cốp điện đá cốp, gói an toàn Honda Sensing hỗ trợ giữ làn và phanh khẩn cấp.",
        specifications: {
          engine: "1.5L DOHC VTEC TURBO",
          power: "188 mã lực / 5.600 rpm",
          torque: "240 Nm / 2.000 - 5.000 rpm",
          drivetrain: "Cầu trước (FWD)",
          fuelConsumption: "6.9L / 100km",
          registrationExpiry: "Tháng 08/2027",
          warranty: "Bảo hành chính hãng đến 2028"
        }
      },
      {
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
        images: [
          "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80"
        ],
        isFeatured: false,
        isNew: false,
        postedDate: "09/10/2026",
        viewCount: 28,
        status: "pending", // Đang chờ duyệt
        description: "Xe nhập khẩu nguyên chiếc từ Thái Lan, lăn bánh 11.000 km. Đầy đủ tiện nghi cao cấp: HUD hiển thị kính lái, hệ thống i-Activsense, cốp điện, nhớ ghế 2 vị trí.",
        specifications: {
          engine: "SkyActiv-G 2.0L",
          power: "153 mã lực",
          torque: "200 Nm",
          drivetrain: "Cầu trước",
          fuelConsumption: "6.4L / 100km",
          registrationExpiry: "Tháng 10/2027",
          warranty: "Bảo dưỡng đầy đủ lịch sử"
        }
      }
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(defaultUserListings));
  }

  // 3. Khởi tạo tài khoản đăng nhập demo sẵn nếu chưa có
  if (!localStorage.getItem(STORAGE_KEYS.AUTH_USER)) {
    const demoUser = {
      name: "Nguyễn Hoàng Nam",
      email: "nam.nguyen@otomarket.vn",
      phone: "0912 345 678",
      role: "user",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(demoUser));
  }
}

// Lấy toàn bộ xe (kết hợp SAMPLE_CARS + tin đăng custom đang hoạt động)
function getAllCars(includePending = false) {
  const customListings = getCustomListings();
  let availableCustom = customListings;
  if (!includePending) {
    availableCustom = customListings.filter(c => c.status === 'active');
  }
  return [...SAMPLE_CARS, ...availableCustom];
}

// Lấy danh sách tin do người dùng tạo
function getCustomListings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_LISTINGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading custom listings:", e);
    return [];
  }
}

// Lưu tin đăng mới vào localStorage
function saveCustomListing(carData) {
  const listings = getCustomListings();
  listings.unshift(carData);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
}

// Cập nhật trạng thái tin đăng (pending, active, rejected, sold)
function updateListingStatus(id, newStatus, reason = "") {
  const listings = getCustomListings();
  const index = listings.findIndex(c => c.id === id);
  if (index !== -1) {
    listings[index].status = newStatus;
    if (reason) {
      listings[index].rejectReason = reason;
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
    return true;
  }
  return false;
}

// Sửa thông tin tin đăng
function updateListingData(id, updatedFields) {
  const listings = getCustomListings();
  const index = listings.findIndex(c => c.id === id);
  if (index !== -1) {
    listings[index] = { ...listings[index], ...updatedFields };
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
    return true;
  }
  return false;
}

// Xóa tin đăng
function deleteCustomListing(id) {
  let listings = getCustomListings();
  listings = listings.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_LISTINGS, JSON.stringify(listings));
}

// Lấy xe theo ID
function getCarById(id) {
  const allCars = getAllCars(true);
  return allCars.find(c => c.id === id);
}

// Quản lý Yêu thích (Favorites)
function getFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function isFavorite(carId) {
  const favs = getFavorites();
  return favs.includes(carId);
}

function toggleFavorite(carId) {
  let favs = getFavorites();
  let added = false;
  if (favs.includes(carId)) {
    favs = favs.filter(id => id !== carId);
    showToast("Đã xóa xe khỏi danh sách yêu thích", "warning");
  } else {
    favs.push(carId);
    added = true;
    showToast("Đã thêm xe vào danh sách yêu thích", "success");
  }
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
  updateFavoritesCountBadge();
  return added;
}

function removeFavorite(carId) {
  let favs = getFavorites();
  favs = favs.filter(id => id !== carId);
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
  updateFavoritesCountBadge();
  showToast("Đã xóa xe khỏi yêu thích", "warning");
}

function clearAllFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
  updateFavoritesCountBadge();
  showToast("Đã xóa toàn bộ danh sách yêu thích", "warning");
}

function updateFavoritesCountBadge() {
  const favs = getFavorites();
  const badgeElements = document.querySelectorAll('.favorites-badge-count');
  badgeElements.forEach(el => {
    el.textContent = favs.length;
    el.style.display = favs.length > 0 ? 'inline-block' : 'none';
  });
}

// Quản lý Đăng nhập & Xác thực demo
function getLoggedInUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function setLoggedInUser(user) {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  syncHeaderUserUI();
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  syncHeaderUserUI();
  showToast("Đã đăng xuất thành công!", "info");
}

// Cập nhật Header theo trạng thái đăng nhập
function syncHeaderUserUI() {
  const user = getLoggedInUser();
  const authContainer = document.getElementById('navbar-auth-section');
  if (!authContainer) return;

  if (user) {
    authContainer.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-custom dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="rounded-circle" width="26" height="26" alt="Avatar">
          <span class="d-none d-lg-inline">${user.name}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 py-2">
          <li class="px-3 py-2 border-bottom">
            <div class="fw-bold text-dark">${user.name}</div>
            <div class="small text-muted">${user.email}</div>
          </li>
          <li><a class="dropdown-item py-2" href="my-listings.html"><i class="bi bi-card-checklist me-2 text-teal"></i>Quản lý tin đăng</a></li>
          <li><a class="dropdown-item py-2" href="favorites.html"><i class="bi bi-heart me-2 text-danger"></i>Xe đã lưu</a></li>
          <li><a class="dropdown-item py-2" href="admin.html"><i class="bi bi-shield-lock me-2 text-primary"></i>Trang quản trị (Admin)</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item py-2 text-danger" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
        </ul>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-outline-custom">
        <i class="bi bi-person"></i>
        <span>Đăng nhập</span>
      </a>
    `;
  }
}

// Toast Notification
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  let icon = 'bi-check-circle-fill text-success';
  if (type === 'error') icon = 'bi-x-circle-fill text-danger';
  if (type === 'warning') icon = 'bi-exclamation-triangle-fill text-warning';
  if (type === 'info') icon = 'bi-info-circle-fill text-info';

  toast.innerHTML = `
    <i class="bi ${icon} fs-5"></i>
    <div class="toast-message flex-grow-1">${message}</div>
    <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Close" onclick="this.parentElement.remove()"></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, 3500);
}

// Định dạng tiền tệ
function formatCurrency(amount) {
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
  const badgeHtml = car.isFeatured 
    ? `<span class="car-card-badge badge-hot"><i class="bi bi-fire me-1"></i>Nổi bật</span>`
    : `<span class="car-card-badge"><i class="bi bi-shield-check me-1"></i>Kiểm định</span>`;

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
              <span>${car.mileageDisplay || (car.mileage.toLocaleString() + ' km')}</span>
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
});
