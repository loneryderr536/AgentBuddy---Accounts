# AgentBuddy Accounting - Google Sheets & AI Agent

An autonomous accounting agent built with **React**, **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS**. It enables you to take a live photo or upload receipts/vouchers, automatically extracts and verifies amounts and dates using AI, and synchronizes everything into **Google Sheets** across 5 structured views:

1. **Day - Book (Payments)**: Sequential payments journal with Voucher numbers, Remarks, and Totals.
2. **Payments (Ledger)**: Categorized expense heads (*Farewell Gifts, Membership Registration, Inauguration Expenses, Awareness Program, Camp Expenses, Bank Charges, Miscellaneous*).
3. **Day - Book (Receipts)**: Chronological income journal with Receipt numbers and amounts.
4. **Receipts (Ledger)**: Categorized income heads (*Bank Interest, Offertory, Donation, Registration*).
5. **Account Statement**: Two-column Budget vs. Actual reconciliation with Opening and Closing cash balances.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Set your keys:
\`\`\`env
# 1. Gemini API Key (from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=AIzaSy...

# 2. Google Spreadsheet ID (from your Google Sheet URL)
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XR...

# 3. Google Service Account (from Google Cloud Console)
GOOGLE_SERVICE_ACCOUNT_EMAIL=accounting-agent@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
\`\`\`

*(Note: The app also operates in interactive **Demo Mode** if credentials are not yet entered, allowing you to test the camera OCR and review workflow immediately!)*

### 3. Run Dev Server
\`\`\`bash
npm run dev
\`\`\`
Visit [http://localhost:3000](http://localhost:3000).

---

## 🐳 Docker Deployment

The application includes an optimized multi-stage `Dockerfile` with standalone Next.js output and `docker-compose.yml`.

### Option A: Using Docker Compose
\`\`\`bash
docker compose up --build -d
\`\`\`
The container will launch at [http://localhost:3000](http://localhost:3000).

### Option B: Using Docker CLI
\`\`\`bash
# Build the production image
docker build -t agent-buddy-accounting .

# Run the container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY="your_api_key" \
  -e GOOGLE_SHEETS_SPREADSHEET_ID="your_sheet_id" \
  -e GOOGLE_SERVICE_ACCOUNT_EMAIL="your_email" \
  -e GOOGLE_PRIVATE_KEY="your_private_key" \
  agent-buddy-accounting
\`\`\`

---

## ▲ Deploying to Vercel

1. **Push to GitHub / GitLab / Bitbucket**:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit of AgentBuddy Accounting"
   \`\`\`
2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your repository.
3. **Add Environment Variables in Vercel**:
   - `GEMINI_API_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` *(make sure to paste the full private key including headers)*
4. Click **Deploy**. Vercel will build and serve the application globally with zero configuration.

---

## 📊 Google Sheets Setup Guide

1. **Google Cloud Console**:
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/).
   - Enable **Google Sheets API**.
   - Navigate to **IAM & Admin > Service Accounts** and create a service account.
   - Click the created account, go to **Keys > Add Key > Create New Key > JSON**, and download the key file.
2. **Google Sheet Permission**:
   - Create a new Google Spreadsheet in Google Drive.
   - Click **Share** (top-right) and add the Service Account email with **Editor** permissions.
   - Copy the Sheet ID from the URL (the string between `/d/` and `/edit`).
3. **One-Click Sheet Init**:
   - In the AgentBuddy web interface, click **Sheets Connected / Demo** badge and choose **Initialize Spreadsheet**. It automatically creates and styles all 5 sheets!


## Apps Script setup (no service account / private key needed)
1. Open your Google Sheet → Extensions → Apps Script. Paste `apps-script/Code.gs` over the default file.
2. Project Settings (gear) → Script Properties → add `API_TOKEN` = a long random string.
3. Deploy → New deployment → type **Web app** → Execute as **Me**, Who has access **Anyone** → Deploy → authorize → copy the `/exec` URL.
4. In `.env` set `APPS_SCRIPT_URL=<that /exec URL>` and `APPS_SCRIPT_TOKEN=<same string as API_TOKEN>`; restart `npm run dev`.
5. After editing the script later, use Deploy → Manage deployments → Edit → New version (the URL stays the same).
