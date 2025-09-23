// /src/lib/exportSingle.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Capture a single DOM node and export a fixed-size PDF (in inches).
 * Repeats the same page N times when `copies` > 1.
 */
export async function downloadNodeAsPdf(
  node,
  {
    widthIn,
    heightIn,
    filename = "label.pdf",
    copies = 1,
    dpi = 300,
  } = {}
) {
  if (!node) return;

  const pxPerIn = dpi; // render DPI for crisp print
  const canvas = await html2canvas(node, {
    scale: pxPerIn / 96, // browser CSS ~96 px/in
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const img = canvas.toDataURL("image/png");

  const isLandscape = widthIn >= heightIn;
  const pdf = new jsPDF({
    unit: "in",
    format: [widthIn, heightIn],
    orientation: isLandscape ? "landscape" : "portrait",
    compress: true,
  });

  const pages = Math.max(1, Number(copies) || 1);
  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage([widthIn, heightIn], isLandscape ? "landscape" : "portrait");
    pdf.addImage(img, "PNG", 0, 0, widthIn, heightIn);
  }

  pdf.save(filename);
}

/* Backward-compatible aliases (older pages might import these names) */
export const exportSingleLabelPDF = downloadNodeAsPdf;
export const exportSingle = downloadNodeAsPdf;
