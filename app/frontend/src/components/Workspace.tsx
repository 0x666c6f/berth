import { useState } from "react";
import { useStore } from "../store";
import { TerminalPane } from "./TerminalPane";
import { OutputTab } from "./OutputTab";
import { InfoTab } from "./InfoTab";
import { DiffTab } from "./DiffTab";

type Tab = "terminal" | "diff" | "output" | "info";
const TABS: Tab[] = ["terminal", "diff", "output", "info"];

export function Workspace({ name }: { name: string }) {
  const { split, setSplit, agents } = useStore();
  const me = agents.find((a) => a.Name === name);
  // Stopped agents default to Output (attach would fail); running to Terminal.
  const [tab, setTab] = useState<Tab>(me?.Running ? "terminal" : "output");
  const others = agents.filter((a) => a.Running && a.Name !== name);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-neutral-800 px-2 py-1.5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-neutral-700" : "hover:bg-neutral-800"}`}>
            {t}
          </button>
        ))}
        {me && !me.Running && (
          <span className="ml-2 rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
            stopped — {me.State || "exited"}
          </span>
        )}
        <select
          className="ml-auto rounded bg-neutral-800 px-2 py-1 text-xs"
          value={split ?? ""}
          onChange={(e) => setSplit(e.target.value || null)}
        >
          <option value="">no split</option>
          {others.map((a) => <option key={a.Name} value={a.Name}>{a.Name}</option>)}
        </select>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {tab === "terminal" && (me?.Running
            ? <TerminalPane container={name} />
            : <div className="flex h-full items-center justify-center text-neutral-500">
                agent is stopped — no live terminal. Use the Output tab, or Retry to relaunch.
              </div>)}
          {tab === "output" && <OutputTab name={name} />}
          {tab === "info" && <InfoTab name={name} />}
          {tab === "diff" && <DiffTab name={name} />}
        </div>
        {split && (
          <div className="min-w-0 flex-1 border-l border-neutral-800">
            <TerminalPane container={split} />
          </div>
        )}
      </div>
    </div>
  );
}
