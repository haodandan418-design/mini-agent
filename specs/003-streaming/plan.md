# 003 Streaming Plan

## 架构修改

增加独立 Event Protocol 和 Event Store/Buffer。Runtime 只发布领域事件，SSE Adapter 订阅并编码；React 只通过 reducer 把事件还原为展示状态。

## 新增模块

- AgentEvent 类型、validator、sequence generator；
- Run event buffer 和订阅接口；
- Node SSE endpoint；
- Frontend event client、reducer 和渲染模型。

## 修改模块

- Agent Loop 在状态、文本、工具开始/结果、结束处发布事件；
- API 增加 run 创建和 event stream 路由；
- 前端 Chat/Run 页面增加事件视图。

## 数据流

```text
Runtime fact -> EventEmitter -> buffer -> SSE encoder -> browser
browser event -> validator -> idempotent reducer -> UI state
```

## 状态变化

传输连接状态（connecting/open/reconnecting/closed）与 Agent 状态分离。重连不会创建新 Run；客户端展示状态由最后合法 Agent Event 决定。

## 设计理由

把协议从 SSE 中抽出可以复用日志、测试和未来 WebSocket；序列号和游标将断线恢复从“重新请求”变成可验证的事件重放。
