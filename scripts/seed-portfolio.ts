import { seedWebDevelopmentPortfolio } from "../lib/portfolio/seed";
import { prisma } from "../lib/db";

async function main() {
  const result = await seedWebDevelopmentPortfolio();
  console.log(`Portafolio Desarrollo Web: ${result.created} creados, ${result.updated} actualizados.`);
  await prisma?.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
