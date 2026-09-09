# Expendicure — SMS Bridge Architecture Implementation Plan

## Overview

Build a complete **SMS-to-expense pipeline** for Expendicure: an Android phone intercepts bank SMS messages, a lightweight app forwards them to a secure Node.js webhook microservice, which parses the messages, saves them as **pending** transactions in MySQL, and the React frontend lets users review, edit, categorize, and approve them.

The existing **Python/Flask backend** is kept fully intact. The new **Node.js SMS Webhook Service** runs as a separate microservice on a different port, sharing the same MySQL database.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANDROID DEVICE                              │
│  Bank SMS received → SMS Forwarder App (e.g. "SMS to Webhook")      │
│  → HTTPS POST to /api/sms-webhook (with Secret Key header)          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           NODE.JS SMS WEBHOOK MICROSERVICE  (port 4000)             │
│  Rate Limiting → API Key Auth → Duplicate Check → SMS Parser        │
│  → Category Detector → MySQL INSERT (status=pending)                │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼ Shared MySQL DB
┌─────────────────────────────────────────────────────────────────────┐
│            PYTHON/FLASK BACKEND (port 5000) — UNCHANGED             │
│   Existing REST APIs: auth, transactions, budgets, dashboard...      │
│   + NEW endpoints: GET /pending, PUT /approve/:id, DELETE /:id       │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              REACT FRONTEND (Vite, port 5173)                        │
│  NEW: PendingReview page • Analytics page • Updated Dashboard        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> The existing backend is Python/Flask, not Node.js. The SMS Webhook will be a **separate Node.js microservice** in a new `sms-service/` folder. This avoids rewriting the existing working backend.

> [!WARNING]
> The MySQL credentials from the existing `.env` (`root / Krishu@123 / expendicure`) will be reused in the new Node.js service `.env`. Confirm these are correct before running.

> [!NOTE]
> The existing schema uses `students` as the user table. The new SMS transaction table will reference `students(id)` to stay consistent with the existing architecture.

---

## Open Questions

> [!IMPORTANT]
> **For the Android SMS Forwarder**: This plan will document how to configure a free open-source app like **[SMS Forwarder](https://github.com/bogkonstantin/android_income_sms_gate_push)** or **MacroDroid** to send webhooks. We won't build a custom Android app (out of scope). Should I include setup instructions for a specific Android app?

---

## Proposed Changes

### 1. Database Layer

#### [MODIFY] [schema.sql](file:///c:/Users/krish/OneDrive/Desktop/expendicure/database/schema.sql)
Add new columns and tables to the existing schema.

#### [NEW] [sms_transactions_migration.sql](file:///c:/Users/krish/OneDrive/Desktop/expendicure/database/sms_transactions_migration.sql)
New migration file adding:
- `sms_transactions` table — full SMS transaction data (id, user_id/student_id, amount, transaction_type, merchant, account_last4, category, status, raw_message, sender, sms_hash for dedup, created_at)
- `webhook_logs` table — audit trail of all received webhooks
- Default categories seed data

---

### 2. Node.js SMS Webhook Microservice

New folder: `sms-service/`

```
sms-service/
├── config/
│   └── db.js              # MySQL2 connection pool
├── controllers/
│   └── webhookController.js   # POST /api/sms-webhook logic
├── middleware/
│   ├── apiKeyAuth.js      # Webhook secret key validation
│   ├── rateLimiter.js     # express-rate-limit
│   └── requestValidator.js # Input sanitization
├── models/
│   └── SmsTransaction.js  # DB queries for sms_transactions
├── routes/
│   └── webhook.js         # Router
├── services/
│   └── categoryService.js # Keyword-based category detection
├── utils/
│   └── smsParser.js       # 🔑 Core SMS parsing engine (Regex)
├── .env                   # Environment variables
├── package.json
└── server.js              # Entry point
```

#### [NEW] `sms-service/utils/smsParser.js`
Core parser supporting:
- SBI, HDFC, ICICI, Axis, Kotak formats
- UPI, Card, ATM, NEFT/IMPS transactions
- Extracts: type, amount, merchant, account_last4, ref_number, balance, date
- Returns structured JSON

#### [NEW] `sms-service/controllers/webhookController.js`
- Validates API key header `X-Webhook-Secret`
- SHA-256 hashes raw message for dedup check
- Calls parser → category detector → DB insert
- Returns `{ success, transaction_id, parsed }` JSON

#### [NEW] `sms-service/server.js`
Express app with:
- Helmet (security headers)
- Rate limiting (20 req/min per IP)
- Morgan logging
- HTTPS enforcement header
- CORS

---

### 3. Python/Flask Backend Extensions

New routes added to existing Flask app without changing existing code.

#### [NEW] `backend/routes/sms_transactions.py`
New blueprint with:
- `GET /api/sms-transactions/pending` — list pending SMS transactions
- `PUT /api/sms-transactions/<id>/approve` — approve + edit a pending transaction
- `PUT /api/sms-transactions/<id>` — edit merchant/amount/category
- `DELETE /api/sms-transactions/<id>` — delete/ignore

#### [MODIFY] `backend/app.py`
Register new `sms_transactions_bp` blueprint.

#### [MODIFY] `backend/routes/dashboard.py`
Add `pending_sms_count` to dashboard summary response.

---

### 4. Frontend — New Pages & Updates

#### [NEW] `frontend/src/pages/PendingReview.jsx`
- Fetches `/api/sms-transactions/pending`
- Displays cards per pending SMS: raw message preview, parsed data
- Inline edit: amount, merchant, category dropdown
- Action buttons: **Approve** ✅ | **Delete** 🗑️
- Real-time count badge in Navbar

#### [NEW] `frontend/src/pages/Analytics.jsx`
- Monthly spending bar chart (Recharts BarChart)
- Category donut chart
- Income vs Expense line chart
- Top merchants list
- Spending trend cards

#### [MODIFY] `frontend/src/pages/Dashboard.jsx`
- Add "Pending SMS Review" stat card (count from `pending_sms_count`)
- Add Total Income stat card
- Show Income vs Expense badges on recent transactions

#### [MODIFY] `frontend/src/App.jsx`
- Add routes: `/pending-review`, `/analytics`

#### [MODIFY] `frontend/src/components/Navbar.jsx`
- Add nav links for Pending Review (with badge) and Analytics

---

### 5. Environment & Config

#### [NEW] `sms-service/.env`
```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Krishu@123
DB_NAME=expendicure
DB_PORT=3306
WEBHOOK_SECRET=your_webhook_secret_key_here
JWT_SECRET=expendicure-secret-key
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development
```

#### [MODIFY] `backend/.env`
Add `WEBHOOK_SECRET=your_webhook_secret_key_here`

---

### 6. Testing

#### [NEW] `sms-service/tests/smsParser.test.js`
Unit tests for parser with sample payloads from:
- SBI debit, SBI credit
- HDFC UPI, HDFC Card
- ICICI debit
- Axis Bank ATM withdrawal
- Kotak credit

#### [NEW] `sms-service/tests/webhook.test.js`
Integration test for POST /api/sms-webhook endpoint

---

## Verification Plan

### Automated Tests
```bash
cd sms-service && npm test
```

### Manual Verification
1. Start MySQL, run migration SQL
2. `cd sms-service && npm run dev` — Node service on port 4000
3. `cd backend && python app.py` — Flask on port 5000
4. `cd frontend && npm run dev` — React on port 5173
5. POST test webhook payload via curl/Postman to `localhost:4000/api/sms-webhook`
6. Open browser → `/pending-review` → verify SMS appears
7. Approve → verify it moves to transaction history

### Sample cURL Test
```bash
curl -X POST http://localhost:4000/api/sms-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_webhook_secret_key_here" \
  -d '{
    "sender": "SBIINB",
    "message": "Your A/c No. XX1234 debited for Rs.1,500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45,230.50",
    "timestamp": "2026-08-03T12:00:00Z"
  }'
```
Expected response:
```json
{
  "success": true,
  "transaction_id": 1,
  "parsed": {
    "type": "debit",
    "amount": 1500.00,
    "merchant": "Zomato",
    "account_last4": "1234",
    "category": "Food",
    "balance": 45230.50
  }
}
```
