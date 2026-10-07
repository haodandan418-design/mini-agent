# 007 SubAgents Plan

## 架构修改

在 `packages/subagents` 增加 SubAgentRunner 和 Delegation 边界。父 Runtime 通过受限 Executor 发起子 Run；Child Runtime 使用独立 State/Context，但共享只读的基础能力和 protocol Event correlation 标识。

## 新增模块

- SubAgentDefinition、ChildRunContext、SubAgentResult；
- SubAgent catalog/runner；
- 深度、数量、时间和 token budget；
- parent/child event correlation 和 result aggregator。

## 修改模块

- `packages/tools` Registry：注册受限 delegation tools；
- agent-core Permission orchestration：父级策略约束子级；
- ContextBuilder：构造隔离 child context；
- Event/Trace：增加 parentRunId、agentId 和层级。

## 数据流

```text
parent LLM -> delegation tool -> child context -> child loop/tools
            <- structured result + evidence <-
parent context -> aggregation -> final answer
```

## 状态变化

父 Run 在等待子结果时保持 `tool_calling` 或专用 waiting metadata；子 Run 独立经历 thinking/tool_calling/completed/failed/cancelled。子级终态不会直接改变父级，必须经过结果回填。

## 设计理由

用 delegation tool 复用 Tool/Permission/Trace 机制，用按值隔离解决上下文泄漏；限制递归和预算可以把“多 Agent”控制成可预测的工程能力。
