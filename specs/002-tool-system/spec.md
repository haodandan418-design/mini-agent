# 002 Tool System Spec

## Why

模型只能提出意图，Runtime 必须用 Registry 和 Executor 把不可信的 Tool Call 转成受约束的真实执行。清晰的 Tool System 是 Agent Loop 可扩展和安全演进的基础。

## What

实现 Tool、ToolDefinition、ToolRegistry、ToolExecutor 及三类真实只读 workspace 工具：`list_files`、`read_file`、`search_files`。

## Scope

- Tool 接口、JSON Schema 输入校验和风险标识；
- Registry 的注册、查找、重复检测和 Definition 导出；
- Executor 的查找、校验、超时、异常和结果归一化；
- workspace 路径边界、结果大小和二进制处理；
- Agent Loop 接入 Tool Result 回填。

## Non-goals

- 不实现文件写入或任意命令执行；
- 不实现 MCP、Permission UI、SubAgent；
- 不让工具直接修改 AgentState；
- 不允许 shell 拼接替代受限 Node 文件 API。

## Functional Requirements

1. Registry 只暴露已注册工具的稳定 Definition。
2. 未知工具、非法参数、路径越界和超时均返回结构化 ToolResult。
3. `list_files` 输出 workspace 内相对路径并支持深度/数量限制。
4. `read_file` 支持行范围和内容大小限制，拒绝二进制或不可读文件。
5. `search_files` 输出文件、行号、匹配片段，并有 glob/数量限制。
6. 成功 ToolResult 以 tool Message 回填 Context，失败结果按策略可供模型理解。
7. 同一 Tool Call 不得被 Executor 隐式执行两次。

## Technical Requirements

- 输入按 JSON Schema 校验；
- 路径先 resolve/realpath，再确认位于 workspace root；
- 工具执行接收 AbortSignal；
- 结果 content 有字节上限并标记 truncated；
- Registry、Executor 和具体工具职责分离。

## Acceptance Criteria

- Agent 能真实列出、读取、搜索测试 workspace，并基于结果继续 Loop；
- `../`、符号链接越界、绝对路径和超限输入被拒绝；
- 工具异常不会让进程崩溃，能产生稳定错误码和 tool result；
- 重复注册、未知工具、schema 错误和重复执行都有确定行为。

## Edge Cases

- 空目录、忽略目录、隐藏文件、深层目录；
- UTF-8、超大文件、二进制、权限不足和文件在执行中消失；
- query 含正则特殊字符或换行；
- 符号链接指向 workspace 外；
- 同时多个 tool calls 的顺序和部分失败。

## Tests

- Unit：Registry、schema、路径检查、截断和单个工具错误映射；
- Integration：Executor + 临时 workspace + 真实文件 API + Agent Loop；
- Acceptance：通过代表性分析请求完成 list/search/read 多步任务并验证最终报告素材。
