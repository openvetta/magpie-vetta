import { vettaIcon } from "./vetta-icon.js";

/**
 * Vetta keeps its model providers in ~/.vetta/agent/models.json. With no `model`
 * key the Agents row is a switch: switching Vetta on writes `providers.magpie`
 * there, switching it off puts the file back. Vetta 0.6.27+ reads an entry marked
 * `source: "magpie"` as owned by Magpie: it shows it read-only and leaves the key
 * in the file, so Magpie can still see it is connected.
 */
export const agent = {
  id: "vetta",
  name: "Vetta",
  icon: vettaIcon,
  ua: ["vetta"],
  dir: "~/.vetta/agent",
  config: "~/.vetta/agent/models.json",
  format: "json",
  notice:
    "Vetta 0.6.27+ shows Magpie's models in its model picker right away; choose a model there. Vetta 0.6.27 及以上会立即在模型选择器里显示 Magpie 的模型，在 Vetta 里选择即可。",
  library: {
    instructions: "~/.vetta/agent/AGENTS.md",
    mcp: "~/.vetta/agent/mcp.json",
    mcpFormat: "claude",
    skills: "~/.vetta/agent/skills",
  },
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

/**
 * Magpie also calls connect while loading the plugin, to see which keys it writes,
 * and that call carries no model list; every field is treated as possibly missing.
 */
export interface ConnectInput {
  gateway?: { url?: string; v1?: string; key?: string };
  models?: MagpieModel[];
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
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

/** Efforts that mean "no thinking" are not a level Vetta can pick. */
const NO_THINKING = new Set(["none", "off"]);
/** Magpie prices are USD per token; Vetta's are USD per million tokens. */
const PER_MILLION = 1_000_000;

function perMillion(price: string | undefined): number | undefined {
  if (price === undefined) return undefined;
  const value = Number(price);
  return Number.isFinite(value) ? value * PER_MILLION : undefined;
}

export function vettaModel(model: MagpieModel): VettaModel {
  const levels = (model.efforts ?? []).filter((effort) => !NO_THINKING.has(effort));
  const entry: VettaModel = {
    id: model.id,
    name: model.name || model.id,
    input: model.images ? ["text", "image"] : ["text"],
    reasoning: levels.length > 0,
  };
  if (levels.length > 0) entry.reasoningLevels = levels;
  // Unknown limits are left to Vetta's defaults; Magpie omits them rather than sending 0.
  if (model.context && model.context > 0) entry.contextWindow = model.context;
  if (model.output && model.output > 0) {
    entry.maxTokens =
      model.context && model.context > 0 ? Math.min(model.output, model.context) : model.output;
  }
  const input = perMillion(model.pricing?.prompt);
  const output = perMillion(model.pricing?.completion);
  if (input !== undefined && output !== undefined) {
    entry.cost = {
      input,
      output,
      cacheRead: perMillion(model.pricing?.input_cache_read) ?? 0,
      cacheWrite: perMillion(model.pricing?.input_cache_write) ?? 0,
    };
  }
  return entry;
}

/**
 * The whole provider is written and restored as one unit, as PiG's plugin does:
 * leaf-only writes would leave an empty provider behind after switching off.
 * Routing groups (`auto/...`) are offered as models too, as Magpie's /v1/models lists them.
 */
export function connect({ gateway, models = [], decisionModels = [] }: ConnectInput = {}) {
  const entries = models.map(vettaModel);
  const ids = new Set(entries.map((entry) => entry.id));
  for (const group of decisionModels) {
    if (!group.group || ids.has(group.id)) continue;
    ids.add(group.id);
    entries.push({ id: group.id, name: group.name || group.id, input: ["text"], reasoning: false });
  }
  return {
    "providers.magpie": {
      source: "magpie",
      displayName: "Magpie",
      icon: "magpie",
      baseUrl: gateway?.v1,
      apiKey: gateway?.key,
      api: "openai-completions",
      // Requests are attributed by the agent's own key; the header also names Vetta
      // to anything that only reads User-Agent.
      headers: { "User-Agent": "Vetta" },
      models: entries,
    },
  };
}
