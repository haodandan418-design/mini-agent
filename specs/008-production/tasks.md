# 008 Production Tasks

- [ ] **PROD-001 定义 Session/Run Snapshot**
  - 输入：AgentState、messages、toolHistory、event cursor。
  - 输出：带 version/checksum 的 snapshot schema。
  - 验收：保存和加载可验证一致性，版本冲突可识别。

- [ ] **PROD-002 实现 SessionStore/EventStore Port**
  - 输入：可替换存储接口。
  - 输出：内存实现和持久化边界。
  - 验收：写入失败、并发版本和事件游标行为有确定结果。

- [ ] **PROD-003 实现 Resume Coordinator**
  - 输入：snapshot、pending tool history、resume request。
  - 输出：安全恢复的 Run。
  - 验收：已完成调用不重复，未确认副作用 fail safe，事件可续接。

- [ ] **PROD-004 实现 RetryPolicy**
  - 输入：错误分类、attempt、deadline、tool risk。
  - 输出：是否重试、退避和最终错误。
  - 验收：只重试 retryable/幂等操作，cancel/deadline 优先级正确。

- [ ] **PROD-005 实现 HookRunner**
  - 输入：before/after/error/cancel hook。
  - 输出：有序执行和失败策略。
  - 验收：超时、异常、递归和输入不可变性符合约定。

- [ ] **PROD-006 实现 Trace/Observability**
  - 输入：Run/iteration/tool/subagent 事件。
  - 输出：trace/span、指标和脱敏日志。
  - 验收：可还原链路，密钥/完整文件/隐私不会进入默认日志。

- [ ] **PROD-007 定义并接入 Sandbox Port**
  - 输入：执行请求、资源和文件/网络策略。
  - 输出：受限执行结果或拒绝。
  - 验收：cwd、环境、资源、网络和超时边界可验证，sandbox 不可用时高风险拒绝。

- [ ] **PROD-008 编写 Production 三层测试**
  - 输入：重启、故障注入、重试、Hook、Trace 和 sandbox 场景。
  - 输出：恢复、幂等、安全和可观测性测试。
  - 验收：关键 fail-safe 场景均有可重复证明。
