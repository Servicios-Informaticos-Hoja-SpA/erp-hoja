/**
 * Generador robusto de PDF para presupuestos y documentos institucionales
 */
export const generatePDF = async (
  elementId: string, 
  filename: string, 
  action: 'save' | 'preview' = 'save'
) => {
  // Esperar activamente si el elemento aún no está completamente montado en el DOM (hasta 2.5 segundos)
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

  // Carga dinámica de librerías pesadas sólo cuando el usuario realmente genera o previsualiza el PDF
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  try {
    // Función de sanitización segura contra formatos de color modernos (oklch, lab, etc.)
    const sanitizeClonedElement = (clonedEl: HTMLElement, clonedDoc: Document) => {
      try {
        const win = clonedDoc.defaultView || window;
        const allElements = clonedEl.getElementsByTagName("*");

        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          try {
            const styles = win.getComputedStyle ? win.getComputedStyle(el) : null;
            if (!styles) continue;

            const isUnsupportedColor = (val?: string | null) => {
              if (!val) return false;
              return val.includes("oklch(") || val.includes("oklab(") || val.includes("lab(") || val.includes("hwb(");
            };

            if (isUnsupportedColor(styles.color)) {
              el.style.color = "#0f172a";
            }
            if (isUnsupportedColor(styles.backgroundColor)) {
              el.style.backgroundColor = "transparent";
            }
            if (isUnsupportedColor(styles.borderColor)) {
              el.style.borderColor = "#e2e8f0";
            }

            el.style.boxShadow = "none";
            el.style.textShadow = "none";
            el.style.filter = "none";
            el.style.backdropFilter = "none";
          } catch {
            // No interrumpir si falla la lectura de un elemento individual
          }
        }

        // Forzar visibilidad y fondo blanco en el contenedor
        clonedEl.style.backgroundColor = "#ffffff";
        clonedEl.style.color = "#0f172a";
        clonedEl.style.opacity = "1";
        clonedEl.style.visibility = "visible";
      } catch (err) {
        console.warn("Advertencia al sanitizar estilos para PDF:", err);
      }
    };

    // Si existen páginas individuales declaradas con [data-pdf-page="true"], procesar cada una de forma independiente
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
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 850,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            // Asegurar que la página clonada tenga visibilidad completa y fondo blanco
            const clonedTarget = (clonedDoc.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')[pIdx]) 
              || clonedDoc.getElementById(elementId) 
              || clonedDoc.body;

            if (clonedTarget) {
              sanitizeClonedElement(clonedTarget as HTMLElement, clonedDoc);
              (clonedTarget as HTMLElement).style.opacity = "1";
              (clonedTarget as HTMLElement).style.visibility = "visible";
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
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId) || clonedDoc.body;
        if (clonedEl) {
          sanitizeClonedElement(clonedEl as HTMLElement, clonedDoc);
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
  }
};
