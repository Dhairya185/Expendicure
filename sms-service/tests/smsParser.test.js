/**
 * tests/smsParser.test.js
 * ============================================================
 * Unit tests for the SMS parser.
 * Covers: SBI, HDFC, ICICI, Axis, Kotak, UPI, ATM, OTP (non-transaction)
 * ============================================================
 */

const { parseSms } = require('../utils/smsParser');

// ─── SBI Tests ────────────────────────────────────────────────────────────────

describe('SBI SMS', () => {
  test('SBI UPI debit — standard format', () => {
    const msg = 'Your A/c No. XX1234 debited for Rs.1,500.00 on 03-08-2026. Info: UPI/Zomato. Avl Bal:Rs.45,230.50';
    const result = parseSms(msg, 'SBIINB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.transactionType).toBe('Expense');
    expect(result.amount).toBe(1500.00);
    expect(result.accountLast4).toBe('1234');
    expect(result.availableBalance).toBe(45230.50);
    expect(result.bank).toBe('SBI');
    expect(result.channel).toBe('UPI');
  });

  test('SBI credit — salary', () => {
    const msg = 'Your A/c XX5678 credited with Rs.50,000.00 on 01-08-2026. Info: NEFT/SALARY. Avl Bal:Rs.95,230.50';
    const result = parseSms(msg, 'SBIINB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('credit');
    expect(result.transactionType).toBe('Income');
    expect(result.amount).toBe(50000.00);
    expect(result.accountLast4).toBe('5678');
  });

  test('SBI ATM withdrawal', () => {
    const msg = 'Your A/c XX9012 has been debited by Rs.2,000.00 for ATM cash withdrawal on 02-08-2026. Avl Bal:Rs.18,450.00';
    const result = parseSms(msg, 'SBIINB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(2000.00);
    expect(result.channel).toBe('ATM');
  });
});

// ─── HDFC Tests ───────────────────────────────────────────────────────────────

describe('HDFC SMS', () => {
  test('HDFC UPI debit', () => {
    const msg = 'Rs.850.00 debited from HDFC Bank Acct **3456 to VPA swiggy@paytm on 03-08-2026. Ref 324678901234';
    const result = parseSms(msg, 'HDFCBK');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(850.00);
    expect(result.bank).toBe('HDFC');
    expect(result.refNumber).toBeTruthy();
  });

  test('HDFC card debit', () => {
    const msg = 'Alert: HDFC Bank Credit Card XX4321 used for Rs.3,499.00 at Amazon India on 03-Aug-26. Avl Limit:Rs.96,501.00';
    const result = parseSms(msg, 'HDFCBK');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(3499.00);
    expect(result.accountLast4).toBe('4321');
    expect(result.channel).toBe('Card');
  });
});

// ─── ICICI Tests ──────────────────────────────────────────────────────────────

describe('ICICI SMS', () => {
  test('ICICI debit with Info tag', () => {
    const msg = 'ICICI Bank: Rs 1500.00 debited from your a/c XX7890 on 03-Aug-26; Info: UPI/Swiggy. Avl Bal: Rs 12,345.67. Call 18002662 for dispute.';
    const result = parseSms(msg, 'ICICIB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(1500.00);
    expect(result.accountLast4).toBe('7890');
    expect(result.bank).toBe('ICICI');
  });

  test('ICICI credit — refund', () => {
    const msg = 'ICICI Bank: INR 499.00 credited to your a/c XX7890 on 02-Aug-26; Info: Refund/Amazon. Avl Bal: INR 13,344.67.';
    const result = parseSms(msg, 'ICICIB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('credit');
    expect(result.transactionType).toBe('Income');
    expect(result.amount).toBe(499.00);
  });
});

// ─── Axis Bank Tests ──────────────────────────────────────────────────────────

describe('Axis Bank SMS', () => {
  test('Axis debit — standard', () => {
    const msg = 'INR 2,500.00 debited from your Axis Bank A/c no. XX6789 on 03-08-26. UPI Ref: 123456789012. Avl Bal: INR 34,567.89';
    const result = parseSms(msg, 'AXISBK');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(2500.00);
    expect(result.accountLast4).toBe('6789');
    expect(result.bank).toBe('AXIS');
  });
});

// ─── Kotak Tests ──────────────────────────────────────────────────────────────

describe('Kotak Bank SMS', () => {
  test('Kotak debit card at merchant', () => {
    const msg = 'Kotak Bank: Spent Rs.999.00 at Uber on 03-08-2026 using Card XX2345. Avl Bal: Rs.22,500.00';
    const result = parseSms(msg, 'KOTAKB');

    expect(result.isTransaction).toBe(true);
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(999.00);
    expect(result.accountLast4).toBe('2345');
    expect(result.bank).toBe('KOTAK');
  });
});

// ─── Non-transactional SMS ────────────────────────────────────────────────────

describe('Non-transactional SMS filtering', () => {
  test('OTP message is filtered out', () => {
    const msg = 'Your OTP for SBI Internet Banking is 453721. Do not share with anyone.';
    const result = parseSms(msg, 'SBIINB');

    expect(result.isTransaction).toBe(false);
    expect(result.reason).toMatch(/otp|non-transactional/i);
  });

  test('Promotional message is filtered out', () => {
    const msg = 'Congratulations! You are pre-approved for a personal loan of Rs.5,00,000. Click here to apply.';
    const result = parseSms(msg, 'HDFCBK');

    expect(result.isTransaction).toBe(false);
  });

  test('Balance enquiry — no debit/credit signal', () => {
    const msg = 'Your HDFC Bank account balance is Rs.12,345.67 as of 03-08-2026.';
    const result = parseSms(msg, 'HDFCBK');

    expect(result.isTransaction).toBe(false);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  test('Handles null/empty message gracefully', () => {
    expect(parseSms(null)).toBeNull();
    expect(parseSms('')).toBeNull();
    expect(parseSms('   ')).toBeNull();   // whitespace-only → trimmed to '' → null
    expect(parseSms(undefined)).toBeNull();
  });

  test('Handles amounts with commas correctly', () => {
    const msg = 'Rs.1,23,456.78 debited from your a/c XX4567 via UPI';
    const result = parseSms(msg, 'SBIINB');
    expect(result.amount).toBe(123456.78);
  });

  test('Small amounts parsed correctly', () => {
    const msg = 'Rs.9.00 debited from a/c XX1111 for UPI/AutoPay';
    const result = parseSms(msg, 'SBIINB');
    expect(result.isTransaction).toBe(true);
    expect(result.amount).toBe(9.00);
  });

  test('Message with no amount returns isTransaction false', () => {
    const msg = 'Your account has been debited. Please check your bank statement.';
    const result = parseSms(msg, 'SBIINB');
    expect(result.isTransaction).toBe(false);
  });
});
