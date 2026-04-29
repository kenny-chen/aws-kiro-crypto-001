import { relations } from "drizzle-orm/relations";
import { userAccount, invite, market, duel, duelParticipant, chainTx, ledgerEntry, settlement, payout, chatMessage } from "./schema";

export const inviteRelations = relations(invite, ({one}) => ({
	userAccount_createdByUserId: one(userAccount, {
		fields: [invite.createdByUserId],
		references: [userAccount.id],
		relationName: "invite_createdByUserId_userAccount_id"
	}),
	userAccount_acceptedUserId: one(userAccount, {
		fields: [invite.acceptedUserId],
		references: [userAccount.id],
		relationName: "invite_acceptedUserId_userAccount_id"
	}),
}));

export const userAccountRelations = relations(userAccount, ({one, many}) => ({
	invites_createdByUserId: many(invite, {
		relationName: "invite_createdByUserId_userAccount_id"
	}),
	invites_acceptedUserId: many(invite, {
		relationName: "invite_acceptedUserId_userAccount_id"
	}),
	markets: many(market),
	duelParticipants: many(duelParticipant),
	ledgerEntries: many(ledgerEntry),
	duels: many(duel),
	chatMessages: many(chatMessage),
	userAccount: one(userAccount, {
		fields: [userAccount.invitedByUserId],
		references: [userAccount.id],
		relationName: "userAccount_invitedByUserId_userAccount_id"
	}),
	userAccounts: many(userAccount, {
		relationName: "userAccount_invitedByUserId_userAccount_id"
	}),
}));

export const marketRelations = relations(market, ({one, many}) => ({
	userAccount: one(userAccount, {
		fields: [market.createdByUserId],
		references: [userAccount.id]
	}),
	duels: many(duel),
}));

export const duelParticipantRelations = relations(duelParticipant, ({one, many}) => ({
	duel: one(duel, {
		fields: [duelParticipant.duelId],
		references: [duel.id]
	}),
	userAccount: one(userAccount, {
		fields: [duelParticipant.userId],
		references: [userAccount.id]
	}),
	chainTx: one(chainTx, {
		fields: [duelParticipant.depositChainTxId],
		references: [chainTx.id]
	}),
	payouts: many(payout),
}));

export const duelRelations = relations(duel, ({one, many}) => ({
	duelParticipants: many(duelParticipant),
	ledgerEntries: many(ledgerEntry),
	settlements: many(settlement),
	market: one(market, {
		fields: [duel.marketId],
		references: [market.id]
	}),
	userAccount: one(userAccount, {
		fields: [duel.createdByUserId],
		references: [userAccount.id]
	}),
	chatMessages: many(chatMessage),
}));

export const chainTxRelations = relations(chainTx, ({many}) => ({
	duelParticipants: many(duelParticipant),
	ledgerEntries: many(ledgerEntry),
	payouts: many(payout),
}));

export const ledgerEntryRelations = relations(ledgerEntry, ({one}) => ({
	duel: one(duel, {
		fields: [ledgerEntry.duelId],
		references: [duel.id]
	}),
	userAccount: one(userAccount, {
		fields: [ledgerEntry.userId],
		references: [userAccount.id]
	}),
	chainTx: one(chainTx, {
		fields: [ledgerEntry.chainTxId],
		references: [chainTx.id]
	}),
}));

export const settlementRelations = relations(settlement, ({one, many}) => ({
	duel: one(duel, {
		fields: [settlement.duelId],
		references: [duel.id]
	}),
	payouts: many(payout),
}));

export const payoutRelations = relations(payout, ({one}) => ({
	settlement: one(settlement, {
		fields: [payout.settlementId],
		references: [settlement.id]
	}),
	duelParticipant: one(duelParticipant, {
		fields: [payout.duelParticipantId],
		references: [duelParticipant.id]
	}),
	chainTx: one(chainTx, {
		fields: [payout.payoutChainTxId],
		references: [chainTx.id]
	}),
}));

export const chatMessageRelations = relations(chatMessage, ({one}) => ({
	duel: one(duel, {
		fields: [chatMessage.duelId],
		references: [duel.id]
	}),
	userAccount: one(userAccount, {
		fields: [chatMessage.userId],
		references: [userAccount.id]
	}),
}));