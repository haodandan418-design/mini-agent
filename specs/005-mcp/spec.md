# 005 MCP Spec

## Why

MCP 让 Agent 通过标准协议发现和调用外部能力。理解 MCP 的关键是看清它与普通 Tool 的关系：MCP Tool 是远程执行来源，进入 Runtime 后仍必须经过统一 Definition、Executor、结果和权限边界。

## What

实现 MCP Client、最小可运行测试 MCP Server、远程 Tool Discovery、MCP Tool Adapter、连接生命周期和错误隔离。

## Scope

- 配置化 MCP Server 连接；
- 可用于集成测试和本地演示的最小 MCP Server contract/fixture；
- tools/list 和 tools/call 的适配；
- 远程 Definition 到内部 ToolDefinition 的映射；
- transport timeout、断线、取消和结果大小限制；
- MCP 工具经过同一 Registry/Executor/Permission。

## Non-goals

- 不实现完整 MCP 规范的所有资源、Prompt 和采样能力；
- 不让 MCP Server 直接修改本地 AgentState；
- 不默认信任第三方 Server；
- 不把 MCP 作为绕过本地 sandbox/permission 的通道。

## Functional Requirements

1. Client 能连接配置的 Server 并发现工具。
2. 远程工具有命名空间，避免覆盖 Local Tool。
3. MCP Tool Call 的输入、超时、取消和结果都能归一化。
4. Server 不可用时已有 Local Tool 仍可用，错误可解释。
5. MCP 工具按 risk/策略进入相同 Permission 流程。
6. 连接关闭、重连和版本不兼容有明确状态和事件。

## Technical Requirements

- MCP transport 与 Tool Adapter 解耦；
- 远端 schema 需验证和限制，不能直接信任；
- 每个 Server 有连接、并发、响应大小和超时预算；
- 错误信息脱敏，不能把远端原始异常直接暴露给用户；
- Server identity/source 写入 Tool metadata 和 Trace。

## Acceptance Criteria

- 测试 MCP Server 的工具能被发现、展示并执行；
- MCP call 结果能驱动 Agent 下一轮决策；
- MCP 断线/超时不会让 Runtime 崩溃或阻塞本地工具；
- 命名冲突、恶意 schema、超大结果和权限拒绝都被隔离。

## Edge Cases

- Server 启动失败、协议版本不兼容、重复工具名；
- tools/list 中 schema 缺失或不合法；
- call 中途取消、连接断开、响应重复；
- 远程结果包含敏感内容或超过限制；
- 多个 Server 提供相同语义工具。

## Tests

- Unit：Definition/Result 映射、命名空间和错误归一化；
- Integration：MCP Client + 本地测试 Server + Registry/Executor；
- Acceptance：Agent 使用 MCP 工具完成任务，并验证断线、权限和本地工具降级。
