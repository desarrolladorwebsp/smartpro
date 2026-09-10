process.env.DB_NAME = "smartpro_db";

async function main() {
  const { listClients, createClientRecord, deleteClientRecord } = await import("../lib/clients/repository");
  const { listQuotes } = await import("../lib/quotes/repository");
  const { listOrders } = await import("../lib/orders/repository");

  const [clients, quotes, orders] = await Promise.all([listClients(), listQuotes(), listOrders()]);

  if (!Array.isArray(clients) || !Array.isArray(quotes) || !Array.isArray(orders)) {
    throw new Error("Las listas de dashboard no devolvieron arrays.");
  }

  const suffix = `${Date.now()}`;
  const created = await createClientRecord({
    companyName: `Probe Dashboard ${suffix}`,
    contactFirstName: "Probe",
    contactLastName: "SmartPro",
    email: `probe.dashboard.${suffix}@smartpro.cl`,
  });

  const afterCreate = await listClients();
  const appeared = afterCreate.some((client) => client.id === created.id);
  await deleteClientRecord(created.id);
  const afterDelete = await listClients();

  if (!appeared) {
    throw new Error("El cliente creado no apareció en el listado.");
  }

  console.log(
    JSON.stringify(
      {
        database: process.env.DB_NAME,
        clients: clients.length,
        quotes: quotes.length,
        orders: orders.length,
        emptyIsSuccess: true,
        createdAppearsInList: appeared,
        cleanedUp: afterDelete.every((client) => client.id !== created.id),
      },
      null,
      2,
    ),
  );
}

void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
