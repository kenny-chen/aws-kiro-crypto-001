# tasks.md

### task 1: 初始化 Next.js 项目骨架（App Router）
- [x] 创建 Next.js（App Router）+ TypeScript 项目，启用严格模式与基础 ESLint 规则
- [x] 接入 Tailwind CSS（含基础主题与全局样式文件），建立 UI 基础组件目录
- [x] 安装并配置依赖：Zod、TanStack Query、Zustand、Drizzle ORM、drizzle-kit
- [x] 建立目录约定：app/（页面与路由）、server/（服务层）、db/（schema 与迁移）、lib/（工具）、components/（复用组件）
- [x] 添加环境变量样例文件（.env.example）与运行时 env 校验（Zod）

### task 2: 统一工程规范与可观测性最小集
- [x] 定义统一 API 返回结构与错误码（含 requestId）
- [x] 实现服务端日志封装（按 requestId 关联），记录关键资金/状态动作
- [x] 实现基础限流工具（创建 market、创建 duel、发送聊天消息）
- [x] 定义审计写入工具函数（audit_log）与使用约定（每个关键动作必须写入）
- [x] 建立最小时间处理规范（统一 UTC 入库，前端按用户时区展示）

### task 3: 数据库接入与迁移框架
- [x] 准备 PostgreSQL（本地开发 + 目标托管环境其一），配置连接串
- [x] 初始化 Drizzle 配置（drizzle.config）与迁移脚本（migrate / push）
- [x] 建立数据库连接层（db client）与事务封装（用于并发与幂等控制）
- [x] 建立最小种子数据脚本（可选）：创建一个 admin 用户与示例 market
- [x] 为 token/幂等键相关字段添加唯一约束与索引策略

### task 4: 实现 Drizzle Schema（最小闭环所需）
- [x] 落地表结构：user_account、invite、market、duel、duel_participant
- [x] 落地资金与结算表结构：chain_tx、ledger_entry、settlement、payout
- [x] 落地内容与审计表结构：chat_message、audit_log
- [x] 添加枚举/状态字段与索引（status、closeAt、resolutionAt、createdBy 等）
- [x] 建立迁移并在本地完成一次全量迁移验证

### task 5: 邀请制入口（access 页面）与 invite 解析
- [x] 实现路由：/access/[token]（invite_landing、invite_expired、invite_invalid 三态）
- [x] 实现 invite token 校验：存在性、过期、关联 duel/market 摘要读取
- [x] 写入 invite.openedAt（首次打开）并记录 audit_log（OPEN/VIEW）
- [x] 前端展示最小摘要：market 标题、选项、minStake、fee、closeAt 倒计时
- [x] 明确禁止输出：公开大厅入口、可搜索入口、赔率/隐含概率信息

### task 6: 钱包连接页面（wallet）与用户锚点建立
- [x] 实现路由：/wallet/connect 与 /wallet/result（成功/失败最小页）
- [x] 集成 Solana 钱包连接（WalletConnect 或等效适配层），仅做连接不做转账
- [x] 服务器端建立 user_account：walletAddress 唯一锚点，记录 invitedByUserId（若来自邀请）
- [x] 增加“签名证明”流程：签名一段挑战文本用于证明地址所有权（不保存私钥/敏感材料）
- [x] 记录 audit_log：CREATE_OR_BIND、WALLET_CONNECTED、WALLET_BIND_RESULT_VIEW

### task 7: Market 创建（market_create）与受限字段校验
- [x] 实现路由：/market/create（表单）与 /market/[id]（详情）
- [x] 实现字段约束（Zod）：title、optionALabel、optionBLabel、resolutionAt、minStake、feeBps
- [x] 服务端风控最小校验：长度/非法字符、fee 边界、resolutionAt 合法性、用户状态
- [x] 写入 market（默认私密传播语义，不生成公开索引），记录 audit_log（MARKET_CREATED/CREATE）
- [x] 明确禁止实现：公开市场库、搜索/推荐/榜单、复杂编辑与模板批量创建

### task 8: Market 详情页（market_detail）与发起对决入口
- [x] /market/[id] 展示 market 摘要与规则（minStake、fee、resolutionAt、状态）
- [x] 对冻结/取消状态给出一致的不可继续提示（不提供替代公开入口）
- [x] 提供“发起对决”按钮跳转到 /duel/create?marketId=...
- [x] 记录 audit_log：MARKET_DETAIL_VIEW
- [x] 明确禁止输出：赔率、胜率、隐含概率、基于入池变化的引导信息

### task 9: Duel 创建（duel_create）与私密邀请 token 生成
- [x] 实现路由：/duel/create（基于 marketId），仅允许创建 private 可见性
- [x] 服务端生成不可预测 inviteToken（防枚举），并支持 inviteExpiresAt 配置
- [x] 实现 closeAt 校验：必须在未来、不得超过 market.resolutionAt、不得短到不可用
- [x] 创建 duel（status=open），初始化聚合快照字段（totalStakeA/B、participantCount）
- [x] 输出邀请链接与二维码（前端生成二维码），记录 audit_log（DUEL_CREATE）

### task 10: 受邀加入对决（duel_invite_join）与入池请求落账
- [x] 实现路由：/duel/invite/[token]（或 /duel/[token]），读取 duel 摘要与状态
- [x] 校验：closeAt 未到、duel 状态允许、用户未重复加入、stake >= minStake
- [x] 创建 duel_participant（side 固定不可更新），写入 joinedAt
- [x] 创建 chain_tx（txType=deposit）与 ledger_entry（deposit），生成 idempotencyKey
- [x] 记录 audit_log：JOIN_AND_DEPOSIT（包含 requestId 与关键参数摘要）

### task 11: 资金服务最小实现（Solana USDC 转账执行与确认）
- [x] 建立 server-side 转账服务：构造并发送 USDC 转账交易（deposit/fee/payout/refund）
- [x] 实现链上确认轮询：submitted -> confirmed/failed，并写回 chain_tx 状态与错误
- [x] 实现幂等保护：同一 idempotencyKey 只允许发送一次交易
- [x] 实现最小密钥治理：私钥仅在服务端环境变量/密钥服务，禁止下发到前端
- [x] 建立失败重试策略：指数退避、最大重试次数、失败进入人工处置路径

### task 12: Duel 房间页（duel_room）最小闭环展示
- [x] 实现路由：/duel/room/[token]（仅受邀范围可见）
- [x] 展示状态栏（open/closed/resolving/resolved/refunding/refunded）与倒计时（closeAt）
- [x] 展示阵营与入池汇总（totalStakeA/B、participantCount），不计算不展示赔率
- [x] 展示用户自身加入信息（side、stakeAmount、资金状态）
- [x] 记录 audit_log：VIEW_ROOM（无权限访问时记录安全事件）

### task 13: 聊天（chat_message）最小实现（文本 + 隔离 + 限流 + 审计）
- [x] 房间页增加聊天区：发送文本消息、拉取消息列表（先用轮询，后可升级实时）
- [x] 服务端写入 chat_message（按 duelId 隔离），实现基础频率限制与长度限制
- [x] 实现最小删除/封禁入口（Admin 使用）：标记 deletedAt 与 deletedBy
- [x] 记录 audit_log：SEND_MESSAGE、CHAT_DELETED（如发生）
- [x] 明确禁止实现：基于聊天内容自动判定胜负、推荐或引导策略

### task 14: Duel 关闭与状态机推进（open -> closed）
- [x] 实现定时检查/触发：closeAt 到达后将 duel 置为 closed（带并发版本控制）
- [x] 禁止关闭后继续入池：服务端强校验 closeAt 与 status
- [x] 写入 audit_log：DUEL_CLOSED（含触发者 system/worker）
- [x] 对异常状态（链上未确认 deposit）定义处理：延迟窗口或进入 refunding
- [x] 为状态变更加入版本号（duel.version）以防并发覆盖

### task 15: Admin 最小后台骨架与访问控制
- [x] 实现路由组：/admin（App Router 分组），加入最小访问控制（白名单/环境变量）
- [x] 实现视图：admin_market_list、admin_duel_list（列表 + 筛选）
- [x] 列表展示最小字段：状态、时间、创建者、关键金额汇总（不展示赔率）
- [x] 记录 audit_log：ADMIN_VIEW_MARKET_LIST、ADMIN_VIEW_DUEL_LIST
- [x] 明确禁止实现：复杂多级审批、批量运营工具、公开分发与曝光能力

### task 16: Admin Market 处置（冻结/下架/恢复）
- [x] 实现 admin_market_action：freeze/cancel/restore
- [x] 服务端校验状态迁移合法性，写入 market 状态与时间戳（frozenAt/cancelledAt）
- [x] 将冻结/下架反馈到前端页面（market_detail、duel_create 入口禁止继续）
- [x] 记录 audit_log：FREEZE/CANCEL/RESTORE（含 before/after）
- [x] 对被处置 market 的关联 duel 给出最小处置策略（禁止新建/加入）

### task 17: Admin 触发结算（settlement）与分账任务生成
- [x] 实现 admin_settlement_action：对 closed duel 选择 winningSide 并触发结算
- [x] 在事务中创建 settlement（唯一）、计算 feeAmount 与 distributableAmount
- [x] 为所有参与者生成 payout 记录（仅赢家生成或全量生成并将输家 payoutAmount=0）
- [x] 生成 chain_tx：fee 与 payout（每笔带 idempotencyKey），生成对应 ledger_entry
- [x] 写入 audit_log：ADMIN_TRIGGER_SETTLEMENT（含关键汇总）

### task 18: 结算执行 Worker（发送 payout/fee 交易、确认、对账）
- [x] 实现 worker 作业：扫描待处理 payout/chain_tx，发送交易并更新状态
- [x] 实现对账：链上 signature 与金额核对，失败进入人工处置队列
- [x] 实现幂等：同一 payout 不得重复支付，冲突应安全失败并可追踪
- [x] 写入 audit_log：WORKER_PAYOUT_SENT/CONFIRMED/FAILED、WORKER_RECONCILE
- [x] 产出 admin_reconcile_overview 所需聚合数据（待确认/失败/重试队列长度）

### task 19: Refund 流程（异常对决退款）
- [x] 实现 admin_refund_action：选择退款原因并触发退款（refunding）
- [x] 生成 chain_tx（refund）与 ledger_entry（refund），并为参与者创建退款任务
- [x] worker 执行 refund 交易与确认，更新 duel 状态为 refunded
- [x] 在 duel_result 展示退款原因与链上状态（不暴露可枚举内部细节）
- [x] 写入 audit_log：ADMIN_TRIGGER_REFUND、WORKER_REFUND_*

### task 20: Duel 结果页（duel_result）与分享卡最小实现
- [x] 实现路由：/duel/result/[token]，仅在 resolved/refunded 可访问
- [x] 展示 settlement：winningSide、feeAmount、distributableAmount、decidedAt（与 disputeWindowEndsAt 如启用）
- [x] 展示个人 payout：payoutAmount、链上交易状态（confirmed/failed）
- [x] 实现分享卡生成（静态图/可复制链接），不包含赔率与引导信息
- [x] 写入 audit_log：VIEW_RESULT

### task 21: 指标采集最小集与漏斗视图
- [x] 定义并实现最小指标查询：invite 打开数、钱包连接数、入池数、结算完成数
- [x] 定义收入与健康度：总入池金额、手续费收入、结算成功率、退款率、确认耗时分布
- [x] 定义留存与复用：发起者复发率、每发起者带来的参与者数、每周人均对决次数
- [x] 在 /admin 增加最小指标页（仅聚合展示，不做复杂看板）
- [x] 确保所有指标从数据库与账本推导，不引入“赔率/隐含概率”相关计算

### task 22: 负面能力校验与安全基线
- [x] 确认全站不存在公开大厅、陌生人匹配、公开可搜索市场库相关路由与 API
- [x] 确认前后端不展示不计算赔率/隐含概率/基于池子变化的引导信息
- [x] 确认入池后不可换边（side 不可更新，服务端禁止修改）
- [x] 确认关闭后不可入池（closeAt 与 status 双重校验）
- [x] 为 inviteToken 增加防枚举策略（长度、字符集、速率限制、统一错误页）

### task 23: 测试策略与端到端验证脚本
- [ ] 为 Zod 校验与状态机迁移写单元测试（market/duel/settlement/refund）
- [ ] 为幂等与并发冲突写集成测试（同一 idempotencyKey 重放、重复结算防护）
- [ ] 为资金服务写模拟层（devnet 或 mock），覆盖 confirmed/failed/timeout
- [ ] 增加最小 E2E 流程脚本：创建 market -> 创建 duel -> 加入入池 -> 关闭 -> 结算 -> 结果展示
- [ ] 增加异常流程脚本：链上失败 -> 自动/人工退款 -> 结果展示与审计追溯

### task 24: 部署与运行作业（Vercel + 托管 PostgreSQL + Worker）
- [ ] 配置 Vercel 部署（Web/API），设置环境变量与最小权限
- [ ] 配置托管 PostgreSQL（Neon/Supabase/RDS 其一），完成迁移流程
- [ ] 部署 worker：Vercel Cron/独立 worker 服务（二选一），实现结算/对账/退款作业调度
- [ ] 增加运行告警入口：失败 chain_tx、异常退款率、结算失败率阈值监控
- [ ] 产出最小回滚方案：冻结新 market/新入池、停止 worker、导出账本与审计用于复