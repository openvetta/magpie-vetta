/**
 * Vetta keeps its model providers in ~/.vetta/agent/models.json. With no `model`
 * key the Agents row is a switch: switching Vetta on writes `providers.magpie`
 * there, switching it off puts the file back. Vetta 0.6.27+ reads an entry marked
 * `source: "magpie"` as owned by Magpie: it shows it read-only and leaves the key
 * in the file, so Magpie can still see it is connected.
 */
export declare const agent: {
  id: string;
  name: string;
  icon: string;
  ua: string[];
  dir: string;
  config: string;
  format: string;
  notice: string;
  library: {
    instructions: string;
    mcp: string;
    mcpFormat: string;
    skills: string;
  };
};
export interface MagpieModel {
  id: string;
  name?: string;
  context?: number;
  output?: number;
  images?: boolean;
  efforts?: string[];
  pricing?: {
    prompt?: string;
    completion?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
}
export interface MagpieDecisionModel {
  id: string;
  name?: string;
  group?: boolean;
}
export interface ConnectInput {
  gateway: {
    url: string;
    v1: string;
    key: string;
  };
  models: MagpieModel[];
  decisionModels?: MagpieDecisionModel[];
}
export interface VettaModel {
  id: string;
  name: string;
  input: ["text"] | ["text", "image"];
  reasoning: boolean;
  reasoningLevels?: string[];
  contextWindow?: number;
  maxTokens?: number;
  cost?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
}
export declare function vettaModel(model: MagpieModel): VettaModel;
/**
 * The whole provider is written and restored as one unit, as PiG's plugin does:
 * leaf-only writes would leave an empty provider behind after switching off.
 * Routing groups (`auto/...`) are offered as models too, as Magpie's /v1/models lists them.
 */
export declare function connect({ gateway, models, decisionModels }: ConnectInput): {
  "providers.magpie": {
    source: string;
    displayName: string;
    icon: string;
    baseUrl: string;
    apiKey: string;
    api: string;
    headers: {
      "User-Agent": string;
    };
    models: VettaModel[];
  };
};
//# sourceMappingURL=index.d.ts.map