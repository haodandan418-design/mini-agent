# 004 Permission Tasks

- [ ] **PERM-001 定义风险与决策类型**
  - 输入：Tool risk 和 PermissionDecision 设计。
  - 输出：allow/deny/ask 类型与错误码。
  - 验收：决策包含原因、requestId 和过期信息（适用时）。

- [ ] **PERM-002 实现默认 PermissionPolicy**
  - 输入：Tool、ToolCall、策略配置。
  - 输出：确定性决策。
  - 验收：read/write/execute/network 默认行为符合 Spec。

- [ ] **PERM-003 实现 PendingApprovalStore**
  - 输入：原始 tool call、Run、过期时间。
  - 输出：可查询的一次性 pending snapshot。
  - 验收：重复消费、过期、未知 request 均不可执行。

- [ ] **PERM-004 接入 Executor 与 Runtime**
  - 输入：ask/approve/reject 决策。
  - 输出：waiting_for_user 状态和恢复 Loop。
  - 验收：批准前无副作用，批准后只执行原始 call 一次。

- [ ] **PERM-005 实现 Approval API 与事件**
  - 输入：requestId 和用户决策。
  - 输出：校验后的状态变更与事件。
  - 验收：伪造、重复、过期请求均有稳定响应。

- [ ] **PERM-006 实现前端审批视图**
  - 输入：`permission.requested` 事件。
  - 输出：风险、工具、参数摘要和按钮。
  - 验收：用户能批准/拒绝，断线恢复后视图与后端一致。

- [ ] **PERM-007 编写 Permission 三层测试**
  - 输入：read/write/execute 工具与各种用户决策。
  - 输出：行为、状态、副作用和审计测试。
  - 验收：未授权路径被证明没有副作用。
