CREATE TYPE "public"."actor_type" AS ENUM('user', 'admin', 'worker', 'system');--> statement-breakpoint
CREATE TYPE "public"."chain_network" AS ENUM('solana');--> statement-breakpoint
CREATE TYPE "public"."chain_tx_status" AS ENUM('submitted', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."chain_tx_type" AS ENUM('deposit', 'payout', 'refund', 'fee', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."duel_status" AS ENUM('draft', 'open', 'closed', 'resolving', 'resolved', 'cancelled', 'refunding', 'refunded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."duel_visibility" AS ENUM('private');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('user_account', 'invite', 'market', 'duel', 'duel_participant', 'settlement', 'ledger_entry', 'chain_tx', 'chat_message');--> statement-breakpoint
CREATE TYPE "public"."ledger_type" AS ENUM('deposit', 'fee', 'payout', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."market_status" AS ENUM('draft', 'active', 'frozen', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('none', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."duel_side" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'banned', 'deleted');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"request_id" text,
	"ip" text,
	"user_agent" text,
	"before" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chain_tx" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"network" "chain_network" DEFAULT 'solana' NOT NULL,
	"tx_type" "chain_tx_type" NOT NULL,
	"status" "chain_tx_status" DEFAULT 'submitted' NOT NULL,
	"signature" text,
	"idempotency_key" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"token_mint" text NOT NULL,
	"related_entity_type" "entity_type" NOT NULL,
	"related_entity_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_actor_type" "actor_type",
	"deleted_by_actor_id" uuid,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"visibility" "duel_visibility" DEFAULT 'private' NOT NULL,
	"invite_token" text NOT NULL,
	"invite_expires_at" timestamp with time zone NOT NULL,
	"close_at" timestamp with time zone NOT NULL,
	"status" "duel_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_stake_a" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_stake_b" numeric(20, 6) DEFAULT '0' NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duel_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"side" "duel_side" NOT NULL,
	"stake_amount" numeric(20, 6) NOT NULL,
	"deposit_chain_tx_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"opened_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"accepted_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duel_id" uuid,
	"user_id" uuid,
	"entry_type" "ledger_type" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency" text DEFAULT 'USDC' NOT NULL,
	"chain_tx_id" uuid,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"option_a_label" text NOT NULL,
	"option_b_label" text NOT NULL,
	"resolution_at" timestamp with time zone NOT NULL,
	"min_stake" numeric(20, 6) NOT NULL,
	"fee_bps" integer NOT NULL,
	"status" "market_status" DEFAULT 'active' NOT NULL,
	"review_status" "review_status" DEFAULT 'none' NOT NULL,
	"frozen_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_id" uuid NOT NULL,
	"duel_participant_id" uuid NOT NULL,
	"payout_amount" numeric(20, 6) NOT NULL,
	"payout_chain_tx_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "settlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duel_id" uuid NOT NULL,
	"winning_side" "duel_side" NOT NULL,
	"fee_amount" numeric(20, 6) NOT NULL,
	"distributable_amount" numeric(20, 6) NOT NULL,
	"decided_by_actor_type" "actor_type" NOT NULL,
	"decided_by_actor_id" uuid,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispute_window_ends_at" timestamp with time zone,
	"status" text DEFAULT 'final' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"display_name" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"invited_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel" ADD CONSTRAINT "duel_market_id_market_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."market"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel" ADD CONSTRAINT "duel_created_by_user_id_user_account_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_participant" ADD CONSTRAINT "duel_participant_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_participant" ADD CONSTRAINT "duel_participant_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_participant" ADD CONSTRAINT "duel_participant_deposit_chain_tx_id_chain_tx_id_fk" FOREIGN KEY ("deposit_chain_tx_id") REFERENCES "public"."chain_tx"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_created_by_user_id_user_account_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_accepted_user_id_user_account_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_chain_tx_id_chain_tx_id_fk" FOREIGN KEY ("chain_tx_id") REFERENCES "public"."chain_tx"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market" ADD CONSTRAINT "market_created_by_user_id_user_account_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_settlement_id_settlement_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_duel_participant_id_duel_participant_id_fk" FOREIGN KEY ("duel_participant_id") REFERENCES "public"."duel_participant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_payout_chain_tx_id_chain_tx_id_fk" FOREIGN KEY ("payout_chain_tx_id") REFERENCES "public"."chain_tx"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_duel_id_duel_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_invited_by_user_id_user_account_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "audit_log" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created_at" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chain_tx_idempotency" ON "chain_tx" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chain_tx_signature" ON "chain_tx" USING btree ("signature");--> statement-breakpoint
CREATE INDEX "idx_chain_tx_status" ON "chain_tx" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_chain_tx_entity" ON "chain_tx" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "idx_chat_duel" ON "chat_message" USING btree ("duel_id");--> statement-breakpoint
CREATE INDEX "idx_chat_created_at" ON "chat_message" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_duel_invite_token" ON "duel" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "idx_duel_market" ON "duel" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "idx_duel_status" ON "duel" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_duel_close_at" ON "duel" USING btree ("close_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_duel_participant_duel_user" ON "duel_participant" USING btree ("duel_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_duel_participant_duel" ON "duel_participant" USING btree ("duel_id");--> statement-breakpoint
CREATE INDEX "idx_duel_participant_user" ON "duel_participant" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invite_token" ON "invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_invite_created_by" ON "invite" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_invite_opened_at" ON "invite" USING btree ("opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ledger_idempotency" ON "ledger_entry" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_ledger_duel" ON "ledger_entry" USING btree ("duel_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_user" ON "ledger_entry" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ledger_type" ON "ledger_entry" USING btree ("entry_type");--> statement-breakpoint
CREATE INDEX "idx_market_created_by" ON "market" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_market_status" ON "market" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_market_resolution_at" ON "market" USING btree ("resolution_at");--> statement-breakpoint
CREATE INDEX "idx_payout_settlement" ON "payout" USING btree ("settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payout_participant" ON "payout" USING btree ("settlement_id","duel_participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_settlement_duel" ON "settlement" USING btree ("duel_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_duel" ON "settlement" USING btree ("duel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_wallet" ON "user_account" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "idx_user_invited_by" ON "user_account" USING btree ("invited_by_user_id");