import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { agent } from "../src/index.js";

const execFileAsync = promisify(execFile);
const skillDirectory = new URL("./fixtures/vetta-skill/", import.meta.url);

describe("Vetta Skill distribution", () => {
  it("embeds Vetta's checked-in official icon for the Magpie Agent identity", async () => {
    const icon = await readFile(new URL("../assets/vetta-icon.png", import.meta.url));

    expect(agent.icon).toBe(`data:image/png;base64,${icon.toString("base64")}`);
    expect(agent.ua).toEqual(["vetta"]);
  });

  it("declares Vetta's dedicated Skills directory", () => {
    expect(agent.library.instructions).toBe("~/.vetta/agent/AGENTS.md");
    expect(agent.library.skills).toBe("~/.vetta/agent/skills");
    expect(agent.library.skills).not.toContain(".agents/skills");
  });

  it("provides a discoverable Skill with a relative resource and script", async () => {
    const skill = await readFile(new URL("SKILL.md", skillDirectory), "utf8");
    const payload = await readFile(new URL("references/payload.txt", skillDirectory), "utf8");
    const script = new URL("scripts/read-payload.mjs", skillDirectory);

    expect(skill).toContain("name: vetta-resource-probe");
    expect(skill).toContain("description: Read the attached resource");
    expect(skill).toContain("references/payload.txt");
    expect(payload.trim()).toBe("attached-resource");

    const { stdout } = await execFileAsync(process.execPath, [fileURLToPath(script)]);
    expect(stdout.trim()).toBe("skill-resource-ok:attached-resource");
  });
});
