// ============================================
// COMMON UTILITIES AND SHARED FUNCTIONS
// ============================================

// ============================================
// AUTHENTICATION MANAGEMENT
// ============================================

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem("userEmail") !== null;
}

// Get current user email
function getCurrentUserEmail() {
  return localStorage.getItem("userEmail");
}

// Get current user name
function getCurrentUserName() {
  return localStorage.getItem("userName") || getCurrentUserEmail();
}

// Log out user
function logout() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  showNotification('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = "/";
  }, 500);
}

// Protected pages that require authentication
const PROTECTED_PAGES = [
  '/dashboard.html',
  '/analytics.html',
  '/model-performance.html',
  '/single-prediction.html',
  '/bulk-prediction.html'
];

// Check if current page requires authentication
function requireAuth() {
  const currentPath = window.location.pathname;
  const isProtected = PROTECTED_PAGES.some(page => currentPath.includes(page));
  
  if (isProtected && !isLoggedIn()) {
    showNotification('Please login to access this page', 'warning');
    setTimeout(() => {
      window.location.href = '/auth.html';
    }, 1000);
    return false;
  }
  return true;
}

// Redirect if already logged in (for auth page)
function redirectIfLoggedIn() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('auth.html') && isLoggedIn()) {
    window.location.href = '/dashboard.html';
  }
}

// ============================================
// DARK MODE MANAGEMENT
// ============================================
class ThemeManager {
  constructor() {
    this.isDark = this.loadTheme();
    this.applyTheme();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
    localStorage.setItem("theme", this.isDark ? "dark" : "light");
    this.dispatchEvent();
  }

  applyTheme() {
    const htmlElement = document.documentElement;
    if (this.isDark) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }

  dispatchEvent() {
    window.dispatchEvent(
      new CustomEvent("themeChange", { detail: { isDark: this.isDark } })
    );
  }
}

const themeManager = new ThemeManager();

// Initialize theme toggle button
function initThemeToggle() {
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      themeManager.toggleTheme();
      updateThemeIcon();
    });
  }
}

function updateThemeIcon() {
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    const icon = themeToggle.querySelector("svg");
    if (icon) {
      if (themeManager.isDark) {
        icon.innerHTML =
          '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
      } else {
        icon.innerHTML =
          '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      }
    }
  }
}

// ============================================
// NAVIGATION MANAGEMENT
// ============================================
function initNavigation() {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Close menu when link is clicked
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });

  // Update active nav link
  updateActiveNavLink();
  
  // Update navbar based on login status
  updateNavbar();
  
  // Initialize logout button
  initLogoutButton();
}

function updateNavbar() {
  const navLinks = document.querySelector(".nav-links");
  const navActions = document.querySelector(".nav-actions");
  
  if (!navLinks || !navActions) return;
  
  if (isLoggedIn()) {
    // User is logged in - show full navbar
    navLinks.innerHTML = `
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/dashboard.html" class="nav-link">Dashboard</a></li>
      <li><a href="/analytics.html" class="nav-link">Analytics</a></li>
      <li><a href="/model-performance.html" class="nav-link">Model</a></li>
      <li><a href="/single-prediction.html" class="nav-link">Predict</a></li>
      <li><a href="/bulk-prediction.html" class="nav-link">Bulk Predict</a></li>
    `;
    
    // Update actions to show user info and logout
    const existingThemeToggle = navActions.querySelector('.theme-toggle');
    const existingMobileToggle = navActions.querySelector('.mobile-menu-toggle');
    
    navActions.innerHTML = '';
    
    // Add user info
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info hidden-mobile';
    userInfo.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--muted); border-radius: var(--radius); font-size: 0.875rem;';
    userInfo.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span>${getCurrentUserName()}</span>
    `;
    navActions.appendChild(userInfo);
    
    // Add logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline btn-sm';
    logoutBtn.id = 'logout-btn';
    logoutBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      <span class="hidden-mobile">Logout</span>
    `;
    navActions.appendChild(logoutBtn);
    
    // Re-add theme toggle
    if (existingThemeToggle) {
      navActions.appendChild(existingThemeToggle);
    }
    
    // Re-add mobile toggle
    if (existingMobileToggle) {
      navActions.appendChild(existingMobileToggle);
    }
    
  } else {
    // User is not logged in - show limited navbar
    navLinks.innerHTML = `
      <li><a href="/" class="nav-link">Home</a></li>
      <li><a href="/auth.html" class="nav-link">Sign In</a></li>
    `;
    
    // Update actions to show sign in button
    const existingThemeToggle = navActions.querySelector('.theme-toggle');
    const existingMobileToggle = navActions.querySelector('.mobile-menu-toggle');
    
    navActions.innerHTML = '';
    
    // Add sign in button
    const signInBtn = document.createElement('a');
    signInBtn.href = '/auth.html';
    signInBtn.className = 'btn btn-primary hidden-mobile';
    signInBtn.textContent = 'Sign In';
    navActions.appendChild(signInBtn);
    
    // Re-add theme toggle
    if (existingThemeToggle) {
      navActions.appendChild(existingThemeToggle);
    }
    
    // Re-add mobile toggle
    if (existingMobileToggle) {
      navActions.appendChild(existingMobileToggle);
    }
  }
  
  updateActiveNavLink();
}

function initLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

function updateActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (currentPath === "/" && href === "/") {
      link.classList.add("active");
    } else if (currentPath !== "/" && href !== "/" && currentPath.includes(href)) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ============================================
// DOM UTILITIES
// ============================================
function getElement(selector) {
  return document.querySelector(selector);
}

function getElements(selector) {
  return document.querySelectorAll(selector);
}

function createElement(tag, className = "", innerHTML = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

function showElement(element) {
  if (element) element.classList.remove("hidden");
}

function hideElement(element) {
  if (element) element.classList.add("hidden");
}

function toggleElement(element) {
  if (element) element.classList.toggle("hidden");
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function openModal(modalSelector) {
  const modal = getElement(modalSelector);
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal(modalSelector) {
  const modal = getElement(modalSelector);
  if (modal) {
    modal.classList.remove("active");
  }
}

// Close modal when clicking outside
function initModalListeners(modalSelector) {
  const modal = getElement(modalSelector);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modalSelector);
      }
    });
  }
}

// ============================================
// FORM UTILITIES
// ============================================
function getFormData(formSelector) {
  const form = getElement(formSelector);
  if (!form) return null;

  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

function resetForm(formSelector) {
  const form = getElement(formSelector);
  if (form) form.reset();
}

function setFormData(formSelector, data) {
  const form = getElement(formSelector);
  if (!form) return;

  Object.keys(data).forEach((key) => {
    const field = form.elements[key];
    if (field) {
      field.value = data[key];
    }
  });
}

// ============================================
// TOAST/NOTIFICATION
// ============================================
function showNotification(message, type = "success") {
  const toast = createElement(
    "div",
    `alert alert-${type}`,
    `
    <svg class="alert-icon" fill="currentColor" viewBox="0 0 20 20">
      ${
        type === "success"
          ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />'
          : type === "error"
          ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />'
          : '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />'
      }
    </svg>
    <span>${message}</span>
  `
  );

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromStorage(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

function removeFromStorage(key) {
  localStorage.removeItem(key);
}

// ============================================
// PAGINATION
// ============================================
function paginate(items, page, itemsPerPage) {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  return {
    items: items.slice(start, end),
    totalPages,
    currentPage: page,
    totalItems: items.length,
  };
}

// ============================================
// FILTERING
// ============================================
function filterArray(array, key, value) {
  if (!value) return array;
  return array.filter((item) =>
    String(item[key]).toLowerCase().includes(String(value).toLowerCase())
  );
}

function filterByMultipleKeys(array, filters) {
  return array.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return String(item[key]).toLowerCase().includes(String(value).toLowerCase());
    });
  });
}

// ============================================
// CSV EXPORT
// ============================================
function exportToCSV(data, filename = "export.csv") {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  let csv = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value;
    });
    csv += values.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

// ============================================
// DEBOUNCE & THROTTLE
// ============================================
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function throttle(func, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication for protected pages
  requireAuth();
  
  // Redirect if already logged in on auth page
  redirectIfLoggedIn();
  
  // Initialize UI components
  initThemeToggle();
  initNavigation();
  updateThemeIcon();
});