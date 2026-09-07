import { disconnectCatalogSeed, seedServiceCatalog } from "../lib/services/seed";

async function main() {
  try {
    const result = await seedServiceCatalog();
    console.log(
      `Seed OK: ${result.categories} categorías, ${result.subcategories} subcategorías, ${result.plans} planes, ${result.items} ítems.`,
    );
  } finally {
    await disconnectCatalogSeed();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
