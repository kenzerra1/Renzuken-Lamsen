import { supabase } from './supabase.js';

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

function displayUser(session) {
  const emailEl = document.getElementById('userEmailDisplay');
  if (emailEl) emailEl.textContent = session.email;
}

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem('neuLogs')) || [];
  } catch {
    return [];
  }
}

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

function showSuccessModal(session, purpose) {
  const modal = document.getElementById('successModal');
  const msg   = document.getElementById('successMessage');
  if (!modal || !msg) return;
  msg.textContent = `${session.name}, your check-in has been recorded. Purpose: ${purpose}.`;
  modal.style.display = 'flex';
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.style.display = 'none';
}

function resetForm() {
  document.getElementById('purposeSelect').value   = '';
  document.getElementById('employeeCheck').checked = false;
}

async function handleCheckin(session) {
  clearError();

  const purpose    = document.getElementById('purposeSelect').value;
  const isEmployee = document.getElementById('employeeCheck').checked;

  if (!purpose) { showError('Please select a purpose of visit.'); return; }

  try {
    const { error } = await supabase
      .from('visit_logs')
      .insert([{
        user_email: session.email,
        name:       session.name,
        purpose:    purpose,
        college:    session.college || 'Not specified',
        type:       isEmployee ? 'Employee' : 'Student',
      }]);

    if (error) throw error;

    resetForm();
    showSuccessModal(session, purpose);

  } catch (err) {
    console.error('Check-in error:', err);
    showError('Something went wrong. Please try again.');
  }
}

function handleLogout() {
  clearSession();
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const session = guardSession();
  if (!session) return;

  displayUser(session);

  document.getElementById('checkinBtn')?.addEventListener('click', () => handleCheckin(session));
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeSuccessModal);
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  document.getElementById('purposeSelect')?.addEventListener('change', clearError);
});
