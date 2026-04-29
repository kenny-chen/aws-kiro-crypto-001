import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ──

export const userStatus = pgEnum("user_status", ["active", "banned", "deleted"]);
export const marketStatus = pgEnum("market_status", [
  "draft", "active", "frozen", "resolved", "cancelled",
]);
export const reviewStatus = pgEnum("review_status", ["none", "pending", "approved", "rejected"]);
export const duelStatus = pgEnum("duel_status", [
  "draft", "open", "closed", "resolving", "resolved", "cancelled", "refunding", "refunded", "expired",
]);
export const duelVisibility = pgEnum("duel_visibility", ["private"]);
export const sideEnum = pgEnum("duel_side", ["A", "B"]);
export const chainNetwork = pgEnum("chain_network", ["solana"]);
export const chainTxType = pgEnum("chain_tx_type", ["deposit", "payout", "refund", "fee", "adjustment"]);
export const chainTxStatus = pgEnum("chain_tx_status", ["submitted", "confirmed", "failed"]);
export const ledgerType = pgEnum("ledger_type", ["deposit", "fee", "payout", "refund", "adjustment"]);
export const actorType = pgEnum("actor_type", ["user", "admin", "worker", "system"]);
export const entityType = pgEnum("entity_type", [
  "user_account", "invite", "market", "duel", "duel_participant",
  "settlement", "ledger_entry", "chain_tx", "chat_message",
]);

// ── user_account ──

export const userAccount = pgTable("user_account", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  status: userStatus("status").notNull().default("active"),
  invitedByUserId: uuid("invited_by_user_id").references((): any => userAccount.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({
  walletAddrUq: uniqueIndex("uq_user_wallet").on(t.walletAddress),
  invitedByIdx: index("idx_user_invited_by").on(t.invitedByUserId),
}));

// ── invite ──

export const invite = pgTable("invite", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull(),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedUserId: uuid("accepted_user_id").references(() => userAccount.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  tokenUq: uniqueIndex("uq_invite_token").on(t.token),
  createdByIdx: index("idx_invite_created_by").on(t.createdByUserId),
  openedIdx: index("idx_invite_opened_at").on(t.openedAt),
}));

// ── market ──

export const market = pgTable("market", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),
  title: text("title").notNull(),
  optionALabel: text("option_a_label").notNull(),
  optionBLabel: text("option_b_label").notNull(),
  resolutionAt: timestamp("resolution_at", { withTimezone: true }).notNull(),
  minStake: numeric("min_stake", { precision: 20, scale: 6 }).notNull(),
  feeBps: integer("fee_bps").notNull(),
  status: marketStatus("status").notNull().default("active"),
  review: reviewStatus("review_status").notNull().default("none"),
  frozenAt: timestamp("frozen_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdByIdx: index("idx_market_created_by").on(t.createdByUserId),
  statusIdx: index("idx_market_status").on(t.status),
  resolutionIdx: index("idx_market_resolution_at").on(t.resolutionAt),
}));

// ── duel ──

export const duel = pgTable("duel", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: uuid("market_id").notNull().references(() => market.id),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => userAccount.id),
  visibility: duelVisibility("visibility").notNull().default("private"),
  inviteToken: text("invite_token").notNull(),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),
  closeAt: timestamp("close_at", { withTimezone: true }).notNull(),
  status: duelStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  totalStakeA: numeric("total_stake_a", { precision: 20, scale: 6 }).notNull().default("0"),
  totalStakeB: numeric("total_stake_b", { precision: 20, scale: 6 }).notNull().default("0"),
  participantCount: integer("participant_count").notNull().default(0),
  version: integer("version").notNull().default(0),
}, (t) => ({
  inviteUq: uniqueIndex("uq_duel_invite_token").on(t.inviteToken),
  marketIdx: index("idx_duel_market").on(t.marketId),
  statusIdx: index("idx_duel_status").on(t.status),
  closeAtIdx: index("idx_duel_close_at").on(t.closeAt),
}));

// ── duel_participant ──

export const duelParticipant = pgTable("duel_participant", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  duelId: uuid("duel_id").notNull().references(() => duel.id),
  userId: uuid("user_id").notNull().references(() => userAccount.id),
  side: sideEnum("side").notNull(),
  stakeAmount: numeric("stake_amount", { precision: 20, scale: 6 }).notNull(),
  depositChainTxId: uuid("deposit_chain_tx_id").references((): any => chainTx.id),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
}, (t) => ({
  duelUserUq: uniqueIndex("uq_duel_participant_duel_user").on(t.duelId, t.userId),
  duelIdx: index("idx_duel_participant_duel").on(t.duelId),
  userIdx: index("idx_duel_participant_user").on(t.userId),
}));

// ── chain_tx ──

export const chainTx = pgTable("chain_tx", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  network: chainNetwork("network").notNull().default("solana"),
  txType: chainTxType("tx_type").notNull(),
  status: chainTxStatus("status").notNull().default("submitted"),
  signature: text("signature"),
  idempotencyKey: text("idempotency_key").notNull(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  tokenMint: text("token_mint").notNull(),
  relatedEntityType: entityType("related_entity_type").notNull(),
  relatedEntityId: uuid("related_entity_id").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  error: text("error"),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  idemUq: uniqueIndex("uq_chain_tx_idempotency").on(t.idempotencyKey),
  sigIdx: index("idx_chain_tx_signature").on(t.signature),
  statusIdx: index("idx_chain_tx_status").on(t.status),
  entityIdx: index("idx_chain_tx_entity").on(t.relatedEntityType, t.relatedEntityId),
}));

// ── ledger_entry ──

export const ledgerEntry = pgTable("ledger_entry", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  duelId: uuid("duel_id").references(() => duel.id),
  userId: uuid("user_id").references(() => userAccount.id),
  entryType: ledgerType("entry_type").notNull(),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  chainTxId: uuid("chain_tx_id").references(() => chainTx.id),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  note: text("note"),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  idemUq: uniqueIndex("uq_ledger_idempotency").on(t.idempotencyKey),
  duelIdx: index("idx_ledger_duel").on(t.duelId),
  userIdx: index("idx_ledger_user").on(t.userId),
  typeIdx: index("idx_ledger_type").on(t.entryType),
}));

// ── settlement ──

export const settlement = pgTable("settlement", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  duelId: uuid("duel_id").notNull().references(() => duel.id),
  winningSide: sideEnum("winning_side").notNull(),
  feeAmount: numeric("fee_amount", { precision: 20, scale: 6 }).notNull(),
  distributableAmount: numeric("distributable_amount", { precision: 20, scale: 6 }).notNull(),
  decidedByActorType: actorType("decided_by_actor_type").notNull(),
  decidedByActorId: uuid("decided_by_actor_id"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  disputeWindowEndsAt: timestamp("dispute_window_ends_at", { withTimezone: true }),
  status: text("status").notNull().default("final"),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  duelUq: uniqueIndex("uq_settlement_duel").on(t.duelId),
  duelIdx: index("idx_settlement_duel").on(t.duelId),
}));

// ── payout ──

export const payout = pgTable("payout", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  settlementId: uuid("settlement_id").notNull().references(() => settlement.id),
  duelParticipantId: uuid("duel_participant_id").notNull().references(() => duelParticipant.id),
  payoutAmount: numeric("payout_amount", { precision: 20, scale: 6 }).notNull(),
  payoutChainTxId: uuid("payout_chain_tx_id").references(() => chainTx.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  error: text("error"),
}, (t) => ({
  settlementIdx: index("idx_payout_settlement").on(t.settlementId),
  participantUq: uniqueIndex("uq_payout_participant").on(t.settlementId, t.duelParticipantId),
}));

// ── chat_message ──

export const chatMessage = pgTable("chat_message", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  duelId: uuid("duel_id").notNull().references(() => duel.id),
  userId: uuid("user_id").notNull().references(() => userAccount.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedByActorType: actorType("deleted_by_actor_type"),
  deletedByActorId: uuid("deleted_by_actor_id"),
  meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  duelIdx: index("idx_chat_duel").on(t.duelId),
  createdAtIdx: index("idx_chat_created_at").on(t.createdAt),
}));

// ── audit_log ──

export const auditLog = pgTable("audit_log", {
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
}, (t) => ({
  entityIdx: index("idx_audit_entity").on(t.entityType, t.entityId),
  actorIdx: index("idx_audit_actor").on(t.actorType, t.actorId),
  createdAtIdx: index("idx_audit_created_at").on(t.createdAt),
}));
