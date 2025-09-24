import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { applyPatch } from "../src/patch.js";
import { scanRepo } from "../src/scan.js";

async function setupFile(): Promise<{ dir: string; file: string; hash: string }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "carta-patch-"));
  const file = path.join(dir, "module.ts");
  await fs.writeFile(
    file,
    `export function before() {}\n/* LLM-EDIT:BEGIN block */\nconsole.log("old");\n/* LLM-EDIT:END block */\n`,
    "utf8"
  );
  const result = await scanRepo(dir, {});
  const entry = result.files.find((item) => item.path.endsWith("module.ts"));
  if (!entry || !entry.editBlocks[0]?.hash) {
    throw new Error("Failed to locate edit block hash in fixture");
  }
  return { dir, file: "module.ts", hash: entry.editBlocks[0].hash };
}

describe("applyPatch", () => {
  it("replaces block content and returns new hash", async () => {
    const { dir, file, hash } = await setupFile();
    try {
      const result = await applyPatch(dir, false, {
        file,
        blockId: "block",
        oldHash: hash,
        newContent: 'console.log("new");',
      });

      expect(result.newHash).not.toBe(hash);
      const updated = await fs.readFile(path.join(dir, file), "utf8");
      expect(updated).toContain('console.log("new");');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("throws when in read-only mode", async () => {
    const { dir, file, hash } = await setupFile();
    try {
      await expect(
        applyPatch(dir, true, {
          file,
          blockId: "block",
          oldHash: hash,
          newContent: "",
        })
      ).rejects.toMatchObject({
        data: { code: "READ_ONLY_MODE" },
      });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects stale hashes", async () => {
    const { dir, file, hash } = await setupFile();
    try {
      await applyPatch(dir, false, {
        file,
        blockId: "block",
        oldHash: hash,
        newContent: "console.log('update');",
      });

      await expect(
        applyPatch(dir, false, {
          file,
          blockId: "block",
          oldHash: hash,
          newContent: "console.log('again');",
        })
      ).rejects.toMatchObject({ data: { code: "STALE_BLOCK" } });
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

