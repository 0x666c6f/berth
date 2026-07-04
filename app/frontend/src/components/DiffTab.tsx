import { useEffect, useState } from "react";
import { html as diffHtml } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { AgentService } from "../../bindings/github.com/0x666c6f/safe-agentic/app/internal/svc";
import { useStore } from "../store";

export function DiffTab({ name }: { name: string }) {
  const toast = useStore((s) => s.toast);
  const [diff, setDiff] = useState("");
  const [checkpoints, setCheckpoints] = useState("");
  const [ref, setRef] = useState("");

  const reload = () => {
    AgentService.Diff(name).then(setDiff).catch((e: unknown) => toast(String(e)));
    AgentService.CheckpointList(name).then(setCheckpoints).catch(() => setCheckpoints(""));
  };
  useEffect(() => { reload(); }, [name]);

  const act = (label: string, fn: () => Promise<unknown>) => async () => {
    try { await fn(); toast(`${label}: ok`); reload(); } catch (e) { toast(String(e)); }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn" onClick={reload}>Refresh</button>
        <button className="btn" onClick={act("stage", () => AgentService.WorkspaceStage(name))}>Stage all</button>
        <button className="btn" onClick={act("revert", () => AgentService.WorkspaceRevert(name))}>Revert all</button>
        <span className="mx-2 text-neutral-600">|</span>
        <button className="btn" onClick={act("checkpoint", () => AgentService.CheckpointCreate(name, ""))}>Checkpoint now</button>
        <input className="input w-40" placeholder="ref…" value={ref} onChange={(e) => setRef(e.target.value)} />
        <button className="btn" disabled={!ref} onClick={act("restore", () => AgentService.CheckpointRestore(name, ref))}>Restore</button>
      </div>
      {checkpoints && <pre className="mb-3 rounded bg-neutral-900 p-2 text-xs">{checkpoints}</pre>}
      {diff.trim()
        ? <div className="diff-container rounded bg-white text-black"
            dangerouslySetInnerHTML={{ __html: diffHtml(diff, { drawFileList: true, outputFormat: "line-by-line" }) }} />
        : <div className="text-neutral-500">no changes</div>}
    </div>
  );
}
