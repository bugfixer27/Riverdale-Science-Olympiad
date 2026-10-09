// ============ RENDERING FUNCTIONS ============

let currentFilter = 'all';
let currentResultTeam = 'A';
let currentRosterTeam = 'all';
let activeViewTransition = null;
let navigationSequence = 0;
let leadersUnlocked = sessionStorage.getItem('leadersAccessGranted') === 'true';
let budgetLoaded = false;
let budgetLoading = false;
let budgetJsonpCounter = 0;

// Replace this route with the endpoint supplied by the Palantir Foundry API team.
// Keep Foundry API tokens on the server, never in this public JavaScript file.
const SCIOLY_AI_API_URL = '/api/scioly-ai';

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function askSciOlyAI(event) {
  event.preventDefault();

  const query = document.getElementById('ai-query').value.trim();
  const button = document.getElementById('ai-submit');
  const responseBox = document.getElementById('ai-response');
  const responseText = document.getElementById('ai-response-text');
  if (!query) return;

  button.disabled = true;
  button.textContent = 'Thinking…';
  responseBox.hidden = false;
  responseBox.classList.add('loading');
  responseText.textContent = 'Searching the Science Olympiad knowledge base…';

  try {
    const response = await fetch(SCIOLY_AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error(`Request failed (${response.status})`);

    const data = await response.json();
    const answer = data.answer || data.response || data.result || data.output;
    if (!answer) throw new Error('The API returned no answer');
    responseText.textContent = typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2);
  } catch (error) {
    responseText.textContent = 'SciOly AI is not connected yet. Please try again later or ask a team leader.';
    console.error('SciOly AI request failed:', error);
  } finally {
    responseBox.classList.remove('loading');
    button.disabled = false;
    button.textContent = 'Ask SciOly AI';
  }
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
  window.SiteMotion?.beforeRender('events');
  const grid = document.getElementById('events-grid');
  grid.innerHTML = '';
  document.getElementById('event-count').textContent = events.length + ' of ' + CURRENT_EVENTS.length + ' events';
  if (!events.length) grid.innerHTML = '<div class="event-empty">No matching events. Try another name or event type.</div>';
  events.forEach((ev, i) => {
    const iconClass = ev.type === 'study' ? 'icon-study' : ev.type === 'build' ? 'icon-build' : 'icon-lab';
    const badgeClass = ev.type === 'study' ? 'badge-study' : ev.type === 'build' ? 'badge-build' : 'badge-lab';
    const badgeLabel = ev.type === 'study' ? 'Study' : ev.type === 'build' ? 'Build' : 'Lab / Hybrid';
    const card = document.createElement('div');
    card.className = 'event-card reveal';
    card.dataset.name = ev.name;
    card.style.setProperty('--i', i % 3);
    card.dataset.type = ev.type;
    card.innerHTML = `
      <div class="event-card-meta"><span>${escapeHTML(ev.category || "2025–26 archive")}</span><span>${String(i + 1).padStart(2, "0")}</span></div>
      <div class="event-card-top">
        <div class="event-icon ${iconClass}">${ev.icon}</div>
        <div>
          <h3>${ev.name}</h3>
          <span class="event-type-badge ${badgeClass}">${badgeLabel}</span>
        </div>
      </div>
      <p class="event-desc">${ev.shortDesc}</p><div class="event-card-footer"><span>${ev.status || "2025–26 archive"}</span><span aria-hidden="true">↗</span></div>
    `;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    card.setAttribute('aria-label', 'View ' + ev.name);
    card.addEventListener('click', () => openModal(ev));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(ev); }
    });


    grid.appendChild(card);
  });
  initScrollAnimations();
}

function filterEvents() {
  const search = document.getElementById('event-search').value.toLowerCase();
  let filtered = CURRENT_EVENTS;
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
  document.getElementById('modal-type').textContent = (ev.season || '2025–26 archive') + ' · ' + typeLabel;
  document.getElementById('modal-rules-heading').textContent = ev.season ? 'Preparation Notes · ' + ev.status : '2025–26 Rules & Format';
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
    ${ev.referenceUrl ? '<a class="modal-link link-primary" href="' + escapeHTML(ev.referenceUrl) + '" target="_blank" rel="noopener noreferrer">↗ ' + (ev.status === 'Featured trial' ? 'Official trial resources' : '2026–27 Drive reference') + '</a>' : ''}
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

// The scorebook reads in five chapters rather than one alphabetical list.
const RESULT_CHAPTERS = [
  { title: 'Life science', events: ['Anatomy and Physiology', 'Designer Genes', 'Disease Detectives', 'Entomology', 'Water Quality'] },
  { title: 'Earth & space', events: ['Astronomy', 'Dynamic Planet', 'Remote Sensing', 'Rocks and Minerals'] },
  { title: 'Physical science', events: ['Chemistry Lab', 'Circuit Lab', 'Forensics', 'Machines', 'Materials Science'] },
  { title: 'Builds', events: ['Boomilever', 'Bungee Drop', 'Electric Vehicle', 'Helicopter', 'Hovercraft', 'Robot Tour'] },
  { title: 'Inquiry', events: ['Codebusters', 'Experimental Design', 'Write It Do It'] }
];

// Three bars, 2nd–1st–3rd, with the highlighted lane for the given rank (1–3).
function podiumHTML(rank, labels, large) {
  const lanes = [2, 1, 3].map(place => {
    const label = labels ? labels[place - 1] : '';
    const mine = place === rank;
    return `<div class="podium-lane${mine ? ' is-riverdale' : ''}" data-place="${place}">
      ${label ? `<span class="podium-school">${escapeHTML(label)}</span>` : ''}
      <span class="podium-bar"><span class="podium-place">${ordinal(place)}</span></span>
    </div>`;
  }).join('');
  return `<div class="podium${large ? ' podium-lg' : ''}" role="img" aria-label="Podium: ${ordinal(rank)} place">${lanes}<span class="podium-base"></span></div>`;
}

function renderResults() {
  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  const search = document.getElementById('result-search').value.toLowerCase();
  const seen = new Set();
  const chapters = RESULT_CHAPTERS.map(chapter => ({
    title: chapter.title,
    events: chapter.events.filter(name => { seen.add(name); return REGIONAL_EVENTS.includes(name); })
  }));
  // Any event missing from the chapter map still renders, in a closing chapter.
  const rest = REGIONAL_EVENTS.filter(name => !seen.has(name));
  if (rest.length) chapters.push({ title: 'More events', events: rest });

  let chapterNumber = 0;
  chapters.forEach(chapter => {
    const names = chapter.events.filter(name => !search || name.toLowerCase().includes(search));
    if (!names.length) return;
    chapterNumber += 1;
    const mark = document.createElement('div');
    mark.className = 'results-chapter-mark';
    mark.dataset.chapter = String(chapterNumber);
    mark.dataset.chapterTitle = chapter.title;
    mark.innerHTML = `<span class="chapter-mark-num">${String(chapterNumber).padStart(2, '0')}</span><span class="chapter-mark-title">${escapeHTML(chapter.title)}</span><span class="chapter-mark-count">${names.length} event${names.length === 1 ? '' : 's'}</span>`;
    grid.appendChild(mark);

    names.forEach(evName => {
      const idx = REGIONAL_EVENTS.indexOf(evName);
      const scoreA = RIVERDALE_A_SCORES[idx];
      const scoreB = RIVERDALE_B_SCORES[idx];
      const membersA = TEAM_A_ASSIGNMENTS[evName] || [];
      const membersB = TEAM_B_ASSIGNMENTS[evName] || [];
      const icon = REGIONAL_ICONS[evName] || '📋';
      const type = REGIONAL_TYPES[evName] || 'study';
      const iconClass = type === 'study' ? 'icon-study' : type === 'build' ? 'icon-build' : 'icon-lab';
      const badgeClass = type === 'study' ? 'badge-study' : type === 'build' ? 'badge-build' : 'badge-lab';
      const badgeLabel = type === 'study' ? 'Study' : type === 'build' ? 'Build' : 'Lab / Hybrid';
      const meta = { chapter: chapterNumber, chapterTitle: chapter.title };

      if (currentResultTeam === 'A') {
        renderOneResultCard(grid, evName, scoreA, membersA, 'A', icon, iconClass, badgeClass, badgeLabel, idx, undefined, undefined, meta);
      } else if (currentResultTeam === 'B') {
        renderOneResultCard(grid, evName, scoreB, membersB, 'B', icon, iconClass, badgeClass, badgeLabel, idx, undefined, undefined, meta);
      } else {
        renderOneResultCard(grid, evName, scoreA, membersA, 'A', icon, iconClass, badgeClass, badgeLabel, idx, scoreB, membersB, meta);
      }
    });
  });
  grid.dataset.chapterCount = String(chapterNumber);
  if (!chapterNumber) grid.innerHTML = '<div class="event-empty">No matching events in the 2026 scorebook.</div>';
  initScrollAnimations();
}

function renderOneResultCard(grid, evName, score, members, teamLabel, icon, iconClass, badgeClass, badgeLabel, idx, otherScore, otherMembers, meta) {
  const noEntry = score === 32 && members.length === 0;
  let placeBadgeClass = 'noplace';
  if (score <= 3) placeBadgeClass = 'top3';
  else if (score <= 10) placeBadgeClass = 'top10';

  let secondLine = '';
  if (otherScore !== undefined) {
    const otherNoEntry = otherScore === 32 && (!otherMembers || otherMembers.length === 0);
    secondLine = `<div class="result-second-team">
      <strong>Team B:</strong> ${otherNoEntry ? 'No entry' : ordinal(otherScore) + ' place'}${otherMembers && otherMembers.length ? ' · ' + otherMembers.join(', ') : ''}
    </div>`;
  }

  const card = document.createElement('div');
  card.className = 'result-card reveal';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'View ' + evName + ' results');
  card.dataset.event = evName;
  card.dataset.rank = noEntry ? '' : String(score);
  if (meta) { card.dataset.chapter = String(meta.chapter); card.dataset.chapterTitle = meta.chapterTitle; }
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openResultModal(evName, idx); }
  });
  card.style.setProperty('--i', idx % 12);
  const medal = !noEntry && score <= 3;
  card.innerHTML = `
    <div class="result-card-top">
      <div class="event-icon ${iconClass}">${icon}</div>
      <div>
        <h3>${evName}</h3>
        <span class="event-type-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <span class="result-card-index" aria-hidden="true">${String(idx + 1).padStart(2, '0')}</span>
    </div>
    <div class="result-placement${medal ? ' has-podium' : ''}">
      <div class="placement-badge ${placeBadgeClass}">${noEntry ? '—' : ordinal(score)}</div>
      <div class="placement-text">
        ${noEntry
          ? `<strong>No entry (Team ${teamLabel})</strong><br>Event was not staffed`
          : `<strong>${ordinal(score)} place</strong> · Team ${teamLabel} · of 32 teams${members.length ? '<br>' + members.join(', ') : ''}`
        }
        ${secondLine}
      </div>
      ${medal ? podiumHTML(score) : ''}
    </div>
  `;
  card.addEventListener('click', () => openResultModal(evName, idx));


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

  function teamPanel(team, score, noEntry, members) {
    return `<article class="result-team-panel" data-result-team="${team}">
      <div class="result-team-eyebrow">RIVERDALE / TEAM ${team}</div>
      <div class="result-rank">${noEntry ? '—' : ordinal(score)}</div>
      <p>${noEntry ? 'No entry · this event was not staffed.' : 'Place out of 32 teams'}</p>
      ${noEntry ? '' : `<div class="rank-track" aria-hidden="true"><span style="left:${(score - 1) / 31 * 100}%"></span></div><div class="rank-scale" aria-hidden="true"><span>1st</span><span>32nd</span></div>`}
      <div class="result-competitor-label">COMPETITORS</div>
      <div class="team-member-chips">${members.length ? members.map(m => `<span class="team-chip">${m}</span>`).join('') : '<span class="result-unassigned">No competitors assigned</span>'}</div>
    </article>`;
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

  const podiumLabels = [1, 2, 3].map(place => (top5.find(t => t[1] === place) || [''])[0]);
  const riverdaleMedal = [scoreA, scoreB].find(s => s <= 3);
  const modalPodium = top5.length >= 3
    ? `<div class="result-podium-wrap"><div class="result-competitor-label">TOP THREE · ${escapeHTML(evName).toUpperCase()}</div>${podiumHTML(riverdaleMedal || 0, podiumLabels, true)}</div>`
    : '';

  body.innerHTML = `
    ${modalPodium}
    <div class="result-detail-toolbar"><h3>Riverdale’s placements</h3>
      <div class="result-team-switch" role="group" aria-label="Compare team results">
        <button type="button" aria-pressed="true" onclick="setResultDetailTeam('all', this)">Compare</button>
        <button type="button" aria-pressed="false" onclick="setResultDetailTeam('A', this)">Team A</button>
        <button type="button" aria-pressed="false" onclick="setResultDetailTeam('B', this)">Team B</button>
      </div>
    </div>
    <div class="result-comparison">${teamPanel('A', scoreA, noEntryA, membersA)}${teamPanel('B', scoreB, noEntryB, membersB)}</div>
    <details class="result-standings-disclosure" open>
      <summary>Top 5 standings <span>+ Riverdale’s finish</span></summary>
      <table class="result-standings-table">
        <thead><tr><th scope="col">Place</th><th scope="col">School</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </details>
    <div class="result-detail-nav">
      <button type="button" onclick="stepResultDetail(${idx}, -1)">← Previous event</button>
      <span>${idx + 1} / ${REGIONAL_EVENTS.length}</span>
      <button type="button" onclick="stepResultDetail(${idx}, 1)">Next event →</button>
    </div>
  `;
  document.getElementById('result-modal').scrollTop = 0;

  document.getElementById('result-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function setResultDetailTeam(team, button) {
  const modal = document.getElementById('result-modal');
  modal.querySelectorAll('[data-result-team]').forEach(panel => {
    panel.hidden = team !== 'all' && panel.dataset.resultTeam !== team;
  });
  modal.querySelectorAll('.result-team-switch button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
}

function stepResultDetail(index, direction) {
  const next = (index + direction + REGIONAL_EVENTS.length) % REGIONAL_EVENTS.length;
  openResultModal(REGIONAL_EVENTS[next], next);
  document.getElementById('result-modal').focus({ preventScroll: true });
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
    card.className = 'roster-card reveal';
    card.style.setProperty('--i', i % 3);
    card.innerHTML = `
      <span class="roster-team-label ${member.team === 'A' ? 'roster-team-a' : 'roster-team-b'}">Team ${member.team}</span>
      <h3>${member.name}</h3>
      <div class="roster-role">${isLeader ? '⭐ Student Leader' : 'Team Member'}</div>
      <div class="roster-events">
        ${member.events.map(e => `<span class="roster-event-tag">${e}</span>`).join('')}
      </div>
    `;


    grid.appendChild(card);
  });
  initScrollAnimations();
  renderRoster2027();
}


// ============ 2026–27 ROSTER (from tools/sync-teamfit.mjs) ============

let currentRoster2027Team = 'all';

function hasRoster2027() {
  return typeof ROSTER_2027 !== 'undefined' && Object.values(ROSTER_2027).some(names => names.length);
}

// [{ name, team, events[] }] for every member placed on a 2026–27 team, leaders first.
function getRoster2027Members() {
  if (!hasRoster2027()) return [];
  const members = [];
  for (const [team, names] of Object.entries(ROSTER_2027)) {
    const assignments = ASSIGNMENTS_2027[team] || {};
    names.forEach(name => members.push({
      name,
      team,
      events: Object.keys(assignments).filter(ev => assignments[ev].includes(name))
    }));
  }
  const isLeader = name => TEAM_LEADERS.some(leader => name.startsWith(leader));
  return members.sort((a, b) =>
    (isLeader(b.name) - isLeader(a.name)) || a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
}

function setRoster2027Team(team, btn) {
  currentRoster2027Team = team;
  document.querySelectorAll('#roster-next-body .team-toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRoster2027Grid();
}

function renderRoster2027() {
  const body = document.getElementById('roster-next-body');
  if (!body || !hasRoster2027()) return;
  const teams = Object.keys(ROSTER_2027);
  const meta = typeof ROSTER_2027_META !== 'undefined' ? ROSTER_2027_META : {};
  const updated = meta.updatedAt ? new Date(meta.updatedAt) : null;
  const stamp = document.getElementById('roster-next-stamp');
  if (stamp && updated) {
    stamp.dateTime = meta.updatedAt;
    stamp.textContent = 'Updated ' + updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const count = teams.reduce((n, t) => n + ROSTER_2027[t].length, 0);
  body.classList.add('is-live');
  body.innerHTML = `
    <p class="roster-next-lede">${count} students across ${teams.map(t => 'Team ' + t).join(', ').replace(/, ([^,]*)$/, ', and $1')}, with their events on the 24-event slate.${meta.published ? '' : ' Assignments are still being finalized and may change.'}</p>
    <div class="team-toggle">
      <button class="team-toggle-btn active" onclick="setRoster2027Team('all', this)">All Members</button>
      ${teams.map(t => `<button class="team-toggle-btn" onclick="setRoster2027Team('${t}', this)">Team ${t}</button>`).join('')}
    </div>
    <div class="roster-grid" id="roster-2027-grid"></div>`;
  renderRoster2027Grid();
}

function renderRoster2027Grid() {
  const grid = document.getElementById('roster-2027-grid');
  if (!grid) return;
  const members = getRoster2027Members().filter(m => currentRoster2027Team === 'all' || m.team === currentRoster2027Team);
  grid.innerHTML = members.map((member, i) => {
    const isLeader = TEAM_LEADERS.some(l => member.name.startsWith(l));
    return `<div class="roster-card" style="--i:${i % 3}">
      <span class="roster-team-label roster-team-${member.team.toLowerCase()}">Team ${member.team}</span>
      <h3>${escapeHTML(member.name)}</h3>
      <div class="roster-role">${isLeader ? '⭐ Student Leader' : 'Team Member'}</div>
      <div class="roster-events">
        ${member.events.length
          ? member.events.map(e => `<span class="roster-event-tag">${escapeHTML(e)}</span>`).join('')
          : '<span class="roster-event-tag is-pending">Events to be assigned</span>'}
      </div>
    </div>`;
  }).join('');
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

  loadBudgetAPI('budget')
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

async function loadBudgetAPI(action, params = {}) {
  const separator = BUDGET_API_URL.includes('?') ? '&' : '?';
  const query = new URLSearchParams({
    action,
    token: BUDGET_API_TOKEN,
    ...params
  });
  const response = await fetch(`${BUDGET_API_URL}${separator}${query.toString()}`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Budget API HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload && payload.ok === false) {
    throw new Error(payload.error || 'Budget API returned an error.');
  }

  return payload;
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

function isRejectedRequest(request) {
  return /^rejected/i.test(String(request.status || '').trim());
}

function renderBudgetData(data) {
  // Rejected requests stay in the sheet as a record but disappear from the dashboard.
  const purchaseRequests = (Array.isArray(data.purchaseRequests) ? data.purchaseRequests : [])
    .filter(request => !isRejectedRequest(request));
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
        <label class="leader-total-edit">Total $<input type="number" min="0" step="0.01" inputmode="decimal" id="request-total-${rowNumber}" value="${budgetRequestAmount(request).toFixed(2)}" data-original="${budgetRequestAmount(request).toFixed(2)}" aria-label="Approved total"></label>
        <button class="leader-action-btn" type="button" onclick="approvePurchaseRequest(${rowNumber})">Approve</button>
        <button class="leader-action-btn" type="button" onclick="updatePurchaseStatus(${rowNumber}, 'Ordered')">Mark Bought</button>
        <button class="leader-action-btn received" type="button" onclick="updatePurchaseStatus(${rowNumber}, 'Received')">Mark Received</button>
        <button class="leader-action-btn reject" type="button" onclick="rejectPurchaseRequest(${rowNumber})">Reject</button>
      </div>`
    : '';
  return `
    <article class="budget-item-card"${rowNumber ? ` data-request-row="${rowNumber}"` : ''}>
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

  submitBudgetRequestFallback(form, params);
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

function rejectPurchaseRequest(rowNumber) {
  const card = document.querySelector(`[data-request-row="${rowNumber}"]`);
  const name = card?.querySelector('strong')?.textContent || 'this request';
  if (!window.confirm(`Reject "${name}"? It will be removed from the dashboard (the sheet row is kept, marked Rejected / Cut).`)) return;
  if (card) {
    card.classList.add('is-leaving');
    window.setTimeout(() => card.remove(), 260);
    const count = document.getElementById('purchase-request-count');
    if (count) count.textContent = Math.max(0, Number(count.textContent) - 1);
  }
  updatePurchaseStatus(rowNumber, 'Rejected / Cut');
}

function approvePurchaseRequest(rowNumber) {
  const input = document.getElementById(`request-total-${rowNumber}`);
  const value = input ? input.value.trim() : '';
  if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
    setBudgetStatus('Enter a valid total before approving.', 'error');
    input.focus();
    return;
  }
  const changed = value && Number(value) !== Number(input.dataset.original);
  updatePurchaseStatus(rowNumber, 'Approved', changed ? { totalRequest: Number(value).toFixed(2) } : {});
}

function updatePurchaseStatus(rowNumber, status, extra = {}) {
  if (!BUDGET_API_URL) {
    setBudgetStatus('Budget API is not connected yet, so status changes cannot be saved.', 'error');
    return;
  }

  setBudgetStatus(`Saving status: ${status}...`);
  loadBudgetAPI('updatePurchaseStatus', {
    rowNumber,
    status,
    ...extra
  })
    .then(result => {
      budgetLoaded = false;
      if (extra.totalRequest !== undefined && result && result.totalRequest === undefined) {
        setBudgetStatus(`Request marked ${status}, but the total was not saved. Redeploy the budget Apps Script (docs/apps-script-budget-api.js).`, 'error');
      } else {
        setBudgetStatus(`Request marked ${status}${extra.totalRequest !== undefined ? ` at ${formatBudgetMoney(Number(extra.totalRequest))}` : ''}. Refreshing budget cards...`, 'success');
      }
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
    card.className = 'roster-card reveal';
    card.style.setProperty('--i', i % 3);
    card.innerHTML = `
      <span class="roster-team-label ${student.teams.includes('A') ? 'roster-team-a' : 'roster-team-b'}">${teamsLabel}</span>
      <h3>${escapeHTML(student.name)}</h3>
      <div class="roster-role">${isLeader ? '⭐ Student Leader' : notesStatus}</div>
      <div class="roster-events">
        ${student.events.map(event => `<span class="roster-event-tag">${escapeHTML(event.name)}</span>`).join('')}
      </div>
    `;
    card.addEventListener('click', () => openLeaderStudentModal(student.name));


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
  const target = document.getElementById('view-' + name);
  if (!target) return Promise.resolve();
  const sequence = ++navigationSequence;
  activeViewTransition?.skipTransition();
  const change = () => {
    if (sequence !== navigationSequence) return;
    window.SiteMotion?.leave();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.remove('active');
      t.removeAttribute('aria-current');
    });
    target.classList.add('active');
    const tab = tabEl || Array.from(document.querySelectorAll('.nav-tab')).find(t => t.getAttribute('onclick').includes("'" + name + "'"));
    if (tab) { tab.classList.add('active'); tab.setAttribute('aria-current', 'page'); }
    if (window.SiteMotion) window.SiteMotion.scrollTop();
    else window.scrollTo({ top: 0, behavior: 'instant' });
    if (name === 'events' && !document.getElementById('events-grid').children.length) filterEvents();
    if (name === 'regional') renderResults();
    if (name === 'roster') renderRoster();
    if (name === 'leaders') initLeadersPage();
    document.dispatchEvent(new CustomEvent('site:viewchange', { detail: { name } }));
    initScrollAnimations();
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduced) {
    activeViewTransition = document.startViewTransition(change);
    activeViewTransition.finished.catch(() => {});
    // A skipped transition rejects this promise; callers may not await it.
    activeViewTransition.updateCallbackDone.catch(() => {});
    activeViewTransition.ready?.catch(() => {});
    return activeViewTransition.updateCallbackDone;
  }
  change();
  if (!reduced && target.animate) {
    target.animate([
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)' }
    ], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  return Promise.resolve();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeResultModal();
    closeLeaderStudentModal();
  }
});


// Legacy renderer hook. Motion is managed by the scoped GSAP controller in features.js.
function initScrollAnimations() {
  window.SiteMotion?.refreshView();
}

// Event and roster cards render when their views open, avoiding hidden DOM work at startup.
