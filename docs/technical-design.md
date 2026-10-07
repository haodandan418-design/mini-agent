# Mini Agent Runtime 技术设计

## 1. 设计边界

- TypeScript `strict`，包之间通过稳定类型和端口协作；
- `packages/protocol` 定义公共事实模型，SSE/WebSocket/CLI 只是 Adapter；
- `packages/agent-core` 不依赖具体 Provider SDK、React、HTTP 或数据库；
- `packages/llm` 负责 Provider、模型类型和流式适配，不执行 Tool；
- `packages/tools` 负责 Tool discovery/execution 和 workspace 边界；
- 当前只做 SDD 校准，不创建目标包空壳或业务实现。

## 2. 公共协议类型（`packages/protocol`）

```typescript
type Id<T extends string> = string & { readonly __brand: T };

type SessionId = Id<"session">;
type RunId = Id<"run">;
type TurnId = Id<"turn">;
type ToolCallId = Id<"tool-call">;
type EventId = Id<"event">;
type MessageId = Id<"message">;

type Role = "system" | "user" | "assistant" | "tool";

interface Message {
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

interface ToolCall {
  id: ToolCallId;
  name: string;
  input: unknown;
}

interface ToolResult {
  toolCallId: ToolCallId;
  ok: boolean;
  content: string;
  data?: unknown;
  error?: { code: string; message: string; retryable: boolean };
  truncated?: boolean;
}
```

`AgentDecision` 是 agent-core/decision 的领域类型，不是任一模型 SDK 的返回值。`LLMResponse` 必须先经过 `DecisionNormalizer`，Agent Runtime 只消费 `AgentDecision`。

## 3. AgentEvent Protocol（`packages/protocol`）

```typescript
interface AgentEventBase {
  version: 1;
  eventId: EventId;
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  sequence: number;
  occurredAt: string;
}

type AgentEvent =
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
```

Runtime 生成 AgentEvent，Event Emitter 负责发布，Transport Adapter 负责编码。SSE 使用 `event: agent_event`、`id: eventId`、`data: JSON`；客户端以 `eventId/sequence` 去重和检测缺口。WebSocket 和 CLI 复用同一 payload，不重新定义事件。

## 4. LLM Port（`packages/llm`）

```typescript
interface ModelRequest {
  messages: Message[];
  tools: ToolDefinition[];
  model: string;
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  signal: AbortSignal;
}

interface LLMResponse {
  message?: Message;
  provider: string;
  finishReason: "stop" | "tool_calls" | "length" | "error";
  providerToolCalls?: Array<{ id: string; name: string; input: unknown }>;
  usage?: { inputTokens?: number; outputTokens?: number };
  providerRequestId?: string;
}

interface LLMStreamChunk {
  kind: "text_delta" | "tool_call_delta" | "completed";
  content?: string;
  providerToolCallId?: string;
}

interface LLMProvider {
  chat(request: ModelRequest): Promise<LLMResponse>;
  stream?(request: ModelRequest): AsyncIterable<LLMStreamChunk>;
}
```

OpenAI、Anthropic 等 Adapter 只负责协议映射、认证、流式解析和错误归一化；不得调用 Tool，也不负责 Agent Decision。`LLMResponse` 交给 `packages/agent-core/src/decision/normalizer.ts` 处理。

## 5. Decision Layer（`packages/agent-core/src/decision`）

```typescript
interface AgentDecision {
  type: "final" | "tool_call";
  content?: string;
  calls?: ToolCall[];
}

interface DecisionNormalizer {
  normalize(response: LLMResponse): AgentDecision;
}

interface DecisionValidator {
  validate(decision: AgentDecision): void;
}
```

Normalizer 是 Agent Runtime 的领域边界：它把不同 Provider 的统一响应转换成 `final` 或 `tool_call` 两类内部 Decision，并校验 tool call id、名称、参数和互斥字段。它不执行 Tool，也不负责 Permission。

## 6. Tool Port（`packages/tools`）

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  risk: "read" | "write" | "execute" | "network";
}

interface ToolContext {
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  workspaceRoot: string;
  signal: AbortSignal;
}

interface Tool {
  definition: ToolDefinition;
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  getDefinitions(): ToolDefinition[];
}

interface ToolExecutor {
  execute(call: ToolCall, context: ToolContext): Promise<ToolResult>;
}
```

Registry 只负责 discovery；Executor 统一负责 schema、Permission hook、timeout、取消、异常、结果大小和 workspace 检查。具体 Tool 不能直接修改 AgentState 或发明新的 AgentEvent。

## 7. Agent Runtime（`packages/agent-core`）

```typescript
type AgentStatus =
  | "idle"
  | "thinking"
  | "tool_calling"
  | "waiting_for_user"
  | "completed"
  | "failed"
  | "cancelled";

interface AgentDefinition {
  id: string;
  name: string;
  instructions: string;
  model: string;
  tools: string[];
  skills?: string[];
  limits: {
    maxIterations: number;
    timeoutMs: number;
  };
  metadata?: Record<string, string>;
}

interface AgentState {
  sessionId: SessionId;
  runId: RunId;
  turnId: TurnId;
  status: AgentStatus;
  messages: Message[];
  toolHistory: ToolExecutionRecord[];
  iteration: number;
  version: number;
  updatedAt: string;
}

interface AgentContext {
  sessionId?: SessionId;
  workspaceRoot: string;
  signal?: AbortSignal;
  maxIterations?: number;
  metadata?: Record<string, string>;
}

interface AgentResult {
  runId: RunId;
  status: "completed" | "failed" | "cancelled";
  finalMessage?: Message;
  state: AgentState;
}

interface Agent {
  run(
    definition: AgentDefinition,
    input: string,
    context: AgentContext,
  ): Promise<AgentResult>;
  cancel(runId: RunId): void;
}

interface ContextBuilder {
  build(
    state: AgentState,
    definition: AgentDefinition,
    context: AgentContext,
  ): Message[];
}
```

Runtime Loop 固定为：`AgentDefinition + input -> Context -> LLMProvider -> LLMResponse -> DecisionNormalizer -> AgentDecision -> Tool Registry/Executor or final -> State/Event/Session`。Runtime 通过注入端口编排 Permission、Cancellation、Retry、Session 和 Hooks；这些横切能力不散落到 Provider 或 Tool 中。

目标源码边界：

```text
agent-core/src/
├── agent/        # agent.ts / agent-definition.ts / agent-loop.ts / agent-state.ts
├── decision/     # decision.ts / normalizer.ts
├── context/      # context-builder.ts / message-manager.ts
├── events/       # agent-event.ts / event-emitter.ts
├── permissions/  # permission-policy.ts / permission-manager.ts
└── index.ts
```

具体 Agent 不新增 Runtime 抽象，直接在应用层声明 Definition：

```typescript
const codeAnalysisAgent: AgentDefinition = {
  id: "code-analysis",
  name: "Code Analysis Agent",
  instructions:
    "分析当前 workspace 的代码结构，并基于工具结果生成可引用的分析报告。",
  model: "configured-model",
  tools: ["list-files", "read-file"],
  skills: ["file-analysis"],
  limits: {
    maxIterations: 20,
    timeoutMs: 60_000,
  },
};
```

该 Definition 计划位于 `apps/server/src/agents/code-analysis-agent.ts`。它只声明能力和约束，不直接调用 LLM、文件系统或 Tool；所有执行仍由 Agent Runtime 负责。

## 8. Orchestration Ports

```typescript
interface PermissionPolicy {
  evaluate(
    call: ToolCall,
    definition: ToolDefinition,
  ):
    | { kind: "allow" }
    | { kind: "deny"; reason: string }
    | { kind: "ask"; requestId: string; expiresAt: string };
}

interface RetryPolicy {
  shouldRetry(
    error: RuntimeError,
    attempt: number,
    risk: ToolDefinition["risk"],
  ): boolean;
}

interface SessionPort {
  checkpoint(state: AgentState, cursor: number): Promise<void>;
  load(runId: RunId): Promise<AgentState | undefined>;
}

interface HookPort {
  dispatch(event: HookEvent, state: AgentState): Promise<void>;
}
```

这些是 Core 的编排边界，不要求 Phase 1 实现持久化、复杂 Retry、Hook Runner 或 Resume。具体实现分别由 `packages/sessions`、`packages/hooks` 和后续 Production 阶段提供。

## 9. 初始内置工具边界

Phase 2 只实现：

- `list-files`：列出 workspace 内相对路径，限制 glob、depth 和 limit；
- `read-file`：按相对路径和行范围读取文本，限制字节、行数和二进制。

目标 `packages/tools/src/builtin/` 包含 `read-file`、`write-file`、`edit-file`、`list-files`、`search-files`、`bash`。Phase 2 只实现并注册 `list-files`、`read-file`；其余工具必须等待对应 Permission/Sandbox 边界。所有工具必须有 timeout、AbortSignal、结构化错误和结果大小上限；Workspace path 必须 canonicalize 后确认仍在 root 内。

## 10. Session / Resume 标识

Session 层必须保存 `sessionId`、`runId`、`turnId`、`toolCallId`、`eventId` 和事件 cursor。Tool 执行记录必须能区分 pending、started、completed、failed；Resume 只可重放已确认的事实，不能自动重复执行已完成或未确认的副作用 Tool Call。

## 11. 应用层与传输适配

```text
apps/web/src/
├── components/
├── features/chat|sessions|tools|trace/
├── hooks/
├── stores/
├── api/
└── main.tsx

apps/server/src/
├── routes/
├── controllers/
├── services/
├── agents/       # concrete AgentDefinition files
└── index.ts
```

Web 只消费 protocol AgentEvent；Server 负责 HTTP/SSE 路由和依赖装配。两者都不能复制 Agent Loop、Decision Normalizer 或 Tool Executor。

## 12. 错误与测试

基础错误码包括：`INVALID_INPUT`、`UNKNOWN_TOOL`、`SCHEMA_ERROR`、`WORKSPACE_VIOLATION`、`TOOL_FAILED`、`PROVIDER_FAILED`、`DECISION_INVALID`、`ITERATION_LIMIT`、`CANCELLED`、`RESUME_CONFLICT`。

- Unit：协议校验、Normalizer、状态转换、Registry/Executor、路径边界和事件序列；
- Integration：Runtime + 测试 Provider + 临时 workspace + 真实只读 Tool；
- Acceptance：通过 API/事件客户端完成多轮任务，验证状态、事件、错误和边界。

测试 Provider 只能存在于测试代码，不能成为生产响应或业务逻辑。
