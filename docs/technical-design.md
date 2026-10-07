# Mini Agent Runtime 技术设计

## 1. 设计约束

- TypeScript `strict`，领域类型优先；
- Node.js 负责 Runtime/API，React 负责展示；
- 核心模块依赖端口，不依赖具体 LLM SDK 或 Web 框架；
- 每次 Run 有预算：最大迭代、超时、结果大小和取消信号；
- 事件是不可变事实，传输层可重放但不可重写；
- V1 只读工具真实访问 workspace，不使用 hardcode/fake response。

## 2. 核心类型

```typescript
type AgentStatus =
  | "idle"
  | "thinking"
  | "tool_calling"
  | "waiting_for_user"
  | "completed"
  | "failed"
  | "cancelled";

type Role = "system" | "user" | "assistant" | "tool";

interface Message {
  id: string;
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  createdAt: string;
}

interface ToolCall {
  id: string;
  name: string;
  input: unknown;
}

interface AgentState {
  sessionId: string;
  runId: string;
  status: AgentStatus;
  messages: Message[];
  toolHistory: ToolExecutionRecord[];
  iteration: number;
  version: number;
  updatedAt: string;
}
```

相较于初始接口，`runId/version/toolHistory` 被显式加入：同一 Session 可有多个 Run，事件需要幂等游标，工具历史是 Resume 和审计的最小依据。`messages` 仍属于状态快照，但只能由 Runtime 通过受控操作追加。

## 3. LLM Port

```typescript
interface LLMProvider {
  chat(request: LLMRequest, signal?: AbortSignal): Promise<LLMResponse>;
}

interface LLMRequest {
  messages: Message[];
  tools: ToolDefinition[];
  temperature?: number;
  metadata: { sessionId: string; runId: string; iteration: number };
}

interface LLMResponse {
  message: Message;
  toolCalls: ToolCall[];
  finishReason: "stop" | "tool_calls" | "length" | "error";
  usage?: { inputTokens?: number; outputTokens?: number };
  providerRequestId?: string;
}
```

初始的 `chat(messages, tools?)` 改为 request object，以便传递取消信号、运行元数据和未来流式扩展；Provider 仍可由 Adapter 包装成该端口。

## 4. Tool Port

```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  risk: "read" | "write" | "execute" | "network";
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

interface ToolContext {
  sessionId: string;
  runId: string;
  workspaceRoot: string;
  signal: AbortSignal;
  emit(event: AgentEvent): void;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

interface ToolResult {
  ok: boolean;
  content: string;
  data?: unknown;
  error?: { code: string; message: string; retryable: boolean };
  truncated?: boolean;
}
```

`risk` 让权限策略不必解析工具实现；`ToolResult` 统一成功和失败，避免工具异常直接破坏 Agent Loop。

## 5. Registry 与 Executor

```typescript
interface ToolRegistry {
  register(tool: Tool): void;
  get(name: string): Tool | undefined;
  getDefinitions(): ToolDefinition[];
}

interface ToolExecutor {
  execute(call: ToolCall, context: ToolContext): Promise<ToolExecutionRecord>;
}

interface ToolExecutionRecord {
  toolCallId: string;
  toolName: string;
  input: unknown;
  result: ToolResult;
  startedAt: string;
  finishedAt: string;
}
```

Executor 负责未知工具、schema 错误、权限拒绝、超时、异常和结果截断的统一处理；Registry 只负责注册和发现，不承担执行。

## 6. Agent Port 与 Context

```typescript
interface Agent {
  run(input: string, context?: AgentContext): Promise<AgentResult>;
  cancel(runId: string): void;
}

interface AgentContext {
  sessionId?: string;
  workspaceRoot: string;
  signal?: AbortSignal;
  maxIterations?: number;
  metadata?: Record<string, string>;
}

interface AgentResult {
  runId: string;
  status: "completed" | "failed" | "cancelled";
  finalMessage?: Message;
  state: AgentState;
}

interface ContextBuilder {
  build(state: AgentState, request: AgentContext): Message[];
}
```

Agent 仍提供用户友好的 `run(input, context?)`，内部使用 Run Context 和快照。ContextBuilder 是独立端口，便于以后接入压缩、Skill 或子 Agent，而不把上下文拼装散落在 Loop 中。

## 7. Agent Event Protocol

```typescript
type AgentEvent =
  | { version: 1; type: "run_start"; eventId: string; runId: string; sequence: number }
  | { version: 1; type: "state_change"; eventId: string; runId: string; sequence: number; status: AgentStatus }
  | { version: 1; type: "message_start"; eventId: string; runId: string; sequence: number; messageId: string }
  | { version: 1; type: "text_delta"; eventId: string; runId: string; sequence: number; messageId: string; content: string }
  | { version: 1; type: "tool_call_start"; eventId: string; runId: string; sequence: number; toolCallId: string; toolName: string; input: unknown }
  | { version: 1; type: "tool_result"; eventId: string; runId: string; sequence: number; toolCallId: string; result: ToolResult }
  | { version: 1; type: "permission_required"; eventId: string; runId: string; sequence: number; toolCallId: string; toolName: string; input: unknown }
  | { version: 1; type: "message_end"; eventId: string; runId: string; sequence: number; messageId: string }
  | { version: 1; type: "run_end"; eventId: string; runId: string; sequence: number; status: "completed" | "failed" | "cancelled" }
  | { version: 1; type: "error"; eventId: string; runId: string; sequence: number; code: string; message: string; retryable: boolean };
```

统一协议的原因是让 Runtime、SSE、React、日志和未来 WebSocket 共享同一事实模型。每个事件带 `eventId` 和单调 `sequence`：客户端按 `sequence` 去重并检测缺口，服务端可由 `Last-Event-ID` 或 run cursor 重放。SSE 使用 `event: agent_event`、`id: eventId`、`data: JSON`，断线后重新连接时只补发缺失事件；如果事件不可恢复，客户端显示 reconnect error，不自行伪造状态。WebSocket 只需复用 JSON payload 和订阅语义。

## 8. Permission Port（Phase 4）

```typescript
interface PermissionPolicy {
  evaluate(call: ToolCall, tool: Tool, context: PermissionContext): PermissionDecision;
}

type PermissionDecision =
  | { kind: "allow" }
  | { kind: "deny"; reason: string }
  | { kind: "ask"; requestId: string; expiresAt: string };
```

`ask` 会让 Runtime 持久化 pending call 并进入 `waiting_for_user`，批准后只执行同一个经过校验的 call；拒绝、过期或取消都生成明确结果。

## 9. 本地工具契约

- `list_files`：输入 root/glob/depth/limit，输出相对路径，禁止越出 workspace；
- `read_file`：输入相对 path、startLine/endLine，输出带行号内容，限制文件大小和行数；
- `search_files`：输入 query/glob/limit，输出文件、行号和匹配片段，禁止执行 shell。

三者只读、可取消、有结果大小上限，并对二进制、不可读、路径越界和不存在文件返回结构化错误。

## 10. 错误模型

错误按来源区分：`INVALID_INPUT`、`UNKNOWN_TOOL`、`SCHEMA_ERROR`、`WORKSPACE_VIOLATION`、`TOOL_FAILED`、`PROVIDER_FAILED`、`ITERATION_LIMIT`、`CANCELLED`、`STREAM_DISCONNECTED`。只有标记 `retryable` 的 Provider/网络类错误允许后续 Retry Spec 处理；参数错误和权限拒绝不可盲目重试。

## 11. 测试策略

- Unit：状态转换、Context 组装、Provider 归一化、Registry/Executor、路径边界和事件序列；
- Integration：Runtime + fake Provider（仅作为测试替身）+ 真实临时 workspace + 真实本地工具；
- Acceptance：通过 API/SSE 执行用户任务，验证可见事件序列、最终答案和失败边界。

测试替身只存在于测试目录，不能成为生产响应或业务逻辑。
