# Mini Agent Runtime 产品规格

## 1. 产品定位

Mini Agent Runtime 是一个以 TypeScript/Node.js 实现、面向代码仓库分析的教学型 Coding Agent Runtime。它把用户意图转换为受约束的 LLM 决策、工具调用和可观察事件，重点展示 Agent Loop、Tool Calling、状态管理和安全边界，而不是追求生产级功能数量。

## 2. 为什么做这个项目

目标是从 Agent 应用层下沉到 Runtime 层，建立对以下机制的可运行、可测试理解：

- LLM 输出如何变成可执行决策；
- Tool Definition、Registry、Executor 和 Tool Result 如何协作；
- 状态、上下文、会话与流式事件如何贯穿一次任务；
- 权限、MCP、Skill、SubAgent 和可观测性如何在 Agent Loop 外围演进。

项目最终也应成为一个可展示架构判断、工程质量和 SDD 协作能力的求职作品。

## 3. 目标用户

主要用户是开发者和 Agent 工程学习者，尤其是熟悉 JavaScript/TypeScript、React、Node.js 和 SSE，但希望理解底层 Runtime 的工程师。次要用户是面试官或技术评审者，他们需要通过文档、测试和 Trace 理解系统设计。

## 4. 核心场景

### 4.1 V1 场景（只读分析）

用户输入“分析当前项目，找到登录相关代码，并告诉我登录流程”，Agent 可以：

1. 理解任务并选择工具；
2. 列出仓库文件；
3. 读取相关文件；
4. 基于工具结果继续循环；
5. 以流式事件展示过程并返回最终答案。

### 4.2 参考 Agent：Code Analysis Agent

项目必须最终提供一个具体的参考 Agent，而不只交付 Runtime：

- Definition 位于 `apps/server/src/agents/code-analysis-agent.ts`；
- Phase 2 使用 `list-files`、`read-file` 完成只读代码结构分析；
- Phase 3 通过 SSE 和 React UI 展示 Tool Call、Tool Result 和 Final Analysis；
- 后续增加 `search-files` 后，完成 React 页面统计、`useEffect` 使用分析和报告生成。

该 Agent 复用 `packages/agent-core`，不创建第二套 Loop，也不新增 `packages/agents`。

### 4.3 后续场景

- 项目分析：统计 React 页面、依赖和目录结构；
- 代码搜索：按文件名、文本和受限 glob 搜索；
- 代码读取：读取带行号、大小受限的文件片段；
- 代码修改：经权限批准后写入文件；
- 命令执行：在明确策略和沙箱内执行命令；
- 代码 Review：收集上下文、分析问题并生成报告；
- 复杂分析：委派 Research/Review SubAgent 并汇总结果。

## 5. 产品目标与非目标

### 5.1 目标

- 用小而真实的实现解释 Agent Loop，而不是用固定答案模拟 Agent；
- 所有工具调用可追踪、可测试、可限制；
- Runtime 与 LLM Provider、前端和工具实现解耦；
- 首个可用版本能稳定完成只读代码仓库分析；
- 每个扩展阶段都有独立 Spec、Plan、Tasks 和验收标准。

### 5.2 V1 必须做什么

V1 定义为 Phase 0–3 的交付：

- TypeScript/Node.js Runtime 与最小 React 客户端骨架；
- 可替换的 `LLMProvider`，支持真实 tool-call 响应和可测试的 Provider Adapter；
- 有最大迭代次数、取消和错误收敛的 Agent Loop；
- `list-files`、`read-file` 两个真实只读工具；
- Tool Registry 与统一 Tool Executor；
- `AgentState`、Message、Tool History 和 Context 组装；
- SSE 上的统一 Agent Event Protocol；
- 前端能展示文本增量、工具调用、工具结果、错误和完成状态；
- Unit、Integration、Acceptance 三层测试和可复现的示例任务。

### 5.3 V1 明确不做什么

- 不允许未经后续 Permission Spec 批准的文件写入或任意命令执行；
- 不包含生产级多租户、计费、用户系统、云端部署和高可用；
- 不把 MCP、Skill、SubAgent、Resume、Sandbox 等后续能力伪装成 V1 能力；
- 不承诺支持所有 LLM 厂商的私有协议；
- 不在 Phase 2 初始 Gate 中实现 `search-files`；
- 不追求通用工作流编排、RAG、向量数据库或长时间后台任务；
- 不通过硬编码任务关键词或 fake response 绕过真实决策链。

## 6. 后续版本路线

- Phase 4：写入和命令执行的 Permission/Human-in-the-loop；
- Phase 5：MCP Client、Server 和 Tool Adapter；
- Phase 6：`SKILL.md` 加载、选择和执行约束；
- Phase 7：SubAgent 委派、上下文隔离和结果汇总；
- Phase 8：Session/Resume、Retry、Hooks、Trace/Observability 和 Sandbox。

## 7. 产品原则

1. 真实链路优先：LLM 决策、工具执行和结果回填必须可观察。
2. 默认安全：只读工具先行，写入和命令执行默认拒绝。
3. 可测试优先：每个能力都有行为、状态、错误和边界测试。
4. 最小抽象：不为尚未出现的扩展创建 Manager/Factory 层。
5. Spec 是约束：代码变更必须能追溯到已确认的 Spec 和 Task。

## 8. 成功指标

- V1 示例任务在测试仓库中能够完成从用户输入到最终报告的完整 Loop；
- 工具调用、结果、迭代、错误和最终状态可以从事件或 Trace 还原；
- 修改工具和命令工具在 V1 中不可被绕过地执行；
- 新增一个 Tool 不需要修改 Agent Loop；
- 断线、工具异常、非法参数和达到最大迭代次数都有确定结果；
- 面试评审者可以仅通过文档和测试理解主要架构。

## 9. 术语

- **Runtime**：管理状态、上下文、LLM 决策、工具执行和生命周期的核心。
- **Tool**：可被模型声明调用、由 Runtime 真实执行的能力。
- **Skill**：描述完成一类任务所需方法和约束的可加载指令。
- **Agent Event**：面向 UI、日志和未来传输层的统一事实事件。
