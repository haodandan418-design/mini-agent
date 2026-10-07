# 002 Tool System Tasks

- [ ] **TOOL-001 定义 Tool 领域类型**
  - 输入：技术设计中的 Tool、Definition、Context、Result。
  - 输出：严格类型、risk 字段和错误码边界。
  - 验收：风险、取消、截断和 retryable 信息可表达。

- [ ] **TOOL-002 实现 JSON Schema 校验适配**
  - 输入：每个工具的 inputSchema 和未知输入。
  - 输出：成功解析或 `SCHEMA_ERROR`。
  - 验收：缺字段、错误类型和危险额外字段按策略处理。

- [ ] **TOOL-003 实现 ToolRegistry**
  - 输入：Tool 实例集合。
  - 输出：register/get/getDefinitions。
  - 验收：重复名称被拒绝，Definition 顺序稳定，返回值不暴露可变内部集合。

- [ ] **TOOL-004 实现 workspace path guard**
  - 输入：workspaceRoot 和用户路径。
  - 输出：安全 canonical path 或结构化拒绝。
  - 验收：相对/绝对/`..`/符号链接越界行为均有测试。

- [ ] **TOOL-005 实现 list-files**
  - 输入：root、glob、depth、limit。
  - 输出：相对文件路径列表和截断元数据。
  - 验收：只读、可取消、具备 timeout 且不会遍历 workspace 外。

- [ ] **TOOL-006 实现 read-file**
  - 输入：相对 path、行范围、字节限制。
  - 输出：带行号文本或结构化错误。
  - 验收：大文件、二进制、缺失文件和权限错误可区分。

- [ ] **TOOL-007 实现 ToolExecutor**
  - 输入：ToolCall、ToolContext、Registry。
  - 输出：ToolResult 和执行记录。
  - 验收：未知工具、schema、异常、超时、取消和重复 call 有确定结果。

- [ ] **TOOL-008 接入 Agent Loop**
  - 输入：Agent Core 和 Tool Executor。
  - 输出：Tool Result 回填后的多轮 Loop。
  - 验收：list/read 能驱动下一次 LLM Decision，工具失败不会丢失上下文。

- [ ] **TOOL-009 完成 Tool 三层测试**
  - 输入：工具契约、临时 workspace、代表性用户任务。
  - 输出：Unit/Integration/Acceptance 测试。
  - 验收：行为、状态、错误、边界和安全拒绝均被覆盖。

- [ ] **TOOL-010 声明 Code Analysis Agent 最小 Definition**
  - 输入：AgentDefinition、`list-files`、`read-file` 和 workspace 约束。
  - 输出：`apps/server/src/agents/code-analysis-agent.ts` 的应用层 Definition。
  - 验收：Definition 不实现 Loop/Tool 执行，能驱动“列出文件并读取指定文件”的只读任务。

## Phase 2 之后的候选 Task

`search-files` 是后续 Tool System 增强；`write-file`、`edit-file`、`bash` 必须等待 Permission/Sandbox Spec，不在当前 Task 列表执行。
