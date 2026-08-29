const AUTH_KEY = 'debt_manager_auth';
const LEGACY_DEBTS_KEY = 'debts';

let debts = [];
let lastPaymentTrigger = null;
let lastChargeTrigger = null;
let deleteTargetId = null;
let toastTimer = null;
let currentUser = null;
let keepAddingDebts = false;

const elements = {};

// Check authentication
function checkAuth() {
  let auth = null;
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    auth = stored ? JSON.parse(stored) : null;
  } catch {
    auth = null;
  }
  if (!auth || !auth.token) {
    window.location.href = 'login.html';
    return null;
  }
  return auth.user;
}

function clearAuthAndRedirect() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

async function api(path, options = {}) {
  let auth = null;
  try {
    auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    auth = null;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  let response;
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the server. Is it running?');
  }

  if (response.status === 401) {
    clearAuthAndRedirect();
    throw new Error('Please sign in.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

function logout() {
  if (confirm(t('sign_out') + '?')) {
    api('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  }
}

function cacheElements() {
  Object.assign(elements, {
    totalDebt: document.getElementById('totalDebt'),
    totalPaid: document.getElementById('totalPaid'),
    totalRemaining: document.getElementById('totalRemaining'),
    activeDebts: document.getElementById('activeDebts'),
    debtForm: document.getElementById('debtForm'),
    debtsList: document.getElementById('debtsList'),
    debtChart: document.getElementById('debtChart'),
    paymentChart: document.getElementById('paymentChart'),
    debtChartSummary: document.getElementById('debtChartSummary'),
    paymentChartSummary: document.getElementById('paymentChartSummary'),
    analyticsTableBody: document.getElementById('analyticsTableBody'),
    exportButton: document.getElementById('exportButton'),
    importButton: document.getElementById('importButton'),
    importFile: document.getElementById('importFile'),
    paymentModal: document.getElementById('paymentModal'),
    paymentForm: document.getElementById('paymentForm'),
    paymentDebtId: document.getElementById('paymentDebtId'),
    paymentAmount: document.getElementById('paymentAmount'),
    paymentDate: document.getElementById('paymentDate'),
    paymentNote: document.getElementById('paymentNote'),
    closePaymentModal: document.getElementById('closePaymentModal'),
    cancelPayment: document.getElementById('cancelPayment'),
    chargeModal: document.getElementById('chargeModal'),
    chargeForm: document.getElementById('chargeForm'),
    chargeDebtId: document.getElementById('chargeDebtId'),
    chargeAmount: document.getElementById('chargeAmount'),
    chargeDate: document.getElementById('chargeDate'),
    chargeNote: document.getElementById('chargeNote'),
    chargeModalTitle: document.getElementById('chargeModalTitle'),
    closeChargeModal: document.getElementById('closeChargeModal'),
    cancelCharge: document.getElementById('cancelCharge'),
    deleteModal: document.getElementById('deleteModal'),
    deleteModalMessage: document.getElementById('deleteModalMessage'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    toast: document.getElementById('toast'),
    logoutButton: document.getElementById('logoutButton')
  });
}

async function refreshDebts() {
  debts = await api('/api/debts');
  render();
}

// One-time move of debts saved in localStorage (old version) into the server database.
async function migrateLegacyDebts() {
  let stored = null;
  try {
    stored = localStorage.getItem(LEGACY_DEBTS_KEY);
  } catch {
    return;
  }
  if (!stored) return;

  let legacy = [];
  try {
    legacy = JSON.parse(stored);
  } catch {
    localStorage.removeItem(LEGACY_DEBTS_KEY);
    return;
  }
  if (!Array.isArray(legacy) || legacy.length === 0) {
    localStorage.removeItem(LEGACY_DEBTS_KEY);
    return;
  }

  let migrated = 0;
  for (const item of legacy) {
    try {
      const amount = Number(item.totalAmount ?? item.amount);
      const name = String(item.creditor || item.name || '').trim();
      if (!name || !Number.isFinite(amount) || amount <= 0) continue;
      const created = await api('/api/debts', {
        method: 'POST',
        body: { name, amount, notes: String(item.notes || '') }
      });
      const payments = Array.isArray(item.payments) ? item.payments : [];
      for (const payment of payments) {
        const paid = Number(payment.amount);
        if (!Number.isFinite(paid) || paid <= 0) continue;
        await api(`/api/debts/${created.id}/payments`, {
          method: 'POST',
          body: { amount: paid, date: payment.date, note: payment.note || '' }
        });
      }
      migrated += 1;
    } catch (error) {
      console.warn('Could not migrate a saved debt:', error);
    }
  }

  localStorage.removeItem(LEGACY_DEBTS_KEY);
  await refreshDebts();
  if (migrated > 0) {
    showToast(t('debts_migrated', { count: migrated }));
  }
}

function percent(value) {
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
}

function getTotalPaid(debt) {
  return debt.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function getTotalCharged(debt) {
  return debt.charges.reduce((sum, charge) => sum + charge.amount, 0);
}

function getRemainingBalance(debt) {
  return Math.max(0, debt.amount - getTotalPaid(debt));
}

function getProgress(debt) {
  return debt.amount > 0 ? (getTotalPaid(debt) / debt.amount) * 100 : 0;
}

function createSvgIcon(pathMarkup) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = pathMarkup;
  return svg;
}

function appendText(parent, text) {
  parent.appendChild(document.createTextNode(text));
}

function button(label, className, onClick, iconMarkup) {
  const control = document.createElement('button');
  control.type = 'button';
  control.className = `button ${className}`;
  if (iconMarkup) control.appendChild(createSvgIcon(iconMarkup));
  appendText(control, label);
  control.addEventListener('click', onClick);
  return control;
}

function render() {
  renderDebts();
  updateSummary();
  updateCharts();
}

function updateSummary() {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalPaid = debts.reduce((sum, debt) => sum + getTotalPaid(debt), 0);
  const totalRemaining = debts.reduce((sum, debt) => sum + getRemainingBalance(debt), 0);
  const activeDebts = debts.filter(debt => getRemainingBalance(debt) > 0).length;

  elements.totalDebt.textContent = money(totalDebt);
  elements.totalPaid.textContent = money(totalPaid);
  elements.totalRemaining.textContent = money(totalRemaining);
  elements.activeDebts.textContent = String(activeDebts);
}

function renderDebts() {
  elements.debtsList.replaceChildren();

  if (debts.length === 0) {
    elements.debtsList.appendChild(createEmptyState());
    return;
  }

  debts.forEach(debt => elements.debtsList.appendChild(createDebtCard(debt)));
}

function createEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.appendChild(createSvgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10h10"></path><path d="M7 6h10"></path><path d="M7 14h6"></path>'));

  const title = document.createElement('h2');
  title.textContent = t('no_debts');
  empty.appendChild(title);

  const description = document.createElement('p');
  description.textContent = t('no_debts_desc');
  empty.appendChild(description);

  const action = button(t('add_debt'), 'button-primary', () => activateTab('addPanel'), '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');
  empty.appendChild(action);
  return empty;
}

function createDebtCard(debt) {
  const paid = getTotalPaid(debt);
  const remaining = getRemainingBalance(debt);
  const progress = getProgress(debt);
  const isPaid = remaining <= 0;

  const card = document.createElement('article');
  card.className = `debt-card${isPaid ? ' paid' : ''}`;

  const header = document.createElement('div');
  header.className = 'debt-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'debt-title';
  const title = document.createElement('h2');
  title.textContent = debt.name;
  const subtitle = document.createElement('p');
  subtitle.textContent = t('customer_since', { date: formatDate(debt.createdAt) });
  titleWrap.append(title, subtitle);

  const status = document.createElement('span');
  status.className = `status-pill${isPaid ? ' paid' : ''}`;
  status.textContent = isPaid ? t('paid_off') : t('in_progress');

  header.append(titleWrap, status);
  card.appendChild(header);

  const details = document.createElement('div');
  details.className = 'debt-details';
  details.append(
    createDetail(t('original_amount'), money(debt.initialAmount)),
    createDetail(t('added_debt'), money(getTotalCharged(debt)), 'value-danger'),
    createDetail(t('paid_so_far'), money(paid), 'value-success'),
    createDetail(t('remaining_label'), money(remaining), isPaid ? 'value-success' : 'value-danger')
  );
  card.appendChild(details);

  const progressBlock = document.createElement('div');
  progressBlock.className = 'progress-block';
  const progressLabel = document.createElement('div');
  progressLabel.className = 'progress-label-row';
  progressLabel.innerHTML = `<span>${t('payoff_progress')}</span><span>${percent(progress)}</span>`;
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');
  progressBar.setAttribute('aria-valuenow', Math.min(100, Math.max(0, progress)).toFixed(0));
  progressBar.setAttribute('aria-label', `${debt.name} payoff progress`);
  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressFill.style.width = percent(progress);
  progressBar.appendChild(progressFill);
  progressBlock.append(progressLabel, progressBar);
  card.appendChild(progressBlock);

  if (debt.notes) {
    const notes = document.createElement('p');
    notes.className = 'debt-notes';
    notes.textContent = debt.notes;
    card.appendChild(notes);
  }

  const actions = document.createElement('div');
  actions.className = 'debt-actions';
  if (!isPaid) {
    actions.appendChild(button(t('add_payment'), 'button-primary button-small', event => openPaymentModal(debt.id, event.currentTarget), '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'));
  }
  actions.appendChild(button(t('add_more_debt'), 'button-secondary button-small', event => openChargeModal(debt.id, event.currentTarget), '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'));
  actions.appendChild(button(`${t('history')} (${debt.payments.length + debt.charges.length})`, 'button-secondary button-small', () => togglePaymentHistory(debt.id), '<path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path>'));
  actions.appendChild(button(t('delete'), 'button-danger button-small', () => openDeleteModal(debt.id), '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'));
  card.appendChild(actions);

  card.appendChild(createHistorySection(debt));
  return card;
}

function createDetail(label, value, valueClass = '') {
  const detail = document.createElement('div');
  detail.className = 'debt-detail';

  const labelEl = document.createElement('span');
  labelEl.className = 'debt-detail-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = `debt-detail-value ${valueClass}`.trim();
  valueEl.textContent = value;

  detail.append(labelEl, valueEl);
  return detail;
}

function createHistorySection(debt) {
  const history = document.createElement('section');
  history.className = 'payment-history';
  history.id = `history-${debt.id}`;
  history.hidden = true;

  const title = document.createElement('h3');
  title.textContent = t('history');
  history.appendChild(title);

  const entries = [
    ...debt.payments.map(payment => ({ ...payment, type: 'payment' })),
    ...debt.charges.map(charge => ({ ...charge, type: 'charge' }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = t('no_payments');
    history.appendChild(empty);
    return history;
  }

  const list = document.createElement('div');
  list.className = 'payment-items';
  entries.forEach(entry => {
    const item = document.createElement('div');
    item.className = `payment-item${entry.type === 'charge' ? ' is-charge' : ''}`;

    const date = document.createElement('span');
    date.textContent = formatDate(entry.date);
    const amount = document.createElement('strong');
    amount.textContent = `${entry.type === 'charge' ? '+' : '-'}${money(entry.amount)}`;
    const note = document.createElement('span');
    note.textContent = entry.note || (entry.type === 'charge' ? t('added_debt') : t('no_note'));

    item.append(date, amount, note);
    list.appendChild(item);
  });
  history.appendChild(list);
  return history;
}

function activateTab(panelId) {
  document.querySelectorAll('[role="tab"]').forEach(tab => {
    const isActive = tab.dataset.tab === panelId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
    const isActive = panel.id === panelId;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });

  if (panelId === 'analyticsPanel') updateCharts();
}

async function addDebt(event) {
  event.preventDefault();
  if (!elements.debtForm.reportValidity()) return;

  const name = document.getElementById('creditorName').value.trim();
  const amount = Number(document.getElementById('totalAmount').value);
  const notes = document.getElementById('notes').value.trim();

  if (!name) {
    showToast(t('customer_name') + ' ' + t('required'));
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast(t('debt_amount') + ': ' + t('invalid_amount'));
    return;
  }

  try {
    await api('/api/debts', { method: 'POST', body: { name, amount, notes } });
    elements.debtForm.reset();
    await refreshDebts();
    showToast(t('debt_added'));
    if (keepAddingDebts) {
      keepAddingDebts = false;
      document.getElementById('creditorName').focus();
    } else {
      activateTab('debtsPanel');
    }
  } catch (error) {
    showToast(error.message);
  }
}

function openPaymentModal(debtId, trigger) {
  lastPaymentTrigger = trigger;
  elements.paymentDebtId.value = String(debtId);
  elements.paymentDate.valueAsDate = new Date();
  elements.paymentModal.hidden = false;
  setTimeout(() => elements.paymentAmount.focus(), 0);
}

function closePaymentModal() {
  elements.paymentModal.hidden = true;
  elements.paymentForm.reset();
  if (lastPaymentTrigger) {
    lastPaymentTrigger.focus();
    lastPaymentTrigger = null;
  }
}

async function recordPayment(event) {
  event.preventDefault();
  if (!elements.paymentForm.reportValidity()) return;

  const debtId = Number(elements.paymentDebtId.value);
  if (!debts.some(debt => debt.id === debtId)) {
    showToast('Could not find that customer.');
    return;
  }

  const body = {
    amount: Number(elements.paymentAmount.value),
    date: elements.paymentDate.value,
    note: elements.paymentNote.value.trim()
  };

  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    showToast(t('invalid_amount'));
    return;
  }

  try {
    const updated = await api(`/api/debts/${debtId}/payments`, { method: 'POST', body });
    debts = debts.map(debt => (debt.id === updated.id ? updated : debt));
    closePaymentModal();
    render();
    showToast(t('payment_recorded'));
  } catch (error) {
    showToast(error.message);
  }
}

function openChargeModal(debtId, trigger) {
  const debt = debts.find(item => item.id === debtId);
  if (!debt) return;

  lastChargeTrigger = trigger;
  elements.chargeDebtId.value = String(debtId);
  elements.chargeModalTitle.textContent = `${t('add_more_debt')} — ${debt.name}`;
  elements.chargeDate.valueAsDate = new Date();
  elements.chargeModal.hidden = false;
  setTimeout(() => elements.chargeAmount.focus(), 0);
}

function closeChargeModal() {
  elements.chargeModal.hidden = true;
  elements.chargeForm.reset();
  if (lastChargeTrigger) {
    lastChargeTrigger.focus();
    lastChargeTrigger = null;
  }
}

async function submitCharge(event) {
  event.preventDefault();
  if (!elements.chargeForm.reportValidity()) return;

  const debtId = Number(elements.chargeDebtId.value);
  if (!debts.some(debt => debt.id === debtId)) {
    showToast('Could not find that customer.');
    return;
  }

  const body = {
    amount: Number(elements.chargeAmount.value),
    date: elements.chargeDate.value,
    note: elements.chargeNote.value.trim()
  };

  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    showToast(t('invalid_amount'));
    return;
  }

  try {
    const updated = await api(`/api/debts/${debtId}/charge`, { method: 'POST', body });
    debts = debts.map(debt => (debt.id === updated.id ? updated : debt));
    closeChargeModal();
    render();
    showToast(t('charge_added'));
  } catch (error) {
    showToast(error.message);
  }
}

function togglePaymentHistory(debtId) {
  const history = document.getElementById(`history-${debtId}`);
  if (history) history.hidden = !history.hidden;
}

function openDeleteModal(debtId) {
  const debt = debts.find(item => item.id === debtId);
  if (!debt) return;

  deleteTargetId = debtId;
  elements.deleteModalMessage.textContent = t('delete_customer_message', {
    name: debt.name,
    paid: money(getTotalPaid(debt))
  });
  elements.deleteModal.hidden = false;
  setTimeout(() => elements.confirmDelete.focus(), 0);
}

function closeDeleteModal() {
  elements.deleteModal.hidden = true;
  deleteTargetId = null;
}

async function deleteCustomer() {
  if (deleteTargetId == null) return;

  try {
    await api(`/api/debts/${deleteTargetId}`, { method: 'DELETE' });
    debts = debts.filter(debt => debt.id !== deleteTargetId);
    closeDeleteModal();
    render();
    showToast(t('debt_deleted'));
  } catch (error) {
    showToast(error.message);
  }
}

function exportData() {
  const dataStr = JSON.stringify(debts, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `debt_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(t('data_exported'));
}

async function importData(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async readerEvent => {
    let imported;
    try {
      imported = JSON.parse(readerEvent.target.result);
      if (!Array.isArray(imported)) throw new Error('The file must contain an array of debts.');
    } catch (error) {
      showToast(`Import failed: ${error.message}`);
      return;
    }

    if (!confirm(t('import_confirm'))) return;

    let imported_count = 0;
    try {
      for (const item of imported) {
        const name = String(item.name || item.creditor || '').trim();
        const amount = Number(item.amount ?? item.totalAmount);
        if (!name || !Number.isFinite(amount) || amount <= 0) continue;

        const created = await api('/api/debts', {
          method: 'POST',
          body: { name, amount, notes: String(item.notes || '') }
        });

        const payments = Array.isArray(item.payments) ? item.payments : [];
        for (const payment of payments) {
          const paid = Number(payment.amount);
          if (!Number.isFinite(paid) || paid <= 0) continue;
          await api(`/api/debts/${created.id}/payments`, {
            method: 'POST',
            body: { amount: paid, date: payment.date, note: payment.note || '' }
          });
        }
        imported_count += 1;
      }
      await refreshDebts();
      showToast(`${t('data_imported')} (${imported_count})`);
    } catch (error) {
      showToast(`Import failed: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function updateCharts() {
  updateDebtChart();
  updatePaymentChart();
  updateAnalyticsTable();
}

function setupCanvas(canvas, cssHeight = 300) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width || canvas.parentElement.clientWidth || 320));
  canvas.width = width * ratio;
  canvas.height = cssHeight * ratio;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, cssHeight);
  return { ctx, width, height: cssHeight };
}

function chartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue('--text').trim(),
    muted: styles.getPropertyValue('--text-muted').trim(),
    border: styles.getPropertyValue('--border').trim(),
    surfaceMuted: styles.getPropertyValue('--surface-muted').trim(),
    primary: styles.getPropertyValue('--primary').trim(),
    success: styles.getPropertyValue('--success').trim(),
    danger: styles.getPropertyValue('--danger').trim()
  };
}

function updateDebtChart() {
  const { ctx, width, height } = setupCanvas(elements.debtChart);
  const colors = chartColors();

  if (debts.length === 0) {
    drawCenteredMessage(ctx, width, height, t('no_debt_data'), colors.muted);
    elements.debtChartSummary.textContent = t('no_debts');
    return;
  }

  const maxDebt = Math.max(...debts.map(debt => debt.amount), 1);
  const chartTop = 42;
  const chartBottom = height - 56;
  const chartHeight = chartBottom - chartTop;
  const left = 24;
  const usableWidth = width - 48;
  const barWidth = Math.max(24, Math.min(64, usableWidth / debts.length - 12));
  const gap = debts.length > 1 ? (usableWidth - barWidth * debts.length) / (debts.length - 1) : 0;

  ctx.fillStyle = colors.success;
  ctx.fillRect(left, 12, 12, 12);
  ctx.fillStyle = colors.text;
  ctx.font = '13px Inter, system-ui, sans-serif';
  ctx.fillText(t('paid_legend'), left + 18, 23);
  ctx.fillStyle = colors.danger;
  ctx.fillRect(left + 78, 12, 12, 12);
  ctx.fillStyle = colors.text;
  ctx.fillText(t('remaining_legend'), left + 96, 23);

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, chartBottom + 0.5);
  ctx.lineTo(width - left, chartBottom + 0.5);
  ctx.stroke();

  debts.forEach((debt, index) => {
    const paid = getTotalPaid(debt);
    const remaining = getRemainingBalance(debt);
    const x = left + index * (barWidth + gap);
    const paidHeight = Math.max(0, (paid / maxDebt) * chartHeight);
    const remainingHeight = Math.max(0, (remaining / maxDebt) * chartHeight);
    const bottom = chartBottom;

    ctx.fillStyle = colors.danger;
    roundRect(ctx, x, bottom - paidHeight - remainingHeight, barWidth, remainingHeight, 4);
    ctx.fill();

    ctx.fillStyle = colors.success;
    roundRect(ctx, x, bottom - paidHeight, barWidth, paidHeight, 4);
    ctx.fill();

    ctx.fillStyle = colors.muted;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(debt.name.slice(0, 12), x + barWidth / 2, height - 30);
    ctx.fillText(money(remaining), x + barWidth / 2, height - 12);
    ctx.textAlign = 'left';
  });

  const remainingTotal = debts.reduce((sum, debt) => sum + getRemainingBalance(debt), 0);
  const key = debts.length === 1 ? 'debts_tracked' : 'debts_tracked_plural';
  elements.debtChartSummary.textContent = t(key, { count: debts.length, amount: money(remainingTotal) });
}

function updatePaymentChart() {
  const { ctx, width, height } = setupCanvas(elements.paymentChart);
  const colors = chartColors();
  const payments = debts.flatMap(debt => debt.payments.map(payment => ({
    date: new Date(payment.date),
    amount: payment.amount
  }))).filter(payment => !Number.isNaN(payment.date.getTime()))
    .sort((a, b) => a.date - b.date);

  if (payments.length === 0) {
    drawCenteredMessage(ctx, width, height, t('no_payment_history'), colors.muted);
    elements.paymentChartSummary.textContent = t('no_payment_history');
    return;
  }

  let cumulative = 0;
  const points = payments.map(payment => {
    cumulative += payment.amount;
    return { date: payment.date, total: cumulative };
  });

  const maxAmount = Math.max(...points.map(point => point.total), 1);
  const left = 48;
  const right = width - 24;
  const top = 24;
  const bottom = height - 44;
  const chartWidth = right - left;
  const chartHeight = bottom - top;

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = top + (chartHeight / 3) * i;
    ctx.beginPath();
    ctx.moveTo(left, y + 0.5);
    ctx.lineTo(right, y + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = left + (points.length === 1 ? 0 : (index / (points.length - 1)) * chartWidth);
    const y = bottom - (point.total / maxAmount) * chartHeight;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = colors.primary;
  points.forEach((point, index) => {
    const x = left + (points.length === 1 ? 0 : (index / (points.length - 1)) * chartWidth);
    const y = bottom - (point.total / maxAmount) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = colors.muted;
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(money(maxAmount), 0, top + 5);
  ctx.fillText(money(0), 0, bottom + 4);
  ctx.textAlign = 'center';
  ctx.fillText(t('cumulative_payments'), width / 2, height - 12);
  ctx.textAlign = 'left';

  const key = payments.length === 1 ? 'payments_recorded' : 'payments_recorded_plural';
  elements.paymentChartSummary.textContent = t(key, { count: payments.length, amount: money(cumulative) });
}

function drawCenteredMessage(ctx, width, height, message, color) {
  ctx.fillStyle = color;
  ctx.font = '16px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, width / 2, height / 2);
  ctx.textAlign = 'left';
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeHeight = Math.max(0, height);
  if (safeHeight === 0) return;
  const safeRadius = Math.min(radius, width / 2, safeHeight / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + safeHeight, safeRadius);
  ctx.arcTo(x + width, y + safeHeight, x, y + safeHeight, safeRadius);
  ctx.arcTo(x, y + safeHeight, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function updateAnalyticsTable() {
  elements.analyticsTableBody.replaceChildren();

  if (debts.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = t('no_debt_data');
    row.appendChild(cell);
    elements.analyticsTableBody.appendChild(row);
    return;
  }

  debts.forEach(debt => {
    const row = document.createElement('tr');
    [
      debt.name,
      money(debt.amount),
      money(getTotalPaid(debt)),
      money(getRemainingBalance(debt)),
      String(debt.payments.length)
    ].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    elements.analyticsTableBody.appendChild(row);
  });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 3500);
}

function anyModalOpen() {
  return [elements.paymentModal, elements.chargeModal, elements.deleteModal].some(modal => modal && !modal.hidden);
}

function closeOpenModals() {
  if (!elements.paymentModal.hidden) closePaymentModal();
  if (!elements.chargeModal.hidden) closeChargeModal();
  if (!elements.deleteModal.hidden) closeDeleteModal();
}

function wireEvents() {
  elements.debtForm.addEventListener('submit', addDebt);
  elements.paymentForm.addEventListener('submit', recordPayment);
  elements.chargeForm.addEventListener('submit', submitCharge);
  elements.closePaymentModal.addEventListener('click', closePaymentModal);
  elements.cancelPayment.addEventListener('click', closePaymentModal);
  elements.closeChargeModal.addEventListener('click', closeChargeModal);
  elements.cancelCharge.addEventListener('click', closeChargeModal);
  elements.closeDeleteModal.addEventListener('click', closeDeleteModal);
  elements.cancelDelete.addEventListener('click', closeDeleteModal);
  elements.confirmDelete.addEventListener('click', deleteCustomer);
  elements.exportButton.addEventListener('click', exportData);
  elements.importButton.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importData);
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logout);
  }

  const addAnotherButton = document.getElementById('addAnotherButton');
  if (addAnotherButton) {
    addAnotherButton.addEventListener('click', () => {
      keepAddingDebts = true;
      if (elements.debtForm.requestSubmit) {
        elements.debtForm.requestSubmit();
      } else {
        elements.debtForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  document.querySelectorAll('[role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const currentIndex = tabs.indexOf(event.currentTarget);
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!direction) return;
      event.preventDefault();
      const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
      activateTab(nextTab.dataset.tab);
      nextTab.focus();
    });
  });

  elements.paymentModal.addEventListener('click', event => {
    if (event.target === elements.paymentModal) closePaymentModal();
  });
  elements.chargeModal.addEventListener('click', event => {
    if (event.target === elements.chargeModal) closeChargeModal();
  });
  elements.deleteModal.addEventListener('click', event => {
    if (event.target === elements.deleteModal) closeDeleteModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && anyModalOpen()) closeOpenModals();
  });

  window.addEventListener('resize', debounce(updateCharts, 120));
}

function debounce(callback, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  currentUser = checkAuth();
  if (!currentUser) return;

  initializePreferences();
  cacheElements();
  wireEvents();
  render();

  refreshDebts()
    .then(migrateLegacyDebts)
    .catch(error => showToast(error.message));
});
