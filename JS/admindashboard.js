import { supabase } from './supabase.js';

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem('neuSession')) || null;
  } catch {
    return null;
  }
}

function guardAdmin() {
  const session = getSession();
  if (!session) {
    window.location.replace('index.html');
    return null;
  }
  if (session.role !== 'admin') {
    window.location.replace('checkin.html');
    return null;
  }
  return session;
}

let purposeChart = null;
let typeChart    = null;
let collegeChart = null;

function getDateRange(filter) {
  const now   = new Date();
  const start = new Date();

  if (filter === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (filter === 'week') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (filter === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    return null;
  }

  return start.toISOString();
}

async function fetchLogs() {
  const dateFilter    = document.getElementById('filterDate').value;
  const purposeFilter = document.getElementById('filterPurpose').value;
  const collegeFilter = document.getElementById('filterCollege').value;
  const typeFilter    = document.getElementById('filterType').value;
  const search        = document.getElementById('searchInput').value.trim().toLowerCase();

  let query = supabase
    .from('visit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  const since = getDateRange(dateFilter);
  if (since)          query = query.gte('created_at', since);
  if (purposeFilter)  query = query.eq('purpose', purposeFilter);
  if (collegeFilter)  query = query.eq('college', collegeFilter);
  if (typeFilter)     query = query.eq('type', typeFilter);

  const { data: logs, error } = await query;

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  if (search) {
    return logs.filter(l =>
      l.name.toLowerCase().includes(search) ||
      l.user_email.toLowerCase().includes(search)
    );
  }

  return logs;
}

function updateStats(logs) {
  const total     = logs.length;
  const employees = logs.filter(l => l.type === 'Employee').length;
  const students  = logs.filter(l => l.type === 'Student').length;
  const empPct    = total ? Math.round((employees / total) * 100) : 0;
  const studPct   = total ? Math.round((students  / total) * 100) : 0;

  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statEmployees').textContent = employees;
  document.getElementById('statStudents').textContent  = students;
  document.getElementById('statEmpPct').textContent    = `${empPct}% of total visitors`;
  document.getElementById('statStudPct').textContent   = `${studPct}% of total visitors`;

  const labels = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' };
  document.getElementById('statPeriod').textContent =
    labels[document.getElementById('filterDate').value] || 'Filtered';
}

function updateCharts(logs) {

  const purposeMap = {};
  logs.forEach(l => { purposeMap[l.purpose] = (purposeMap[l.purpose] || 0) + 1; });
  const pLabels = Object.keys(purposeMap);
  const pData   = pLabels.map(k => purposeMap[k]);

  if (purposeChart) purposeChart.destroy();
  purposeChart = new Chart(('purposeChart'), {
    type: 'bar',
    data: {
      labels: pLabels.length ? pLabels : ['No data'],
      datasets: [{
        data: pData.length ? pData : [0],
        backgroundColor: '#2563eb',
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });

  const students  = logs.filter(l => l.type === 'Student').length;
  const employees = logs.filter(l => l.type === 'Employee').length;

  if (typeChart) typeChart.destroy();
  typeChart = new Chart(('typeChart'), {
    type: 'doughnut',
    data: {
      labels: ['Students', 'Employees'],
      datasets: [{
        data: [students, employees],
        backgroundColor: ['#2563eb', '#fbbf24'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { padding: 20, font: { size: 13 } } } },
      cutout: '60%'
    }
  });

  const collegeMap = {};
  logs.forEach(l => {
    const short = l.college.replace('College of ', '');
    collegeMap[short] = (collegeMap[short] || 0) + 1;
  });
  const cLabels = Object.keys(collegeMap);
  const cData   = cLabels.map(k => collegeMap[k]);

  if (collegeChart) collegeChart.destroy();
  collegeChart = new Chart(('collegeChart'), {
    type: 'bar',
    data: {
      labels: cLabels.length ? cLabels : ['No data'],
      datasets: [{
        data: cData.length ? cData : [0],
        backgroundColor: ['#1e3a8a', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        y: { grid: { display: false } }
      }
    }
  });
}

function updateTable(logs) {
  const tbody = ('visitorTableBody');
  ('tableCount').textContent =
    `Showing ${logs.length} visitor${logs.length !== 1 ? 's' : ''}`;

  if (!logs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:32px;color:#94a3b8;">
          <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
          No records found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const date     = new Date(l.created_at);
    const timeStr  = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
                     date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const typeBadge = l.type === 'Employee' ? 'badge-employee' : 'badge-student';

    return `
      <tr>
        <td>${escHtml(l.name)}</td>
        <td>${escHtml(l.user_email)}</td>
        <td><span class="badge badge-purpose">${escHtml(l.purpose)}</span></td>
        <td>${escHtml(l.college)}</td>
        <td><span class="badge ${typeBadge}">${escHtml(l.type)}</span></td>
        <td>${timeStr}</td>
      </tr>`;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function refreshDashboard() {
  const logs = await fetchLogs();
  updateStats(logs);
  updateCharts(logs);
  updateTable(logs);
}

async function loadUsers() {
  const search = ('userSearchInput').value.trim().toLowerCase();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .neq('role', 'admin');

  if (error) { console.error('Error fetching users:', error); return; }

  const { data: blockedRows } = await supabase
    .from('blocked_users')
    .select('email');

  const blockedEmails = (blockedRows || []).map(r => r.email);

  const filtered = search
    ? users.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    : users;

  renderUserList(filtered, blockedEmails);
}

function renderUserList(users, blockedEmails) {
  const list = ('userList');

  if (!users.length) {
    list.innerHTML = `<p style="text-align:center;padding:32px;color:#94a3b8;">No users found.</p>`;
    return;
  }

  list.innerHTML = users.map(u => {
    const isBlocked = blockedEmails.includes(u.email);
    const initials  = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return `
      <div class="user-row">
        <div class="user-row-left">
          <div class="user-avatar">${initials}</div>
          <div>
            <div class="user-name">${escHtml(u.name)}</div>
            <div class="user-email">${escHtml(u.email)}</div>
          </div>
        </div>
        <div class="user-row-right">
          <span class="badge ${isBlocked ? 'badge-employee' : 'badge-student'}">
            ${isBlocked ? 'Blocked' : 'Active'}
          </span>
          <button class="btn-block" onclick="toggleBlock('${u.email}', ${isBlocked})">
            <i class="fas ${isBlocked ? 'fa-unlock' : 'fa-ban'}"></i>
            ${isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>`;
  }).join('');
}

window.toggleBlock = async function(email, isCurrentlyBlocked) {
  if (isCurrentlyBlocked) {
    await supabase.from('blocked_users').delete().eq('email', email);
  } else {
    await supabase.from('blocked_users').insert([{ email }]);
  }
  loadUsers();
};

function switchTab(tab) {
  const analyticsTab = ('analyticsTab');
  const usersTab     = ('usersTab');
  const tabAnalytics = ('tabAnalytics');
  const tabUsers     = document.getElementById('tabUsers');

  if (tab === 'analytics') {
    analyticsTab.style.display = 'block';
    usersTab.style.display     = 'none';
    tabAnalytics.classList.add('active');
    tabUsers.classList.remove('active');
    refreshDashboard();
  } else {
    analyticsTab.style.display = 'none';
    usersTab.style.display     = 'block';
    tabAnalytics.classList.remove('active');
    tabUsers.classList.add('active');
    loadUsers();
  }
}

function handleLogout() {
  sessionStorage.removeItem('neuSession');
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const session = guardAdmin();
  if (!session) return;

  document.getElementById('adminEmailDisplay').textContent = session.email;
  document.getElementById('adminGreeting').textContent = `Hello, ${session.name}!`;
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('tabAnalytics').addEventListener('click', () => switchTab('analytics'));
  document.getElementById('tabUsers').addEventListener('click',     () => switchTab('users'));

  ['filterDate', 'filterPurpose', 'filterCollege', 'filterType'].forEach(id => {
    document.getElementById(id).addEventListener('change', refreshDashboard);
  });

  document.getElementById('searchInput').addEventListener('input', refreshDashboard);
  document.getElementById('userSearchInput').addEventListener('input', loadUsers);

  refreshDashboard();
});
