# 005 MCP Plan

## 架构修改

增加 MCP Client Port 和 Adapter Layer。Client 只管理连接和协议，Adapter 把远端工具包装为内部 Tool；所有调用仍通过 Registry、Executor、Permission 和 Event Protocol。

## 新增模块

- MCP connection/config 类型；
- Client transport、discovery 和 lifecycle；
- namespaced Tool Adapter；
- MCP 错误、超时和结果转换。

## 修改模块

- Registry 支持来源 metadata 和命名空间；
- Executor 支持远端超时/取消；
- Permission Policy 识别 MCP 来源；
- Observability 记录 server identity。

## 数据流

```text
server config -> client connect -> tools/list
              -> adapter -> registry definitions
LLM call -> executor -> adapter -> MCP tools/call -> ToolResult -> loop
```

## 状态变化

Server 连接状态独立于 Agent 状态；连接失败只影响对应 MCP 工具。Agent Tool Call 仍走 `tool_calling`，远端等待不能绕过 Run 的取消和总预算。

## 设计理由

通过 Adapter 保持 Local/MCP Tool 的统一心智模型，同时保留远端网络故障边界；命名空间和权限能防止外部工具覆盖本地安全策略。
