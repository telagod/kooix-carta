import fs from "node:fs/promises";
import fg from "fast-glob";
import { parseFileContent, computeEditBlockHashes } from "./parser.js";
import { sha256 } from "./hash.js";
import { ensureRelative, joinSafe, resolvePath } from "./utils.js";
import { GetCardsResponse, ScanRequest, ScanResponse } from "./types.js";

const DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.hg/**",
  "**/.svn/**",
  "**/dist/**",
  "**/build/**",
  "**/.*/**"
];

export async function scanRepo(baseRoot: string, request: ScanRequest = {}): Promise<ScanResponse> {
  const scanRoot = joinSafe(baseRoot, request.root);
  const patterns = request.include && request.include.length > 0 ? request.include : ["**/*"];
  const exclude = [...DEFAULT_EXCLUDES, ...(request.exclude ?? [])];

  const entries = await fg(patterns, {
    cwd: scanRoot,
    ignore: exclude,
    onlyFiles: true,
    dot: false,
    absolute: true,
    followSymbolicLinks: false,
  });

  const files = await Promise.all(
    entries.map(async (absolutePath) => {
      const relativePath = ensureRelative(baseRoot, absolutePath);
      const content = await fs.readFile(absolutePath, "utf8");
      const { sfc, dfc, editBlocks } = parseFileContent(content);
      const hashedBlocks = computeEditBlockHashes(editBlocks);
      return {
        path: relativePath,
        sfc,
        dfc,
        editBlocks: hashedBlocks,
        sha256: sha256(content),
      };
    })
  );

  files.sort((a, b) => a.path.localeCompare(b.path));

  return { files };
}

export async function getCards(baseRoot: string, filePath: string): Promise<GetCardsResponse> {
  const target = resolvePath(baseRoot, filePath);
  const relative = ensureRelative(baseRoot, target);
  const content = await fs.readFile(target, "utf8");
  const { sfc, dfc } = parseFileContent(content);

  const response: GetCardsResponse = {
    path: relative,
    sha256: sha256(content),
  };

  if (sfc.exists && sfc.yaml && sfc.start !== undefined && sfc.end !== undefined) {
    response.sfc = { yaml: sfc.yaml, start: sfc.start, end: sfc.end };
  }

  if (dfc.exists && dfc.yaml && dfc.start !== undefined && dfc.end !== undefined) {
    response.dfc = { yaml: dfc.yaml, start: dfc.start, end: dfc.end };
  }

  return response;
}
