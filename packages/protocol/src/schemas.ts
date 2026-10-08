import {
  isNonEmptyString,
  type EventId,
  type MessageId,
  type RunId,
  type SessionId,
  type ToolCallId,
  type TurnId,
} from "@mini-agent/shared";
import { protocolError } from "./errors.ts";
import type { AgentEvent } from "./events.ts";
import type { Message } from "./messages.ts";
import type { ToolCall, ToolResult } from "./tool-calls.ts";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface JsonSchema {
  type?:
    "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  description?: string;
}

type RecordValue = Record<string, unknown>;

const roles = new Set(["system", "user", "assistant", "tool"]);

function assertJsonValue(value: unknown, field: string): void {
  if (value === null) {
    return;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return;
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return;
    }
    throw protocolError(
      "INVALID_PROTOCOL_VALUE",
      `${field} must contain finite numbers`,
      field,
    );
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      assertJsonValue(item, field);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertJsonValue(item, `${field}.${key}`);
    }
    return;
  }
  throw protocolError(
    "INVALID_PROTOCOL_TYPE",
    `${field} must be JSON-serializable`,
    field,
  );
}

function asRecord(value: unknown, label: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw protocolError("INVALID_PROTOCOL_TYPE", `${label} must be an object`);
  }
  return value as RecordValue;
}

function requireString(value: unknown, field: string): string {
  if (!isNonEmptyString(value)) {
    throw protocolError(
      "INVALID_PROTOCOL_ID",
      `${field} must be a non-empty string`,
      field,
    );
  }
  return value;
}

function requireField(value: RecordValue, field: string): unknown {
  if (!(field in value)) {
    throw protocolError(
      "MISSING_PROTOCOL_FIELD",
      `${field} is required`,
      field,
    );
  }
  return value[field];
}

function assertBaseIds(value: RecordValue, fields: string[]): void {
  for (const field of fields) {
    requireString(requireField(value, field), field);
  }
}

export function assertMessage(value: unknown): asserts value is Message {
  const message = asRecord(value, "Message");
  assertBaseIds(message, ["id", "sessionId", "runId", "turnId"]);
  const role = requireString(requireField(message, "role"), "role");
  if (!roles.has(role)) {
    throw protocolError(
      "INVALID_PROTOCOL_VALUE",
      `unsupported message role: ${role}`,
      "role",
    );
  }
  requireString(requireField(message, "content"), "content");
  if (message.toolCalls !== undefined) {
    if (!Array.isArray(message.toolCalls)) {
      throw protocolError(
        "INVALID_PROTOCOL_TYPE",
        "toolCalls must be an array",
        "toolCalls",
      );
    }
    for (const toolCall of message.toolCalls) {
      assertToolCall(toolCall);
    }
  }
  if (message.toolCallId !== undefined) {
    requireString(message.toolCallId, "toolCallId");
  }
  requireString(requireField(message, "createdAt"), "createdAt");
}

export function assertToolCall(value: unknown): asserts value is ToolCall {
  const call = asRecord(value, "ToolCall");
  assertBaseIds(call, ["id"]);
  requireString(requireField(call, "name"), "name");
  assertJsonValue(requireField(call, "input"), "input");
}

export function assertToolResult(value: unknown): asserts value is ToolResult {
  const result = asRecord(value, "ToolResult");
  assertBaseIds(result, ["toolCallId"]);
  if (typeof result.ok !== "boolean") {
    throw protocolError("INVALID_PROTOCOL_TYPE", "ok must be a boolean", "ok");
  }
  requireString(requireField(result, "content"), "content");
  if (result.data !== undefined) {
    assertJsonValue(result.data, "data");
  }
  if (result.truncated !== undefined && typeof result.truncated !== "boolean") {
    throw protocolError(
      "INVALID_PROTOCOL_TYPE",
      "truncated must be a boolean",
      "truncated",
    );
  }
  if (result.error !== undefined) {
    const error = asRecord(result.error, "ToolResult.error");
    requireString(requireField(error, "code"), "error.code");
    requireString(requireField(error, "message"), "error.message");
    if (typeof error.retryable !== "boolean") {
      throw protocolError(
        "INVALID_PROTOCOL_TYPE",
        "error.retryable must be a boolean",
        "error.retryable",
      );
    }
  }
}

export function assertAgentEvent(value: unknown): asserts value is AgentEvent {
  const event = asRecord(value, "AgentEvent");
  assertBaseIds(event, ["eventId", "sessionId", "runId", "turnId"]);
  if (typeof event.version !== "number" || event.version !== 1) {
    throw protocolError(
      "INVALID_PROTOCOL_VALUE",
      "version must be 1",
      "version",
    );
  }
  if (!Number.isInteger(event.sequence) || (event.sequence as number) < 0) {
    throw protocolError(
      "INVALID_PROTOCOL_VALUE",
      "sequence must be a non-negative integer",
      "sequence",
    );
  }
  requireString(requireField(event, "type"), "type");
  requireString(requireField(event, "occurredAt"), "occurredAt");

  switch (event.type) {
    case "message.delta":
    case "message.completed":
      requireString(requireField(event, "messageId"), "messageId");
      requireString(requireField(event, "content"), "content");
      return;
    case "tool.started":
      assertToolCall(requireField(event, "toolCall"));
      return;
    case "tool.completed":
      assertToolResult(requireField(event, "result"));
      return;
    case "permission.requested":
      assertToolCall(requireField(event, "toolCall"));
      requireString(requireField(event, "requestId"), "requestId");
      return;
    case "error":
      requireString(requireField(event, "code"), "code");
      requireString(requireField(event, "message"), "message");
      if (typeof event.retryable !== "boolean") {
        throw protocolError(
          "INVALID_PROTOCOL_TYPE",
          "retryable must be a boolean",
          "retryable",
        );
      }
      return;
    case "run.completed":
      requireString(requireField(event, "finalMessageId"), "finalMessageId");
      return;
    case "run.cancelled":
      requireString(requireField(event, "reason"), "reason");
      return;
    case "run.started":
      return;
    default:
      throw protocolError(
        "INVALID_PROTOCOL_VALUE",
        `unsupported event type: ${String(event.type)}`,
        "type",
      );
  }
}

export type ProtocolId =
  SessionId | RunId | TurnId | ToolCallId | EventId | MessageId;
