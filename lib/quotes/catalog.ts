import { getPublicCatalogTree } from "../services/repository";
import { mapCatalogTreeToQuoteGroups } from "./catalog-map";
import type { QuoteCatalogGroup } from "./types";

export { mapCatalogTreeToQuoteGroups } from "./catalog-map";

export async function listQuoteCatalog(): Promise<QuoteCatalogGroup[]> {
  return mapCatalogTreeToQuoteGroups(await getPublicCatalogTree());
}
