# Expendicure — SMS Bridge Architecture

## Overview

This document explains the complete SMS-to-expense pipeline: how bank SMS messages on your Android phone are automatically forwarded, parsed, and stored as pending transactions for review in the Expendicure web app.

```
Android Phone (Bank SMS)
        │
        │  HTTPS POST with secret key
        ▼
Node.js SMS Webhook Service  (port 4000)
        │  Parse → Categorize → Dedup → Store
        ▼
MySQL Database  (shared with Flask backend)
        │  status = 'pending'
        ▼
Flask Backend  (port 5000)
        │  REST APIs for CRUD + approve
        ▼
React Frontend  (port 3000)
        └── /pending-review  → User reviews, edits, approves
        └── /analytics       → Spending insights from approved SMS
        └── /dashboard       → Pending count badge + SMS income/expense
```

---

## Quick Start

### 1. Run the database migration

```sql
-- Connect to MySQL and run:
USE expendicure;
SOURCE database/sms_transactions_migration.sql;
```

### 2. Start the SMS Webhook Microservice (Node.js)

```bash
cd sms-service
npm install
npm run dev
# Running on http://localhost:4000
```

### 3. Start the Flask Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Running on http://localhost:5000
```

### 4. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

### 5. Run the parser tests

```bash
cd sms-service
npm test
```

---

## Android SMS Forwarding Setup

Since web apps cannot read Android SMS directly, you need a lightweight Android app to forward incoming SMS to the webhook. Here are the recommended options:

---

### Option A — SMS Forwarder (Recommended, Free)

**App:** [SMS Forwarder](https://play.google.com/store/apps/details?id=com.frzinapps.smsforward)
**Or:** Search "SMS to URL Forwarder" on the Play Store

**Setup Steps:**

1. Install the app on your Android phone
2. Open the app and go to **Add Rule**
3. Configure:
   - **Trigger:** All SMS  *(or filter by sender: SBIINB, HDFCBK, ICICIB, etc.)*
   - **Action:** HTTP Request
   - **URL:** `https://your-domain.com/api/sms-webhook`  *(or `http://10.0.2.2:4000/api/sms-webhook` for local testing)*
   - **Method:** POST
   - **Headers:** `X-Webhook-Secret: exp_sms_secret_change_me_in_production`
   - **Body (JSON):**
     ```json
     {
       "sender": "%from%",
       "message": "%body%",
       "timestamp": "%time%"
     }
     ```
4. Save the rule and **enable** the service

---

### Option B — MacroDroid (Most Flexible)

**App:** [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)

**Setup Steps:**

1. Install MacroDroid
2. Create a new **Macro**
3. **Trigger:** SMS Received
   - Filter: Check "Sender Contains" and add your bank sender IDs:
     `SBIINB, HDFCBK, ICICIB, AXISBK, KOTAKB`
4. **Action:** HTTP Request
   - URL: `https://your-domain.com/api/sms-webhook`
   - Method: POST
   - Headers: `X-Webhook-Secret: your_secret_here`
   - Body:
     ```
     {"sender":"[trigger_sms_sender]","message":"[trigger_sms_body]","timestamp":"[ldate] [ltime]"}
     ```
5. Enable the macro

---

### Option C — Automate (Flow-based, Free)

**App:** [Automate](https://play.google.com/store/apps/details?id=com.llamalab.automate)

1. Create a new flow
2. Add an **SMS received** block
3. Connect to an **HTTP request** block:
   - URL: `https://your-domain.com/api/sms-webhook`
   - Method: POST
   - Headers: `{"X-Webhook-Secret": "your_secret_here"}`
   - Body: `{"sender":"{{received.address}}","message":"{{received.body}}"}`

---

### Option D — Build a Custom Android App

For production deployments, consider building a minimal Android app using:

```gradle
// Required permissions in AndroidManifest.xml
<uses-permission android:name="android.permission.RECEIVE_SMS" />
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
```

The app registers a `BroadcastReceiver` for `android.provider.Telephony.SMS_RECEIVED`, extracts the sender and body, and POSTs to the webhook URL.

---

## Webhook API Reference

### POST /api/sms-webhook

Receives and processes a bank SMS message.

**Headers:**
```
Content-Type: application/json
X-Webhook-Secret: your_secret_key_here
```

**Request Body:**
```json
{
  "message": "Your A/c No. XX1234 debited for Rs.1,500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45,230.50",
  "sender": "SBIINB",
  "timestamp": "2026-08-03T12:00:00Z",
  "student_id": 1
}
```

| Field        | Type    | Required | Description                                    |
|--------------|---------|----------|------------------------------------------------|
| `message`    | string  | ✅        | Raw SMS body (5–2000 chars)                    |
| `sender`     | string  | No        | SMS sender ID (helps with bank detection)      |
| `timestamp`  | string  | No        | ISO8601 timestamp                              |
| `student_id` | integer | No        | Associate with specific user (defaults to first user) |

**Success Response (201):**
```json
{
  "success": true,
  "transaction_id": 42,
  "status": "pending",
  "parsed": {
    "type": "debit",
    "transactionType": "Expense",
    "amount": 1500.00,
    "merchant": "Zomato",
    "accountLast4": "1234",
    "category": "Food",
    "refNumber": null,
    "availableBalance": 45230.50,
    "transactionDate": "2026-08-03T00:00:00.000Z",
    "channel": "UPI",
    "bank": "SBI"
  }
}
```

**Duplicate Response (200):**
```json
{ "success": true, "duplicate": true, "message": "SMS already processed" }
```

**Non-transaction Response (200):**
```json
{ "success": true, "transaction": false, "message": "SMS is not a bank transaction", "reason": "non-transactional (OTP/promo/alert)" }
```

### GET /api/sms-webhook/health

Health check — no auth required.

```json
{ "status": "ok", "service": "expendicure-sms-service", "db": "connected", "timestamp": "..." }
```

---

## Sample cURL Test Commands

```bash
# ── Test: Valid SBI debit transaction
curl -X POST http://localhost:4000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: exp_sms_secret_change_me_in_production" \
  -d '{
    "sender": "SBIINB",
    "message": "Your A/c No. XX1234 debited for Rs.1500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45230.50"
  }'

# ── Test: HDFC credit (salary)
curl -X POST http://localhost:4000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: exp_sms_secret_change_me_in_production" \
  -d '{
    "sender": "HDFCBK",
    "message": "Your A/c XX5678 credited with Rs.50000.00 on 01-08-2026. Info: NEFT/SALARY. Avl Bal:Rs.95230.50"
  }'

# ── Test: OTP (should be ignored)
curl -X POST http://localhost:4000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: exp_sms_secret_change_me_in_production" \
  -d '{
    "sender": "SBIINB",
    "message": "Your OTP for SBI Internet Banking is 453721. Do not share this with anyone."
  }'

# ── Test: Missing secret (should return 401)
curl -X POST http://localhost:4000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -d '{"sender": "SBIINB", "message": "test"}'

# ── Health check
curl http://localhost:4000/api/sms-webhook/health
```

---

## Supported Bank SMS Formats

| Bank | Sender IDs | Types Supported |
|------|-----------|-----------------|
| SBI  | SBIINB, SBIUPI, SBICRD | UPI, NEFT, ATM, Card |
| HDFC | HDFCBK, HDFCCC, HDFCPAY | UPI, Card, NEFT |
| ICICI | ICICIB, ICICSMS | UPI, Card, IMPS |
| Axis | AXISBK, AXISBN | UPI, Card, NEFT |
| Kotak | KOTAKB, KOTAK | UPI, Card |
| All Banks | Any | Generic UPI/Card/ATM/NEFT |

---

## Parsed Fields

| Field | Description | Example |
|-------|-------------|---------|
| `type` | `debit` or `credit` | `debit` |
| `transactionType` | `Expense` or `Income` | `Expense` |
| `amount` | Parsed decimal amount | `1500.00` |
| `merchant` | Extracted payee name | `Zomato` |
| `accountLast4` | Last 4 digits of account/card | `1234` |
| `refNumber` | UPI/IMPS/UTR reference | `324678901234` |
| `availableBalance` | Available balance after txn | `45230.50` |
| `transactionDate` | Date from SMS text | `2026-08-03` |
| `channel` | `UPI`, `Card`, `ATM`, `Bank Transfer` | `UPI` |
| `bank` | Detected bank name | `SBI` |
| `category` | Auto-detected category | `Food` |

---

## Category Auto-Detection

The system automatically assigns categories based on merchant keywords:

| Keyword Examples | Category |
|-----------------|----------|
| Zomato, Swiggy, Dominos, KFC | Food |
| BigBasket, Blinkit, Zepto, DMart | Groceries |
| Uber, Ola, IRCTC, IndiGo | Travel |
| Netflix, Hotstar, BookMyShow, Spotify | Entertainment |
| Amazon, Flipkart, Myntra, Nykaa | Shopping |
| Apollo, Medplus, Pharmeasy | Healthcare |
| Airtel, Jio, Electricity, Broadband | Utilities |
| ATM, Cash Withdrawal | Cash Withdrawal |
| Salary, Payroll | Salary |
| Refund, Cashback | Refund |

Users can always override the category in the Pending Review page.

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| API Key Auth | `X-Webhook-Secret` header validated on every request |
| Rate Limiting | 20 requests/minute per IP (configurable) |
| Input Validation | express-validator sanitizes all fields |
| SQL Injection Prevention | Parameterized queries (mysql2) throughout |
| Deduplication | SHA-256 hash of (sender + message) prevents re-processing |
| HTTPS Enforcement | Redirect HTTP → HTTPS in production |
| Security Headers | Helmet.js sets CSP, HSTS, X-Frame-Options, etc. |
| Audit Logging | Every webhook request logged to `webhook_logs` table |

---

## REST API Endpoints (Flask)

### SMS Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sms-transactions/pending` | List all pending SMS transactions |
| `GET` | `/api/sms-transactions/` | List all SMS transactions (any status) |
| `GET` | `/api/sms-transactions/stats` | Pending count + income/expense totals |
| `PUT` | `/api/sms-transactions/:id` | Edit amount, merchant, category |
| `PUT` | `/api/sms-transactions/:id/approve` | Approve (with optional edits) |
| `DELETE` | `/api/sms-transactions/:id` | Delete/dismiss a transaction |

All endpoints require `Authorization: Bearer <jwt_token>` header.

---

## Bonus Feature Roadmap

| Feature | Description | Effort |
|---------|-------------|--------|
| **OCR Parsing** | Parse bank notification screenshots using Tesseract.js | Medium |
| **Email Statements** | Parse bank email statements via Gmail API | High |
| **AI Categorization** | Replace keyword matching with a fine-tuned classifier | High |
| **WebSocket Updates** | Real-time push to frontend when new SMS arrives | Low |
| **Budget Alerts** | Email/push notification when category budget is exceeded | Low |
| **Monthly Reports** | Auto-generate PDF reports using Puppeteer | Medium |
| **Recurring Detection** | Flag transactions with same merchant/amount pattern | Medium |
| **Fraud Alerts** | Z-score anomaly detection on transaction amounts | Medium |
| **Spending Insights** | "You spent 23% more on Food this month" | Low |

---

## Folder Structure

```
expendicure/
├── backend/                         # Python/Flask REST API (existing)
│   ├── routes/
│   │   ├── sms_transactions.py      # NEW — Pending review endpoints
│   │   └── dashboard.py             # UPDATED — pending_sms_count added
│   └── app.py                       # UPDATED — new blueprint registered
│
├── database/
│   ├── schema.sql                   # Existing base schema
│   ├── auth_table.sql               # Existing users table
│   └── sms_transactions_migration.sql # NEW — SMS tables + category seeds
│
├── frontend/                        # React (Vite) SPA (existing)
│   └── src/
│       ├── pages/
│       │   ├── PendingReview.jsx    # NEW — SMS review workflow
│       │   ├── Analytics.jsx        # NEW — Charts & spending insights
│       │   └── Dashboard.jsx        # UPDATED — SMS income/expense/pending
│       ├── components/
│       │   └── Navbar.jsx           # UPDATED — new links + pending badge
│       ├── styles/
│       │   └── index.css            # UPDATED — all new CSS appended
│       └── App.jsx                  # UPDATED — new routes added
│
└── sms-service/                     # NEW — Node.js SMS Webhook Microservice
    ├── config/db.js                 # MySQL2 connection pool
    ├── controllers/webhookController.js  # 9-step SMS pipeline
    ├── middleware/
    │   ├── apiKeyAuth.js            # X-Webhook-Secret validation
    │   ├── rateLimiter.js           # 20 req/min rate limiting
    │   └── requestValidator.js      # express-validator input sanitization
    ├── models/SmsTransaction.js     # Parameterized DB queries
    ├── routes/webhook.js            # Router with middleware chain
    ├── services/categoryService.js  # Keyword-based category detection
    ├── utils/
    │   ├── smsParser.js             # Core Regex SMS parser engine
    │   ├── hash.js                  # SHA-256 dedup hashing
    │   └── logger.js                # Winston structured logging
    ├── tests/
    │   ├── smsParser.test.js        # Parser unit tests
    │   └── webhook.test.js          # Webhook integration tests
    ├── .env                         # Environment variables
    ├── .gitignore
    ├── package.json
    └── server.js                    # Express entry point
```
