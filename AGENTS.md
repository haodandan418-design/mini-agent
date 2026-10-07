# Mini Agent Runtime Agent 工作规则

## 当前阶段

Phase 0 已完成。当前等待 Phase 1 确认；在用户明确回复“开始 Phase 1”之前，不实现 Mini Agent 业务代码。若重新执行 Phase 0 类配置变更，仍只能修改 workspace、包边界、配置和工具链。

Phase 0 不得创建 Agent、LLM、Tool、MCP、Skills、SubAgent、SSE 或 UI 业务实现；目标目录中的源码路径可以写入架构文档，但不能提前创建业务空壳。

## SDD 工作流

任何编码任务都必须按以下顺序执行：

1. 找到并完整阅读相关 Spec、Plan、Tasks；
2. 阅读相关现有代码和测试；
3. 说明实现方案、影响范围和验证方式；
4. 一次只执行一个 Task；
5. 运行 Unit、Integration、Acceptance（适用时）、typecheck、lint 和 format check；
6. 更新与实现一致的文档；
7. 汇报完成的 Task、验证结果和未解决风险。

## 不可违反的约束

- 没有已确认的 Spec 不写业务代码；
- 没有用户明确确认，不进入下一个 Phase；
- 不能把一个 Task 扩大为无关重构；
- 不能修改测试来掩盖实现问题；
- 不能删除已有功能；
- 不能用 TODO、fake response、hardcode 或 placeholder 伪装核心能力；
- LLM 输出永远是不可信输入，不能直接获得执行权限；
- V1 只能使用只读工具，文件写入和命令执行必须经过 Phase 4 Permission；
- 工具必须限制 workspace、输入 schema、执行时间和结果大小；
- 发现 Spec、架构或依赖冲突时先暂停，报告问题/原因/影响/建议，不自行改需求。

## 模块边界

- Agent Runtime 管理循环和状态，不实现 HTTP/UI 细节；
- LLM Provider 只做协议适配，不执行工具；
- Tool Registry 只负责发现，Tool Executor 负责统一执行边界；
- SSE 只传输统一 Agent Event，不改变事件语义；
- 测试替身只放在测试代码中，不进入生产运行路径。

## 文档要求

每个 `specs/xxx/` 必须包含 `spec.md`、`plan.md`、`tasks.md`。代码、测试、错误码、事件协议或边界变化必须同步更新对应文档。所有任务必须有可验证的输入、输出和验收标准。

## 验证最低要求

测试行为、状态、错误和边界；不要只验证函数调用次数。提交前确认 Spec/Plan/Tasks 与实现相互一致，并记录未执行的检查及原因。
