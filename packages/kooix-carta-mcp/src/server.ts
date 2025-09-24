import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListRootsRequestSchema,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../package.json" with { type: "json" };
import { appendRead } from "./readlog.js";
import { applyPatch } from "./patch.js";
import { scanRepo, getCards } from "./scan.js";
import { internalError, invalidParams } from "./errors.js";
import { ApplyPatchRequest, AppendReadLogRequest, ScanRequest, ServerOptions } from "./types.js";

const TOOL_DEFINITIONS = [
  {
    name: "cards.scan",
    description: "Scan for @SFC/@DFC headers and LLM-EDIT blocks with optional auto-generation",
    inputSchema: {
      type: "object",
      properties: {
        root: { type: "string", description: "Optional path relative to server root" },
        include: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns to include",
        },
        exclude: {
          type: "array",
          items: { type: "string" },
          description: "Additional glob patterns to exclude",
        },
        autoGenerate: { type: "boolean", description: "Automatically generate missing SFC/DFC cards" },
        generateOptions: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: ["minimal", "detailed"],
              description: "Template style for generated cards"
            },
            inferFromPath: { type: "boolean", description: "Infer card properties from file path" },
            inferFromContent: { type: "boolean", description: "Infer card properties from file content" },
            dryRun: { type: "boolean", description: "Preview generation without writing files" }
          },
          description: "Options for auto-generation"
        }
      },
    },
  },
  {
    name: "cards.get",
    description: "Read a single file and return SFC/DFC card blocks",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to server root" },
      },
      required: ["path"],
    },
  },
  {
    name: "edits.apply",
    description: "Replace the body of an LLM-EDIT block with optimistic hash check",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Target file path relative to server root" },
        blockId: { type: "string", description: "LLM-EDIT block identifier" },
        oldHash: { type: "string", description: "Current block hash" },
        newContent: { type: "string", description: "Replacement content" },
        reason: { type: "string", description: "Optional human-readable reason" },
      },
      required: ["file", "blockId", "oldHash", "newContent"],
    },
  },
  {
    name: "io.readlog.append",
    description: "Append a read event to the audit log",
    inputSchema: {
      type: "object",
      properties: {
        runId: { type: "string", description: "Run identifier from the client" },
        path: { type: "string", description: "Read file path" },
        sha256: { type: "string", description: "File hash that was read" },
      },
      required: ["runId", "path", "sha256"],
    },
  },
] as const;

type ToolName = (typeof TOOL_DEFINITIONS)[number]["name"];

interface CallToolRequest {
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

interface CartaContext extends ServerOptions {
  root: string;
}

function ensureString(value: unknown, field: string): string {
  if (typeof value === "string") {
    return value;
  }
  throw invalidParams(`Expected string for ${field}`);
}

function ensureOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  throw invalidParams(`Expected boolean for ${field}`);
}

function ensureOptionalObject(value: unknown, field: string): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw invalidParams(`Expected object for ${field}`);
}

function ensureOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  throw invalidParams(`Expected string for ${field}`);
}

function ensureStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw invalidParams(`Expected array for ${field}`);
  }
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      throw invalidParams(`Expected ${field} to contain only strings`);
    }
    result.push(item);
  }
  return result;
}

function toToolResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    toolResult: data,
  };
}

async function handleTool(name: ToolName, args: Record<string, unknown> | undefined, context: CartaContext) {
  switch (name) {
    case "cards.scan": {
      const generateOptions = ensureOptionalObject(args?.generateOptions, "generateOptions");

      const request: ScanRequest = {
        root: ensureOptionalString(args?.root, "root"),
        include: ensureStringArray(args?.include, "include"),
        exclude: ensureStringArray(args?.exclude, "exclude"),
        autoGenerate: ensureOptionalBoolean(args?.autoGenerate, "autoGenerate"),
        generateOptions: generateOptions ? {
          template: ensureOptionalString(generateOptions.template, "generateOptions.template") as 'minimal' | 'detailed' | undefined,
          inferFromPath: ensureOptionalBoolean(generateOptions.inferFromPath, "generateOptions.inferFromPath"),
          inferFromContent: ensureOptionalBoolean(generateOptions.inferFromContent, "generateOptions.inferFromContent"),
          dryRun: ensureOptionalBoolean(generateOptions.dryRun, "generateOptions.dryRun")
        } : undefined
      };
      const result = await scanRepo(context.root, request);
      return toToolResponse(result);
    }
    case "cards.get": {
      const pathArg = ensureString(args?.path, "path");
      const result = await getCards(context.root, pathArg);
      return toToolResponse(result);
    }
    case "edits.apply": {
      const request: ApplyPatchRequest = {
        file: ensureString(args?.file, "file"),
        blockId: ensureString(args?.blockId, "blockId"),
        oldHash: ensureString(args?.oldHash, "oldHash"),
        newContent: ensureString(args?.newContent, "newContent"),
        reason: ensureOptionalString(args?.reason, "reason"),
      };
      const result = await applyPatch(context.root, context.readOnly, request);
      return toToolResponse(result);
    }
    case "io.readlog.append": {
      const request: AppendReadLogRequest = {
        runId: ensureString(args?.runId, "runId"),
        path: ensureString(args?.path, "path"),
        sha256: ensureString(args?.sha256, "sha256"),
      };
      const result = await appendRead(context.root, context.auditMode, request);
      return toToolResponse(result);
    }
    default: {
      throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`);
    }
  }
}

function createRootResponse(context: CartaContext) {
  const uri = pathToFileURL(context.root).href;
  return {
    roots: [
      {
        uri,
        name: "workspace",
      },
    ],
  };
}

export function createCartaServer(options: ServerOptions) {
  const context: CartaContext = {
    ...options,
    root: path.resolve(options.root),
  };

  const server = new McpServer({
    name: pkg.name ?? "@kooix/carta-mcp",
    version: pkg.version ?? "0.0.0",
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }));

  server.setRequestHandler(ListRootsRequestSchema, async () => createRootResponse(context));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    try {
      const toolName = request.params.name as ToolName;
      if (!TOOL_DEFINITIONS.some((tool) => tool.name === toolName)) {
        throw new McpError(ErrorCode.InvalidParams, `Unsupported tool: ${toolName}`);
      }
      return await handleTool(toolName, request.params.arguments ?? {}, context);
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      console.error("[carta-mcp] unhandled error", error);
      throw internalError("Unhandled server error", {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return server;
}

export async function startServer(options: ServerOptions): Promise<void> {
  const server = createCartaServer(options);
  const transport = new StdioServerTransport();

  server.onerror = (error: unknown) => {
    console.error("[carta-mcp]", error);
  };

  server.onclose = () => {
    process.exit(0);
  };

  await server.connect(transport);

  const shutdown = async () => {
    await server.close();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}




