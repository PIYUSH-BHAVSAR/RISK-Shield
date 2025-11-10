// Auth page functionality
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initLoginForm();
  initSignupForm();
  initForgotPassword();
  initKYCUpload();
});

function initTabs() {
  const triggers = document.querySelectorAll('.tabs-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabName = trigger.dataset.tab;
      
      // Update active trigger
      triggers.forEach(t => t.classList.remove('active'));
      trigger.classList.add('active');
      
      // Update active content
      const contents = document.querySelectorAll('.tabs-content');
      contents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
    });
  });
}
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]').value;
      const password = form.querySelector('[name="password"]').value;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing In...';

      try {
        const res = await fetch('https://pylord-api-bfsi.hf.space/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showNotification(data.detail || 'Login failed', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
          return;
        }

        showNotification(data.message, 'success');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.user || '');
        setTimeout(() => window.location.href = '/dashboard.html', 1000);
      } catch (err) {
        showNotification('Server error. Try again later.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
}

function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]').value;
      const name = form.querySelector('[name="name"]').value;
      const password = form.querySelector('[name="password"]').value;
      const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

      if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      try {
        const res = await fetch('https://pylord-api-bfsi.hf.space/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: name, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showNotification(data.detail || 'Signup failed', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
          return;
        }

        showNotification(data.message, 'success');
        // Switch to login tab after signup
        document.querySelector('.tabs-trigger[data-tab="login"]').click();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        form.reset();
      } catch (err) {
        showNotification('Server error. Try again later.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
}

function initForgotPassword() {
  const btn = document.getElementById('forgot-password-btn');
  const modal = document.getElementById('forgot-password-modal');
  const closeBtn = document.getElementById('close-forgot-password');
  const form = document.getElementById('forgot-password-form');

  if (btn) btn.addEventListener('click', () => openModal('#forgot-password-modal'));
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal('#forgot-password-modal'));

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]').value;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch('https://pylord-api-bfsi.hf.space/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (!res.ok) {
          showNotification(data.detail || 'Failed to send reset link', 'error');
        } else {
          showNotification(data.message || 'Password reset link sent!', 'success');
          closeModal('#forgot-password-modal');
          form.reset();
        }
      } catch (err) {
        showNotification('Server error. Try again later.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
      }
    });
  }
}

function initKYCUpload() {
  const uploadArea = document.getElementById('kyc-upload-area');
  const fileInput = document.getElementById('kyc-file-input');
  const content = document.getElementById('kyc-upload-content');
  
  if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        content.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto 0.5rem; color: #22c55e;">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
          </svg>
          <p style="font-weight: 500;">${file.name}</p>
        `;
      }
    });
  }
}
