// admin.js — Admin Dashboard (fully connected to MongoDB API)

let currentAdmin = null;
let currentWing = 'A';
let allStudentsCache = [];
let allRoomsCache = [];

// ---- Auth guard ----
window.onload = async function () {
  const user = JSON.parse(sessionStorage.getItem('kbh_user') || 'null');
  if (!user || user.role !== 'admin') { window.location.href = '../index.html'; return; }
  currentAdmin = user;

  // Set topbar
  document.getElementById('admin-name').textContent = user.name;
  document.getElementById('admin-role').textContent = user.adminRole || 'Admin';
  document.getElementById('admin-dd-name').textContent = user.name;
  document.getElementById('admin-dd-role').textContent = user.adminRole || 'Admin';
  document.getElementById('admin-avatar').textContent = user.name.charAt(0);

  // Welcome date
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('wb-greeting').textContent = `${greeting}, ${user.name.split(' ')[0]}!`;
  document.getElementById('wb-date').textContent = now.getDate();
  document.getElementById('wb-day').textContent = now.toLocaleDateString('en-IN', { weekday:'long', month:'long', year:'numeric' });

  setDefaultDates();
  await renderDashboard();
};

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  ['r-admdate','r-checkin','dm-date','fm-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
}

//  SECTION ROUTING
const sectionTitles = {
  dashboard:     ['Dashboard', 'Overview of hostel operations'],
  students:      ['All Students', 'Manage student records'],
  register:      ['Register Student', 'Add a new student with smart room allocation'],
  rooms:         ['Room Allocation', 'Allocate and manage room assignments'],
  roomview:      ['Room Map', 'Visual map of all rooms wing & floor wise'],
  deposits:      ['Deposits & Payments', 'Track fees, deposits and payments'],
  fines:         ['Fine Management', 'Manage student fines and penalties'],
  accessories:   ['Accessories / Inventory', 'Issue and track hostel items'],
  complaints:    ['Complaints', 'View and resolve maintenance requests'],
  notices:       ['Notice Board', 'Post and manage hostel notices'],
  notifications: ['Send Notifications', 'Send alerts to students'],
  gatepass:      ['Gate Pass Approvals', 'Review and approve student leaves'],
  visitors:      ['Visitor Logs', 'Track and manage guest visits'],
  mess:          ['Mess Menu', 'Update and manage the hostel mess menu'],
  events:        ['Hostel Events', 'Create and manage upcoming activities']
};

async function showSection(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('sec-' + name);
  if (sec) sec.classList.add('active');
  const [title, sub] = sectionTitles[name] || [name, ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = sub;
  closeDrops();

  if (name === 'dashboard')     await renderDashboard();
  if (name === 'students')      await renderAllStudents();
  if (name === 'rooms')         { await renderAllocationList(); await populateDropdowns(); }
  if (name === 'roomview')      await renderRoomMap('A');
  if (name === 'deposits')      await renderDeposits();
  if (name === 'fines')         await renderFines();
  if (name === 'accessories')   await renderAccessories();
  if (name === 'complaints')    await renderComplaints();
  if (name === 'notices')       await renderNotices();
  if (name === 'notifications') await populateDropdowns();
  if (name === 'register')      await prefillNextId();
  if (name === 'gatepass')      await renderGatePasses();
  if (name === 'visitors')      await renderVisitors();
  if (name === 'mess')          await renderMessMenu();
  if (name === 'events')        await renderEvents();
}

//  DASHBOARD
async function renderDashboard() {
  showLoader(true);
  try {
    const [dash, rooms] = await Promise.all([DashboardAPI.get(), RoomAPI.getStats()]);
    const stats = dash.studentStats;
    const roomStats = dash.roomStats;
    allStudentsCache = dash.recentStudents || [];

    document.getElementById('stats-grid').innerHTML = [
      { label:'Total Rooms',     value: roomStats.total,          icon:'🏠', bg:'#EFF6FF' },
      { label:'Occupied',        value: roomStats.occupied,       icon:'🔴', bg:'#FEE2E2' },
      { label:'Vacant',          value: roomStats.vacant,         icon:'🟢', bg:'#D1FAE5' },
      { label:'Active Students', value: stats.activeStudents,     icon:'👥', bg:'#DBEAFE' },
      { label:'Pending Dues',    value:'₹'+(stats.totalPendingFees||0).toLocaleString(), icon:'💰', bg:'#FEF3C7' },
      { label:'Open Complaints', value: stats.openComplaints,     icon:'🔧', bg:'#F3E8FF' },
    ].map(s => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${s.bg}">${s.icon}</div>
        <div class="stat-info"><p>${s.label}</p><h3>${s.value}</h3></div>
      </div>
    `).join('');

    // Wing occupancy bars
    const byWing = roomStats.byWing || {};
    document.getElementById('wing-occupancy').innerHTML = Object.entries(byWing).map(([wing, d]) => {
      const pct = d.total ? Math.round(d.occupied / d.total * 100) : 0;
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:0.83rem">
            <span style="font-weight:600;color:var(--navy)">${wing} Wing</span>
            <span style="color:var(--muted)">${d.occupied}/${d.total} (${pct}%)</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');

    // Recent students
    document.getElementById('recent-students-body').innerHTML = allStudentsCache.map(s => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div class="student-avatar">${s.name.charAt(0)}</div>
          <div><div style="font-weight:600;font-size:0.83rem">${s.name}</div>
          <div style="font-size:0.72rem;color:var(--muted)">${s.id}</div></div>
        </div></td>
        <td><span class="badge badge-navy">${s.roomNo || '-'}</span></td>
        <td><span class="badge ${statusBadge(s.status)}">${s.status}</span></td>
      </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">No students yet</td></tr>';

  } catch (err) {
    showToast('Failed to load dashboard. Is backend running?', 'error');
  } finally {
    showLoader(false);
  }
}

//  STUDENTS
async function renderAllStudents(filter = '', statusFilter = '') {
  showLoader(true);
  try {
    const sf = statusFilter || document.getElementById('stu-filter-status')?.value || '';
    const students = await StudentAPI.getAll(sf || null, null);
    allStudentsCache = students;

    const f = filter.toLowerCase();
    const filtered = f ? students.filter(s =>
      s.name.toLowerCase().includes(f) || s.id.includes(f) ||
      (s.roomNo||'').includes(f) || s.regNo.toLowerCase().includes(f)
    ) : students;

    document.getElementById('all-students-body').innerHTML = filtered.length ?
      filtered.map(s => `
        <tr>
          <td style="font-weight:600;font-size:0.82rem">${s.id}</td>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div class="student-avatar" style="width:28px;height:28px;font-size:0.72rem">${s.name.charAt(0)}</div>
            ${s.name}</div></td>
          <td style="font-size:0.8rem">${s.course} - ${s.branch}<br><span style="color:var(--muted)">${s.year}</span></td>
          <td><span class="badge badge-navy">${s.roomNo || '-'}</span></td>
          <td>${s.wing || '-'}</td>
          <td>
            <span style="color:var(--success);font-size:0.8rem">₹${(s.deposit?.paid||0).toLocaleString()}</span>
            ${s.deposit?.pending > 0 ? `<br><span style="color:var(--danger);font-size:0.78rem">Due: ₹${s.deposit.pending.toLocaleString()}</span>` : ''}
          </td>
          <td><span class="badge ${statusBadge(s.status)}">${s.status}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-outline btn-xs" onclick="viewStudent('${s.id}')">👁 View</button>
              <button class="btn btn-danger btn-xs" onclick="checkoutStudent('${s.id}','${s.name}')">🚪 Checkout</button>
              <button class="btn btn-outline btn-xs" onclick="blockStudent('${s.id}','${s.status}')">🚫 ${s.status==='blocked'?'Unblock':'Block'}</button>
            </div>
          </td>
        </tr>`).join('') :
      '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:40px">No students found</td></tr>';
  } catch (err) {
    showToast('Failed to load students.', 'error');
  } finally {
    showLoader(false);
  }
}

async function filterStudents(val) {
  const sf = document.getElementById('stu-filter-status')?.value || '';
  await renderAllStudents(val || document.getElementById('stu-search')?.value || '', sf);
}

async function globalSearch(val) {
  if (val.length > 1) {
    await showSection('students');
    await renderAllStudents(val);
  }
}

async function viewStudent(id) {
  showLoader(true);
  try {
    const s = await StudentAPI.getById(id);
    document.getElementById('view-student-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div class="profile-avatar" style="width:56px;height:56px;font-size:1.4rem">${s.name.charAt(0)}</div>
            <div>
              <h3 style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--navy)">${s.name}</h3>
              <p style="color:var(--muted);font-size:0.8rem">${s.id} · ${s.regNo}</p>
            </div>
          </div>
          ${infoRow('Course', `${s.course} - ${s.branch} (${s.year})`)}
          ${infoRow('Mobile', s.mobile)}
          ${infoRow('Room', `${s.roomNo||'None'} · ${s.wing||''} Wing · ${s.floor||''}`)}
          ${infoRow('Aadhaar', s.aadhaar||'-')}
          ${infoRow('Address', s.address||'-')}
          ${infoRow('Check-in', s.checkinDate||'-')}
        </div>
        <div>
          ${infoRow('Parent', `${s.parentName} (${s.parentMobile})`)}
          ${infoRow('Emergency', s.emergencyContact||'-')}
          ${infoRow('Status', `<span class="badge ${statusBadge(s.status)}">${s.status}</span>`)}
          <div style="margin-top:12px;background:var(--bg);border-radius:10px;padding:12px;font-size:0.83rem">
            <b>Deposit:</b> Total ₹${(s.deposit?.total||0).toLocaleString()} |
            Paid ₹${(s.deposit?.paid||0).toLocaleString()} |
            <span style="color:var(--danger)">Due ₹${(s.deposit?.pending||0).toLocaleString()}</span>
          </div>
          <div style="margin-top:12px">
            <b style="font-size:0.82rem">Accessories:</b><br>
            ${(s.accessories||[]).map(a=>`<span class="badge badge-navy" style="margin:2px">${a}</span>`).join('')||'None'}
          </div>
          <div style="margin-top:12px;background:var(--bg);border-radius:10px;padding:12px;font-size:0.82rem">
            <b>Login ID:</b> <code>${s.loginId}</code>
          </div>
        </div>
      </div>
      ${(s.fines||[]).length ? `
        <div style="margin-top:8px">
          <b style="font-size:0.82rem">Fines:</b>
          ${s.fines.map(f=>`<div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg);border-radius:8px;margin-top:4px;font-size:0.8rem">
            <span>${f.reason}</span>
            <span style="color:var(--danger)">₹${f.amount} <span class="badge ${f.status==='paid'?'badge-success':'badge-danger'}">${f.status}</span></span>
          </div>`).join('')}
        </div>` : ''}
    `;
    openModal('view-student-modal');
  } catch (err) {
    showToast('Failed to load student details.', 'error');
  } finally {
    showLoader(false);
  }
}

function infoRow(label, value) {
  return `<div style="font-size:0.82rem;margin-bottom:6px;color:#4B5563"><b style="color:var(--navy)">${label}:</b> ${value}</div>`;
}

async function checkoutStudent(id, name) {
  if (!confirm(`Checkout ${name}? This will vacate their room.`)) return;
  showLoader(true);
  try {
    const result = await StudentAPI.checkout(id);
    if (result.success) {
      showToast(`${name} checked out successfully. Refund: ₹${result.data?.refundableAmount || 0}`, 'success');
    } else {
      showToast(result.message || 'Checkout failed.', 'error');
      return;
    }
    await renderAllStudents();
  } catch (err) {
    const errMsg = err.message || 'Checkout failed.';
    if (errMsg.includes('pending fines')) {
      showToast('Cannot checkout: Student has pending fines. Clear all fines first.', 'error');
    } else {
      showToast(errMsg, 'error');
    }
  } finally {
    showLoader(false);
  }
}

async function blockStudent(id, currentStatus) {
  const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
  if (!confirm(`${newStatus === 'blocked' ? 'Block' : 'Unblock'} this student?`)) return;
  showLoader(true);
  try {
    await StudentAPI.setStatus(id, newStatus);
    showToast(`Student ${newStatus}.`, newStatus === 'blocked' ? 'warning' : 'success');
    await renderAllStudents();
  } catch (err) {
    showToast('Failed to update status.', 'error');
  } finally {
    showLoader(false);
  }
}

//  REGISTER STUDENT
async function prefillNextId() {
  try {
    const students = await StudentAPI.getAll();
    const ids = students.map(s => parseInt(s.id.replace('KBH','')));
    const max = ids.length ? Math.max(...ids) : 20240000;
    document.getElementById('r-loginid').value = 'KBH' + (max + 1);
  } catch { document.getElementById('r-loginid').value = 'Auto-generated'; }
}

async function registerStudent(e) {
  e.preventDefault();
  const wing      = document.getElementById('r-wing').value;
  const floor     = document.getElementById('r-floor').value;
  const manual    = document.getElementById('r-manual-room').value.trim().toUpperCase();

  const payload = {
    name:             document.getElementById('r-name').value,
    regNo:            document.getElementById('r-regno').value,
    course:           document.getElementById('r-course').value,
    branch:           document.getElementById('r-branch').value,
    year:             document.getElementById('r-year').value,
    mobile:           document.getElementById('r-mobile').value,
    parentName:       document.getElementById('r-parent').value,
    parentMobile:     document.getElementById('r-pmobile').value,
    emergencyContact: document.getElementById('r-emergency').value,
    address:          document.getElementById('r-address').value,
    aadhaar:          document.getElementById('r-aadhaar').value,
    admissionDate:    document.getElementById('r-admdate').value,
    checkinDate:      document.getElementById('r-checkin').value,
    password:         document.getElementById('r-password').value,
    depositTotal:     parseFloat(document.getElementById('r-deposit').value) || 15000,
    depositPaid:      parseFloat(document.getElementById('r-paid').value) || 0,
  };

  showLoader(true);
  try {
    const res = await StudentAPI.register(payload, wing||null, floor||null, manual||null);
    showRegAlert('success', `✅ Registered! ID: ${res.student.id} | Room: ${res.allocatedRoom.id}`);
    await prefillNextId();
    await renderDashboard();
  } catch (err) {
    showRegAlert('danger', '❌ ' + (err.message || 'Registration failed.'));
  } finally {
    showLoader(false);
  }
}

function showRegAlert(type, msg) {
  document.getElementById('register-alert').innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function clearRegForm() {
  document.getElementById('register-form').reset();
  document.getElementById('register-alert').innerHTML = '';
  prefillNextId();
}

//  ROOM ALLOCATION
async function populateDropdowns() {
  try {
    const students = await StudentAPI.getAll('active');
    const unallocated = students.filter(s => !s.roomNo);

    ['alloc-student','shift-student','dm-student','fm-student','am-student','notif-student-sel'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const list = (id === 'alloc-student') ? unallocated : students;
      el.innerHTML = '<option value="">-- Select Student --</option>' +
        list.map(s => `<option value="${s.id}">${s.name} (${s.id}) - ${s.roomNo || 'No Room'}</option>`).join('');
    });
  } catch (err) { console.error('Dropdown populate failed', err); }
}

async function previewVacant() {
  const wing  = document.getElementById('alloc-wing').value;
  const floor = document.getElementById('alloc-floor').value;
  const el    = document.getElementById('alloc-preview');
  try {
    const vacant = await RoomAPI.getVacant();
    const match = vacant.find(r =>
      (!wing  || r.wing === wing) &&
      (!floor || r.floor === floor)
    ) || vacant[0];

    if (match) {
      el.className = 'alert alert-success';
      el.textContent = `🎯 Smart suggestion: Room ${match.id} (${match.wing} Wing, ${match.floor})`;
    } else {
      el.className = 'alert alert-danger';
      el.textContent = '❌ No vacant rooms with selected preferences.';
    }
  } catch { el.textContent = 'Preview unavailable.'; }
}

async function doAllocate() {
  const stuId  = document.getElementById('alloc-student').value;
  const wing   = document.getElementById('alloc-wing').value;
  const floor  = document.getElementById('alloc-floor').value;
  const manual = document.getElementById('alloc-manual').value.trim().toUpperCase();

  if (!stuId) { showToast('Select a student first.', 'error'); return; }
  showLoader(true);
  try {
    const res = await RoomAPI.allocate(stuId, wing||null, floor||null, manual||null);
    showToast(`Room ${res.room.id} allocated!`, 'success');
    await renderAllocationList();
    await populateDropdowns();
    await previewVacant();
  } catch (err) {
    showToast(err.message || 'Allocation failed.', 'error');
  } finally {
    showLoader(false);
  }
}

async function doShift() {
  const stuId   = document.getElementById('shift-student').value;
  const newRoom = document.getElementById('shift-room').value.trim().toUpperCase();
  const reason  = document.getElementById('shift-reason').value;
  if (!stuId || !newRoom) { showToast('Fill all fields.', 'error'); return; }
  showLoader(true);
  try {
    const res = await RoomAPI.shift(stuId, newRoom, reason);
    showToast(`Shifted to room ${res.newRoom.id}!`, 'success');
    await renderAllocationList();
  } catch (err) {
    showToast(err.message || 'Shift failed.', 'error');
  } finally {
    showLoader(false);
  }
}

async function renderAllocationList() {
  showLoader(true);
  try {
    const rooms = await RoomAPI.getAll();
    const occupied = rooms.filter(r => r.status === 'occupied');
    const students = await StudentAPI.getAll();
    const stuMap = {};
    students.forEach(s => { stuMap[s.id] = s; });

    document.getElementById('allocation-list').innerHTML = occupied.length ?
      occupied.map(r => {
        const s = r.studentId ? stuMap[r.studentId] : null;
        return `<tr>
          <td><span class="badge badge-navy">${r.id}</span></td>
          <td>${r.wing}</td><td>${r.floor}</td>
          <td>${s ? s.name : '-'}</td>
          <td><span class="badge badge-success">Occupied</span></td>
          <td><button class="btn btn-danger btn-xs" onclick="vacateRoomUI('${r.studentId}')">Vacate</button></td>
        </tr>`;
      }).join('') :
      '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No allocations yet</td></tr>';
  } catch (err) {
    showToast('Failed to load allocations.', 'error');
  } finally {
    showLoader(false);
  }
}

async function vacateRoomUI(stuId) {
  if (!stuId || !confirm('Vacate this room?')) return;
  showLoader(true);
  try {
    await StudentAPI.checkout(stuId);
    showToast('Room vacated.', 'success');
    await renderAllocationList();
  } catch (err) {
    showToast(err.message || 'Failed to vacate.', 'error');
  } finally {
    showLoader(false);
  }
}

//  ROOM MAP
async function renderRoomMap(wing) {
  currentWing = wing;
  document.querySelectorAll('.wing-tab').forEach(b => b.classList.remove('active'));
  const tab = [...document.querySelectorAll('.wing-tab')].find(b => b.textContent.trim().startsWith(wing));
  if (tab) tab.classList.add('active');

  showLoader(true);
  try {
    const [rooms, students] = await Promise.all([RoomAPI.getByWing(wing), StudentAPI.getAll()]);
    const stuMap = {};
    students.forEach(s => { stuMap[s.id] = s; });

    const floors = ['Ground Floor','1st Floor','2nd Floor','3rd Floor'];
    const html = floors.map(floor => {
      const floorRooms = rooms.filter(r => r.floor === floor);
      if (!floorRooms.length) return '';
      floorRooms.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return `
        <div class="floor-section">
          <div class="floor-label">${floor}</div>
          <div class="room-grid">
            ${floorRooms.map(r => {
              const stu = r.studentId ? stuMap[r.studentId] : null;
              const tip = r.id + (stu ? ' — ' + stu.name : ' (Vacant)');
              return `<div class="room-cell ${r.status}" title="${tip}" onclick="showRoomInfo('${r.id}','${r.status}','${stu?stu.name:''}','${stu?stu.id:''}')">${r.id.split('-')[1]}</div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    document.getElementById('room-map-content').innerHTML = html || '<p style="padding:20px;color:var(--muted)">No rooms found.</p>';
  } catch (err) {
    showToast('Failed to load room map.', 'error');
  } finally {
    showLoader(false);
  }
}

function selectWing(wing, el) {
  renderRoomMap(wing);
}

function showRoomInfo(roomId, status, stuName, stuId) {
  const msg = `Room: ${roomId}\nStatus: ${status}\n${stuName ? 'Student: '+stuName+'\nID: '+stuId : 'Vacant'}`;
  alert(msg);
}

//  DEPOSITS
async function renderDeposits() {
  showLoader(true);
  try {
    const students = await StudentAPI.getAll();
    document.getElementById('deposit-list').innerHTML = students.map(s => `
      <tr>
        <td style="font-weight:600;font-size:0.82rem">${s.id}</td>
        <td>${s.name}</td>
        <td><span class="badge badge-navy">${s.roomNo||'-'}</span></td>
        <td>₹${(s.deposit?.total||0).toLocaleString()}</td>
        <td style="color:var(--success);font-weight:600">₹${(s.deposit?.paid||0).toLocaleString()}</td>
        <td style="color:${(s.deposit?.pending||0)>0?'var(--danger)':'var(--muted)'};font-weight:600">₹${(s.deposit?.pending||0).toLocaleString()}</td>
        <td><span class="badge ${payStatusBadge(s.deposit?.paymentStatus)}">${s.deposit?.paymentStatus||'pending'}</span></td>
        <td><button class="btn btn-gold btn-xs" onclick="openDepositModal('${s.id}')">+ Pay</button></td>
      </tr>`).join('');
  } catch (err) {
    showToast('Failed to load deposits.', 'error');
  } finally {
    showLoader(false);
  }
}

function openDepositModal(stuId) {
  populateDropdowns();
  if (stuId) setTimeout(() => { document.getElementById('dm-student').value = stuId; }, 200);
  openModal('deposit-modal');
}

async function submitPayment() {
  const stuId  = document.getElementById('dm-student').value;
  const amount = parseFloat(document.getElementById('dm-amount').value);
  if (!stuId || !amount) { showToast('Fill all fields.', 'error'); return; }
  showLoader(true);
  try {
    const s = await StudentAPI.addPayment(stuId, amount);
    closeModal('deposit-modal');
    showToast(`₹${amount} payment recorded for ${s.name}.`, 'success');
    await renderDeposits();
  } catch (err) {
    showToast(err.message || 'Payment failed.', 'error');
  } finally {
    showLoader(false);
  }
}

//  FINES
async function renderFines() {
  showLoader(true);
  try {
    const students = await StudentAPI.getAll();
    const rows = [];
    students.forEach(s => {
      (s.fines||[]).forEach(f => {
        rows.push(`<tr>
          <td>${s.name}<br><span style="font-size:0.72rem;color:var(--muted)">${s.id}</span></td>
          <td><span class="badge badge-navy">${s.roomNo||'-'}</span></td>
          <td>${f.reason}</td>
          <td style="color:var(--danger);font-weight:600">₹${f.amount}</td>
          <td style="font-size:0.8rem">${f.date||'-'}</td>
          <td><span class="badge ${f.status==='paid'?'badge-success':'badge-danger'}">${f.status}</span></td>
          <td><button class="btn btn-success btn-xs" onclick="markFinePaid('${s.id}','${f.id}')">Mark Paid</button></td>
        </tr>`);
      });
    });
    document.getElementById('fines-list').innerHTML = rows.join('') ||
      '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No fines recorded</td></tr>';
  } catch (err) {
    showToast('Failed to load fines.', 'error');
  } finally {
    showLoader(false);
  }
}

function openFineModal(stuId) {
  populateDropdowns();
  if (stuId) setTimeout(() => { document.getElementById('fm-student').value = stuId; }, 200);
  openModal('fine-modal');
}

async function submitFine() {
  const stuId  = document.getElementById('fm-student').value;
  const reason = document.getElementById('fm-reason').value;
  const amount = parseFloat(document.getElementById('fm-amount').value);
  if (!stuId || !reason || !amount) { showToast('Fill all fields.', 'error'); return; }
  showLoader(true);
  try {
    await StudentAPI.addFine(stuId, reason, amount);
    closeModal('fine-modal');
    showToast('Fine added.', 'warning');
    await renderFines();
  } catch (err) {
    showToast(err.message || 'Failed to add fine.', 'error');
  } finally {
    showLoader(false);
  }
}

async function markFinePaid(stuId, fineId) {
  showLoader(true);
  try {
    await StudentAPI.markFinePaid(stuId, fineId);
    showToast('Fine marked as paid.', 'success');
    await renderFines();
  } catch (err) {
    showToast('Failed.', 'error');
  } finally {
    showLoader(false);
  }
}

//  ACCESSORIES
async function renderAccessories() {
  showLoader(true);
  try {
    const students = await StudentAPI.getAll();
    document.getElementById('accessories-list').innerHTML = students.map(s => `
      <tr>
        <td>${s.name}<br><span style="font-size:0.72rem;color:var(--muted)">${s.id}</span></td>
        <td><span class="badge badge-navy">${s.roomNo||'-'}</span></td>
        <td>${(s.accessories||[]).map(a=>`<span class="badge badge-navy" style="margin:2px">${a}</span>`).join('')||'<span style="color:var(--muted)">None</span>'}</td>
        <td>${s.checkinDate||'-'}</td>
        <td><button class="btn btn-primary btn-xs" onclick="openAccessoryModal('${s.id}')">+ Issue</button></td>
      </tr>`).join('');
  } catch (err) {
    showToast('Failed to load accessories.', 'error');
  } finally {
    showLoader(false);
  }
}

function openAccessoryModal(stuId) {
  populateDropdowns();
  if (stuId) setTimeout(() => { document.getElementById('am-student').value = stuId; }, 200);
  document.getElementById('acc-checkboxes').innerHTML = HOSTEL.accessories.map(a =>
    `<label style="display:flex;align-items:center;gap:6px;font-size:0.83rem;cursor:pointer">
      <input type="checkbox" value="${a}" style="accent-color:var(--navy)"> ${a}
    </label>`).join('');
  openModal('accessory-modal');
}

async function submitAccessories() {
  const stuId = document.getElementById('am-student').value;
  if (!stuId) { showToast('Select a student.', 'error'); return; }
  const items = [...document.querySelectorAll('#acc-checkboxes input:checked')].map(c => c.value);
  if (!items.length) { showToast('Select at least one item.', 'error'); return; }
  showLoader(true);
  try {
    await StudentAPI.issueAccessories(stuId, items);
    closeModal('accessory-modal');
    showToast(`${items.length} item(s) issued.`, 'success');
    await renderAccessories();
  } catch (err) {
    showToast('Failed to issue accessories.', 'error');
  } finally {
    showLoader(false);
  }
}

//  COMPLAINTS
async function renderComplaints() {
  showLoader(true);
  try {
    const students = await StudentAPI.getAll();
    const rows = [];
    students.forEach(s => {
      (s.complaints||[]).forEach(c => {
        rows.push(`<tr>
          <td style="font-family:monospace;font-size:0.76rem">${c.id}</td>
          <td>${s.name}<br><span style="font-size:0.72rem;color:var(--muted)">${s.id}</span></td>
          <td><span class="badge badge-navy">${s.roomNo||'-'}</span></td>
          <td>${c.title}<br><span style="font-size:0.75rem;color:var(--text-2)">${c.description||''}</span></td>
          <td style="font-size:0.8rem">${c.date||'-'}</td>
          <td><span class="badge ${c.status==='resolved'?'badge-success':c.status==='in-progress'?'badge-warning':'badge-danger'}">${c.status}</span></td>
          <td><button class="btn btn-success btn-xs" onclick="resolveComplaint('${s.id}','${c.id}')">✅ Resolve</button></td>
        </tr>`);
      });
    });
    document.getElementById('complaints-list').innerHTML = rows.join('') ||
      '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No complaints filed</td></tr>';
  } catch (err) {
    showToast('Failed to load complaints.', 'error');
  } finally {
    showLoader(false);
  }
}

async function resolveComplaint(stuId, cId) {
  showLoader(true);
  try {
    await StudentAPI.resolveComplaint(stuId, cId);
    showToast('Complaint resolved.', 'success');
    await renderComplaints();
  } catch (err) {
    showToast('Failed to resolve.', 'error');
  } finally {
    showLoader(false);
  }
}

//  NOTICES
async function renderNotices() {
  showLoader(true);
  try {
    const notices = await NoticeAPI.getAll();
    document.getElementById('notices-list').innerHTML = notices.map((n, i) => `
      <div class="notice-card notice-${n.priority}" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <strong style="font-size:0.88rem;color:var(--navy)">${n.title}</strong>
          <span class="badge ${n.priority==='high'?'badge-danger':n.priority==='medium'?'badge-warning':'badge-info'}">${n.priority}</span>
        </div>
        <p style="font-size:0.82rem;color:var(--text-2);line-height:1.5;margin-bottom:8px">${n.content}</p>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.72rem;color:var(--muted)">📅 ${n.date||''} · ${n.author||''}</span>
          <button class="btn btn-danger btn-xs" onclick="deleteNotice('${n.id}')">🗑</button>
        </div>
      </div>`).join('') || '<div class="empty-state"><div class="empty-icon">📢</div><p>No notices yet</p></div>';
  } catch (err) {
    showToast('Failed to load notices.', 'error');
  } finally {
    showLoader(false);
  }
}

async function postNotice(e) {
  e.preventDefault();
  showLoader(true);
  try {
    await NoticeAPI.create(
      document.getElementById('notice-title').value,
      document.getElementById('notice-content').value,
      document.getElementById('notice-priority').value,
      currentAdmin?.name || 'Admin'
    );
    await NotifAPI.notifyAll(
      document.getElementById('notice-title').value,
      document.getElementById('notice-content').value,
      'announcement'
    );
    e.target.reset();
    showToast('Notice posted to all students!', 'success');
    await renderNotices();
  } catch (err) {
    showToast(err.message || 'Failed to post notice.', 'error');
  } finally {
    showLoader(false);
  }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  showLoader(true);
  try {
    await NoticeAPI.delete(id);
    showToast('Notice deleted.', 'success');
    await renderNotices();
  } catch (err) {
    showToast('Failed to delete.', 'error');
  } finally {
    showLoader(false);
  }
}

//  NOTIFICATIONS
function toggleNotifTarget() {
  const val = document.getElementById('notif-target').value;
  document.getElementById('notif-wing-field').style.display    = val === 'wing'    ? 'block' : 'none';
  document.getElementById('notif-student-field').style.display = val === 'student' ? 'block' : 'none';
}

async function sendAdminNotif() {
  const target  = document.getElementById('notif-target').value;
  const title   = document.getElementById('notif-title').value;
  const message = document.getElementById('notif-message').value;
  const type    = document.getElementById('notif-type').value;
  if (!title || !message) { showToast('Fill title and message.', 'error'); return; }

  showLoader(true);
  try {
    if (target === 'all') {
      await NotifAPI.notifyAll(title, message, type);
      showToast('Sent to all students!', 'success');
    } else if (target === 'wing') {
      const wing = document.getElementById('notif-wing').value;
      await NotifAPI.notifyWing(wing, title, message, type);
      showToast(`Sent to ${wing} Wing!`, 'success');
    } else {
      const stuId = document.getElementById('notif-student-sel').value;
      if (!stuId) { showToast('Select a student.', 'error'); return; }
      await NotifAPI.notifyStudent(stuId, title, message, type);
      showToast('Notification sent!', 'success');
    }
    document.getElementById('notif-title').value   = '';
    document.getElementById('notif-message').value = '';

    const log = document.getElementById('notif-log');
    if (log.querySelector('.empty-state')) log.innerHTML = '';
    const entry = document.createElement('div');
    entry.style.cssText = 'background:var(--bg);border-radius:10px;padding:12px;margin-bottom:10px;font-size:0.82rem';
    entry.innerHTML = `<strong>${title}</strong> → ${target}<br><span style="color:var(--muted)">${new Date().toLocaleTimeString()}</span>`;
    log.prepend(entry);
  } catch (err) {
    showToast(err.message || 'Failed to send.', 'error');
  } finally {
    showLoader(false);
  }
}

//  FEE REMINDERS
async function sendAutoFeeReminders() {
  if (!confirm('Send automated fee reminders to all students with pending dues?')) return;
  showLoader(true);
  try {
    const res = await FeeReminderAPI.sendReminders();
    showToast('Reminders sent successfully!', 'success');
  } catch (err) {
    showToast('Failed to send reminders.', 'error');
  } finally {
    showLoader(false);
  }
}

//  GATE PASS
async function renderGatePasses() {
  showLoader(true);
  try {
    const passes = await GatePassAPI.getAll();
    document.getElementById('gatepass-list').innerHTML = passes.length ? passes.map(gp => `
      <tr>
        <td>${gp.studentName}<br><span style="font-size:0.72rem;color:var(--muted)">${gp.studentId}</span></td>
        <td>${gp.destination}</td>
        <td>${gp.reason}</td>
        <td>${gp.departureDate}</td>
        <td>${gp.returnDate}</td>
        <td><span class="badge ${gp.status==='approved'?'badge-success':gp.status==='rejected'?'badge-danger':'badge-warning'}">${gp.status}</span></td>
        <td>
          ${gp.status === 'pending' ? `
            <button class="btn btn-success btn-xs" onclick="updateGatePassStatus('${gp.id}','approved')">Approve</button>
            <button class="btn btn-danger btn-xs" onclick="updateGatePassStatus('${gp.id}','rejected')">Reject</button>
          ` : '<span style="color:var(--muted);font-size:0.8rem">Processed</span>'}
        </td>
      </tr>
    `).join('') : '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No gate pass requests found</td></tr>';
  } catch (err) {
    showToast('Failed to load gate passes', 'error');
  } finally {
    showLoader(false);
  }
}

async function updateGatePassStatus(id, status) {
  showLoader(true);
  try {
    await GatePassAPI.updateStatus(id, status);
    showToast(`Gate Pass ${status}`, 'success');
    await renderGatePasses();
  } catch (err) {
    showToast('Failed to update status', 'error');
  } finally {
    showLoader(false);
  }
}

//  VISITORS
async function renderVisitors() {
  showLoader(true);
  try {
    const list = await VisitorAPI.getAll();
    document.getElementById('visitor-list').innerHTML = list.length ? list.map(v => {
      let actions = '';
      let statusBadge = '';
      
      if (v.status === 'pending') {
        statusBadge = '<span class="badge badge-warning">Pending Request</span>';
        actions = `
          <button class="btn btn-success btn-sm" onclick="updateVisitorStatus('${v.id}', 'approved')">Approve</button>
          <button class="btn btn-danger btn-sm" onclick="updateVisitorStatus('${v.id}', 'rejected')">Reject</button>
        `;
      } else if (v.status === 'rejected') {
        statusBadge = '<span class="badge badge-danger">Rejected</span>';
        actions = '-';
      } else if (v.checkOutTime) {
        statusBadge = '<span class="badge badge-navy">Checked Out</span>';
        actions = '-';
      } else {
        statusBadge = '<span class="badge badge-success">Active</span>';
        actions = `<button class="btn btn-outline btn-sm" onclick="checkoutVisitor('${v.id}')">Check Out</button>`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight:600">${v.studentName}</div>
            <div style="font-size:0.7rem;color:var(--muted)">ID: ${v.studentId}</div>
          </td>
          <td>
            <div style="font-weight:600">${v.visitorName}</div>
            <div style="font-size:0.75rem;color:var(--text-2)">${v.relation} | ${v.contact}</div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="font-size:0.75rem">In: ${v.checkInTime ? new Date(v.checkInTime).toLocaleString() : '-'}</div>
            <div style="font-size:0.75rem">Out: ${v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '-'}</div>
          </td>
          <td><div style="display:flex;gap:5px">${actions}</div></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--muted)">No visitors logs/requests found</td></tr>';
  } catch (err) {
    showToast('Failed to load visitors', 'error');
  } finally {
    showLoader(false);
  }
}

async function updateVisitorStatus(id, status) {
  showLoader(true);
  try {
    await VisitorAPI.updateStatus(id, status);
    showToast(`Visitor ${status}!`, 'success');
    await renderVisitors();
  } catch (err) {
    showToast('Failed to update status', 'error');
  } finally {
    showLoader(false);
  }
}

async function checkoutVisitor(id) {
  showLoader(true);
  try {
    await VisitorAPI.checkout(id);
    showToast('Visitor checked out', 'success');
    await renderVisitors();
  } catch (err) {
    showToast('Checkout failed', 'error');
  } finally {
    showLoader(false);
  }
}

//  MESS MENU
async function renderMessMenu() {
  showLoader(true);
  try {
    const menu = await MessMenuAPI.get();
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const map = {};
    menu.forEach(m => { map[m.dayOfWeek] = m; });
    
    document.getElementById('mess-menu-list').innerHTML = days.map(d => `
      <tr>
        <td style="font-weight:600">${d}</td>
        <td>${map[d]?.breakfast || '-'}</td>
        <td>${map[d]?.lunch || '-'}</td>
        <td>${map[d]?.dinner || '-'}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load mess menu', 'error');
  } finally {
    showLoader(false);
  }
}

async function updateMessMenu(e) {
  e.preventDefault();
  const day = document.getElementById('mess-day').value;
  const data = {
    breakfast: document.getElementById('mess-breakfast').value,
    lunch: document.getElementById('mess-lunch').value,
    dinner: document.getElementById('mess-dinner').value
  };
  showLoader(true);
  try {
    await MessMenuAPI.update(day, data);
    e.target.reset();
    showToast(`${day} menu updated!`, 'success');
    await renderMessMenu();
  } catch (err) {
    showToast('Failed to update menu', 'error');
  } finally {
    showLoader(false);
  }
}

//  EVENTS
async function renderEvents() {
  showLoader(true);
  try {
    const events = await EventAPI.getAll();
    document.getElementById('events-list').innerHTML = events.length ? events.map(e => `
      <div style="background:var(--bg);padding:16px;border-radius:10px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <strong style="font-size:1.1rem;color:var(--navy)">${e.title}</strong>
          <span class="badge badge-navy">${e.category}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:12px">${e.description}</p>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)">
          <span>📅 Date: ${e.date}</span>
          <span>👥 Registered: ${(e.registeredStudentIds||[]).length} students</span>
        </div>
      </div>
    `).join('') : '<p style="color:var(--muted)">No upcoming events.</p>';
  } catch (err) {
    showToast('Failed to load events', 'error');
  } finally {
    showLoader(false);
  }
}

async function createEvent(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('evt-title').value,
    description: document.getElementById('evt-desc').value,
    date: document.getElementById('evt-date').value,
    category: document.getElementById('evt-cat').value
  };
  showLoader(true);
  try {
    await EventAPI.create(data);
    e.target.reset();
    showToast('Event created successfully', 'success');
    await renderEvents();
  } catch (err) {
    showToast('Failed to create event', 'error');
  } finally {
    showLoader(false);
  }
}

//  MODAL & DROPDOWN HELPERS
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toggleProfileDrop() {
  document.getElementById('admin-profile-btn').classList.toggle('open');
  document.getElementById('admin-profile-drop').classList.toggle('open');
  document.getElementById('admin-notif-drop').style.display = 'none';
}

function toggleAdminNotif(e) {
  e.stopPropagation();
  const drop = document.getElementById('admin-notif-drop');
  drop.style.display = drop.style.display === 'flex' ? 'none' : 'flex';
  document.getElementById('admin-profile-drop').classList.remove('open');
}

function clearAdminNotifs() {
  document.getElementById('admin-notif-drop').style.display = 'none';
}

function closeDrops() {
  document.getElementById('admin-profile-btn')?.classList.remove('open');
  document.getElementById('admin-profile-drop')?.classList.remove('open');
  const nd = document.getElementById('admin-notif-drop');
  if (nd) nd.style.display = 'none';
}

document.addEventListener('click', closeDrops);
document.querySelectorAll('.profile-btn, .notif-btn').forEach(el =>
  el.addEventListener('click', e => e.stopPropagation()));

function logout() {
  sessionStorage.removeItem('kbh_user');
  window.location.href = '../index.html';
}