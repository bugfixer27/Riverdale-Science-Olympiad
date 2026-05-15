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

### Leaders Page Notes

The Leaders page uses the password in `LEADERS_PASSWORD` and remembers access for the current browser session. It is not real security because this is a static GitHub Pages site.

The budget frontend reads from the `UPDATED-SCIOLY Budgets and needs` spreadsheet through a Google Apps Script Web App. Setup instructions and the API script live in [docs/BUDGET_API_SETUP.md](docs/BUDGET_API_SETUP.md).

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

`assets/images/riverdale-team-2026.jpg`

Replace that file with another browser-friendly image if the team photo changes. Keep the same filename if you do not want to edit HTML.

## File Structure

```text
index.html                  Main GitHub Pages entry point
sciolyedit.html             Redirect for the old file name
assets/css/styles.css       Layout, colors, responsive behavior, transitions
assets/js/data.js           Editable team/event/results data
assets/js/app.js            Rendering, filters, modals, navigation, animations
assets/images/              Local site images
```

## Publishing Changes

```bash
git status
git add .
git commit -m "Update Science Olympiad website"
git push
```

After pushing to `main`, GitHub Pages will redeploy automatically.
