/**
 * Date & Time Utilities for Smriti
 * Strict Rule: All timestamps are stored UTC, rendered in IST (Asia/Kolkata, UTC+5:30).
 */

export function toIST(dateInput) {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatISTDateTime(dateInput) {
  const date = toIST(dateInput);
  if (!date) return "—";
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatISTTime(dateInput) {
  const date = toIST(dateInput);
  if (!date) return "—";
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatISTDate(dateInput) {
  const date = toIST(dateInput);
  if (!date) return "—";
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function getTodayISTDateString() {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // returns YYYY-MM-DD
  return formatter.format(now);
}

export function getISTCurrentTimeString() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(now);
}
