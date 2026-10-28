import { HOJA_LOGO_BASE64 } from "@/features/proyectos/utils/hoja-logo-base64";

/**
 * Generador robusto de PDF para presupuestos y documentos institucionales
 * Compatible con Tailwind CSS v4, Firefox/Chrome, html2canvas y jsPDF
 */

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

// Helper para convertir cualquier función moderna de color (lab, oklch, oklab, lch, color-mix) a rgb estándar
// usando el motor nativo del navegador (canvas 2D).
function convertColorToRgb(val: string): string {
  if (!val || typeof val !== "string") return val;
  if (
    !val.includes("lab(") && 
    !val.includes("oklch(") && 
    !val.includes("oklab(") && 
    !val.includes("lch(") &&
    !val.includes("color(") &&
    !val.includes("color-mix(")
  ) {
    return val;
  }

  return val.replace(/(?:color-mix|oklch|oklab|lab|lch|color)\([^)]+\)/gi, (match) => {
    try {
      if (typeof document === "undefined") return "rgb(15, 23, 42)";
      if (!sharedCanvas) {
        sharedCanvas = document.createElement("canvas");
        sharedCanvas.width = 1;
        sharedCanvas.height = 1;
        sharedCtx = sharedCanvas.getContext("2d", { willReadFrequently: true });
      }
      if (!sharedCtx) return "rgb(15, 23, 42)";

      sharedCtx.clearRect(0, 0, 1, 1);
      sharedCtx.fillStyle = "#000000";
      sharedCtx.fillStyle = match;

      const fs = sharedCtx.fillStyle;
      if (fs && (fs.startsWith("#") || fs.startsWith("rgb"))) {
        return fs;
      }

      // Fallback infalible mediante lectura de búfer sRGB del píxel renderizado
      sharedCtx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = sharedCtx.getImageData(0, 0, 1, 1).data;
      if (a === 0) return "transparent";
      return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
    } catch {
      return "rgb(15, 23, 42)";
    }
  });
}

const IS_PROXY_KEY = Symbol("IS_STYLE_PROXY");

// Proxy sobre CSSStyleDeclaration para interceptar lecturas de propiedades y convertirlas a RGB
// Se evita pasar 'receiver' para preservar el branding check nativo de Firefox/Chrome en getters de CSS
function createStyleProxy(styleDecl: CSSStyleDeclaration): CSSStyleDeclaration {
  if (!styleDecl) return styleDecl;
  if ((styleDecl as any)[IS_PROXY_KEY]) return styleDecl;

  return new Proxy(styleDecl, {
    get(target, prop) {
      if (prop === IS_PROXY_KEY) return true;
      try {
        if (typeof prop === "symbol") {
          return (target as any)[prop];
        }

        const orig = (target as any)[prop];

        if (typeof orig === "function") {
          if (prop === "getPropertyValue") {
            return (propertyName: string) => {
              try {
                const val = target.getPropertyValue(propertyName);
                return convertColorToRgb(val);
              } catch {
                return "";
              }
            };
          }
          return orig.bind(target);
        }

        if (typeof orig === "string") {
          return convertColorToRgb(orig);
        }

        return orig;
      } catch {
        return undefined;
      }
    }
  });
}

export const generatePDF = async (
  elementId: string, 
  filename: string, 
  action: 'save' | 'preview' = 'save'
) => {
  // 1. Esperar activamente si el elemento aún no está completamente montado en el DOM (hasta 2.5 segundos)
  let element = document.getElementById(elementId);
  if (!element) {
    const startTime = Date.now();
    while (Date.now() - startTime < 2500) {
      await new Promise(resolve => setTimeout(resolve, 80));
      element = document.getElementById(elementId);
      if (element) break;
    }
  }

  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    throw new Error(`No se encontró el elemento #${elementId} para generar el PDF`);
  }

  // 2. Interceptar window.getComputedStyle durante la generación del PDF para neutralizar lab() y oklch()
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    if (!elt) return originalGetComputedStyle.call(window, elt, pseudoElt);
    const realStyle = originalGetComputedStyle.call(window, elt, pseudoElt);
    return createStyleProxy(realStyle);
  };

  try {
    // 3. Carga dinámica de librerías pesadas bajo demanda
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    // Función de limpieza de hojas de estilo y elementos del documento clonado
    const sanitizeClonedDoc = (clonedDoc: Document) => {
      try {
        // Interceptar getComputedStyle dentro del iframe clonado
        if (clonedDoc.defaultView) {
          const origIframeStyle = clonedDoc.defaultView.getComputedStyle;
          clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
            if (!elt) return origIframeStyle.call(clonedDoc.defaultView, elt, pseudoElt);
            const realStyle = origIframeStyle.call(clonedDoc.defaultView, elt, pseudoElt);
            return createStyleProxy(realStyle);
          };
        }

        // Sanitizar hojas de estilo <style>
        const styleNodes = clonedDoc.querySelectorAll("style");
        styleNodes.forEach((s) => {
          if (s.textContent && (s.textContent.includes("lab(") || s.textContent.includes("oklch("))) {
            s.textContent = convertColorToRgb(s.textContent);
          }
        });

        // Sanitizar atributos style inline
        const allWithStyle = clonedDoc.querySelectorAll("[style]");
        allWithStyle.forEach((el) => {
          const s = el.getAttribute("style");
          if (s && (s.includes("lab(") || s.includes("oklch("))) {
            el.setAttribute("style", convertColorToRgb(s));
          }
        });

        // Sustituir imágenes del logo con base64 para evitar peticiones de red o bloqueos CORS
        const allImgs = clonedDoc.querySelectorAll("img");
        allImgs.forEach((img) => {
          if (img.src && (img.src.includes("logo.png") || img.src.includes("favicon.ico"))) {
            img.src = HOJA_LOGO_BASE64;
          }
        });
      } catch (err) {
        console.warn("Advertencia al sanitizar estilos para PDF:", err);
      }
    };

    // 4. Si existen páginas individuales declaradas con [data-pdf-page="true"], procesar cada una de forma independiente
    let pageNodes = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-page="true"]'));
    if (pageNodes.length === 0 && element.hasAttribute('data-pdf-page')) {
      pageNodes = [element];
    }

    if (pageNodes.length > 0) {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "letter",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let pIdx = 0; pIdx < pageNodes.length; pIdx++) {
        const pageEl = pageNodes[pIdx];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 850,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            sanitizeClonedDoc(clonedDoc);

            // Asegurar que la página clonada tenga visibilidad completa y fondo blanco
            const allClonedPages = clonedDoc.querySelectorAll<HTMLElement>('[data-pdf-page="true"]');
            if (allClonedPages[pIdx]) {
              allClonedPages[pIdx].style.opacity = "1";
              allClonedPages[pIdx].style.visibility = "visible";
              allClonedPages[pIdx].style.backgroundColor = "#ffffff";
            }

            // Asegurar que el contenedor padre tenga visibilidad en el DOM clonado
            const printContainer = clonedDoc.getElementById(elementId);
            if (printContainer) {
              printContainer.style.opacity = "1";
              printContainer.style.visibility = "visible";
              printContainer.style.position = "static";
              printContainer.style.zIndex = "auto";
            }
          },
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (pIdx > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      if (action === 'preview') {
        const blob = pdf.output('bloburl');
        window.open(blob, '_blank');
      } else {
        pdf.save(`${filename}.pdf`);
      }
      return;
    }

    // Fallback: renderizado de contenedor continuo si no hay páginas discretas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        sanitizeClonedDoc(clonedDoc);
        const clonedEl = clonedDoc.getElementById(elementId) || clonedDoc.body;
        if (clonedEl) {
          clonedEl.style.opacity = "1";
          clonedEl.style.visibility = "visible";
        }
      }
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "letter"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const finalWidth = pdfWidth;
    const finalHeight = pdfWidth / ratio;

    let heightLeft = finalHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, finalWidth, finalHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 80) {
      position = heightLeft - finalHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, finalWidth, finalHeight);
      heightLeft -= pdfHeight;
    }
    
    if (action === 'preview') {
      const blob = pdf.output('bloburl');
      window.open(blob, '_blank');
    } else {
      pdf.save(`${filename}.pdf`);
    }
  } catch (error) {
    console.error("FATAL PDF ERROR:", error);
    throw error;
  } finally {
    // Restaurar window.getComputedStyle original sin importar el resultado
    window.getComputedStyle = originalGetComputedStyle;
  }
};
