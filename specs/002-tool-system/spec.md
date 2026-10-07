# 002 Tool System Spec

## Why

模型只能提出意图，Runtime 必须用 Registry 和 Executor 把不可信的 Tool Call 转成受约束的真实执行。Tool System 是 Agent Loop 从“能做决策”走向“能安全使用能力”的边界。

## What

实现 `packages/tools` 的 Tool、ToolDefinition、ToolRegistry、ToolExecutor，以及第一批真实只读 workspace 工具：`list-files`、`read-file`。`search-files` 属于本阶段 Gate 之后的后续增强，不提前混入初始实现。

## Scope

- Tool 接口、JSON Schema 输入校验和 risk 标识；
- Registry 的注册、查找、重复检测和 Definition 导出；
- Executor 的查找、校验、超时、取消、异常和结果归一化；
- workspace 路径边界、结果大小和二进制处理；
- `list-files`、`read-file` 与 Agent Loop 的 Tool Result 回填；
- Code Analysis Agent 使用两个只读工具完成最小参考任务；
- Tool 行为、状态、错误和安全边界测试。

## Non-goals

- 不实现 `search-files`、文件写入、编辑或任意命令执行；
- 不实现 MCP、Permission UI、Skills、SubAgents 或 Sandbox；
- 不让工具直接修改 AgentState 或发明 AgentEvent；
- 不允许 shell 拼接替代受限 Node 文件 API。

## Functional Requirements

1. Registry 只暴露已注册工具的稳定 Definition。
2. 未知工具、非法参数、路径越界、取消和超时均返回结构化 ToolResult。
3. `list-files` 输出 workspace 内相对路径，并支持深度和数量限制。
4. `read-file` 支持行范围和内容大小限制，拒绝二进制或不可读文件。
5. 成功和失败 ToolResult 都能以 tool Message 回填 Context，供下一次 Decision 使用。
6. 同一 Tool Call 不得被 Executor 隐式执行两次。
7. 工具执行入口必须保留后续 Permission/Sandbox 接入点，但 Phase 2 不实现写/执行能力。
8. `apps/server/src/agents/code-analysis-agent.ts` 只能声明 Definition 和依赖工具，不复制 Agent Loop。

## Technical Requirements

- 输入按 JSON Schema 校验；
- 路径先 resolve/realpath，再确认位于 workspace root；
- 工具执行接收 AbortSignal，具备 timeout 和结果大小上限；
- Registry、Executor 和具体工具职责分离；
- 所有错误使用 protocol 的 Error/ToolResult 语义。

## Acceptance Criteria

- Agent 能真实列出、读取测试 workspace，并基于 Tool Result 继续下一轮 Decision；
- `../`、绝对路径、符号链接越界和超限输入被拒绝；
- 工具异常不会让进程崩溃，能产生稳定错误码和 tool result；
- 重复注册、未知工具、schema 错误、取消和重复执行都有确定行为；
- Phase 2 Gate 不包含文件搜索、写入或命令执行。
- Code Analysis Agent 能完成“列出 workspace 文件并读取指定文件”的最小只读任务。

## Edge Cases

- 空目录、隐藏文件、深层目录、忽略规则和文件消失；
- UTF-8、超大文件、二进制、权限不足；
- workspace root 本身不存在或是符号链接；
- 并发 tool calls 的顺序、部分失败和取消；
- 工具返回超大 content 或执行超过 deadline。

## Tests

- Unit：Registry、schema、路径检查、截断和单个工具错误映射；
- Integration：Executor + 临时 workspace + 真实文件 API + Agent Loop；
- Acceptance：通过代表性分析请求完成 list/read 多步任务并验证最终报告素材。
