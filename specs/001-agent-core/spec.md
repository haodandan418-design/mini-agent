# 001 Agent Core Spec

## Why

Agent 的核心不是一次 Chat 请求，而是一个可停止、可取消、可验证的 Runtime Loop。本阶段必须先固定公共协议、模型响应归一化和 Agent 状态，后续 Tool、Streaming、Permission 和 Session 才能在稳定边界上演进。

## What

实现 `packages/protocol`、`packages/llm` 和 `packages/agent-core` 的最小 Core：接收用户输入，构造 Context，调用 `LLMProvider`，通过 `packages/agent-core/src/decision/normalizer.ts` 生成内部 `AgentDecision`，更新 State，并在 final、错误、取消或预算耗尽时结束。

## Scope

- protocol 中的 Message、ToolCall、ToolResult、AgentEvent 基础类型和唯一 ID；
- agent-core/decision 中的 AgentDecision、DecisionNormalizer 和 DecisionValidator；
- LLMProvider、LLMResponse Port；
- `agent-core/decision` 中的 AgentDecision、DecisionNormalizer 和 DecisionValidator；
- Agent、AgentState、ContextBuilder、Agent Loop；
- Cancellation、最大迭代、非法 Decision 和 Provider 错误收敛；
- Permission、Retry、Session、Hooks 的最小 orchestration port；
- Core 级 EventEmitter 和三层测试基础。

## Non-goals

- 不实现 OpenAI/Anthropic 具体 SDK Adapter；
- 不实现真实 Tool Executor、文件工具、MCP、Skills、SubAgents；
- 不实现 SSE、React、HTTP API、Session Persistence 或 Resume；
- 不实现生产级 Retry、Hook Runner、Sandbox 或上下文压缩；
- 不把测试 Provider 放入生产运行路径。

## Functional Requirements

1. 输入字符串形成带 session/run/turn/message ID 的 user Message。
2. Provider 返回 `LLMResponse` 后，Runtime 必须调用 `agent-core/decision/normalizer.ts`，不能直接读取 provider-specific 字段。
3. Normalizer 输出 final decision 时 Run 进入 `completed` 并返回最终 Message。
4. Normalizer 输出 tool-call decision 时记录 assistant Message 和 ToolCall，但本阶段不执行真实 Tool。
5. Provider 错误、非法 response、非法 decision 和达到最大迭代次数进入 `failed`，具有稳定错误码。
6. AbortSignal 在 Provider 调用前或调用中触发时，Run 进入 `cancelled`。
7. EventEmitter 能发布 run started、message delta/completed、error、run completed/cancelled 等 Core 事件。
8. Agent Core 只通过端口编排 Permission、Retry、Session 和 Hooks，不依赖它们的具体实现。

## Technical Requirements

- `LLMResponse -> agent-core/decision/DecisionNormalizer -> AgentDecision` 是不可绕过的边界；
- Agent Core 不依赖具体模型 SDK、React、HTTP、SSE 或数据库；
- 所有重要实体使用 sessionId、runId、turnId、messageId、toolCallId、eventId；
- 默认最大迭代次数有限，ContextBuilder 不修改原始 State；
- 状态终态不可回退，错误必须结构化并区分 retryable；
- EventEmitter 发布的 AgentEvent 使用 protocol 中的 canonical type。

## Acceptance Criteria

- 给定 stop response，LLMResponse 经 Normalizer 后返回 completed 和最终文本；
- 给定 tool-call response，能记录 AgentDecision 和状态，但没有 Tool 副作用；
- Provider 抛错、Normalizer 拒绝非法响应、空 decision 和迭代超限均返回结构化 failed；
- Abort 在调用前和调用中都能得到 cancelled；
- 事件含唯一 ID、run/turn 关联和单调 sequence；
- Core 可以替换 Provider 或 `agent-core/decision` 的 Normalizer，而不改 Agent Loop。

## Edge Cases

- 空输入、超长输入和缺失上下文 ID；
- Provider 返回空文本且无 tool call；
- provider tool call 缺少 id/name/input、重复 id 或未知字段；
- Normalizer 生成空 calls、final 与 tool_call 矛盾的 Decision；
- `maxIterations=0/1`、并发 Run 隔离、重复 cancel；
- Provider 超时、同步抛错和 Abort race。

## Tests

- Unit：协议校验、Normalizer、ContextBuilder、状态转换、预算、取消和错误映射；
- Integration：Runtime + 确定性测试 Provider + 测试 Normalizer，覆盖 stop/tool/error/cancel；
- Acceptance：以用户问题启动 Run，验证完整 Decision 链、状态快照、事件序列和无 Tool 副作用。
