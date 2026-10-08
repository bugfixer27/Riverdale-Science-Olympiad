# Riverdale Science Olympiad Website

A static GitHub Pages site for Riverdale Science Olympiad. It has no build step: GitHub can host it directly from `index.html`.

## Local Preview

From the repository folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages Setup

1. Push this repository to GitHub.
2. In GitHub, open **Settings > Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Choose the `main` branch and the `/root` folder.
5. Save. GitHub will publish the site at the Pages URL shown on that screen.

## Editing Site Content

Most season updates live in one file:

`assets/js/data.js`

Update these sections:

- `TEAM_LEADERS`: names that should be marked as student leaders on the roster.
- `LEADERS_PASSWORD`: the light client-side password for the Leaders page. This is only meant to stop casual access; it is visible in the site files.
- `LEADERS_BUDGET_URL`: the Google Sheets budget link shown on the Leaders page.
- `BUDGET_API_URL`: the deployed Google Apps Script Web App URL used by the Leaders budget frontend.
- `BUDGET_API_TOKEN`: a light shared token sent to the Apps Script API. This is visible in the site files, so it only prevents casual use.
- `STUDENT_PROFILES`: optional leader-only notes and practice test score fields for each student.
- `EVENTS`: event cards, modal descriptions, rule summaries, links, and tips.
- `REGIONAL_EVENTS`, `RIVERDALE_A_SCORES`, `RIVERDALE_B_SCORES`: event order and scores.
- `TEAM_A_ASSIGNMENTS`, `TEAM_B_ASSIGNMENTS`: members assigned to each event.
- `TOP5`: regional top-five placements shown in result modals.
- `COUNTDOWN_EVENTS`: dates for the live countdowns on the Home "Your Season" panel. Edit as the 2026–27 calendar firms up.

### 2026–27 teams and assignments

`assets/js/roster-2027.js` is generated from the TeamFit Team Builder. Don't edit it by hand. Make changes in the
Team Builder, save there, then run:

```bash
node tools/sync-teamfit.mjs
```

The script calls the Team Builder's read-only `load` action and writes only first names (with a last initial
when two members share a first name), teams, and events. Emails, grades, and survey answers are not copied.
The Team page's 2026–27 roster, the Home "Your Season" assignments, and the ⌘K teammate search all read it.

Rejected purchase requests (status `Rejected / Cut`, set by the **Reject** button on the Leaders page) are
hidden from the dashboard. The row stays in the budget sheet as a record.

## 2026 Experience Layer

A second styling/behavior layer (`assets/css/enhancements.css` + `assets/js/features.js`) adds a set of features on top of the original site. None of it requires a build step or any new dependency — it is plain CSS and vanilla JavaScript, and it reads the same data in `assets/js/data.js`.

- **Command palette** — press `⌘K` / `Ctrl+K` (or `/`) to fuzzy-search every page, event, teammate, resource, and quick action, then jump there with the keyboard.
- **Dark / light theme** — the floating moon/sun button (bottom-right) toggles a full dark theme. The choice is remembered per device and respects the system preference on first visit.
- **Study Hub tab** — flip-card flashcards for all 24 catalog events, a multiple-choice quiz, a Pomodoro focus timer that tracks sessions/minutes, and a season milestone checklist. Flashcards, quiz, timer stats, and milestones all run client-side; progress saves in the browser.
- **SciOly AI tab** — sends a question to the team's Palantir Foundry-backed AI endpoint and displays its answer.
- **Home "Your Season" panel** — pick your name to see your assigned events, prep progress, and live countdowns to the next season's milestones. Saved on the device only.
- **Polish** — scroll progress bar, back-to-top button, toast notifications, and confetti on wins (gold medal, completed focus session, finished checklist).

All new data is stored in the browser's `localStorage` only; nothing is uploaded.

### SciOly AI API Setup

The AI form sends this request:

```http
POST /api/scioly-ai
Content-Type: application/json

{"query":"the student's question"}
```

The endpoint should return JSON in the form `{"answer":"the model's answer"}`. Update `SCIOLY_AI_API_URL` near the top of `assets/js/app.js` if the API team provides a different URL. Because this is a public static site, Foundry credentials must stay in the API/backend and must not be added to the website JavaScript.

### Leaders Page Notes

The Leaders page uses the password in `LEADERS_PASSWORD` and remembers access for the current browser session. It is not real security because this is a static GitHub Pages site.

The budget frontend reads from the `UPDATED-SCIOLY Budgets and needs` spreadsheet through a Google Apps Script Web App. Setup instructions and the API script live in [docs/BUDGET_API_SETUP.md](docs/BUDGET_API_SETUP.md).
There is also a public purchase request page in the main nav; the protected Leaders page keeps the same form plus live request/spending cards and status controls.

To add notes or practice test scores, edit `STUDENT_PROFILES`:

```js
const STUDENT_PROFILES = {
  "Student Name": {
    notes: "Add private leader notes here.",
    practiceTests: {
      "Hovercraft": "Score or comment goes here"
    }
  }
};
```

The home-page team photo is stored at:

`assets/images/riverdale-team-2026.webp` (desktop) and `assets/images/riverdale-team-2026-mobile.webp` (under 720px)

Replace both WebP files if the team photo changes. Keep the same filenames if you do not want to edit HTML.

## File Structure

```text
index.html                  Main GitHub Pages entry point
sciolyedit.html             Redirect for the old file name
assets/css/styles.css       Layout, colors, responsive behavior, transitions
assets/css/enhancements.css Theme engine, palette, study hub, dark mode, cinema layer
assets/js/data.js           Editable team/event/results data
assets/js/app.js            Rendering, filters, modals, navigation, animations
assets/js/features.js       Command palette, themes, study hub, personalization
assets/images/              Local site images
assets/fonts/               Self-hosted Fraunces + Inter Tight subsets (OFL)
assets/vendor/              Lenis (MIT)
```

## Publishing Changes

```bash
git status
git add .
git commit -m "Update Science Olympiad website"
git push
```

After pushing to `main`, GitHub Pages will redeploy automatically.

## Cinematic frontend (still no build)

Open `index.html` through `python3 -m http.server 8000`. All 11 views still use
`showView()`; there is no framework, bundler, package install, or build step.
Motion lives in the scoped controller at the end of `assets/js/features.js`, with
presentation rules in the "Cinema layer" at the end of `assets/css/enhancements.css`.

### Type

- Self-hosted variable fonts in `assets/fonts/`: Fraunces (display; SOFT and WONK
  axes live, weight 300–900, optical size pinned at 120) plus Fraunces Italic for
  emphasis, and Inter Tight (text, weight 400–700). Both were subset with
  fontTools from the Google Fonts OFL sources; licenses sit alongside.
- `@font-face` uses `font-display: swap` with metric-matched fallbacks
  (Georgia and Arial with `size-adjust` and ascent/descent overrides), so the swap
  causes no layout shift. The two roman files are preloaded; the italic loads lazily.
- Headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`, and every
  numeral is Inter Tight with `tabular-nums` (Fraunces ships proportional figures).

### Motion vocabulary

- One ease pair everywhere: `--ease-out: cubic-bezier(.16,1,.3,1)` and
  `--ease-in-out: cubic-bezier(.65,0,.35,1)`, registered in GSAP as `site.out` and
  `site.inOut` through a small bezier solver. Durations are 160 / 420 / 900 ms.
  Scroll scrubs use `ease: none`; the podium rise uses `power4.out` by design.
- Opening title card, once per session (`sessionStorage.rcs_intro`): black frame,
  "2026–27" counting up in tabular figures, the school name in Fraunces, then a
  two-panel `clip-path` curtain. Any click or Enter/Space/Escape skips it; it is
  skipped entirely under reduced motion; CSS retires it after 2.4 s even if scripts
  never arrive.
- Signature material: `#science-field` is a WebGL2 fragment shader (41 lines of
  GLSL across three programs) running curl-noise advection of crimson ink through
  a half-float ping-pong buffer. Pointer velocity injects and pushes ink; scroll
  velocity drifts it; the theme swaps the palette. It renders at 30–42 % of the
  viewport resolution under `#main-content` at 30 % opacity, pauses when hidden or
  off-screen, is created on idle after the first scroll or view change, and falls
  back to the original 2D canvas when WebGL2 is unavailable. A fixed SVG
  `feTurbulence` grain overlay sits on top at 4 % (5.5 % in dark mode).
- Photograph: the team photo opens as a crimson–cream duotone (grayscale image,
  `lighten` and `multiply` blend layers) and scrubs back to colour as the hero
  un-pins, with a 2 px SVG chromatic-aberration edge during the scale-down on fine
  pointers at 900 px and up. The card shadow is replaced by a 1.5 px cream hairline.
- Custom cursor (cream dot that grows into a ring over interactive targets,
  `mix-blend-mode: difference`), hidden on touch and under reduced motion; magnetic
  hero buttons via `gsap.quickTo` with a 12 px pull; a FLIP nav indicator that
  slides between tabs and carries each view's accent colour; a full-screen colour
  wipe that crosses between views before the View Transition swap.
- Results view: five-chapter scorebook (life science, earth & space, physical
  science, builds, inquiry) with a sticky rail showing "01 / 05", the chapter, and
  the event nearest the reading line; medal placements render as podiums that rise
  from the baseline. The result dialog opens with a top-three podium from `TOP5`.
- Events view: a sticky filter column beside the index grid; hovering or focusing a
  card paints its name as a huge low-opacity word behind the grid that follows the
  pointer with lag. Hover states are one 3 px lift plus a left-to-right underline.
- Home: scroll-scrubbed ticker of the 2026 placements under the hero, counting
  statistics, and a season map. Team: a scroll-linked film strip of the roster.
  New Members: parallax depth on the field notes and a timeline that draws itself.
- Layout: generous left margin (`--page-left`), 12-column rows for section heads
  and the events/results/resources/contact views, and full-bleed bands for the
  home, events, and results openers.

### Loading

GSAP 3.15.0 and ScrollTrigger load from cdnjs; Lenis 1.3.26 is vendored in
`assets/vendor/`. A small inline loader at the end of `index.html` starts the
scripts right after the largest contentful paint (or after 300 ms, whichever comes
first) in document order, so the opening photograph never waits on JavaScript.
The hero image is preloaded per breakpoint; fonts are preloaded at low priority.
Reduced motion disables scroll scenes, smooth scrolling, the field, the cursor,
the wipe, and the title card. Core tools remain usable if the animation CDN fails.
Modals trap keyboard focus, restore it on dismissal, and retain Escape behaviour.

## Season data

`assets/js/events-2027.js` contains the exact 24 requested entries: 23 Division C
events linked to the supplied draft Drive references, plus Code Craze linked to
its official featured-trial resources. Search, the command palette, and Study Hub
use this catalog. The Drive folder does not contain a Code Craze reference.

The original events, results, and assignments in `assets/js/data.js` remain the
2025–26 archive. Home labels personal assignments as last year's events and shows
Coming soon for 2026–27 assignments. Team renders the archived roster, with a
separate expandable 2026–27 roster that also says Coming soon.

## Verification

Run `node --test tests/*.test.js` for dependency-free catalog and runtime contract
checks. These cover archive separation, roster filters, all 11 views, transition
races, Leaders gating, event/result dialogs, result comparison/navigation, and AI
and purchase request contracts. Network writes are mocked; tests do not submit
purchases or change live budget rows.

Browser checks (September 2026) ran against `python3 -m http.server` in headless
Chrome 152 (desktop 1440 px, mobile 390 px, light, dark, and reduced motion) and
Playwright WebKit 18.2 as the Safari-engine proxy: every tab, the event and result
dialogs including previous/next, the purchase form (submitted against a stubbed
endpoint so no sheet row was written), the Leaders gate and student modal, the
⌘K palette by keyboard plus the `/` shortcut, focus trapping and return, filters
and search, roster toggles, Study Hub flashcards/quiz/timer/milestones, and the
theme toggle. Zero console errors or warnings in either engine. Safari itself
could not be scripted on this machine (Apple Events JavaScript is disabled).

Lighthouse 12.8.2, default simulated throttling, local server without compression:
mobile **91** (three runs: 90, 91, 91) with FCP 2.1 s, LCP 3.2 s, TBT 0 ms,
CLS 0, Speed Index 2.7 s; desktop **99** with FCP 0.5 s, LCP 0.8 s, TBT 0 ms,
CLS 0. Accessibility and Best Practices score 100 on both. Exact values are in
`tests/performance-summary.json`. This is a local measurement; GitHub Pages adds
compression and a CDN, so production numbers will differ.

Design and implementation references:
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://gsap.com/docs/v3/GSAP/gsap.context()/
- https://github.com/darkroomengineering/lenis
- https://web.dev/articles/animations-guide
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

Event sources:
- https://drive.google.com/drive/folders/1hlSzDZuCUsxF2Q1OI9EgRWi8wXSZqLXX
- https://soinc.org/sites/default/files/uploaded_files/C_2027_Event_Slate.pdf
- https://www.soinc.org/learn/trial-events
