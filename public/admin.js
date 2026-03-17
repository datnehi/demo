const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const stats = document.getElementById('stats');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminUser = document.getElementById('adminUser');

let allRows = [];

function toLocalTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('vi-VN');
}

function renderRows(rows) {
  tableBody.innerHTML = '';

  if (!rows.length) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  for (const item of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.id ?? '-'}</td>
      <td>${toLocalTime(item.createdAt)}</td>
      <td>${item.parent?.parentName ?? '-'} (${item.parent?.relation ?? '-'})</td>
      <td>${item.parent?.phone ?? '-'}</td>
      <td>${item.child?.childName ?? '-'}</td>
      <td>${item.child?.age ?? '-'}</td>
      <td>${item.child?.gender ?? '-'}</td>
      <td>${item.child?.heightCm ?? '-'}</td>
      <td>${item.child?.weightKg ?? '-'}</td>
      <td>${item.bmi ?? '-'}</td>
    `;
    tableBody.appendChild(tr);
  }

  stats.textContent = `${rows.length} bản ghi`;
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderRows(allRows);
    return;
  }

  const filtered = allRows.filter((item) => {
    const haystack = [
      item.parent?.parentName,
      item.parent?.phone,
      item.parent?.email,
      item.child?.childName,
      item.child?.gender
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  renderRows(filtered);
}

async function loadSubmissions() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Đang tải...';

  try {
    const response = await fetch('/api/submissions');
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Không tải được dữ liệu.');
    }

    allRows = Array.isArray(result.data) ? result.data : [];
    applyFilter();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      window.location.href = '/login';
      return;
    }
    alert(error.message);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Tải lại';
  }
}

async function ensureAdminSession() {
  const response = await fetch('/api/admin/me');
  if (response.status === 401) {
    window.location.href = '/login';
    return false;
  }

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || 'Không xác thực được admin.');
  }

  adminUser.textContent = `Xin chào, ${result.data.username}`;
  adminUser.hidden = false;
  return true;
}

async function logoutAdmin() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } finally {
    window.location.href = '/login';
  }
}

async function initAdminPage() {
  const ok = await ensureAdminSession();
  if (!ok) {
    return;
  }
  await loadSubmissions();
}

searchInput.addEventListener('input', applyFilter);
refreshBtn.addEventListener('click', loadSubmissions);
logoutBtn.addEventListener('click', logoutAdmin);

initAdminPage();
