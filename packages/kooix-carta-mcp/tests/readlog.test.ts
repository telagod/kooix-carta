import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appendRead } from "../src/readlog.js";

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "carta-readlog-"));
}

describe("appendRead", () => {
  it("writes entries to JSONL in jsonl mode", async () => {
    const dir = await tempDir();
    try {
      await appendRead(dir, "jsonl", {
        runId: "run-1",
        path: "src/index.ts",
        sha256: "a".repeat(64),
      });

      const logPath = path.join(dir, ".kooix", "logs", "readlog.jsonl");
      const content = await fs.readFile(logPath, "utf8");
      const line = JSON.parse(content.trim());
      expect(line.runId).toBe("run-1");
      expect(line.path).toBe("src/index.ts");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("does nothing when audit mode is none", async () => {
    const dir = await tempDir();
    try {
      await appendRead(dir, "none", {
        runId: "run-2",
        path: "file.ts",
        sha256: "b".repeat(64),
      });
      const exists = await fs
        .access(path.join(dir, ".kooix", "logs", "readlog.jsonl"))
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
