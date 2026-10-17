import { ChecklistItem, ProyectoTipoServicio } from "@/lib/types";

export const CHECKLIST_TEMPLATES: Record<string, { categoria: string; titulo: string; descripcion?: string }[]> = {
  desarrollo_web: [
    { categoria: "Fase 1: Alcance", titulo: "Revisión de Requerimientos y Mockups Aprobados", descripcion: "Validar arquitectura de información y contenidos con el cliente" },
    { categoria: "Fase 2: UI/UX", titulo: "Diseño Adaptativo Multidispositivo (Mobile & Desktop)", descripcion: "Comprobar visualización en resoluciones móviles, tablets y monitores estándar" },
    { categoria: "Fase 2: Backend", titulo: "Configuración de Variables de Entorno y Conectividad", descripcion: "Verificar conexión segura a base de datos, APIs y servicios externos" },
    { categoria: "Fase 3: Calidad", titulo: "Validación de Formularios y Notificaciones", descripcion: "Probar envíos con datos válidos, erróneos y confirmación vía email/webhook" },
    { categoria: "Fase 3: Seguridad", titulo: "Certificados SSL/TLS y Headers de Seguridad", descripcion: "Validar HTTPS estricto, políticas CSP y redirecciones seguras" },
    { categoria: "Fase 3: Despliegue", titulo: "Despliegue en Servidor de Producción y CDN", descripcion: "Configurar DNS A/CNAME en Cloudflare/hosting y compresión de assets" },
    { categoria: "Fase 3: Cierre", titulo: "Ficha de Traspaso de Accesos y Emisión de Acta", descripcion: "Documentar credenciales administrativas y emitir acta de entrega técnica" },
  ],
  soporte_nube: [
    { categoria: "Fase 1: Auditoría", titulo: "Inventario de Recursos y Análisis de Tráfico", descripcion: "Auditoría de servidores actuales, bases de datos y consumo de ancho de banda" },
    { categoria: "Fase 2: Seguridad", titulo: "Políticas de IAM y Claves SSH Blindadas", descripcion: "Configurar accesos por mínimo privilegio, llaves ED25519 y desactivar root login" },
    { categoria: "Fase 2: Infraestructura", titulo: "Aprovisionamiento de VPC, Instancias y Firewalls", descripcion: "Configurar reglas de entrada/salida estrictas y balanceadores de carga" },
    { categoria: "Fase 3: Resiliencia", titulo: "Backups Automatizados y Prueba de Restauración", descripcion: "Validar snapshots automáticos diarios y realizar simulacro de recuperación" },
    { categoria: "Fase 3: Monitoreo", titulo: "Agentes de Monitoreo y Alertas en Tiempo Real", descripcion: "Configurar métricas de CPU, RAM, disco y alertas por Discord/Slack/Email" },
    { categoria: "Fase 3: Cierre", titulo: "Manual Operativo de Contingencia y Entrega", descripcion: "Generar ficha técnica de infraestructura y traspasar llaves al cliente" },
  ],
  ciberseguridad: [
    { categoria: "Fase 1: Diagnóstico", titulo: "Escaneo Perimetral y Mapeo de Puertos", descripcion: "Identificar servicios expuestos, puertos vulnerables y versiones obsoletas" },
    { categoria: "Fase 2: Hardening", titulo: "Cierre de Puertos y Protección Antifuerza Bruta", descripcion: "Implementación de Fail2ban, UFW/iptables y rate-limiting en endpoints clave" },
    { categoria: "Fase 2: Identidad", titulo: "Auditoría de Cuentas y Forzado de 2FA", descripcion: "Exigir autenticación de dos factores en paneles de gestión y correos" },
    { categoria: "Fase 3: Pentesting", titulo: "Simulación de Pruebas de Inyección y Explotación", descripcion: "Verificar resistencia a SQLi, XSS, CSRF y elevación de privilegios" },
    { categoria: "Fase 3: Cierre", titulo: "Informe Técnico Ejecutivo de Mitigaciones", descripcion: "Emisión de reporte formal con vulnerabilidades detectadas y mitigadas" },
  ],
  inventario_hardware: [
    { categoria: "Fase 1: Recepción", titulo: "Inspección Física y Registro de Número de Serie", descripcion: "Anotar serial, marca, modelo y estado físico inicial del equipamiento" },
    { categoria: "Fase 2: Mantenimiento", titulo: "Mantenimiento Preventivo y Limpieza de Componentes", descripcion: "Limpieza de ventiladores, cambio de pasta térmica e inspección de pasta térmica" },
    { categoria: "Fase 2: Configuración", titulo: "Instalación de Sistema Operativo y Drivers Oficiales", descripcion: "Instalación de SO base corporativo, parches de seguridad y controladores" },
    { categoria: "Fase 3: Pruebas", titulo: "Test de Estrés de CPU, Memoria RAM y Salud de Disco", descripcion: "Ejecutar MemTest, CrystalDiskInfo/SMART y pruebas bajo carga durante 2 horas" },
    { categoria: "Fase 3: Cierre", titulo: "Etiquetado de Activo y Emisión de Acta de Recepción", descripcion: "Rotulado con código de inventario y generación del acta formal de entrega técnica" },
  ],
  consultoria: [
    { categoria: "Fase 1: Inicio", titulo: "Reunión de Kickoff y Alineación de Objetivos", descripcion: "Identificar requerimientos clave del negocio y matriz de stakeholders" },
    { categoria: "Fase 2: Diagnóstico", titulo: "Levantamiento de Procesos y Análisis de Brechas", descripcion: "Mapeo del estado actual (As-Is) frente al estado deseado (To-Be)" },
    { categoria: "Fase 2: Propuesta", titulo: "Diseño de la Solución Tecnológica y Roadmap", descripcion: "Elaborar recomendaciones técnicas, análisis costo/beneficio y tiempos" },
    { categoria: "Fase 3: Cierre", titulo: "Presentación Ejecutiva y Entrega de Dictamen", descripcion: "Entrega del informe final de consultoría y acta de cierre formal" },
  ],
  otro: [
    { categoria: "Fase 1: Inicio", titulo: "Definición y Aprobación de Alcance", descripcion: "Acuerdo técnico-comercial y validación de hitos" },
    { categoria: "Fase 2: Ejecución", titulo: "Desarrollo y Seguimiento de Tareas Clave", descripcion: "Ejecución operativa según el cronograma convenido" },
    { categoria: "Fase 3: Calidad", titulo: "Control de Calidad y Pruebas de Aceptación", descripcion: "Validación de entregables técnicos con el cliente" },
    { categoria: "Fase 3: Cierre", titulo: "Emisión y Firma de Acta de Recepción Conforme", descripcion: "Cierre de proyecto y traspaso de garantías postventa" },
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
