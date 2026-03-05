/**
 * Format a bigint (paise or rupees stored as integer) to Indian rupee format.
 * We store amounts as whole rupees (bigint), not paise.
 */
export function formatRupees(amount: bigint): string {
  const num = Number(amount);
  // Indian number format: 12,34,567
  const absNum = Math.abs(num);
  const str = absNum.toString();
  let result = "";

  if (str.length <= 3) {
    result = str;
  } else {
    // Last 3 digits
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = `${remaining.slice(-2)},${result}`;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      result = `${remaining},${result}`;
    }
  }

  return (num < 0 ? "-₹" : "₹") + result;
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Generate a simple UUID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
