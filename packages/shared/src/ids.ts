import { randomUUID } from "node:crypto";

export type BrandedId<Kind extends string> = string & {
  readonly __brand: Kind;
};

export type SessionId = BrandedId<"session">;
export type RunId = BrandedId<"run">;
export type TurnId = BrandedId<"turn">;
export type ToolCallId = BrandedId<"tool-call">;
export type EventId = BrandedId<"event">;
export type MessageId = BrandedId<"message">;

export type IdKind =
  "session" | "run" | "turn" | "tool-call" | "event" | "message";

export function createId<Kind extends IdKind>(kind: Kind): BrandedId<Kind> {
  return `${kind}_${randomUUID()}` as BrandedId<Kind>;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
