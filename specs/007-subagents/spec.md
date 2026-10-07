# 007 SubAgents Spec

## Why

复杂任务需要把研究、实现和审查拆给专门 Agent，但委派会引入上下文隔离、预算、取消和结果信任问题。SubAgent 必须是受控的 Runtime 子任务，而不是无限递归的第二个主循环。

## What

实现 SubAgentDefinition、Delegation Tool/Runner、隔离 Context、生命周期事件和结构化结果汇总。

## Scope

- Research/Review 等角色定义；
- 父 Agent 委派、子 Agent 创建和最大深度；
- 子上下文和 Tool allowlist；
- 父子预算、取消、失败和超时传播；
- 结果引用、汇总和 Trace 关联。

## Non-goals

- 不实现无限递归、自主创建任意 Agent 或共享可变消息；
- 不实现分布式队列和跨机器调度；
- 不让子 Agent 绕过父 Agent Permission；
- 不保证并行执行的任意顺序。

## Functional Requirements

1. 父 Agent 只能从注册的 SubAgentDefinition 中选择角色。
2. 每个子 Agent 有独立 session/run/context、深度和预算。
3. 子 Agent 只能使用 allowlist 工具，默认继承父级安全边界。
4. 父级取消、超时或失败可传播给子级；子级失败可作为结构化结果回填。
5. 汇总结果包含 agentId/runId、结论、证据引用和状态。
6. 事件能区分 parentRunId 与 childRunId，前端可展示层级。

## Technical Requirements

- Delegation 必须经过统一 Tool/Permission/Executor；
- 子上下文按值创建，禁止共享可变 messages；
- 有最大深度、最大子任务数、总 token/time budget；
- 结果大小和证据数量有限制；
- 子 Agent 不能直接写父 State。

## Acceptance Criteria

- 主 Agent 能委派一个 Research 子任务并消费其结构化结果；
- 子任务看不到未授权的父上下文和工具；
- 取消、超时、失败和过深递归有确定结果；
- 父子事件和最终汇总可从 Trace 还原。

## Edge Cases

- 子 Agent 再次请求委派、达到深度/数量上限；
- 多个子 Agent 部分成功、结果冲突或超限；
- 父级在子任务运行中断线/取消；
- 子 Agent 返回 prompt injection 或未经证实的结论；
- 子任务重复执行同一个 tool call。

## Tests

- Unit：definition、预算、隔离、结果 schema 和状态传播；
- Integration：Parent Runtime + Child Runtime + allowlist tools；
- Acceptance：React 页面展示委派、子结果和汇总，并验证隔离与取消。
