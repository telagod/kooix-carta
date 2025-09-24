import { createHash } from "node:crypto";

export function sha256(input: string | Buffer): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export function normalizeNewlines(content: string): string {
  return content.replace(/\r\n?/g, "\n");
}

export function normalizeBlockContent(content: string): string {
  const normalized = normalizeNewlines(content);
  const lines = normalized.split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  return lines.join("\n");
}

export function hashBlockContent(content: string): string {
  return sha256(normalizeBlockContent(content));
}
