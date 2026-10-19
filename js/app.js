/* ============================================================
   ARCANA FINANCE — app logic
   State disimpan di localStorage (key: arcanaFinance.v1)
   Chart.js dimuat dari CDN; grafik digambar ulang tiap render.
   ============================================================ */

const CATEGORIES = [
  { id: 'empress',  name: 'THE EMPRESS',  life: 'Makanan & minuman',  color: '#e60012', budget: 1500000 },
  { id: 'chariot',  name: 'THE CHARIOT',  life: 'Transportasi',       color: '#3b5bff', budget: 500000 },
  { id: 'sun',      name: 'THE SUN',      life: 'Hiburan',            color: '#f5a623', budget: 500000 },
  { id: 'moon',     name: 'THE MOON',     life: 'Langganan',          color: '#7b5cff', budget: 300000 },
  { id: 'magician', name: 'THE MAGICIAN', life: 'Belajar & skill',    color: '#00b8d4', budget: 300000 },
  { id: 'star',     name: 'THE STAR',     life: 'Tabungan',           color: '#2ecc71', budget: 0 },
  { id: 'tower',    name: 'THE TOWER',    life: 'Darurat',            color: '#55555e', budget: 0 },
  { id: 'fool',     name: 'THE FOOL',     life: 'Lainnya',            color: '#b8b4a8', budget: 500000 },
];

const STORE_KEY = 'arcanaFinance.v1';
const $ = sel => document.querySelector(sel);

const fmtIDR = new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
});

/* ---------- state ---------- */
let state = loadState();
let txType = 'expense';

function defaultState() {
  const budgets = {};
  CATEGORIES.forEach(c => { budgets[c.id] = c.budget; });
  return { txs: [], budgets, month: currentMonth() };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = Object.assign(defaultState(), JSON.parse(raw));
    // pastikan semua kategori punya budget (tahan terhadap perubahan daftar)
    CATEGORIES.forEach(c => { if (s.budgets[c.id] == null) s.budgets[c.id] = c.budget; });
    return s;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- helpers ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function currentMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function shiftMonth(m, delta) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function monthLabel(m) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase();
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function catById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function monthTxs() {
  return state.txs.filter(t => t.date.slice(0, 7) === state.month);
}

function spentByCat(month) {
  const map = {};
  CATEGORIES.forEach(c => { map[c.id] = 0; });
  state.txs.forEach(t => {
    if (t.type === 'expense' && t.date.slice(0, 7) === month) {
      map[t.cat] = (map[t.cat] || 0) + t.amount;
    }
  });
  return map;
}

/* ---------- actions ---------- */
function addTx(type, amount, cat, note, date) {
  const before = spentByCat(state.month)[cat] || 0;
  state.txs.push({ id: uid(), type, amount, cat, note, date });
  saveState();
  // Tower falls: pengeluaran kategori ini baru saja melewati budget
  if (type === 'expense' && date.slice(0, 7) === state.month) {
    const budget = state.budgets[cat] || 0;
    if (budget > 0 && before <= budget && before + amount > budget) {
      flashTower();
    }
  }
  render();
}

function deleteTx(id) {
  state.txs = state.txs.filter(t => t.id !== id);
  saveState();
  render();
}

/* ---------- render ---------- */
let charts = {};

function render() {
  renderMonthLabel();
  renderSummary();
  renderBudgets();
  renderHistory();
  renderCharts();
}

function renderMonthLabel() {
  $('#monthLabel').textContent = monthLabel(state.month);
}

function renderSummary() {
  const txs = monthTxs();
  const income = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  $('#sumIncome').textContent = fmtIDR.format(income);
  $('#sumExpense').textContent = fmtIDR.format(expense);
  const bal = $('#sumBalance');
  bal.textContent = fmtIDR.format(income - expense);
  bal.style.color = income - expense < 0 ? '#e60012' : '#1e9e54';
}

function renderBudgets() {
  const spent = spentByCat(state.month);
  $('#budgets').innerHTML = CATEGORIES.map(c => {
    const budget = state.budgets[c.id] || 0;
    const used = spent[c.id] || 0;
    const pct = budget > 0 ? Math.min(100, (used / budget) * 100) : (used > 0 ? 100 : 0);
    const over = budget > 0 && used > budget;
    return (
      '<div class="budget-card' + (over ? ' over' : '') + '">' +
        '<div class="budget-top">' +
          '<span class="budget-dot" style="background:' + c.color + '"></span>' +
          '<span class="budget-name">' + c.name + '</span>' +
          '<input class="budget-input" type="number" min="0" step="50000" data-cat="' + c.id + '" value="' + budget + '" title="Budget bulanan (Rp)" aria-label="Budget ' + c.name + '">' +
        '</div>' +
        '<div class="budget-bar"><div class="budget-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="budget-meta"><span>' + fmtIDR.format(used) + ' terpakai</span><span>dari ' + fmtIDR.format(budget) + '</span></div>' +
      '</div>'
    );
  }).join('');

  document.querySelectorAll('.budget-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const v = Math.max(0, parseInt(inp.value, 10) || 0);
      state.budgets[inp.dataset.cat] = v;
      inp.value = v;
      saveState();
      renderBudgets();
    });
  });
}

function renderHistory() {
  const txs = monthTxs().sort((a, b) => b.date.localeCompare(a.date) || 0);
  $('#txEmpty').style.display = txs.length ? 'none' : 'block';
  $('#txList').innerHTML = txs.map(t => {
    const c = catById(t.cat);
    const inTx = t.type === 'income';
    const dateFmt = new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    return (
      '<li class="tx-item">' +
        '<span class="tx-sign ' + (inTx ? 'in' : 'out') + '">' + (inTx ? '+' : '−') + '</span>' +
        '<div class="tx-main">' +
          '<div class="tx-note">' + esc(t.note || c.name) + '</div>' +
          '<div class="tx-sub">' + c.name + ' · ' + dateFmt + '</div>' +
        '</div>' +
        '<span class="tx-amount ' + (inTx ? 'in' : 'out') + '">' + fmtIDR.format(t.amount) + '</span>' +
        '<button class="tx-del" data-id="' + t.id + '" aria-label="Hapus transaksi">&times;</button>' +
      '</li>'
    );
  }).join('');
}

/* ---------- charts ---------- */
function chartReady() {
  return typeof window.Chart !== 'undefined';
}

function baseOptions(extra) {
  return Object.assign({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { boxWidth: 12, padding: 14 } } },
  }, extra || {});
}

function applyDarkTheme() {
  Chart.defaults.color = '#d8d8de';
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.borderColor = 'rgba(255,255,255,.08)';
}

function destroyCharts() {
  Object.values(charts).forEach(ch => { try { ch.destroy(); } catch (e) {} });
  charts = {};
}

function renderCharts() {
  destroyCharts();
  if (!chartReady()) {
    document.querySelectorAll('.chart-wrap').forEach(w => {
      w.innerHTML = '<p class="chart-empty">Grafik membutuhkan koneksi internet (Chart.js CDN).</p>';
    });
    return;
  }
  applyDarkTheme();
  renderDonut();
  renderBar();
  renderLine();
}

function renderDonut() {
  const spent = spentByCat(state.month);
  const cats = CATEGORIES.filter(c => spent[c.id] > 0);
  $('#donutEmpty').classList.toggle('hidden', cats.length > 0);
  if (!cats.length) return;
  charts.donut = new Chart($('#chartDonut'), {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c.name),
      datasets: [{
        data: cats.map(c => spent[c.id]),
        backgroundColor: cats.map(c => c.color),
        borderColor: '#111114',
        borderWidth: 3,
      }],
    },
    options: baseOptions({
      cutout: '58%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ' ' + fmtIDR.format(ctx.parsed) } },
      },
    }),
  });
}

function renderBar() {
  const days = [];
  for (let i = -6; i <= 0; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days.push({
      iso,
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      total: state.txs.filter(t => t.type === 'expense' && t.date === iso).reduce((a, t) => a + t.amount, 0),
    });
  }
  charts.bar = new Chart($('#chartBar'), {
    type: 'bar',
    data: {
      labels: days.map(d => d.label),
      datasets: [{
        data: days.map(d => d.total),
        backgroundColor: days.map((d, i) => i === 6 ? '#e60012' : 'rgba(230,0,18,.45)'),
        borderColor: '#000',
        borderWidth: 2,
      }],
    },
    options: baseOptions({
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + fmtIDR.format(ctx.parsed.y) } },
      },
      scales: {
        y: { ticks: { callback: v => v >= 1000000 ? (v / 1000000) + 'jt' : v >= 1000 ? (v / 1000) + 'rb' : v } },
      },
    }),
  });
}

function renderLine() {
  const [y, mo] = state.month.split('-').map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const labels = [];
  const cumulative = [];
  let run = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = state.month + '-' + String(d).padStart(2, '0');
    const dayTxs = state.txs.filter(t => t.date === iso);
    const net = dayTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
              - dayTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    run += net;
    labels.push(d);
    cumulative.push(run);
  }
  charts.line = new Chart($('#chartLine'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Saldo kumulatif',
        data: cumulative,
        borderColor: '#e60012',
        backgroundColor: 'rgba(230,0,18,.15)',
        fill: true,
        tension: 0.25,
        pointRadius: 2,
        pointBackgroundColor: '#e60012',
        borderWidth: 3,
      }],
    },
    options: baseOptions({
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + fmtIDR.format(ctx.parsed.y) } },
      },
      scales: {
        y: { ticks: { callback: v => (v < 0 ? '−' : '') + 'Rp' + Math.abs(v) / 1000000 + 'jt' } },
        x: { ticks: { maxTicksLimit: 10 } },
      },
    }),
  });
}

/* ---------- tower flash ---------- */
let flashTimer = null;
function flashTower() {
  const f = $('#flash');
  f.classList.remove('show');
  void f.offsetWidth;
  f.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => f.classList.remove('show'), 1500);
}

/* ---------- init ---------- */
function init() {
  // dropdown kategori
  $('#txCat').innerHTML = CATEGORIES.map(c =>
    '<option value="' + c.id + '">' + c.name + ' — ' + esc(c.life) + '</option>'
  ).join('');
  $('#txDate').value = todayISO();

  // toggle tipe
  document.querySelectorAll('.type-chip').forEach(ch => {
    ch.addEventListener('click', () => {
      txType = ch.dataset.type;
      document.querySelectorAll('.type-chip').forEach(x =>
        x.classList.toggle('active', x === ch));
    });
  });

  // tambah transaksi
  $('#txForm').addEventListener('submit', e => {
    e.preventDefault();
    const amount = Math.floor(Number($('#txAmount').value));
    if (!amount || amount <= 0) return;
    addTx(txType, amount, $('#txCat').value, $('#txNote').value.trim(), $('#txDate').value || todayISO());
    $('#txAmount').value = '';
    $('#txNote').value = '';
    $('#txDate').value = todayISO();
    $('#txAmount').focus();
  });

  // hapus transaksi (delegation)
  $('#txList').addEventListener('click', e => {
    const btn = e.target.closest('.tx-del');
    if (btn) deleteTx(btn.dataset.id);
  });

  // navigasi bulan
  $('#btnPrevMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); saveState(); render(); });
  $('#btnNextMonth').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); saveState(); render(); });

  render();
}

document.addEventListener('DOMContentLoaded', init);
