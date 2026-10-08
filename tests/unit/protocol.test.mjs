import assert from "node:assert/strict";
import test from "node:test";

const protocol = await import("../../packages/protocol/src/index.ts");
const shared = await import("../../packages/shared/src/index.ts");

test("protocol creates branded IDs and validates a complete message", () => {
  const message = {
    id: shared.createId("message"),
    sessionId: shared.createId("session"),
    runId: shared.createId("run"),
    turnId: shared.createId("turn"),
    role: "user",
    content: "inspect the workspace",
    createdAt: new Date().toISOString(),
  };

  assert.doesNotThrow(() => protocol.assertMessage(message));
});

test("protocol rejects missing tool call input", () => {
  const call = {
    id: shared.createId("tool-call"),
    name: "list-files",
  };

  assert.throws(
    () => protocol.assertToolCall(call),
    protocol.ProtocolValidationError,
  );
});

test("protocol rejects an event with an invalid sequence", () => {
  const event = {
    version: 1,
    eventId: shared.createId("event"),
    sessionId: shared.createId("session"),
    runId: shared.createId("run"),
    turnId: shared.createId("turn"),
    sequence: -1,
    occurredAt: new Date().toISOString(),
    type: "run.started",
  };

  assert.throws(
    () => protocol.assertAgentEvent(event),
    protocol.ProtocolValidationError,
  );
});
