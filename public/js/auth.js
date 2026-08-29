const AUTH_KEY = 'debt_manager_auth';

function getAuth() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

async function authApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  let response;
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    throw new Error('Cannot reach the server. Is it running? Check the console for details.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('Server returned invalid data. Please try again.');
  }

  if (!response.ok) {
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  return data;
}

async function login(username, password) {
  const data = await authApi('/api/login', { method: 'POST', body: { email: username, password } });
  saveAuth(data);
  return { success: true, user: data.user };
}

async function signup(email, password) {
  const data = await authApi('/api/signup', { method: 'POST', body: { email, password } });
  saveAuth(data);
  return { success: true, user: data.user };
}

function setFormPending(form, pending) {
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = pending;
}

// Auth page logic
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initializePreferences === 'function') {
    initializePreferences();
  }

  // Already signed in? Go straight to the app.
  if (getAuth() && getAuth().token) {
    window.location.href = 'index.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupBtn = document.getElementById('showSignup');
  const showLoginBtn = document.getElementById('showLogin');
  const loginView = document.getElementById('loginView');
  const signupView = document.getElementById('signupView');

  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => {
      loginView.hidden = true;
      signupView.hidden = false;
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      signupView.hidden = true;
      loginView.hidden = false;
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!loginForm.reportValidity()) return;

      const username = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      setFormPending(loginForm, true);
      try {
        const result = await login(username, password);
        if (result.success) {
          window.location.href = 'index.html';
        }
      } catch (error) {
        alert(error.message);
      } finally {
        setFormPending(loginForm, false);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!signupForm.reportValidity()) return;

      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupPasswordConfirm').value;

      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }

      setFormPending(signupForm, true);
      try {
        const result = await signup(email, password);
        if (result.success) {
          window.location.href = 'index.html';
        }
      } catch (error) {
        alert(error.message);
      } finally {
        setFormPending(signupForm, false);
      }
    });
  }
});
