import { useEffect, useState } from "react";
import { useStore, statusFor } from "../store";
import { StatusDot } from "./StatusDot";
import { AgentService } from "../../bindings/github.com/0x666c6f/safe-agentic/app/internal/svc";
import { Service } from "../../bindings/github.com/0x666c6f/safe-agentic/app/internal/state";
import type { Agent } from "../types";

export function FleetView() {
  const { agents, needsYou, reviewReady, select, setView, toast } = useStore();
  const [pipelines, setPipelines] = useState<string[]>([]);
  const [pick, setPick] = useState("");

  useEffect(() => {
    Service.PipelineFiles().then((f: string[] | null) => setPipelines(f ?? [])).catch(() => {});
  }, []);

  const fleets = new Map<string, Agent[]>();
  for (const a of agents) {
    if (a.Fleet) fleets.set(a.Fleet, [...(fleets.get(a.Fleet) ?? []), a]);
  }

  const Chip = ({ a }: { a: Agent }) => (
    <div className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-3 py-2">
      <StatusDot status={statusFor(a, needsYou, reviewReady)} />
      <button className="text-sm hover:underline" onClick={() => { select(a.Name); setView("agents"); }}>
        {a.Name.replace(/^agent-/, "")}
      </button>
      <span className="text-xs text-neutral-500">{a.Hierarchy}</span>
      {!a.Running && (
        <button className="btn" onClick={() =>
          AgentService.Retry(a.Name, "").then(() => toast("retried")).catch((e: unknown) => toast(String(e)))}>
          retry
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
        <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="" disabled>run pipeline…</option>
          {pipelines.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn" disabled={!pick} onClick={() =>
          AgentService.PipelineRun(pick).then((o: string) => toast(o)).catch((e: unknown) => toast(String(e)))
        }>Run</button>
      </div>
      {[...fleets.entries()].map(([name, list]) => (
        <div key={name}>
          <h3 className="mb-2 text-sm uppercase text-neutral-400">{name}</h3>
          <div className="flex flex-wrap gap-2">
            {list.sort((x, y) => x.Hierarchy.localeCompare(y.Hierarchy)).map((a) => <Chip key={a.Name} a={a} />)}
          </div>
        </div>
      ))}
      {fleets.size === 0 && <div className="text-neutral-500">No fleet containers. Run a pipeline above or `safe-ag fleet`.</div>}
    </div>
  );
}
