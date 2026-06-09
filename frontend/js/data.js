// data.js — Central Data Store for Karmveer Boys Hostel System
const HOSTEL = {
  name: "Karmveer Boys Hostel",
  wings: ['A', 'B', 'C', 'D'],
  floors: [
    { label: 'Ground Floor', prefix: 1 },
    { label: '1st Floor',    prefix: 2 },
    { label: '2nd Floor',    prefix: 3 },
    { label: '3rd Floor',    prefix: 4 }
  ],
  roomsPerFloor: { A: 12, B: 11, C: 11, D: 12 }
};

// ---- Admin credentials (hardcoded, only 2) ----
const ADMINS = [
  { id: 'admin1', username: 'admin1', password: 'admin@123', name: 'Dr. Ramesh Patil', role: 'Warden' },
  { id: 'admin2', username: 'admin2', password: 'hostel@456', name: 'Mr. Suresh Kumar', role: 'Assistant Warden' }
];

// ---- Generate all 184 rooms ----
function generateRooms() {
  const rooms = {};
  HOSTEL.wings.forEach(wing => {
    const count = HOSTEL.roomsPerFloor[wing];
    HOSTEL.floors.forEach(floor => {
      for (let i = 1; i <= count; i++) {
        const roomNo = wing + '-' + floor.prefix + String(i).padStart(2, '0');
        rooms[roomNo] = {
          id: roomNo, wing: wing, floor: floor.label,
          floorPrefix: floor.prefix,
          status: 'vacant',
          studentId: null
        };
      }
    });
  });
  return rooms;
}

// ---- Sample students (match IDs exactly) ----
const SAMPLE_STUDENTS = [
  {
    id: 'KBH2024001', loginId: 'KBH2024001', password: 'stu@123',
    name: 'Arjun Sharma', regNo: '2024BCE001', course: 'B.Tech',
    branch: 'Computer Engineering', year: '2nd Year', wing: 'A',
    roomNo: 'A-101', floor: 'Ground Floor',
    mobile: '9876543210', parentName: 'Rajesh Sharma', parentMobile: '9876543200',
    emergency: '9876543200', address: '12, MG Road, Pune, Maharashtra',
    aadhaar: '1234 5678 9012', admissionDate: '2024-07-15', checkinDate: '2024-07-20',
    checkoutDate: null, status: 'active',
    deposit: { total: 15000, paid: 15000, pending: 0, paymentStatus: 'paid' },
    fines: [], accessories: ['Bedsheet', 'Pillow', 'Mattress', 'Bucket', 'Mug'],
    complaints: [],
    notifications: [
      { id: 'n1', title: 'Fee Deadline', message: 'Monthly hostel fee due by 10th of every month.', date: '2024-11-01', read: false, type: 'fee' },
      { id: 'n2', title: 'Maintenance Notice', message: 'Water supply will be interrupted on 5th Nov 6-8 AM.', date: '2024-11-03', read: false, type: 'maintenance' },
      { id: 'n3', title: 'Welcome!', message: 'Welcome to Karmveer Boys Hostel! Your room A-101 is ready.', date: '2024-07-20', read: true, type: 'general' }
    ]
  },
  {
    id: 'KBH2024002', loginId: 'KBH2024002', password: 'stu@456',
    name: 'Rahul Deshmukh', regNo: '2024BME002', course: 'B.Tech',
    branch: 'Mechanical Engineering', year: '1st Year', wing: 'B',
    roomNo: 'B-201', floor: '1st Floor',
    mobile: '9823456789', parentName: 'Vijay Deshmukh', parentMobile: '9823456700',
    emergency: '9823456700', address: '45, Shivaji Nagar, Nashik, Maharashtra',
    aadhaar: '9876 5432 1098', admissionDate: '2024-07-16', checkinDate: '2024-07-21',
    checkoutDate: null, status: 'active',
    deposit: { total: 15000, paid: 10000, pending: 5000, paymentStatus: 'partial' },
    fines: [{ id: 'f1', reason: 'Late return of bedsheet', amount: 200, date: '2024-10-15', status: 'pending' }],
    accessories: ['Bedsheet', 'Pillow', 'Mattress', 'Bucket'],
    complaints: [{ id: 'c1', title: 'Tap leaking', desc: 'Bathroom tap is leaking since 2 days.', date: '2024-10-20', status: 'open' }],
    notifications: [
      { id: 'n4', title: 'Pending Payment', message: 'You have Rs. 5000 pending deposit. Please clear it by 30th Nov.', date: '2024-11-01', read: false, type: 'fee' },
      { id: 'n5', title: 'Fine Alert', message: 'A fine of Rs. 200 has been added for late return of bedsheet.', date: '2024-10-15', read: false, type: 'fine' }
    ]
  },
  {
    id: 'KBH2024003', loginId: 'KBH2024003', password: 'stu@789',
    name: 'Vikram Yadav', regNo: '2024BCE003', course: 'B.Tech',
    branch: 'Civil Engineering', year: '3rd Year', wing: 'C',
    roomNo: 'C-301', floor: '2nd Floor',
    mobile: '9765432100', parentName: 'Mohan Yadav', parentMobile: '9765432000',
    emergency: '9765432000', address: '78, Station Road, Aurangabad, Maharashtra',
    aadhaar: '5678 1234 9087', admissionDate: '2022-07-15', checkinDate: '2022-07-19',
    checkoutDate: null, status: 'active',
    deposit: { total: 15000, paid: 15000, pending: 0, paymentStatus: 'paid' },
    fines: [], accessories: ['Bedsheet', 'Pillow', 'Mattress', 'Bucket', 'Mug', 'Chair'],
    complaints: [],
    notifications: [
      { id: 'n6', title: 'Annual Inspection', message: 'Annual room inspection on 15th Nov. Keep your room clean.', date: '2024-11-02', read: false, type: 'general' }
    ]
  },
  {
    id: 'KBH2024004', loginId: 'KBH2024004', password: 'stu@321',
    name: 'Amit Kulkarni', regNo: '2024BEE004', course: 'B.Tech',
    branch: 'Electrical Engineering', year: '4th Year', wing: 'D',
    roomNo: 'D-401', floor: '3rd Floor',
    mobile: '9654321098', parentName: 'Sunil Kulkarni', parentMobile: '9654321000',
    emergency: '9654321000', address: '23, Ganesh Peth, Solapur, Maharashtra',
    aadhaar: '3456 7890 1234', admissionDate: '2021-07-15', checkinDate: '2021-07-18',
    checkoutDate: null, status: 'active',
    deposit: { total: 15000, paid: 15000, pending: 0, paymentStatus: 'paid' },
    fines: [], accessories: ['Bedsheet', 'Pillow', 'Mattress', 'Bucket', 'Mug', 'Chair', 'Table'],
    complaints: [],
    notifications: []
  }
];

const ACCESSORIES_LIST = [
  'Bedsheet', 'Pillow', 'Cushion', 'Mattress',
  'Bucket', 'Mug', 'Chair', 'Table',
  'Cupboard/Locker', 'Study Lamp'
];

const SAMPLE_NOTICES = [
  { id: 'ann1', title: 'Hostel Fee Deadline', content: 'All students must pay monthly hostel fee by 10th of every month. Late payment attracts a fine of Rs. 100/day.', date: '2024-11-01', priority: 'high', author: 'Dr. Ramesh Patil' },
  { id: 'ann2', title: 'Water Supply Interruption', content: 'Due to maintenance, water supply will be interrupted on 5th November from 6 AM to 8 AM. Please store water accordingly.', date: '2024-11-03', priority: 'medium', author: 'Mr. Suresh Kumar' },
  { id: 'ann3', title: 'Annual Hostel Inspection', content: 'Annual room inspection will be conducted on 15th November. All students must maintain cleanliness.', date: '2024-11-02', priority: 'high', author: 'Dr. Ramesh Patil' },
  { id: 'ann4', title: 'Diwali Vacation Schedule', content: 'Hostel remains open during Diwali vacation. Students going home must inform the warden office by 10th November.', date: '2024-10-30', priority: 'low', author: 'Mr. Suresh Kumar' }
];

//  STORAGE — always reset and reseed on every page load
//  This prevents stale/corrupt localStorage from breaking login
function initStorage() {
  // Always regenerate rooms fresh
  const rooms = generateRooms();

  // Seed students into object
  const students = {};
  SAMPLE_STUDENTS.forEach(s => {
    students[s.id] = s;
    // Mark their room as occupied
    if (rooms[s.roomNo]) {
      rooms[s.roomNo].status = 'occupied';
      rooms[s.roomNo].studentId = s.id;
    }
  });

  localStorage.setItem('kbh_rooms', JSON.stringify(rooms));
  localStorage.setItem('kbh_notices', JSON.stringify(SAMPLE_NOTICES));

  // Only reset students if not already set (preserve admin-added students)
  const existingStudents = localStorage.getItem('kbh_students');
  if (!existingStudents) {
    localStorage.setItem('kbh_students', JSON.stringify(students));
  } else {
    // Make sure the 4 sample students always exist with correct credentials
    const parsed = JSON.parse(existingStudents);
    SAMPLE_STUDENTS.forEach(s => {
      if (!parsed[s.id]) {
        parsed[s.id] = s;
      }
    });
    localStorage.setItem('kbh_students', JSON.stringify(parsed));
  }
}

// ---- CRUD helpers ----
function getStudents()  { return JSON.parse(localStorage.getItem('kbh_students') || '{}'); }
function getRooms()     { return JSON.parse(localStorage.getItem('kbh_rooms') || '{}'); }
function getNotices()   { return JSON.parse(localStorage.getItem('kbh_notices') || '[]'); }
function saveStudents(d){ localStorage.setItem('kbh_students', JSON.stringify(d)); }
function saveRooms(d)   { localStorage.setItem('kbh_rooms', JSON.stringify(d)); }
function saveNotices(d) { localStorage.setItem('kbh_notices', JSON.stringify(d)); }

function getNextStudentId() {
  const students = getStudents();
  const ids = Object.keys(students)
    .map(k => parseInt(k.replace('KBH', '')))
    .filter(n => !isNaN(n));
  const max = ids.length ? Math.max(...ids) : 20240000;
  return 'KBH' + (max + 1);
}

function getVacantRooms(wing) {
  const rooms = getRooms();
  return Object.values(rooms).filter(r =>
    r.status === 'vacant' && (!wing || r.wing === wing)
  );
}

function getNextVacantRoom(wing, floorPref) {
  const vacant = getVacantRooms(wing || null);
  if (!vacant.length) return null;
  if (floorPref) {
    const fp = vacant.filter(r => r.floor === floorPref);
    if (fp.length) return fp[0];
  }
  return vacant[0];
}

function allocateRoom(studentId, roomId) {
  const rooms = getRooms();
  const students = getStudents();
  if (!rooms[roomId] || rooms[roomId].status !== 'vacant') return false;
  rooms[roomId].status = 'occupied';
  rooms[roomId].studentId = studentId;
  students[studentId].roomNo = roomId;
  students[studentId].wing = rooms[roomId].wing;
  students[studentId].floor = rooms[roomId].floor;
  saveRooms(rooms);
  saveStudents(students);
  return true;
}

function vacateRoom(studentId) {
  const rooms = getRooms();
  const students = getStudents();
  const stu = students[studentId];
  if (!stu || !stu.roomNo) return false;
  if (rooms[stu.roomNo]) {
    rooms[stu.roomNo].status = 'vacant';
    rooms[stu.roomNo].studentId = null;
  }
  students[studentId].roomNo = null;
  students[studentId].status = 'left';
  saveRooms(rooms);
  saveStudents(students);
  return true;
}

function sendNotificationToStudent(studentId, notif) {
  const students = getStudents();
  if (!students[studentId]) return;
  students[studentId].notifications = students[studentId].notifications || [];
  students[studentId].notifications.unshift({
    id: 'n' + Date.now(), ...notif,
    read: false, date: new Date().toISOString().slice(0, 10)
  });
  saveStudents(students);
}

function sendNotificationToAll(notif) {
  const students = getStudents();
  Object.keys(students).forEach(id => {
    students[id].notifications = students[id].notifications || [];
    students[id].notifications.unshift({
      id: 'n' + Date.now() + id, ...notif,
      read: false, date: new Date().toISOString().slice(0, 10)
    });
  });
  saveStudents(students);
}

function getDashboardStats() {
  const rooms = getRooms();
  const students = getStudents();
  const allRooms = Object.values(rooms);
  const allStudents = Object.values(students);
  return {
    totalRooms: allRooms.length,
    occupied: allRooms.filter(r => r.status === 'occupied').length,
    vacant: allRooms.filter(r => r.status === 'vacant').length,
    maintenance: allRooms.filter(r => r.status === 'maintenance').length,
    totalStudents: allStudents.filter(s => s.status === 'active').length,
    pendingFees: allStudents.reduce((sum, s) => sum + (s.deposit ? s.deposit.pending : 0), 0),
    openComplaints: allStudents.reduce((sum, s) => sum + ((s.complaints || []).filter(c => c.status === 'open').length), 0)
  };
}

// ---- Run on every page load ----
initStorage();