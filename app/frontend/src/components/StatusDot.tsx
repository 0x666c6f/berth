import type { AgentStatus } from "../types";

// Single source of truth for status→color across the app (dots + Timeline
// badges). Keyed by the semantic AgentStatus, not raw event strings.
export const STATUS_COLORS: Record<AgentStatus, string> = {
  working: "bg-green-500", "needs-you": "bg-yellow-400", idle: "bg-gray-400",
  review: "bg-blue-500", failed: "bg-red-500", stopped: "bg-gray-600",
};

export function StatusDot({ status }: { status: AgentStatus }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]}`} title={status} />;
}
