import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCards, scanRepo } from "../src/scan.js";

async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "carta-scan-"));
  return dir;
}

describe("scanRepo", () => {
  it("indexes SFC, DFC, and LLM-EDIT blocks", async () => {
    const dir = await createTempDir();
    try {
      const tsFile = path.join(dir, "handler.ts");
      const mdFile = path.join(dir, "README.md");

      await fs.writeFile(
        tsFile,
        `/* @SFC\nname: handler\nrole: test\n*/\nexport function handler() {\n}\n/* LLM-EDIT:BEGIN block-1 */\nconsole.log("hello");\n/* LLM-EDIT:END block-1 */\n`,
        "utf8"
      );

      await fs.writeFile(
        mdFile,
        `---\n@DFC: root\npurpose: test\n---\n`,
        "utf8"
      );

      const result = await scanRepo(dir, {});
      expect(result.files.length).toBe(2);

      const handlerEntry = result.files.find((file) => file.path.endsWith("handler.ts"));
      expect(handlerEntry?.sfc.exists).toBe(true);
      expect(handlerEntry?.editBlocks[0]?.blockId).toBe("block-1");

      const readmeEntry = result.files.find((file) => file.path.endsWith("README.md"));
      expect(readmeEntry?.dfc.exists).toBe(true);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe("getCards", () => {
  it("returns card details for a given file", async () => {
    const dir = await createTempDir();
    try {
      const tsFile = path.join(dir, "handler.ts");
      await fs.writeFile(
        tsFile,
        `/* @SFC\nname: handler\nrole: test\n*/\nexport const noop = () => {};\n`,
        "utf8"
      );

      const details = await getCards(dir, "handler.ts");
      expect(details.sfc?.yaml).toContain("name: handler");
      expect(details.sha256).toHaveLength(64);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
