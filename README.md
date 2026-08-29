# AVA Payslip Generator v3.0

> Professional payslip generation app for AVA Passengers Transport with **full offline support**, Google Sheets integration, and Google Drive PDF storage.

![AVA Logo](assets/logo.png)

## Features

- **Auto Voucher Numbering**: `AVA_PS/MMYYYY_01` format, resets monthly
- **Employee Auto-Select**: Dropdown fills name, code, designation, basic salary
- **OT Calculator**: Additional Trip OT + Sunday/Holiday OT with custom rates
- **Real-time Calculations**: Gross, Deduction, Net pay updates as you type
- **Amount in Words**: Auto-converts net pay to English words
- **PDF Generation**: Professional voucher with AVA logo, signatures, bank details
- **Google Drive Storage**: PDFs auto-saved with voucher number as filename
- **Payslip Tracker**: Full history with clickable PDF links
- **Dashboard**: Live stats (employees, payslips, monthly totals)
- **Offline Mode**: Works without internet — syncs when connection returns

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Google Apps Script (JavaScript) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | Google Sheets |
| Storage | Google Drive |
| Offline | Service Worker, IndexedDB, jsPDF |

## Repository Structure

```
ava-payslip-generator/
├── src/
│   ├── Code.gs          # Backend (Google Apps Script)
│   └── Index.html       # Frontend (Web App UI)
├── assets/
│   └── logo.png         # AVA Bus Logo
├── README.md
└── DEPLOYMENT.md        # Step-by-step deployment guide
```

## Quick Start

### Prerequisites
- Google Account
- Google Sheet (for data storage)
- Google Drive Folder (for PDF storage)

### Deploy in 5 Steps

1. **Create Google Resources**
   - [Create a Google Sheet](https://sheets.new)
   - [Create a Google Drive Folder](https://drive.google.com)
   - Copy both IDs

2. **Update Config**
   - Open `src/Code.gs`
   - Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID
   - Replace `YOUR_DRIVE_FOLDER_ID_HERE` with your Folder ID

3. **Upload to Apps Script**
   - Open your Sheet → Extensions → Apps Script
   - Create `Code.gs` and paste backend code
   - Create `Index.html` and paste frontend code

4. **Run Setup**
   - Select `setupApp` function → Click Run
   - Grant all permissions

5. **Deploy**
   - Deploy → New Deployment → Web App
   - Execute as: Me | Access: Anyone
   - Copy URL and share

## Admin Access

- **Default Password**: `avaadmin2026`
- Change in `Code.gs` → `CONFIG.ADMIN_PASSWORD`

## Company Details (Pre-configured)

| Field | Value |
|-------|-------|
| Company | AVA Passengers Transport |
| Address | P.O. Box 91977, Dubai, UAE |
| Phone | 00971 4 3439666 |
| Email | Contact@avarental.ae |
| TRN | 100364388700003 |
| Bank | RAKBANK |
| IBAN | AE110400008371527349901 |

## Pre-loaded Employees

| Code | Name | Basic Salary |
|------|------|-------------|
| TR_01 | Mubarak Theyyampattil | 4,000 AED |
| TR_02 | Shahzeed | 3,000 AED |
| TR_03 | Ilyas | 3,000 AED |
| TR_04 | HASEEB | 3,000 AED |
| TR_05 | kamarvan kahan | 3,000 AED |
| TR_06 | kamarvan kahan | 3,000 AED |
| TR_07 | SHAKIR | 3,000 AED |
| TR_08 | Mohammed | 2,500 AED |
| TR_09 | ABDU SALAM | 2,500 AED |
| TR_10 | ABDUL GAFOOR | 2,500 AED |
| TR_11 | Mohammed GULREHMEN | 1,700 AED |

## Offline Behavior

| Scenario | Behavior |
|----------|----------|
| Online | Data saves to Google Sheets, PDFs upload to Drive |
| Offline | PDFs generated client-side with jsPDF, saved to browser storage |
| Back Online | Auto-detects connection, syncs pending payslips |

## License

Private — AVA Passengers Transport
