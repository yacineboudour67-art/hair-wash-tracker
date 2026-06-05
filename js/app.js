// UI — reads from Store, writes to DOM

let dates = Store.load();

// ── Render ──────────────────────────────────────────────────
function render() {
  const days     = dates.length ? Store.daysBetween(dates[0], new Date()) : null;
  const status   = Store.canWash(dates);
  const today    = dates.some(d => Store.sameDay(d, new Date()));

  renderCard(days, status);
  renderButton(today);
  renderHistory();
}

function renderCard(days, status) {
  const card = document.getElementById('card');
  card.className = 'card ' + cardTheme(days, status);

  document.getElementById('cardContent').innerHTML = days === null
    ? `<div class="empty-icon">💧</div>
       <div class="empty-label">Aucun lavage enregistré</div>`
    : `<div class="days-num">${days}</div>
       <div class="days-lbl">${days <= 1 ? 'jour' : 'jours'} depuis le dernier lavage</div>`;

  document.getElementById('badge').innerHTML =
    `${status.ok ? '✅' : '❌'} ${status.reason}`;
}

function cardTheme(days, status) {
  if (days === null) return 'fresh';
  if (days >= 4)     return 'overdue';
  if (status.ok)     return 'ok';
  return 'warn';
}

function renderButton(alreadyToday) {
  const btn = document.getElementById('btnWash');
  btn.disabled = alreadyToday;
  document.getElementById('btnLabel').textContent = alreadyToday
    ? "Déjà enregistré aujourd'hui"
    : "J'ai lavé aujourd'hui !";
}

function renderHistory() {
  const section = document.getElementById('history');
  if (!dates.length) { section.innerHTML = ''; return; }

  section.innerHTML = `<div class="section-title">Historique</div>`
    + dates.map((d, i) => `
      <div class="history-item">
        <div class="history-icon">💧</div>
        <div class="history-info">
          <div class="history-date">${Store.formatDate(d)}</div>
          <div class="history-rel">${Store.relativeDate(d)}</div>
        </div>
        <button class="btn-delete" onclick="deleteWash(${i})" aria-label="Supprimer">🗑️</button>
      </div>`).join('');
}

// ── Actions ─────────────────────────────────────────────────
function washToday() {
  dates = Store.addWash(dates);
  render();
  showToast();
}

function deleteWash(i) {
  dates = Store.removeWash(dates, i);
  render();
}

// ── Modal ────────────────────────────────────────────────────
function openModal() {
  const picker = document.getElementById('picker');
  picker.max   = new Date().toISOString().slice(0, 10);
  picker.value = picker.max;
  document.getElementById('overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}

function overlayTap(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

function addPast() {
  const val = document.getElementById('picker').value;
  if (!val) return;
  dates = Store.addWash(dates, new Date(val + 'T12:00:00'));
  render();
  closeModal();
}

// ── Toast ────────────────────────────────────────────────────
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── Service worker ───────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}

// ── Init ─────────────────────────────────────────────────────
render();
setInterval(() => { dates = Store.load(); render(); }, 60_000);
