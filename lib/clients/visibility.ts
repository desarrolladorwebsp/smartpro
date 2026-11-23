import type { Prisma } from "@prisma/client";

export const visibleClientWhere: Prisma.ClientWhereInput = {
  deletedAt: null,
  OR: [{ businessId: null }, { business: { is: { deletedAt: null } } }],
};
