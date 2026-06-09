// api.js — Central API helper for all backend calls
// Base URL: http://localhost:8080/api
const API_BASE = 'http://localhost:8080/api';

// ---- Get auth headers ----
function getHeaders() {
  return { 'Content-Type': 'application/json' };
}

// ---- Generic fetch wrapper ----
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(API_BASE + url, {
      headers: getHeaders(),
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    console.error('API Error:', url, err.message);
    throw err;
  }
}

//  AUTH APIs
const AuthAPI = {
  adminLogin: (username, password) =>
    apiFetch('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  studentLogin: (loginId, password) =>
    apiFetch('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' })
};

//  ADMIN — STUDENT APIs
const StudentAPI = {
  getAll: (status, wing) => {
    let q = '';
    if (status) q += `?status=${status}`;
    if (wing)   q += (q ? '&' : '?') + `wing=${wing}`;
    return apiFetch('/admin/students' + q);
  },

  getById: (id) => apiFetch(`/admin/students/${id}`),

  search: (query) => apiFetch(`/admin/students/search?q=${encodeURIComponent(query)}`),

  register: (data, wing, floor, manualRoom) => {
    let q = '';
    if (wing)       q += `?wing=${wing}`;
    if (floor)      q += (q ? '&' : '?') + `floor=${encodeURIComponent(floor)}`;
    if (manualRoom) q += (q ? '&' : '?') + `manualRoom=${manualRoom}`;
    return apiFetch('/admin/students/register' + q, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: (id, data) => apiFetch(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  setStatus: (id, status) => apiFetch(`/admin/students/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),

  checkout: (id) => apiFetch(`/admin/students/${id}/checkout`, { method: 'POST' }),

  addPayment: (id, amount) => apiFetch(`/admin/students/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),

  addFine: (id, reason, amount) => apiFetch(`/admin/students/${id}/fine`, {
    method: 'POST',
    body: JSON.stringify({ reason, amount })
  }),

  markFinePaid: (studentId, fineId) =>
    apiFetch(`/admin/students/${studentId}/fine/${fineId}/paid`, { method: 'PUT' }),

  issueAccessories: (id, items) => apiFetch(`/admin/students/${id}/accessories`, {
    method: 'POST',
    body: JSON.stringify({ items })
  }),

  resolveComplaint: (studentId, complaintId) =>
    apiFetch(`/admin/students/${studentId}/complaints/${complaintId}/resolve`, { method: 'PUT' }),

  getCheckoutRefund: (id) => apiFetch(`/admin/students/${id}/checkout-refund`),

  returnAccessory: (id, item) =>
    apiFetch(`/admin/students/${id}/accessories/${item}`, { method: 'DELETE' }),

  getDeposit: (id) => apiFetch(`/admin/students/${id}/deposit`),

  getFinesForStudent: (id) => apiFetch(`/admin/students/${id}/fines`),

  getComplaintsForStudent: (id) => apiFetch(`/admin/students/${id}/complaints`),

  // Student self-service
  getProfile: (id) => apiFetch(`/student/${id}/profile`),

  changePassword: (id, oldPassword, newPassword) =>
    apiFetch(`/student/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword })
    }),

  fileComplaint: (id, title, description) =>
    apiFetch(`/student/${id}/complaint`, {
      method: 'POST',
      body: JSON.stringify({ title, description })
    }),

  markNotifRead: (id, notifId) =>
    apiFetch(`/student/${id}/notifications/${notifId}/read`, { method: 'PUT' }),

  getFines: (id) => apiFetch(`/student/${id}/fines`)
};

//  ADMIN — ROOM APIs
const RoomAPI = {
  getAll:    ()     => apiFetch('/admin/rooms'),
  getVacant: ()     => apiFetch('/admin/rooms/vacant'),
  getStats:  ()     => apiFetch('/admin/rooms/stats'),
  getByWing: (wing) => apiFetch(`/admin/rooms/wing/${wing}`),
  getAllocationList: () => apiFetch('/admin/rooms/allocation-list'),

  allocate: (studentId, wing, floor, manualRoom) =>
    apiFetch('/admin/rooms/allocate', {
      method: 'POST',
      body: JSON.stringify({ studentId, wing, floor, manualRoom })
    }),

  shift: (studentId, newRoomId, reason) =>
    apiFetch('/admin/rooms/shift', {
      method: 'POST',
      body: JSON.stringify({ studentId, newRoomId, reason })
    }),

  setMaintenance: (roomId, maintenance) =>
    apiFetch(`/admin/rooms/${roomId}/maintenance`, {
      method: 'PUT',
      body: JSON.stringify({ maintenance })
    })
};

//  ADMIN — DEPOSITS & FEES APIs
const DepositAPI = {
  getAll: () => apiFetch('/admin/deposits'),
  getForStudent: (id) => apiFetch(`/admin/students/${id}/deposit`)
};

//  ADMIN — FINES APIs
const FineAPI = {
  getAll: () => apiFetch('/admin/fines'),
  getForStudent: (id) => apiFetch(`/admin/students/${id}/fines`)
};

//  ADMIN — COMPLAINTS APIs
const ComplaintAPI = {
  getAll: () => apiFetch('/admin/complaints'),
  getForStudent: (id) => apiFetch(`/admin/students/${id}/complaints`)
};

//  ADMIN — DASHBOARD
const DashboardAPI = {
  get: () => apiFetch('/admin/dashboard')
};

//  NOTIFICATIONS
const NotifAPI = {
  notifyAll:     (title, message, type) =>
    apiFetch('/admin/notifications/all', {
      method: 'POST', body: JSON.stringify({ title, message, type })
    }),

  notifyWing:    (wing, title, message, type) =>
    apiFetch(`/admin/notifications/wing/${wing}`, {
      method: 'POST', body: JSON.stringify({ title, message, type })
    }),

  notifyStudent: (id, title, message, type) =>
    apiFetch(`/admin/notifications/student/${id}`, {
      method: 'POST', body: JSON.stringify({ title, message, type })
    })
};

//  NOTICES
const NoticeAPI = {
  getAll: () => apiFetch('/notices'),
  getById: (id) => apiFetch(`/notices/${id}`),
  getByPriority: (priority) => apiFetch(`/notices/priority/${priority}`),
  create: (title, content, priority, author) =>
    apiFetch('/notices', {
      method: 'POST',
      body: JSON.stringify({ title, content, priority, author })
    }),
  update: (id, title, content, priority, author) =>
    apiFetch(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, priority, author })
    }),
  delete: (id) =>
    apiFetch(`/notices/${id}`, { method: 'DELETE' })
};

//  GATE PASS
const GatePassAPI = {
  apply: (studentId, data) => apiFetch(`/student/${studentId}/gatepass`, { method: 'POST', body: JSON.stringify(data) }),
  getForStudent: (studentId) => apiFetch(`/student/${studentId}/gatepass`),
  getAll: () => apiFetch('/admin/gatepass'),
  updateStatus: (id, status) => apiFetch(`/admin/gatepass/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
};

//  VISITORS
const VisitorAPI = {
  apply: (studentId, data) => apiFetch(`/student/${studentId}/visitors`, { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiFetch('/admin/visitors'),
  getForStudent: (studentId) => apiFetch(`/student/${studentId}/visitors`),
  updateStatus: (id, status) => apiFetch(`/admin/visitors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  checkout: (id) => apiFetch(`/admin/visitors/${id}/checkout`, { method: 'PUT' })
};

//  MESS MENU
const MessMenuAPI = {
  get: () => apiFetch('/mess-menu'),
  update: (day, data) => apiFetch(`/admin/mess-menu/${day}`, { method: 'PUT', body: JSON.stringify(data) })
};

//  EVENTS
const EventAPI = {
  getAll: () => apiFetch('/events'),
  create: (data) => apiFetch('/admin/events', { method: 'POST', body: JSON.stringify(data) }),
  register: (studentId, eventId) => apiFetch(`/student/${studentId}/events/${eventId}/register`, { method: 'POST' })
};

//  FEE REMINDERS
const FeeReminderAPI = {
  sendReminders: () => apiFetch('/admin/fee-reminders', { method: 'POST' })
};

//  UI Helpers used across pages
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
  t.innerHTML = `${icon} ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function showLoader(show = true) {
  let el = document.getElementById('global-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loader';
    el.style.cssText = `
      position:fixed;top:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,#0F1E3C,#E8A045);
      z-index:9999;animation:loaderAnim 1s infinite;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes loaderAnim{0%{width:0%}100%{width:100%}}';
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.display = show ? 'block' : 'none';
}

function statusBadge(s) {
  return s === 'active' ? 'badge-success' : s === 'blocked' ? 'badge-danger' : 'badge-warning';
}

function payStatusBadge(s) {
  return s === 'paid' ? 'badge-success' : s === 'partial' ? 'badge-warning' : 'badge-danger';
}

// Hostel constants (for frontend use)
const HOSTEL = {
  wings: ['A', 'B', 'C', 'D'],
  floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'],
  accessories: ['Bedsheet','Pillow','Cushion','Mattress','Bucket','Mug','Chair','Table','Cupboard/Locker','Study Lamp']
};