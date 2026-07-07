import { describe, expect, it, beforeEach } from "vitest";
import { useStore } from "./store";
import type { Agent } from "./types";

const agent = (over: Partial<Agent>): Agent => ({
  Name: "agent-x", Type: "claude", Repo: "", Fleet: "", Hierarchy: "",
  Terminal: "tmux", Status: "Up", Running: true, Finished: false,
  Activity: "Idle", State: "", StateReason: "",
  CPU: "", Memory: "", NetIO: "", PIDs: "", SSH: "", Auth: "", GHAuth: "",
  Docker: "", NetworkMode: "", ...over,
});

beforeEach(() => useStore.setState(useStore.getInitialState()));

describe("toast cap", () => {
  it("never evicts a pending toast; trims oldest finished first", () => {
    const s = useStore.getState();
    // 3 pending in-flight actions (promises that never settle stay pending).
    for (let i = 0; i < 3; i++) s.run(`p${i}`, new Promise(() => {}));
    // Then 5 finished toasts — the stack must cap without dropping any pending.
    for (let i = 0; i < 5; i++) useStore.getState().toast(`ok${i}`);
    const ts = useStore.getState().toasts;
    expect(ts.filter((t) => t.kind === "pending")).toHaveLength(3);
    expect(ts).toHaveLength(5); // 3 pending + 2 newest finished
    expect(ts.map((t) => t.text)).toEqual(["p0", "p1", "p2", "ok3", "ok4"]);
  });

  it("keeps all toasts when every one is pending (exceeds cap)", () => {
    const s = useStore.getState();
    for (let i = 0; i < 6; i++) s.run(`p${i}`, new Promise(() => {}));
    expect(useStore.getState().toasts).toHaveLength(6);
  });
});

describe("select closes split", () => {
  it("toasts when the selected agent was showing in a split pane", () => {
    useStore.setState({ agents: [agent({ Name: "agent-a" }), agent({ Name: "agent-b" })] });
    const s = useStore.getState();
    s.toggleSplit("agent-a");
    s.select("agent-a");
    expect(useStore.getState().splits).toEqual([]);
    expect(useStore.getState().toasts.some((t) => t.text.includes("split closed"))).toBe(true);
  });

  it("does not toast when selecting an agent that was not split", () => {
    useStore.setState({ agents: [agent({ Name: "agent-a" }), agent({ Name: "agent-b" })] });
    useStore.getState().select("agent-a");
    expect(useStore.getState().toasts).toHaveLength(0);
  });
});
