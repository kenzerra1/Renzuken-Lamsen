import { supabase } from './supabase.js';

const NEU_DOMAIN = '@neu.edu.ph';

function switchTab(tab) {
  const loginPanel    = document.getElementById('loginPanel');
  const registerPanel = document.getElementById('registerPanel');
  const tabLogin      = document.getElementById('tabLogin');
  const tabRegister   = document.getElementById('tabRegister');

  if (tab === 'login') {
    loginPanel.classList.add('active');
    registerPanel.classList.remove('active');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    registerPanel.classList.add('active');
    loginPanel.classList.remove('active');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

function initToggle(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type     = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? 'Hide' : 'Show';
  });
}

function saveSession(user) {
  sessionStorage.setItem('neuSession', JSON.stringify({
    email: user.email,
    name:  user.name,
    role:  user.role,
  }));
}

function redirectByRole(role) {
  if (role === 'admin') {
    window.location.href = 'admindashboard.html';
  } else {
    window.location.href = 'checkin.html';
  }
}

function showLoginError(msg) {
  const box  = document.getElementById('loginError');
  const text = document.getElementById('loginErrorText');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
}

function clearLoginError() {
  document.getElementById('loginError')?.classList.remove('show');
}

function setLoginLoading(isLoading) {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;
  btn.disabled    = isLoading;
  btn.textContent = isLoading ? 'Signing in...' : 'Log In';
}

async function handleLogin() {
  clearLoginError();

  const email    = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;

  if (!email)                        { showLoginError('Email is required.'); return; }
  if (!email.endsWith(NEU_DOMAIN))   { showLoginError(`Only ${NEU_DOMAIN} emails are accepted.`); return; }
  if (!password)                     { showLoginError('Password is required.'); return; }

  setLoginLoading(true);

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .limit(1);

    if (error) throw error;

    if (!users || users.length === 0) {
      showLoginError('Incorrect email or password. Please try again.');
      setLoginLoading(false);
      return;
    }

    const user = users[0];

    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (blocked && blocked.length > 0) {
      showLoginError('Your account has been blocked. Please contact the library administrator.');
      setLoginLoading(false);
      return;
    }

    saveSession(user);
    redirectByRole(user.role);

  } catch (err) {
    console.error('Login error:', err);
    showLoginError('Something went wrong. Please try again.');
    setLoginLoading(false);
  }
}

function showRegisterError(msg) {
  const box  = document.getElementById('registerError');
  const text = document.getElementById('registerErrorText');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
  document.getElementById('registerSuccess')?.classList.remove('show');
}

function showRegisterSuccess(msg) {
  const box  = document.getElementById('registerSuccess');
  const text = document.getElementById('registerSuccessText');
  if (!box || !text) return;
  text.textContent = msg;
  box.classList.add('show');
  document.getElementById('registerError')?.classList.remove('show');
}

function clearRegisterMessages() {
  document.getElementById('registerError')?.classList.remove('show');
  document.getElementById('registerSuccess')?.classList.remove('show');
}

function setRegisterLoading(isLoading) {
  const btn = document.getElementById('registerBtn');
  if (!btn) return;
  btn.disabled    = isLoading;
  btn.textContent = isLoading ? 'Creating account...' : 'Create Account';
}

async function handleRegister() {
  clearRegisterMessages();

  const name            = document.getElementById('nameInput').value.trim();
  const email           = document.getElementById('regEmailInput').value.trim().toLowerCase();
  const password        = document.getElementById('regPasswordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;
  const college         = document.getElementById('collegeInput').value;
  const role            = document.querySelector('input[name="role"]:checked')?.value || 'Student';

  // Validate
  if (!name)                              { showRegisterError('Full name is required.'); return; }
  if (!email)                             { showRegisterError('Email is required.'); return; }
  if (!email.endsWith(NEU_DOMAIN))        { showRegisterError(`Only ${NEU_DOMAIN} emails are accepted.`); return; }
  if (!password)                          { showRegisterError('Password is required.'); return; }
  if (password.length < 6)               { showRegisterError('Password must be at least 6 characters.'); return; }
  if (password !== confirmPassword)       { showRegisterError('Passwords do not match.'); return; }
  if (!college)                           { showRegisterError('Please select your college.'); return; }

  setRegisterLoading(true);

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      showRegisterError('An account with this email already exists.');
      setRegisterLoading(false);
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert([{
        name:     name,
        email:    email,
        password: password,
        role:     'user',
        college:  college,
        type:     role,
      }]);

    if (error) throw error;

    showRegisterSuccess('Account created! Redirecting to login...');
    setRegisterLoading(false);

    setTimeout(() => switchTab('login'), 2000);

  } catch (err) {
    console.error('Register error:', err);
    showRegisterError('Something went wrong. Please try again.');
    setRegisterLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tabLogin')?.addEventListener('click',    () => switchTab('login'));
  document.getElementById('tabRegister')?.addEventListener('click', () => switchTab('register'));
  document.getElementById('goToRegister')?.addEventListener('click', () => switchTab('register'));
  document.getElementById('goToLogin')?.addEventListener('click',    () => switchTab('login'));

  initToggle('togglePwd',        'passwordInput');
  initToggle('toggleRegPwd',     'regPasswordInput');
  initToggle('toggleConfirmPwd', 'confirmPasswordInput');

  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('emailInput')?.addEventListener('keydown',    e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('passwordInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('emailInput')?.addEventListener('input', clearLoginError);
  document.getElementById('passwordInput')?.addEventListener('input', clearLoginError);

  document.getElementById('registerBtn')?.addEventListener('click', handleRegister);
  ['nameInput','regEmailInput','regPasswordInput','confirmPasswordInput','collegeInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', clearRegisterMessages);
  });
});
