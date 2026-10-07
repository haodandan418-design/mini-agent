# 008 Production Plan

## 架构修改

增加 `packages/sessions` 的 SessionStore/EventStore、`packages/hooks` 的 HookRunner、agent-core 的 RetryPolicy orchestration、TraceSink 和 tools 的 Sandbox Port。它们通过 Runtime 生命周期和 Executor 接入，不改变 Agent Loop 的基础 Decision 语义。

## 新增模块

- Session/Run/Turn snapshot repository；
- Resume coordinator 和 idempotency key；
- Retry classifier/backoff；
- `packages/hooks` registry/runner；
- Trace/metrics/log sink 与 redaction；
- Sandbox adapter 和 resource policy。

## 修改模块

- Agent Runtime：编排持久化 checkpoint、恢复、Retry 和生命周期 hooks；
- Tool Executor：执行 idempotency、retry 和 sandbox policy；
- Event Buffer：持久事件游标和重放窗口；
- API：resume、cancel、trace 查询边界。

## 数据流

```text
Run -> before hook -> checkpoint -> LLM/tool
    -> event + trace + checkpoint
    -> retry or result
restart -> load snapshot/cursor -> reconcile pending call -> resume or fail safe
```

## 状态变化

增加 `resuming`/`retrying` 作为内部生命周期 metadata，外部 AgentStatus 仍保持有限集合；未确认副作用调用不能自动回到 tool_calling，必须进入安全失败或人工处理。

## 设计理由

把生产能力集中到端口和协调器，避免 Core 被存储、日志和进程模型绑死；fail-safe 原则优先于“尽量继续”，尤其是写入、命令和网络副作用。
