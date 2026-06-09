// login.js — Login page (calls backend API)

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.login-form-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-form').classList.add('active');
    hideError();
  });
});

function togglePwd(id) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function showError(msg, isSuccess = false) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
  if (isSuccess) {
    el.style.background = '#D1FAE5';
    el.style.color = '#065F46';
    el.style.border = '1px solid #A7F3D0';
  } else {
    el.style.background = '#FEE2E2';
    el.style.color = '#991B1B';
    el.style.border = '1px solid #FECACA';
  }
}

function hideError() {
  const el = document.getElementById('login-error');
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('span').textContent = loading ? 'Signing in...' : btn.dataset.label;
}

async function handleLogin(e, role) {
  e.preventDefault();
  hideError();
  const btn = e.target.querySelector('.login-btn');
  if (!btn.dataset.label) btn.dataset.label = btn.querySelector('span').textContent;
  setLoading(btn, true);

  try {
    if (role === 'admin') {
      const username = document.getElementById('admin-user').value.trim();
      const password = document.getElementById('admin-pass').value;

      const data = await AuthAPI.adminLogin(username, password);
      if (data.success) {
        sessionStorage.setItem('kbh_user', JSON.stringify({ role: 'admin', ...data }));
        window.location.href = 'pages/admin-dashboard.html';
      } else {
        showError('❌ ' + (data.message || 'Invalid admin credentials.'));
      }

    } else {
      const loginId = document.getElementById('stu-user').value.trim();
      const password = document.getElementById('stu-pass').value;

      const data = await AuthAPI.studentLogin(loginId, password);
      if (data.success) {
        sessionStorage.setItem('kbh_user', JSON.stringify({ role: 'student', ...data }));
        window.location.href = 'pages/student-dashboard.html';
      } else {
        showError('❌ ' + (data.message || 'Invalid student credentials.'));
      }
    }
  } catch (err) {
    if (err.message && err.message !== 'Failed to fetch') {
      showError('❌ ' + err.message);
    } else {
      showError('❌ Cannot connect to server. Make sure the backend is running on port 8080.');
    }
    console.error(err);
  } finally {
    setLoading(btn, false);
  }
}