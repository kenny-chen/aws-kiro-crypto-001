# design.md

## 9.0 方案选择结论︱Solution Decision
- 采用“邀请制私密对决 + 用户创建 market + USDC 入池与结算 + 对战页实时聊天”的最小闭环作为当前阶段方案，以验证邀请传播、入池转化、结算稳定性与手续费收入是否成立。
- 产品交互坚持私密传播与可控范围：无公开大厅、无可搜索市场库、无陌生人匹配；所有对决以邀请链接/二维码进入并在受邀范围内可见。
- 资金路径采用 Solana 上 USDC 的转账作为结算载体；由后端服务执行收款、分账、退款等动作，并以数据库账本与状态机保证幂等与可审计。
- 前端采用 Next.js + React 实现页面与交互；TanStack Query 管理服务端数据同步；Zustand 仅承载 UI 状态；Zod 负责输入校验；Tailwind 负责样式一致性。
- 数据层采用 PostgreSQL + Drizzle ORM；drizzle-kit 负责迁移；通过作业/队列处理链上确认、重试与对账，确保资金动作可恢复与可追踪。
- 钱包连接采用 WalletConnect（Solana 钱包）；所有资金动作由用户侧签名授权或按既定授权策略执行，前端不实现任何交易、撮合、赔率展示或引导。

---

## 10.0 风险与取舍︱Risks & Trade‑offs
- 风险 1：资金安全与结算一致性风险（链上确认延迟、失败重试、重复分账、对账偏差、密钥管理）。
  - 取舍：不引入复杂链上合约与交易系统；采用“后端转账 + 账本 + 幂等键 + 对账作业”降低实现复杂度，同时通过权限隔离与审计日志提高可控性。
- 风险 2：用户创建 market 导致内容污染与争议结算风险。
  - 取舍：默认私密传播；字段受限；提供最小冻结/下架/拒绝结算能力；保留争议窗口；牺牲开放性换取可控验证。
- 风险 3：实时聊天的滥用与合规内容风险。
  - 取舍：仅实现最小频率限制、可见范围隔离、审计记录与封禁入口；不投入复杂内容审核与推荐系统。
- 风险 4：链上体验波动导致转化下降。
  - 取舍：以清晰状态（pending/confirmed/failed）、超时处理、自动退款与可重试交互替代追求即时完成。

---

## 11.0 退出／并入路径︱Exit & Integration Path
- 成功路径：
  - 将结算/对账/风控从 Next.js API 拆分为独立后端服务与队列作业，形成可水平扩展的资金处理流水线。
  - 引入更严格的签名与密钥治理（分层权限、短期凭证、可替换签名器），并保持数据库模型与 API 兼容，确保可平滑迁移。
- 失败路径：
  - 立即冻结新 market 创建与新入池；对未结算对战执行自动退款；导出账本、审计与对账报告用于复盘。
  - 按最小化原则清理非必要业务数据，保留资金相关账本与审计记录以满足追溯与合规需求。

---

## 12.0 审查门︱Review Gate
- Gate 1（第 2 周末）：
  - 邀请打开 -> 钱包连接 -> 入池成功 的分段转化是否达到继续投入阈值。
  - 结算失败率与退款率是否处于可控范围；若不可控，冻结新增功能，优先修复资金与状态一致性。
- Gate 2（第 4 周末）：
  - 邀请传播是否带来可复用增长与重复对决；手续费收入是否覆盖当周可变成本并呈上升趋势。
  - 若关键假设不成立，进入止损流程并停止扩展范围。

---

## 13.0 指标设计︱Metrics Design
- 指标 1：漏斗转化（邀请打开数、钱包连接数、入池成功数、结算完成数），按渠道/设备/市场类型拆分。
- 指标 2：收入与健康度（总入池金额、手续费收入、结算成功率、退款率、链上确认耗时分布）。
- 指标 3：留存与复用（发起者复发率、每个发起者带来的受邀参与者数量、每周人均对决次数）。
- 指标 4：风险与滥用（创建 market 失败率、冻结/下架比例、聊天限流触发率、异常交易重试次数）。

---

## 14.0 验收标准︱Acceptance Criteria
- 端到端闭环可用：
  - 用户创建 market（受限字段、默认私密）-> 发起对决并生成邀请链接/二维码 -> 受邀用户加入并 USDC 入池 -> 到期关闭 -> 触发结算 -> 自动分账与结果展示。
- 资金与状态一致：
  - 同一对战在任意重试/异常下只能结算一次；账本与链上交易可对账；失败可自动退款且原因可追溯。
- 负面能力生效：
  - 无公开大厅、无赔率/隐含概率展示、无入池后换边、关闭后不可再入池；聊天仅在对战页可见并具备基础限流与审计。

---

## 15.0 系统范围与交付定义︱Definition of Done

### 4个本阶段必须交付
- 用户创建 market：标题、双方选项、结算时间、最小 stake、手续费；默认私密；生成邀请链接/二维码；支持冻结/下架/拒绝结算。
- USDC 入池与结算：最小 stake/关闭时间/手续费；入池确认；结算分账；退款；账本与幂等；基础对账。
- 对战页：状态展示、倒计时、参与者与入池金额、加入流程、实时聊天、结果页与分享卡片。
- Admin 最小后台：market/duel 列表、冻结/下架、触发结算/退款、审计查询、对账概览与告警入口。

### 4个明确不纳入本阶段
- 公开大厅、陌生人匹配、公开可搜索市场库、推荐与榜单。
- 赔率/隐含概率展示、订单簿/撮合/交易、二级市场、基于池子变化的引导或推荐。
- 法币充值/出金、信用卡支付、复杂 KYC/AML 流程（仅保留可扩展接口位，不实现完整流程）。
- 高级内容审核系统、复杂聊天室（语音/视频/贴纸）、复杂社交关系链与动态流。

---

## 16.0 用户类型与角色设计︱User & Role Design
- End User：
  - 创建 market、发起/加入私密对战、入池、查看对战与结果、在对战页聊天。
- Admin：
  - 冻结/下架 market、拒绝结算、处理争议、触发结算/退款、查看审计与对账信息。
- System Worker（内部作业角色）：
  - 链上交易发送与确认、幂等重试、对账、超时自动退款、告警推送。

---

## 17.0 核心用户流程︱User Flow
- 邀请进入：
  - 用户打开邀请链接/扫码进入私密落地页，查看 market/duel 摘要与倒计时。
- 钱包连接：
  - 通过 WalletConnect 连接 Solana 钱包；绑定用户与钱包地址。
- 创建 market：
  - 输入标题、双方选项、结算时间、最小 stake、手续费；创建成功后获得 market 详情与邀请链接/二维码。
- 发起对战：
  - 选择阵营与 stake，创建对战实例并进入对战页；对战进入 open/active 状态。
- 受邀加入并入池：
  - 受邀用户选择阵营与 stake 入池；链上确认后入池成功；对战在关闭时间前保持 active。
- 对战页互动：
  - 在对战页聊天；查看参与者、入池金额、关闭倒计时与资金状态。
- 关闭与结算：
  - 关闭时间到达后对战进入 closed；触发结算进入 resolving；完成分账后进入 resolved 并展示结果。
- 异常与退款：
  - 链上失败、超时或争议时进入 refunding；退款完成后进入 refunded 并展示原因与记录。

---

## 18.0 核心业务逻辑︱Core Business Logic
- 入池三约束：
  - Minimum Stake：入池金额不得低于 market 设定的最小值。
  - Pool Close Time：关闭时间后拒绝任何入池请求。
  - Fees：按手续费比例从总池中扣除平台费用。
- 行为护栏：
  - 入池后不可换边；关闭后不可再入池；不展示赔率、隐含概率；不根据池子变化提示“更优选择”。
- 结算规则：
  - 可分配金额 = 总池金额 - 手续费金额。
  - 单个赢家收益 = 可分配金额 ×（该赢家 stake / 总赢家 stake）。
  - 结算必须幂等：同一 duel_id 只能产生一次“结算账本记录 + 链上分账交易组”。
- 争议与人工处置：
  - 提供最小争议窗口；在结算前可冻结对战或拒绝结算；结算后如需补偿，仅允许追加 adjustment 账本记录并关联链上交易。
- 聊天规则：
  - 文本消息；按 duel_id 隔离；仅对对战相关用户可见；服务端频率限制与审计记录；支持封禁与删除消息的最小管理动作。

# design.md

## 17.0 数据库架构︱Database Schema

表达形式：Drizzle schema（PostgreSQL）

### 设计原则
- 仅存储支撑「邀请制私密对决 + USDC 入池与结算 + 指标与审计」所需的最小数据集。
- 不存储赔率、隐含概率、实时引导信息；不支持入池后换边；关闭后拒绝入池。
- 资金相关写入必须可审计、可对账、可幂等重试：以 ledger_entry + chain_tx + audit_log 形成闭环。

### Drizzle Schema（PostgreSQL）

```ts
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Enums
 */
export const userStatus = pgEnum("user_status", ["active", "banned", "deleted"]);
export const marketStatus = pgEnum("market_status", [
  "draft",
  "active",
  "frozen",
  "resolved",
  "cancelled",
]);
export const reviewStatus = pgEnum("review_status", ["none", "pending", "approved", "rejected"]);
export const duelStatus = pgEnum("duel_status", [
  "draft",
  "open",
  "closed",
  "resolving",
  "resolved",
  "cancelled",
  "refunding",
  "refunded",
  "expired",
]);
export const duelVisibility = pgEnum("duel_visibility", ["private"]);
export const sideEnum = pgEnum("duel_side", ["A", "B"]);
export const chainNetwork = pgEnum("chain_network", ["solana"]);
export const chainTxType = pgEnum("chain_tx_type", ["deposit", "payout", "refund", "fee", "adjustment"]);
export const chainTxStatus = pgEnum("chain_tx_status", ["submitted", "confirmed", "failed"]);
export const ledgerType = pgEnum("ledger_type", ["deposit", "fee", "payout", "refund", "adjustment"]);
export const actorType = pgEnum("actor_type", ["user", "admin", "worker", "system"]);
export const entityType = pgEnum("entity_type", [
  "user_account",
  "invite",
  "market",
  "duel",
  "duel_participant",
  "settlement",
  "ledger_entry",
  "chain_tx",
  "chat_message",
]);

/**
 * user_account
 * 目的：支撑钱包身份唯一性锚点、邀请归因与基本封禁控制
 */
export const userAccount = pgTable(
  "user_account",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    walletAddress: text("wallet_address").notNull(),
    displayName: text("display_name"),
    status: userStatus("status").notNull().default("active"),
    invitedByUserId: uuid("invited_by_user_id").references(() => userAccount.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    walletAddrUq: uniqueIndex("uq_user_wallet").on(t.walletAddress),
    invitedByIdx: index("idx_user_invited_by").on(t.invitedByUserId),
  }),
);

/**
 * invite
 * 目的：支撑邀请制访问、链接打开/接受漏斗指标与防枚举
 */
export const invite = pgTable(
  "invite",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    token: text("token").notNull(), // 不可预测 token
    createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedUserId: uuid("accepted_user_id").references(() => userAccount.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`), // 渠道/投放/来源信息（最小）
  },
  (t) => ({
    tokenUq: uniqueIndex("uq_invite_token").on(t.token),
    createdByIdx: index("idx_invite_created_by").on(t.createdByUserId),
    openedIdx: index("idx_invite_opened_at").on(t.openedAt),
  }),
);

/**
 * market
 * 目的：支撑用户创建 market 的受限字段、最小审核/冻结/下架，以及结算时间与费率等约束
 */
export const market = pgTable(
  "market",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),

    title: text("title").notNull(),
    optionALabel: text("option_a_label").notNull(),
    optionBLabel: text("option_b_label").notNull(),

    resolutionAt: timestamp("resolution_at", { withTimezone: true }).notNull(),
    minStake: numeric("min_stake", { precision: 20, scale: 6 }).notNull(), // USDC 最小入池
    feeBps: integer("fee_bps").notNull(), // 平台手续费 bps（例如 200 = 2.00%）

    status: marketStatus("status").notNull().default("active"),
    review: reviewStatus("review_status").notNull().default("none"),
    frozenAt: timestamp("frozen_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdByIdx: index("idx_market_created_by").on(t.createdByUserId),
    statusIdx: index("idx_market_status").on(t.status),
    resolutionIdx: index("idx_market_resolution_at").on(t.resolutionAt),
  }),
);

/**
 * duel
 * 目的：对决/池子实例（私密分享），承载关闭时间、状态机、邀请 token 与可见范围隔离
 */
export const duel = pgTable(
  "duel",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    marketId: uuid("market_id").notNull().references(() => market.id),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),

    visibility: duelVisibility("visibility").notNull().default("private"),
    inviteToken: text("invite_token").notNull(), // 进入对决房间的 token
    inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),

    closeAt: timestamp("close_at", { withTimezone: true }).notNull(), // Pool Close Time
    status: duelStatus("status").notNull().default("open"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    // 聚合快照（不用于引导，仅用于展示与性能；最终以 ledger/participants 为准）
    totalStakeA: numeric("total_stake_a", { precision: 20, scale: 6 }).notNull().default("0"),
    totalStakeB: numeric("total_stake_b", { precision: 20, scale: 6 }).notNull().default("0"),
    participantCount: integer("participant_count").notNull().default(0),

    // 幂等与并发控制
    version: integer("version").notNull().default(0),
  },
  (t) => ({
    inviteUq: uniqueIndex("uq_duel_invite_token").on(t.inviteToken),
    marketIdx: index("idx_duel_market").on(t.marketId),
    statusIdx: index("idx_duel_status").on(t.status),
    closeAtIdx: index("idx_duel_close_at").on(t.closeAt),
  }),
);

/**
 * duel_participant
 * 目的：记录用户在某个对决中的阵营与入池金额；禁止换边由业务逻辑保证（写入后不更新 side）
 */
export const duelParticipant = pgTable(
  "duel_participant",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    duelId: uuid("duel_id").notNull().references(() => duel.id),
    userId: uuid("user_id").notNull().references(() => userAccount.id),

    side: sideEnum("side").notNull(), // A/B
    stakeAmount: numeric("stake_amount", { precision: 20, scale: 6 }).notNull(),

    depositChainTxId: uuid("deposit_chain_tx_id").references(() => chainTx.id),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),

    status: text("status").notNull().default("active"), // active/cancelled/refunded（最小字符串，避免过度建模）
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => ({
    duelUserUq: uniqueIndex("uq_duel_participant_duel_user").on(t.duelId, t.userId),
    duelIdx: index("idx_duel_participant_duel").on(t.duelId),
    userIdx: index("idx_duel_participant_user").on(t.userId),
  }),
);

/**
 * chain_tx
 * 目的：链上交易跟踪（deposit/payout/refund/fee/adjustment），用于对账与重试
 */
export const chainTx = pgTable(
  "chain_tx",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

    network: chainNetwork("network").notNull().default("solana"),
    txType: chainTxType("tx_type").notNull(),
    status: chainTxStatus("status").notNull().default("submitted"),

    signature: text("signature"), // Solana tx signature（可能先为空，后补）
    idempotencyKey: text("idempotency_key").notNull(), // 幂等键：避免重复发送

    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),
    amount: numeric("amount", { precision: 20, scale: 6 }).notNull(), // USDC
    tokenMint: text("token_mint").notNull(), // USDC mint address

    relatedEntityType: entityType("related_entity_type").notNull(),
    relatedEntityId: uuid("related_entity_id").notNull(),

    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    error: text("error"),

    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    idemUq: uniqueIndex("uq_chain_tx_idempotency").on(t.idempotencyKey),
    sigUq: uniqueIndex("uq_chain_tx_signature").on(t.signature),
    statusIdx: index("idx_chain_tx_status").on(t.status),
    entityIdx: index("idx_chain_tx_entity").on(t.relatedEntityType, t.relatedEntityId),
  }),
);

/**
 * ledger_entry
 * 目的：资金账本（平台视角），每个资金动作都应落一条账本记录，并关联 chain_tx
 */
export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

    duelId: uuid("duel_id").references(() => duel.id),
    userId: uuid("user_id").references(() => userAccount.id),

    entryType: ledgerType("entry_type").notNull(),
    amount: numeric("amount", { precision: 20, scale: 6 }).notNull(), // 正数表示入账/出账按 entryType 解释
    currency: text("currency").notNull().default("USDC"),

    chainTxId: uuid("chain_tx_id").references(() => chainTx.id),
    idempotencyKey: text("idempotency_key").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    idemUq: uniqueIndex("uq_ledger_idempotency").on(t.idempotencyKey),
    duelIdx: index("idx_ledger_duel").on(t.duelId),
    userIdx: index("idx_ledger_user").on(t.userId),
    typeIdx: index("idx_ledger_type").on(t.entryType),
  }),
);

/**
 * settlement
 * 目的：记录结算决策（winning side、手续费、争议窗口、触发者），并作为 payout 的父对象
 */
export const settlement = pgTable(
  "settlement",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    duelId: uuid("duel_id").notNull().references(() => duel.id),

    winningSide: sideEnum("winning_side").notNull(),
    feeAmount: numeric("fee_amount", { precision: 20, scale: 6 }).notNull(),
    distributableAmount: numeric("distributable_amount", { precision: 20, scale: 6 }).notNull(),

    decidedByActorType: actorType("decided_by_actor_type").notNull(),
    decidedByActorId: uuid("decided_by_actor_id"), // user/admin/worker
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),

    disputeWindowEndsAt: timestamp("dispute_window_ends_at", { withTimezone: true }),
    status: text("status").notNull().default("final"), // final/reopened（最小）

    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    duelUq: uniqueIndex("uq_settlement_duel").on(t.duelId), // 一个 duel 只能有一条最终 settlement（重开用 status + audit 控制）
    duelIdx: index("idx_settlement_duel").on(t.duelId),
  }),
);

/**
 * payout
 * 目的：记录每个参与者在结算后的分账结果与链上交易关联
 */
export const payout = pgTable(
  "payout",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    settlementId: uuid("settlement_id").notNull().references(() => settlement.id),
    duelParticipantId: uuid("duel_participant_id").notNull().references(() => duelParticipant.id),

    payoutAmount: numeric("payout_amount", { precision: 20, scale: 6 }).notNull(),
    payoutChainTxId: uuid("payout_chain_tx_id").references(() => chainTx.id),

    status: text("status").notNull().default("pending"), // pending/paid/failed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    error: text("error"),
  },
  (t) => ({
    settlementIdx: index("idx_payout_settlement").on(t.settlementId),
    participantUq: uniqueIndex("uq_payout_participant").on(t.settlementId, t.duelParticipantId),
  }),
);

/**
 * chat_message
 * 目的：对战页文本聊天（最小化），可审计、可删除、可限流（限流由服务层实现）
 */
export const chatMessage = pgTable(
  "chat_message",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    duelId: uuid("duel_id").notNull().references(() => duel.id),
    userId: uuid("user_id").notNull().references(() => userAccount.id),

    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedByActorType: actorType("deleted_by_actor_type"),
    deletedByActorId: uuid("deleted_by_actor_id"),

    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
  },
  (t) => ({
    duelIdx: index("idx_chat_duel").on(t.duelId),
    createdAtIdx: index("idx_chat_created_at").on(t.createdAt),
  }),
);

/**
 * audit_log
 * 目的：记录关键状态与资金相关的变更，支持追溯、排障与合规审计
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

    actorType: actorType("actor_type").notNull(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),

    entityType: entityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    requestId: text("request_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),

    before: jsonb("before").notNull().default(sql`'{}'::jsonb`),
    after: jsonb("after").notNull().default(sql`'{}'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("idx_audit_entity").on(t.entityType, t.entityId),
    actorIdx: index("idx_audit_actor").on(t.actorType, t.actorId),
    createdAtIdx: index("idx_audit_created_at").on(t.createdAt),
  }),
);

# design.md

## 18.0 页面与视图列表 ︱Page & View List

### 页面：access（邀请制访问入口）
- 页面类型: End User Page
- 页面职责：承载邀请制访问与进入产品闭环的第一步，向受邀用户展示对决/市场摘要并引导进入钱包连接与加入流程
- 明确边界：本 Page 不展示任何赔率、隐含概率或基于入池变化的引导信息；不提供公开可搜索入口；不提供陌生人匹配
- 本阶段允许的 Views：invite_landing, invite_expired, invite_invalid
- 明确禁止的 Views：public_lobby, market_search, suggested_duels, odds_display, implied_probability

#### Zustand: UI 状态存储︱UI Store Design（如需要）
- 预期效果：降低邀请落地页内跨状态切换复杂度（加载、校验、跳转、错误展示）
- 数据写入：invite(openedAt), audit_log(action=invite_opened)

#### 视图：invite_landing
- 页面：access
- 预期效果：受邀用户在单页内理解“这是私密对决/私密市场邀请”，并进入下一步钱包连接或加入对决
- 禁止边界：不展示或计算赔率/胜率；不展示任何“更优选择”；不暴露参与者隐私信息（仅显示必要摘要）
- UI载体：标题与摘要区（market/duel）、倒计时（closeAt）、主要按钮（连接钱包 / 继续加入）、错误提示区域
- 用户触发方式：打开邀请链接/扫码进入
- 前端状态变化：idle → loading_summary → ready → routing
 error
- 失败路径：token 不存在/不可解析、邀请已过期、对决已关闭或已结算、后端校验失败、网络失败
- 数据读取：invite(token, expiresAt, openedAt, acceptedAt), duel(inviteToken, inviteExpiresAt, closeAt, status, totalStakeA, totalStakeB, participantCount), market(title, optionALabel, optionBLabel, minStake, feeBps, resolutionAt, status)
- 数据写入：invite(openedAt), audit_log(entityType=invite, action=OPEN, after=summary)

#### 视图：invite_expired
- 页面：access
- 预期效果：明确告知邀请已过期或对决不可加入，并提供返回或联系发起者的最小指引
- 禁止边界：不提供替代公开入口；不引导加入其他对决
- UI载体：状态说明、发起者提示（如可显示 displayName）、返回按钮
- 用户触发方式：打开已过期链接或 closeAt 后访问
- 前端状态变化：idle → loading → ready
- 失败路径：网络失败
- 数据读取：invite(expiresAt), duel(status, closeAt)
- 数据写入：audit_log(action=INVITE_EXPIRED_VIEW)

#### 视图：invite_invalid
- 页面：access
- 预期效果：对无效 token 给出一致的安全错误页，避免泄露系统存在性与可枚举性
- 禁止边界：不暴露 token 校验细节；不提示任何可被用于枚举的信息
- UI载体：通用错误说明、返回按钮
- 用户触发方式：打开无效链接
- 前端状态变化：idle → loading → ready
- 失败路径：网络失败
- 数据读取：无（或仅服务端校验结果）
- 数据写入：audit_log(action=INVITE_INVALID_VIEW)


---

### 页面：wallet（钱包连接与授权）
- 页面类型: End User Page
- 页面职责：完成 WalletConnect 连接、建立 user_account 锚点，并为后续入池/结算的签名授权做准备
- 明确边界：本 Page 不执行任何资金转账；不提供法币充值/出金；不展示或引导任何交易型行为
- 本阶段允许的 Views：wallet_connect, wallet_bind_result
- 明确禁止的 Views：fiat_onramp, card_payment, kyc_flow, portfolio, trading

#### Zustand: UI 状态存储︱UI Store Design（如需要）
- 预期效果：在连接过程中统一管理连接状态、错误码与重试
- 数据写入：user_account(walletAddress, invitedByUserId), audit_log(action=WALLET_CONNECTED)

#### 视图：wallet_connect
- 页面：wallet
- 预期效果：用户在 60 秒内完成钱包连接并返回业务流程（创建市场/加入对决）
- 禁止边界：不自动发起资金授权或转账；不展示余额引导；不保存私钥或敏感签名材料
- UI载体：钱包选择器、连接按钮、加载状态、错误提示
- 用户触发方式：点击“连接钱包”
- 前端状态变化：idle → connecting → connected → routing
 error
- 失败路径：用户拒绝连接、钱包不可用、WalletConnect 超时、网络失败
- 数据读取：invite(acceptedAt, createdByUserId)（用于邀请归因，若来源于邀请落地）
- 数据写入：user_account(walletAddress, invitedByUserId), audit_log(entityType=user_account, action=CREATE_OR_BIND)

#### 视图：wallet_bind_result
- 页面：wallet
- 预期效果：展示连接成功/失败的最小结果，并将用户路由回上一步流程
- 禁止边界：不展示敏感链上信息；不提示可枚举的内部错误细节
- UI载体：成功/失败提示、继续按钮
- 用户触发方式：连接完成后自动进入
- 前端状态变化：idle → ready
- 失败路径：无（失败在 wallet_connect 处理）
- 数据读取：user_account(status)
- 数据写入：audit_log(action=WALLET_BIND_RESULT_VIEW)


---

### 页面：market（市场创建与详情）
- 页面类型: End User Page
- 页面职责：提供用户创建 market 的受限输入与校验，并展示 market 详情以支持发起对决与邀请传播
- 明确边界：不提供公开市场库；不提供可搜索/推荐/榜单；不提供复杂内容审核；仅实现字段受限与最小冻结/下架反馈
- 本阶段允许的 Views：market_create, market_detail
- 明确禁止的 Views：market_public_index, market_search, market_recommendation, market_edit, market_trending

#### Zustand: UI 状态存储︱UI Store Design（如需要）
- 预期效果：在创建表单内管理字段、校验错误与提交状态
- 数据写入：market(...), audit_log(action=MARKET_CREATED)

#### 视图：market_create
- 页面：market
- 预期效果：用户提交受限字段创建 market，并获得可用于私密传播的市场入口（后续可发起对决/生成邀请）
- 禁止边界：不允许自由文本扩展到超出字段约束；不支持复杂模板与批量创建；不允许创建公开可搜索市场
- UI载体：标题输入、A/B 选项输入、结算时间选择、最小 stake、手续费设置、提交按钮、错误提示
- 用户触发方式：点击“创建市场”
- 前端状态变化：idle → validating → submitting → success
 error
- 失败路径：字段校验失败（空值、长度、非法字符）、结算时间不合法、手续费超界、后端风控拒绝、网络失败
- 数据读取：user_account(id, status)
- 数据写入：market(createdByUserId, title, optionALabel, optionBLabel, resolutionAt, minStake, feeBps, status=active, review=none), audit_log(entityType=market, action=CREATE)

#### 视图：market_detail
- 页面：market
- 预期效果：展示 market 受限摘要，并提供发起对决入口；为邀请传播提供可分享信息（链接/二维码可由对决页面生成）
- 禁止边界：不展示赔率/隐含概率；不展示基于池子变化的引导；不显示他人可识别隐私
- UI载体：标题与选项、规则摘要（minStake/fee/resolveAt）、发起对决按钮、状态提示（active/frozen/cancelled/resolved）
- 用户触发方式：进入 /market/{id}
- 前端状态变化：idle → loading → ready
 error
- 失败路径：market 不存在、被下架/冻结、网络失败
- 数据读取：market(id, title, optionALabel, optionBLabel, resolutionAt, minStake, feeBps, status, review)
- 数据写入：audit_log(action=MARKET_DETAIL_VIEW)


---

### 页面：duel（对决创建、加入、房间与结算展示）
- 页面类型: End User Page
- 页面职责：承载对决从创建到加入入池、对战页聊天、结果展示与分享卡的最小闭环
- 明确边界：不提供公开大厅；不提供陌生人匹配；不展示赔率/隐含概率；不支持入池后换边；关闭后拒绝入池
- 本阶段允许的 Views：duel_create, duel_invite_join, duel_room, duel_result
- 明确禁止的 Views：open_lobby, side_switch, post_close_deposit, odds_display, auto_recommendation

#### Zustand: UI 状态存储︱UI Store Design（如需要）
- 预期效果：统一管理对决房间 UI 状态（倒计时、聊天输入、发送中、错误提示、分享面板开关）
- 数据写入：chat_message, audit_log(action=CHAT_SENT/VIEW_ROOM)

#### 视图：duel_create
- 页面：duel
- 预期效果：用户基于某 market 选择阵营与 stake，创建私密对决实例并生成邀请链接/二维码
- 禁止边界：不允许创建公开对决；不提供任何基于当前入池金额的“更优选择”；不展示对手信息（未加入前）
- UI载体：阵营选择、stake 输入/选择、关闭时间设置（closeAt）、创建按钮、生成邀请链接与二维码、错误提示
- 用户触发方式：在 market_detail 点击“发起对决”
- 前端状态变化：idle → validating → submitting → success
 error
- 失败路径：stake 低于 minStake、closeAt 不合法（过短/已过期）、钱包未连接、签名失败、后端创建失败、网络失败
- 数据读取：market(id, minStake, feeBps, resolutionAt, status), user_account(id, walletAddress, status)
- 数据写入：duel(marketId, createdByUserId, visibility=private, inviteToken, inviteExpiresAt, closeAt, status=open), audit_log(entityType=duel, action=CREATE)

#### 视图：duel_invite_join
- 页面：duel
- 预期效果：受邀用户在对决关闭前选择阵营与 stake 完成入池，并进入对战页
- 禁止边界：不允许入池后换边；不允许关闭后入池；不展示赔率/隐含概率；不显示“更优选择”
- UI载体：对决摘要、阵营选择、stake 输入/选择、加入按钮、链上/资金状态提示、错误提示
- 用户触发方式：打开对决邀请链接（或从 access 页面继续）
- 前端状态变化：idle → loading_summary → validating → submitting_deposit → pending_confirm → success
 error
- 失败路径：closeAt 已到、对决已结算/取消/退款中、stake 低于 minStake、用户重复加入、签名拒绝、链上确认超时/失败、网络失败
- 数据读取：duel(inviteToken, closeAt, status, totalStakeA, totalStakeB, participantCount), market(minStake, feeBps, status), duel_participant(duelId, userId), user_account(walletAddress)
- 数据写入：duel_participant(duelId, userId, side, stakeAmount, joinedAt), chain_tx(txType=deposit, idempotencyKey, from/to/amount, status=submitted), ledger_entry(entryType=deposit, amount, idempotencyKey), audit_log(action=JOIN_AND_DEPOSIT)

#### 视图：duel_room
- 页面：duel
- 预期效果：在对战页内展示对决状态、倒计时、参与概览与文本聊天；对决关闭后保持只读直到结果公布
- 禁止边界：不展示赔率/隐含概率；不提供交易/撮合；不允许换边或追加入池（若本阶段限定一次性入池）；不提供复杂社交功能
- UI载体：状态栏（open/closed/resolving/resolved/refunding）、倒计时、阵营与入池概览、聊天列表、聊天输入框、分享面板入口
- 用户触发方式：创建/加入成功后自动进入
- 前端状态变化：idle → loading → ready
 sending_message
 error
- 失败路径：无权限访问（非受邀范围）、对决不存在、网络失败、聊天发送失败、被封禁
- 数据读取：duel(status, closeAt, totals, participantCount), duel_participant(userId, side, stakeAmount), chat_message(duelId, createdAt, message, deletedAt), settlement(status)
- 数据写入：chat_message(duelId, userId, message), audit_log(action=VIEW_ROOM/SEND_MESSAGE)

#### 视图：duel_result
- 页面：duel
- 预期效果：展示结算结果（赢家/输家、手续费、个人收益）、链上状态与可分享结果卡；失败则展示退款/异常原因
- 禁止边界：不展示历史“赔率曲线”；不提供二次交易入口；不提供自动复投与推荐
- UI载体：结果摘要、收益明细、链上状态提示、分享卡生成按钮、问题反馈入口
- 用户触发方式：对决进入 resolved/refunded 后自动跳转或手动进入
- 前端状态变化：idle → loading → ready
 error
- 失败路径：结算数据缺失、对账未完成、网络失败
- 数据读取：settlement(winningSide, feeAmount, distributableAmount, decidedAt, disputeWindowEndsAt), payout(payoutAmount, status), chain_tx(signature, status), ledger_entry(entries), duel(status)
- 数据写入：audit_log(action=VIEW_RESULT)


---

### 页面：admin（后台管理）
- 页面类型: Admin Page
- 页面职责：提供最小化的 market/duel 管理、冻结/下架、触发结算/退款、审计与对账概览入口
- 明确边界：不实现复杂工作流与权限体系（仅最小角色与操作审计）；不进行批量运营工具；不提供内容推荐与公开分发
- 本阶段允许的 Views：admin_market_list, admin_market_action, admin_duel_list, admin_settlement_action, admin_refund_action, admin_audit_search, admin_reconcile_overview
- 明确禁止的 Views：ops_campaign_tooling, public_content_distribution, advanced_risk_scoring, full_iam_console

#### Zustand: UI 状态存储︱UI Store Design（如需要）
- 预期效果：统一管理筛选条件、批注输入与操作结果提示，避免误操作
- 数据写入：audit_log(action=ADMIN_ACTION_*)

#### 视图：admin_market_list
- 页面：admin
- 预期效果：查看 market 列表与状态（active/frozen/cancelled/resolved），并进入单项处置
- 禁止边界：不提供复杂审核队列与多级审批
- UI载体：列表、筛选（状态/时间/创建者）、进入详情按钮
- 用户触发方式：管理员进入后台
- 前端状态变化：idle → loading → ready
 error
- 失败路径：无权限、网络失败
- 数据读取：market(id, title, status, review, createdByUserId, createdAt, resolutionAt)
- 数据写入：audit_log(action=ADMIN_VIEW_MARKET_LIST)

#### 视图：admin_market_action
- 页面：admin
- 预期效果：对单个 market 执行冻结/下架/恢复（最小），并记录审计
- 禁止边界：不进行内容编辑；不进行复杂争议裁决流程
- UI载体：市场摘要、状态、操作按钮（freeze/cancel/restore）、备注输入、结果提示
- 用户触发方式：在 market_list 点击进入
- 前端状态变化：idle → loading → ready → submitting → success
 error
- 失败路径：并发冲突、状态不允许、网络失败
- 数据读取：market(status, review, frozenAt, cancelledAt)
- 数据写入：market(status 变更), audit_log(entityType=market, action=FREEZE/CANCEL/RESTORE, before/after)

#### 视图：admin_duel_list
- 页面：admin
- 预期效果：查看 duel 列表与关键状态（open/closed/resolving/resolved/refunding/refunded），并进入结算/退款处置
- 禁止边界：不提供公开曝光入口；不提供复杂 KPI 看板
- UI载体：列表、筛选（状态/closeAt/marketId）、进入操作按钮
- 用户触发方式：管理员选择 duel 管理
- 前端状态变化：idle → loading → ready
 error
- 失败路径：无权限、网络失败
- 数据读取：duel(id, marketId, status, closeAt, totals, participantCount, createdAt), market(title)
- 数据写入：audit_log(action=ADMIN_VIEW_DUEL_LIST)

#### 视图：admin_settlement_action
- 页面：admin
- 预期效果：对 closed 的 duel 触发结算决策（winningSide），生成 settlement 与 payout 任务，并记录审计
- 禁止边界：不允许重复结算；不允许跳过幂等与对账；不允许基于聊天内容自动判定
- UI载体：对决摘要、参与与入池汇总、选择 winningSide、触发按钮、进度/错误提示
- 用户触发方式：在 duel_list 进入某 duel
- 前端状态变化：idle → loading → ready → submitting → success
 error
- 失败路径：duel 状态不允许、幂等冲突、链上交易失败、网络失败
- 数据读取：duel(status, totals, closeAt), duel_participant(list), ledger_entry(deposit/fee), chain_tx(status)
- 数据写入：settlement, payout, chain_tx(txType=payout/fee), ledger_entry(entryType=fee/payout), audit_log(action=ADMIN_TRIGGER_SETTLEMENT)

#### 视图：admin_refund_action
- 页面：admin
- 预期效果：对异常 duel 触发退款流程，生成 refund 交易与账本记录，并记录审计
- 禁止边界：不允许在已最终结算后直接覆写结果；如需补偿仅允许追加 adjustment
- UI载体：对决摘要、退款原因选择/备注、触发退款按钮、进度提示
- 用户触发方式：在 duel_list 进入某 duel
- 前端状态变化：idle → loading → ready → submitting → success
 error
- 失败路径：状态不允许、部分退款失败、链上失败、网络失败
- 数据读取：duel(status), duel_participant(list), ledger_entry(list), chain_tx(list)
- 数据写入：chain_tx(txType=refund), ledger_entry(entryType=refund), audit_log(action=ADMIN_TRIGGER_REFUND)

#### 视图：admin_audit_search
- 页面：admin
- 预期效果：按实体与时间检索关键审计记录以支持追溯与排障
- 禁止边界：不提供任意用户隐私数据导出；不提供全量下载
- UI载体：筛选器（entityType/entityId/action/timeRange）、结果列表、详情展开
- 用户触发方式：管理员进入审计查询
- 前端状态变化：idle → loading → ready
 error
- 失败路径：无权限、网络失败
- 数据读取：audit_log(filters)
- 数据写入：audit_log(action=ADMIN_VIEW_AUDIT)

#### 视图：admin_reconcile_overview
- 页面：admin
- 预期效果：展示最小对账概览（待确认交易数、失败交易数、重试队列长度、异常 duel 数），作为风险控制入口
- 禁止边界：不实现复杂风控评分或自动处置
- UI载体：统计卡片、异常列表、跳转到具体 duel/tx
- 用户触发方式：管理员进入对账概览
- 前端状态变化：idle → loading → ready
 error
- 失败路径：网络失败
- 数据读取：chain_tx(status 分布), duel(status 分布), ledger_entry(待处理标记), payout(status)
- 数据写入：audit_log(action=ADMIN_VIEW_RECONCILE_OVERVIEW)
