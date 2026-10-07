# 003 Streaming Plan

## 架构修改

使用 `packages/protocol` 的 canonical AgentEvent，并在 `packages/agent-core/src/events` 增加 Event Emitter、Event Store/Buffer 和 Transport Adapter。Runtime 只发布领域事件，SSE Adapter 订阅并编码；React 只通过 reducer 把事件还原为展示状态。

## 新增模块

- protocol AgentEvent 类型、validator、sequence generator；
- agent-core `events/agent-event.ts` 与 `events/event-emitter.ts`；
- Run event buffer 和订阅接口；
- Node SSE endpoint；
- Frontend event client、reducer 和渲染模型。

## 修改模块

- Agent Loop 在状态、文本、工具开始/结果、结束处发布 canonical 事件；
- API 增加 run 创建和 event stream 路由；
- Server 注入 `apps/server/src/agents/code-analysis-agent.ts`；
- 前端 Chat/Run 页面增加事件视图。

## 数据流

```text
Runtime fact -> AgentEvent -> EventEmitter -> buffer -> SSE encoder -> browser
browser event -> protocol validator -> idempotent reducer -> UI state
```

## 状态变化

传输连接状态（connecting/open/reconnecting/closed）与 Agent 状态分离。重连不会创建新 Run；客户端展示状态由最后合法 Agent Event 决定。

## 设计理由

把协议放在 protocol 并从 SSE 中抽出可以复用日志、测试和未来 WebSocket；序列号和游标将断线恢复从“重新请求”变成可验证的事件重放。
