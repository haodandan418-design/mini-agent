# 003 Streaming Tasks

- [ ] **STREAM-001 定义 AgentEvent v1**
  - 输入：技术设计事件联合类型。
  - 输出：事件类型、关联 id、版本和错误码。
  - 验收：run/message/tool/state/error/end 场景可表达且可序列化。

- [ ] **STREAM-002 实现事件序列与校验**
  - 输入：Runtime 事件意图。
  - 输出：带 eventId/sequence 的不可变事件。
  - 验收：同一 run 单调递增，非法关联和重复序列可检测。

- [ ] **STREAM-003 实现 Run Event Buffer**
  - 输入：事件流和重放游标。
  - 输出：订阅、重放、窗口错误。
  - 验收：Last-Event-ID 后续事件可重放，过期游标返回明确错误。

- [ ] **STREAM-004 接入 Runtime 事件发布**
  - 输入：Agent/Tool 状态变化。
  - 输出：完整事件链。
  - 验收：一次多工具 Run 的事件顺序和状态可还原。

- [ ] **STREAM-005 实现 SSE Endpoint**
  - 输入：runId、Last-Event-ID、HTTP disconnect。
  - 输出：符合 SSE 格式的响应。
  - 验收：headers、id、data、keepalive、断开清理正确。

- [ ] **STREAM-006 实现前端事件 Reducer**
  - 输入：AgentEvent 序列。
  - 输出：可渲染 Run View Model。
  - 验收：重复事件幂等，delta/toolCall/toolResult 正确关联。

- [ ] **STREAM-007 编写 Streaming 三层测试**
  - 输入：事件序列、SSE 客户端和多工具 Run。
  - 输出：协议、重连和 UI 状态测试。
  - 验收：覆盖断线、缺口、重复、错误和最终状态。
