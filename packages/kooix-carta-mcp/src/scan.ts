import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parseFileContent, computeEditBlockHashes } from "./parser.js";
import { sha256 } from "./hash.js";
import { ensureRelative, joinSafe, resolvePath } from "./utils.js";
import { GetCardsResponse, ScanRequest, ScanResponse, ScanFileEntry } from "./types.js";
import { generateSFC, shouldGenerateSFC, GenerateOptions } from "./generator.js";

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

  const files: ScanFileEntry[] = [];
  const generatedFiles: string[] = [];
  let generatedCount = 0;

  for (const absolutePath of entries) {
    const relativePath = ensureRelative(baseRoot, absolutePath);
    const content = await fs.readFile(absolutePath, "utf8");
    const { sfc, dfc, editBlocks } = parseFileContent(content);
    const hashedBlocks = computeEditBlockHashes(editBlocks);

    const fileEntry: ScanFileEntry = {
      path: relativePath,
      sfc,
      dfc,
      editBlocks: hashedBlocks,
      sha256: sha256(content),
    };

    // 自动生成逻辑
    if (request.autoGenerate) {
      const generateOptions: GenerateOptions = {
        template: request.generateOptions?.template || 'minimal',
        inferFromPath: request.generateOptions?.inferFromPath !== false,
        inferFromContent: request.generateOptions?.inferFromContent !== false,
        dryRun: request.generateOptions?.dryRun || false
      };

      let shouldGenerate = false;
      let generatedSFC = false;

      // 检查是否需要生成 SFC
      if (!sfc.exists && shouldGenerateSFC(relativePath, content)) {
        const generated = generateSFC(relativePath, content, generateOptions);

        if (!generateOptions.dryRun) {
          // 实际写入文件
          const updatedContent = await insertSFCCard(absolutePath, content, generated.content);
          await fs.writeFile(absolutePath, updatedContent, "utf8");

          // 重新解析文件以获取更新后的信息
          const updatedParsed = parseFileContent(updatedContent);
          fileEntry.sfc = updatedParsed.sfc;
          fileEntry.sha256 = sha256(updatedContent);
        }

        generatedSFC = true;
        shouldGenerate = true;
      }

      if (shouldGenerate) {
        fileEntry.generated = { sfc: generatedSFC };
        generatedFiles.push(relativePath);
        generatedCount++;
      }
    }

    files.push(fileEntry);
  }

  files.sort((a, b) => a.path.localeCompare(b.path));

  const response: ScanResponse = { files };

  if (request.autoGenerate) {
    response.generated = {
      count: generatedCount,
      files: generatedFiles,
      dryRun: request.generateOptions?.dryRun || false
    };
  }

  return response;
}

/**
 * 在文件开头插入 SFC 卡片
 */
async function insertSFCCard(filePath: string, content: string, sfcContent: string): Promise<string> {
  const extension = path.extname(filePath);
  let formattedSFC: string;

  // 根据文件类型选择注释风格
  if (['.ts', '.tsx', '.js', '.jsx'].includes(extension)) {
    formattedSFC = `/*\n${sfcContent}\n*/\n\n`;
  } else if (['.py'].includes(extension)) {
    formattedSFC = `# ${sfcContent.replace(/\n/g, '\n# ')}\n\n`;
  } else if (['.html', '.md'].includes(extension)) {
    formattedSFC = `<!--\n${sfcContent}\n-->\n\n`;
  } else {
    // 默认使用 /* */ 风格
    formattedSFC = `/*\n${sfcContent}\n*/\n\n`;
  }

  return formattedSFC + content;
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
