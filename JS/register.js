// ============================================================
// NEU Library — Register Page JS (Supabase)
// ============================================================

import { supabase } from './supabase.js';

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

const NEU_DOMAIN = '@neu.edu.ph';

function validateForm(name, email, password, confirmPassword, college) {
  if (!name.trim())                        return 'Full name is required.';
  if (!email)                              return 'Email is required.';
  if (!email.endsWith(NEU_DOMAIN))         return `Only ${NEU_DOMAIN} email addresses are accepted.`;
  if (!password)                           return 'Password is required.';
  if (password.length < 6)                 return 'Password must be at least 6 characters.';
  if (password !== confirmPassword)        return 'Passwords do not match.';
  if (!college)                            return 'Please select your college or department.';
  return null;
}

// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------

function showError(message) {
  const box  = document.getElementById('registerError');
  const text = document.getElementById('registerErrorText');
  if (!box || !text) return;
  text.textContent = message;
  box.classList.add('show');
  document.getElementById('registerSuccess').classList.remove('show');
}

function showSuccess(message) {
  const box  = document.getElementById('registerSuccess');
  const text = document.getElementById('registerSuccessText');
  if (!box || !text) return;
  text.textContent = message;
  box.classList.add('show');
  document.getElementById('registerError').classList.remove('show');
}

function clearMessages() {
  document.getElementById('registerError').classList.remove('show');
  document.getElementById('registerSuccess').classList.remove('show');
}

function setLoading(isLoading) {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;
  btn.disabled    = isLoading;
  btn.textContent = isLoading ? 'Creating account...' : 'Create Account';
}

// ------------------------------------------------------------
// CORE REGISTER HANDLER
// ------------------------------------------------------------

async function handleRegister() {
  clearMessages();

  const name            = document.getElementById('nameInput').value.trim();
  const email           = document.getElementById('emailInput').value.trim().toLowerCase();
  const password        = document.getElementById('passwordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;
  const college         = document.getElementById('collegeInput').value;
  const role            = document.querySelector('input[name="role"]:checked').value;

  // 1. Validate
  const err = validateForm(name, email, password, confirmPassword, college);
  if (err) { showError(err); return; }

  setLoading(true);

  try {
    // 2. Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      showError('An account with this email already exists.');
      setLoading(false);
      return;
    }

    // 3. Insert new user into Supabase
    const { error } = await supabase
      .from('users')
      .insert([{
        name:     name,
        email:    email,
        password: password,
        role:     'user',      // all self-registered users are regular users
        college:  college,
        type:     role,        // Student or Employee
      }]);

    if (error) throw error;

    // 4. Show success and redirect to login
    showSuccess('Account created successfully! Redirecting to login...');

    setTimeout(() => {
      window.location.href = '../pages/login.html';
    }, 2000);

  } catch (err) {
    console.error('Register error:', err);
    showError('Something went wrong. Please try again.');
    setLoading(false);
  }
}

// ------------------------------------------------------------
// PASSWORD TOGGLES
// ------------------------------------------------------------

function initPasswordToggles() {
  [['togglePwd', 'passwordInput'], ['toggleConfirmPwd', 'confirmPasswordInput']].forEach(([toggleId, inputId]) => {
    const toggle = document.getElementById(toggleId);
    const input  = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.addEventListener('click', () => {
      const isHidden   = input.type === 'password';
      input.type       = isHidden ? 'text' : 'password';
      toggle.className = isHidden
        ? 'far fa-eye-slash toggle-password'
        : 'far fa-eye toggle-password';
    });
  });
}

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();

  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }

  // Clear errors on input
  ['nameInput', 'emailInput', 'passwordInput', 'confirmPasswordInput', 'collegeInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', clearMessages);
  });
});