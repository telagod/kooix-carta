import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export type CartaErrorCode =
  | "BOUNDARY_NOT_FOUND"
  | "STALE_BLOCK"
  | "OUT_OF_BOUND_WRITE"
  | "READ_ONLY_MODE";

export function cartaError(code: CartaErrorCode, message: string, data?: Record<string, unknown>): McpError {
  return new McpError(ErrorCode.InvalidParams, message, { code, ...data });
}

export function internalError(message: string, data?: Record<string, unknown>): McpError {
  return new McpError(ErrorCode.InternalError, message, data);
}

export function invalidParams(message: string, data?: Record<string, unknown>): McpError {
  return new McpError(ErrorCode.InvalidParams, message, data);
}
