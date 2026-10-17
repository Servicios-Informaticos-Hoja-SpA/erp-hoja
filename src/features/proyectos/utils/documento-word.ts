import { Proyecto, ReunionProyecto } from "@/lib/types";
import { HOJA_LOGO_BASE64 } from "./hoja-logo-base64";

/**
 * Utilidad para generar plantillas de documentos en formato Word (.doc enriquecido con HTML/XML de Office)
 * Diseño cuadrado, texto justificado, tipografía estética corporativa (Inter / Segoe UI)
 * y colores corporativos de Hoja SpA (#2e3c7e, #4338ca) con logo de la empresa.
 * Totalmente compatible con Microsoft Word, Google Docs y LibreOffice Writer.
 */

function envolverHtmlWord(titulo: string, contenidoHtml: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: letter portrait;
      margin: 2.2cm 2.2cm 2.2cm 2.2cm;
    }
    body {
      font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #0f172a;
      background: #ffffff;
      text-align: justify;
      text-justify: inter-word;
    }
    h1 {
      font-size: 15pt;
      font-weight: 800;
      color: #2e3c7e;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      border-bottom: 2pt solid #2e3c7e;
      padding-bottom: 6pt;
      margin-top: 14pt;
      margin-bottom: 14pt;
    }
    h2 {
      font-size: 11pt;
      font-weight: 700;
      color: #2e3c7e;
      text-transform: uppercase;
      border-left: 3.5pt solid #2e3c7e;
      padding-left: 6pt;
      margin-top: 14pt;
      margin-bottom: 6pt;
      background-color: #f8fafc;
      padding-top: 3pt;
      padding-bottom: 3pt;
    }
    h3 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 6pt;
      text-align: justify;
      text-justify: inter-word;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 12pt;
      border: 1pt solid #cbd5e1;
    }
    th, td {
      border: 1pt solid #cbd5e1;
      padding: 6pt 8pt;
      font-size: 9.5pt;
      vertical-align: top;
    }
    th {
      background-color: #2e3c7e;
      font-weight: 700;
      color: #ffffff;
      text-align: left;
    }
    .table-subhead {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    .header-box {
      border: 1.5pt solid #2e3c7e;
      background-color: #f8fafc;
      padding: 10pt 12pt;
      margin-bottom: 14pt;
    }
    .badge-iso {
      display: inline-block;
      padding: 3pt 8pt;
      font-size: 8.5pt;
      font-weight: 800;
      background-color: #2e3c7e;
      color: #ffffff;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }
    .firma-box {
      margin-top: 35pt;
      width: 100%;
      border: none;
    }
    .firma-line {
      border-top: 1.5pt solid #2e3c7e;
      width: 82%;
      margin: 0 auto;
      padding-top: 5pt;
      text-align: center;
      font-size: 9pt;
      color: #1e293b;
      line-height: 1.4;
    }
    .footer-iso {
      margin-top: 28pt;
      border-top: 1pt solid #cbd5e1;
      padding-top: 6pt;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
      line-height: 1.3;
    }
    .cuadro-nota {
      border: 1pt solid #cbd5e1;
      background-color: #fafafa;
      padding: 8pt 10pt;
      margin: 6pt 0 10pt 0;
      font-size: 9.5pt;
      text-align: justify;
    }
    .cuadro-alerta {
      border: 1.5pt solid #f87171;
      background-color: #fef2f2;
      color: #991b1b;
      padding: 8pt 10pt;
      margin: 6pt 0 10pt 0;
      font-size: 9pt;
      text-align: justify;
    }
  </style>
</head>
<body>
  ${contenidoHtml}
</body>
</html>`;
}

function generarHeaderMembrete(codigoIso: string, fechaDoc: string, tipoDocumento: string): string {
  return `
    <div class="header-box">
      <table style="border: none; width: 100%; margin: 0;">
        <tr style="border: none;">
          <td style="border: none; width: 68px; vertical-align: middle; text-align: left; padding: 0 10px 0 0;">
            <img src="${HOJA_LOGO_BASE64}" width="54" height="54" alt="Hoja SpA Logo" style="display: block;" />
          </td>
          <td style="border: none; vertical-align: middle; text-align: left;">
            <strong style="font-size: 13pt; color: #2e3c7e; letter-spacing: 0.3pt;">SERVICIOS INFORMÁTICOS HOJA SpA</strong><br>
            <span style="font-size: 8.5pt; color: #475569; font-weight: 600;">RUT: 78.364.078-3 &bull; Sistema Integrado de Gestión Calidad ISO 9001</span><br>
            <span style="font-size: 8.5pt; color: #64748b;">contacto@hojaspa.cl &bull; www.hojaspa.cl &bull; Santiago, Chile</span>
          </td>
          <td style="border: none; width: 32%; text-align: right; vertical-align: middle; padding: 0;">
            <span class="badge-iso">SGC ISO 9001</span><br>
            <strong style="font-size: 9.5pt; color: #2e3c7e; display: inline-block; margin-top: 3pt;">${codigoIso}</strong><br>
            <span style="font-size: 8.5pt; color: #475569;">Fecha: ${fechaDoc}</span><br>
            <span style="font-size: 8pt; color: #64748b; font-style: italic;">${tipoDocumento}</span>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function descargarArchivoWord(nombreArchivo: string, htmlDoc: string) {
  const blob = new Blob(["\ufeff" + htmlDoc], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".doc") ? nombreArchivo : `${nombreArchivo}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. Plantilla de Definición de Alcance & SLA
 */
export function descargarPlantillaAlcanceSLA(proyecto: Proyecto) {
  const fechaHoy = new Date().toLocaleDateString("es-CL");
  const codigoIso = `SGC-PRY-ALC-${proyecto.presupuestoNumero || "001"}`;

  const alcanceListado = Array.isArray(proyecto.alcanceItems) && proyecto.alcanceItems.length > 0
    ? proyecto.alcanceItems.map((item, idx) => `<tr><td style="width: 35px; text-align: center; font-weight: bold;">${idx + 1}</td><td>${item}</td></tr>`).join("")
    : `<tr><td colspan="2" style="font-style: italic; color: #64748b;">[Detallar los módulos, funcionalidades y entregables específicos acordados en la propuesta comercial]</td></tr>`;

  const hitosPagoHtml = Array.isArray(proyecto.hitosPago) && proyecto.hitosPago.length > 0
    ? proyecto.hitosPago.map((h) => `<tr>
        <td><strong>${h.titulo}</strong></td>
        <td style="text-align: center; font-weight: bold;">${h.porcentaje}%</td>
        <td style="text-align: right; font-family: 'Courier New', monospace; font-weight: bold;">$${(h.monto || 0).toLocaleString("es-CL")} CLP</td>
        <td style="text-align: center;">${h.fechaEstimada || "A convenir"}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="font-style: italic; color: #64748b;">[Condiciones de pago según cotización aprobada]</td></tr>`;

  const html = `
    ${generarHeaderMembrete(codigoIso, fechaHoy, "Definición de Alcance & SLA")}

    <h1>DOCUMENTO DE DEFINICIÓN DE ALCANCE & SLA</h1>

    <h2>1. Identificación del Proyecto</h2>
    <table>
      <tr>
        <th style="width: 28%;">Nombre del Proyecto</th>
        <td style="width: 72%;"><strong>${proyecto.nombre}</strong></td>
      </tr>
      <tr>
        <th>Cliente / Razón Social</th>
        <td>${proyecto.clienteNombre} ${proyecto.clienteRut ? `(RUT: ${proyecto.clienteRut})` : ""}</td>
      </tr>
      <tr>
        <th>Tipo de Servicio</th>
        <td>${proyecto.tipoServicio?.replace(/_/g, " ").toUpperCase() || "DESARROLLO DE SOFTWARE"}</td>
      </tr>
      <tr>
        <th>Plazos Comprometidos</th>
        <td>Inicio: ${proyecto.fechaInicio || "Inmediato"} &bull; Entrega Final: <strong>${proyecto.fechaEntregaComprometida || "A convenir"}</strong></td>
      </tr>
      <tr>
        <th>Cotización de Referencia</th>
        <td>${proyecto.presupuestoNumero ? `Presupuesto COT-${proyecto.presupuestoNumero}` : "Contrato Directo"}</td>
      </tr>
    </table>

    <h2>2. Alcance Técnico y Entregables Clave</h2>
    <p>El presente proyecto comprende el diseño, arquitectura, desarrollo, pruebas de aseguramiento de calidad (QA) y despliegue de los siguientes módulos acordados:</p>
    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">N°</th>
          <th>Descripción del Módulo o Entregable Específico</th>
        </tr>
      </thead>
      <tbody>
        ${alcanceListado}
      </tbody>
    </table>

    <h2>3. Acuerdo de Nivel de Servicio (SLA) & Tiempos de Respuesta</h2>
    <p>${proyecto.slaDetalle || "Durante la fase de garantía y soporte operativo, se establecen los siguientes compromisos técnicos:"}</p>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Nivel de Severidad</th>
          <th style="width: 50%;">Descripción Operativa</th>
          <th style="width: 25%; text-align: center;">Tiempo de Respuesta Máximo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Alta (Crítica)</strong></td>
          <td>Interrupción total de producción o caída de servicio crítico</td>
          <td style="text-align: center; font-weight: bold; color: #b91c1c;">&lt; 4 horas hábiles</td>
        </tr>
        <tr>
          <td><strong>Media</strong></td>
          <td>Fallas funcionales parciales o degradación sin detención total del flujo</td>
          <td style="text-align: center; font-weight: bold; color: #d97706;">&lt; 12 horas hábiles</td>
        </tr>
        <tr>
          <td><strong>Baja (Consultas)</strong></td>
          <td>Dudas de usuario, ajustes de configuración y mejoras menores</td>
          <td style="text-align: center; font-weight: bold; color: #2563eb;">&lt; 24 horas hábiles</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Condiciones Comerciales & Hitos de Facturación</h2>
    <p>Monto Total Convenido: <strong>$${(proyecto.montos?.total || 0).toLocaleString("es-CL")} CLP</strong> (Neto: $${(proyecto.montos?.neto || 0).toLocaleString("es-CL")} + IVA)</p>
    <table>
      <thead>
        <tr>
          <th>Hito de Cobro</th>
          <th style="text-align: center; width: 15%;">Porcentaje</th>
          <th style="text-align: right; width: 25%;">Monto (CLP)</th>
          <th style="text-align: center; width: 20%;">Fecha Estimada</th>
        </tr>
      </thead>
      <tbody>
        ${hitosPagoHtml}
      </tbody>
    </table>

    <table class="firma-box">
      <tr style="border: none;">
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>SERVICIOS INFORMÁTICOS HOJA SpA</strong><br>
            RUT: 78.364.078-3<br>
            Área de Operaciones y Desarrollo
          </div>
        </td>
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>${proyecto.clienteNombre}</strong><br>
            ${proyecto.clienteRut ? `RUT: ${proyecto.clienteRut}<br>` : ""}
            Aceptación de Alcance Mandante
          </div>
        </td>
      </tr>
    </table>

    <div class="footer-iso">
      Documento formal de control de alcance bajo Sistema de Gestión de Calidad ISO 9001 de Servicios Informáticos Hoja SpA &bull; Código ${codigoIso}
    </div>
  `;

  const docFinal = envolverHtmlWord(`Alcance y SLA - ${proyecto.nombre}`, html);
  descargarArchivoWord(`ALCANCE_SLA_${proyecto.nombre.replace(/[^a-zA-Z0-9]/g, "_")}.doc`, docFinal);
}

/**
 * 2. Plantilla de Minuta de Reunión & Pruebas QA
 */
export function descargarPlantillaMinutaReunion(proyecto: Proyecto, reunion?: ReunionProyecto) {
  const fechaReunion = reunion?.fecha || new Date().toISOString().split("T")[0];
  const codigoIso = `SGC-PRY-REU-${fechaReunion.replace(/-/g, "")}`;

  const html = `
    ${generarHeaderMembrete(codigoIso, fechaReunion, "Minuta de Reunión & Control Operativo")}

    <h1>MINUTA DE REUNIÓN & REGISTRO DE CALIDAD</h1>

    <h2>1. Datos Generales de la Sesión</h2>
    <table>
      <tr>
        <th style="width: 28%;">Proyecto</th>
        <td style="width: 72%;"><strong>${proyecto.nombre}</strong> &bull; Cliente: <strong>${proyecto.clienteNombre}</strong></td>
      </tr>
      <tr>
        <th>Tipo de Sesión</th>
        <td>${reunion?.tipo?.toUpperCase() || "REVISIÓN / AVANCE TÉCNICO"}</td>
      </tr>
      <tr>
        <th>Título / Motivo</th>
        <td><strong>${reunion?.titulo || "Reunión de Coordinación y Pruebas"}</strong></td>
      </tr>
      <tr>
        <th>Asistentes Participantes</th>
        <td>${Array.isArray(reunion?.asistentes) && reunion.asistentes.length > 0 ? reunion.asistentes.join(", ") : "Equipo Técnico Hoja SpA y Representantes Mandante"}</td>
      </tr>
    </table>

    <h2>2. Temas Tratados y Revisión de Entregables</h2>
    <div class="cuadro-nota">
      ${reunion?.puntosTratados || "Se revisaron los avances del proyecto, módulos desarrollados y estado de cumplimiento de los plazos establecidos según carta gantt."}
    </div>

    <h2>3. Pruebas de Calidad (QA) & Observaciones del Cliente</h2>
    <div class="cuadro-nota">
      ${reunion?.feedbackCliente || "Se realizaron pruebas demostrativas en entorno de staging/QA. Se deja constancia de las observaciones y criterios de aceptación acordados con la contraparte."}
    </div>

    <h2>4. Acuerdos, Compromisos y Próximos Pasos</h2>
    <div class="cuadro-nota">
      ${reunion?.acuerdosYCompromisos || "Se acuerdan las fechas de corrección de observaciones y la fecha estimada de la próxima entrega de avance."}
    </div>

    <table class="firma-box">
      <tr style="border: none;">
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>Por Hoja SpA</strong><br>
            Responsable Técnico de Proyecto
          </div>
        </td>
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>Por el Mandante (${proyecto.clienteNombre})</strong><br>
            Contraparte Técnica / Operativa
          </div>
        </td>
      </tr>
    </table>

    <div class="footer-iso">
      Registro oficial de reunión y control de calidad bajo norma ISO 9001 de Servicios Informáticos Hoja SpA &bull; Código ${codigoIso}
    </div>
  `;

  const docFinal = envolverHtmlWord(`Minuta de Reunion - ${proyecto.nombre}`, html);
  descargarArchivoWord(`MINUTA_${reunion?.titulo?.replace(/[^a-zA-Z0-9]/g, "_") || "REUNION"}.doc`, docFinal);
}

/**
 * 3. Plantilla de Acta de Cierre, Traspaso & Carta de Garantía
 */
export function descargarPlantillaActaCierreYGarantia(proyecto: Proyecto) {
  const fechaHoy = new Date().toLocaleDateString("es-CL");
  const codigoIso = `SGC-PRY-ACT-${proyecto.presupuestoNumero || "PRY"}-${new Date().getFullYear()}`;
  const garantiaDias = proyecto.garantia?.diasGarantia || 60;

  const credencialesHtml = Array.isArray(proyecto.credenciales) && proyecto.credenciales.length > 0
    ? proyecto.credenciales.map((c) => `<tr>
        <td><strong>${c.servicio}</strong></td>
        <td>${c.urlAcceso || "N/A"}</td>
        <td style="font-family: 'Courier New', monospace;">${c.usuarioOEmail}</td>
        <td>${c.rolOPermisos}</td>
        <td>${c.notas || "OK"}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="font-style: italic; color: #64748b;">[Detallar plataformas transferidas: CMS, Panel Hosting, Dominio, Base de Datos, Repositorio]</td></tr>`;

  const html = `
    ${generarHeaderMembrete(codigoIso, fechaHoy, "Acta de Cierre & Carta de Garantía")}

    <h1>ACTA DE ENTREGA, CONFORMIDAD Y CARTA DE GARANTÍA</h1>

    <h2>1. Identificación del Proyecto y Partes</h2>
    <table>
      <tr>
        <th style="width: 28%;">Nombre del Proyecto</th>
        <td style="width: 72%;"><strong>${proyecto.nombre}</strong></td>
      </tr>
      <tr>
        <th>Cliente Mandante</th>
        <td>${proyecto.clienteNombre} ${proyecto.clienteRut ? `(RUT: ${proyecto.clienteRut})` : ""}</td>
      </tr>
      <tr>
        <th>Proveedor Ejecutor</th>
        <td>SERVICIOS INFORMÁTICOS HOJA SpA (RUT: 78.364.078-3)</td>
      </tr>
      <tr>
        <th>Fecha de Despliegue y Puesta en Marcha</th>
        <td>${proyecto.fechaEntregaReal || fechaHoy}</td>
      </tr>
    </table>

    <h2>2. Declaración de Conformidad</h2>
    <p>Por medio del presente instrumento, el cliente mandante declara haber recibido a entera y total satisfacción los entregables comprometidos en la propuesta comercial y especificaciones técnicas para el proyecto <strong>${proyecto.nombre}</strong>, habiéndose ejecutado exitosamente las pruebas operativas en ambiente de producción.</p>

    <h2>3. Detalle de Credenciales y Accesos Traspasados</h2>
    <div class="cuadro-alerta">
      <strong>🔒 PROTOCOLO DE CIBERSEGURIDAD ISO 27001 / 9001:</strong> Por directrices de seguridad de la información, las contraseñas no se plasman en este documento escrito. Todas las claves iniciales maestras y temporales se transfirieron por canal cifrado seguro. Se recomienda al cliente el cambio periódico de las mismas.
    </div>
    <table>
      <thead>
        <tr>
          <th>Servicio / Entorno</th>
          <th>URL de Acceso</th>
          <th>Usuario / Email</th>
          <th>Rol Otorgado</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${credencialesHtml}
      </tbody>
    </table>

    <h2>4. Carta de Garantía Técnica (${garantiaDias} Días Corridos)</h2>
    <p>Hoja SpA otorga una garantía técnica directa por un período ininterrumpido de <strong>${garantiaDias} días corridos</strong> contados a partir de la firma de esta acta, bajo las siguientes condiciones:</p>
    <table>
      <tr>
        <th style="width: 28%;">Alcance de Cobertura</th>
        <td style="width: 72%;">${proyecto.garantia?.alcance || "Corrección prioritaria sin costo adicional de cualquier bug de software, anomalía de base de datos o inconsistencia inherente a los entregables acordados."}</td>
      </tr>
      <tr>
        <th>Exclusiones Explícitas</th>
        <td>${proyecto.garantia?.exclusiones || "No cubre modificaciones o adulteración de código fuente por terceros no autorizados, fallas atribuibles a caídas de servicios externos ajenos a la infraestructura provista, o solicitudes de desarrollo no estipuladas en el alcance inicial."}</td>
      </tr>
      <tr>
        <th>Canal Preferente de Asistencia</th>
        <td>${proyecto.garantia?.contactoEmergencias || "Mesa de Ayuda Hoja SpA &bull; contacto@hojaspa.cl &bull; Soporte Corporativo"}</td>
      </tr>
    </table>

    <table class="firma-box">
      <tr style="border: none;">
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>SERVICIOS INFORMÁTICOS HOJA SpA</strong><br>
            RUT: 78.364.078-3<br>
            Entrega Conforme
          </div>
        </td>
        <td style="border: none; width: 50%; text-align: center;">
          <div class="firma-line">
            <strong>${proyecto.clienteNombre}</strong><br>
            ${proyecto.clienteRut ? `RUT: ${proyecto.clienteRut}<br>` : "Contraparte Mandante<br>"}
            Recepción Conforme Mandante
          </div>
        </td>
      </tr>
    </table>

    <div class="footer-iso">
      Acta formal y carta de garantía emitida bajo Sistema de Gestión de Calidad ISO 9001 de Servicios Informáticos Hoja SpA &bull; Código ${codigoIso}
    </div>
  `;

  const docFinal = envolverHtmlWord(`Acta de Cierre - ${proyecto.nombre}`, html);
  descargarArchivoWord(`ACTA_CIERRE_${proyecto.nombre.replace(/[^a-zA-Z0-9]/g, "_")}.doc`, docFinal);
}
