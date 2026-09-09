/**
 * utils/smsParser.js
 * ============================================================
 * Production-grade Indian bank SMS parser.
 *
 * Supports:
 *   - SBI (State Bank of India)
 *   - HDFC Bank
 *   - ICICI Bank
 *   - Axis Bank
 *   - Kotak Mahindra Bank
 *   - UPI transactions (any bank)
 *   - Credit/Debit card transactions
 *   - ATM withdrawals
 *   - NEFT / IMPS / RTGS transfers
 *
 * Returns a structured ParsedSms object or null if non-transactional.
 * ============================================================
 */

// ─── Helper: clean amount strings like "1,23,456.78" → 123456.78 ────────────
function parseAmount(str) {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ─── Helper: extract last 4 digits from patterns like XX1234 / ****1234 ─────
function extractLast4(str) {
  if (!str) return null;
  const match = str.match(/(?:XX|x{2,}|\*{2,})(\d{4})\b/i)
    || str.match(/\b(\d{4})\b$/);
  return match ? match[1] : null;
}

// ─── Helper: parse Indian date formats ───────────────────────────────────────
function parseIndianDate(str) {
  if (!str) return null;
  // DD-MM-YYYY or DD/MM/YYYY or DD-MMM-YYYY
  const patterns = [
    /(\d{2})[/-](\d{2})[/-](\d{4})/,         // 03-08-2026
    /(\d{2})[/-]([A-Za-z]{3})[/-](\d{4})/,   // 03-Aug-2026
    /(\d{1,2})\s([A-Za-z]{3,9})\s(\d{4})/,   // 3 August 2026
  ];
  const monthMap = {
    jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
    jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
    january:1, february:2, march:3, april:4, june:6,
    july:7, august:8, september:9, october:10, november:11, december:12
  };

  for (const pat of patterns) {
    const m = str.match(pat);
    if (!m) continue;
    let day = parseInt(m[1]);
    let month;
    let year = parseInt(m[3]);
    if (/\d+/.test(m[2])) {
      month = parseInt(m[2]);
    } else {
      month = monthMap[m[2].toLowerCase()];
    }
    if (day && month && year) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  return null;
}

// ─── All regex patterns ───────────────────────────────────────────────────────

const PATTERNS = {
  // ── DEBIT signals ──────────────────────────────────────────────────────────
  isDebit: [
    /\b(debited?|debit|spent|charged|withdrawn?|purchase|paid|payment of|dr\.?)\b/i,
    /\bdr\b/i,
    /\bwithdrawn\b/i,
  ],

  // ── CREDIT signals ─────────────────────────────────────────────────────────
  isCredit: [
    /\b(credited?|credit|received|refund|cashback|cr\.?|deposited?|salary|reward)\b/i,
    /\bcr\b/i,
  ],

  // ── AMOUNT patterns ────────────────────────────────────────────────────────
  amount: [
    // Rs. / INR prefix
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // suffix patterns (1,234.00 INR)
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    // "for Rs 1500"
    /for\s+(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "amount of Rs 1500"
    /amount\s+(?:of\s+)?(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ],

  // ── ACCOUNT / CARD last 4 ─────────────────────────────────────────────────
  accountLast4: [
    /(?:a\/c|acc(?:ount)?|card|a\/c no\.?)\s*(?:no\.?\s*)?(?:XX|x{2,}|\*{2,})?(\d{4})\b/i,
    /(?:ending|ending in|ending with)\s*(\d{4})\b/i,
    /\bXX(\d{4})\b/i,
    /\*{4}(\d{4})\b/i,
    /(?:account|a\/c)\s*(?:no\.?|number)\s*\w*?(\d{4})\b/i,
  ],

  // ── MERCHANT / PAYEE ──────────────────────────────────────────────────────
  merchant: [
    // UPI patterns
    /(?:at|to|from|via upi to|upi[/-])\s*([A-Za-z0-9\s&._-]{2,40}?)(?:\s*(?:on|ref|upi|via|using|from|for|rs|inr|₹|\.|,|\d))/i,
    /info:\s*(?:UPI\/)?([A-Za-z0-9\s&._-]{2,40})/i,
    /trf\s+(?:to\s+)?([A-Za-z0-9\s&._-]{2,40})/i,
    // "paid to MERCHANT"
    /paid\s+to\s+([A-Za-z0-9\s&._-]{2,40}?)(?:\s+(?:on|via|for|rs|upi|\.))/i,
    // Card purchase at MERCHANT
    /(?:at|purchase at|pos at|used at|used for)\s+([A-Za-z0-9\s&._-]{2,40}?)(?:\s+(?:on|ref|for|rs|inr|₹|,|\.))/i,
    // "Info: UPI/Merchant Name"
    /UPI\/([A-Za-z0-9\s&._-]{2,40}?)(?:\.|,|$)/i,
    // Transfer descriptions
    /(?:transfer to|trf to)\s+([A-Za-z\s]{2,40}?)(?:\s+(?:on|ref|via|for|\.))/i,
  ],

  // ── REFERENCE / UTR number ────────────────────────────────────────────────
  refNumber: [
    /(?:ref(?:erence)?(?:\s*no\.?)?|utr|imps ref|neft ref|txn(?:\s*id)?|transaction\s*id)\s*:?\s*([A-Z0-9]{6,25})/i,
    /\b(UTR\d{10,20})\b/i,
    /\b(IMPS\d{10,20})\b/i,
  ],

  // ── AVAILABLE BALANCE ─────────────────────────────────────────────────────
  availableBalance: [
    /(?:avl\.?\s*bal(?:ance)?|available\s+bal(?:ance)?|bal(?:ance)?(?:\s+is)?)\s*:?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?) (?:is\s+)?(?:avl|available)/i,
  ],

  // ── DATE from SMS text ────────────────────────────────────────────────────
  date: [
    /\b(\d{2}[/-]\d{2}[/-]\d{4})\b/,
    /\b(\d{2}[/-][A-Za-z]{3}[/-]\d{4})\b/,
    /\b(\d{1,2}\s[A-Za-z]{3,9}\s\d{4})\b/,
  ],

  // ── Detect non-transactional SMS (to filter out OTPs, promos, alerts) ─────
  nonTransaction: [
    /\botp\b/i,
    /\bone.?time.?password\b/i,
    /\byour\s+otp\b/i,
    /\bpassword\s+reset\b/i,
    /\bpromotional\b/i,
    /\bclick here\b/i,
    /\bunsubscribe\b/i,
    /\bdear\s+customer.*?your\s+(?:loan|credit\s+card)\s+(?:offer|pre-approved)\b/i,
    /\bcongratulations.*?pre.?approved\b/i,
    /\bkyc\s+update\b/i,
  ],

  // ── Detect ATM withdrawal specifically ────────────────────────────────────
  atm: /\b(ATM|cash\s+withdrawal|cash\s+at\s+atm)\b/i,

  // ── Detect UPI ────────────────────────────────────────────────────────────
  upi: /\b(UPI|bhim|phonepe|gpay|google\s*pay|paytm|razorpay)\b/i,

  // ── Detect NEFT/IMPS/RTGS ────────────────────────────────────────────────
  transfer: /\b(NEFT|IMPS|RTGS|NACH|ECS)\b/i,
};

/**
 * Detect transaction type from SMS text.
 * Returns 'credit', 'debit', or null.
 */
function detectType(message) {
  const lc = message.toLowerCase();

  // "credited" wins over incidental debit mentions
  for (const pat of PATTERNS.isCredit) {
    if (pat.test(message)) return 'credit';
  }
  for (const pat of PATTERNS.isDebit) {
    if (pat.test(message)) return 'debit';
  }
  return null;
}

/**
 * Extract amount from SMS.
 * Picks the FIRST (usually largest / most prominent) match.
 */
function extractAmount(message) {
  for (const pat of PATTERNS.amount) {
    const m = message.match(pat);
    if (m) return parseAmount(m[1]);
  }
  return null;
}

/**
 * Extract account/card last 4 digits.
 */
function extractAccount(message) {
  for (const pat of PATTERNS.accountLast4) {
    const m = message.match(pat);
    if (m) return m[1];
  }
  return null;
}

/**
 * Extract merchant/payee name.
 * Cleans and title-cases the result.
 */
function extractMerchant(message) {
  for (const pat of PATTERNS.merchant) {
    const m = message.match(pat);
    if (m && m[1]) {
      const name = m[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 2) {
        // Title-case
        return name.replace(/\b\w/g, c => c.toUpperCase());
      }
    }
  }

  // ATM fallback
  if (PATTERNS.atm.test(message)) return 'ATM Withdrawal';

  return null;
}

/**
 * Extract reference / UTR number.
 */
function extractRefNumber(message) {
  for (const pat of PATTERNS.refNumber) {
    const m = message.match(pat);
    if (m) return m[1];
  }
  return null;
}

/**
 * Extract available balance.
 */
function extractBalance(message) {
  for (const pat of PATTERNS.availableBalance) {
    const m = message.match(pat);
    if (m) return parseAmount(m[1]);
  }
  return null;
}

/**
 * Extract transaction date from SMS.
 */
function extractDate(message) {
  for (const pat of PATTERNS.date) {
    const m = message.match(pat);
    if (m) {
      const parsed = parseIndianDate(m[1]);
      if (parsed) return parsed;
    }
  }
  return null;
}

/**
 * Detect payment channel.
 */
function detectChannel(message) {
  if (PATTERNS.atm.test(message))      return 'ATM';
  if (PATTERNS.upi.test(message))      return 'UPI';
  if (PATTERNS.transfer.test(message)) return 'Bank Transfer';
  if (/\bcard\b/i.test(message))       return 'Card';
  return 'Unknown';
}

/**
 * isNonTransaction — filters out OTPs, promotions, etc.
 */
function isNonTransaction(message) {
  return PATTERNS.nonTransaction.some(pat => pat.test(message));
}

// ─── BANK-SPECIFIC FORMAT OVERRIDES ──────────────────────────────────────────
// These handle quirky formats that generic patterns miss

const BANK_OVERRIDES = {
  // SBI: "Your A/c XX1234 debited by Rs.500.00 on 03-08-26. UPI:Zomato."
  SBI: {
    senders: /^(SBIINB|SBIUPI|SBICRD|SBIPSG|SBI-INB|101SBI|AD-SBIINB)/i,
    amount:  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    merchant:/UPI[:/]([A-Za-z0-9\s&._-]{2,40}?)(?:\.|\s|$)/i,
  },

  // HDFC: "Rs.1,500 debited from HDFC Bank Acct **1234 to VPA zomato@paytm on 03-08-26"
  HDFC: {
    senders: /^(HDFCBK|HDFCSMS|HDFCPAY|HDFCCC|AD-HDFCBK)/i,
    amount:  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    merchant:/(?:to VPA|to)\s+([A-Za-z0-9@._-]+)/i,
  },

  // ICICI: "ICICI Bank: Rs 1500.00 debited from your a/c XX1234 on 03-Aug-26; Info: UPI/Swiggy"
  ICICI: {
    senders: /^(ICICIB|ICICI|ICICIC|ICICSMS|AD-ICICIB)/i,
    amount:  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    merchant:/Info:\s+(?:UPI\/)?([A-Za-z0-9\s&._-]{2,40})/i,
  },

  // AXIS: "INR 1,500.00 debited from your Axis Bank A/c no. XX1234"
  AXIS: {
    senders: /^(AXISBK|AXISBN|AXISCC|AD-AXISBK)/i,
    amount:  /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    merchant:/(?:at|to|for)\s+([A-Za-z0-9\s&._-]{2,40}?)(?:\s+on|\s+ref|\.|,)/i,
  },

  // KOTAK: "Kotak Bank: Spent Rs.1500.00 at Zomato on 03-08-2026"
  KOTAK: {
    senders: /^(KOTAKB|KOTAK|KTKSMS|AD-KOTAKB)/i,
    amount:  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    merchant:/(?:spent at|at|to)\s+([A-Za-z0-9\s&._-]{2,40}?)(?:\s+on|\s+ref|\.|,)/i,
  },
};

/**
 * Identify the bank from sender ID.
 */
function identifyBank(sender) {
  if (!sender) return 'Unknown';
  for (const [bank, config] of Object.entries(BANK_OVERRIDES)) {
    if (config.senders.test(sender)) return bank;
  }
  return 'Unknown';
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

/**
 * parseSms(message, sender)
 *
 * @param {string} message  — The raw SMS body
 * @param {string} sender   — The SMS sender ID (e.g. "SBIINB")
 * @returns {object|null}   — Structured transaction object, or null if not a transaction
 *
 * @example
 * parseSms(
 *   'Your A/c XX1234 debited for Rs.1,500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45,230.50',
 *   'SBIINB'
 * )
 * // Returns:
 * // {
 * //   isTransaction: true,
 * //   type: 'debit',
 * //   transactionType: 'Expense',
 * //   amount: 1500.00,
 * //   merchant: 'Zomato',
 * //   accountLast4: '1234',
 * //   refNumber: null,
 * //   availableBalance: 45230.50,
 * //   transactionDate: Date(2026-08-03),
 * //   channel: 'UPI',
 * //   bank: 'SBI',
 * //   category: null    // filled later by categoryService
 * // }
 */
function parseSms(message, sender = '') {
  if (!message || typeof message !== 'string') return null;

  const trimmed = message.trim();

  // Reject empty or whitespace-only strings
  if (trimmed.length === 0) return null;

  // Step 1: Filter out non-transactional messages
  if (isNonTransaction(trimmed)) {
    return { isTransaction: false, reason: 'non-transactional (OTP/promo/alert)' };
  }

  // Step 2: Detect transaction type
  // Pre-process: remove "credit card" so the word "credit" doesn't false-positive as income
  const normalised = trimmed.replace(/credit\s*card/gi, 'CARD');

  // Priority: explicit debit verbs beat incidental credit-word matches
  const hasExplicitDebit = /\b(debited?|debit|withdrawn?|charged|spent|used\s+for|dr\.?)\b/i.test(normalised);
  const hasExplicitCredit = /\b(credited?|received|refund|cashback|salary|deposited?)\b/i.test(normalised);

  let type = null;
  if (hasExplicitDebit && !hasExplicitCredit) type = 'debit';
  else if (hasExplicitCredit && !hasExplicitDebit) type = 'credit';
  else if (hasExplicitDebit && hasExplicitCredit) {
    // Both present — check which verb comes first in the string
    const debitIdx  = normalised.search(/\b(debited?|withdrawn?|spent|charged|used\s+for)\b/i);
    const creditIdx = normalised.search(/\b(credited?|received|refund|deposited?)\b/i);
    type = debitIdx <= creditIdx ? 'debit' : 'credit';
  }

  if (!type) {
    return { isTransaction: false, reason: 'no debit/credit signal found' };
  }

  // Step 3: Extract amount (mandatory)
  const amount = extractAmount(trimmed);
  if (!amount) {
    return { isTransaction: false, reason: 'no amount found' };
  }

  // Step 4: Bank-specific overrides for merchant extraction
  const bank = identifyBank(sender);
  let merchant = null;

  const override = BANK_OVERRIDES[bank];
  if (override && override.merchant) {
    const m = trimmed.match(override.merchant);
    if (m && m[1]) {
      merchant = m[1].trim().replace(/\s+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // Fallback to generic merchant extraction
  if (!merchant) merchant = extractMerchant(trimmed);

  // Step 5: Extract remaining fields
  const accountLast4      = extractAccount(trimmed);
  const refNumber         = extractRefNumber(trimmed);
  const availableBalance  = extractBalance(trimmed);
  const transactionDate   = extractDate(trimmed);
  const channel           = detectChannel(trimmed);

  return {
    isTransaction:    true,
    type,                                                   // 'debit' | 'credit'
    transactionType:  type === 'debit' ? 'Expense' : 'Income',
    amount,
    merchant:         merchant || null,
    accountLast4:     accountLast4 || null,
    refNumber:        refNumber || null,
    availableBalance: availableBalance || null,
    transactionDate:  transactionDate || null,
    channel,                                                // 'UPI' | 'Card' | 'ATM' | 'Bank Transfer' | 'Unknown'
    bank,
    category:         null,                                 // filled by categoryService
    rawMessage:       trimmed,
  };
}

module.exports = { parseSms };
