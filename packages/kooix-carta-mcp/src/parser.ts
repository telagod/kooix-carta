import { hashBlockContent, normalizeNewlines } from "./hash.js";
import { EditBlockInfo, ScanCardInfo } from "./types.js";

export interface ParsedEditBlock extends EditBlockInfo {
  beginLine: number;
  endMarkerLine: number;
  content: string;
}

interface BlockLocation {
  id: string;
  beginLine: number;
}

export interface ParseResult {
  sfc: ScanCardInfo;
  dfc: ScanCardInfo;
  editBlocks: ParsedEditBlock[];
}

function stripBom(input: string): string {
  if (!input) {
    return input;
  }
  if (input.charCodeAt(0) === 0xfeff) {
    return input.slice(1);
  }
  return input;
}

function stripCommentDelimiters(rawLines: string[]): string[] {
  if (rawLines.length === 0) {
    return rawLines;
  }

  const first = rawLines[0];
  const last = rawLines[rawLines.length - 1];

  const blockStart = /^\s*\/\*/.test(first);
  const blockEnd = /\*\/\s*$/.test(last);
  const htmlStart = /^\s*<!--/.test(first);
  const htmlEnd = /-->\s*$/.test(last);

  const lines = rawLines.map((line) => {
    if (/^\s*(\/\/|#)/.test(line)) {
      return line.replace(/^\s*(\/\/|#)\s?/, "");
    }
    if (/^\s*--\s/.test(line)) {
      return line.replace(/^\s*--\s?/, "");
    }
    return line;
  });

  if (blockStart && blockEnd) {
    lines[0] = lines[0].replace(/^\s*\/\*+\s?/, "");
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\*+\/\s*$/, "");
  }

  if (htmlStart && htmlEnd) {
    lines[0] = lines[0].replace(/^\s*<!--\s?/, "");
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*-->\s*$/, "");
  }

  return lines.map((line) => line.replace(/^\s*\*\s?/, ""));
}

function extractSfcBlock(lines: string[]): ScanCardInfo {
  let index = 0;
  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }

  if (index >= lines.length) {
    return { exists: false };
  }

  const firstLine = lines[index].trim();
  const blockLines: string[] = [];
  let endIndex = index;

  if (firstLine.startsWith("/*")) {
    blockLines.push(lines[index]);
    while (endIndex < lines.length && !lines[endIndex].includes("*/")) {
      endIndex += 1;
      blockLines.push(lines[endIndex]);
    }
  } else if (firstLine.startsWith("<!--")) {
    blockLines.push(lines[index]);
    while (endIndex < lines.length && !lines[endIndex].includes("-->")) {
      endIndex += 1;
      blockLines.push(lines[endIndex]);
    }
  } else if (/^\s*(\/\/|#)/.test(lines[index])) {
    while (endIndex < lines.length && /^\s*(\/\/|#)/.test(lines[endIndex])) {
      blockLines.push(lines[endIndex]);
      endIndex += 1;
    }
    endIndex -= 1;
  } else {
    return { exists: false };
  }

  const stripped = stripCommentDelimiters(blockLines);
  const sfcIndex = stripped.findIndex((line) => line.includes("@SFC"));

  if (sfcIndex === -1) {
    return { exists: false };
  }

  const yamlLines = stripped.slice(sfcIndex);

  return {
    exists: true,
    start: index + sfcIndex + 1,
    end: index + stripped.length,
    yaml: yamlLines.join("\n").trimEnd(),
  };
}

function extractDfcBlock(lines: string[]): ScanCardInfo {
  let index = 0;
  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }

  if (index >= lines.length || lines[index].trim() !== "---") {
    return { exists: false };
  }

  let endIndex = index + 1;
  while (endIndex < lines.length && lines[endIndex].trim() !== "---") {
    endIndex += 1;
  }

  if (endIndex >= lines.length) {
    return { exists: false };
  }

  const yamlLines = lines.slice(index + 1, endIndex);
  const hasDfc = yamlLines.some((line) => line.includes("@DFC"));

  if (!hasDfc) {
    return { exists: false };
  }

  return {
    exists: true,
    start: index + 2,
    end: endIndex,
    yaml: yamlLines.join("\n").trimEnd(),
  };
}

const EDIT_MARKER_REGEX = /LLM-EDIT:(BEGIN|END)\s+([^\s*]+)/;

function extractEditBlocks(lines: string[]): ParsedEditBlock[] {
  const blocks: ParsedEditBlock[] = [];
  const openBlocks = new Map<string, BlockLocation>();

  lines.forEach((rawLine, idx) => {
    const lineNumber = idx + 1;
    const match = EDIT_MARKER_REGEX.exec(rawLine);
    if (!match) {
      return;
    }

    const [, marker, idRaw] = match;
    const blockId = idRaw.trim();

    if (marker === "BEGIN") {
      openBlocks.set(blockId, { id: blockId, beginLine: lineNumber });
      return;
    }

    const info = openBlocks.get(blockId);
    if (!info) {
      return;
    }

    const startLine = info.beginLine + 1;
    const endLine = lineNumber - 1;
    const contentLines = startLine <= endLine ? lines.slice(startLine - 1, endLine) : [];
    const normalized = contentLines.length > 0 ? normalizeNewlines(contentLines.join("\n")) : "";

    blocks.push({
      blockId,
      start: startLine,
      end: endLine,
      beginLine: info.beginLine,
      endMarkerLine: lineNumber,
      content: normalized,
    });

    openBlocks.delete(blockId);
  });

  return blocks;
}

export function parseFileContent(content: string): ParseResult {
  const sanitized = stripBom(content ?? "");
  const normalized = normalizeNewlines(sanitized);
  const lines = normalized.split("\n");
  const sfc = extractSfcBlock(lines);
  const dfc = extractDfcBlock(lines);
  const editBlocks = extractEditBlocks(lines);
  return {
    sfc,
    dfc,
    editBlocks,
  };
}

export function hashEditBlockContent(block: ParsedEditBlock): string {
  return hashBlockContent(block.content);
}

export function computeEditBlockHashes(blocks: ParsedEditBlock[]): (EditBlockInfo & { hash: string })[] {
  return blocks.map((block) => ({
    blockId: block.blockId,
    start: block.start,
    end: block.end,
    hash: hashEditBlockContent(block),
  }));
}

export function findBlock(blocks: ParsedEditBlock[], blockId: string): ParsedEditBlock | undefined {
  return blocks.find((block) => block.blockId === blockId);
}

export type ParsedFile = ParseResult;
