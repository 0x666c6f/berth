import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Events } from "@wailsio/runtime";
import { TerminalService } from "../../bindings/github.com/0x666c6f/safe-agentic/app/internal/svc";
import { errText } from "../types";
import "@xterm/xterm/css/xterm.css";

const b64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
// Pinned alpha delivers event.data raw, no array wrapping (see App.tsx).
const unwrap = (e: any) => e?.data;

export function TerminalPane({ container }: { container: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    setError("");
    const xterm = new Terminal({ fontSize: 13, fontFamily: "Menlo, monospace", scrollback: 10000 });
    const fit = new FitAddon();
    xterm.loadAddon(fit);
    xterm.open(ref.current);
    try { xterm.loadAddon(new WebglAddon()); } catch { /* canvas fallback */ }
    fit.fit();
    xterm.writeln(`\x1b[90mattaching to ${container}…\x1b[0m`);

    let id: string | null = null;
    let offData = () => {};
    let offExit = () => {};
    let disposed = false;

    TerminalService.Open(container)
      .then((tid: string) => {
        if (disposed) { TerminalService.Close(tid); return; }
        id = tid;
        offData = Events.On(`term:data:${tid}`, (e: any) => xterm.write(b64ToBytes(unwrap(e))));
        offExit = Events.On(`term:exit:${tid}`, () =>
          xterm.writeln("\r\n\x1b[33m[disconnected — press ⟳ Reattach]\x1b[0m"));
        TerminalService.Resize(tid, xterm.cols, xterm.rows);
      })
      .catch((e: unknown) => setError(errText(`attach ${container}`, e)));

    const onData = xterm.onData((d) => { if (id) TerminalService.Write(id, d); });
    const ro = new ResizeObserver(() => {
      fit.fit();
      if (id) TerminalService.Resize(id, xterm.cols, xterm.rows);
    });
    ro.observe(ref.current);

    return () => {
      disposed = true;
      ro.disconnect();
      onData.dispose();
      offData(); offExit();
      if (id) TerminalService.Close(id);
      xterm.dispose();
    };
  }, [container, attempt]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950/90 p-6">
          <pre className="max-w-xl whitespace-pre-wrap rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</pre>
          <button className="btn" onClick={() => setAttempt((n) => n + 1)}>⟳ Reattach</button>
        </div>
      )}
      <button
        className="btn absolute right-2 top-2 opacity-60 hover:opacity-100"
        title="Reattach"
        onClick={() => setAttempt((n) => n + 1)}
      >⟳</button>
    </div>
  );
}
