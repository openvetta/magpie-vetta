/** Vetta Agent integration using its existing default runtime marker. */
export declare const agent: {
  id: string;
  name: string;
  icon: string;
  ua: string[];
  dir: string;
  config: string;
  notice: string;
  library: {
    instructions: string;
    mcp: string;
    mcpFormat: string;
    skills: string;
  };
};
/** Host-owned marker; Vetta model settings are not changed. */
export declare function connect(): {
  enabled: boolean;
};
//# sourceMappingURL=index.d.ts.map