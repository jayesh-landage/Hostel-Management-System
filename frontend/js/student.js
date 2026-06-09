// student.js — Student Dashboard (fully connected to MongoDB API)
let currentStudent = null;

window.onload = async function () {
  const user = JSON.parse(sessionStorage.getItem('kbh_user') || 'null');
  if (!user || user.role !== 'student') { window.location.href = '../index.html'; return; }

  showLoader(true);
  try {
    currentStudent = await StudentAPI.getProfile(user.id);
    initTopbar();
    await renderDashboard();
    updateNotifBadge();
  } catch (err) {
    alert('Cannot connect to server. Make sure the backend is running on port 8080.\n\n' + err.message);
  } finally {
    showLoader(false);
  }
};

function initTopbar() {
  const s = currentStudent;
  const initials = s.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('stu-avatar').textContent = initials;
  document.getElementById('stu-name-top').textContent = s.name;
  document.getElementById('stu-room-top').textContent = 'Room: ' + (s.roomNo || '--');
  document.getElementById('dd-name').textContent = s.name;
  document.getElementById('dd-room').textContent = s.roomNo ? `Room ${s.roomNo} · ${s.wing} Wing` : 'No room allocated';
}

async function reloadStudent() {
  const user = JSON.parse(sessionStorage.getItem('kbh_user'));
  currentStudent = await StudentAPI.getProfile(user.id);
}

//  SECTION ROUTING
const sectionTitles = {
  dashboard:     ['Dashboard',       'Your hostel overview'],
  profile:       ['My Profile',      'Personal and academic details'],
  room:          ['My Room',         'Room and wing details'],
  accessories:   ['My Accessories',  'Issued hostel items'],
  deposit:       ['Deposit & Dues',  'Payment and fee details'],
  fines:         ['My Fines',        'Fines and penalties'],
  notifications: ['Notifications',   'All alerts and messages'],
  notices:       ['Notice Board',    'Hostel announcements'],
  complaints:    ['Complaints',      'File and track maintenance requests'],
  changepwd:     ['Change Password', 'Update your login password'],
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

  await reloadStudent();

  if (name === 'dashboard')     await renderDashboard();
  if (name === 'profile')       renderProfile();
  if (name === 'room')          renderRoom();
  if (name === 'accessories')   renderAccessories();
  if (name === 'deposit')       renderDeposit();
  if (name === 'fines')         renderFines();
  if (name === 'notifications') await renderAllNotifications();
  if (name === 'notices')       await renderNotices();
  if (name === 'complaints')    renderComplaints();
  if (name === 'gatepass')      await renderGatePasses();
  if (name === 'visitors')      await renderVisitors();
  if (name === 'mess')          await renderMessMenu();
  if (name === 'events')        await renderEvents();
}

//  DASHBOARD
async function renderDashboard() {
  const s = currentStudent;
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';

  document.getElementById('stu-welcome').textContent = `${greeting}, ${s.name.split(' ')[0]}! 👋`;
  document.getElementById('stu-welcome-sub').textContent =
    `Room ${s.roomNo||'Not Allocated'} · ${s.wing||''} Wing · ${s.floor||''}`;
  document.getElementById('stu-date').textContent = now.getDate();
  document.getElementById('stu-day').textContent  = now.toLocaleDateString('en-IN',
    { weekday:'long', month:'long', year:'numeric' });

  // Stats
  const unread     = (s.notifications||[]).filter(n => !n.read).length;
  const finesTotal = (s.fines||[]).reduce((sum,f) => sum + (f.status==='pending'?f.amount:0), 0);
  document.getElementById('stu-stats').innerHTML = [
    { label:'My Room',      value: s.roomNo||'--',                              icon:'🏠', bg:'#EFF6FF' },
    { label:'Deposit Paid', value:'₹'+(s.deposit?.paid||0).toLocaleString(),   icon:'✅', bg:'#D1FAE5' },
    { label:'Pending Dues', value:'₹'+(s.deposit?.pending||0).toLocaleString(),icon:'⏳', bg:'#FEF3C7' },
    { label:'Active Fines', value:'₹'+finesTotal,                               icon:'⚠️', bg:'#FEE2E2' },
    { label:'Accessories',  value:(s.accessories||[]).length,                   icon:'📦', bg:'#F3E8FF' },
    { label:'Notifications',value: unread+' new',                               icon:'🔔', bg:'#DBEAFE' },
  ].map(st => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${st.bg}">${st.icon}</div>
      <div class="stat-info"><p>${st.label}</p><h3>${st.value}</h3></div>
    </div>`).join('');

  // Room card
  document.getElementById('stu-room-big').textContent = s.roomNo || '--';
  document.getElementById('stu-wing-floor').textContent = s.wing ? `${s.wing} Wing · ${s.floor}` : 'Not Allocated';
  document.getElementById('stu-checkin-display').textContent = s.checkinDate || '--';
  document.getElementById('stu-status-badge').textContent = s.status;
  document.getElementById('stu-status-badge').className = `badge ${s.status==='active'?'badge-success':'badge-danger'}`;

  // Payment overview
  const dep = s.deposit || {};
  const pct = dep.total ? Math.round(dep.paid/dep.total*100) : 0;
  document.getElementById('stu-payment-overview').innerHTML = `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:0.83rem;margin-bottom:5px">
        <span style="color:var(--muted)">Total Deposit</span>
        <span style="font-weight:600">₹${(dep.total||0).toLocaleString()}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-top:4px">
        <span style="color:var(--success)">Paid: ₹${(dep.paid||0).toLocaleString()}</span>
        <span style="color:var(--danger)">Due: ₹${(dep.pending||0).toLocaleString()}</span>
      </div>
    </div>
    <span class="badge ${payStatusBadge(dep.paymentStatus)}">${dep.paymentStatus||'pending'}</span>`;

  // Recent notifications (top 4)
  const notifs = (s.notifications||[]).slice(0,4);
  document.getElementById('stu-recent-notifs').innerHTML = notifs.length ?
    notifs.map(n => renderNotifItem(n)).join('') :
    '<div class="empty-state"><div class="empty-icon">🔔</div><p>No notifications</p></div>';

  // Latest notices
  try {
    const notices = await NoticeAPI.getAll();
    document.getElementById('stu-latest-notices').innerHTML = notices.slice(0,2).map(n => `
      <div style="padding:10px;border-radius:10px;background:var(--bg);margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <strong style="font-size:0.83rem;color:var(--navy)">${n.title}</strong>
          <span class="badge ${n.priority==='high'?'badge-danger':n.priority==='medium'?'badge-warning':'badge-info'}">${n.priority}</span>
        </div>
        <p style="font-size:0.78rem;color:var(--text-2);line-height:1.5">${(n.content||'').slice(0,100)}${(n.content||'').length>100?'...':''}</p>
        <p style="font-size:0.7rem;color:var(--muted);margin-top:4px">📅 ${n.date||''}</p>
      </div>`).join('') || '<p style="color:var(--muted);font-size:0.83rem;padding:12px">No notices yet.</p>';
  } catch { }
}

//  NOTIFICATIONS
function getNotifStyle(type) {
  const map = { fee:'💰', fine:'⚠️', maintenance:'🔧', announcement:'📢', general:'📌' };
  const bg  = { fee:'#FEF3C7', fine:'#FEE2E2', maintenance:'#DBEAFE', announcement:'#D1FAE5', general:'#F3F4F6' };
  return { icon: map[type]||'📌', bg: bg[type]||'#F3F4F6' };
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((new Date() - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return diff + ' days ago';
  return dateStr;
}

function renderNotifItem(n) {
  const { icon, bg } = getNotifStyle(n.type);
  return `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}')">
      <div class="notif-icon" style="background:${bg}">${icon}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.date)}</div>
      </div>
      ${!n.read ? '<div style="width:8px;height:8px;background:var(--gold);border-radius:50%;flex-shrink:0;margin-top:4px"></div>' : ''}
    </div>`;
}

function updateNotifBadge() {
  const unread = (currentStudent.notifications||[]).filter(n => !n.read).length;
  const badge  = document.getElementById('notif-count');
  badge.textContent  = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

function renderNotifDropdown() {
  const notifs = (currentStudent.notifications||[]).slice(0,6);
  document.getElementById('notif-list-drop').innerHTML = notifs.length ?
    notifs.map(n => renderNotifItem(n)).join('') :
    '<div style="text-align:center;padding:24px;color:var(--muted);font-size:0.85rem">No notifications</div>';
}

async function renderAllNotifications() {
  const notifs = currentStudent.notifications || [];
  document.getElementById('all-notifs-content').innerHTML = notifs.length ?
    notifs.map(n => renderNotifItem(n)).join('') :
    '<div class="empty-state"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>';
}

async function markRead(id) {
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    await StudentAPI.markNotifRead(user.id, id);
    await reloadStudent();
    updateNotifBadge();
    renderNotifDropdown();
  } catch (err) { console.error('markRead failed', err); }
}

async function markAllRead() {
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    // Mark all via API one by one
    for (const n of (currentStudent.notifications||[]).filter(n => !n.read)) {
      await StudentAPI.markNotifRead(user.id, n.id);
    }
    await reloadStudent();
    updateNotifBadge();
    renderNotifDropdown();
    await renderAllNotifications();
  } catch (err) { showToast('Failed.', 'error'); }
}

function toggleNotifDrop(e) {
  e.stopPropagation();
  const drop = document.getElementById('notif-dropdown');
  const isOpen = drop.style.display === 'flex';
  drop.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) renderNotifDropdown();
  document.getElementById('profile-drop').classList.remove('open');
  document.getElementById('profile-btn').classList.remove('open');
}

//  PROFILE
function renderProfile() {
  const s = currentStudent;
  document.getElementById('profile-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)">
      <div class="profile-avatar" style="width:72px;height:72px;font-size:1.8rem">${s.name.charAt(0)}</div>
      <div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--navy)">${s.name}</h2>
        <p style="color:var(--muted);font-size:0.82rem">${s.id} · ${s.regNo}</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <span class="badge badge-success">${s.status}</span>
          <span class="badge badge-navy">${s.wing} Wing · Room ${s.roomNo}</span>
        </div>
      </div>
    </div>
    <div class="form-grid">
      ${[
        ['Full Name',s.name],['Registration No.',s.regNo],
        ['Course',s.course],['Branch',s.branch],['Year',s.year],
        ['Mobile',s.mobile],['Emergency',s.emergencyContact||'-'],['Aadhaar',s.aadhaar||'-'],
        ['Admission Date',s.admissionDate||'-'],['Check-in Date',s.checkinDate||'-'],
        ['Parent Name',s.parentName||'-'],['Parent Mobile',s.parentMobile||'-'],
      ].map(([label,val]) => `
        <div style="background:var(--bg);border-radius:10px;padding:12px">
          <p style="font-size:0.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em">${label}</p>
          <p style="font-size:0.88rem;font-weight:500;color:var(--navy);margin-top:4px">${val}</p>
        </div>`).join('')}
    </div>
    <div style="margin-top:12px;background:var(--bg);border-radius:10px;padding:12px">
      <p style="font-size:0.7rem;font-weight:600;color:var(--muted);text-transform:uppercase">Address</p>
      <p style="font-size:0.88rem;color:var(--navy);margin-top:4px">${s.address||'-'}</p>
    </div>`;
}

function printProfile() { window.print(); }

//  ROOM
function renderRoom() {
  const s = currentStudent;
  document.getElementById('room-content').innerHTML = s.roomNo ? `
    <div class="room-card" style="margin-bottom:24px">
      <div style="position:relative;z-index:1">
        <p style="font-size:0.75rem;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em">Allocated Room</p>
        <div class="room-number">${s.roomNo}</div>
        <p style="color:rgba(255,255,255,0.7);margin-top:4px">${s.wing} Wing · ${s.floor}</p>
      </div>
    </div>
    <div class="form-grid">
      ${[
        ['Room Number',s.roomNo],['Wing',s.wing+' Wing'],
        ['Floor',s.floor],['Check-in Date',s.checkinDate||'-'],
        ['Check-out Date',s.checkoutDate||'Still Residing'],['Status',s.status],
      ].map(([label,val]) => `
        <div style="background:var(--bg);border-radius:10px;padding:14px">
          <p style="font-size:0.72rem;font-weight:600;color:var(--muted);text-transform:uppercase">${label}</p>
          <p style="font-size:0.9rem;font-weight:600;color:var(--navy);margin-top:4px">${val}</p>
        </div>`).join('')}
    </div>
    <div class="alert alert-info" style="margin-top:16px">📍 For room shifting, contact the hostel warden office.</div>` :
    '<div class="empty-state"><div class="empty-icon">🏠</div><p>No room allocated. Contact admin.</p></div>';
}

//  ACCESSORIES
function renderAccessories() {
  const accs = currentStudent.accessories || [];
  const icons = {'Bedsheet':'🛏','Pillow':'🛋','Cushion':'🛋','Mattress':'🛌','Bucket':'🪣','Mug':'🍺','Chair':'🪑','Table':'🪞','Cupboard/Locker':'🗄','Study Lamp':'💡'};
  document.getElementById('stu-acc-grid').innerHTML = accs.length ?
    accs.map(a => `
      <div class="acc-item">
        <div class="acc-icon">${icons[a]||'📦'}</div>
        <p>${a}</p>
        <span class="badge badge-success" style="margin-top:4px;font-size:0.65rem">Issued</span>
      </div>`).join('') :
    '<div class="empty-state"><div class="empty-icon">📦</div><p>No accessories issued yet.</p></div>';
}

//  DEPOSIT
function renderDeposit() {
  const dep = currentStudent.deposit || {};
  const pct = dep.total ? Math.round(dep.paid/dep.total*100) : 0;
  document.getElementById('stu-deposit-content').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
      <div style="background:var(--bg);border-radius:12px;padding:16px;text-align:center">
        <p style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">Total Deposit</p>
        <h3 style="font-size:1.5rem;font-weight:700;color:var(--navy)">₹${(dep.total||0).toLocaleString()}</h3>
      </div>
      <div style="background:#D1FAE5;border-radius:12px;padding:16px;text-align:center">
        <p style="font-size:0.75rem;color:#065F46;margin-bottom:4px">Amount Paid</p>
        <h3 style="font-size:1.5rem;font-weight:700;color:#065F46">₹${(dep.paid||0).toLocaleString()}</h3>
      </div>
      <div style="background:${dep.pending>0?'#FEE2E2':'#F3F4F6'};border-radius:12px;padding:16px;text-align:center">
        <p style="font-size:0.75rem;color:${dep.pending>0?'#991B1B':'var(--muted)'};margin-bottom:4px">Pending</p>
        <h3 style="font-size:1.5rem;font-weight:700;color:${dep.pending>0?'#991B1B':'var(--muted)'}">₹${(dep.pending||0).toLocaleString()}</h3>
      </div>
    </div>
    <div class="progress-bar" style="margin-bottom:8px"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:16px">
      <span style="color:var(--muted)">${pct}% paid</span>
      <span class="badge ${payStatusBadge(dep.paymentStatus)}">${dep.paymentStatus||'pending'}</span>
    </div>
    ${dep.pending > 0
      ? `<div class="alert alert-danger">⚠️ Pending payment of <strong>₹${dep.pending.toLocaleString()}</strong>. Clear at the hostel office to avoid fines.</div>`
      : '<div class="alert alert-success">✅ All dues cleared! Deposit fully paid.</div>'}`;

  document.getElementById('stu-timeline').innerHTML = [
    'Nov 2024','Dec 2024','Jan 2025','Feb 2025'
  ].map((m, i) => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:${i===0?'var(--danger)':'var(--border)'}"></div>
      <div style="font-size:0.83rem;font-weight:600;color:var(--navy)">${m} Fee Due</div>
      <div style="font-size:0.75rem;color:var(--muted)">Due: 10th ${m} · ₹3,500</div>
      <span class="badge ${i===0?'badge-danger':'badge-info'}">${i===0?'Due':'Upcoming'}</span>
    </div>`).join('');
}

//  FINES
function renderFines() {
  const fines = currentStudent.fines || [];
  document.getElementById('stu-fines-content').innerHTML = fines.length ?
    fines.map(f => `
      <div class="fine-item">
        <div>
          <div style="font-weight:600;font-size:0.88rem;color:var(--navy)">${f.reason}</div>
          <div style="font-size:0.75rem;color:var(--muted)">📅 ${f.date||''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:700;color:var(--danger)">₹${f.amount}</div>
          <span class="badge ${f.status==='paid'?'badge-success':'badge-danger'}">${f.status}</span>
        </div>
      </div>`).join('') :
    '<div class="empty-state"><div class="empty-icon">✅</div><p>No fines! Keep it up.</p></div>';
}

//  NOTICES
async function renderNotices() {
  showLoader(true);
  try {
    const notices = await NoticeAPI.getAll();
    document.getElementById('stu-notices-content').innerHTML = notices.map(n => `
      <div class="notice-card notice-${n.priority}" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <strong style="font-size:0.9rem;color:var(--navy)">${n.title}</strong>
          <span class="badge ${n.priority==='high'?'badge-danger':n.priority==='medium'?'badge-warning':'badge-info'}">${n.priority}</span>
        </div>
        <p style="font-size:0.84rem;color:var(--text-2);line-height:1.6">${n.content}</p>
        <p style="font-size:0.72rem;color:var(--muted);margin-top:8px">📅 ${n.date||''} · By ${n.author||''}</p>
      </div>`).join('') ||
      '<div class="empty-state"><div class="empty-icon">📢</div><p>No notices</p></div>';
  } catch (err) {
    showToast('Failed to load notices.', 'error');
  } finally {
    showLoader(false);
  }
}

//  COMPLAINTS
function renderComplaints() {
  const complaints = currentStudent.complaints || [];
  document.getElementById('my-complaints-list').innerHTML = complaints.length ?
    complaints.map(c => `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <strong style="font-size:0.85rem;color:var(--navy)">${c.title}</strong>
          <span class="badge ${c.status==='resolved'?'badge-success':c.status==='in-progress'?'badge-warning':'badge-danger'}">${c.status}</span>
        </div>
        <p style="font-size:0.8rem;color:var(--text-2)">${c.description||''}</p>
        <p style="font-size:0.72rem;color:var(--muted);margin-top:4px">📅 ${c.date||''}</p>
      </div>`).join('') :
    '<div class="empty-state"><div class="empty-icon">✅</div><p>No complaints filed</p></div>';
}

async function fileComplaint(e) {
  e.preventDefault();
  const user = JSON.parse(sessionStorage.getItem('kbh_user'));
  showLoader(true);
  try {
    await StudentAPI.fileComplaint(user.id,
      document.getElementById('c-title').value,
      document.getElementById('c-desc').value);
    e.target.reset();
    await reloadStudent();
    renderComplaints();
    showToast('Complaint filed successfully!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to file complaint.', 'error');
  } finally {
    showLoader(false);
  }
}

//  CHANGE PASSWORD
async function changePassword(e) {
  e.preventDefault();
  const user = JSON.parse(sessionStorage.getItem('kbh_user'));
  const old  = document.getElementById('cp-old').value;
  const newP = document.getElementById('cp-new').value;
  const conf = document.getElementById('cp-confirm').value;
  const msg  = document.getElementById('cp-msg');

  if (newP !== conf) {
    msg.innerHTML = '<div class="alert alert-danger">❌ Passwords do not match.</div>'; return;
  }
  if (newP.length < 6) {
    msg.innerHTML = '<div class="alert alert-warning">⚠️ Minimum 6 characters.</div>'; return;
  }

  showLoader(true);
  try {
    await StudentAPI.changePassword(user.id, old, newP);
    msg.innerHTML = '<div class="alert alert-success">✅ Password updated!</div>';
    e.target.reset();
  } catch (err) {
    msg.innerHTML = `<div class="alert alert-danger">❌ ${err.message || 'Failed.'}</div>`;
  } finally {
    showLoader(false);
  }
}

//  GATE PASS
async function renderGatePasses() {
  showLoader(true);
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    const passes = await GatePassAPI.getForStudent(user.id);
    document.getElementById('my-gatepass-list').innerHTML = passes.length ? passes.map(gp => `
      <tr>
        <td><strong style="color:var(--navy)">${gp.destination}</strong><br><span style="font-size:0.75rem;color:var(--muted)">${gp.reason}</span></td>
        <td><span style="font-size:0.8rem">${gp.departureDate} to ${gp.returnDate}</span></td>
        <td><span class="badge ${gp.status==='approved'?'badge-success':gp.status==='rejected'?'badge-danger':'badge-warning'}">${gp.status}</span></td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">No gate passes requested</td></tr>';
  } catch (err) {
    showToast('Failed to load gate passes', 'error');
  } finally {
    showLoader(false);
  }
}

async function applyGatePass(e) {
  e.preventDefault();
  const user = JSON.parse(sessionStorage.getItem('kbh_user'));
  const data = {
    destination: document.getElementById('gp-dest').value,
    reason: document.getElementById('gp-reason').value,
    departureDate: document.getElementById('gp-dep').value,
    returnDate: document.getElementById('gp-ret').value
  };
  showLoader(true);
  try {
    await GatePassAPI.apply(user.id, data);
    e.target.reset();
    showToast('Gate pass applied successfully', 'success');
    await renderGatePasses();
  } catch (err) {
    showToast('Failed to apply gate pass', 'error');
  } finally {
    showLoader(false);
  }
}

//  VISITORS
async function renderVisitors() {
  showLoader(true);
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    const visitors = await VisitorAPI.getForStudent(user.id);
    document.getElementById('my-visitors-list').innerHTML = visitors.length ? visitors.map(v => {
      let statusBadge = '';
      if (v.status === 'pending') statusBadge = '<span class="badge badge-warning">Pending</span>';
      else if (v.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
      else if (v.checkOutTime) statusBadge = '<span class="badge badge-navy">Checked Out</span>';
      else statusBadge = '<span class="badge badge-success">Active</span>';

      return `
        <tr>
          <td>
            <div style="font-weight:600;color:var(--navy)">${v.visitorName}</div>
            <div style="font-size:0.75rem;color:var(--muted)">${v.relation} | ${v.contact}</div>
          </td>
          <td>
            <div style="font-size:0.8rem">In: ${v.checkInTime ? new Date(v.checkInTime).toLocaleString() : '-'}</div>
            <div style="font-size:0.8rem">Out: ${v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '-'}</div>
          </td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:20px">No visitor requests found</td></tr>';
  } catch (err) {
    showToast('Failed to load visitors', 'error');
  } finally {
    showLoader(false);
  }
}

async function applyVisitorPass(e) {
  e.preventDefault();
  const name = document.getElementById('v-name').value;
  const relation = document.getElementById('v-rel').value;
  const contact = document.getElementById('v-contact').value;
  
  showLoader(true);
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    await VisitorAPI.apply(user.id, { visitorName: name, relation, contact });
    showToast('Visitor request submitted!', 'success');
    e.target.reset();
    await renderVisitors();
  } catch (err) {
    showToast('Failed to submit request', 'error');
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
    
    document.getElementById('student-mess-list').innerHTML = days.map(d => `
      <tr style="${new Date().toLocaleDateString('en-US',{weekday:'long'})===d?'background:var(--bg)':''}">
        <td style="font-weight:600;color:var(--navy)">${d} ${new Date().toLocaleDateString('en-US',{weekday:'long'})===d?'<span style="color:var(--gold)">★</span>':''}</td>
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

//  EVENTS
async function renderEvents() {
  showLoader(true);
  try {
    const events = await EventAPI.getAll();
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    document.getElementById('student-events-list').innerHTML = events.length ? events.map(e => {
      const isRegistered = (e.registeredStudentIds || []).includes(user.id);
      return `
      <div style="background:var(--bg);padding:20px;border-radius:12px;border-top:4px solid var(--navy)">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <strong style="font-size:1.1rem;color:var(--navy)">${e.title}</strong>
          <span class="badge badge-navy">${e.category}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-2);margin-bottom:16px">${e.description}</p>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.8rem;color:var(--muted)">📅 ${e.date}</span>
          ${isRegistered ? 
            `<span class="badge badge-success">✅ Registered</span>` : 
            `<button class="btn btn-gold btn-sm" onclick="registerEvent('${e.id}')">Register</button>`}
        </div>
      </div>
    `}).join('') : '<p style="color:var(--muted)">No upcoming events.</p>';
  } catch (err) {
    showToast('Failed to load events', 'error');
  } finally {
    showLoader(false);
  }
}

async function registerEvent(eventId) {
  showLoader(true);
  try {
    const user = JSON.parse(sessionStorage.getItem('kbh_user'));
    await EventAPI.register(user.id, eventId);
    showToast('Registered successfully!', 'success');
    await renderEvents();
  } catch (err) {
    showToast('Failed to register', 'error');
  } finally {
    showLoader(false);
  }
}

//  DROPDOWN HELPERS
function toggleProfileDrop() {
  const btn  = document.getElementById('profile-btn');
  const drop = document.getElementById('profile-drop');
  btn.classList.toggle('open');
  drop.classList.toggle('open');
  document.getElementById('notif-dropdown').style.display = 'none';
}

function closeDrops() {
  document.getElementById('profile-btn')?.classList.remove('open');
  document.getElementById('profile-drop')?.classList.remove('open');
  const nd = document.getElementById('notif-dropdown');
  if (nd) nd.style.display = 'none';
}

document.addEventListener('click', closeDrops);
document.querySelectorAll('.profile-btn, .notif-btn').forEach(el =>
  el.addEventListener('click', e => e.stopPropagation()));

function logout() {
  sessionStorage.removeItem('kbh_user');
  window.location.href = '../index.html';
}