/* =====================================================================
   RIVERDALE SCIENCE OLYMPIAD — EXPERIENCE LAYER (features.js)
   Loads AFTER data.js + app.js. Adds: theme engine, scroll
   chrome, command palette, toasts/confetti, home personalization,
   live countdowns, and the Study Hub.
   Everything is self-contained and reads the existing data globals.
   ===================================================================== */
(function () {
  'use strict';

  // Small helper — reuse app.js escapeHTML if present, else local copy.
  const esc = (window.escapeHTML) ? window.escapeHTML : function (v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root) => (root || document).querySelector(sel);

  // data.js declares its data with `const`, which does NOT attach to window.
  // Bridge the values we read onto window so the rest of this file can use them.
  function exposeGlobals() {
    try { window.EVENTS = CURRENT_EVENTS; window.ARCHIVED_EVENTS = EVENTS; } catch (e) {}
    try { window.REGIONAL_ICONS = window.REGIONAL_ICONS || REGIONAL_ICONS; } catch (e) {}
    try { window.TEAM_A_ASSIGNMENTS = window.TEAM_A_ASSIGNMENTS || TEAM_A_ASSIGNMENTS; } catch (e) {}
    try { window.TEAM_B_ASSIGNMENTS = window.TEAM_B_ASSIGNMENTS || TEAM_B_ASSIGNMENTS; } catch (e) {}
    try { window.TEAM_LEADERS = window.TEAM_LEADERS || TEAM_LEADERS; } catch (e) {}
    try { window.ROSTER_2027 = window.ROSTER_2027 || ROSTER_2027; window.ASSIGNMENTS_2027 = window.ASSIGNMENTS_2027 || ASSIGNMENTS_2027; } catch (e) {}
    try { window.COUNTDOWN_EVENTS = window.COUNTDOWN_EVENTS || COUNTDOWN_EVENTS; } catch (e) {}
    try { window.LEADERS_BUDGET_URL = window.LEADERS_BUDGET_URL || LEADERS_BUDGET_URL; } catch (e) {}
  }

  /* ===================================================================
     THEME ENGINE
     =================================================================== */
  function initTheme() {
    const stored = localStorage.getItem('fx_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('fx_theme', next);
    toast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on');
  }

  /* ===================================================================
     SCROLL CHROME — progress bar + back-to-top
     =================================================================== */
  function initScrollChrome() {
    const prog = document.getElementById('fx-progress');
    const top = document.getElementById('fx-top');
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (prog) prog.style.transform = 'scaleX(' + p / 100 + ')';
      if (top) top.classList.toggle('visible', h.scrollTop > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ===================================================================
     TOAST + CONFETTI
     =================================================================== */
  function toast(message, icon) {
    const host = document.getElementById('fx-toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'fx-toast';
    el.innerHTML = (icon ? `<span class="fx-toast-ico">${esc(icon)}</span>` : '') +
      `<span>${esc(message)}</span>`;
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add('fx-out');
      setTimeout(() => el.remove(), 420);
    }, 2600);
  }
  window.fxToast = toast;

  function confetti(originX, originY, count) {
    if (reduceMotion) return;
    const canvas = document.getElementById('fx-confetti');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ox = originX == null ? window.innerWidth / 2 : originX;
    const oy = originY == null ? window.innerHeight / 3 : originY;
    const colors = ['#8B1A1A', '#C9A84C', '#E8C96A', '#ffffff', '#c0392b', '#f5de96'];
    const N = count || 130;
    const parts = [];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 9 + 3;
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 6,
        size: Math.random() * 7 + 4,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 1
      });
    }
    let frame = 0;
    function step() {
      frame++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      parts.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.vy += 0.28;          // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.012;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive && frame < 240) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(step);
  }
  window.fxConfetti = confetti;

  /* ===================================================================
     COMMAND PALETTE
     =================================================================== */
  const PAGES = [
    { view: 'home', title: 'Home', sub: 'Season map & your seat on the team', icon: '🏠' },
    { view: 'newcomer', title: 'New Members', sub: 'How the club runs, from the three leaders', icon: '🌟' },
    { view: 'events', title: 'Events', sub: '24 events · 2026–27', icon: '📋' },
    { view: 'regional', title: 'Results', sub: '2026 NYC North Regional scorebook', icon: '🏅' },
    { view: 'roster', title: 'Team', sub: 'Roster & event assignments', icon: '👥' },
    { view: 'resources', title: 'Resources', sub: 'Study links & tools', icon: '🌐' },
    { view: 'studyhub', title: 'Study Hub', sub: 'Quiz, focus timer, milestones', icon: '🧠' },
    { view: 'ai', title: 'SciOly AI', sub: 'Ask the team AI a question', icon: '✨' },
    { view: 'request', title: 'Request', sub: 'Submit a purchase request', icon: '🛒' },
    { view: 'leaders', title: 'Leaders', sub: 'Protected dashboard', icon: '🔒' },
    { view: 'contact', title: 'Contact', sub: 'Reach leaders & advisor', icon: '✉️' }
  ];

  let paletteItems = [];
  let paletteActive = 0;

  function buildPaletteIndex() {
    const items = [];
    PAGES.forEach(p => items.push({
      type: 'Page', title: p.title, sub: p.sub, icon: p.icon,
      run: () => navTo(p.view)
    }));
    items.push(
      { type: 'Action', title: 'Toggle dark / light theme', sub: 'Switch the whole site', icon: '🌓', run: toggleTheme },
      { type: 'Action', title: 'Start a focus session', sub: 'Open the Study Hub timer', icon: '⏱️', run: () => { navTo('studyhub').then(() => setStudyTab('timer')); } },
      { type: 'Action', title: 'Open team budget sheet', sub: 'Google Sheets', icon: '💰', run: () => window.open((window.LEADERS_BUDGET_URL || '#'), '_blank') }
    );
    if (Array.isArray(window.EVENTS)) {
      window.EVENTS.forEach(ev => items.push({
        type: 'Event', title: ev.name, sub: ev.shortDesc, icon: ev.icon,
        run: () => { closePalette(); if (window.openModal) window.openModal(ev); }
      }));
    }
    try {
      if (window.getRoster2027Members && window.getRoster2027Members().length) {
        window.getRoster2027Members().forEach(m => items.push({
          type: 'Teammate', title: m.name,
          sub: 'Team ' + m.team + ' · 2026–27 · ' + m.events.length + ' events',
          icon: '👤', run: () => navTo('roster')
        }));
      } else if (window.getStudentRecords) {
        window.getStudentRecords().forEach(st => items.push({
          type: 'Teammate', title: st.name,
          sub: 'Team ' + st.teams.join(' / ') + ' · ' + st.events.length + ' events',
          icon: '👤', run: () => navTo('roster')
        }));
      }
    } catch (e) { /* ignore */ }
    const RES = [
      { title: 'soinc.org — Official Rules', url: 'https://www.soinc.org/events/div-c' },
      { title: 'scioly.org Wiki', url: 'https://scioly.org/wiki/index.php/Main_Page' },
      { title: 'scioly.org Test Exchange', url: 'https://scioly.org/tests/' },
      { title: 'scioly.org Forums', url: 'https://scioly.org/forums/' }
    ];
    RES.forEach(r => items.push({
      type: 'Resource', title: r.title, sub: r.url, icon: '🔗',
      run: () => window.open(r.url, '_blank')
    }));
    return items;
  }

  function navTo(view) {
    closePalette();
    const tab = document.querySelector(`.nav-tab[onclick*="'${view}'"]`);
    return window.showView ? window.showView(view, tab) : Promise.resolve();
  }

  function fuzzy(query, text) {
    query = query.toLowerCase(); text = text.toLowerCase();
    if (!query) return 1;
    const idx = text.indexOf(query);
    if (idx === 0) return 1000;
    if (idx > 0) return 500 - idx;
    // subsequence
    let qi = 0, score = 0, last = -1;
    for (let i = 0; i < text.length && qi < query.length; i++) {
      if (text[i] === query[qi]) {
        score += (last === i - 1) ? 6 : 2;
        last = i; qi++;
      }
    }
    return qi === query.length ? score : -1;
  }

  function renderPalette(query) {
    const list = document.getElementById('fx-palette-results');
    const all = buildPaletteIndex();
    let scored;
    if (!query.trim()) {
      scored = all.filter(i => i.type === 'Page' || i.type === 'Action');
    } else {
      scored = all.map(i => {
        const s = Math.max(
          fuzzy(query, i.title),
          fuzzy(query, i.sub || '') - 80,
          fuzzy(query, i.type) - 200
        );
        return { i, s };
      }).filter(x => x.s > -1).sort((a, b) => b.s - a.s).slice(0, 24).map(x => x.i);
    }
    paletteItems = scored;
    paletteActive = 0;
    if (!scored.length) {
      list.innerHTML = '<div class="fx-palette-empty">No matches. Try “events”, a name, or “timer”.</div>';
      return;
    }
    let html = '';
    let lastType = null;
    scored.forEach((it, i) => {
      if (it.type !== lastType) {
        html += `<div class="fx-palette-group-label">${esc(it.type)}s</div>`;
        lastType = it.type;
      }
      html += `
        <div class="fx-palette-item${i === 0 ? ' fx-active' : ''}" data-i="${i}">
          <div class="fx-pi-ico">${esc(it.icon || '•')}</div>
          <div class="fx-pi-text">
            <div class="fx-pi-title">${esc(it.title)}</div>
            ${it.sub ? `<div class="fx-pi-sub">${esc(it.sub)}</div>` : ''}
          </div>
          <div class="fx-pi-go">↵ open</div>
        </div>`;
    });
    list.innerHTML = html;
    list.querySelectorAll('.fx-palette-item').forEach(el => {
      el.addEventListener('mousemove', () => setActive(+el.dataset.i));
      el.addEventListener('click', () => runActive(+el.dataset.i));
    });
  }

  function setActive(i) {
    paletteActive = i;
    document.querySelectorAll('.fx-palette-item').forEach(el => {
      el.classList.toggle('fx-active', +el.dataset.i === i);
    });
  }
  function runActive(i) {
    const it = paletteItems[i != null ? i : paletteActive];
    if (it && it.run) it.run();
  }

  function openPalette() {
    const p = document.getElementById('fx-palette');
    if (!p) return;
    p.classList.remove('hidden');
    const input = document.getElementById('fx-palette-input');
    input.value = '';
    renderPalette('');
    setTimeout(() => input.focus(), 30);
    document.body.style.overflow = 'hidden';
  }
  function closePalette() {
    const p = document.getElementById('fx-palette');
    if (!p) return;
    p.classList.add('hidden');
    if (!anyModalOpen()) document.body.style.overflow = '';
  }
  function anyModalOpen() {
    return ['modal-overlay', 'result-modal-overlay', 'leader-student-modal-overlay']
      .some(id => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); });
  }
  function paletteOpen() {
    const p = document.getElementById('fx-palette');
    return p && !p.classList.contains('hidden');
  }

  function initPalette() {
    const input = document.getElementById('fx-palette-input');
    const overlay = document.getElementById('fx-palette');
    if (!input || !overlay) return;
    input.addEventListener('input', () => renderPalette(input.value));
    overlay.addEventListener('click', e => { if (e.target === overlay) closePalette(); });
    document.addEventListener('keydown', e => {
      const key = e.key;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (key === 'k' || key === 'K')) { e.preventDefault(); paletteOpen() ? closePalette() : openPalette(); return; }
      if (key === '/' && !paletteOpen() && !isTyping(e.target) && !anyModalOpen()) { e.preventDefault(); openPalette(); return; }
      if (!paletteOpen()) return;
      if (key === 'Escape') { e.preventDefault(); closePalette(); }
      else if (key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(paletteActive + 1, paletteItems.length - 1)); scrollActiveIntoView(); }
      else if (key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(paletteActive - 1, 0)); scrollActiveIntoView(); }
      else if (key === 'Enter') { e.preventDefault(); runActive(); }
    });
  }
  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }
  function scrollActiveIntoView() {
    const el = document.querySelector('.fx-palette-item.fx-active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  /* ===================================================================
     LIVE COUNTDOWNS + HOME PERSONALIZATION ("YOUR SEASON")
     =================================================================== */
  const FX_MILESTONES = [
    { id: 'rules', week: 'Weeks 1–2', title: 'Read your official event rules', desc: 'Read every assigned event cover to cover on soinc.org.' },
    { id: 'wiki', week: 'Weeks 1–2', title: 'Study the scioly.org wiki pages', desc: 'Skim the wiki for each event and bookmark the best guides.' },
    { id: 'binder', week: 'Weeks 3–6', title: 'Start your binder or prototype', desc: 'Begin resource binders or prototyping your build device.' },
    { id: 'tests', week: 'Weeks 3–6', title: 'Take 3 practice tests', desc: 'Work through past tests from the scioly.org exchange.' },
    { id: 'weak', week: 'Weeks 7–10', title: 'Target your weak areas', desc: 'Find low-scoring topics and drill them specifically.' },
    { id: 'buildtest', week: 'Weeks 7–10', title: 'Test build devices 5+ times', desc: 'Log calibration data for every device run.' },
    { id: 'timed', week: 'Final 2 weeks', title: 'Run full timed practice', desc: 'Simulate competition conditions end to end.' },
    { id: 'logistics', week: 'Final 2 weeks', title: 'Confirm logistics & pack', desc: 'Check materials, travel, and the schedule with leaders.' }
  ];
  function getDoneMilestones() {
    try { return new Set(JSON.parse(localStorage.getItem('fx_milestones') || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveDoneMilestones(set) {
    localStorage.setItem('fx_milestones', JSON.stringify(Array.from(set)));
  }

  function rosterNames() {
    const set = new Set();
    Object.values(window.ROSTER_2027 || {}).forEach(names => names.forEach(n => set.add(n)));
    ['TEAM_A_ASSIGNMENTS', 'TEAM_B_ASSIGNMENTS'].forEach(k => {
      const obj = window[k] || {};
      Object.values(obj).forEach(arr => (arr || []).forEach(n => { if (n && n !== 'NONE') set.add(n); }));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  function memberEvents(name) {
    const out = [];
    [['A', 'TEAM_A_ASSIGNMENTS'], ['B', 'TEAM_B_ASSIGNMENTS']].forEach(([team, k]) => {
      const obj = window[k] || {};
      Object.entries(obj).forEach(([ev, arr]) => {
        if ((arr || []).includes(name)) out.push({ ev, team });
      });
    });
    return out.sort((a, b) => a.ev.localeCompare(b.ev));
  }
  // 2026–27 names are first names; a saved 2025–26 name like "Cole Simmons" still matches "Cole"
  // when only one 2026–27 member has that first name.
  function currentSeat(name) {
    const roster = window.ROSTER_2027 || {};
    const find = n => Object.keys(roster).find(t => roster[t].includes(n));
    let team = find(name), seatName = name;
    if (!team) {
      const first = name.split(' ')[0];
      const hits = Object.values(roster).flat().filter(n => n === first || n.startsWith(first + ' '));
      if (hits.length === 1) { seatName = hits[0]; team = find(seatName); }
    }
    if (!team) return null;
    const asg = (window.ASSIGNMENTS_2027 || {})[team] || {};
    return { team, events: Object.keys(asg).filter(ev => asg[ev].includes(seatName)).sort((a, b) => a.localeCompare(b)) };
  }
  function currentAssignmentsHTML(name) {
    const hasRoster = Object.values(window.ROSTER_2027 || {}).some(n => n.length);
    const seat = name && hasRoster ? currentSeat(name) : null;
    if (!seat) {
      const msg = hasRoster
        ? (name ? 'You are not on a 2026–27 team list yet. Check with the leaders if that looks wrong.' : 'Pick your name above to see your team and events for the 24-event slate.')
        : 'Assignments for the 24-event slate are made in the first club periods of the fall. Yours will appear here once the leaders post them.';
      return `<div class="season-coming"><div><span class="season-label">YOUR 2026–27 ASSIGNMENTS</span><h3>${hasRoster ? 'Teams are posted' : 'Coming soon'}<span aria-hidden="true">↗</span></h3><p>${msg}</p></div><span class="coming-pill">${hasRoster && !name ? 'See the Team page' : 'Not assigned yet'}</span></div>`;
    }
    return `<div class="season-coming is-live"><div><span class="season-label">YOUR 2026–27 ASSIGNMENTS · TEAM ${esc(seat.team)}</span>
      <h3>${seat.events.length ? seat.events.length + ' event' + (seat.events.length === 1 ? '' : 's') : 'Events to be assigned'}<span aria-hidden="true">↗</span></h3>
      <div class="season-events">${seat.events.map(ev => {
        const meta = (window.EVENTS || []).find(x => x.name === ev);
        return `<button class="season-event-chip current" data-current-ev="${esc(ev)}"><span>${meta ? meta.icon : '📌'}</span>${esc(ev)}</button>`;
      }).join('')}</div></div><span class="coming-pill">Team ${esc(seat.team)}</span></div>`;
  }

  function nextCountdownData() {
    const list = Array.isArray(window.COUNTDOWN_EVENTS) ? window.COUNTDOWN_EVENTS : [];
    const now = Date.now();
    return list
      .map(c => ({ label: c.label, date: new Date(c.date), t: new Date(c.date).getTime() }))
      .filter(c => !isNaN(c.t))
      .sort((a, b) => a.t - b.t)
      .map(c => ({ ...c, upcoming: c.t > now }));
  }

  function renderSeason() {
    const host = document.getElementById('season-personalizer');
    if (!host) return;
    const name = localStorage.getItem('fx_member') || '';
    const names = rosterNames();
    const leaders = window.TEAM_LEADERS || [];
    const isLeader = name && leaders.some(l => name.startsWith(l));

    const counts = nextCountdownData();
    const countdownHTML = counts.length ? `
      <div class="season-countdowns">
        ${counts.map((c, i) => {
          const days = Math.ceil((c.t - Date.now()) / 86400000);
          const val = c.upcoming ? `${days}` : 'Done';
          const unit = c.upcoming ? (days === 1 ? ' day' : ' days') : '';
          return `<div class="countdown-card${i === 0 && c.upcoming ? ' next' : ''}">
            <div class="countdown-label">${esc(c.label)}</div>
            <div class="countdown-value">${val}${unit}</div>
            <div class="countdown-date">${c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>`;
        }).join('')}
      </div>` : '';

    if (!name) {
      host.innerHTML = `
        <div class="season-head">
          <div class="season-avatar">🦅</div>
          <div>
            <div class="season-greeting">Your seat on the team</div>
            <div class="season-sub">Pick your name to see your 2026–27 team and events, plus last year’s. Saved on this device only.</div>
          </div>
          <div class="season-picker">
            <select id="season-select" aria-label="Select your name">
              <option value="">Select your name…</option>
              ${names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
            </select>
            <button class="season-btn" type="button" id="season-save">Set</button>
          </div>
        </div>
        ${currentAssignmentsHTML('')}${countdownHTML}`;
      const sel = document.getElementById('season-select');
      const save = document.getElementById('season-save');
      const commit = () => {
        if (sel.value) {
          localStorage.setItem('fx_member', sel.value);
          renderSeason();
          confetti(window.innerWidth / 2, 160, 90);
          toast('Welcome, ' + sel.value.split(' ')[0] + '! 🦅');
        }
      };
      if (save) save.addEventListener('click', commit);
      if (sel) sel.addEventListener('change', () => { if (sel.value) commit(); });
      return;
    }

    const evs = memberEvents(name);
    const done = getDoneMilestones();
    const pct = Math.round((done.size / FX_MILESTONES.length) * 100);
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    host.innerHTML = `
      <div class="season-head">
        <div class="season-avatar">${esc(initials)}</div>
        <div>
          <div class="season-greeting">Welcome back, ${esc(name.split(' ')[0])}${isLeader ? ' ⭐' : ''}</div>
          <div class="season-sub">${isLeader ? 'Student Leader' : 'Team Member'} · ${evs.length} event${evs.length === 1 ? '' : 's'} in 2025–26</div>
        </div>
        <div class="season-picker">
          <button class="season-btn ghost" type="button" id="season-change">Switch member</button>
        </div>
      </div>
      <div class="season-body">
        <div class="season-label">Last year’s events · 2025–26 — tap to open</div>
        <div class="season-events">
          ${evs.length ? evs.map(e => {
            const ev = (window.ARCHIVED_EVENTS || []).find(x => x.name === e.ev);
            const icon = ev ? ev.icon : (window.REGIONAL_ICONS || {})[e.ev] || '📌';
            return `<button class="season-event-chip" data-ev="${esc(e.ev)}">
              <span>${icon}</span>${esc(e.ev)}<span class="se-team ${e.team === 'B' ? 'b' : ''}">${e.team}</span>
            </button>`;
          }).join('') : '<span class="season-sub">No assignments recorded for 2025–26.</span>'}
        </div>
        <div class="season-progress-wrap">
          <div class="season-label">2026–27 prep progress · ${done.size}/${FX_MILESTONES.length} milestones</div>
          <div class="season-progress-track"><div class="season-progress-fill" style="width:${pct}%"></div></div>
        </div>
      </div>
      ${currentAssignmentsHTML(name)}${countdownHTML}`;

    const change = document.getElementById('season-change');
    if (change) change.addEventListener('click', () => {
      localStorage.removeItem('fx_member');
      renderSeason();
    });
    host.querySelectorAll('.season-event-chip[data-current-ev]').forEach(chip => {
      chip.addEventListener('click', () => {
        const ev = (window.EVENTS || []).find(x => x.name === chip.dataset.currentEv);
        if (ev && window.openModal) window.openModal(ev);
      });
    });
    host.querySelectorAll('.season-event-chip[data-ev]').forEach(chip => {
      chip.addEventListener('click', () => {
        const ev = (window.ARCHIVED_EVENTS || []).find(x => x.name === chip.dataset.ev);
        if (ev && window.openModal) window.openModal(ev);
      });
    });
  }
  /* ===================================================================
     STUDY HUB
     =================================================================== */
  let studyTab = 'quiz';
  let quizState = null;
  // Timer state (module-level so it survives view switches)
  let timer = { total: 25 * 60, left: 25 * 60, running: false, phase: 'Focus', preset: 25, interval: null };

  function setStudyTab(tab) {
    if (!['quiz', 'timer', 'milestones'].includes(tab)) tab = 'quiz';
    studyTab = tab;
    document.querySelectorAll('.studyhub-subnav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.studyhub-section').forEach(s => s.classList.toggle('active', s.dataset.tab === tab));
    if (tab === 'quiz') startQuiz();
    if (tab === 'timer') renderTimer();
    if (tab === 'milestones') renderMilestones();
  }
  window.setStudyTab = setStudyTab;

  function initStudyHub() {
    const view = document.getElementById('view-studyhub');
    if (!view || view.dataset.built === '1') { setStudyTab(studyTab); return; }
    view.dataset.built = '1';
    view.innerHTML = `
      <header class="view-head">
        <div class="section-title reveal">Study Hub</div>
        <div class="section-subtitle reveal">An eight-question event quiz, a 25- or 50-minute focus timer, and the eight season milestones. Progress saves on this device.</div>
      </header>
      <div class="studyhub-subnav reveal">
        <button data-tab="quiz" class="active">❓ Quiz</button>
        <button data-tab="timer">⏱️ Focus Timer</button>
        <button data-tab="milestones">✅ Milestones</button>
      </div>
      <div class="studyhub-section active" data-tab="quiz"></div>
      <div class="studyhub-section" data-tab="timer"></div>
      <div class="studyhub-section" data-tab="milestones"></div>`;
    view.querySelectorAll('.studyhub-subnav button').forEach(b => {
      b.addEventListener('click', () => setStudyTab(b.dataset.tab));
    });
    if (window.initScrollAnimations) window.initScrollAnimations();
    setStudyTab(studyTab);
  }

  function stripHTML(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return d.textContent || ''; }

  // ---- Quiz ----
  function startQuiz() {
    const host = document.querySelector('.studyhub-section[data-tab="quiz"]');
    if (!host) return;
    const events = (window.EVENTS || []).slice();
    if (events.length < 4) { host.innerHTML = '<div class="quiz-card">Not enough event data to build a quiz.</div>'; return; }
    const pool = events.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[pool[i], pool[j]] = [pool[j], pool[i]]; }
    const picks = pool.slice(0, 8);
    const questions = picks.map((ev, i) => {
      if (i % 2 === 0) {
        // identify event from description
        const distractors = shuffle(events.filter(e => e.name !== ev.name)).slice(0, 3).map(e => e.name);
        return {
          q: 'Which event is this?',
          sub: '“' + stripHTML(ev.shortDesc) + '”',
          options: shuffle([ev.name, ...distractors]),
          answer: ev.name
        };
      }
      // type of event
      const labels = { study: 'Study (written test)', build: 'Build (construct a device)', lab: 'Lab / Hybrid (hands-on)' };
      return {
        q: `What type of event is ${ev.name}?`,
        sub: 'Pick the category it belongs to.',
        options: shuffle([labels.study, labels.build, labels.lab]),
        answer: labels[ev.type]
      };
    });
    quizState = { questions, idx: 0, score: 0, answered: false };
    paintQuiz();
  }
  function shuffle(arr) { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  function paintQuiz() {
    const host = document.querySelector('.studyhub-section[data-tab="quiz"]');
    if (!host || !quizState) return;
    const { questions, idx, score } = quizState;
    if (idx >= questions.length) {
      const pctScore = Math.round((score / questions.length) * 100);
      const emoji = pctScore >= 80 ? '🏆' : pctScore >= 50 ? '💪' : '📚';
      const msg = pctScore >= 80 ? 'Outstanding — you know your events!' : pctScore >= 50 ? 'Solid. A little more review and you’re golden.' : 'Keep studying — review the event overviews!';
      host.innerHTML = `
        <div class="quiz-card">
          <div class="quiz-result">
            <div class="qr-emoji">${emoji}</div>
            <div class="qr-score">${score} / ${questions.length}</div>
            <div class="qr-msg">${msg}</div>
            <button class="quiz-next" id="quiz-restart">Play again</button>
          </div>
        </div>`;
      host.querySelector('#quiz-restart').addEventListener('click', startQuiz);
      if (pctScore >= 80) { confetti(window.innerWidth / 2, window.innerHeight / 3, 110); }
      return;
    }
    const Q = questions[idx];
    const pct = Math.round((idx / questions.length) * 100);
    host.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress"><span>Question ${idx + 1} of ${questions.length}</span><span class="quiz-score">Score ${score}</span></div>
        <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-q">${esc(Q.q)}</div>
        <div class="quiz-q-sub">${esc(Q.sub)}</div>
        <div class="quiz-options">
          ${Q.options.map(o => `<button class="quiz-option" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}
        </div>
      </div>`;
    host.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => answerQuiz(btn, Q));
    });
  }
  function answerQuiz(btn, Q) {
    if (quizState.answered) return;
    quizState.answered = true;
    const chosen = btn.dataset.opt;
    const host = document.querySelector('.studyhub-section[data-tab="quiz"]');
    host.querySelectorAll('.quiz-option').forEach(b => {
      b.disabled = true;
      if (b.dataset.opt === Q.answer) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });
    if (chosen === Q.answer) quizState.score++;
    const card = host.querySelector('.quiz-card');
    const next = document.createElement('button');
    next.className = 'quiz-next';
    next.textContent = quizState.idx + 1 >= quizState.questions.length ? 'See results' : 'Next question';
    next.addEventListener('click', () => { quizState.idx++; quizState.answered = false; paintQuiz(); });
    card.appendChild(next);
  }

  // ---- Focus Timer ----
  function fmtTime(s) { const m = Math.floor(s / 60), ss = s % 60; return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; }
  function timerStats() {
    return {
      sessions: +(localStorage.getItem('fx_focus_sessions') || 0),
      minutes: +(localStorage.getItem('fx_focus_minutes') || 0)
    };
  }
  function renderTimer() {
    const host = document.querySelector('.studyhub-section[data-tab="timer"]');
    if (!host) return;
    const st = timerStats();
    const R = 104, C = 2 * Math.PI * R;
    host.innerHTML = `
      <div class="study-timer-panel" style="max-width:760px">
        <div class="timer-wrap">
          <div class="timer-ring-box">
            <svg viewBox="0 0 240 240">
              <defs>
                <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#8B1A1A"/>
                  <stop offset="100%" stop-color="#E8C96A"/>
                </linearGradient>
              </defs>
              <circle class="timer-ring-bg" cx="120" cy="120" r="${R}"></circle>
              <circle class="timer-ring-fg" id="timer-ring" cx="120" cy="120" r="${R}"
                stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0"></circle>
            </svg>
            <div class="timer-readout">
              <div class="timer-time" id="timer-time">${fmtTime(timer.left)}</div>
              <div class="timer-phase" id="timer-phase">${timer.phase}</div>
            </div>
          </div>
          <div class="timer-side">
            <div class="timer-presets">
              <button class="timer-preset${timer.preset === 25 ? ' active' : ''}" data-min="25" data-phase="Focus">Focus · 25</button>
              <button class="timer-preset${timer.preset === 50 ? ' active' : ''}" data-min="50" data-phase="Focus">Deep · 50</button>
              <button class="timer-preset${timer.preset === 5 ? ' active' : ''}" data-min="5" data-phase="Break">Break · 5</button>
              <button class="timer-preset${timer.preset === 15 ? ' active' : ''}" data-min="15" data-phase="Break">Break · 15</button>
            </div>
            <div class="timer-actions">
              <button class="timer-btn primary" id="timer-toggle">${timer.running ? '⏸ Pause' : '▶ Start'}</button>
              <button class="timer-btn ghost" id="timer-reset">↺ Reset</button>
            </div>
            <div class="timer-stats">
              <div class="timer-stat"><div class="ts-num" id="ts-sessions">${st.sessions}</div><div class="ts-lbl">Sessions done</div></div>
              <div class="timer-stat"><div class="ts-num" id="ts-minutes">${st.minutes}</div><div class="ts-lbl">Minutes focused</div></div>
            </div>
          </div>
        </div>
      </div>`;
    host.querySelectorAll('.timer-preset').forEach(b => b.addEventListener('click', () => {
      stopTimerInterval();
      timer.preset = +b.dataset.min;
      timer.total = timer.left = timer.preset * 60;
      timer.phase = b.dataset.phase;
      timer.running = false;
      renderTimer();
    }));
    host.querySelector('#timer-toggle').addEventListener('click', toggleTimer);
    host.querySelector('#timer-reset').addEventListener('click', () => { stopTimerInterval(); timer.left = timer.total; timer.running = false; updateTimerUI(); });
    updateTimerUI();
  }
  function updateTimerUI() {
    const timeEl = document.getElementById('timer-time');
    const ring = document.getElementById('timer-ring');
    const phaseEl = document.getElementById('timer-phase');
    const toggle = document.getElementById('timer-toggle');
    if (timeEl) timeEl.textContent = fmtTime(timer.left);
    if (phaseEl) phaseEl.textContent = timer.phase;
    if (toggle) toggle.textContent = timer.running ? '⏸ Pause' : '▶ Start';
    if (ring) {
      const R = 104, C = 2 * Math.PI * R;
      const frac = timer.total ? (timer.total - timer.left) / timer.total : 0;
      ring.setAttribute('stroke-dasharray', C.toFixed(1));
      ring.setAttribute('stroke-dashoffset', (C * (1 - frac)).toFixed(1));
    }
  }
  function toggleTimer() {
    timer.running ? stopTimerInterval() : startTimerInterval();
  }
  function startTimerInterval() {
    if (timer.interval) return;
    timer.running = true;
    updateTimerUI();
    timer.interval = setInterval(() => {
      timer.left--;
      if (timer.left <= 0) {
        const wasFocus = timer.phase === 'Focus';
        stopTimerInterval();
        timer.left = 0; updateTimerUI();
        if (wasFocus) {
          const s = timerStats();
          localStorage.setItem('fx_focus_sessions', s.sessions + 1);
          localStorage.setItem('fx_focus_minutes', s.minutes + timer.preset);
          confetti(window.innerWidth / 2, window.innerHeight / 3, 120);
          toast('🎉 Focus session complete — nice work!');
          timer.phase = 'Break'; timer.preset = 5; timer.total = timer.left = 5 * 60;
        } else {
          toast('☕ Break over — back to it!');
          timer.phase = 'Focus'; timer.preset = 25; timer.total = timer.left = 25 * 60;
        }
        if (studyTab === 'timer') renderTimer();
        return;
      }
      updateTimerUI();
    }, 1000);
  }
  function stopTimerInterval() {
    if (timer.interval) { clearInterval(timer.interval); timer.interval = null; }
    timer.running = false;
    updateTimerUI();
  }

  // ---- Milestones ----
  function renderMilestones() {
    const host = document.querySelector('.studyhub-section[data-tab="milestones"]');
    if (!host) return;
    const done = getDoneMilestones();
    const pct = Math.round((done.size / FX_MILESTONES.length) * 100);
    host.innerHTML = `
      <div class="milestone-head">
        <div>
          <div class="section-subtitle" style="margin:0">Tap each milestone as you complete it — your progress saves automatically.</div>
        </div>
        <div class="milestone-progress-num">${done.size}/${FX_MILESTONES.length} · ${pct}%</div>
      </div>
      <div class="season-progress-track" style="max-width:720px;margin-bottom:20px"><div class="season-progress-fill" style="width:${pct}%"></div></div>
      <div class="milestone-list">
        ${FX_MILESTONES.map(m => `
          <div class="milestone-item${done.has(m.id) ? ' done' : ''}" data-id="${m.id}">
            <div class="milestone-check">${done.has(m.id) ? '✓' : ''}</div>
            <div>
              <div class="ms-week">${esc(m.week)}</div>
              <div class="ms-title">${esc(m.title)}</div>
              <div class="ms-desc">${esc(m.desc)}</div>
            </div>
          </div>`).join('')}
      </div>`;
    host.querySelectorAll('.milestone-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const set = getDoneMilestones();
        set.has(id) ? set.delete(id) : set.add(id);
        saveDoneMilestones(set);
        const allDone = set.size === FX_MILESTONES.length;
        renderMilestones();
        if (allDone) { confetti(window.innerWidth / 2, window.innerHeight / 3, 150); toast('🏆 All season milestones complete!'); }
      });
    });
  }

  /* ===================================================================
     HOOK INTO EXISTING NAVIGATION
     =================================================================== */
  function wrapShowView() {
    document.addEventListener('site:viewchange', event => {
      const name = event.detail.name;
      if (name === 'studyhub') initStudyHub();
      if (name === 'home') renderSeason();
    });
  }

  /* ===================================================================
     INIT
     =================================================================== */
  function init() {
    exposeGlobals();
    initTheme();
    initScrollChrome();
    initPalette();
    wrapShowView();
    // Below the opening shot: render when the main thread is idle.
    if ('requestIdleCallback' in window) requestIdleCallback(() => renderSeason(), { timeout: 1200 }); else setTimeout(renderSeason, 0);

    const themeBtn = document.getElementById('fx-theme');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    const paletteBtn = document.getElementById('fx-cmd');
    if (paletteBtn) paletteBtn.addEventListener('click', openPalette);
    const topBtn = document.getElementById('fx-top');
    if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Refresh countdowns each minute
    setInterval(() => { if (document.getElementById('view-home').classList.contains('active')) renderSeason(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =====================================================================
   CINEMATIC CONTROLLER — plain scripts, isolated from team tools.
   One motion vocabulary: site.out = cubic-bezier(.16,1,.3,1),
   site.inOut = cubic-bezier(.65,0,.35,1); durations .16 / .42 / .9 s.
   Scrubs use ease 'none'; the podium rise uses power4.out by design.
   All view-owned pins/tweens are reverted before navigation or grid edits.
   CDN failure and reduced motion both leave the static content usable.
   ===================================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const html = document.documentElement;
  const main = document.getElementById('main-content');
  const nav = document.querySelector('.nav-bar');
  const D1 = .16, D2 = .42, D3 = .9;
  const CSS_EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
  const VIEW_ACCENTS = {
    home: '#801d32', newcomer: '#9a6a1f', events: '#5c1428', regional: '#a02444', roster: '#6a1a3a',
    resources: '#3b1c2e', studyhub: '#8a3a2a', ai: '#2c2a4a', request: '#7d6a2a', leaders: '#1f0b12', contact: '#801d32'
  };
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let context = null;
  let buildFrame = 0;
  let resizeTimer = 0;
  let lenis = null;
  let ticker = null;
  let lastScroll = window.scrollY;
  let lastScrollTime = performance.now();
  let scrollVelocity = 0;
  let navFrame = 0;
  let navIdle = 0;
  let blurStep = -1;
  let headlineHTML = null;
  let field = null;
  let ready = false;
  let layoutWidth = innerWidth;
  let skewTo = null;

  function motion() { return !reduce.matches && !!window.gsap; }
  function overlayOpen() { return document.body.style.overflow === 'hidden'; }

  /* ---- Easing: exact cubic-bezier solver registered once ---- */
  function bezier(x1, y1, x2, y2) {
    const A = (a1, a2) => 1 - 3 * a2 + 3 * a1, B = (a1, a2) => 3 * a2 - 6 * a1, C = a1 => 3 * a1;
    const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
    const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
    return x => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-6) break;
        t -= (calc(t, x1, x2) - x) / s;
      }
      return calc(Math.min(1, Math.max(0, t)), y1, y2);
    };
  }
  function registerMotion() {
    if (!window.gsap) return;
    gsap.registerEase('site.out', bezier(.16, 1, .3, 1));
    gsap.registerEase('site.inOut', bezier(.65, 0, .35, 1));
    gsap.defaults({ ease: 'site.out', duration: D2 });
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });
    }
  }

  /* ---- Opening title card (once per session; any click or key skips) ---- */
  function runIntro() {
    const card = document.getElementById('fx-intro');
    if (!card || !html.dataset.intro) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('rcs_intro', '1'); } catch (e) { /* private mode */ }
      delete html.dataset.intro;
      card.remove();
      document.removeEventListener('keydown', onKey, true);
    };
    if (!window.gsap) { finish(); return; }
    const count = document.getElementById('fx-intro-count');
    const state = { n: Number(count.textContent) || 2000 };
    const remaining = Math.max(0, 2026 - state.n) / 26;
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(state, { n: 2026, duration: .5 * remaining, ease: 'site.out', onUpdate: () => { count.textContent = String(Math.round(state.n)); } }, 0)
      .to(card.querySelector('.fx-intro-dash'), { opacity: 1, duration: D1 }, .44)
      .to(card.querySelector('.fx-intro-name'), { opacity: 1, y: 0, duration: D2 }, .28)
      .to(card.querySelector('.fx-intro-text'), { opacity: 0, duration: D1, ease: 'site.inOut' }, .74)
      .to(card.querySelector('.fx-intro-top'), { clipPath: 'inset(0 0 100% 0)', duration: D2, ease: 'site.inOut' }, .7)
      .to(card.querySelector('.fx-intro-bottom'), { clipPath: 'inset(100% 0 0 0)', duration: D2, ease: 'site.inOut' }, .7);
    const skip = () => tl.progress(1);
    const onKey = e => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); skip(); } };
    card.addEventListener('click', skip);
    document.addEventListener('keydown', onKey, true);
  }

  /* ---- Custom cursor: cream dot, ring over interactive targets ---- */
  function initCursor() {
    const el = document.getElementById('fx-cursor');
    if (!el || !motion() || !fine.matches) return;
    const x = gsap.quickTo(el, 'x', { duration: D1, ease: 'site.out' });
    const y = gsap.quickTo(el, 'y', { duration: D1, ease: 'site.out' });
    gsap.set(el, { x: -100, y: -100 });
    const RING = 'a, button, [role="button"], summary, label, select, .fx-palette-item, .milestone-item';
    const TEXT = 'input, textarea, [contenteditable="true"]';
    let shown = false;
    window.addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!shown) { shown = true; html.classList.add('has-cursor'); }
      x(e.clientX); y(e.clientY);
      const t = e.target;
      const closest = sel => !!(t && t.closest && t.closest(sel));
      el.classList.toggle('is-text', closest(TEXT));
      el.classList.toggle('is-ring', closest(RING));
    }, { passive: true });
    const hide = () => { html.classList.remove('has-cursor'); shown = false; };
    html.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
  }

  /* ---- Magnetic hero buttons: ~12px attraction inside a soft field ---- */
  function initMagnetic() {
    const zone = document.querySelector('.hero-actions');
    if (!zone || !motion() || !fine.matches) return;
    const R = 12, PAD = 36;
    const buttons = Array.from(zone.querySelectorAll('button')).map(btn => ({
      btn,
      x: gsap.quickTo(btn, 'x', { duration: D2, ease: 'site.out' }),
      y: gsap.quickTo(btn, 'y', { duration: D2, ease: 'site.out' })
    }));
    zone.addEventListener('pointermove', e => {
      buttons.forEach(b => {
        const r = b.btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const inside = Math.abs(dx) < r.width / 2 + PAD && Math.abs(dy) < r.height / 2 + PAD;
        if (!inside) { b.x(0); b.y(0); return; }
        b.x(Math.max(-1, Math.min(1, dx / (r.width / 2 + PAD))) * R);
        b.y(Math.max(-1, Math.min(1, dy / (r.height / 2 + PAD))) * R);
      });
    });
    zone.addEventListener('pointerleave', () => buttons.forEach(b => { b.x(0); b.y(0); }));
  }

  /* ---- FLIP nav indicator that slides between tabs and carries the view colour ---- */
  function initNavIndicator() {
    const ind = nav.querySelector('.nav-indicator');
    const inner = nav.querySelector('.nav-inner');
    if (!ind || !inner) return;
    let first = null;
    function place(animate) {
      const tab = nav.querySelector('.nav-tab.active');
      if (!tab) return;
      const name = (tab.getAttribute('onclick').match(/'([a-z]+)'/) || [])[1];
      const accent = VIEW_ACCENTS[name] || '#801d32';
      html.style.setProperty('--view-accent', accent);
      const last = { x: tab.offsetLeft, w: tab.offsetWidth };
      html.classList.add('has-nav-indicator');
      if (window.gsap && motion() && animate && first) {
        gsap.fromTo(ind, { x: first.x, width: first.w }, { x: last.x, width: last.w, backgroundColor: accent, duration: D2, ease: 'site.out', overwrite: true });
      } else if (window.gsap) {
        gsap.set(ind, { x: last.x, width: last.w, backgroundColor: accent });
      } else {
        ind.style.transform = 'translateX(' + last.x + 'px)';
        ind.style.width = last.w + 'px';
        ind.style.backgroundColor = accent;
      }
      first = last;
      const left = tab.offsetLeft - (inner.clientWidth - tab.offsetWidth) / 2;
      if (inner.scrollWidth > inner.clientWidth) inner.scrollTo({ left, behavior: motion() ? 'smooth' : 'auto' });
    }
    document.addEventListener('site:viewchange', () => place(true));
    window.addEventListener('resize', () => place(false));
    document.fonts?.ready.then(() => place(false));
    place(false);
  }

  /* ---- Page wipe: the target tab's colour sweeps across between views ---- */
  function initWipe() {
    const wipe = document.getElementById('fx-wipe');
    const original = window.showView;
    if (!wipe || typeof original !== 'function') return;
    let busy = false;
    window.showView = function (name, tab) {
      const current = document.querySelector('.view.active');
      if (busy || !motion() || document.hidden || !current || current.id === 'view-' + name) return original(name, tab);
      busy = true;
      wipe.style.setProperty('--wipe-color', VIEW_ACCENTS[name] || '#801d32');
      return new Promise(resolve => {
        gsap.timeline()
          .set(wipe, { clipPath: 'inset(0 100% 0 0)' })
          .to(wipe, { clipPath: 'inset(0 0% 0 0)', duration: D2, ease: 'site.inOut' })
          .add(() => {
            html.classList.add('wiping');
            Promise.resolve(original(name, tab)).catch(() => {}).then(() => {
              html.classList.remove('wiping');
              gsap.to(wipe, {
                clipPath: 'inset(0 0 0 100%)', duration: D2, ease: 'site.out',
                onComplete: () => { busy = false; gsap.set(wipe, { clipPath: 'inset(0 100% 0 0)' }); resolve(); }
              });
            });
          });
      });
    };
  }

  /* ---- Scene helpers ---- */
  function leave() {
    cancelAnimationFrame(buildFrame);
    buildFrame = 0;
    if (context) { context.revert(); context = null; }
    const heading = document.querySelector('.home-hero h2');
    if (headlineHTML !== null && heading) {
      heading.innerHTML = headlineHTML;
      heading.removeAttribute('aria-label');
      headlineHTML = null;
    }
    html.classList.remove('cinema-live');
    nav.classList.remove('nav-away');
  }

  function splitHeadline(heading) {
    headlineHTML = heading.innerHTML;
    heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
    function split(node) {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(word => {
            if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
            const group = document.createElement('span');
            group.className = 'hero-word';
            group.setAttribute('aria-hidden', 'true');
            Array.from(word).forEach(char => {
              const mask = document.createElement('span');
              mask.className = 'hero-char-mask';
              const letter = document.createElement('span');
              letter.className = 'hero-char';
              letter.textContent = char;
              mask.append(letter); group.append(mask);
            });
            fragment.append(group);
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) split(child);
      });
    }
    split(heading);
    return heading.querySelectorAll('.hero-char');
  }

  // A keyboard user always gets a stationary, visible target immediately.
  function settleOnFocus(card, tween) {
    const settle = () => { tween.scrollTrigger?.kill(); tween.progress(1); };
    card.addEventListener('focusin', settle);
    context.add(() => () => card.removeEventListener('focusin', settle));
  }

  function assembleCards(cards, distance = 70) {
    cards.forEach((card, i) => {
      const tween = gsap.fromTo(card,
        { x: (i % 2 ? 1 : -1) * distance, rotationY: i % 2 ? -7 : 7, rotationZ: i % 2 ? 1 : -1, scale: .97 },
        { x: 0, rotationY: 0, rotationZ: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 104%', end: 'top 78%', scrub: .25 } });
      settleOnFocus(card, tween);
    });
  }

  function entrance(items, stagger) {
    Array.from(items).forEach((item, i) => {
      const tween = gsap.fromTo(item, { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: D3, ease: 'site.out', delay: stagger ? (i % 6) * .05 : 0,
        scrollTrigger: { trigger: item, start: 'top 96%', once: true }
      });
      settleOnFocus(item, tween);
    });
  }

  function risePodium(bars, trigger) {
    if (!bars.length) return;
    gsap.fromTo(bars, { scaleY: 0 }, {
      scaleY: 1, duration: D3, ease: 'power4.out', stagger: .08, overwrite: true,
      scrollTrigger: trigger ? { trigger, start: 'top 88%', once: true } : undefined
    });
  }

  function buildTicker() {
    const track = document.getElementById('ticker-track');
    if (!track || track.dataset.built) return;
    try {
      const items = REGIONAL_EVENTS.map((n, i) => ({ n, s: RIVERDALE_A_SCORES[i] }))
        .filter(x => x.s < 32).sort((a, b) => a.s - b.s);
      const markup = items.map(x => `<span class="ticker-item${x.s <= 3 ? ' is-gold' : ''}">${esc(x.n)}<strong>${ordinal(x.s)}</strong></span>`).join('');
      track.innerHTML = markup + markup;
      track.dataset.built = '1';
    } catch (e) { /* data globals unavailable */ }
  }

  /* ---- Home: pinned photograph, duotone → colour, aberration edge, counters ---- */
  function homeScene() {
    const hero = document.querySelector('.home-hero');
    hero.classList.add('scene-ready');
    context.add(() => () => hero.classList.remove('scene-ready'));
    const photo = hero.querySelector('.hero-photo-frame');
    const image = photo.querySelector('img');
    const caption = photo.querySelector('.hero-photo-caption');
    const shade = photo.querySelector('.hero-photo-shade');
    const duotone = photo.querySelectorAll('.hero-duotone span');
    const caR = document.getElementById('hero-ca-r');
    const caB = document.getElementById('hero-ca-b');
    const useCA = fine.matches && innerWidth >= 900 && caR && caB;
    const heading = hero.querySelector('h2');
    const chars = splitHeadline(heading);
    const introChars = [];
    for (const node of heading.children) {
      if (node.tagName === 'BR') break;
      introChars.push(...node.querySelectorAll('.hero-char'));
    }
    const scrollChars = Array.from(chars).filter(char => !introChars.includes(char));
    gsap.set(introChars, { yPercent: 0, rotationX: 0 });
    const h = hero.getBoundingClientRect();
    const p = photo.getBoundingClientRect();
    const scale = Math.max(h.width / p.width, h.height / p.height) * 1.04;
    const centerX = h.left + h.width / 2 - (p.left + p.width / 2);
    const centerY = h.top + h.height / 2 - (p.top + p.height / 2);
    const paintPhoto = progress => {
      const g = 1 - Math.min(1, Math.max(0, (progress - .45) / .5));
      const dx = useCA ? Math.sin(Math.min(1, Math.max(0, (progress - .1) / .7)) * Math.PI) * 2 : 0;
      if (useCA) { caR.setAttribute('dx', (-dx).toFixed(2)); caB.setAttribute('dx', dx.toFixed(2)); }
      image.style.filter = `grayscale(${g.toFixed(3)}) contrast(${(1 + .06 * g).toFixed(3)})` + (dx > .2 ? ' url(#hero-ca)' : '');
      duotone.forEach(layer => { layer.style.opacity = g.toFixed(3); });
    };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'home-cinematic', trigger: hero, start: 'top top',
        end: () => '+=' + Math.round(innerHeight * 1.5),
        pin: hero, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
        onToggle: self => { photo.style.willChange = self.isActive ? 'transform' : 'auto'; },
        onUpdate: self => paintPhoto(self.progress)
      }
    });
    context.add(() => () => { image.style.filter = ''; duotone.forEach(layer => { layer.style.opacity = ''; }); });
    tl.fromTo(photo, { x: centerX, y: centerY, scale: scale, rotation: 0 },
      { x: 0, y: 0, scale: 1, rotation: -1.5, duration: 1 }, 0);
    tl.fromTo(image, { scale: 1.12 }, { scale: 1, duration: 1.2 }, 0);
    tl.fromTo(shade, { opacity: .72 }, { opacity: 0, duration: .9 }, .1);
    tl.fromTo(caption, { yPercent: 90, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45 }, .65);
    tl.fromTo(scrollChars, { yPercent: 110, rotationX: -65 },
      { yPercent: 0, rotationX: 0, duration: .34, stagger: .012, ease: 'site.out' }, .02);
    tl.fromTo(hero.querySelector('.hero-cue'), { opacity: 1 }, { opacity: 0, duration: .15 }, .9);
    paintPhoto(0);

    // Numbers count with scroll; "1st" and "2–3" keep their suffixes and dashes.
    document.querySelectorAll('.stat-card .number').forEach(number => {
      const original = number.textContent;
      if (/\d[a-z]/i.test(original)) return; // ordinals such as "1st" stay put
      const state = { value: 0 };
      const label = number.parentElement.querySelector('.label').textContent;
      number.parentElement.setAttribute('role', 'group');
      number.parentElement.setAttribute('aria-label', original + ' ' + label);
      number.setAttribute('aria-hidden', 'true');
      gsap.to(state, {
        value: 1, ease: 'none',
        scrollTrigger: { trigger: number.parentElement, start: 'top 95%', end: 'bottom 40%', scrub: 1.2 },
        onUpdate: () => { number.textContent = original.replace(/\d+/g, n => String(Math.round(Number(n) * state.value))); }
      });
      context.add(() => () => { number.textContent = original; });
    });

    buildTicker();
    const track = document.getElementById('ticker-track');
    if (track && track.dataset.built) {
      gsap.fromTo(track, { x: 0 }, {
        x: () => -Math.max(0, track.scrollWidth / 2 - innerWidth * .2), ease: 'none',
        scrollTrigger: { trigger: '#view-home', start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true }
      });
      skewTo = gsap.quickTo(track, 'skewX', { duration: D2, ease: 'site.out' });
      context.add(() => () => { skewTo = null; });
    }

    document.querySelectorAll('.tip-item').forEach((card, i) => {
      gsap.fromTo(card, { rotationX: 10, rotationZ: i % 2 ? 1.5 : -1.5, scale: .95 },
        { rotationX: 0, rotationZ: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 96%', end: 'top 55%', scrub: .5 } });
      gsap.from(card.querySelector('.tip-top'), {
        scaleX: .35, transformOrigin: 'left', ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 65%', scrub: true }
      });
    });
  }

  /* ---- Events: editorial index, huge ghost word follows the pointer with lag ---- */
  function indexGhost(grid) {
    const ghost = document.getElementById('index-ghost');
    const shell = ghost?.parentElement;
    if (!ghost || !shell) return;
    gsap.set(ghost, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(ghost, 'x', { duration: D3, ease: 'site.out' });
    const yTo = gsap.quickTo(ghost, 'y', { duration: D3, ease: 'site.out' });
    const show = (name, cx, cy) => {
      if (ghost.textContent !== name) ghost.textContent = name;
      ghost.classList.add('is-on');
      const r = shell.getBoundingClientRect();
      xTo(cx - r.left); yTo(cy - r.top);
    };
    const hide = () => ghost.classList.remove('is-on');
    const onMove = e => { const card = e.target.closest?.('.event-card'); if (card) show(card.dataset.name, e.clientX, e.clientY); };
    const onFocus = e => {
      const card = e.target.closest?.('.event-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      show(card.dataset.name, r.left + r.width / 2, r.top + r.height / 2);
    };
    const onBlur = e => { if (!grid.contains(e.relatedTarget)) hide(); };
    grid.addEventListener('pointermove', onMove, { passive: true });
    grid.addEventListener('pointerleave', hide);
    grid.addEventListener('focusin', onFocus);
    grid.addEventListener('focusout', onBlur);
    context.add(() => () => {
      grid.removeEventListener('pointermove', onMove);
      grid.removeEventListener('pointerleave', hide);
      grid.removeEventListener('focusin', onFocus);
      grid.removeEventListener('focusout', onBlur);
      hide();
    });
  }

  function eventsScene() {
    const grid = document.getElementById('events-grid');
    indexGhost(grid);
    if (document.getElementById('event-search').value.trim()) return;
    assembleCards(Array.from(grid.children), innerWidth < 720 ? 28 : 80);
    gsap.fromTo('.catalog-count', { rotation: -10, x: 55 }, { rotation: 0, x: 0, ease: 'none',
      scrollTrigger: { trigger: '.catalog-hero', start: 'top 80%', end: 'bottom 25%', scrub: .7 } });
  }

  /* ---- New members: field notes with parallax depth and a timeline that draws ---- */
  function newcomerScene() {
    const view = document.getElementById('view-newcomer');
    const hero = view.querySelector('.newcomer-hero');
    const objects = view.querySelectorAll('.science-object');
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top 70px',
      end: () => '+=' + innerHeight * .75, pin: true, scrub: .8, anticipatePin: 1 } })
      .fromTo(objects, { scale: .65 }, { scale: 1.15, rotation: i => [32, -24, 90][i], duration: 1, ease: 'none' }, 0)
      .fromTo(hero.querySelectorAll('.newcomer-word'),
        { xPercent: i => (i % 2 ? 16 : -12) * (innerWidth < 720 ? .3 : 1), rotation: i => i % 2 ? 3 : -3 },
        { xPercent: 0, rotation: 0, stagger: .1, duration: .6, ease: 'site.out' }, 0)
      .to(hero.querySelector('.newcomer-scroll'), { opacity: 0, duration: .2, ease: 'none' }, .75);
    objects.forEach((object, i) => {
      gsap.to(object, { y: [-340, 420, -220][i], x: [100, -110, 65][i],
        ease: 'none', scrollTrigger: { trigger: view, start: 'top top', end: 'bottom bottom', scrub: 1.2 } });
    });
    const cards = Array.from(view.querySelectorAll('.info-card'));
    assembleCards(cards, innerWidth < 720 ? 24 : 90);
    cards.forEach((card, i) => {
      // Three depth layers: each card drifts at its own rate against the science objects.
      const depth = [18, 34, 26][i % 3];
      gsap.fromTo(card, { y: depth }, { y: -depth, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      gsap.fromTo(card.querySelector('h3'), { x: i % 2 ? 30 : -30 },
        { x: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top 93%', end: 'top 62%', scrub: .65 } });
      const lines = card.querySelectorAll('li, .comp-day-item');
      if (lines.length) gsap.fromTo(lines, { x: 22 },
        { x: 0, stagger: .07, ease: 'none', scrollTrigger: { trigger: card, start: 'top 85%', end: 'bottom 85%', scrub: .65 } });
    });
    const timeline = view.querySelector('.comp-day-timeline');
    if (timeline) gsap.fromTo(timeline, { '--draw': 0 }, { '--draw': 1, ease: 'none',
      scrollTrigger: { trigger: timeline, start: 'top 85%', end: 'bottom 55%', scrub: .5 } });
  }

  /* ---- Results: five-chapter scorebook, pinned rail, rising podiums ---- */
  function regionalScene(view) {
    const grid = document.getElementById('results-grid');
    const cards = Array.from(grid.querySelectorAll('.result-card'));
    const marks = Array.from(grid.querySelectorAll('.results-chapter-mark'));
    const railIndex = document.getElementById('rail-index');
    const railTotal = document.getElementById('rail-total');
    const railChapter = document.getElementById('rail-chapter');
    const railEvent = document.getElementById('rail-event');
    const total = Number(grid.dataset.chapterCount || 0);
    if (railTotal) railTotal.textContent = String(total).padStart(2, '0');
    let current = null;
    const setRail = card => {
      if (!card || card === current || !railEvent) return;
      current = card;
      railIndex.textContent = String(card.dataset.chapter || 1).padStart(2, '0');
      railChapter.textContent = card.dataset.chapterTitle || '';
      railEvent.textContent = card.dataset.event || '';
      gsap.fromTo(railEvent, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: D2, ease: 'site.out', overwrite: true });
    };
    entrance(view.querySelectorAll('.standing-card'), true);
    marks.forEach(mark => gsap.fromTo(mark, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: D3, ease: 'site.out',
      scrollTrigger: { trigger: mark, start: 'top 94%', once: true } }));
    cards.forEach(card => {
      entrance([card]);
      risePodium(card.querySelectorAll('.podium-bar'), card);
    });
    // The rail follows the row nearest the reading line (45% down the viewport), first card in that row.
    let pickFrame = 0;
    const pick = () => {
      pickFrame = 0;
      const line = innerHeight * .45;
      let best = null, bestDistance = Infinity;
      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const distance = r.top > line ? r.top - line : (r.bottom < line ? line - r.bottom : 0);
        const better = distance < bestDistance - 1 || (Math.abs(distance - bestDistance) <= 1 && best && r.left < best.getBoundingClientRect().left);
        if (better) { best = card; bestDistance = distance; }
      });
      setRail(best);
    };
    if (cards.length) {
      ScrollTrigger.create({ trigger: grid, start: 'top bottom', end: 'bottom top',
        onUpdate: () => { if (!pickFrame) pickFrame = requestAnimationFrame(pick); } });
      gsap.fromTo('#rail-bar', { scaleX: 0 }, { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: grid, start: 'top 55%', end: 'bottom 45%', scrub: .3 } });
      setRail(cards[0]);
      context.add(() => () => cancelAnimationFrame(pickFrame));
    }
    const hero = view.querySelector('.regional-hero');
    if (hero) gsap.fromTo(hero.querySelector('h2'), { x: -22, opacity: 0 }, { x: 0, opacity: 1, duration: D3, ease: 'site.out' });
  }

  /* ---- Roster: scroll-linked film strip above the grid ---- */
  function buildStrip() {
    const strip = document.getElementById('roster-strip');
    if (!strip || strip.dataset.built || typeof getStudentRecords !== 'function') return;
    try {
      const leaders = window.TEAM_LEADERS || [];
      const frames = getStudentRecords().map((st, i) => {
        const initials = st.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const leader = leaders.some(l => st.name.startsWith(l));
        return `<div class="strip-frame${leader ? ' is-leader' : ''}"><span class="strip-index">${String(i + 1).padStart(2, '0')}</span><span class="strip-team">${st.teams.map(t => 'TEAM ' + t).join(' / ')}</span><span class="strip-initials">${esc(initials)}</span><span class="strip-name">${esc(st.name)}</span></div>`;
      }).join('');
      strip.innerHTML = `<div class="strip-track">${frames}</div>`;
      strip.dataset.built = '1';
    } catch (e) { /* roster unavailable */ }
  }

  function rosterScene(view) {
    buildStrip();
    const strip = document.getElementById('roster-strip');
    const track = strip?.querySelector('.strip-track');
    if (track) {
      gsap.fromTo(track, { x: 0 }, {
        x: () => -Math.max(0, track.scrollWidth - strip.clientWidth), ease: 'none',
        scrollTrigger: { trigger: view, start: 'top 60%', end: '+=140%', scrub: 1, invalidateOnRefresh: true }
      });
      skewTo = gsap.quickTo(track, 'skewX', { duration: D2, ease: 'site.out' });
      context.add(() => () => { skewTo = null; });
    }
    assembleCards(Array.from(view.querySelectorAll('.roster-card')), 35);
  }

  function supportingScene(view) {
    entrance(view.querySelectorAll('.resource-card, .contact-card, .roster-card, .tip-item, .studyhub-subnav, .milestone-item'), true);
    const hero = view.querySelector('.section-title');
    if (hero) gsap.fromTo(hero, { x: -22 }, { x: 0, duration: D3, ease: 'site.out' });
  }

  let fieldPending = false;
  function ensureField() {
    if (field || fieldPending || reduce.matches) return;
    fieldPending = true;
    const start = () => { fieldPending = false; if (!field) field = createField(); };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 }); else setTimeout(start, 200);
  }

  function buildView() {
    buildFrame = 0;
    if (!ready) return;
    leave();
    const view = document.querySelector('.view.active');
    if (!view) return;
    // The opaque opening shot hides the field; create it once a scene can show it.
    if (view.id !== 'view-home' || window.scrollY > 50) ensureField();
    if (!motion() || !window.ScrollTrigger) return;
    html.classList.add('cinema-live');
    context = gsap.context(() => {}, main);
    context.add(() => {
      if (view.id === 'view-home') homeScene();
      else if (view.id === 'view-events') eventsScene();
      else if (view.id === 'view-newcomer') newcomerScene();
      else if (view.id === 'view-regional') regionalScene(view);
      else if (view.id === 'view-roster') rosterScene(view);
      else supportingScene(view);
    });
    ScrollTrigger.refresh();
  }

  function refreshView() {
    if (!ready) return;
    cancelAnimationFrame(buildFrame);
    buildFrame = requestAnimationFrame(buildView);
  }

  function setupModalMotion() {
    const overlays = Array.from(document.querySelectorAll('.modal-overlay'));
    const returnFocus = new Map();
    overlays.forEach(overlay => {
      const dialog = overlay.querySelector('.modal');
      if (!dialog) return;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('tabindex', '-1');
      const title = dialog.querySelector('h2');
      if (title?.id) dialog.setAttribute('aria-labelledby', title.id);
      new MutationObserver(() => {
        const open = !overlay.classList.contains('hidden');
        if (open && !returnFocus.has(overlay)) {
          returnFocus.set(overlay, document.activeElement);
          if (!reduce.matches) dialog.animate([
            { transform: 'perspective(1200px) rotateX(3deg) translateY(14px) scale(.97)', opacity: .3 },
            { transform: 'perspective(1200px) rotateX(0deg) translateY(0) scale(1)', opacity: 1 }
          ], { duration: D2 * 1000, easing: CSS_EASE_OUT });
          dialog.focus({ preventScroll: true });
        } else if (!open && returnFocus.has(overlay)) {
          const previous = returnFocus.get(overlay);
          returnFocus.delete(overlay);
          if (previous?.isConnected) previous.focus({ preventScroll: true });
        }
      }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
    });
    // The result dialog re-renders on prev/next; every fresh podium rises from its baseline.
    const resultBody = document.getElementById('result-modal-body');
    if (resultBody) new MutationObserver(() => {
      if (!motion()) return;
      risePodium(resultBody.querySelectorAll('.podium-lg .podium-bar'));
    }).observe(resultBody, { childList: true });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !document.getElementById('fx-palette').classList.contains('hidden')) return;
      const overlay = overlays.find(el => !el.classList.contains('hidden'));
      if (!overlay) return;
      const controls = Array.from(overlay.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]'))
        .filter(el => !el.disabled && el.getClientRects().length);
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === overlay.querySelector('.modal'))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function setupLenis() {
    if (ticker && window.gsap) gsap.ticker.remove(ticker);
    if (lenis) lenis.destroy();
    lenis = null; ticker = null;
    if (reduce.matches || !fine.matches || innerWidth <= 800 || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    lenis = new Lenis({
      duration: .85, smoothWheel: true, syncTouch: false,
      anchors: true,
      prevent: node => !!node.closest('[data-lenis-prevent], input, textarea, select')
    });
    lenis.on('scroll', ScrollTrigger.update);
    ticker = seconds => { if (!document.hidden) lenis.raf(seconds * 1000); };
    gsap.ticker.fps(60);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    if (overlayOpen()) lenis.stop();
  }

  function scrollTop() {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    lastScroll = 0;
    nav.classList.remove('nav-away');
  }

  function updateNav() {
    navFrame = 0;
    const y = window.scrollY;
    const now = performance.now();
    scrollVelocity = (y - lastScroll) / Math.max(16, now - lastScrollTime);
    lastScroll = y; lastScrollTime = now;
    if (skewTo) skewTo(Math.max(-6, Math.min(6, scrollVelocity * 4)));
    const step = Math.min(3, Math.floor(y / 180));
    if (step !== blurStep) { nav.style.setProperty('--nav-blur', (step * 4) + 'px'); blurStep = step; }
    const focused = nav.contains(document.activeElement);
    nav.classList.toggle('nav-away', !reduce.matches && fine.matches && innerWidth > 800 && y > 300 && scrollVelocity > .6 && !focused && !overlayOpen());
    clearTimeout(navIdle);
    navIdle = setTimeout(() => { nav.classList.remove('nav-away'); if (skewTo) skewTo(0); }, 850);
  }

  /* ---- Signature material: crimson ink in water, WebGL2 curl-noise advection ---- */
  const SIM_GLSL = `#version 300 es
precision highp float;
uniform sampler2D uPrev; uniform vec2 uRes; uniform float uTime, uDt, uScroll, uQuant; uniform vec4 uPointer;
in vec2 vUv; out vec4 o;
vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h2(i).x, h2(i + vec2(1, 0)).x, f.x), mix(h2(i + vec2(0, 1)).x, h2(i + vec2(1, 1)).x, f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int k = 0; k < 3; k++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
vec2 curl(vec2 p){ float e = .025;
  return vec2(fbm(p + vec2(0, e)) - fbm(p - vec2(0, e)), fbm(p - vec2(e, 0)) - fbm(p + vec2(e, 0))) / (2. * e); }
void main(){
  vec2 aspect = vec2(uRes.x / uRes.y, 1.);
  vec2 p = vUv * aspect;
  vec2 vel = curl(p * 1.5 + vec2(0., uTime * .025)) * .16;
  vel.y += uScroll * .35;
  vec2 d = p - uPointer.xy * aspect;
  float pf = exp(-dot(d, d) * 38.);
  vel += uPointer.zw * pf * .55;
  vec4 prev = texture(uPrev, vUv - vel * uDt / aspect);
  float ink = prev.r;
  float decay = ink * .32 * uDt;
  if (uQuant > .5) { ink -= (h2(vUv * uRes + uTime).x < decay * 255.) ? 1. / 255. : 0.; } else { ink -= decay; }
  ink += pf * min(length(uPointer.zw) * 1.6, 1.) * uDt * 7.;
  vec2 e1 = vec2(.5 + .34 * sin(uTime * .05), .5 + .3 * cos(uTime * .037)) * aspect;
  vec2 e2 = vec2(.5 + .3 * cos(uTime * .043 + 2.), .5 + .34 * sin(uTime * .031 + 1.)) * aspect;
  ink += exp(-dot(p - e1, p - e1) * 120.) * uDt * (.55 + .35 * sin(uTime * .2));
  ink += exp(-dot(p - e2, p - e2) * 140.) * uDt * (.45 + .35 * cos(uTime * .17));
  o = vec4(clamp(ink, 0., 1.), 0., 0., 1.);
}`;
  const DRAW_GLSL = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec3 uInk, uEdge; in vec2 vUv; out vec4 o;
void main(){
  float d = texture(uTex, vUv).r;
  float a = smoothstep(.015, .6, d);
  vec3 c = mix(uEdge, uInk, smoothstep(.08, .8, d));
  o = vec4(c * a, a);
}`;
  const VERT_GLSL = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

  function createField() {
    const canvas = document.getElementById('science-field');
    if (!canvas) return null;
    let gl = null;
    try { gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return createField2D(canvas);
    const lowPower = navigator.connection?.saveData;
    const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);
    let w = 0, h = 0, sw = 0, sh = 0, frame = 0, last = 0, visible = false, tPrev = 0;
    let ink = hex('#801d32'), edge = hex('#b04a63');
    const pointer = { x: -1, y: -1, vx: 0, vy: 0, time: 0 };
    const compile = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = frag => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT_GLSL)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    };
    let sim, draw, targets = [], cur = 0, halfFloat = false;
    try {
      sim = program(SIM_GLSL); draw = program(DRAW_GLSL);
      halfFloat = !!gl.getExtension('EXT_color_buffer_float');
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      [sim, draw].forEach(p => { gl.useProgram(p); const loc = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); });
    } catch (e) { return createField2D(canvas); }
    const U = {};
    ['uPrev', 'uRes', 'uTime', 'uDt', 'uScroll', 'uQuant', 'uPointer'].forEach(n => { U[n] = gl.getUniformLocation(sim, n); });
    ['uTex', 'uInk', 'uEdge'].forEach(n => { U[n] = gl.getUniformLocation(draw, n); });
    function target() {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, halfFloat ? gl.RGBA16F : gl.RGBA8, sw, sh, 0, gl.RGBA, halfFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && halfFloat) { halfFloat = false; return target(); }
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb };
    }
    function resize() {
      w = innerWidth; h = innerHeight;
      const density = w < 720 ? .3 : .42;
      sw = Math.max(64, Math.round(w * density)); sh = Math.max(64, Math.round(h * density));
      canvas.width = sw; canvas.height = sh;
      targets.forEach(t => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); });
      targets = [target(), target()];
      cur = 0;
      paint(performance.now(), true);
    }
    function theme() {
      const dark = html.dataset.theme === 'dark';
      ink = hex(dark ? '#b03a5b' : '#801d32'); edge = hex(dark ? '#e6b66b' : '#b04a63');
      paint(performance.now(), true);
    }
    function paint(time, still) {
      if (!targets.length) return;
      const dt = still ? 0 : Math.min(.05, Math.max(.001, (time - tPrev) / 1000));
      tPrev = time;
      const next = 1 - cur;
      gl.viewport(0, 0, sw, sh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[next].fb);
      gl.useProgram(sim);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, targets[cur].tex);
      gl.uniform1i(U.uPrev, 0);
      gl.uniform2f(U.uRes, sw, sh);
      gl.uniform1f(U.uTime, time / 1000);
      gl.uniform1f(U.uDt, dt);
      gl.uniform1f(U.uScroll, Math.max(-12, Math.min(12, scrollVelocity)) * .06);
      gl.uniform1f(U.uQuant, halfFloat ? 0 : 1);
      gl.uniform4f(U.uPointer, pointer.x / w, 1 - pointer.y / h, pointer.vx, -pointer.vy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      cur = next;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, sw, sh);
      gl.useProgram(draw);
      gl.bindTexture(gl.TEXTURE_2D, targets[cur].tex);
      gl.uniform1i(U.uTex, 0);
      gl.uniform3f(U.uInk, ink[0], ink[1], ink[2]);
      gl.uniform3f(U.uEdge, edge[0], edge[1], edge[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      pointer.vx *= .9; pointer.vy *= .9; scrollVelocity *= .96;
    }
    function tick(time) {
      if (!visible || document.hidden || reduce.matches || lowPower) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
      if (time - last < 1000 / 60 - .5) return;
      last = time; paint(time);
    }
    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (visible && !document.hidden && !reduce.matches && !lowPower) { tPrev = performance.now(); frame = requestAnimationFrame(tick); }
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(main);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', e => {
      const now = performance.now(), dt = Math.max(8, now - pointer.time) / 1000;
      if (pointer.x >= 0) {
        pointer.vx = Math.max(-2.5, Math.min(2.5, ((e.clientX - pointer.x) / w) / dt));
        pointer.vy = Math.max(-2.5, Math.min(2.5, ((e.clientY - pointer.y) / h) / dt));
      }
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.time = now;
    }, { passive: true });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(frame); frame = 0; }, false);
    canvas.addEventListener('webglcontextrestored', () => { targets = []; resize(); sync(); }, false);
    new MutationObserver(theme).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    theme(); resize();
    return { resize, sync, kind: 'webgl2' };
  }

  // Fallback when WebGL is unavailable: the original 2D drifting field.
  function createField2D(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    let frame = 0, last = 0, visible = false, w = 0, h = 0;
    let points = [], sprite = null, color = '#801d32';
    let pointer = { x: -1000, y: -1000, vx: 0, vy: 0, time: 0 };
    const lowPower = navigator.connection?.saveData;
    function resize() {
      w = innerWidth; h = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, w < 720 ? .8 : 1.25);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = w < 720 ? 18 : 38;
      points = Array.from({ length: count }, (_, i) => ({
        x: (i * 137.508 % 997) / 997 * w, y: (i * 231.79 % 991) / 991 * h,
        vx: Math.sin(i * 2.4) * .14, vy: Math.cos(i * 3.1) * .12, r: 1 + i % 3
      }));
      paint(performance.now());
    }
    function theme() {
      const dark = html.dataset.theme === 'dark';
      color = dark ? '#e6b66b' : '#801d32';
      sprite = document.createElement('canvas'); sprite.width = sprite.height = 256;
      const sc = sprite.getContext('2d');
      const gradient = sc.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, dark ? 'rgba(176,54,89,.5)' : 'rgba(128,29,50,.3)');
      gradient.addColorStop(1, 'rgba(128,29,50,0)');
      sc.fillStyle = gradient; sc.fillRect(0, 0, 256, 256);
      paint(performance.now());
    }
    function paint(time) {
      ctx.clearRect(0, 0, w, h);
      if (!sprite) return;
      for (let i = 0; i < 3; i++) {
        const x = w * (.2 + i * .3) + Math.sin(time / 14000 + i) * 60;
        const y = h * (.3 + (i % 2) * .35) + Math.cos(time / 16000 + i) * 50;
        ctx.drawImage(sprite, x - 240, y - 240, 480, 480);
      }
      ctx.fillStyle = color; ctx.strokeStyle = color;
      points.forEach((p, i) => {
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (!reduce.matches && !lowPower) {
          const influence = Math.max(0, 1 - distance / 220);
          p.x += p.vx + pointer.vx * influence * .012;
          p.y += p.vy + pointer.vy * influence * .012 - Math.max(-12, Math.min(12, scrollVelocity)) * .035;
          p.x = (p.x + w) % w; p.y = (p.y + h) % h;
        }
        ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        const q = points[(i + 1) % points.length];
        if (Math.hypot(p.x - q.x, p.y - q.y) < 175) {
          ctx.globalAlpha = .2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      });
      ctx.globalAlpha = 1; pointer.vx *= .92; pointer.vy *= .92; scrollVelocity *= .97;
    }
    function tick(time) {
      if (!visible || document.hidden || reduce.matches || lowPower) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
      if (time - last < 1000 / 60 - .5) return;
      last = time; paint(time);
    }
    function sync() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (visible && !document.hidden && !reduce.matches && !lowPower) frame = requestAnimationFrame(tick);
      else paint(performance.now());
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(main);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', e => {
      const now = performance.now(), dt = Math.max(16, now - pointer.time);
      pointer.vx = Math.max(-30, Math.min(30, (e.clientX - pointer.x) * 16 / dt));
      pointer.vy = Math.max(-30, Math.min(30, (e.clientY - pointer.y) * 16 / dt));
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.time = now;
    }, { passive: true });
    new MutationObserver(theme).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    theme(); resize();
    return { resize, sync, kind: '2d' };
  }

  window.SiteMotion = {
    leave, refreshView, scrollTop,
    beforeRender(name) {
      if (document.getElementById('view-' + name)?.classList.contains('active')) leave();
    },
    get field() { return field; }
  };

  function init() {
    ready = true;
    registerMotion();
    runIntro();
    // Everything that reads layout or wires secondary interactions waits for the first paint.
    const later = () => { setupLenis(); setupModalMotion(); initNavIndicator(); initWipe(); initCursor(); initMagnetic(); };
    if ('requestIdleCallback' in window) requestIdleCallback(later, { timeout: 600 }); else setTimeout(later, 40);
    // Prepare pins before input; inserting a pin inside the first scroll caused a jump.
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) ensureField();
      if (!navFrame) navFrame = requestAnimationFrame(updateNav);
    }, { passive: true });
    nav.addEventListener('focusin', () => nav.classList.remove('nav-away'));
    new MutationObserver(() => {
      if (!lenis) return;
      if (overlayOpen()) lenis.stop(); else lenis.start();
      nav.classList.remove('nav-away');
    }).observe(document.body, { attributes: true, attributeFilter: ['style'] });
    document.querySelector('.roster-next')?.addEventListener('toggle', () => window.ScrollTrigger?.refresh());
    window.addEventListener('resize', () => {
      // Mobile browser chrome and keyboards resize height repeatedly during a swipe.
      // Keep existing pins/text intact; real width/orientation changes still rebuild.
      const widthChanged = Math.abs(innerWidth - layoutWidth) > 1;
      if (!widthChanged && (!fine.matches || innerWidth <= 800)) return;
      layoutWidth = innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { setupLenis(); field?.resize(); refreshView(); }, 180);
    });
    reduce.addEventListener('change', () => { setupLenis(); field?.sync(); refreshView(); });
    refreshView();
    document.fonts?.ready.then(() => window.ScrollTrigger?.refresh());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
