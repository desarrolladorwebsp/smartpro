import { disconnectCatalogSeed, seedServiceCatalog } from "../lib/services/seed";

async function main() {
  try {
    const result = await seedServiceCatalog();
    console.log(
      `Seed OK: ${result.categories} servicios, ${result.subcategories} categorías, ${result.plans} planes, ${result.items} ítems.`,
    );
  } finally {
    await disconnectCatalogSeed();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
