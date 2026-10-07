# 004 Permission Plan

## 架构修改

在 Tool Executor 前增加 PermissionPolicy 和 PendingApprovalStore。Executor 执行前得到 allow/deny/ask；Runtime 对 ask 暂停，Approval API 只向 Runtime 提交用户决策。

## 新增模块

- Permission 类型、Policy 和风险默认策略；
- PendingApprovalStore；
- approve/reject endpoint；
- Permission Event 和前端审批组件；
- 审计记录脱敏器。

## 修改模块

- Tool：补充 risk 元数据；
- Executor：强制评估并保证一次性执行；
- AgentState：启用 waiting_for_user；
- SSE reducer：展示 permission_required 和决策结果。

## 数据流

```text
tool call -> policy -> allow/deny/ask
ask -> pending store + permission_required -> user decision
approve -> revalidate exact call -> execute -> tool result -> loop
```

## 状态变化

`tool_calling -> waiting_for_user -> tool_calling -> thinking`；deny/expire 可转为 `thinking` 回填结果，也可按策略转 `cancelled`，但必须统一记录原因。

## 设计理由

把策略放在 Executor 这一唯一入口，能覆盖 API、MCP、SubAgent 等所有调用来源；把 pending call 保存为不可变快照，避免等待期间模型或客户端改变实际执行内容。
