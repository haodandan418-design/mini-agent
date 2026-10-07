# 002 Tool System Plan

## 架构修改

在 Agent Core 旁增加 `packages/tools/src/registry`、`packages/tools/src/executor` 和 `packages/tools/src/builtin`。Agent Loop 收到 tool-call decision 后进入 `tool_calling`，由 Executor 执行并把 ToolResult 转成 tool Message，再回到 `thinking`。

## 新增模块

- Tool/ToolDefinition/ToolResult/ToolContext 类型；
- `registry/tool-registry.ts`；
- `executor/tool-executor.ts` 和输入/结果/路径安全策略；
- `builtin/list-files.ts`、`builtin/read-file.ts`；
- Tool Result 到 protocol Message 的适配器。
- `apps/server/src/agents/code-analysis-agent.ts` 的最小 AgentDefinition 组合。

## 修改模块

- Agent Loop：从记录 tool decision 扩展为执行和回填；
- AgentState：启用 `tool_calling` 和 toolHistory；
- ModelRequest：携带 Registry Definitions；
- `apps/server` 的组合配置：注册只读 Built-in Tools。

## 数据流

```text
AgentDecision.tool_call
  -> Registry lookup
  -> schema/path/timeout validation
  -> Tool.execute
  -> ToolResult
  -> tool Message + toolHistory
  -> next LLM request

Code Analysis Agent 只提供 Definition：`tools: ["list-files", "read-file"]`，运行仍由 agent-core 负责。
```

## 状态变化

`thinking -> tool_calling -> thinking`。工具失败先转为结构化 ToolResult 回填模型；未知工具、协议错误或不可恢复执行错误进入 `failed`。Permission 状态预留到 Phase 4。

## 设计理由

Executor 是唯一执行入口，后续 Permission、MCP、SubAgent 都可以复用同一安全边界。Phase 2 只读工具先行，能验证真实文件能力，同时避免在 Permission/Sandbox 尚未完成前引入副作用。

## 后续候选（不属于 Phase 2 Gate）

`search-files`、`write-file`、`edit-file`、`bash` 分别在后续 Tool 增强或 Permission/Sandbox 具备后新增，不得在本 Phase 偷渡。
