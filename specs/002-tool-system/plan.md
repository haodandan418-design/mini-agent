# 002 Tool System Plan

## 架构修改

在 Agent Core 旁增加 Tool Port、Registry 和 Executor。Agent Loop 在收到 tool calls 后进入 `tool_calling`，由 Executor 执行并把 ToolExecutionRecord 转成 tool Message，再回到 `thinking`。

## 新增模块

- Tool/ToolDefinition/ToolResult/ToolContext 类型；
- Registry 内存实现；
- Executor 和输入/结果/路径安全策略；
- `list_files`、`read_file`、`search_files`；
- Tool Result 到 Message 的适配器。

## 修改模块

- Agent Loop：从“记录 tool decision”扩展为执行和回填；
- AgentState：增加 toolHistory 和 `tool_calling` 状态；
- LLM Request：携带 Registry Definitions。

## 数据流

```text
LLM tool call -> Registry lookup -> schema/path validation
               -> Tool.execute -> ToolResult
               -> Tool history + tool Message -> next LLM call
```

## 状态变化

`thinking -> tool_calling -> thinking`；工具失败不一定终止 Run，失败结果首先回填给模型；未知工具、协议错误等不可恢复错误进入 `failed`。

## 设计理由

Executor 作为唯一执行入口，后续 Permission、MCP 和 SubAgent 都能复用相同安全和事件边界。只读工具先行，能把 Agent 能力做真实，同时把写入风险留到专门阶段。
