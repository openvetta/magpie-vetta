import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { agent } from "../src/index.js";

const execFileAsync = promisify(execFile);
const skillDirectory = new URL("./fixtures/vetta-skill/", import.meta.url);

describe("Vetta Skill distribution", () => {
  it("declares Vetta's dedicated Skills directory", () => {
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
