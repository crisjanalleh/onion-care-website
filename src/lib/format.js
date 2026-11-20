/** Formatting helpers with explicit locale and time zone (server-safe). */

const LOCALE = "en-PH";
const TIME_ZONE = "Asia/Manila";

export function formatDateTime(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(LOCALE, {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(LOCALE, {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** The legacy history field kept a local formatted string: yyyy-MM-dd HH:mm:ss. */
export function legacyTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function normalizeUsername(value = "") {
  return value.trim().toLowerCase();
}

export function normalizePhone(value = "") {
  return value.replace(/[^\d]/g, "");
}

export function normalizeLocationKey(value = "") {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function initialsOf(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value = "", length = 90) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}