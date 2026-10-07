# 001 Agent Core Tasks

- [ ] **CORE-001 定义 protocol 基础类型与 ID**
  - 输入：技术设计中的 Message、ToolCall、ToolResult、AgentEvent 和 ID 约定。
  - 输出：可序列化的公共类型、错误模型和校验边界。
  - 验收：缺失 session/run/turn/tool/event ID 或非法 Decision 能被拒绝。

- [ ] **CORE-002 定义 LLM Provider Port**
  - 输入：ModelRequest、LLMResponse、LLMStreamChunk 约定。
  - 输出：Provider 接口及模型错误归一化边界。
  - 验收：stop、tool_calls、length、error 都能表达，接口不包含 Tool 执行方法。

- [ ] **CORE-003 实现 agent-core/decision/Decision Normalizer**
  - 输入：Provider-neutral LLMResponse 和 provider tool-call 数据。
  - 输出：`agent-core/decision` 产生的 AgentDecision 或 `DECISION_INVALID`。
  - 验收：final/tool_call 两类 Decision 可生成，空 calls、重复 ID 和冲突字段被拒绝。

- [ ] **CORE-004 实现 ContextBuilder**
  - 输入：AgentState、AgentContext 和 user input。
  - 输出：按顺序组装且不修改原 State 的 Message 数组。
  - 验收：system/user/assistant/tool 顺序稳定，所有消息含 session/run/turn/message ID。

- [ ] **CORE-004A 定义 AgentDefinition**
  - 输入：技术设计中的 AgentDefinition 字段和 Runtime 入口。
  - 输出：`agent/agent-definition.ts` 类型及定义校验。
  - 验收：缺少 id/instructions/model/tools/limits 或超出预算的 Definition 被拒绝。

- [ ] **CORE-005 实现 Agent 状态转换**
  - 输入：当前状态和 Core 领域事件。
  - 输出：下一状态或结构化错误。
  - 验收：终态不可逆，cancel/error/iteration-limit 优先级符合 Spec。

- [ ] **CORE-006 定义 orchestration ports**
  - 输入：Permission、Retry、Session、Hooks 的职责边界。
  - 输出：Core 可注入的最小接口。
  - 验收：Core 只依赖接口，不引入数据库、SSE、具体策略或 Hook 实现。

- [ ] **CORE-007 实现 Agent Loop 与 EventEmitter**
  - 输入：用户输入、Provider、Normalizer、Context、预算。
  - 输出：AgentResult、AgentState 和 canonical AgentEvent。
  - 验收：stop/tool-call/error/cancel/max-iteration 均符合状态、事件和无副作用要求。

- [ ] **CORE-008 编写 Core Unit Tests**
  - 输入：协议、Normalizer、状态和上下文行为。
  - 输出：行为/错误/边界测试。
  - 验收：覆盖空响应、非法 Decision、ID、取消 race、maxIterations 和并发隔离。

- [ ] **CORE-009 编写 Core Integration Test**
  - 输入：AgentRunner、确定性 Provider 和 Normalizer。
  - 输出：多轮 Decision 测试。
  - 验收：测试验证消息顺序、iteration、终态、事件序列和错误码，而非只验证调用次数。

- [ ] **CORE-010 执行 Core Acceptance Test**
  - 输入：代表性用户问题和预设模型响应。
  - 输出：验收记录。
  - 验收：从 run.started 到 completed/failed/cancelled 的完整链路可复现，且没有真实 Tool 执行。

- [ ] **CORE-011 验证 Definition 驱动的 Runtime 入口**
  - 输入：最小 Code Analysis Agent Definition、用户输入和测试 Provider。
  - 输出：隔离的 AgentResult 和 State。
  - 验收：Runtime 使用 Definition 的 instructions/tools/limits，且不要求创建第二套 Agent Loop。
