# Mini Agent Runtime

一个采用 Spec-Driven Development（SDD）逐阶段构建的 Mini Agent Runtime / Agent Application Framework 学习项目。

## 当前状态

Phase 0：项目工具链与 Monorepo 边界初始化。

当前尚未实现 Agent、LLM、Tool、MCP、Skills、SubAgent、SSE 或 UI 业务能力。

## 目录

- `apps/`：Web 与 Server 应用边界；
- `packages/`：Runtime、LLM、Tool、Protocol 等包边界；
- `docs/`：产品、架构、技术设计和开发计划；
- `specs/`：每个 Phase 的 Spec、Plan 和 Tasks；
- `tests/`：Unit、Integration、E2E 测试布局；
- `workspace/`：未来 Agent 文件工具的工作区边界。

## Quality commands

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm check
```

开始业务实现前，必须先阅读对应 Phase 的 `spec.md`、`plan.md` 和 `tasks.md`。
