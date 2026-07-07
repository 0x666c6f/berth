import { describe, expect, it } from "vitest";
import { relTime } from "./relTime";

const now = Date.parse("2026-07-07T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("relTime", () => {
  it("buckets by magnitude", () => {
    expect(relTime(ago(2_000), now)).toBe("just now");
    expect(relTime(ago(30_000), now)).toBe("30s ago");
    expect(relTime(ago(120_000), now)).toBe("2m ago");
    expect(relTime(ago(3 * 3600_000), now)).toBe("3h ago");
    expect(relTime(ago(2 * 86400_000), now)).toBe("2d ago");
  });

  it("clamps future timestamps to just now", () => {
    expect(relTime(ago(-5_000), now)).toBe("just now");
  });

  it("accepts unix-ms numbers", () => {
    expect(relTime(now - 60_000, now)).toBe("1m ago");
  });

  it("returns unparseable input verbatim", () => {
    expect(relTime("not-a-date", now)).toBe("not-a-date");
    expect(relTime(0, now)).toBe("");
  });
});
