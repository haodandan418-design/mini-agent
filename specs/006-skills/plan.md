# 006 Skills Plan

## 架构修改

在 `packages/skills` 增加 SkillCatalog/Loader/Selector。选中的 Skill 被转换为受标记的 system/context fragment，注入 `packages/agent-core` 的 ContextBuilder；Tool Executor 不读取 Skill 指令作授权判断。

## 新增模块

- Skill metadata/instruction 类型；
- 文件 Loader、Catalog 和 trust/source；
- 确定性 Selector；
- Skill context fragment 和审计 metadata。

## 修改模块

- ContextBuilder：增加选中 Skill 的有限注入；
- AgentContext：增加 skill policy/预算；
- protocol AgentEvent/后续 Trace：记录 skill id/version/source；
- Tool/Permission 文档：明确 Skill 不能授权。

## 数据流

```text
task -> catalog -> selector -> validated skill fragments
     -> ContextBuilder -> LLM decision -> normal Tool/Permission flow
```

## 状态变化

Skill 选择是 Run 启动时的配置事实，不在 Loop 中无限重新选择；加载失败可降级为无 Skill，安全违规一律不执行。

## 设计理由

将方法知识与能力执行分离，可解释、可版本化且不扩大权限；确定性 Selector 也让测试不依赖另一个模型。
