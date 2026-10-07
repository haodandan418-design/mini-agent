# 001 Agent Core Tasks

- [ ] **CORE-001 定义领域类型**
  - 输入：技术设计中的 Message、ToolCall、状态和错误模型。
  - 输出：严格类型与序列化边界。
  - 验收：非法状态和缺少必要字段在类型或运行时校验层被拒绝。

- [ ] **CORE-002 定义 LLMProvider Port**
  - 输入：LLMRequest/LLMResponse 约定。
  - 输出：Provider 接口及 response normalizer。
  - 验收：stop、tool_calls、length、error 四类 finish reason 能归一化。

- [ ] **CORE-003 实现 ContextBuilder**
  - 输入：AgentState 和 AgentContext。
  - 输出：不修改原 State 的 Message 数组。
  - 验收：system/user/assistant/tool 顺序稳定，metadata 不污染消息内容。

- [ ] **CORE-004 实现 Agent 状态转换**
  - 输入：当前状态和领域事件。
  - 输出：下一状态或结构化错误。
  - 验收：终态不可逆，非法转换有明确错误码。

- [ ] **CORE-005 实现 Agent Loop**
  - 输入：用户输入、Provider、Context、预算。
  - 输出：AgentResult 和最终 State。
  - 验收：停止、连续决策、最大迭代、Provider 错误和取消均符合 Spec。

- [ ] **CORE-006 编写 Core Unit Tests**
  - 输入：状态、上下文和响应校验行为。
  - 输出：行为/错误/边界测试。
  - 验收：覆盖空响应、重复 tool call id、maxIterations 边界和并发隔离。

- [ ] **CORE-007 编写 Core Integration Test**
  - 输入：AgentRunner 与确定性测试 Provider。
  - 输出：多轮决策测试。
  - 验收：测试能验证消息顺序、iteration、终态和错误码，而非只验证调用次数。

- [ ] **CORE-008 执行 Core Acceptance Test**
  - 输入：代表性用户问题和预设 Provider 决策。
  - 输出：验收记录。
  - 验收：从 run 开始到 completed/failed/cancelled 的完整状态链可复现。
