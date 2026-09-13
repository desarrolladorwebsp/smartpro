export const DEFAULT_SERVICE_COVERS: Record<string, string> = {
  "desarrollo-web": "/images/services/service-01.png",
  "campanas-publicitarias": "/images/services/service-02.png",
  "redes-sociales-contenido": "/images/services/service-03.png",
  "automatizacion-conversion": "/images/services/service-04.png",
  "produccion-audiovisual": "/images/services/service-05.png",
  "membresias-negocios": "/images/services/service-06.png",
  "negocio-completo": "/images/services/service-01.png",
  "desarrollo-sistemas": "/images/services/service-04.png",
  "registro-de-marca": "/images/services/service-08.jpeg",
  "registro-de-marcas": "/images/services/service-08.jpeg",
};

export function getDefaultServiceCoverImage(slug: string, index: number): string {
  return DEFAULT_SERVICE_COVERS[slug] ?? `/images/services/service-0${(index % 6) + 1}.png`;
}

export function resolveServiceCoverImage(
  coverImage: string | null | undefined,
  slug: string,
  index: number,
): string {
  const normalized = String(coverImage ?? "").trim();
  return normalized || getDefaultServiceCoverImage(slug, index);
}
