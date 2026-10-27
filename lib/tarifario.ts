type ServiceRow = readonly [name: string, price: number, delivery: string, scope: string, note?: string, from?: boolean];

export const tariffGroups: { id: string; title: string; description: string; services: readonly ServiceRow[] }[] = [
  { id: "contenido", title: "Contenido y diseño", description: "Actualiza tu sitio e incorpora nuevas secciones.", services: [
    ["Actualización de contenido", 1, "1 día hábil", "Hasta 5 cambios de textos, imágenes, enlaces o datos de contacto, enviados juntos y sin cambiar la estructura."],
    ["Sección simple nueva", 1.2, "1 día hábil", "Un bloque con texto, fotos o video proporcionado por el cliente, siguiendo el diseño del sitio.", "Incluye insertar el video cuando forma parte de esta sección."],
    ["Galería de imágenes", 1.5, "2 días hábiles", "Hasta 12 fotografías, grilla adaptable y ampliación al hacer clic.", "Fotografías proporcionadas por el cliente."],
    ["Sección personalizada", 2, "2 días hábiles", "Diseño propio para beneficios, equipo, testimonios, planes o servicios. Hasta 8 elementos."],
    ["Sección interactiva", 2, "3 días hábiles", "Carrusel personalizado, pestañas, acordeones o filtros sobre contenido estático.", "Sin base de datos ni API externa."],
    ["Rediseño de sección existente", 2, "2 días hábiles", "Nueva distribución, estilo visual y adaptación a celular, conservando su función."],
  ] },
  { id: "herramientas", title: "Videos, redes y herramientas", description: "Conecta contenido y herramientas externas con tu sitio.", services: [
    ["Integración de YouTube", 1.2, "1 día hábil", "Hasta 3 videos o una playlist mediante reproductor, adaptados a celular.", "Videos existentes. Sin producción ni edición audiovisual."],
    ["Botones de redes y WhatsApp", 1.2, "1 día hábil", "Hasta 5 enlaces a perfiles y un botón de WhatsApp con mensaje predeterminado."],
    ["Feed de redes sociales", 2.4, "2 días hábiles", "Un feed mediante herramienta compatible y configuración de su apariencia.", "Suscripción de la herramienta por separado, si aplica."],
    ["Mapa y ubicación", 1.2, "1 día hábil", "Mapa de Google, dirección, horario y botón para obtener indicaciones de una sucursal."],
    ["Agenda de reservas externa", 2, "2 días hábiles", "Configuración básica e incorporación de una agenda existente, con un servicio y calendario.", "Licencia del proveedor por separado, si aplica."],
    ["Medición de conversiones", 2.4, "2 días hábiles", "GA4 o Meta Pixel con hasta 3 eventos estándar y verificación.", "Una plataforma. Sin medición desde servidor."],
  ] },
  { id: "integraciones", title: "Formularios e integraciones", description: "Amplía la captación de contactos y conecta procesos.", services: [
    ["Formulario de contacto", 2, "2 días hábiles", "Hasta 6 campos, validaciones, protección antispam y envío a un correo.", "Proveedor de correo y consumo por separado, si aplica."],
    ["Formulario avanzado", 3.6, "2 días hábiles", "Hasta 12 campos, campos condicionales, carga de un archivo y envío a un correo.", "Sin conexión a CRM ni flujos de aprobación.", true],
    ["Formulario por pasos", 3.6, "2 días hábiles", "Hasta 3 pasos y 15 campos, validaciones y envío a un correo.", "Solución reutilizable. Con diseño propio: desde 4,8 UF. Sin cotizador ni reglas comerciales propias.", true],
    ["Conexión a CRM o planilla", 4, "5 días hábiles", "Envío en una dirección desde un formulario existente hacia un destino, con hasta 12 campos.", "Requiere conector compatible. Formulario nuevo se cotiza aparte."],
    ["Pasarela de pago adicional", 4, "6 días hábiles", "Un proveedor sobre un carro o proceso de compra existente, confirmación y pruebas.", "Sin creación de carrito ni suscripciones recurrentes."],
    ["Integración con API externa", 5, "5–7 días hábiles", "Un flujo de consulta o envío, autenticación y manejo de errores.", "Sujeto a revisión de documentación y alcance.", true],
  ] },
  { id: "vistas", title: "Páginas y nuevas funciones", description: "Agrega páginas completas y funciones sobre tu sistema existente.", services: [
    ["Página informativa adicional", 3, "2–3 días hábiles", "Una dirección nueva, hasta 4 secciones, reutilizando el diseño del sitio.", "Componentes disponibles y contenido entregado."],
    ["Landing adicional dentro del sitio", 4, "5 días hábiles", "Hasta 6 secciones, formulario básico y llamados a la acción, reutilizando infraestructura existente."],
    ["Vista de consulta", 4, "3–4 días hábiles", "Listado, búsqueda, filtros y paginación sobre datos y permisos existentes.", "Sin crear fuentes de datos ni roles nuevos."],
    ["Vista de gestión", 5, "5–7 días hábiles", "Crear, editar y eliminar un tipo de registro, con validaciones y permisos existentes.", "Sin flujos de aprobación ni reglas adicionales de negocio."],
    ["Panel de indicadores", 4.8, "4–5 días hábiles", "Hasta 4 indicadores y 2 gráficos sobre información ya disponible.", "Fuentes y criterios de cálculo definidos previamente."],
  ] },
];

export const tariffConditions = [
  ["Cotización formal", "Todos los precios son referenciales y deben ser confirmados con un ejecutivo mediante una cotización formal. El alcance, precio final y plazo se acuerdan antes de comenzar."],
  ["Valores en UF + IVA", "Los precios corresponden a cada modificación descrita y son netos, más IVA. Los servicios con precio desde requieren evaluar su complejidad."],
  ["Plazos estimados", "Se expresan en días hábiles para una solicitud individual. Comienzan con la aprobación, el pago acordado y la recepción completa de contenidos y accesos."],
  ["Qué incluye", "Adaptación a celular y computador, pruebas, publicación y una ronda de ajustes sobre el alcance acordado."],
  ["Contenidos y proveedores", "El cliente entrega textos, fotos y videos. Su producción o edición, licencias, suscripciones, comisiones y consumos de terceros se cotizan por separado cuando corresponda."],
  ["Solicitudes combinadas", "Un ejecutivo preparará una cotización consolidada considerando el trabajo compartido. Las funciones ya contratadas y correcciones de errores de entrega se atienden según lo acordado."],
] as const;
