/** Vetta Agent integration using its existing default runtime marker. */
export const agent = {
  id: "vetta",
  name: "Vetta",
  dir: "~/.vetta/agent",
  config: "~/.vetta/agent/magpie-vetta-state.json",
  notice: "Uses Vetta's default agent directory (~/.vetta/agent).",
  library: {
    mcp: "~/.vetta/agent/mcp.json",
    mcpFormat: "claude",
    skills: "~/.vetta/agent/skills",
  },
};

/** Host-owned marker; Vetta model settings are not changed. */
export function connect(): { enabled: boolean } {
  return { enabled: true };
}
