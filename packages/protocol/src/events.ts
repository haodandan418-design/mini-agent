import type {
  EventId,
  MessageId,
  RunId,
  SessionId,
  TurnId,
} from "@mini-agent/shared";
import type { ToolCall, ToolResult } from "./tool-calls.ts";

export interface AgentEventBase {
  version: 1;
  eventId: EventId;
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  sequence: number;
  occurredAt: string;
}

export type AgentEvent =
  | (AgentEventBase & { type: "run.started" })
  | (AgentEventBase & {
      type: "message.delta";
      messageId: MessageId;
      content: string;
    })
  | (AgentEventBase & {
      type: "message.completed";
      messageId: MessageId;
      content: string;
    })
  | (AgentEventBase & { type: "tool.started"; toolCall: ToolCall })
  | (AgentEventBase & { type: "tool.completed"; result: ToolResult })
  | (AgentEventBase & {
      type: "permission.requested";
      toolCall: ToolCall;
      requestId: string;
    })
  | (AgentEventBase & {
      type: "error";
      code: string;
      message: string;
      retryable: boolean;
    })
  | (AgentEventBase & { type: "run.completed"; finalMessageId: MessageId })
  | (AgentEventBase & { type: "run.cancelled"; reason: string });
