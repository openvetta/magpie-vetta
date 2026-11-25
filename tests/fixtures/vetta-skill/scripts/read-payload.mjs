import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const skillDirectory = dirname(fileURLToPath(import.meta.url));
const payload = (await readFile(join(skillDirectory, "../references/payload.txt"), "utf8")).trim();

console.log(`skill-resource-ok:${payload}`);
