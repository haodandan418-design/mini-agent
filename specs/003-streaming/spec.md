# 003 Streaming Spec

## Why

Agent 任务包含多轮思考和工具调用，用户需要看到可解释进度，前端也需要统一消费模型。SSE 是 V1 的简单单向通道，但事件协议必须独立于 SSE，以支持断线恢复和未来 WebSocket。

## What

实现 versioned Agent Event Protocol、Runtime Event Emitter、Node SSE endpoint 和 React 事件消费状态模型。

## Scope

- run/message/tool/state/error/end 事件；
- eventId、sequence、runId、Last-Event-ID 重放语义；
- SSE headers、keepalive、断开处理和错误收敛；
- 前端文本增量、工具卡片、状态和最终答案渲染；
- 事件协议和端到端测试。

## Non-goals

- 不实现 WebSocket；
- 不把 SSE reconnect 当作重复执行 Run；
- 不实现富文本编辑器或复杂 UI 状态管理框架迁移；
- 不在客户端自行重排或伪造缺失事件。

## Functional Requirements

1. Runtime 发出的事件顺序单调，包含 `eventId` 和 `sequence`。
2. SSE 每个事件以 JSON data 传输，并设置 `id` 供客户端续接。
3. 客户端能对重复事件幂等，对 sequence 缺口显示恢复/错误状态。
4. 文本 delta 按 messageId 累积；工具调用和结果按 toolCallId 关联。
5. Run 完成、失败、取消都有明确 run_end；连接关闭不改变 Run 事实状态。
6. 断线重连能从最后游标继续接收可用事件。

## Technical Requirements

- 事件 payload 与 SSE adapter 解耦；
- 事件不可变并可序列化；
- 服务端使用 bounded event buffer，重放窗口外返回不可恢复错误；
- 客户端不信任事件内容，校验 version/type/关联 id；
- 传输错误和 Runtime 错误分开表达。

## Acceptance Criteria

- 用户可以看到 Thinking、Tool Call、Tool Result、Analysis、Final Answer；
- 重复事件不会重复文字或工具卡片；
- 模拟断线后能续接，模拟 sequence 缺口后不会静默错误；
- Provider/tool 失败能通过 SSE 被消费并显示结束状态。

## Edge Cases

- 首个事件前断线、Run 已完成后重连；
- delta 为空、Unicode 被拆分、事件超大；
- 客户端慢消费、浏览器刷新、Last-Event-ID 非法；
- SSE 连接断开但 Runtime 仍在执行；
- 同一 run 的多个订阅者。

## Tests

- Unit：事件校验、序列器、去重 reducer 和 delta 聚合；
- Integration：Runtime Event Emitter + SSE endpoint + reconnect cursor；
- Acceptance：浏览器/客户端完成一次多工具任务并验证可见事件和断线行为。
