/**
 * Generador robusto de PDF para presupuestos y documentos institucionales
 * Compatible con Tailwind CSS v4, html2canvas y jsPDF
 */
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

  // 2. Carga dinámica de librerías pesadas sólo cuando el usuario realmente genera o previsualiza el PDF
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  try {
    // 3. Función de sanitización de hojas de estilo contra funciones modernas de color que html2canvas no soporta
    // Esto previene el error: Attempting to parse an unsupported color function "lab" / "oklch"
    const sanitizeStylesheets = (doc: Document) => {
      try {
        const styleNodes = doc.querySelectorAll("style");
        styleNodes.forEach((s) => {
          if (s.textContent) {
            s.textContent = s.textContent
              .replace(/lab\([^)]+\)/gi, "rgb(15, 23, 42)")
              .replace(/oklch\([^)]+\)/gi, "rgb(15, 23, 42)")
              .replace(/oklab\([^)]+\)/gi, "rgb(15, 23, 42)")
              .replace(/lch\([^)]+\)/gi, "rgb(15, 23, 42)");
          }
        });
      } catch (err) {
        console.warn("Advertencia al sanitizar estilos:", err);
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
          useCORS: false, // Previene bloqueos CORS con Firebase Storage u orígenes externos
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 850,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            // Sanitizar estilos globales contra lab() y oklch()
            sanitizeStylesheets(clonedDoc);

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
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        sanitizeStylesheets(clonedDoc);
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
  }
};
