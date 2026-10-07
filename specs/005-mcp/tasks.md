# 005 MCP Tasks

- [ ] **MCP-001 定义 MCP 配置与 Port**
  - 输入：Server identity、transport 和预算字段。
  - 输出：Client/connection 接口。
  - 验收：连接、关闭、调用、取消和错误可表达。

- [ ] **MCP-002 实现 tools/list 适配**
  - 输入：测试 Server 的远端 Definition。
  - 输出：带 namespace/source 的内部 Definition。
  - 验收：非法 schema、命名冲突和过大描述被拒绝或截断。

- [ ] **MCP-003 实现最小 MCP Server fixture**
  - 输入：MCP tools/list/tools/call contract 和测试工具。
  - 输出：可启动、关闭、注入故障的本地测试 Server。
  - 验收：Client 可以发现和调用工具，Server 能模拟超时、断线、非法 schema 和大结果。

- [ ] **MCP-004 实现 MCP Tool Adapter**
  - 输入：内部 ToolCall。
  - 输出：MCP tools/call 和 ToolResult。
  - 验收：参数、超时、取消、结果限制和错误映射正确。

- [ ] **MCP-005 接入 Registry/Executor/Permission**
  - 输入：MCP Adapter。
  - 输出：统一 Tool 执行链。
  - 验收：MCP 工具不绕过命名、schema、权限和事件。

- [ ] **MCP-006 实现连接生命周期**
  - 输入：启动失败、断线、重连和关闭。
  - 输出：Server 状态与事件。
  - 验收：MCP 故障不阻塞 Local Tool，重连不会重复执行 call。

- [ ] **MCP-007 编写 MCP 三层测试**
  - 输入：本地测试 Server、Agent 任务和异常注入。
  - 输出：协议、故障隔离、权限和降级测试。
  - 验收：成功和所有关键边界都有行为断言。
