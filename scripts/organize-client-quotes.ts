import { prisma } from "../lib/db";
import { commercialClientId } from "../lib/clients/commercial-clients";
import { crmQuoteFields, historicalQuoteDestination, moveCrmStageForQuote, summarizeCrmQuotes } from "../lib/clients/quote-crm";

async function main() {
  if (!prisma) throw new Error("Falta configurar la conexión a la base de datos.");
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) throw new Error("Usa el script sin argumentos para revisar el conteo o con --apply para efectuar los cambios.");
  const apply = args.includes("--apply");
  const active = { deletedAt: null, crmArchiveState: null };
  const db = prisma;
  const [quotes, people, businesses] = await Promise.all([
    db.quote.findMany({ where: { status: { not: "DRAFT" } }, select: crmQuoteFields }),
    db.client.findMany({ where: { ...active, businessId: null }, select: { id: true, crmStage: true } }),
    db.business.findMany({ where: active, select: { id: true, crmStage: true } }),
  ]);
  const summaries = summarizeCrmQuotes(quotes);
  const owners = [
    ...people.map(({ id, crmStage }) => ({ clientId: id, businessId: null, crmStage })),
    ...businesses.map(({ id, crmStage }) => ({ clientId: "", businessId: id, crmStage })),
  ];
  const totals = { QUOTED: 0, PROPOSAL_REJECTED: 0, skipped: 0 };

  for (const owner of owners) {
    const summary = summaries.get(commercialClientId(owner.clientId, owner.businessId));
    const stage = historicalQuoteDestination(owner.crmStage, summary);
    if (stage !== "QUOTED" && stage !== "PROPOSAL_REJECTED") continue;
    if (apply) {
      const changed = await db.$transaction((tx) => moveCrmStageForQuote(tx, owner, [owner.crmStage], stage, {
        actorEmail: "sistema@smartpro.cl",
        note: "Regularización puntual de etapas según cotizaciones existentes.",
      }));
      if (!changed) {
        totals.skipped++;
        continue;
      }
    }
    totals[stage]++;
  }

  console.log(apply ? "Cambios aplicados" : "Vista previa de cambios", totals);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma?.$disconnect());
