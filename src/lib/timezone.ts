/** Haiti timezone — Eastern Time (America/Port-au-Prince) */
export const HAITI_TZ = "America/Port-au-Prince";

/** Today's date string (YYYY-MM-DD) in Haiti timezone */
export function haitiToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: HAITI_TZ });
}

/** Date object for today at midnight UTC, based on Haiti's local date.
 *  Use for DB queries that filter by date. */
export function haitiDateOnly(): Date {
  return new Date(haitiToday());
}

/** Format a timestamp for time display in French, Haiti timezone */
export function formatTimeFR(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    timeZone: HAITI_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a timestamp for date display in French, Haiti timezone */
export function formatDateFR(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("fr-FR", { timeZone: HAITI_TZ, ...options });
}

/** Monday of the current week in Haiti timezone (YYYY-MM-DD) */
export function haitiWeekStart(): string {
  const todayStr = haitiToday();
  const d = new Date(todayStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split("T")[0];
}
