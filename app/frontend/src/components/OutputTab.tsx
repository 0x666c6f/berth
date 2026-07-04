import { useEffect, useState } from "react";
import { AgentService } from "../../bindings/github.com/0x666c6f/safe-agentic/app/internal/svc";
import { useStore } from "../store";
import { errText } from "../types";

export function OutputTab({ name }: { name: string }) {
  const toast = useStore((s) => s.toast);
  const [info, setInfo] = useState<{ status: string; last_output: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [steer, setSteer] = useState("");
  const [feedback, setFeedback] = useState("");

  const reload = () => {
    setLoading(true);
    setError("");
    AgentService.Output(name)
      .then((i: any) => setInfo(i))
      .catch((e: unknown) => setError(errText("load output", e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { reload(); }, [name]);

  const act = (label: string, fn: () => Promise<unknown>) => async () => {
    try { await fn(); toast(`${label}: ok`); reload(); }
    catch (e) { toast(errText(label, e)); }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 text-sm">
      <div className="text-xs text-neutral-500">status: {info?.status ?? "…"}</div>
      {error
        ? <pre className="whitespace-pre-wrap rounded border border-red-900 bg-red-950/40 p-3 text-red-200">{error}</pre>
        : <pre className="whitespace-pre-wrap rounded bg-neutral-900 p-3">{loading ? "loading…" : (info?.last_output || "(no output yet)")}</pre>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={act("stop", () => AgentService.Stop(name))}>Stop</button>
        <button className="btn" onClick={act("pr", () => AgentService.PR(name))}>Create PR</button>
        <button className="btn" onClick={act("review", () => AgentService.Review(name))}>AI Review</button>
        <button className="btn" onClick={reload}>Reload</button>
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="steer message…" value={steer}
          onChange={(e) => setSteer(e.target.value)} />
        <button className="btn" disabled={!steer}
          onClick={act("steer", () => AgentService.Steer(name, steer).then(() => setSteer("")))}>Steer</button>
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="retry feedback (optional)…" value={feedback}
          onChange={(e) => setFeedback(e.target.value)} />
        <button className="btn"
          onClick={act("retry", () => AgentService.Retry(name, feedback))}>Retry</button>
      </div>
    </div>
  );
}
