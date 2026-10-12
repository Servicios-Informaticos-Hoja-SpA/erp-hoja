import { ChecklistItem, ProyectoTipoServicio } from "@/lib/types";

export const CHECKLIST_TEMPLATES: Record<ProyectoTipoServicio, { categoria: string; titulo: string; descripcion?: string }[]> = {
  desarrollo_web: [
    { categoria: "Planificación", titulo: "Levantamiento de Requerimientos y Alcance", descripcion: "Validar objetivos y alcance acordado con el cliente" },
    { categoria: "Diseño & UI", titulo: "Diseño y Prototipado UI/UX", descripcion: "Estructura de vistas, componentes y guía de estilos" },
    { categoria: "Arquitectura", titulo: "Setup de Repositorio y Arquitectura Base", descripcion: "Configuración de Next.js, Tailwind, base de datos y CI/CD" },
    { categoria: "Backend", titulo: "Modelado de Base de Datos y APIs", descripcion: "Endpoints, servicios de autenticación y lógica de negocio" },
    { categoria: "Frontend", titulo: "Maquetación e Integración de Vistas", descripcion: "Pantallas dinámicas, formularios y feedback interactivo" },
    { categoria: "Calidad", titulo: "Pruebas de Calidad (QA) y Responsividad", descripcion: "Testing multidispositivo, validación de formularios y performance" },
    { categoria: "Despliegue", titulo: "Despliegue en Ambiente de Producción", descripcion: "Configuración de dominio DNS, certificados SSL y variables de entorno" },
    { categoria: "Cierre", titulo: "Capacitación y Emisión de Acta de Entrega", descripcion: "Entrega de credenciales, manual operativo y firma de conformidad" },
  ],
  soporte_nube: [
    { categoria: "Auditoría", titulo: "Levantamiento de Arquitectura Actual", descripcion: "Auditoría de servidores, bases de datos y red existente" },
    { categoria: "Seguridad", titulo: "Configuración de Permisos e IAM", descripcion: "Políticas de mínimo privilegio, claves SSH y accesos seguros" },
    { categoria: "Infraestructura", titulo: "Aprovisionamiento de Recursos Nube", descripcion: "Configuración de VPC, instancias, storage y firewalls" },
    { categoria: "Resiliencia", titulo: "Políticas de Backups Automatizados", descripcion: "Copias de seguridad diarias y pruebas de restauración" },
    { categoria: "Migración", titulo: "Migración de Datos y Servicios", descripcion: "Traspaso de bases de datos y sincronización de archivos" },
    { categoria: "Monitoreo", titulo: "Monitoreo y Alertas de Disponibilidad", descripcion: "Alertas de CPU, memoria, almacenamiento y caídas de servicio" },
    { categoria: "Cierre", titulo: "Manual Técnico y Entrega de Accesos", descripcion: "Documentación de contingencia y firmas de recepción" },
  ],
  ciberseguridad: [
    { categoria: "Fase 1", titulo: "Escaneo y Análisis de Vulnerabilidades", descripcion: "Escaneo perimetral, puertos abiertos y versiones de software" },
    { categoria: "Fase 2", titulo: "Auditoría de Accesos y Políticas de Contraseñas", descripcion: "Verificación de 2FA, usuarios administradores y llaves SSH" },
    { categoria: "Fase 3", titulo: "Hardening de Servidores y Servicios Expuestos", descripcion: "Bloqueo de puertos innecesarios, Fail2ban y headers de seguridad" },
    { categoria: "Fase 4", titulo: "Pruebas de Penetración y Simulación de Ataques", descripcion: "Validación de exploits comunes, inyecciones y fuerza bruta" },
    { categoria: "Fase 5", titulo: "Emisión de Informe Técnico y Plan de Mitigación", descripcion: "Documento ejecutivo con hallazgos y correcciones aplicadas" },
  ],
  inventario_hardware: [
    { categoria: "Recepción", titulo: "Diagnóstico Físico y Levantamiento Inicial", descripcion: "Inspección visual del equipamiento y componentes" },
    { categoria: "Inventario", titulo: "Registro de Seriales, Modelos y Especificaciones", descripcion: "Planilla de inventario con etiquetado de activos" },
    { categoria: "Mantenimiento", titulo: "Limpieza Interna y Mantenimiento Preventivo", descripcion: "Cambio de pasta térmica, limpieza de disipadores y ventilación" },
    { categoria: "Software", titulo: "Instalación de SO, Drivers y Software Corporativo", descripcion: "Configuración de herramientas y antivirus" },
    { categoria: "Pruebas", titulo: "Pruebas de Estrés y Rendimiento", descripcion: "Testeo de memoria RAM, disco y estabilidad" },
    { categoria: "Entrega", titulo: "Entrega Conforme y Firma de Acta", descripcion: "Recepción por parte del usuario final con acta firmada" },
  ],
  consultoria: [
    { categoria: "Diagnóstico", titulo: "Reunión de Diagnóstico y Objetivos de Negocio", descripcion: "Identificación de necesidades y cuello de botella tecnológico" },
    { categoria: "Análisis", titulo: "Evaluación de Opciones Tecnológicas y Costos", descripcion: "Comparativa técnica, licencias y costos operativos" },
    { categoria: "Propuesta", titulo: "Elaboración de Propuesta de Arquitectura", descripcion: "Diagrama de solución y roadmap de implementación" },
    { categoria: "Cierre", titulo: "Presentación de Resultados al Directorio / Cliente", descripcion: "Reunión ejecutiva y entrega de reporte final" },
  ],
  otro: [
    { categoria: "Inicio", titulo: "Definición de Alcance Inicial", descripcion: "Reunión de kickoff y acuerdos" },
    { categoria: "Ejecución", titulo: "Desarrollo de Tareas Operativas", descripcion: "Ejecución de las labores pactadas" },
    { categoria: "Cierre", titulo: "Validación y Entrega al Cliente", descripcion: "Cierre operativo y conformidad" },
  ],
};

export function getDefaultChecklist(tipo: ProyectoTipoServicio = "desarrollo_web"): ChecklistItem[] {
  const template = CHECKLIST_TEMPLATES[tipo] || CHECKLIST_TEMPLATES.desarrollo_web;
  return template.map((item, index) => ({
    id: `chk-${Date.now()}-${index}`,
    orden: index + 1,
    categoria: item.categoria,
    titulo: item.titulo,
    descripcion: item.descripcion,
    completada: false,
  }));
}
