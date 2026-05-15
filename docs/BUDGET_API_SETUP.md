# Budget API Setup

GitHub Pages is static, so it cannot privately read or write a Google Sheet by itself. Use this Google Apps Script Web App as the small API layer.

## 1. Create the Apps Script

1. Open the spreadsheet: `UPDATED-SCIOLY Budgets and needs`.
2. Go to **Extensions > Apps Script**.
3. Replace the default script with the contents of `docs/apps-script-budget-api.js`.
4. Save the project.

## 2. Deploy as a Web App

1. Click **Deploy > New deployment**.
2. Choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy** and authorize the script.
6. Copy the Web App URL ending in `/exec`.

## 3. Connect the Website

Open `assets/js/data.js` and paste the Web App URL:

```js
const BUDGET_API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

The site sends `BUDGET_API_TOKEN` with each request, and the Apps Script checks the matching `API_TOKEN`. This is a light deterrent only because both values are visible in the static files.

After pushing to GitHub Pages, unlock the Leaders page and the budget section will load from the sheet.

## Notes

- The Leaders password is casual access control only. It is not real security.
- Purchase requests append to the `Purchase Requests` tab.
- The budget cards read from `Dashboard`, `Purchase Requests`, and `Spending Log`.
- If you edit column names in the sheet, update `docs/apps-script-budget-api.js` to match.
