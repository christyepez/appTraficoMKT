import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/ChristianYepez/Documents/Codex/2026-06-18/gee/outputs/requirements-platform/import-workbook";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const purple = "#3c235f";
const purpleDark = "#2a1844";
const gold = "#f6b700";
const light = "#f5f7fb";
const line = "#d9deea";

const ids = {
  facultyIng: "11111111-1111-1111-1111-111111111111",
  facultyAdm: "11111111-1111-1111-1111-111111111112",
  careerSoftware: "11111111-1111-1111-1111-1111111111a1",
  careerAdministracion: "11111111-1111-1111-1111-1111111111a2",
  campusQuito: "22222222-2222-2222-2222-222222222221",
  campusAmbato: "22222222-2222-2222-2222-222222222222",
  reqInterno: "33333333-3333-3333-3333-333333333331",
  reqInstitucional: "33333333-3333-3333-3333-333333333332",
  formatoPresencial: "33333333-3333-3333-3333-333333333341",
  formatoVirtual: "33333333-3333-3333-3333-333333333342",
  publicoEstudiantes: "33333333-3333-3333-3333-333333333351",
  publicoEmpresas: "33333333-3333-3333-3333-333333333352",
  tipoFlyer: "33333333-3333-3333-3333-333333333361",
  tipoVideo: "33333333-3333-3333-3333-333333333362",
  canalInstagram: "33333333-3333-3333-3333-333333333371",
  canalWeb: "33333333-3333-3333-3333-333333333372",
  kpiAlcance: "33333333-3333-3333-3333-333333333381",
  kpiAsistentes: "33333333-3333-3333-3333-333333333382",
  estadoReqBorrador: "33333333-3333-3333-3333-333333333391",
  estadoReqAnalisis: "33333333-3333-3333-3333-333333333393",
  estadoReqEjecucion: "33333333-3333-3333-3333-333333333394",
  estadoReqPendiente: "33333333-3333-3333-3333-333333333395",
  estadoReqCompletado: "33333333-3333-3333-3333-333333333396",
  estadoReqRechazado: "33333333-3333-3333-3333-333333333397",
  estadoProductoTodo: "33333333-3333-3333-3333-333333333392",
  estadoProductoProceso: "33333333-3333-3333-3333-333333333398",
  estadoProductoEvidencia: "33333333-3333-3333-3333-333333333399",
  estadoProductoPendiente: "33333333-3333-3333-3333-3333333333a1",
  estadoProductoAprobado: "33333333-3333-3333-3333-3333333333a2",
  estadoProductoRechazado: "33333333-3333-3333-3333-3333333333a3",
  reqCasaAbierta: "44444444-4444-4444-4444-444444444441",
  reqWebinar: "44444444-4444-4444-4444-444444444442",
  prodFlyer: "55555555-5555-5555-5555-555555555551",
  prodVideo: "55555555-5555-5555-5555-555555555552",
  userAdmin: "66666666-6666-6666-6666-666666666661",
  userTecnico: "66666666-6666-6666-6666-666666666662"
};

function addSheet(name, title, headers, rows, notes = []) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = {
    fill: purple,
    font: { bold: true, color: "#ffffff", size: 14 },
    rowHeight: 26
  };
  if (notes.length) {
    sheet.getRangeByIndexes(1, 0, notes.length, 1).values = notes.map((note) => [note]);
    sheet.getRangeByIndexes(1, 0, notes.length, 1).format = {
      fill: light,
      font: { color: purpleDark },
      wrapText: true
    };
  }

  const startRow = notes.length + 3;
  const range = sheet.getRangeByIndexes(startRow, 0, rows.length + 1, headers.length);
  range.values = [headers, ...rows];
  const headerRange = sheet.getRangeByIndexes(startRow, 0, 1, headers.length);
  headerRange.format = {
    fill: gold,
    font: { bold: true, color: "#101b2d" },
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: line }
  };
  const bodyRange = sheet.getRangeByIndexes(startRow + 1, 0, rows.length, headers.length);
  bodyRange.format = {
    fill: "#ffffff",
    borders: { preset: "inside", style: "thin", color: line },
    wrapText: true
  };
  range.format.autofitColumns();
  range.format.autofitRows();
  sheet.freezePanes.freezeRows(startRow + 1);
  sheet.tables.add(range, true, `${name.replace(/[^A-Za-z0-9]/g, "")}Table`);
  return sheet;
}

addSheet("README", "Plantilla de carga inicial", ["Tema", "Detalle"], [
  ["Orden recomendado", "1. Facultades, Sedes y Carreras, 2. Catalogos, 3. Aprobadores, 4. Usuarios, 5. Requerimientos, 6. Productos, 7. Configuraciones."],
  ["Uso de Id", "Los Id son GUID. Se pueden reemplazar por nuevos GUID, pero las columnas FK deben apuntar al Id de la hoja relacionada."],
  ["Relaciones", "Requerimientos usa FacultyId, CampusId, EventFormatId y StatusId. Productos usa RequirementId y los Id de catalogos TipoRequerimiento, PublicoObjetivo, TipoProducto, CanalDifusion, KpiPrincipal y StatusId."],
  ["Ambiente", "Los datos corresponden a SQL Server local y a los microservicios AdministrationDb, RequirementsDb, ActivitiesDb, IdentityDb y EvidenceDb."]
]);

addSheet("Facultades", "Catalogo de facultades", ["Id", "Code", "Name", "IsActive"], [
  [ids.facultyIng, "ING", "Facultad de Ingenieria y Tecnologias de la Informacion", true],
  [ids.facultyAdm, "ADM", "Facultad de Ciencias Administrativas", true]
]);

addSheet("Carreras", "Carreras por facultad", ["Id", "Code", "Name", "FacultyId", "IsActive"], [
  [ids.careerSoftware, "SOFT", "Software", ids.facultyIng, true],
  [ids.careerAdministracion, "ADMIN", "Administracion", ids.facultyAdm, true]
]);

addSheet("Sedes", "Catalogo de sedes", ["Id", "Code", "Name", "IsActive"], [
  [ids.campusQuito, "QUITO", "Sede Quito", true],
  [ids.campusAmbato, "AMBATO", "Sede Ambato", true]
]);

addSheet("Catalogos", "Catalogos parametrizables", ["Id", "Type", "Code", "Name", "IsActive"], [
  [ids.estadoReqBorrador, "EstadoRequerimiento", "REQ-DRAFT", "Borrador", true],
  [ids.estadoReqAnalisis, "EstadoRequerimiento", "REQ-IN-ANALYSIS", "En analisis", true],
  [ids.estadoReqEjecucion, "EstadoRequerimiento", "REQ-IN-EXECUTION", "En ejecucion", true],
  [ids.estadoReqPendiente, "EstadoRequerimiento", "REQ-PENDING-APPROVAL", "Pendiente de aprobacion", true],
  [ids.estadoReqCompletado, "EstadoRequerimiento", "REQ-COMPLETED", "Completado", true],
  [ids.estadoReqRechazado, "EstadoRequerimiento", "REQ-REJECTED", "Rechazado", true],
  [ids.estadoProductoTodo, "EstadoProducto", "PROD-TODO", "Por hacer", true],
  [ids.estadoProductoProceso, "EstadoProducto", "PROD-IN-PROGRESS", "En progreso", true],
  [ids.estadoProductoEvidencia, "EstadoProducto", "PROD-EVIDENCE-ATTACHED", "Evidencia adjunta", true],
  [ids.estadoProductoPendiente, "EstadoProducto", "PROD-PENDING-APPROVAL", "Pendiente de aprobacion", true],
  [ids.estadoProductoAprobado, "EstadoProducto", "PROD-APPROVED", "Aprobado", true],
  [ids.estadoProductoRechazado, "EstadoProducto", "PROD-REJECTED", "Rechazado", true],
  [ids.reqInterno, "TipoRequerimiento", "TIPO-INTERNO", "Interno", true],
  [ids.reqInstitucional, "TipoRequerimiento", "TIPO-INSTITUCIONAL", "Institucional", true],
  [ids.formatoPresencial, "FormatoEvento", "FORM-PRESENCIAL", "Presencial", true],
  [ids.formatoVirtual, "FormatoEvento", "FORM-VIRTUAL", "Virtual", true],
  [ids.publicoEstudiantes, "PublicoObjetivo", "PUB-EST-UTI", "Estudiantes UTI", true],
  [ids.publicoEmpresas, "PublicoObjetivo", "PUB-EMPRESAS", "Empresas e Instituciones en general", true],
  [ids.tipoFlyer, "TipoProducto", "PROD-FLYER", "Flyers", true],
  [ids.tipoVideo, "TipoProducto", "PROD-VIDEO-H", "Video Horizontal", true],
  [ids.canalInstagram, "CanalDifusion", "CANAL-INSTAGRAM", "Instagram", true],
  [ids.canalWeb, "CanalDifusion", "CANAL-WEB", "Pagina Web", true],
  [ids.kpiAlcance, "KpiPrincipal", "KPI-ALCANCE", "Alcance", true],
  [ids.kpiAsistentes, "KpiPrincipal", "KPI-ASISTENTES", "# de asistentes al evento", true]
]);

addSheet("Aprobadores", "Aprobadores", ["Id", "Name", "Email", "FacultyId", "CampusId", "ApprovalLevel", "IsActive"], [
  ["77777777-7777-7777-7777-777777777771", "Aprobador Comunicacion Quito", "aprobador.quito@indoamerica.edu.ec", ids.facultyIng, ids.campusQuito, 1, true],
  ["77777777-7777-7777-7777-777777777772", "Aprobador Institucional", "aprobador.institucional@indoamerica.edu.ec", "", "", 2, true]
]);

addSheet("Usuarios", "Usuarios y seguridad", ["Id", "Name", "Email", "PasswordInicial", "Roles", "ScreenPermissions", "AuthProvider", "IsActive"], [
  [ids.userAdmin, "Administrador Plataforma", "admin@local.test", "Admin123!", "Administrador", "dashboard,activities,evidence,approvals,metrics,admin,users,storage,initial-import,branding,notifications", "Local", true],
  [ids.userTecnico, "Tecnico Comunicacion", "tecnico@indoamerica.edu.ec", "Cambiar123!", "Tecnico", "dashboard,activities,evidence", "Microsoft", true]
]);

addSheet("Requerimientos", "Requerimientos", [
  "Id", "Code", "ActivityOrEvent", "RequestedBy", "FacultyId", "Faculty", "Career", "CampusId", "Campus", "Place", "StartDate", "EndDate", "EventObjective", "EventFormatId", "EventFormat", "RequestDate", "StatusId", "Status"
], [
  [ids.reqCasaAbierta, "REQ-20260622001", "Casa abierta Quito", "Direccion de Admisiones", ids.facultyIng, "Facultad de Ingenieria y Tecnologias de la Informacion", "Software", ids.campusQuito, "Sede Quito", "Auditorio principal", new Date("2026-07-10"), new Date("2026-07-10"), "Difundir la oferta academica y captar prospectos.", ids.formatoPresencial, "Presencial", new Date("2026-06-22"), ids.estadoReqBorrador, "Draft"],
  [ids.reqWebinar, "REQ-20260622002", "Webinar institucional", "Marketing Institucional", ids.facultyAdm, "Facultad de Ciencias Administrativas", "Administracion", ids.campusAmbato, "Sede Ambato", "Teams", new Date("2026-07-15"), new Date("2026-07-15"), "Fortalecer posicionamiento institucional.", ids.formatoVirtual, "Virtual", new Date("2026-06-22"), ids.estadoReqBorrador, "Draft"]
], ["Las columnas FacultyId, CampusId, EventFormatId y StatusId son FK locales en RequirementsDb hacia CatalogReferences."]);

addSheet("Productos", "Productos o actividades tecnicas", [
  "Id", "RequirementId", "ProductId", "RequirementTypeId", "RequirementType", "StrategicObjective", "TargetAudienceId", "TargetAudience", "ProductTypeId", "ProductType", "DiffusionChannelId", "DiffusionChannel", "MainKpiId", "MainKpi", "ProductResponsible", "ProductDeliveryDate", "StatusId", "Status", "Observations"
], [
  [ids.prodFlyer, ids.reqCasaAbierta, "PROD-REQ-001-FLYER", ids.reqInstitucional, "Institucional", "Incrementar postulantes calificados.", ids.publicoEstudiantes, "Estudiantes UTI", ids.tipoFlyer, "Flyers", ids.canalInstagram, "Instagram", ids.kpiAlcance, "Alcance", "Equipo de Diseno", new Date("2026-07-05"), ids.estadoProductoTodo, "Todo", "Arte para pauta de redes."],
  [ids.prodVideo, ids.reqWebinar, "PROD-REQ-002-VIDEO", ids.reqInterno, "Interno", "Impulsar posicionamiento digital.", ids.publicoEmpresas, "Empresas e Instituciones en general", ids.tipoVideo, "Video Horizontal", ids.canalWeb, "Pagina Web", ids.kpiAsistentes, "# de asistentes al evento", "Equipo Audiovisual", new Date("2026-07-11"), ids.estadoProductoTodo, "Todo", "Video corto para landing y mailing."]
], ["RequirementId apunta a la hoja Requerimientos. Los demas Id terminados en Id apuntan a la hoja Catalogos."]);

addSheet("Archivos_Notificaciones", "Configuraciones de archivos y notificaciones", ["Modulo", "Campo", "ValorEjemplo", "Observacion"], [
  ["Storage", "Provider", "Local", "Valores esperados: Local, Blob, FTP."],
  ["Storage", "LocalPath", "/app/uploads", "Ruta local del contenedor."],
  ["Storage", "UseCloudInProduction", true, "Activa Blob/FTP en prod segun configuracion."],
  ["Notification", "PowerAutomateWebhookUrl", "https://prod-00.westus.logic.azure.com/workflows/...", "Webhook HTTP de Power Automate."],
  ["Notification", "EmailTo", "comunicacion@indoamerica.edu.ec", "Correo destino principal."],
  ["Notification", "TeamsChannel", "Equipo Comunicacion / General", "Canal o referencia usada por el flujo."]
]);

addSheet("Marca", "Manejo Marca", ["Campo", "ValorEjemplo"], [
  ["Primary", "#3c235f"],
  ["Accent", "#f6b700"],
  ["Logo", "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg"],
  ["Title", "Creamos conexiones que dejan huella"],
  ["Subtitle", "Universidad Indoamerica"],
  ["MenuMode", "horizontal"],
  ["MenuCollapsed", false]
]);

addSheet("Modelo_FK", "Resumen de relaciones FK", ["Tabla", "Columna FK", "Tabla referenciada", "Columna referenciada", "Base de datos"], [
  ["Requirements", "FacultyId", "CatalogReferences", "Id", "RequirementsDb"],
  ["Requirements", "CampusId", "CatalogReferences", "Id", "RequirementsDb"],
  ["Requirements", "EventFormatId", "CatalogReferences", "Id", "RequirementsDb"],
  ["Requirements", "StatusId", "CatalogReferences", "Id", "RequirementsDb"],
  ["Activities", "RequirementTypeId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Activities", "TargetAudienceId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Activities", "ProductTypeId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Activities", "DiffusionChannelId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Activities", "MainKpiId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Activities", "StatusId", "CatalogReferences", "Id", "ActivitiesDb"],
  ["Approvers", "FacultyId", "Faculties", "Id", "AdministrationDb"],
  ["Approvers", "CampusId", "Campuses", "Id", "AdministrationDb"],
  ["Careers", "FacultyId", "Faculties", "Id", "AdministrationDb"]
]);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  used.format.font = { name: "Segoe UI", size: 10 };
}

const inspect = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 6000,
  tableMaxRows: 3,
  tableMaxCols: 6
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan"
});
console.log(errors.ndjson);

for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheet.name}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
try {
  await output.save(path.join(outputDir, "carga-inicial-requirements-platform.xlsx"));
} catch (error) {
  if (error?.code !== "EBUSY") throw error;
  await output.save(path.join(outputDir, "carga-inicial-requirements-platform-v2.xlsx"));
}
