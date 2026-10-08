import type { ToolCallId } from "@mini-agent/shared";
import type { JsonSchema, JsonValue } from "./schemas.ts";

export interface ToolCall {
  id: ToolCallId;
  name: string;
  input: JsonValue;
}

export interface ToolError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ToolResult {
  toolCallId: ToolCallId;
  ok: boolean;
  content: string;
  data?: JsonValue;
  error?: ToolError;
  truncated?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  risk: "read" | "write" | "execute" | "network";
}
