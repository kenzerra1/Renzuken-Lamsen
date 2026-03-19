// ============================================================
// NEU Library — Login + Register JS (Supabase)
// ============================================================

import { supabase } from './supabase.js';

const NEU_DOMAIN = '@neu.edu.ph';

// ------------------------------------------------------------
// SESSION & REDIRECTS
// ------------------------------------------------------------

function saveSession(user) {
  // We check for 'role' (admin/user) and 'type' (Student/Employee)
  // This ensures the dashboard guard doesn't find an empty value.
  const userRole = user.role || 'user';
  
  sessionStorage.setItem('neuSession', JSON.stringify({
    email: user.email,
    name:  user.name,
    role:  userRole.toLowerCase(), 
    type:  user.type || 'Student'
  }));
}

function redirectByRole(role) {
  const cleanRole = role ? role.toLowerCase() : 'user';
  
  // Adjusted paths: assuming index.html is in root and dashboard is in /pages/
  if (cleanRole === 'admin') {
    window.location.href = './pages/admindashboard.html';
  } else {
    window.location.href = './pages/checkin.html';
  }
}

// ------------------------------------------------------------
// LOGIN HANDLER
// ------------------------------------------------------------

async function handleLogin(e) {
  // Prevents the form from reloading the page immediately
  if (e) e.preventDefault();
  
  clearLoginError();

  const email = document.getElementById('emailInput')?.value.trim().toLowerCase();
  const password = document.getElementById('passwordInput')?.value;

  if (!email) { showLoginError('Email is required.'); return; }
  if (!email.endsWith(NEU_DOMAIN)) { showLoginError(`Only ${NEU_DOMAIN} emails are accepted.`); return; }
  if (!password) { showLoginError('Password is required.'); return; }

  setLoginLoading(true);

  try {
    // 1. Fetch User
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Note: Use Supabase Auth for production encryption
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      showLoginError('Incorrect email or password.');
      setLoginLoading(false);
      return;
    }

    const user = users[0];

    // 2. Check Block Status
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (blocked && blocked.length > 0) {
      showLoginError('Your account is blocked. Contact the admin.');
      setLoginLoading(false);
      return;
    }

    // 3. Success
    saveSession(user);
    redirectByRole(user.role);

  } catch (err) {
    console.error('Login error:', err);
    showLoginError('Server connection failed.');
    setLoginLoading(false);
  }
}

// ------------------------------------------------------------
// REGISTER HANDLER
// ------------------------------------------------------------

async function handleRegister(e) {
  if (e) e.preventDefault();
  clearRegisterMessages();

  const name = document.getElementById('nameInput')?.value.trim();
  const email = document.getElementById('regEmailInput')?.value.trim().toLowerCase();
  const password = document.getElementById('regPasswordInput')?.value;
  const confirmPassword = document.getElementById('confirmPasswordInput')?.value;
  const college = document.getElementById('collegeInput')?.value;
  const roleType = document.querySelector('input[name="role"]:checked')?.value || 'Student';

  // Validation
  if (!name || !email || !password || !college) {
    showRegisterError('Please fill in all fields.');
    return;
  }
  if (password !== confirmPassword) {
    showRegisterError('Passwords do not match.');
    return;
  }

  setRegisterLoading(true);

  try {
    const { error } = await supabase
      .from('users')
      .insert([{
        name: name,
        email: email,
        password: password,
        role: 'user', // System access level
        type: roleType, // Student or Employee
        college: college
      }]);

    if (error) throw error;

    showRegisterSuccess('Account created! Switching to login...');
    setRegisterLoading(false);
    
    // Auto-switch to login tab after 2 seconds
    setTimeout(() => {
        const tabLogin = document.getElementById('tabLogin');
        if (tabLogin) tabLogin.click();
    }, 2000);

  } catch (err) {
    console.error('Register error:', err);
    showRegisterError('Registration failed. Email might already exist.');
    setRegisterLoading(false);
  }
}

// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Login Listeners
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);

  // Register Listeners
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) registerBtn.addEventListener('click', handleRegister);

  // Handle Enter Key for Login
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin(e);
    });
  }

  // --- Re-attach your UI helper functions here (switchTab, initToggle, etc.) ---
});
