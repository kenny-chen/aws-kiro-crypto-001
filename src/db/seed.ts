import { db } from "./client";
import { userAccount, market } from "./schema";

async function seed() {
  console.log("Seeding...");

  const [admin] = await db
    .insert(userAccount)
    .values({
      walletAddress: "ADMIN_SEED_WALLET_ADDRESS",
      displayName: "Admin",
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  if (admin) {
    await db.insert(market).values({
      createdByUserId: admin.id,
      title: "Sample Market: BTC above 100k by end of month?",
      optionALabel: "Yes",
      optionBLabel: "No",
      resolutionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minStake: "1.000000",
      feeBps: 200,
      status: "active",
    });
    console.log("Seed complete: admin + sample market created");
  } else {
    console.log("Seed skipped: admin already exists");
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
