import crypto from "crypto";

// ── Config ────────────────────────────────────────────────────────────────────

export const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID!,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
  passphrase: process.env.PAYFAST_PASSPHRASE ?? "", // empty = no passphrase
  sandbox: process.env.PAYFAST_SANDBOX === "true",
};

export const PAYFAST_URL = PAYFAST_CONFIG.sandbox
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

// PayFast valid IPs for ITN verification
const PAYFAST_VALID_IPS = [
  "197.97.145.144",
  "197.97.145.145",
  "197.97.145.146",
  "197.97.145.147",
  "41.74.179.194",
  "41.74.179.195",
  "41.74.179.196",
  "41.74.179.197",
  // Sandbox IPs
  "197.97.145.144",
  "::1", // localhost for testing
  "127.0.0.1", // localhost for testing
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PayFastPaymentData {
  // Merchant
  merchant_id: string;
  merchant_key: string;

  // Return URLs
  return_url: string;
  cancel_url: string;
  notify_url: string;

  // Buyer info
  name_first: string;
  name_last: string;
  email_address: string;

  // Transaction
  m_payment_id: string; // your internal ID
  amount: string; // format: "14999.00"
  item_name: string;
  item_description?: string;

  // Custom fields — passed back in ITN
  custom_str1: string; // company_id
  custom_str2: string; // plan_tier
  custom_str3: string; // user_id
}

export interface PayFastITN {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: "COMPLETE" | "FAILED" | "CANCELLED";
  item_name: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1: string; // company_id
  custom_str2: string; // plan_tier
  custom_str3: string; // user_id
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

// ── Signature Generator ───────────────────────────────────────────────────────

/**
 * Builds MD5 signature from payment data.
 * PayFast requires fields sorted in the order they appear,
 * URL-encoded, with empty fields excluded.
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase: string = "",
): string {
  // Build query string from data — exclude signature field
  const queryString = Object.entries(data)
    .filter(([key, value]) => key !== "signature" && value !== "")
    .map(
      ([key, value]) =>
        `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, "+")}`,
    )
    .join("&");

  // Append passphrase if set
  const stringToHash = passphrase
    ? `${queryString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`
    : queryString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
}

// ── Payment Builder ───────────────────────────────────────────────────────────

/**
 * Builds complete payment data object ready to POST to PayFast.
 * Returns both the data object and the PayFast URL.
 */
export function buildPaymentData(params: {
  companyId: string;
  userId: string;
  planTier: string;
  planName: string;
  amount: number; // PKR amount as integer e.g. 14999
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  internalPaymentId: string;
}): { url: string; data: Record<string, string> } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const data: Record<string, string> = {
    // Merchant
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,

    // Return URLs
    return_url: `${appUrl}/dashboard/billing?payment=success&plan=${params.planTier}`,
    cancel_url: `${appUrl}/dashboard/billing?payment=cancelled`,
    notify_url: `${appUrl}/api/payfast/itn`,

    // Buyer
    name_first: params.userFirstName,
    name_last: params.userLastName || "-",
    email_address: params.userEmail,

    // Transaction
    m_payment_id: params.internalPaymentId,
    amount: params.amount.toFixed(2), // convert paisa to PKR
    item_name: `SahiScreen ${params.planName} Plan`,
    item_description: `Monthly subscription to SahiScreen ${params.planName}`,

    // Custom — returned in ITN
    custom_str1: params.companyId,
    custom_str2: params.planTier,
    custom_str3: params.userId,
  };

  // Remove empty fields
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== ""),
  );

  // Generate signature
  cleanData.signature = generateSignature(cleanData, PAYFAST_CONFIG.passphrase);

  return {
    url: PAYFAST_URL,
    data: cleanData,
  };
}

// ── ITN Verifier ──────────────────────────────────────────────────────────────

/**
 * Verifies an ITN (Instant Transfer Notification) from PayFast.
 * Three checks:
 * 1. IP is from PayFast
 * 2. Signature matches
 * 3. PayFast server confirms payment is valid
 */
export async function verifyITN(
  itnData: Record<string, string>,
  requestIp: string,
): Promise<{ valid: boolean; reason?: string }> {
  // ── Check 1: IP Validation ──
  // Skip IP check in sandbox/development
  if (!PAYFAST_CONFIG.sandbox) {
    const ipValid = PAYFAST_VALID_IPS.some(
      (ip) => requestIp === ip || requestIp.endsWith(ip),
    );
    if (!ipValid) {
      return { valid: false, reason: `Invalid IP: ${requestIp}` };
    }
  }

  // ── Check 2: Signature Validation ──
  const receivedSignature = itnData.signature;
  const dataWithoutSignature = Object.fromEntries(
    Object.entries(itnData).filter(([key]) => key !== "signature"),
  );

  const expectedSignature = generateSignature(
    dataWithoutSignature,
    PAYFAST_CONFIG.passphrase,
  );

  if (receivedSignature !== expectedSignature) {
    return {
      valid: false,
      reason: `Signature mismatch. Expected: ${expectedSignature}, Got: ${receivedSignature}`,
    };
  }

  // ── Check 3: PayFast Server Validation ──
  try {
    const validationUrl = PAYFAST_CONFIG.sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";

    const queryString = Object.entries(dataWithoutSignature)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    const response = await fetch(`${validationUrl}?${queryString}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const responseText = await response.text();

    if (responseText !== "VALID") {
      return {
        valid: false,
        reason: `PayFast validation failed: ${responseText}`,
      };
    }
  } catch (err) {
    // In sandbox, validation endpoint sometimes fails — log but don't block
    if (PAYFAST_CONFIG.sandbox) {
      console.warn("[PayFast] Sandbox validation warning:", err);
    } else {
      return { valid: false, reason: "PayFast server validation failed" };
    }
  }

  return { valid: true };
}

// ── Amount Helper ─────────────────────────────────────────────────────────────

/**
 * Converts PKR integer to PayFast decimal string
 * e.g. 14999 → "14999.00"
 */
export function formatAmount(pkrAmount: number): string {
  return pkrAmount.toFixed(2);
}
