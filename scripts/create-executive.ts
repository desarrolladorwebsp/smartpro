import { createExecutive } from "../lib/executives/repository";
import { parseExecutiveRegistration } from "../lib/executives/validation";
import { prisma } from "../lib/db";

function readArg(index: number, label: string): string {
  const value = process.argv[index]?.trim();

  if (!value) {
    throw new Error(`Falta el argumento: ${label}`);
  }

  return value;
}

async function main() {
  const parsed = parseExecutiveRegistration({
    firstName: readArg(2, "nombre"),
    lastName: readArg(3, "apellido"),
    rut: readArg(4, "rut"),
    email: readArg(5, "correo"),
    phone: process.argv[6]?.trim() ?? "",
    password: readArg(7, "contraseña"),
    role: process.argv[8]?.trim() ?? "EXECUTIVE",
  });

  if (!parsed.ok) {
    throw new Error(parsed.error);
  }

  const executive = await createExecutive(parsed.data);
  console.log(
    `Ejecutivo creado: ${executive.firstName} ${executive.lastName} <${executive.email}> (${executive.role})`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
