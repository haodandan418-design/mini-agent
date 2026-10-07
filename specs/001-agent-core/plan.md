# 001 Agent Core Plan

## 架构修改

建立 `packages/protocol`、`packages/llm`、`packages/agent-core` 的最小可运行边界。Agent Core 只依赖 protocol 类型、LLM Port、Tool Port 的契约和编排 Port，不依赖任何具体 SDK、HTTP 或数据库。

## 新增模块

- protocol：Message、ToolCall、ToolResult、AgentEvent、Error、branded IDs；
- llm：LLMProvider、LLMResponse Port；
- agent-core：AgentRunner、AgentState、ContextBuilder、`decision/decision.ts`、`decision/normalizer.ts`、状态转换、EventEmitter、orchestration ports；
- 测试目录中的确定性 Provider/Normalizer test doubles。

## 修改模块

Phase 1 前无业务模块。只准备 Phase 0 约定的 monorepo 包边界和测试入口。

## 数据流

```text
input
  -> user Message
  -> ContextBuilder
  -> LLMProvider
  -> LLMResponse
  -> agent-core/decision/DecisionNormalizer
  -> AgentDecision
  -> final / recorded tool-call / error
```

本阶段 Tool Call 只记录为 Decision，不执行 Tool；Phase 2 才接入 Tool Registry/Executor。LLM stream 只保留 Port，传输展示在 Phase 3 实现。

## 状态变化

`idle -> thinking -> completed/failed/cancelled`。收到 tool-call decision 时记录 `tool_calling` 的状态语义和事件边界，但不进入真实执行；Phase 2 才完成 `tool_calling -> thinking` 的 Tool Result 回填。iteration 在每次有效模型 Decision 后递增。

## 设计理由

先锁定 Normalizer 和 protocol，可以防止 OpenAI/Anthropic 响应格式泄漏到 Agent Loop；先实现可替换端口，后续 Tool、SSE、Session 和 Permission 可以增量接入，而无需重写 Core。
