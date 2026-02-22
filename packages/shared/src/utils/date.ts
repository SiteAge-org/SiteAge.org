/**
 * Parse a Wayback Machine CDX timestamp (YYYYMMDDHHmmss) to ISO 8601 string.
 */
export function cdxTimestampToISO(ts: string): string {
  const year = ts.slice(0, 4);
  const month = ts.slice(4, 6);
  const day = ts.slice(6, 8);
  const hour = ts.slice(8, 10) || "00";
  const min = ts.slice(10, 12) || "00";
  const sec = ts.slice(12, 14) || "00";
  return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
}

/**
 * Calculate the age in days from a birth ISO timestamp to now.
 */
export function ageDays(birthAt: string): number {
  const birth = new Date(birthAt);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate full years from a birth timestamp to an optional end date.
 */
export function ageYears(birthAt: string, endAt?: string): number {
  const birth = new Date(birthAt);
  const end = endAt ? new Date(endAt) : new Date();
  let years = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    years--;
  }
  return years;
}

/**
 * Format a birth year for badge display.
 * Returns just the year (e.g., "2019").
 */
export function birthYear(birthAt: string): string {
  return new Date(birthAt).getUTCFullYear().toString();
}

/**
 * Format age as a human-readable string like "5 years, 3 months".
 */
export function formatAge(birthAt: string, endAt?: string): string {
  const birth = new Date(birthAt);
  const end = endAt ? new Date(endAt) : new Date();

  let years = end.getFullYear() - birth.getFullYear();
  let months = end.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }
  if (end.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (parts.length === 0) return "< 1 month";
  return parts.join(", ");
}
