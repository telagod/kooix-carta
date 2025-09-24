import path from "node:path";

function assertWithinRoot(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path ${target} escapes server root ${root}`);
  }
}

export function resolvePath(root: string, input: string): string {
  const normalizedRoot = path.resolve(root);
  const candidate = path.resolve(normalizedRoot, input);
  assertWithinRoot(normalizedRoot, candidate);
  return candidate;
}

export function ensureRelative(root: string, absolutePath: string): string {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(absolutePath);
  assertWithinRoot(normalizedRoot, normalizedTarget);
  const relative = path.relative(normalizedRoot, normalizedTarget);
  return toPosixPath(relative);
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function joinSafe(root: string, segment: string | undefined): string {
  if (!segment || segment.trim() === "") {
    return path.resolve(root);
  }
  return resolvePath(root, segment);
}
