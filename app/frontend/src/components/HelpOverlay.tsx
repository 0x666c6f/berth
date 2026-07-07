import { useEffect } from "react";

const SHORTCUTS: [string, string][] = [
  ["j / k", "move selection down / up"],
  ["⌘1 … ⌘9", "jump to agent (sidebar order)"],
  ["⌘T", "terminal tab"],
  ["⌘D", "diff tab"],
  ["⌘O", "output tab"],
  ["⌘I", "info tab"],
  ["⌘K", "command palette"],
  ["⌘F", "search in terminal"],
  ["⌘N", "new window"],
  ["?", "toggle this help"],
  ["Esc", "close menus / overlays"],
];

// HelpOverlay is the `?`-triggered cheat sheet for every keyboard shortcut.
// It closes on Esc, backdrop click, or another `?` (handled by the parent).
export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-80 rounded-lg border border-neutral-700 bg-neutral-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-200">Keyboard shortcuts</span>
          <button className="text-xs text-neutral-500 hover:text-neutral-200" onClick={onClose}>Esc</button>
        </div>
        <table className="w-full text-xs text-neutral-400">
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k}>
                <td className="whitespace-nowrap py-0.5 pr-4 text-right font-mono text-neutral-300">{k}</td>
                <td className="py-0.5">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
