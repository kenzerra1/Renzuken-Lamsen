// ============================================================
// NEU Library — Check-In Page JS (Supabase)
// ============================================================

import { supabase } from './supabase.js';

// ------------------------------------------------------------
// SESSION
// ------------------------------------------------------------

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem('neuSession')) || null;
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem('neuSession');
}

function guardSession() {
  const session = getSession();
  if (!session) {
    window.location.replace('index.html');
    return null;
  }
  return session;
}

// ------------------------------------------------------------
// DISPLAY LOGGED-IN USER
// ------------------------------------------------------------

function displayUser(session) {
  const emailEl = document.getElementById('userEmailDisplay');
  if (emailEl) emailEl.textContent = session.email;
}

// ------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------

function validateForm(purpose, college) {
  if (!purpose) return 'Please select a purpose of visit.';
  if (!college) return 'Please select your department or college.';
  return null;
}

// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------

function showError(message) {
  const box  = document.getElementById('checkinError');
  const text = document.getElementById('checkinErrorText');
  if (!box || !text) return;
  text.textContent = message;
  box.classList.add('show');
}

function clearError() {
  const box = document.getElementById('checkinError');
  if (box) box.classList.remove('show');
}

function showSuccessModal(session, purpose, college) {
  const modal = document.getElementById('successModal');
  const msg   = document.getElementById('successMessage');
  if (!modal || !msg) return;
  msg.textContent = `${session.name}, your check-in has been recorded. Purpose: ${purpose} | College: ${college}.`;
  modal.style.display = 'flex';
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.style.display = 'none';
}

function resetForm() {
  document.getElementById('purposeSelect').value   = '';
  document.getElementById('collegeSelect').value   = '';
  document.getElementById('employeeCheck').checked = false;
}

// ------------------------------------------------------------
// CORE CHECK-IN HANDLER
// ------------------------------------------------------------

async function handleCheckin(session) {
  clearError();

  const purpose    = document.getElementById('purposeSelect').value;
  const college    = document.getElementById('collegeSelect').value;
  const isEmployee = document.getElementById('employeeCheck').checked;

  const err = validateForm(purpose, college);
  if (err) { showError(err); return; }

  try {
    // Save check-in record to Supabase
    const { error } = await supabase
      .from('visit_logs')
      .insert([{
        user_email: session.email,
        name:       session.name,
        purpose:    purpose,
        college:    college,
        type:       isEmployee ? 'Employee' : 'Student',
      }]);

    if (error) throw error;

    resetForm();
    showSuccessModal(session, purpose, college);

  } catch (err) {
    console.error('Check-in error:', err);
    showError('Something went wrong. Please try again.');
  }
}

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

function handleLogout() {
  clearSession();
  window.location.replace('index.html');
}

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  const session = guardSession();
  if (!session) return;

  displayUser(session);

  const checkinBtn = document.getElementById('checkinBtn');
  if (checkinBtn) checkinBtn.addEventListener('click', () => handleCheckin(session));

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeSuccessModal);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  ['purposeSelect', 'collegeSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', clearError);
  });
});
