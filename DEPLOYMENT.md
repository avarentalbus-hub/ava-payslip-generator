# AVA Payslip Generator — Deployment Guide

## Method 1: Manual Copy-Paste (Recommended for Beginners)

### Step 1: Get Your Google IDs

**Google Sheet ID**
1. Go to [Google Sheets](https://sheets.new) → Create blank spreadsheet
2. Copy the ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```

**Google Drive Folder ID**
1. Go to [Google Drive](https://drive.google.com)
2. Create folder named `AVA Payslips`
3. Open folder → Copy ID from URL:
   ```
   https://drive.google.com/drive/folders/THIS_IS_YOUR_FOLDER_ID
   ```

### Step 2: Update Code.gs

Open `src/Code.gs` and update these lines:

```javascript
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE',      // ← Replace this
  DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE', // ← Replace this
  ADMIN_PASSWORD: 'avaadmin2026',               // ← Optional: change password
  // ... rest stays the same
};
```

### Step 3: Create Apps Script Project

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete the default `Code.gs` file
3. Click **+** (Add File) → **Script** → Name it `Code`
4. Copy ALL content from `src/Code.gs` and paste it
5. Click **+** → **HTML** → Name it `Index`
6. Copy ALL content from `src/Index.html` and paste it

### Step 4: Run Setup (One Time)

1. In the Apps Script editor, select `setupApp` from the function dropdown
2. Click **Run** (▶️)
3. Grant all permissions when prompted
4. This creates: `Employees`, `Payslip Tracker`, and `Settings` sheets

### Step 5: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click ⚙️ (gear icon) → Select **Web app**
3. Configure:
   - **Description**: `AVA Payslip Generator v3`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` (or your organization)
4. Click **Deploy**
5. Copy the **Web App URL**

### Step 6: First Use

- Open the Web App URL in any browser
- Login with password: `avaadmin2026`
- The Service Worker will cache the app for offline use

---

## Method 2: Using clasp (Command Line)

### Prerequisites
- Node.js installed
- Google Account

### Install clasp
```bash
npm install -g @google/clasp
```

### Login
```bash
clasp login
```

### Clone this repo and push
```bash
git clone https://github.com/YOUR_USERNAME/ava-payslip-generator.git
cd ava-payslip-generator

# Create new Apps Script project
clasp create --type webapp --title "AVA Payslip Generator"

# Push code
clasp push

# Deploy
clasp deploy -d "AVA Payslip Generator v3"
```

### Update .clasp.json
```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./src"
}
```

---

## Method 3: GitHub Pages + GAS Backend (Advanced)

If you want to host the frontend on GitHub Pages and keep GAS as backend:

1. Fork this repo on GitHub
2. Go to **Settings → Pages** → Enable GitHub Pages
3. Modify `src/Index.html` to replace `google.script.run` with `fetch()` calls
4. Update `src/Code.gs` to add CORS headers and use `doPost()` for all requests
5. Deploy backend on GAS, frontend on GitHub Pages

> Note: This requires additional code changes. Use Method 1 for simplicity.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid password" | Check `CONFIG.ADMIN_PASSWORD` in Code.gs |
| "ScriptError" on setup | Make sure Sheet ID and Drive Folder ID are correct |
| PDF not generating offline | First load must be online to cache jsPDF library |
| Sync failing | Check that Drive folder permissions allow file creation |
| Employees not showing | Run `setupApp()` again to populate the Employees sheet |

---

## Post-Deployment Checklist

- [ ] Sheet ID updated in Code.gs
- [ ] Drive Folder ID updated in Code.gs
- [ ] Admin password changed (optional)
- [ ] `setupApp()` executed successfully
- [ ] Web app deployed
- [ ] Tested login
- [ ] Generated first payslip
- [ ] Verified PDF in Google Drive
- [ ] Checked Tracker sheet
- [ ] Tested offline mode (turn off WiFi)
