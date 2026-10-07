# 008 Production Spec

## Why

Agent 从一次性演示走向可用 Runtime 后，需要面对断线恢复、暂时性错误、生命周期扩展、Trace 和执行隔离。Production Spec 将这些横切能力集中管理，但不把它们提前混入 Core。

## What

实现 Session/Resume、受控 Retry、Hooks、Observability/Trace 和 Sandbox 接口，使一次 Run 可审计、可恢复、可限制执行。

## Scope

- Session、Run、Message、Tool History 和 State Snapshot 存储；
- Resume 游标、幂等和未完成调用恢复策略；
- 仅对 retryable 错误生效的退避 Retry；
- before/after/error/cancel Hooks；
- trace/span、指标、结构化日志和敏感信息脱敏；
- 命令/写入工具的 sandbox adapter 和资源限制。

## Non-goals

- 不承诺多区域高可用、分布式一致性或云厂商锁定；
- 不自动重放可能有副作用的工具调用；
- 不把日志当作完整业务数据库；
- 不实现绕过操作系统能力的“假沙箱”。

## Functional Requirements

1. Session 能保存一致的状态快照、消息、工具历史和事件游标。
2. Resume 能从最后一致点恢复，已完成 tool call 不重复执行；未确认副作用调用进入人工处理/失败态。
3. Retry 只针对明确 retryable 错误，有限次数、指数退避并受总预算限制。
4. Hooks 有明确时机、顺序、超时和失败策略，不能隐式改变核心状态。
5. Trace 能关联 session/run/iteration/tool/subagent，日志默认脱敏。
6. Sandbox 能限制 cwd、环境变量、网络、CPU、内存、时间和文件访问；不可用时高风险工具拒绝执行。

## Technical Requirements

- Store 使用版本号/乐观并发控制；
- Resume 和 Event sequence 共享幂等语义；
- Retry policy 与 Tool risk 解耦但禁止重试非幂等副作用；
- Hook failure 默认 fail closed（可按 Spec 配置）；
- Sandbox 是执行适配器，不由 LLM 决定策略。

## Acceptance Criteria

- 模拟进程重启后能恢复已保存 Run，且不重复完成的工具调用；
- Provider/network 临时错误可按策略重试，参数/权限错误不会重试；
- Trace 可还原一次多轮、多工具、子 Agent Run；
- 高风险工具在 sandbox 不可用或越界时被拒绝；
- Hook 超时和异常有确定状态与错误事件。

## Edge Cases

- Snapshot 写入中断、版本冲突、事件游标缺口；
- 进程在 tool call 前后崩溃；
- retry 与 cancel 同时发生、退避超过 Run deadline；
- Hook 递归触发或修改输入；
- 沙箱逃逸、资源耗尽、环境泄漏和敏感日志。

## Tests

- Unit：状态快照、retry classifier/backoff、hook ordering、trace redaction、sandbox policy；
- Integration：可替换 Store + Runtime restart + fault injection + sandbox adapter；
- Acceptance：模拟断线/重启/临时故障，验证恢复、重试、Trace 和拒绝边界。
