import { ProspectSintoma } from "./types";

export interface CommercialTemplate {
  sintoma: ProspectSintoma;
  tituloCorto: string;
  icono: string;
  descripcionSintoma: string;
  generarMensaje: (nombreNegocio: string) => string;
  generarAsuntoEmail: (nombreNegocio: string) => string;
  pautaLlamada: (nombreNegocio: string) => string;
}

export const PROSPECCION_TEMPLATES: Record<ProspectSintoma, CommercialTemplate> = {
  "Sin página web": {
    sintoma: "Sin página web",
    tituloCorto: "Sin Sitio Web",
    icono: "🌐",
    descripcionSintoma: "No figura en búsquedas de Google ni tiene presencia digital formal.",
    generarMensaje: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "estimado/a";
      return `Hola ${nombre}, te saludo desde Servicios Informáticos Hoja SpA (V Región). Estuve revisando tu negocio y noté que aún no cuentan con un sitio web oficial para captar clientes en Google. En Hoja SpA desarrollamos plataformas modernas con casillas de correo corporativas y botón directo de WhatsApp listas para operar en pocos días. ¿Te gustaría ver una propuesta breve y sin costo?`;
    },
    generarAsuntoEmail: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Propuesta de presencia web y captación de clientes en Google para ${nombre} | Hoja SpA`;
    },
    pautaLlamada: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Hola, buenas tardes. Me comunico con el encargado de ${nombre}. Les llamo de Servicios Informáticos Hoja SpA en la región. Estuve buscando servicios como los suyos y noté que aún no tienen página web oficial en Google para recibir pedidos directos. Queríamos ofrecerles una propuesta rápida y accesible con casillas de correo y botón de WhatsApp. ¿A qué correo o WhatsApp podemos enviarles los detalles?`;
    },
  },
  "Web lenta / Sin certificado SSL": {
    sintoma: "Web lenta / Sin certificado SSL",
    tituloCorto: "Web Lenta / Insegura",
    icono: "🔒",
    descripcionSintoma: "Página tarda en cargar o muestra advertencia 'Sitio no seguro'.",
    generarMensaje: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "estimado/a";
      return `Hola ${nombre}, un gusto saludarte de Servicios Informáticos Hoja SpA. Estuve navegando en su sitio y noté que la carga es lenta y le falta certificado de seguridad SSL ('Sitio no seguro'), lo cual reduce la confianza y ahuyenta clientes en Google. En Hoja SpA optimizamos la velocidad y blindamos la seguridad de tu web rápidamente. ¿Podemos coordinar una revisión técnica sin compromiso?`;
    },
    generarAsuntoEmail: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Auditoría técnica de velocidad y seguridad SSL para el sitio web de ${nombre}`;
    },
    pautaLlamada: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Hola, un gusto saludarles. Les hablo de Hoja SpA. Navegamos en su sitio web y detectamos que tarda bastante en abrir y muestra la advertencia de 'Sitio no seguro'. Esto perjudica el posicionamiento en Google y la confianza de sus clientes. Queríamos consultar si podemos coordinar una revisión técnica sin costo para dejarla rápida y segura.`;
    },
  },
  "Usa correo gratuito (@gmail / @hotmail)": {
    sintoma: "Usa correo gratuito (@gmail / @hotmail)",
    tituloCorto: "Correos Gratuitos",
    icono: "📧",
    descripcionSintoma: "Cotizan o atienden con cuentas @gmail o @hotmail en lugar de dominio propio.",
    generarMensaje: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "estimado/a";
      const dominioSugerido = nombreNegocio
        ? `${nombreNegocio.toLowerCase().replace(/[^a-z0-9]/g, "")}.cl`
        : "tunegocio.cl";
      return `Hola ${nombre}, te escribo de Servicios Informáticos Hoja SpA. Notamos que utilizan correos gratuitos (@gmail/@hotmail) para cotizaciones y atención comercial. Transmitir confianza con casillas corporativas tipo contacto@${dominioSugerido} aumenta un 40% el cierre de ventas. En Hoja SpA configuramos sus casillas profesionales con soporte local. ¿Te gustaría coordinarlo?`;
    },
    generarAsuntoEmail: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su empresa";
      return `Implementación de casillas de correo corporativo profesional para ${nombre}`;
    },
    pautaLlamada: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Hola, un saludo de Hoja SpA. Nos contactamos porque vimos que atienden a sus clientes con cuentas @gmail. Contar con correos con el nombre de su negocio aumenta la formalidad y evita que las cotizaciones caigan en spam. En Hoja SpA configuramos las casillas corporativas en sus teléfonos y computadores en un día. ¿Con quién podríamos coordinar una cotización?`;
    },
  },
  "Ficha de Google Maps abandonada": {
    sintoma: "Ficha de Google Maps abandonada",
    tituloCorto: "Google Maps Abandonado",
    icono: "📍",
    descripcionSintoma: "Perfil de negocio sin botón WhatsApp, horarios antiguos o sin web.",
    generarMensaje: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "estimado/a";
      return `Hola ${nombre}, te contacto desde Servicios Informáticos Hoja SpA. Buscando servicios locales en la zona encontramos su ficha en Google Maps desactualizada (sin enlace web directo ni botón rápido de WhatsApp). Al optimizar su ficha de Maps aumentan de inmediato las llamadas de clientes cercanos. ¿Te interesaría que te apoyemos a activarla y dejarla profesional?`;
    },
    generarAsuntoEmail: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Mejora de visibilidad en Google Maps y clientes locales para ${nombre}`;
    },
    pautaLlamada: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su local";
      return `Hola, ¿qué tal? Les llamo de Hoja SpA. Encontramos su ficha en Google Maps y notamos que no tiene botón directo de WhatsApp ni horarios actualizados. La mayoría de los clientes en la zona buscan por Maps antes de ir o llamar. Nos especializamos en poner al día la ficha y conectarla con WhatsApp para multiplicar sus consultas. ¿Le gustaría que le enviemos un resumen?`;
    },
  },
  "Venta manual por redes / Sin pasarela": {
    sintoma: "Venta manual por redes / Sin pasarela",
    tituloCorto: "Venta Manual por Chat",
    icono: "🛒",
    descripcionSintoma: "Venden por Instagram/Facebook solicitando transferencias manuales 1 a 1.",
    generarMensaje: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "estimado/a";
      return `Hola ${nombre}, un gusto saludarte de parte de Servicios Informáticos Hoja SpA. Vemos que tienen excelentes productos en redes pero gestionan pedidos y pagos de forma manual por chat. En Hoja SpA implementamos catálogos online con pasarelas de pago automatizadas (Webpay / Transbank) para que tus clientes compren 24/7 sin esperas. ¿Te gustaría ver una demo de cómo quedaría para tu negocio?`;
    },
    generarAsuntoEmail: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su tienda";
      return `Catálogo digital y pagos automáticos (Webpay / Débito) para ${nombre}`;
    },
    pautaLlamada: (nombreNegocio: string) => {
      const nombre = nombreNegocio.trim() || "su negocio";
      return `Hola, un gusto saludarles de Hoja SpA. Los contactamos porque seguimos sus productos en redes sociales. Sabemos que responder chats y verificar transferencias una a una quita muchas horas al día. Nosotros habilitamos una tienda online ágil con Webpay y tarjetas para que la gente compre sola y les llegue el pedido directo al correo. ¿Les interesaría ver una demo?`;
    },
  },
};

