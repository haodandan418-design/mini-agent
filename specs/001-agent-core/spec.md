# 001 Agent Core Spec

## Why

Agent 的核心不是一次 Chat 请求，而是可停止、可取消、可恢复推理的状态循环。本 Spec 先固定 Message、LLM Port、Context、AgentState 和 Loop，使后续工具与传输层有稳定依赖。

## What

实现一个由 `LLMProvider` 驱动的 Agent Core：接收用户输入，构造消息，调用模型，识别最终文本或 Tool Call Decision，更新状态并在预算内继续循环。Phase 1 不执行真实工具，只暴露工具调用决策给 Tool System。

## Scope

- Message、ToolCall、LLMRequest/Response、AgentState、AgentResult；
- ContextBuilder 的最小实现；
- Agent 状态机和最大迭代、取消、Provider 错误处理；
- 内存状态存储和可订阅的内部事件接口；
- Unit、Integration、Acceptance 测试基础。

## Non-goals

- 不实现真实文件、写入、命令或 MCP 工具；
- 不实现 SSE、React UI、Permission、Session Resume；
- 不实现上下文压缩或自主重试；
- 不绑定某一家 LLM SDK。

## Functional Requirements

1. 输入字符串会形成一个 user Message 并进入 Context。
2. Provider 返回 final text 时 Run 进入 `completed` 并返回最终 Message。
3. Provider 返回 Tool Call 时记录 assistant Message、递增 iteration，并将决策交给后续 Tool System 适配点。
4. Provider 错误、非法响应和达到最大迭代次数会进入 `failed`，有稳定错误码。
5. AbortSignal 触发后 Run 进入 `cancelled`，不可再调用 Provider。
6. 每次状态变化都可被测试观察，状态不会从终态回到运行态。

## Technical Requirements

- 使用 `strict` TypeScript 和不可变事件字段；
- `LLMProvider` 接收 request object、run metadata 和 AbortSignal；
- 默认最大迭代次数为有限值且可配置；
- ContextBuilder 不得修改原始 State；
- Provider Adapter 的错误必须归一化为 Runtime 错误模型。

## Acceptance Criteria

- 给定 stop response，返回 completed、最终文本和 iteration=1；
- 给定连续 tool-call response，按预期递增 iteration，达到上限后返回 `ITERATION_LIMIT`；
- Provider 抛错和返回非法 tool call 时返回 failed，而不是未处理异常；
- Abort 在 Provider 调用前和调用中均能得到 cancelled；
- 状态和消息顺序与定义一致，终态不可继续 Loop。

## Edge Cases

- 空输入或超长输入；
- Provider 返回空文本且无 tool call；
- Tool Call 缺少 id/name/input 或重复 id；
- Provider 超时、Abort 和同步抛错；
- `maxIterations=0/1`；
- 同一 Agent 实例并发 Run 的隔离。

## Tests

- Unit：状态转换、ContextBuilder、响应校验、迭代预算、取消和错误映射；
- Integration：Runtime + 确定性测试 Provider，覆盖 stop、连续决策和失败；
- Acceptance：以用户问题启动 Run，验证最终 AgentResult、状态快照和事件序列。
