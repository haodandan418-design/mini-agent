import type {
  MessageId,
  RunId,
  SessionId,
  ToolCallId,
  TurnId,
} from "@mini-agent/shared";
import type { ToolCall } from "./tool-calls.ts";

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  id: MessageId;
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: ToolCallId;
  createdAt: string;
}
