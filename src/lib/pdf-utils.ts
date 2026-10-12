import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generatePDF = async (elementId: string, filename: string, action: 'save' | 'preview' = 'save') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    throw new Error("Element not found");
  }

  try {
    // 1. LIMPIEZA PREVENTIVA DEL ELEMENTO ORIGINAL
    // Eliminamos cualquier rastro de filtros o sombras que usen oklch antes de clonar

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1000, // Ancho fijo para consistencia
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (!clonedEl) return;

        // ESTRATEGIA NUCLEAR CONTRA COLORES MODERNOS (lab, oklch, hwb)
        // Estos colores rompen el motor de html2canvas
        const allElements = clonedEl.getElementsByTagName("*");
        
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const styles = window.getComputedStyle(el);
          
          // Función para "sanitizar" valores de color
          const sanitize = (val: string) => {
            if (!val) return val;
            if (val.includes("lab(") || val.includes("oklch(") || val.includes("oklab(") || val.includes("hwb(")) {
              return "rgb(0,0,0)"; // Fallback seguro a negro
            }
            return val;
          };

          // Limpiamos propiedades críticas que suelen usar estos colores
          el.style.color = sanitize(styles.color);
          el.style.backgroundColor = sanitize(styles.backgroundColor);
          el.style.borderColor = sanitize(styles.borderColor);
          el.style.boxShadow = "none"; // Las sombras modernas siempre rompen esto
          el.style.textShadow = "none";
          el.style.filter = "none";
          el.style.backdropFilter = "none";
          
          // Forzamos que los textos sean legibles en el clon
          if (el.tagName === "P" || el.tagName === "SPAN" || el.tagName === "H1" || el.tagName === "H2" || el.tagName === "H3" || el.tagName === "TD" || el.tagName === "TH") {
            // Si el color parece ser transparente o "extraño", forzamos negro
            if (el.style.color === "rgb(0,0,0)" && styles.color.includes("0, 0, 0, 0")) {
               // es transparente, lo dejamos
            } else {
               // el.style.color = "#1e293b"; // Un gris oscuro muy seguro
            }
          }
        }

        // Aseguramos el fondo del contenedor principal
        clonedEl.style.backgroundColor = "#ffffff";
        clonedEl.style.color = "#000000";
        clonedEl.style.setProperty("background-color", "#ffffff", "important");
      }
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Ajustamos la imagen al ancho del PDF manteniendo proporción
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const finalWidth = pdfWidth;
    const finalHeight = pdfWidth / ratio;

    let heightLeft = finalHeight;
    let position = 0;

    // Primera página
    pdf.addImage(imgData, "JPEG", 0, position, finalWidth, finalHeight);
    heightLeft -= pdfHeight;

    // Páginas adicionales si el contenido es muy largo
    while (heightLeft > 80) { // Solo agregamos página si queda contenido significativo (ej. más que una sombra/padding)
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
