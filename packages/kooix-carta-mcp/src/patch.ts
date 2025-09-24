import fs from "node:fs/promises";
import { createTwoFilesPatch } from "diff";
import { normalizeNewlines, hashBlockContent } from "./hash.js";
import { resolvePath, ensureRelative } from "./utils.js";
import { parseFileContent, findBlock } from "./parser.js";
import { cartaError } from "./errors.js";
import { ApplyPatchRequest, ApplyPatchResult } from "./types.js";

export async function applyPatch(baseRoot: string, readOnly: boolean, request: ApplyPatchRequest): Promise<ApplyPatchResult> {
  if (readOnly) {
    throw cartaError("READ_ONLY_MODE", "Server is running in read-only mode");
  }

  const targetPath = resolvePath(baseRoot, request.file);
  const relativePath = ensureRelative(baseRoot, targetPath);
  const originalContent = await fs.readFile(targetPath, "utf8");
  const newline = originalContent.includes("\r\n") ? "\r\n" : "\n";
  const normalizedOriginal = normalizeNewlines(originalContent);
  const parseResult = parseFileContent(originalContent);
  const block = findBlock(parseResult.editBlocks, request.blockId);

  if (!block) {
    throw cartaError("BOUNDARY_NOT_FOUND", `Block ${request.blockId} not found in ${relativePath}`);
  }

  const currentHash = hashBlockContent(block.content);
  if (currentHash !== request.oldHash) {
    throw cartaError("STALE_BLOCK", `Existing block hash mismatch for ${request.blockId}`, {
      expected: request.oldHash,
      actual: currentHash,
    });
  }

  if (/LLM-EDIT:(BEGIN|END)/.test(request.newContent)) {
    throw cartaError("OUT_OF_BOUND_WRITE", "New content must not contain LLM-EDIT boundary markers");
  }

  const normalizedNewContent = normalizeNewlines(request.newContent);
  const newContentLines = normalizedNewContent === "" ? [] : normalizedNewContent.split("\n");
  const lines = normalizedOriginal.split("\n");

  const beginIndex = block.beginLine - 1;
  const endMarkerIndex = block.endMarkerLine - 1;

  const before = lines.slice(0, beginIndex + 1);
  const after = lines.slice(endMarkerIndex);

  const updatedLines = [...before, ...newContentLines, ...after];
  const updatedNormalized = updatedLines.join("\n");
  const updatedContent = newline === "\n" ? updatedNormalized : updatedNormalized.replace(/\n/g, newline);

  await fs.writeFile(targetPath, updatedContent, "utf8");

  const newHash = hashBlockContent(normalizedNewContent);
  const diff = createTwoFilesPatch(
    relativePath,
    relativePath,
    originalContent,
    updatedContent,
    "before",
    "after"
  );

  return {
    file: relativePath,
    blockId: request.blockId,
    newHash,
    diff,
  };
}
