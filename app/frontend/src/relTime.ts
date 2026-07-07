// relTime turns a timestamp (RFC3339 string or unix-ms number) into a compact
// relative label like "2m ago". `now` is passed in (unix ms) so callers can
// drive a periodic refresh and tests stay deterministic. Unparseable input is
// returned verbatim (string) or "" (number) rather than throwing.
export function relTime(ts: string | number, now: number): string {
  const t = typeof ts === "number" ? ts : Date.parse(ts);
  if (!t || Number.isNaN(t)) return typeof ts === "string" ? ts : "";
  const secs = Math.max(0, Math.round((now - t) / 1000));
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
