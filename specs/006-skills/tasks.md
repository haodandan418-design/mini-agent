# 006 Skills Tasks

- [ ] **SKILL-001 定义 SKILL.md 格式**
  - 输入：name/version/tags/instructions/source 约定。
  - 输出：schema 和示例文档。
  - 验收：合法与非法 frontmatter 的错误可区分。

- [ ] **SKILL-002 实现 Skill Loader/Catalog**
  - 输入：允许的 Skill roots。
  - 输出：validated catalog。
  - 验收：路径、大小、编码、软链接和同名冲突符合策略。

- [ ] **SKILL-003 实现 Skill Selector**
  - 输入：任务文本、tags、显式配置。
  - 输出：有限候选、版本和选择理由。
  - 验收：排序稳定、无匹配可降级、不会动态执行正文。

- [ ] **SKILL-004 接入 ContextBuilder**
  - 输入：选中的 Skill 和预算。
  - 输出：带来源标记的上下文片段。
  - 验收：超预算截断/拒绝明确，Skill 指令不能覆盖安全系统约束。

- [ ] **SKILL-005 接入 Trace 与 Tool Flow**
  - 输入：Skill metadata 和工具调用。
  - 输出：可审计选择记录。
  - 验收：工具仍通过 Registry/Executor/Permission。

- [ ] **SKILL-006 编写 Skills 三层测试**
  - 输入：合法、恶意、冲突 Skill 和代码任务。
  - 输出：解析、选择、上下文、安全边界测试。
  - 验收：方法增强与权限不扩张同时成立。
