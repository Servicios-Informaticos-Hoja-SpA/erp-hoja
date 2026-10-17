export const generatePDF = async (elementId: string, filename: string, action: 'save' | 'preview' = 'save') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    throw new Error("Element not found");
  }

  // Carga dinámica de librerías pesadas sólo cuando el usuario realmente genera o previsualiza el PDF
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  try {
    const sanitizeElement = (clonedEl: HTMLElement) => {
      const allElements = clonedEl.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i] as HTMLElement;
        const styles = window.getComputedStyle(el);
        const sanitize = (val: string) => {
          if (!val) return val;
          if (val.includes("lab(") || val.includes("oklch(") || val.includes("oklab(") || val.includes("hwb(")) {
            return "rgb(0,0,0)";
          }
          return val;
        };

        el.style.color = sanitize(styles.color);
        el.style.backgroundColor = sanitize(styles.backgroundColor);
        el.style.borderColor = sanitize(styles.borderColor);
        el.style.boxShadow = "none";
        el.style.textShadow = "none";
        el.style.filter = "none";
        el.style.backdropFilter = "none";
      }
      clonedEl.style.backgroundColor = "#ffffff";
      clonedEl.style.color = "#000000";
    };

    // Si existen páginas individuales declaradas con [data-pdf-page="true"], procesar cada una de forma independiente
    const pageNodes = element.querySelectorAll<HTMLElement>('[data-pdf-page="true"]');
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
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.getElementById(elementId) || clonedDoc.body;
            sanitizeElement(clonedEl as HTMLElement);
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

    // Fallback: renderizado de contenedor continuo
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1000,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (!clonedEl) return;
        sanitizeElement(clonedEl);
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
