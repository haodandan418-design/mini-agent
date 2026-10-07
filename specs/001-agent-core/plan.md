# 001 Agent Core Plan

## 架构修改

建立 `domain`、`agent`、`llm` 和 `state` 四个最小模块。Agent Loop 只依赖 LLM Port、ContextBuilder 和状态操作，不依赖 HTTP 或具体模型 SDK。

## 新增模块

- `Message`、`ToolCall`、`AgentState`、错误类型；
- `LLMProvider` Port 及 Provider response normalizer；
- `ContextBuilder`；
- `AgentRunner` 和状态转换函数；
- 内存 Run 状态实现与测试 Provider。

## 修改模块

Phase 1 前无业务模块；仅补充项目工具链入口和测试配置。

## 数据流

```text
input -> user Message -> ContextBuilder -> LLMProvider
      -> stop -> final Message -> completed
      -> tool call -> assistant Message -> next decision/boundary
```

Tool Call 在本阶段记录为 Decision，不执行；Phase 2 将在同一 Loop 插入 Executor。

## 状态变化

`idle -> thinking -> completed/failed/cancelled`；存在 Tool Call 时 `thinking -> tool_calling` 的接口预留，但实际执行状态由 Phase 2 完成。iteration 在每次有效 Provider Decision 后递增。

## 设计理由

先隔离 Loop 的生命周期和 Provider 协议，能在没有网络和真实模型的情况下确定测试行为；把 Tool Executor 延后可避免 Phase 1 同时解决安全和文件系统问题。
