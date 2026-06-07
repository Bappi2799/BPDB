// ===== State =====
let tokens = [];
let currentIndex = -1;
let doneTokens = new Set();
let startSequence = 0;
let meterInfo = {};
let rawInput = '';

// ===== Storage Keys =====
const STORAGE_KEY = 'tokenSorter_state';
const THEME_KEY = 'tokenSorter_theme';

// ===== Token Parsing =====

function parseInput(input) {
  rawInput = input;

  // Token extraction — standard 20-digit format: XXXX-XXXX-XXXX-XXXX-XXXX
  const tokenRegex = /\b(\d{4}-\d{4}-\d{4}-\d{4}-\d{4})\b/g;
  const tokenMatches = input.match(tokenRegex);
  const rawTokens = tokenMatches || [];

  // Deduplicate while preserving order
  const seen = new Set();
  tokens = rawTokens.filter(t => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  // Sequence number extraction — handles SeqNo:, SquNo:, Seq- formats
  // Supports negative numbers and range notation (e.g., SquNo:-1~9)
  const seqRegex = /S(?:eq|qu)No:(-?\d+)(?:~\d+)?|Seq-(\d+)/i;
  const seqMatch = input.match(seqRegex);
  startSequence = 0;
  if (seqMatch) {
    startSequence = parseInt(seqMatch[1] || seqMatch[2], 10);
  }

  // Meter info extraction
  meterInfo = extractMeterInfo(input);

  return startSequence;
}

function extractMeterInfo(input) {
  const info = {};

  const patterns = [
    { key: 'meterNo',       regex: /Meter\s*No[:\s]*(\d+)/i,              label: 'Meter No' },
    { key: 'vendingAmt',    regex: /Vending\s*Amt[:\s]*([\d,.]+)/i,       label: 'Vending Amount' },
    { key: 'enrgCost',      regex: /Enrg\s*Cost[:\s]*([\d,.]+)/i,        label: 'Energy Cost' },
    { key: 'totalCharge',   regex: /Total\s*Charge[:\s]*([\d,.]+)/i,     label: 'Total Charge' },
    { key: 'meterRent',     regex: /Meter\s*Rent\s*\w*[:\s]*([\d,.]+)/i, label: 'Meter Rent' },
    { key: 'demandCharge',  regex: /Demand\s*Charge[:\s]*([\d,.]+)/i,    label: 'Demand Charge' },
    { key: 'vat',           regex: /VAT[:\s]*([\d,.]+)/i,                 label: 'VAT' },
    { key: 'rebate',        regex: /Rebate[:\s]*([-\d,.]+)/i,            label: 'Rebate' },
  ];

  for (const { key, regex, label } of patterns) {
    const match = input.match(regex);
    if (match) {
      info[key] = { value: match[1].replace(/,+$/, ''), label };
    }
  }

  return info;
}

// ===== Display =====

function displayToken(index) {
  const tokenNumberBox = document.getElementById('tokenNumberBox');
  const tokenSeqLabel = document.getElementById('tokenSeqLabel');
  const stepBadge = document.getElementById('currentStepBadge');
  const tokenDisplay = document.getElementById('tokenDisplay');

  if (tokens.length === 0 || index < 0 || index >= tokens.length) {
    if (tokenDisplay) tokenDisplay.hidden = true;
    return;
  }

  const formattedToken = tokens[index].split('-').join(' - ');
  const seq = index + startSequence;
  tokenNumberBox.textContent = formattedToken;
  if (tokenSeqLabel) tokenSeqLabel.textContent = `Seq ${seq}`;
  if (stepBadge) stepBadge.textContent = String(index + 1);

  tokenDisplay.hidden = false;

  document.getElementById('prevToken').disabled = index === 0;
  document.getElementById('nextToken').disabled = index === tokens.length - 1;

  updateProgress();
  updateTable();
  saveState();
}

// ===== Table =====

function createTable() {
  const tableContainer = document.getElementById('tokenTableContainer');
  let tableHTML = '<table class="token-table">';
  tableHTML += '<thead><tr><th class="col-seq">Seq</th><th class="col-token">Token</th><th class="col-state"></th></tr></thead>';
  tableHTML += '<tbody>';
  tokens.forEach((token, index) => {
    const seq = index + startSequence;
    tableHTML += `<tr id="tokenRow-${index}" data-index="${index}" class="clickable-row">`;
    tableHTML += `<td class="seq-cell">${seq}</td>`;
    tableHTML += `<td class="token-cell">${token}</td>`;
    tableHTML += `<td class="state-cell"><span class="state-dot" data-state="pending"></span></td>`;
    tableHTML += `</tr>`;
  });
  tableHTML += '</tbody></table>';
  tableContainer.innerHTML = tableHTML;

  // Add click handlers to rows
  document.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.index, 10);
      jumpToToken(idx);
    });
  });
}

function updateTable() {
  const rows = document.querySelectorAll('#tokenTableContainer table tbody tr');
  if (!rows.length) return;

  rows.forEach((row, index) => {
    row.classList.remove('current-token', 'done-token');
    const dot = row.querySelector('.state-dot');
    if (dot) {
      if (doneTokens.has(index)) {
        dot.dataset.state = 'done';
        dot.title = 'Completed';
      } else if (index === currentIndex) {
        dot.dataset.state = 'current';
        dot.title = 'Current';
      } else {
        dot.dataset.state = 'pending';
        dot.title = 'Pending';
      }
    }
  });

  if (currentIndex >= 0 && currentIndex < tokens.length) {
    const currentRow = rows[currentIndex];
    currentRow.classList.add('current-token');
    const dot = currentRow.querySelector('.state-dot');
    if (dot) {
      dot.dataset.state = 'current';
      dot.title = 'Current';
    }

    // Scroll current row into view within the table
    currentRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function jumpToToken(index) {
  if (index < 0 || index >= tokens.length) return;
  currentIndex = index;
  displayToken(currentIndex);
}

function resetProgress() {
  doneTokens.clear();
  currentIndex = 0;
  displayToken(currentIndex);
  showToast('Progress reset');
}

// ===== Progress =====

function updateProgress() {
  const progressBar = document.getElementById('progressBarFill');
  const progressText = document.getElementById('progressText');

  if (!progressBar || !progressText || tokens.length === 0) return;

  const done = doneTokens.size;
  const total = tokens.length;
  const percent = Math.round((done / total) * 100);

  progressBar.style.width = percent + '%';
  progressBar.setAttribute('aria-valuenow', String(percent));
  progressText.textContent = `${done} / ${total} (${percent}%)`;
}

// ===== Meter Info Panel =====

function displayMeterInfo() {
  const panel = document.getElementById('meterInfoPanel');
  const content = document.getElementById('meterInfoContent');

  if (!panel || !content) return;

  if (Object.keys(meterInfo).length === 0) {
    panel.hidden = true;
    return;
  }

  let html = '';
  for (const { value, label } of Object.values(meterInfo)) {
    html += `<div class="meter-info-item">`;
    html += `<span class="meter-info-label">${label}</span>`;
    html += `<span class="meter-info-value">${value}</span>`;
    html += `</div>`;
  }
  content.innerHTML = html;
  panel.hidden = false;
}

// ===== Clipboard =====

async function copyCurrentToken() {
  if (currentIndex < 0 || currentIndex >= tokens.length) return;

  const token = tokens[currentIndex];
  try {
    await navigator.clipboard.writeText(token);
    showToast('Token copied to clipboard!');
  } catch {
    // Fallback for older browsers / non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = token;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Token copied!');
  }
}

// ===== Toast =====

function showToast(message, duration = 2500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== Persistence =====

function saveState() {
  try {
    const state = {
      tokens,
      currentIndex,
      doneTokens: [...doneTokens],
      startSequence,
      meterInfo,
      rawInput,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full or unavailable */ }
}

function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function restoreFromState(state) {
  if (!state || !state.tokens || state.tokens.length === 0) return false;

  tokens = state.tokens;
  currentIndex = state.currentIndex || 0;
  doneTokens = new Set(state.doneTokens || []);
  startSequence = state.startSequence || 0;
  meterInfo = state.meterInfo || {};
  rawInput = state.rawInput || '';

  // Restore UI
  document.getElementById('tokenInput').value = rawInput;
  createTable();
  displayMeterInfo();
  displayToken(currentIndex);

  showStartUI();
  showToast('Session restored — pick up where you left off!');
  return true;
}

function showStartUI() {
  document.getElementById('resultSection').hidden = false;
  document.getElementById('newToken').hidden = false;
  // Smooth scroll to the result section
  setTimeout(() => {
    const result = document.getElementById('resultSection');
    if (result) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ===== Dark Mode =====

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    document.body.classList.add('dark-mode');
  }
  updateThemeIcon();
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-mode');
  btn.innerHTML = isDark
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
}

// ===== PWA / Service Worker =====

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(() => { /* SW registration failed silently */ });
  }
}

// ===== Keyboard Shortcuts =====

function safeClick(id) {
  const el = document.getElementById(id);
  if (el && !el.hidden && !el.disabled) el.click();
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in textarea or input
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        safeClick('nextToken');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        safeClick('prevToken');
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        copyCurrentToken();
        break;
      case 'n':
      case 'N':
        e.preventDefault();
        safeClick('newToken');
        break;
    }
  });
}

// ===== Event Handlers =====

function initEventHandlers() {
  // Start button
  document.getElementById('startButton').addEventListener('click', handleStart);

  // New token
  document.getElementById('newToken').addEventListener('click', handleNewToken);

  // Navigation
  document.getElementById('nextToken').addEventListener('click', handleNext);
  document.getElementById('prevToken').addEventListener('click', handlePrev);

  // Reset
  document.getElementById('resetProgress').addEventListener('click', resetProgress);

  // Copy
  document.getElementById('copyToken').addEventListener('click', copyCurrentToken);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Resume / discard session
  document.getElementById('resumeSession').addEventListener('click', handleResume);
  document.getElementById('discardSession').addEventListener('click', handleDiscard);
}

function handleStart() {
  const input = document.getElementById('tokenInput').value.trim();
  const warningDiv = document.getElementById('warning');

  warningDiv.hidden = true;

  if (!input) {
    warningDiv.textContent = 'Please paste a token message first.';
    warningDiv.hidden = false;
    return;
  }

  parseInput(input);

  if (tokens.length === 0) {
    warningDiv.textContent = 'No valid tokens found. Make sure the message contains tokens in XXXX-XXXX-XXXX-XXXX-XXXX format.';
    warningDiv.hidden = false;
    return;
  }

  createTable();
  displayMeterInfo();
  currentIndex = 0;
  displayToken(currentIndex);
  showStartUI();

  showToast(`Found ${tokens.length} token${tokens.length > 1 ? 's' : ''} — starting from sequence ${startSequence}`);
}

function handleNewToken() {
  clearState();
  resetToStartState();
  showToast('Cleared — paste a new SMS message');
}

function handleNext() {
  if (currentIndex < tokens.length - 1) {
    // Auto-mark current as done when moving to next
    doneTokens.add(currentIndex);
    currentIndex++;
    displayToken(currentIndex);
  }
}

function handlePrev() {
  if (currentIndex > 0) {
    // Un-mark when going back so user can re-do it if needed
    doneTokens.delete(currentIndex);
    currentIndex--;
    displayToken(currentIndex);
  }
}

function handleResume() {
  const state = loadState();
  if (state) {
    restoreFromState(state);
  }
  hideSessionPrompt();
}

function handleDiscard() {
  clearState();
  hideSessionPrompt();
  resetToStartState();
  showToast('Previous session discarded');
}

function resetToStartState() {
  tokens = [];
  currentIndex = -1;
  doneTokens = new Set();
  startSequence = 0;
  meterInfo = {};
  rawInput = '';

  document.getElementById('tokenInput').value = '';
  document.getElementById('resultSection').hidden = true;
  document.getElementById('warning').hidden = true;
  document.getElementById('tokenTableContainer').innerHTML = '';
  document.getElementById('meterInfoPanel').hidden = true;

  const progressBar = document.getElementById('progressBarFill');
  const progressText = document.getElementById('progressText');
  if (progressBar) progressBar.style.width = '0%';
  if (progressText) progressText.textContent = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideSessionPrompt() {
  const prompt = document.getElementById('sessionPrompt');
  if (prompt) prompt.hidden = true;
}

// ===== Init =====

function init() {
  initTheme();
  initEventHandlers();
  initKeyboardShortcuts();
  registerSW();

  // Check for saved session
  const state = loadState();
  if (state && state.tokens && state.tokens.length > 0) {
    const prompt = document.getElementById('sessionPrompt');
    if (prompt) prompt.hidden = false;
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
