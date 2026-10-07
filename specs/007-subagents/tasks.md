# 007 SubAgents Tasks

- [ ] **SUB-001 定义 SubAgent 类型与角色**
  - 输入：角色、prompt、tool allowlist 和预算。
  - 输出：Definition、ChildRunContext、Result schema。
  - 验收：深度、数量、超时和证据限制可表达。

- [ ] **SUB-002 实现 Child Context 隔离**
  - 输入：父 Context 和 delegation request。
  - 输出：按值复制且裁剪后的子上下文。
  - 验收：子级无法看到未授权消息、工具和 metadata。

- [ ] **SUB-003 实现 SubAgentRunner**
  - 输入：Definition、Child Context、父 AbortSignal。
  - 输出：Child AgentResult。
  - 验收：预算、取消、超时、递归和失败均可控。

- [ ] **SUB-004 实现 delegation Tool**
  - 输入：agent role、task、evidence limit。
  - 输出：结构化 SubAgentResult。
  - 验收：统一经过 Registry/Executor/Permission，不直接改父 State。

- [ ] **SUB-005 实现父子事件关联与汇总**
  - 输入：child events/results。
  - 输出：可展示层级和聚合结论。
  - 验收：父子 runId、状态、证据和部分失败清晰可见。

- [ ] **SUB-006 编写 SubAgents 三层测试**
  - 输入：成功、失败、取消、递归和冲突结果场景。
  - 输出：隔离、预算、状态和 UI 行为测试。
  - 验收：任何越权上下文和无限递归均被阻止。
