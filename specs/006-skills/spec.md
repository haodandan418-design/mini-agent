# 006 Skills Spec

## Why

Tool 说明“能做什么”，Skill 说明“完成一类任务应该怎么做”。把流程知识作为可审计的 `SKILL.md` 加载，能让 Agent 从工具调用集合升级为受约束的方法，而不把业务流程硬编码进 Loop。

## What

实现 Skill 文件格式、Loader、校验、Selector 和 Context 注入，并保证 Skill 不能扩大工具权限。

## Scope

- `SKILL.md` 元数据和正文约定；
- workspace/内置 Skill 来源及优先级；
- Skill Loader 的路径和大小边界；
- 基于任务描述和 tags 的确定性选择；
- 版本、冲突、禁用和审计信息。

## Non-goals

- 不让 Skill 自己执行任意代码；
- 不实现模型自主安装或下载 Skill；
- 不把 Skill 当作 Permission；
- 不实现复杂向量检索或全量 Skill 注入。

## Functional Requirements

1. Loader 能解析合法 Skill，拒绝缺少 name/version/instructions 的文件。
2. Selector 根据任务和显式配置选择有限 Skill，结果可解释。
3. 只有选中的 Skill 指令进入 Context，并受 token/字节预算限制。
4. Skill 中的工具建议必须经过 Registry、Executor 和 Permission。
5. 同名/版本冲突有确定优先级，恶意路径和超大内容被拒绝。
6. Skill 使用情况进入 Event/Trace metadata。

## Technical Requirements

- 使用 frontmatter + Markdown 正文的版本化格式；
- Loader 对路径 canonicalize、文件大小、编码和 metadata 做校验；
- ContextBuilder 以不可变片段注入 Skill；
- Selector 不执行自然语言生成，只输出候选和理由；
- Skill source 与 trust level 明确记录。

## Acceptance Criteria

- 给定代码分析任务，能选择匹配 Skill 并影响上下文中的方法指令；
- 没有匹配 Skill 时 Agent 正常运行；
- 非法、越界、超大、冲突 Skill 不会污染 Context 或扩大权限；
- 用户和 Trace 能知道本次 Run 使用了哪个版本 Skill。

## Edge Cases

- 空目录、重复 name、版本降级、无 tags；
- Skill 指令包含恶意“忽略权限”文本；
- 多 Skill 指令冲突、总上下文预算不足；
- Skill 在 Run 中途被修改或删除；
- Unicode/非法 frontmatter/软链接越界。

## Tests

- Unit：frontmatter、版本、选择、预算和优先级；
- Integration：Loader + ContextBuilder + Agent Loop + 工具权限；
- Acceptance：代码分析任务使用 Skill 完成，验证方法改变但安全边界不改变。
