#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { startServer } from "../src/server.js";
import { AuditMode } from "../src/types.js";

function printHelp(): void {
  console.error(`Usage: carta-mcp serve [options]\n\n` +
    `Options:\n` +
    `  --root <dir>         Root directory to expose (default: current working directory)\n` +
    `  --audit <mode>       Audit mode: jsonl | sqlite | none (default: jsonl)\n` +
    `  --read-only          Disallow edits.apply writes\n` +
    `  --help               Show this help message`);
}

async function main() {
  const {
    values,
    positionals,
  } = parseArgs({
    allowPositionals: true,
    options: {
      root: { type: "string" },
      audit: { type: "string" },
      "read-only": { type: "boolean" },
      readOnly: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const command = positionals[0] ?? "serve";
  if (command !== "serve") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  const root = values.root ? path.resolve(values.root) : process.cwd();
  const auditRaw = values.audit ?? "jsonl";
  const auditMode = auditRaw as AuditMode;

  if (!["jsonl", "sqlite", "none"].includes(auditMode)) {
    console.error(`Invalid audit mode: ${auditRaw}`);
    process.exit(1);
  }

  const readOnly = Boolean(values["read-only"] ?? values.readOnly ?? false);

  console.error(`Starting carta-mcp (root=${root}, audit=${auditMode}, readOnly=${readOnly})`);

  await startServer({
    root,
    auditMode,
    readOnly,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
