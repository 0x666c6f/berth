import { describe, expect, it } from "vitest";
import { diffStat, parseCheckpoints } from "./components/DiffTab";

const DIFF = `diff --git a/foo.txt b/foo.txt
index e69de29..4b825dc 100644
--- a/foo.txt
+++ b/foo.txt
@@ -0,0 +1,2 @@
+hello
+world
diff --git a/bar.txt b/bar.txt
--- a/bar.txt
+++ b/bar.txt
@@ -1,1 +0,0 @@
-gone
`;

describe("diffStat", () => {
  it("counts files and +/- lines, ignoring +++/--- headers", () => {
    expect(diffStat(DIFF)).toEqual({ files: 2, additions: 2, deletions: 1 });
  });
  it("is empty for an empty diff", () => {
    expect(diffStat("")).toEqual({ files: 0, additions: 0, deletions: 0 });
  });
});

describe("parseCheckpoints", () => {
  it("parses git stash list lines into ref + readable label", () => {
    const raw = [
      "stash@{0}: On main: checkpoint: first snapshot",
      "stash@{1}: WIP on feature: abc123 message",
    ].join("\n");
    expect(parseCheckpoints(raw)).toEqual([
      { ref: "stash@{0}", desc: "first snapshot" },
      { ref: "stash@{1}", desc: "WIP on feature: abc123 message" },
    ]);
  });
  it("returns [] for the empty / no-checkpoints case", () => {
    expect(parseCheckpoints("No checkpoints found.")).toEqual([]);
    expect(parseCheckpoints("")).toEqual([]);
  });
});
