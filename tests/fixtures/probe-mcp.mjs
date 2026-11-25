import { appendFileSync } from "node:fs";
import { createInterface } from "node:readline";

const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  const request = JSON.parse(line);
  if (request.id === undefined) return;
  let result;
  if (request.method === "initialize") {
    result = {
      protocolVersion: request.params.protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: "vetta-probe", version: "1.0.0" },
    };
  } else if (request.method === "tools/list") {
    result = {
      tools: [
        {
          name: "vetta_probe",
          description: "Return a test marker",
          inputSchema: {
            type: "object",
            properties: { text: { type: "string" } },
            required: ["text"],
          },
        },
      ],
    };
  } else if (request.method === "tools/call" && request.params.name === "vetta_probe") {
    const text = request.params.arguments.text;
    if (process.env.VETTA_PROBE_LOG) appendFileSync(process.env.VETTA_PROBE_LOG, `${text}\n`);
    result = { content: [{ type: "text", text: `probe-ok: ${text}` }] };
  } else {
    process.stdout.write(
      `${JSON.stringify({ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: "Method not found" } })}\n`,
    );
    return;
  }
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: request.id, result })}\n`);
});
