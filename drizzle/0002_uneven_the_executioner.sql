DROP INDEX "uq_chain_tx_signature";--> statement-breakpoint
CREATE INDEX "idx_chain_tx_signature" ON "chain_tx" USING btree ("signature");