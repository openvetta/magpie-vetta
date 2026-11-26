import { describe, expect, it } from "vitest";
import { agent, connect, vettaModel } from "../src/index.js";

const gateway = { url: "http://127.0.0.1:3425", v1: "http://127.0.0.1:3425/v1", key: "mk-vetta" };

describe("Vetta model connection", () => {
  it("writes into Vetta's models.json as a switch, without a model key", () => {
    expect(agent.config).toBe("~/.vetta/agent/models.json");
    expect(agent.format).toBe("json");
    expect(agent).not.toHaveProperty("model");
  });

  it("writes the whole Magpie provider, marked as owned by Magpie", () => {
    const result = connect({ gateway, models: [{ id: "codex/gpt-6.1-sol", name: "GPT 6.1 Sol" }] });

    expect(Object.keys(result)).toEqual(["providers.magpie"]);
    expect(result["providers.magpie"]).toMatchObject({
      source: "magpie",
      baseUrl: "http://127.0.0.1:3425/v1",
      apiKey: "mk-vetta",
      api: "openai-completions",
      headers: { "User-Agent": "Vetta" },
      models: [{ id: "codex/gpt-6.1-sol", name: "GPT 6.1 Sol", input: ["text"], reasoning: false }],
    });
  });

  it("maps efforts, images, limits and per-token prices to Vetta's model fields", () => {
    expect(
      vettaModel({
        id: "claude/claude-opus-5-5",
        context: 200000,
        output: 400000,
        images: true,
        efforts: ["none", "low", "high", "max"],
        pricing: { prompt: "0.000005", completion: "0.000025", input_cache_read: "0.0000005" },
      }),
    ).toEqual({
      id: "claude/claude-opus-5-5",
      name: "claude/claude-opus-5-5",
      input: ["text", "image"],
      reasoning: true,
      reasoningLevels: ["low", "high", "max"],
      contextWindow: 200000,
      maxTokens: 200000,
      cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 0 },
    });
  });

  it("offers routing groups as models, without duplicating ids already listed", () => {
    const result = connect({
      gateway,
      models: [{ id: "auto/auto" }],
      decisionModels: [
        { id: "auto/auto", group: true },
        { id: "auto/glm-5.4", name: "GLM 5.4 group", group: true },
        { id: "deepseek/deepseek-v4", name: "Decision model" },
      ],
    });
    expect(result["providers.magpie"].models.map((model) => model.id)).toEqual([
      "auto/auto",
      "auto/glm-5.4",
    ]);
  });
});
