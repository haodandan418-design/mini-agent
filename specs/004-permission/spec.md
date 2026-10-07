# 004 Permission Spec

## Why

模型的工具调用是建议，不是授权。文件写入和命令执行具有不可逆副作用，必须让 Runtime 在执行前经过可解释、可暂停、可恢复的 Permission/Human-in-the-loop 流程。

## What

实现风险分级、PermissionPolicy、pending request、approve/reject/expire API，以及 Permission Event 与 `waiting_for_user` 状态。

## Scope

- read/write/execute/network 风险分类；
- 默认 deny/allow/ask 策略；
- pending tool call 持久化接口和一次性批准；
- 前端权限请求展示与响应；
- 拒绝、过期、取消、重复响应和审计测试。

## Non-goals

- 不实现完整沙箱；
- 不自动批准模型建议；
- 不实现组织级 RBAC、复杂审批流和跨用户授权；
- 不通过前端绕过后端 Policy。

## Functional Requirements

1. read 工具可按默认策略直接执行，write/execute 默认需要 ask 或 deny。
2. ask 会生成唯一 requestId 和过期时间，Run 进入 `waiting_for_user`。
3. approve 只允许执行原始且已校验的 tool call 一次；reject/expire 返回结构化 ToolResult。
4. 用户决策通过事件发送，前端可显示工具名、输入摘要、风险和影响。
5. 未授权、过期、重复 approve、未知 request 都不会执行工具。
6. 所有决策可审计但默认脱敏。

## Technical Requirements

- Policy 在 Executor 内部强制执行，不能只放在 UI；
- pending 状态与 Run/ToolCall 绑定；
- approve/reject 必须幂等；
- 过期由读取和后台清理双重保障；
- Permission 不改变 Tool 接口，也不允许 Tool 自行弹权限。

## Acceptance Criteria

- 写入/命令工具在未批准时没有副作用；
- 批准后只执行一次且回到 Agent Loop；
- 拒绝、过期、取消均让模型收到可解释结果或 Run 结束；
- 重复或伪造 requestId 被拒绝并产生审计事件；
- 直接调用 API 也无法跳过后端策略。

## Edge Cases

- 用户在 pending 期间取消 Run；
- 多个并行 tool calls 只有部分批准；
- 请求过期前后同时 approve；
- tool input 在等待期间被修改；
- 客户端断线后恢复权限页面。

## Tests

- Unit：Policy、状态转换、幂等和过期判断；
- Integration：Executor + pending store + write/execute test tools；
- Acceptance：通过 UI/API 请求批准、拒绝和恢复，验证副作用和事件链。
