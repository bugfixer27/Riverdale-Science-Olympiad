// ============ RENDERING FUNCTIONS ============

let currentFilter = 'all';
let currentResultTeam = 'A';
let currentRosterTeam = 'all';
let scrollAnimationObserver = null;
let leadersUnlocked = sessionStorage.getItem('leadersAccessGranted') === 'true';
let budgetLoaded = false;
let budgetLoading = false;
let budgetJsonpCounter = 0;

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBudgetValue(value) {
  if (value === undefined || value === null || value === '') return '--';
  return String(value);
}

function parseBudgetMoney(value) {
  const parsed = Number(String(value || '').replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatBudgetMoney(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function budgetRequestAmount(request) {
  const total = parseBudgetMoney(request.totalRequest);
  if (total > 0) return total;
  const estimated = parseBudgetMoney(request.estimatedCost);
  const qty = parseBudgetMoney(request.qty) || 1;
  return estimated * qty;
}

function computedBudgetDashboard(dashboard, purchaseRequests, spendingLog) {
  const startingBudget = parseBudgetMoney(dashboard.startingBudget);
  const loggedSpent = spendingLog.reduce((sum, item) => sum + parseBudgetMoney(item.amount), 0);
  const spentRequestsNotLogged = purchaseRequests
    .filter(request => ['Ordered', 'Received'].includes(request.status || '') && !request.spentLoggedAt)
    .reduce((sum, request) => sum + budgetRequestAmount(request), 0);
  const spent = loggedSpent + spentRequestsNotLogged;
  const pendingRequests = purchaseRequests
    .filter(request => ['Submitted', 'Needs info'].includes(request.status || 'Submitted'))
    .reduce((sum, request) => sum + budgetRequestAmount(request), 0);
  const approvedPlanned = purchaseRequests
    .filter(request => ['Approved', 'Ordered'].includes(request.status || ''))
    .reduce((sum, request) => sum + budgetRequestAmount(request), 0);

  return {
    ...dashboard,
    spent: formatBudgetMoney(spent || parseBudgetMoney(dashboard.spent)),
    cashRemaining: startingBudget ? formatBudgetMoney(startingBudget - spent) : formatBudgetValue(dashboard.cashRemaining),
    pendingRequests: formatBudgetMoney(pendingRequests),
    approvedPlanned: formatBudgetMoney(approvedPlanned),
    totalPlanned: formatBudgetMoney(pendingRequests + approvedPlanned)
  };
}

function setBudgetStatus(message, type = '') {
  const status = document.getElementById('budget-status');
  if (!status) return;
  status.textContent = message;
  status.className = `budget-status ${type}`.trim();
}

function setBudgetFormStatus(message, type = '', form = null) {
  const status = form?.querySelector('.budget-form-status') || document.querySelector('.budget-form-status');
  if (!status) return;
  status.textContent = message;
  status.className = `budget-form-status ${type}`.trim();
}

function renderEvents(events) {
  const grid = document.getElementById('events-grid');
  grid.innerHTML = '';
  events.forEach((ev, i) => {
    const iconClass = ev.type === 'study' ? 'icon-study' : ev.type === 'build' ? 'icon-build' : 'icon-lab';
    const badgeClass = ev.type === 'study' ? 'badge-study' : ev.type === 'build' ? 'badge-build' : 'badge-lab';
    const badgeLabel = ev.type === 'study' ? 'Study' : ev.type === 'build' ? 'Build' : 'Lab / Hybrid';
    const card = document.createElement('div');
    card.className = 'event-card reveal tilt-card shine-surface';
    card.style.setProperty('--i', i % 12);
    card.innerHTML = `
      <div class="event-card-top">
        <div class="event-icon ${iconClass}">${ev.icon}</div>
        <div>
          <h3>${ev.name}</h3>
          <span class="event-type-badge ${badgeClass}">${badgeLabel}</span>
        </div>
      </div>
      <p class="event-desc">${ev.shortDesc}</p>
    `;
    card.addEventListener('click', () => openModal(ev));
    attachPointerGlow(card);
    attachTilt(card);
    grid.appendChild(card);
  });
  initScrollAnimations();
}

function filterEvents() {
  const search = document.getElementById('event-search').value.toLowerCase();
  let filtered = EVENTS;
  if (currentFilter !== 'all') filtered = filtered.filter(e => e.type === currentFilter);
  if (search) filtered = filtered.filter(e => e.name.toLowerCase().includes(search) || e.shortDesc.toLowerCase().includes(search));
  renderEvents(filtered);
}

function filterByType(type, btn) {
  currentFilter = type;
  document.querySelectorAll('#view-events .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterEvents();
}

function openModal(ev) {
  const typeLabel = ev.type === 'study' ? '📖 Study Event' : ev.type === 'build' ? '🔧 Build Event' : '🧪 Lab / Hybrid Event';
  document.getElementById('modal-type').textContent = typeLabel;
  document.getElementById('modal-title').textContent = ev.name;
  document.getElementById('modal-overview').textContent = ev.overview;

  const rulesList = document.getElementById('modal-rules');
  rulesList.innerHTML = '';
  ev.rules.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    rulesList.appendChild(li);
  });

  document.getElementById('modal-tips').innerHTML = ev.tips;

  const linksDiv = document.getElementById('modal-links');
  linksDiv.innerHTML = `
    <a class="modal-link link-primary" href="https://www.soinc.org/${ev.soincSlug}" target="_blank">📋 Official Rules (soinc.org)</a>
    <a class="modal-link link-secondary" href="https://scioly.org/wiki/index.php/${ev.wikiSlug}" target="_blank">📘 Scioly.org Wiki</a>
    <a class="modal-link link-secondary" href="https://scioly.org/tests/" target="_blank">📄 Practice Tests</a>
  `;

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}


// ============ REGIONAL RESULTS ============

function setResultTeam(team, btn) {
  currentResultTeam = team;
  document.querySelectorAll('#view-regional .team-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderResults();
}

function renderResults() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  const search = document.getElementById('result-search').value.toLowerCase();

  REGIONAL_EVENTS.forEach((evName, idx) => {
    if (search && !evName.toLowerCase().includes(search)) return;

    const scoreA = RIVERDALE_A_SCORES[idx];
    const scoreB = RIVERDALE_B_SCORES[idx];
    const membersA = TEAM_A_ASSIGNMENTS[evName] || [];
    const membersB = TEAM_B_ASSIGNMENTS[evName] || [];
    const icon = REGIONAL_ICONS[evName] || '📋';
    const type = REGIONAL_TYPES[evName] || 'study';
    const iconClass = type === 'study' ? 'icon-study' : type === 'build' ? 'icon-build' : 'icon-lab';
    const badgeClass = type === 'study' ? 'badge-study' : type === 'build' ? 'badge-build' : 'badge-lab';
    const badgeLabel = type === 'study' ? 'Study' : type === 'build' ? 'Build' : 'Lab / Hybrid';

    if (currentResultTeam === 'A') {
      renderOneResultCard(grid, evName, scoreA, membersA, 'A', icon, iconClass, badgeClass, badgeLabel, idx);
    } else if (currentResultTeam === 'B') {
      renderOneResultCard(grid, evName, scoreB, membersB, 'B', icon, iconClass, badgeClass, badgeLabel, idx);
    } else {
      renderOneResultCard(grid, evName, scoreA, membersA, 'A', icon, iconClass, badgeClass, badgeLabel, idx, scoreB, membersB);
    }
  });
  initScrollAnimations();
}

function renderOneResultCard(grid, evName, score, members, teamLabel, icon, iconClass, badgeClass, badgeLabel, idx, otherScore, otherMembers) {
  const noEntry = score === 32 && members.length === 0;
  let placeBadgeClass = 'noplace';
  if (score <= 3) placeBadgeClass = 'top3';
  else if (score <= 10) placeBadgeClass = 'top10';

  let secondLine = '';
  if (otherScore !== undefined) {
    const otherNoEntry = otherScore === 32 && (!otherMembers || otherMembers.length === 0);
    secondLine = `<div style="font-size:0.8rem;color:var(--text-light);margin-top:4px;padding-top:4px;border-top:1px solid #f0e8e8;">
      <strong>Team B:</strong> ${otherNoEntry ? 'No entry' : ordinal(otherScore) + ' place'}${otherMembers && otherMembers.length ? ' — ' + otherMembers.join(', ') : ''}
    </div>`;
  }

  const card = document.createElement('div');
  card.className = 'result-card reveal tilt-card shine-surface';
  card.style.setProperty('--i', idx % 12);
  card.innerHTML = `
    <div class="result-card-top">
      <div class="event-icon ${iconClass}">${icon}</div>
      <div>
        <h3>${evName}</h3>
        <span class="event-type-badge ${badgeClass}">${badgeLabel}</span>
      </div>
    </div>
    <div class="result-placement">
      <div class="placement-badge ${placeBadgeClass}">${noEntry ? '—' : ordinal(score)}</div>
      <div class="placement-text">
        ${noEntry
          ? `<strong>No entry (Team ${teamLabel})</strong><br>Event was not staffed`
          : `<strong>${ordinal(score)} place</strong> · Team ${teamLabel} · out of 32 teams${members.length ? '<br>' + members.join(', ') : ''}`
        }
        ${secondLine}
      </div>
    </div>
  `;
  card.addEventListener('click', () => openResultModal(evName, idx));
  attachPointerGlow(card);
  attachTilt(card);
  grid.appendChild(card);
}

function filterResults() {
  renderResults();
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function openResultModal(evName, idx) {
  const scoreA = RIVERDALE_A_SCORES[idx];
  const scoreB = RIVERDALE_B_SCORES[idx];
  const membersA = TEAM_A_ASSIGNMENTS[evName] || [];
  const membersB = TEAM_B_ASSIGNMENTS[evName] || [];
  const top5 = TOP5[evName] || [];
  const type = REGIONAL_TYPES[evName] || 'study';
  const noEntryA = scoreA === 32 && membersA.length === 0;
  const noEntryB = scoreB === 32 && membersB.length === 0;

  const typeLabel = type === 'study' ? '📖 Study Event' : type === 'build' ? '🔧 Build Event' : '🧪 Lab / Hybrid Event';
  document.getElementById('result-modal-type').textContent = typeLabel + ' — 2026 NYC Regional';
  document.getElementById('result-modal-title').textContent = evName;

  const body = document.getElementById('result-modal-body');

  let placementAHTML = '';
  if (noEntryA) {
    placementAHTML = `<div class="tip-box"><strong>Team A — No entry.</strong> This event was not staffed by Team A.</div>`;
  } else {
    placementAHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
        <div class="placement-badge ${scoreA <= 3 ? 'top3' : scoreA <= 10 ? 'top10' : 'noplace'}" style="width:52px;height:52px;font-size:1.5rem;">${ordinal(scoreA)}</div>
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--crimson-deep);font-weight:700;">Team A — ${ordinal(scoreA)} Place</div>
          <div style="font-size:0.85rem;color:var(--text-light);">out of 32 teams</div>
        </div>
      </div>`;
  }

  let placementBHTML = '';
  if (noEntryB) {
    placementBHTML = `<div class="tip-box" style="margin-top:12px;"><strong>Team B — No entry.</strong> This event was not staffed by Team B.</div>`;
  } else {
    placementBHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-top:12px;">
        <div class="placement-badge ${scoreB <= 3 ? 'top3' : scoreB <= 10 ? 'top10' : 'noplace'}" style="width:52px;height:52px;font-size:1.5rem;">${ordinal(scoreB)}</div>
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--crimson-deep);font-weight:700;">Team B — ${ordinal(scoreB)} Place</div>
          <div style="font-size:0.85rem;color:var(--text-light);">out of 32 teams</div>
        </div>
      </div>`;
  }

  let membersHTML = '';
  if (membersA.length > 0) {
    membersHTML += `<div style="margin-bottom:8px;"><strong style="font-size:0.82rem;text-transform:uppercase;letter-spacing:0.6px;color:var(--crimson);">Team A</strong><div class="team-member-chips">${membersA.map(m => `<span class="team-chip">👤 ${m}</span>`).join('')}</div></div>`;
  }
  if (membersB.length > 0) {
    membersHTML += `<div><strong style="font-size:0.82rem;text-transform:uppercase;letter-spacing:0.6px;color:var(--gold);">Team B</strong><div class="team-member-chips">${membersB.map(m => `<span class="team-chip">👤 ${m}</span>`).join('')}</div></div>`;
  }

  const inTop5A = top5.some(t => t[0].includes('Riverdale') && t[0].includes('A'));
  const inTop5B = top5.some(t => t[0].includes('Riverdale') && t[0].includes('B'));

  let tableRows = '';
  top5.forEach(([team, rank]) => {
    const isRiverdale = team.includes('Riverdale');
    tableRows += `<tr class="${isRiverdale ? 'riverdale-row' : ''}">
      <td style="font-weight:700;width:40px;">${ordinal(rank)}</td>
      <td>${team}${isRiverdale ? ' ⭐' : ''}</td>
    </tr>`;
  });

  if (!inTop5A && !noEntryA) {
    tableRows += `<tr><td colspan="2" style="text-align:center;color:var(--text-light);font-size:0.85rem;padding:6px 12px;">···</td></tr>`;
    tableRows += `<tr class="riverdale-row">
      <td style="font-weight:700;width:40px;">${ordinal(scoreA)}</td>
      <td>Riverdale Country School - A ⭐</td>
    </tr>`;
  }

  if (!inTop5B && !noEntryB) {
    if (inTop5A || noEntryA) {
      tableRows += `<tr><td colspan="2" style="text-align:center;color:var(--text-light);font-size:0.85rem;padding:6px 12px;">···</td></tr>`;
    }
    tableRows += `<tr class="riverdale-row">
      <td style="font-weight:700;width:40px;">${ordinal(scoreB)}</td>
      <td>Riverdale Country School - B ⭐</td>
    </tr>`;
  }

  body.innerHTML = `
    <div class="modal-section">
      <h3>🏅 Riverdale's Placements</h3>
      ${placementAHTML}
      ${placementBHTML}
    </div>
    ${membersHTML ? `<div class="modal-section"><h3>👥 Competitors</h3>${membersHTML}</div>` : ''}
    <div class="modal-section">
      <h3>🏆 Top 5 Standings</h3>
      <table class="result-standings-table">
        <thead><tr><th>Place</th><th>School</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;

  document.getElementById('result-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeResultModal() {
  document.getElementById('result-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeResultModalOutside(e) {
  if (e.target === document.getElementById('result-modal-overlay')) closeResultModal();
}


// ============ TEAM ROSTER ============

function setRosterTeam(team, btn) {
  currentRosterTeam = team;
  document.querySelectorAll('#view-roster .team-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRoster();
}

function renderRoster() {
  const grid = document.getElementById('roster-grid');
  const leaders = TEAM_LEADERS;

  const memberEventsA = {};
  const memberEventsB = {};

  for (const [evName, members] of Object.entries(TEAM_A_ASSIGNMENTS)) {
    members.forEach(m => {
      if (!m || m === 'NONE') return;
      if (!memberEventsA[m]) memberEventsA[m] = [];
      memberEventsA[m].push(evName);
    });
  }

  for (const [evName, members] of Object.entries(TEAM_B_ASSIGNMENTS)) {
    members.forEach(m => {
      if (!m || m === 'NONE') return;
      if (!memberEventsB[m]) memberEventsB[m] = [];
      memberEventsB[m].push(evName);
    });
  }

  let membersToShow = [];

  if (currentRosterTeam === 'all' || currentRosterTeam === 'A') {
    Object.keys(memberEventsA).forEach(name => {
      membersToShow.push({ name, events: memberEventsA[name], team: 'A' });
    });
  }
  if (currentRosterTeam === 'all' || currentRosterTeam === 'B') {
    Object.keys(memberEventsB).forEach(name => {
      if (!membersToShow.some(m => m.name === name && m.team === 'B')) {
        membersToShow.push({ name, events: memberEventsB[name], team: 'B' });
      }
    });
  }

  membersToShow.sort((a, b) => {
    const aLeader = leaders.some(l => a.name.startsWith(l));
    const bLeader = leaders.some(l => b.name.startsWith(l));
    if (aLeader && !bLeader) return -1;
    if (!aLeader && bLeader) return 1;
    if (a.team !== b.team) return a.team === 'A' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  grid.innerHTML = '';
  membersToShow.forEach((member, i) => {
    const isLeader = leaders.some(l => member.name.startsWith(l));
    const card = document.createElement('div');
    card.className = 'roster-card reveal tilt-card shine-surface';
    card.style.setProperty('--i', i % 12);
    card.innerHTML = `
      <span class="roster-team-label ${member.team === 'A' ? 'roster-team-a' : 'roster-team-b'}">Team ${member.team}</span>
      <h3>${member.name}</h3>
      <div class="roster-role">${isLeader ? '⭐ Student Leader' : 'Team Member'}</div>
      <div class="roster-events">
        ${member.events.map(e => `<span class="roster-event-tag">${e}</span>`).join('')}
      </div>
    `;
    attachPointerGlow(card);
    attachTilt(card);
    grid.appendChild(card);
  });
  initScrollAnimations();
}


// ============ LEADERS DASHBOARD ============

function getStudentRecords() {
  const students = new Map();

  function addAssignments(team, assignments) {
    for (const [eventName, members] of Object.entries(assignments)) {
      members.forEach(name => {
        if (!name || name === 'NONE') return;
        if (!students.has(name)) {
          students.set(name, {
            name,
            teams: new Set(),
            events: []
          });
        }
        const student = students.get(name);
        student.teams.add(team);
        student.events.push({ name: eventName, team });
      });
    }
  }

  addAssignments('A', TEAM_A_ASSIGNMENTS);
  addAssignments('B', TEAM_B_ASSIGNMENTS);

  return Array.from(students.values())
    .map(student => ({
      ...student,
      teams: Array.from(student.teams).sort(),
      events: student.events.sort((a, b) => a.name.localeCompare(b.name) || a.team.localeCompare(b.team))
    }))
    .sort((a, b) => {
      const aLeader = TEAM_LEADERS.some(leader => a.name.startsWith(leader));
      const bLeader = TEAM_LEADERS.some(leader => b.name.startsWith(leader));
      if (aLeader && !bLeader) return -1;
      if (!aLeader && bLeader) return 1;
      return a.name.localeCompare(b.name);
    });
}

function initLeadersPage() {
  const gate = document.getElementById('leaders-gate');
  const dashboard = document.getElementById('leaders-dashboard');
  const passwordInput = document.getElementById('leaders-password');
  const error = document.getElementById('leaders-error');
  const budgetLink = document.querySelector('.budget-link');

  if (budgetLink) budgetLink.href = LEADERS_BUDGET_URL;

  if (leadersUnlocked) {
    gate.classList.add('hidden');
    dashboard.classList.remove('hidden');
    if (error) error.textContent = '';
    initBudgetDashboard();
    renderLeadersRoster();
  } else {
    gate.classList.remove('hidden');
    dashboard.classList.add('hidden');
    setTimeout(() => passwordInput?.focus(), 80);
  }
}

function unlockLeaders(event) {
  event.preventDefault();
  const passwordInput = document.getElementById('leaders-password');
  const error = document.getElementById('leaders-error');
  const submittedPassword = passwordInput.value.trim();

  if (submittedPassword === LEADERS_PASSWORD) {
    leadersUnlocked = true;
    sessionStorage.setItem('leadersAccessGranted', 'true');
    passwordInput.value = '';
    if (error) error.textContent = '';
    initLeadersPage();
    return;
  }

  if (error) error.textContent = 'Incorrect password.';
  passwordInput.select();
}

function initBudgetDashboard() {
  const budgetLink = document.querySelector('.budget-link');
  if (budgetLink) budgetLink.href = LEADERS_BUDGET_URL;

  if (!BUDGET_API_URL) {
    setBudgetStatus('Budget API is not connected yet. Deploy docs/apps-script-budget-api.js as a Google Apps Script Web App, then paste the Web App URL into BUDGET_API_URL in assets/js/data.js.', 'error');
    renderBudgetData({
      dashboard: {},
      purchaseRequests: [],
      spendingLog: []
    });
    return;
  }

  if (!budgetLoaded && !budgetLoading) {
    loadBudgetData();
  }
}

function loadBudgetData(force = false) {
  if (!leadersUnlocked) return;

  if (!BUDGET_API_URL) {
    initBudgetDashboard();
    return;
  }

  if (budgetLoading) return;
  if (budgetLoaded && !force) return;

  budgetLoading = true;
  setBudgetStatus('Loading live budget data...');

  loadBudgetJSONP('budget')
    .then(data => {
      budgetLoaded = true;
      renderBudgetData(data);
      setBudgetStatus('Budget data loaded from Google Sheets.', 'success');
    })
    .catch(error => {
      console.error(error);
      setBudgetStatus('Budget data could not be loaded. Check the Apps Script Web App URL and deployment access.', 'error');
    })
    .finally(() => {
      budgetLoading = false;
    });
}

function loadBudgetJSONP(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `riverdaleBudgetCallback${Date.now()}${budgetJsonpCounter++}`;
    const script = document.createElement('script');
    const separator = BUDGET_API_URL.includes('?') ? '&' : '?';
    const query = new URLSearchParams({
      action,
      token: BUDGET_API_TOKEN,
      callback: callbackName,
      ...params
    });
    script.src = `${BUDGET_API_URL}${separator}${query.toString()}`;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Budget API timed out.'));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = payload => {
      cleanup();
      if (payload && payload.ok === false) {
        reject(new Error(payload.error || 'Budget API returned an error.'));
        return;
      }
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Budget API script failed to load.'));
    };

    document.body.appendChild(script);
  });
}

function renderBudgetData(data) {
  const purchaseRequests = Array.isArray(data.purchaseRequests) ? data.purchaseRequests : [];
  const spendingLog = Array.isArray(data.spendingLog) ? data.spendingLog : [];
  const dashboard = computedBudgetDashboard(data.dashboard || {}, purchaseRequests, spendingLog);
  const summaryGrid = document.getElementById('budget-summary-grid');
  const requestList = document.getElementById('purchase-requests-list');
  const spendingList = document.getElementById('spending-log-list');
  const requestCount = document.getElementById('purchase-request-count');
  const spendingCount = document.getElementById('spending-log-count');

  if (summaryGrid) {
    summaryGrid.innerHTML = `
      <div class="budget-summary-card"><span>Starting Budget</span><strong>${escapeHTML(formatBudgetValue(dashboard.startingBudget))}</strong></div>
      <div class="budget-summary-card"><span>Spent</span><strong>${escapeHTML(formatBudgetValue(dashboard.spent))}</strong></div>
      <div class="budget-summary-card"><span>Cash Remaining</span><strong>${escapeHTML(formatBudgetValue(dashboard.cashRemaining))}</strong></div>
      <div class="budget-summary-card"><span>Pending Requests</span><strong>${escapeHTML(formatBudgetValue(dashboard.pendingRequests))}</strong></div>
    `;
  }

  if (requestCount) requestCount.textContent = purchaseRequests.length;
  if (spendingCount) spendingCount.textContent = spendingLog.length;

  if (requestList) {
    requestList.innerHTML = purchaseRequests.length
      ? purchaseRequests.map(renderPurchaseRequestCard).join('')
      : '<div class="budget-empty">No purchase requests yet.</div>';
  }

  if (spendingList) {
    spendingList.innerHTML = spendingLog.length
      ? spendingLog.map(renderSpendingLogCard).join('')
      : '<div class="budget-empty">No spending logged yet.</div>';
  }
}

function renderPurchaseRequestCard(request) {
  const link = request.vendorLink
    ? `<a class="budget-link-inline" href="${escapeHTML(request.vendorLink)}" target="_blank" rel="noopener">Vendor link</a>`
    : '';
  const rowNumber = request.rowNumber ? Number(request.rowNumber) : 0;
  const actions = leadersUnlocked && rowNumber
    ? `<div class="leader-actions">
        <button class="leader-action-btn" type="button" onclick="updatePurchaseStatus(${rowNumber}, 'Approved')">Approve</button>
        <button class="leader-action-btn" type="button" onclick="updatePurchaseStatus(${rowNumber}, 'Ordered')">Mark Bought</button>
        <button class="leader-action-btn received" type="button" onclick="updatePurchaseStatus(${rowNumber}, 'Received')">Mark Received</button>
      </div>`
    : '';
  return `
    <article class="budget-item-card">
      <div class="budget-item-top">
        <strong>${escapeHTML(request.description || 'Untitled request')}</strong>
        <span class="budget-amount">${escapeHTML(formatBudgetValue(request.totalRequest || request.estimatedCost))}</span>
      </div>
      <div class="budget-meta">
        <span class="budget-status-pill">${escapeHTML(request.status || 'Submitted')}</span>
        <span>${escapeHTML(request.requester || 'Unknown requester')}</span>
        <span>${escapeHTML(request.category || 'Uncategorized')}</span>
        ${request.needBy ? `<span>Need by ${escapeHTML(request.needBy)}</span>` : ''}
        ${link}
      </div>
      ${actions}
    </article>
  `;
}

function renderSpendingLogCard(item) {
  const receipt = item.receiptLink
    ? `<a class="budget-link-inline" href="${escapeHTML(item.receiptLink)}" target="_blank" rel="noopener">Receipt</a>`
    : '';
  return `
    <article class="budget-item-card">
      <div class="budget-item-top">
        <strong>${escapeHTML(item.item || item.vendor || 'Logged purchase')}</strong>
        <span class="budget-amount">${escapeHTML(formatBudgetValue(item.amount))}</span>
      </div>
      <div class="budget-meta">
        <span class="budget-status-pill">${escapeHTML(item.reimbursementStatus || 'Logged')}</span>
        <span>${escapeHTML(item.vendor || 'No vendor')}</span>
        <span>${escapeHTML(item.category || 'Uncategorized')}</span>
        ${item.date ? `<span>${escapeHTML(item.date)}</span>` : ''}
        ${receipt}
      </div>
    </article>
  `;
}

function submitBudgetRequest(event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!BUDGET_API_URL) {
    setBudgetFormStatus('Budget API is not connected yet, so this request was not sent.', 'error', form);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const params = Object.fromEntries(formData.entries());
  submitButton.disabled = true;
  setBudgetFormStatus('Sending request to Google Sheets...', '', form);

  loadBudgetJSONP('createPurchaseRequest', params)
    .then(() => {
      setBudgetFormStatus('Request submitted. Leaders will see it in the purchase queue.', 'success', form);
      form.reset();
      const qty = form.querySelector('input[name="qty"]');
      if (qty) qty.value = '1';
      budgetLoaded = false;
      if (leadersUnlocked) window.setTimeout(() => loadBudgetData(true), 800);
    })
    .catch(error => {
      console.error(error);
      if (String(error.message || '').includes('Unknown action')) {
        submitBudgetRequestFallback(form, params);
        return;
      }
      setBudgetFormStatus('Request could not be submitted. Check the Apps Script deployment.', 'error', form);
    })
    .finally(() => {
      submitButton.disabled = false;
    });
}

function submitBudgetRequestFallback(form, params) {
  const submitButton = form.querySelector('button[type="submit"]');
  const iframeName = `budget-submit-${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.name = iframeName;
  iframe.className = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const payloadForm = document.createElement('form');
  payloadForm.method = 'POST';
  payloadForm.action = BUDGET_API_URL;
  payloadForm.target = iframeName;
  payloadForm.className = 'hidden';

  const payload = {
    ...params,
    action: 'createPurchaseRequest',
    token: BUDGET_API_TOKEN
  };

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    payloadForm.appendChild(input);
  });

  document.body.appendChild(payloadForm);
  submitButton.disabled = true;
  setBudgetFormStatus('Sending request through compatibility mode...', '', form);

  iframe.addEventListener('load', () => {
    setBudgetFormStatus('Request submitted. Redeploy the updated Apps Script to enable confirmed responses and leader status controls.', 'success', form);
    form.reset();
    const qty = form.querySelector('input[name="qty"]');
    if (qty) qty.value = '1';
    if (leadersUnlocked) {
      budgetLoaded = false;
      window.setTimeout(() => loadBudgetData(true), 1000);
    }
    window.setTimeout(() => {
      iframe.remove();
      payloadForm.remove();
    }, 2500);
    submitButton.disabled = false;
  }, { once: true });

  payloadForm.submit();
}

function updatePurchaseStatus(rowNumber, status) {
  if (!BUDGET_API_URL) {
    setBudgetStatus('Budget API is not connected yet, so status changes cannot be saved.', 'error');
    return;
  }

  setBudgetStatus(`Saving status: ${status}...`);
  loadBudgetJSONP('updatePurchaseStatus', {
    rowNumber,
    status
  })
    .then(() => {
      budgetLoaded = false;
      setBudgetStatus(`Request marked ${status}. Refreshing budget cards...`, 'success');
      window.setTimeout(() => loadBudgetData(true), 700);
    })
    .catch(error => {
      console.error(error);
      setBudgetStatus('Status could not be saved. Check the Apps Script deployment.', 'error');
    });
}

function renderLeadersRoster() {
  if (!leadersUnlocked) return;

  const grid = document.getElementById('leaders-roster-grid');
  const searchInput = document.getElementById('leaders-search');
  const search = (searchInput?.value || '').trim().toLowerCase();
  const students = getStudentRecords().filter(student => {
    if (!search) return true;
    return student.name.toLowerCase().includes(search)
      || student.events.some(event => event.name.toLowerCase().includes(search));
  });

  grid.innerHTML = '';

  students.forEach((student, i) => {
    const profile = STUDENT_PROFILES[student.name] || {};
    const isLeader = TEAM_LEADERS.some(leader => student.name.startsWith(leader));
    const teamsLabel = student.teams.map(team => `Team ${team}`).join(' / ');
    const notesStatus = profile.notes ? 'Notes added' : 'Notes blank';
    const card = document.createElement('div');
    card.className = 'roster-card reveal tilt-card shine-surface';
    card.style.setProperty('--i', i % 12);
    card.innerHTML = `
      <span class="roster-team-label ${student.teams.includes('A') ? 'roster-team-a' : 'roster-team-b'}">${teamsLabel}</span>
      <h3>${escapeHTML(student.name)}</h3>
      <div class="roster-role">${isLeader ? '⭐ Student Leader' : notesStatus}</div>
      <div class="roster-events">
        ${student.events.map(event => `<span class="roster-event-tag">${escapeHTML(event.name)}</span>`).join('')}
      </div>
    `;
    card.addEventListener('click', () => openLeaderStudentModal(student.name));
    attachPointerGlow(card);
    attachTilt(card);
    grid.appendChild(card);
  });

  initScrollAnimations();
}

function openLeaderStudentModal(studentName) {
  const student = getStudentRecords().find(record => record.name === studentName);
  if (!student) return;

  const profile = STUDENT_PROFILES[student.name] || {};
  const practiceTests = profile.practiceTests || {};
  const teamsLabel = student.teams.map(team => `Team ${team}`).join(' / ');
  const rows = student.events.map(event => `
    <tr>
      <td>${escapeHTML(event.name)}</td>
      <td>Team ${escapeHTML(event.team)}</td>
      <td>${practiceTests[event.name] ? escapeHTML(practiceTests[event.name]) : '<span class="leader-empty">Blank</span>'}</td>
    </tr>
  `).join('');

  document.getElementById('leader-student-modal-title').textContent = student.name;
  document.getElementById('leader-student-modal-type').textContent = `${teamsLabel} · Leader Notes`;
  document.getElementById('leader-student-modal-body').innerHTML = `
    <div class="modal-section">
      <h3>📝 Notes</h3>
      <p>${profile.notes ? escapeHTML(profile.notes) : '<span class="leader-empty">No notes yet.</span>'}</p>
    </div>
    <div class="modal-section">
      <h3>📊 Practice Test Scores</h3>
      <table class="practice-table">
        <thead><tr><th>Event</th><th>Team</th><th>Score / Notes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.getElementById('leader-student-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLeaderStudentModal() {
  document.getElementById('leader-student-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function closeLeaderStudentModalOutside(e) {
  if (e.target === document.getElementById('leader-student-modal-overlay')) closeLeaderStudentModal();
}


// ============ NAVIGATION ============

function showView(name, tabEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  if (tabEl) tabEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'regional') renderResults();
  if (name === 'roster') renderRoster();
  if (name === 'leaders') initLeadersPage();

  setTimeout(() => {
    initScrollAnimations();
    refreshInteractiveCards();
  }, 50);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeResultModal();
    closeLeaderStudentModal();
  }
});


// ============ SCROLL ANIMATIONS ============

function initScrollAnimations() {
  if (scrollAnimationObserver) scrollAnimationObserver.disconnect();

  scrollAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollAnimationObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    if (!el.classList.contains('visible')) {
      scrollAnimationObserver.observe(el);
    }
  });
}


// ============ ADVANCED INTERACTIONS ============

function attachPointerGlow(el) {
  if (el.dataset.glowBound === 'true') return;
  el.dataset.glowBound = 'true';

  el.addEventListener('pointermove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  });
}

function attachTilt(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (el.dataset.tiltBound === 'true') return;
  el.dataset.tiltBound = 'true';

  el.addEventListener('pointermove', (e) => {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 8;
    const rotateX = (0.5 - py) * 8;
    el.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  el.addEventListener('pointerleave', () => {
    el.style.transform = '';
  });
}

function refreshInteractiveCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    attachPointerGlow(card);
    attachTilt(card);
  });
}

function initParallaxHero() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const heroes = document.querySelectorAll('.home-hero, .newcomer-hero, .regional-hero');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    heroes.forEach(hero => {
      const rate = Math.min(scrollY * 0.04, 18);
      hero.style.transform = `translateY(${rate * 0.15}px)`;
    });
  }, { passive: true });
}


// Initialize
renderEvents(EVENTS);
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  refreshInteractiveCards();
  initParallaxHero();
});
initScrollAnimations();
refreshInteractiveCards();

// ============ LIVE HEADER PARTICLE SYSTEM ============

function initLiveHeader() {
  const header = document.getElementById('live-header');
  const canvas = document.getElementById('header-particles');
  if (!header || !canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let mouse = {
    x: null,
    y: null,
    active: false
  };

  function resizeCanvas() {
    const rect = header.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function createParticles() {
    const count = Math.max(55, Math.floor(width / 18));
    particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseY: Math.random() * height,
        r: Math.random() * 2.2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.45,
        speedY: (Math.random() - 0.5) * 0.18,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.018 + 0.004,
        alpha: Math.random() * 0.45 + 0.15,
        gold: Math.random() > 0.45
      });
    }
  }

  function drawConnection(a, b, dist) {
    const maxDist = 110;
    if (dist > maxDist) return;
    const opacity = (1 - dist / maxDist) * 0.14;
    ctx.strokeStyle = a.gold || b.gold
      ? `rgba(232, 201, 106, ${opacity})`
      : `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.drift += p.driftSpeed;
      p.x += p.speedX + Math.cos(p.drift) * 0.18;
      p.y += p.speedY + Math.sin(p.drift * 1.2) * 0.12;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          const force = (160 - dist) / 160;
          p.x -= (dx / (dist || 1)) * force * 0.55;
          p.y -= (dy / (dist || 1)) * force * 0.42;
        }
      }

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        drawConnection(p, q, dist);
      }

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      if (p.gold) {
        gradient.addColorStop(0, `rgba(232, 201, 106, ${p.alpha})`);
        gradient.addColorStop(0.4, `rgba(232, 201, 106, ${p.alpha * 0.45})`);
        gradient.addColorStop(1, 'rgba(232, 201, 106, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 255, 255, ${p.alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.gold
        ? `rgba(245, 230, 192, ${Math.min(0.95, p.alpha + 0.2)})`
        : `rgba(255,255,255,${Math.min(0.9, p.alpha + 0.15)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (mouse.active && mouse.x !== null && mouse.y !== null) {
      const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
      mouseGlow.addColorStop(0, 'rgba(232,201,106,0.18)');
      mouseGlow.addColorStop(0.4, 'rgba(255,255,255,0.07)');
      mouseGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = mouseGlow;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  header.addEventListener('mousemove', (e) => {
    const rect = header.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  header.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  animate();
}

document.addEventListener('DOMContentLoaded', initLiveHeader);
initLiveHeader();
