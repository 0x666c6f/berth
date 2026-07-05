import { create } from "zustand";
import type { Agent, AgentStatus, Tab, View } from "./types";

// orderAgents returns agents in sidebar display order (fleets, solo, stopped)
// — the canonical order for ⌘1..9 and j/k navigation.
export function orderAgents(agents: Agent[]): Agent[] {
  const fleets: Agent[] = [], solo: Agent[] = [], stopped: Agent[] = [];
  for (const a of agents) {
    if (!a.Running) stopped.push(a);
    else if (a.Fleet) fleets.push(a);
    else solo.push(a);
  }
  return [...fleets, ...solo, ...stopped];
}

let toastSeq = 0;
const NEEDS = new Set(["needs-auth", "stuck", "blocked"]);
const REVIEW = new Set(["ready-for-review", "ready-for-pr"]);

export function statusFor(
  a: Agent,
  needsYou: Record<string, boolean>,
  reviewReady: Record<string, boolean>,
): AgentStatus {
  if (!a.Running) return a.Finished ? "stopped" : "failed";
  if (needsYou[a.Name] || a.State === "blocked") return "needs-you";
  if (a.Activity === "Working") return "working";
  if (reviewReady[a.Name]) return "review";
  return "idle";
}

interface State {
  agents: Agent[];
  needsYou: Record<string, boolean>;
  reviewReady: Record<string, boolean>;
  selected: string | null;
  split: string | null;
  vmOk: boolean;
  vmError: string;
  toasts: { id: number; text: string }[];
  view: View;
  tab: Tab;
  setTab: (t: Tab) => void;
  setAgents: (agents: Agent[]) => void;
  applyEvent: (status: string, container: string) => void;
  select: (name: string | null) => void;
  setSplit: (name: string | null) => void;
  setVM: (ok: boolean, error: string) => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
  setView: (v: View) => void;
}

export const useStore = create<State>()((set) => ({
  agents: [], needsYou: {}, reviewReady: {},
  selected: null, split: null, vmOk: true, vmError: "",
  toasts: [], view: "agents", tab: "terminal",
  setTab: (tab) => set({ tab }),
  setAgents: (agents) => set({ agents }),
  applyEvent: (status, container) =>
    set((s) => {
      if (!container) return {};
      const needsYou = { ...s.needsYou };
      const reviewReady = { ...s.reviewReady };
      if (NEEDS.has(status)) needsYou[container] = true;
      else delete needsYou[container];
      if (REVIEW.has(status)) reviewReady[container] = true;
      else if (status === "info") delete reviewReady[container];
      return { needsYou, reviewReady };
    }),
  select: (selected) =>
    set((s) => {
      // Default tab follows the agent's state: terminal for running,
      // output for stopped (attach would fail).
      const a = s.agents.find((x) => x.Name === selected);
      return { selected, tab: a && !a.Running ? "output" : "terminal" };
    }),
  setSplit: (split) => set({ split }),
  setVM: (vmOk, vmError) => set({ vmOk, vmError }),
  toast: (text) =>
    set((s) => {
      // Dedup identical messages; cap the stack at 5 (drop oldest).
      if (s.toasts.some((t) => t.text === text)) return {};
      const id = ++toastSeq;
      setTimeout(() => useStore.getState().dismissToast(id), 8000);
      const toasts = [...s.toasts, { id, text }];
      return { toasts: toasts.slice(-5) };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setView: (view) => set({ view }),
}));

// Dev-only: expose the store for browser-preview UX testing
// (wails3 dev in a browser has no runtime bridge, so views are driven
// by injecting fixture state).
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__store = useStore;
}
