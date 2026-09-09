/**
 * services/categoryService.js
 * ============================================================
 * Keyword-based automatic category detection for transactions.
 *
 * Matches merchant names and SMS keywords against category rules.
 * Returns the best-matched category name string.
 * Users can always manually override in the frontend.
 * ============================================================
 */

// ─── Category Rules ───────────────────────────────────────────────────────────
// Each rule has a category name and an array of keywords/patterns.
// Rules are evaluated in ORDER — first match wins.
// Use lowercase keywords; matching is case-insensitive.

const CATEGORY_RULES = [
  // ── Income (must be checked before expense categories) ──────────────────
  {
    category: 'Salary',
    keywords: ['salary', 'sal credit', 'payroll', 'wages', 'stipend', 'monthly pay'],
    senderPatterns: [],
  },
  {
    category: 'Refund',
    keywords: ['refund', 'cashback', 'reversal', 'return credit', 'reimbursement'],
    senderPatterns: [],
  },

  // ── Food & Dining ────────────────────────────────────────────────────────
  {
    category: 'Food',
    keywords: [
      'zomato', 'swiggy', 'dominos', 'domino', 'pizza hut', 'mcdonald', 'kfc', 'burger king',
      'subway', 'starbucks', 'cafe', 'restaurant', 'dining', 'food', 'biryani', 'barbeque',
      'barbeque nation', 'bbnation', 'dunkin', 'haldiram', 'amul', 'lunchbox',
      'fassos', 'box8', 'behrouz', 'freshmenu', 'eatfit', 'faasos',
    ],
    senderPatterns: [],
  },

  // ── Groceries ────────────────────────────────────────────────────────────
  {
    category: 'Groceries',
    keywords: [
      'bigbasket', 'blinkit', 'grofers', 'dmart', 'd-mart', 'zepto', 'instamart',
      'nature basket', 'reliance fresh', 'more supermarket', 'spencer', 'super market',
      'supermarket', 'grocery', 'vegetables', 'fruits',
    ],
    senderPatterns: [],
  },

  // ── Travel & Transport ───────────────────────────────────────────────────
  {
    category: 'Travel',
    keywords: [
      'uber', 'ola', 'rapido', 'auto', 'cab', 'taxi', 'metro', 'irctc', 'makemytrip',
      'goibibo', 'yatra', 'cleartrip', 'indigo', 'air india', 'spicejet', 'vistara',
      'akasa', 'bus', 'train ticket', 'flight', 'booking.com', 'oyo', 'airbnb',
      'redbus', 'abhibus', 'railyatri', 'confirmtkt',
    ],
    senderPatterns: [],
  },

  // ── Fuel ─────────────────────────────────────────────────────────────────
  {
    category: 'Fuel',
    keywords: [
      'hp petrol', 'indian oil', 'bharat petroleum', 'shell', 'petrol',
      'diesel', 'fuel', 'iocl', 'hpcl', 'bpcl',
    ],
    senderPatterns: [],
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'snapdeal',
      'tata cliq', 'reliance digital', 'croma', 'vijay sales', 'shopify',
      'lifestyle', 'westside', 'h&m', 'zara', 'max fashion', 'pantaloons',
      'decathlon', 'ikea', 'pepperfry', 'urban ladder',
    ],
    senderPatterns: [],
  },

  // ── Entertainment ────────────────────────────────────────────────────────
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'amazon prime', 'hotstar', 'disney', 'sony liv', 'zee5', 'voot',
      'jiocinema', 'jio cinema', 'bookmyshow', 'pvr', 'inox', 'movie',
      'spotify', 'apple music', 'youtube premium', 'gaana', 'wynk',
      'playstation', 'xbox', 'steam', 'gaming',
    ],
    senderPatterns: [],
  },

  // ── Healthcare ───────────────────────────────────────────────────────────
  {
    category: 'Healthcare',
    keywords: [
      'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'apollo', 'medplus',
      'netmeds', 'pharmeasy', '1mg', 'healthkart', 'cure', 'lab', 'pathology',
      'health', 'dental', 'ayurvedic', 'medicine', 'practo',
    ],
    senderPatterns: [],
  },

  // ── Education ────────────────────────────────────────────────────────────
  {
    category: 'Education',
    keywords: [
      'school fee', 'college fee', 'university fee', 'tuition', 'coaching',
      'byju', 'unacademy', 'vedantu', 'coursera', 'udemy', 'skillshare',
      'books', 'stationery', 'exam fee', 'education', 'library',
    ],
    senderPatterns: [],
  },

  // ── Utilities ────────────────────────────────────────────────────────────
  {
    category: 'Utilities',
    keywords: [
      'electricity', 'water bill', 'gas bill', 'broadband', 'internet', 'wifi',
      'airtel', 'jio', 'vodafone', 'vi', 'bsnl', 'mobile recharge', 'recharge',
      'dth', 'tata sky', 'dish tv', 'sun direct', 'mahanagar gas', 'indraprastha gas',
      'bescom', 'msedcl', 'torrent power', 'adani electricity',
    ],
    senderPatterns: [],
  },

  // ── Rent / Housing ───────────────────────────────────────────────────────
  {
    category: 'Rent',
    keywords: [
      'rent', 'housing', 'maintenance', 'society', 'apartment', 'flat rent',
      'landlord', 'pg rent', 'hostel',
    ],
    senderPatterns: [],
  },

  // ── Investment ───────────────────────────────────────────────────────────
  {
    category: 'Investment',
    keywords: [
      'sip', 'mutual fund', 'zerodha', 'groww', 'upstox', 'angel broking', 'icicidirect',
      'hdfc securities', 'stock', 'shares', 'fd', 'fixed deposit', 'rd',
      'ppf', 'nps', 'lic', 'insurance premium', 'gold etf',
    ],
    senderPatterns: [],
  },

  // ── Cash Withdrawal (ATM) ────────────────────────────────────────────────
  {
    category: 'Cash Withdrawal',
    keywords: ['atm', 'cash withdrawal', 'cash at atm'],
    senderPatterns: [],
  },

  // ── Bank Transfer / Fallback ─────────────────────────────────────────────
  {
    category: 'Transfer',
    keywords: ['neft', 'imps', 'rtgs', 'transfer', 'upi transfer', 'payment'],
    senderPatterns: [],
  },
];

/**
 * detectCategory(parsed)
 *
 * @param {object} parsed — Output from smsParser.parseSms()
 * @returns {string}      — Category name
 */
function detectCategory(parsed) {
  if (!parsed || !parsed.isTransaction) return 'Uncategorized';

  // Income signals by type
  if (parsed.type === 'credit') {
    // Specific income categories first
    const incomeCheck = matchKeywords(
      parsed,
      CATEGORY_RULES.filter(r => ['Salary', 'Refund'].includes(r.category))
    );
    if (incomeCheck) return incomeCheck;
    // Generic credit
    return 'Income';
  }

  // Try merchant-based matching
  const result = matchKeywords(parsed, CATEGORY_RULES);
  return result || 'Uncategorized';
}

/**
 * matchKeywords — internal helper to test parsed data against rules.
 */
function matchKeywords(parsed, rules) {
  const haystack = [
    parsed.merchant    || '',
    parsed.rawMessage  || '',
  ].join(' ').toLowerCase();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }
  return null;
}

/**
 * getAllCategories — return the canonical list of categories.
 * Used by the webhook to ensure category names are always in the predefined set.
 */
function getAllCategories() {
  return [
    'Food', 'Groceries', 'Travel', 'Fuel', 'Shopping',
    'Entertainment', 'Healthcare', 'Education', 'Utilities',
    'Rent', 'Investment', 'Cash Withdrawal', 'Transfer',
    'Salary', 'Refund', 'Income', 'Uncategorized',
  ];
}

module.exports = { detectCategory, getAllCategories };
