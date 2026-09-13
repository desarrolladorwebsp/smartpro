import { spawnSync } from "node:child_process";

import { disconnectCatalogSeed, seedServiceCatalog } from "../lib/services/seed";

const DATABASES = ["smartpro_dev", "smartpro_db"] as const;

async function seedCurrentDatabase() {
  try {
    const database = process.env.DB_NAME ?? "default";
    const result = await seedServiceCatalog();
    console.log(
      `${database}: ${result.categories} servicios, ${result.subcategories} categorías, ${result.plans} planes, ${result.items} ítems.`,
    );
  } finally {
    await disconnectCatalogSeed();
  }
}

async function main() {
  if (process.env.SEEDING_DATABASE) {
    await seedCurrentDatabase();
    return;
  }

  for (const database of DATABASES) {
    console.log(`\n== ${database} ==`);
    const result = spawnSync("npx", ["tsx", "scripts/seed-services.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DB_NAME: database, SEEDING_DATABASE: database },
      stdio: "inherit",
      shell: true,
    });

    if (result.status !== 0) {
      throw new Error(`El seed de servicios falló en ${database}.`);
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
