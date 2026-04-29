import { pgTable, index, uuid, text, jsonb, timestamp, uniqueIndex, foreignKey, numeric, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const actorType = pgEnum("actor_type", ['user', 'admin', 'worker', 'system'])
export const chainNetwork = pgEnum("chain_network", ['solana'])
export const chainTxStatus = pgEnum("chain_tx_status", ['submitted', 'confirmed', 'failed'])
export const chainTxType = pgEnum("chain_tx_type", ['deposit', 'payout', 'refund', 'fee', 'adjustment'])
export const duelSide = pgEnum("duel_side", ['A', 'B'])
export const duelStatus = pgEnum("duel_status", ['draft', 'open', 'closed', 'resolving', 'resolved', 'cancelled', 'refunding', 'refunded', 'expired'])
export const duelVisibility = pgEnum("duel_visibility", ['private'])
export const entityType = pgEnum("entity_type", ['user_account', 'invite', 'market', 'duel', 'duel_participant', 'settlement', 'ledger_entry', 'chain_tx', 'chat_message'])
export const ledgerType = pgEnum("ledger_type", ['deposit', 'fee', 'payout', 'refund', 'adjustment'])
export const marketStatus = pgEnum("market_status", ['draft', 'active', 'frozen', 'resolved', 'cancelled'])
export const reviewStatus = pgEnum("review_status", ['none', 'pending', 'approved', 'rejected'])
export const userStatus = pgEnum("user_status", ['active', 'banned', 'deleted'])


export const auditLog = pgTable("audit_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	actorType: actorType("actor_type").notNull(),
	actorId: uuid("actor_id"),
	action: text().notNull(),
	entityType: entityType("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	requestId: text("request_id"),
	ip: text(),
	userAgent: text("user_agent"),
	before: jsonb().default({}).notNull(),
	after: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_actor").using("btree", table.actorType.asc().nullsLast().op("uuid_ops"), table.actorId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_entity").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
]);

export const invite = pgTable("invite", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: text().notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	openedAt: timestamp("opened_at", { withTimezone: true, mode: 'string' }),
	acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: 'string' }),
	acceptedUserId: uuid("accepted_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	meta: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_invite_created_by").using("btree", table.createdByUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_invite_opened_at").using("btree", table.openedAt.asc().nullsLast().op("timestamptz_ops")),
	uniqueIndex("uq_invite_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [userAccount.id],
			name: "invite_created_by_user_id_user_account_id_fk"
		}),
	foreignKey({
			columns: [table.acceptedUserId],
			foreignColumns: [userAccount.id],
			name: "invite_accepted_user_id_user_account_id_fk"
		}),
]);

export const market = pgTable("market", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	title: text().notNull(),
	optionALabel: text("option_a_label").notNull(),
	optionBLabel: text("option_b_label").notNull(),
	resolutionAt: timestamp("resolution_at", { withTimezone: true, mode: 'string' }).notNull(),
	minStake: numeric("min_stake", { precision: 20, scale:  6 }).notNull(),
	feeBps: integer("fee_bps").notNull(),
	status: marketStatus().default('active').notNull(),
	reviewStatus: reviewStatus("review_status").default('none').notNull(),
	frozenAt: timestamp("frozen_at", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_market_created_by").using("btree", table.createdByUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_market_resolution_at").using("btree", table.resolutionAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_market_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [userAccount.id],
			name: "market_created_by_user_id_user_account_id_fk"
		}),
]);

export const duelParticipant = pgTable("duel_participant", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	duelId: uuid("duel_id").notNull(),
	userId: uuid("user_id").notNull(),
	side: duelSide().notNull(),
	stakeAmount: numeric("stake_amount", { precision: 20, scale:  6 }).notNull(),
	depositChainTxId: uuid("deposit_chain_tx_id"),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: text().default('active').notNull(),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_duel_participant_duel").using("btree", table.duelId.asc().nullsLast().op("uuid_ops")),
	index("idx_duel_participant_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_duel_participant_duel_user").using("btree", table.duelId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.duelId],
			foreignColumns: [duel.id],
			name: "duel_participant_duel_id_duel_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userAccount.id],
			name: "duel_participant_user_id_user_account_id_fk"
		}),
	foreignKey({
			columns: [table.depositChainTxId],
			foreignColumns: [chainTx.id],
			name: "duel_participant_deposit_chain_tx_id_chain_tx_id_fk"
		}),
]);

export const chainTx = pgTable("chain_tx", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	network: chainNetwork().default('solana').notNull(),
	txType: chainTxType("tx_type").notNull(),
	status: chainTxStatus().default('submitted').notNull(),
	signature: text(),
	idempotencyKey: text("idempotency_key").notNull(),
	fromAddress: text("from_address").notNull(),
	toAddress: text("to_address").notNull(),
	amount: numeric({ precision: 20, scale:  6 }).notNull(),
	tokenMint: text("token_mint").notNull(),
	relatedEntityType: entityType("related_entity_type").notNull(),
	relatedEntityId: uuid("related_entity_id").notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	failedAt: timestamp("failed_at", { withTimezone: true, mode: 'string' }),
	error: text(),
	meta: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_chain_tx_entity").using("btree", table.relatedEntityType.asc().nullsLast().op("uuid_ops"), table.relatedEntityId.asc().nullsLast().op("enum_ops")),
	index("idx_chain_tx_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_chain_tx_idempotency").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_chain_tx_signature").using("btree", table.signature.asc().nullsLast().op("text_ops")),
]);

export const ledgerEntry = pgTable("ledger_entry", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	duelId: uuid("duel_id"),
	userId: uuid("user_id"),
	entryType: ledgerType("entry_type").notNull(),
	amount: numeric({ precision: 20, scale:  6 }).notNull(),
	currency: text().default('USDC').notNull(),
	chainTxId: uuid("chain_tx_id"),
	idempotencyKey: text("idempotency_key").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	note: text(),
	meta: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_ledger_duel").using("btree", table.duelId.asc().nullsLast().op("uuid_ops")),
	index("idx_ledger_type").using("btree", table.entryType.asc().nullsLast().op("enum_ops")),
	index("idx_ledger_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_ledger_idempotency").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.duelId],
			foreignColumns: [duel.id],
			name: "ledger_entry_duel_id_duel_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userAccount.id],
			name: "ledger_entry_user_id_user_account_id_fk"
		}),
	foreignKey({
			columns: [table.chainTxId],
			foreignColumns: [chainTx.id],
			name: "ledger_entry_chain_tx_id_chain_tx_id_fk"
		}),
]);

export const settlement = pgTable("settlement", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	duelId: uuid("duel_id").notNull(),
	winningSide: duelSide("winning_side").notNull(),
	feeAmount: numeric("fee_amount", { precision: 20, scale:  6 }).notNull(),
	distributableAmount: numeric("distributable_amount", { precision: 20, scale:  6 }).notNull(),
	decidedByActorType: actorType("decided_by_actor_type").notNull(),
	decidedByActorId: uuid("decided_by_actor_id"),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	disputeWindowEndsAt: timestamp("dispute_window_ends_at", { withTimezone: true, mode: 'string' }),
	status: text().default('final').notNull(),
	meta: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_settlement_duel").using("btree", table.duelId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_settlement_duel").using("btree", table.duelId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.duelId],
			foreignColumns: [duel.id],
			name: "settlement_duel_id_duel_id_fk"
		}),
]);

export const payout = pgTable("payout", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	settlementId: uuid("settlement_id").notNull(),
	duelParticipantId: uuid("duel_participant_id").notNull(),
	payoutAmount: numeric("payout_amount", { precision: 20, scale:  6 }).notNull(),
	payoutChainTxId: uuid("payout_chain_tx_id"),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	error: text(),
}, (table) => [
	index("idx_payout_settlement").using("btree", table.settlementId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_payout_participant").using("btree", table.settlementId.asc().nullsLast().op("uuid_ops"), table.duelParticipantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.settlementId],
			foreignColumns: [settlement.id],
			name: "payout_settlement_id_settlement_id_fk"
		}),
	foreignKey({
			columns: [table.duelParticipantId],
			foreignColumns: [duelParticipant.id],
			name: "payout_duel_participant_id_duel_participant_id_fk"
		}),
	foreignKey({
			columns: [table.payoutChainTxId],
			foreignColumns: [chainTx.id],
			name: "payout_payout_chain_tx_id_chain_tx_id_fk"
		}),
]);

export const duel = pgTable("duel", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	marketId: uuid("market_id").notNull(),
	createdByUserId: uuid("created_by_user_id").notNull(),
	visibility: duelVisibility().default('private').notNull(),
	inviteToken: text("invite_token").notNull(),
	inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	closeAt: timestamp("close_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: duelStatus().default('open').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	totalStakeA: numeric("total_stake_a", { precision: 20, scale:  6 }).default('0').notNull(),
	totalStakeB: numeric("total_stake_b", { precision: 20, scale:  6 }).default('0').notNull(),
	participantCount: integer("participant_count").default(0).notNull(),
	version: integer().default(0).notNull(),
}, (table) => [
	index("idx_duel_close_at").using("btree", table.closeAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_duel_market").using("btree", table.marketId.asc().nullsLast().op("uuid_ops")),
	index("idx_duel_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_duel_invite_token").using("btree", table.inviteToken.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.marketId],
			foreignColumns: [market.id],
			name: "duel_market_id_market_id_fk"
		}),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [userAccount.id],
			name: "duel_created_by_user_id_user_account_id_fk"
		}),
]);

export const chatMessage = pgTable("chat_message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	duelId: uuid("duel_id").notNull(),
	userId: uuid("user_id").notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	deletedByActorType: actorType("deleted_by_actor_type"),
	deletedByActorId: uuid("deleted_by_actor_id"),
	meta: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_chat_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_chat_duel").using("btree", table.duelId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.duelId],
			foreignColumns: [duel.id],
			name: "chat_message_duel_id_duel_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [userAccount.id],
			name: "chat_message_user_id_user_account_id_fk"
		}),
]);

export const userAccount = pgTable("user_account", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletAddress: text("wallet_address").notNull(),
	displayName: text("display_name"),
	status: userStatus().default('active').notNull(),
	invitedByUserId: uuid("invited_by_user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	bannedAt: timestamp("banned_at", { withTimezone: true, mode: 'string' }),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_user_invited_by").using("btree", table.invitedByUserId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_user_wallet").using("btree", table.walletAddress.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invitedByUserId],
			foreignColumns: [table.id],
			name: "user_account_invited_by_user_id_user_account_id_fk"
		}),
]);
