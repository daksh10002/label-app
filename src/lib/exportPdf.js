// Plain UTF-8, no BOM. Do not add any characters above this line.
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Capture a DOM node to canvas using html2canvas.
 * @param {HTMLElement} node
 * @param {number} scale - upsample for sharper text (2–3 is good)
 * @returns {Promise<HTMLCanvasElement>}
 */
async function captureNode(node, scale = 2) {
  if (!node) throw new Error("captureNode: node is null");

  // Use node's own size to avoid layout surprises
  const width = node.offsetWidth;
  const height = node.offsetHeight;

  const canvas = await html2canvas(node, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    width,
    height,
    // Ensure we render exactly the element
    windowWidth: Math.max(document.documentElement.clientWidth, width),
    windowHeight: Math.max(document.documentElement.clientHeight, height),
  });

  return canvas;
}

/**
 * Export a sheet element (the grid with many tiles) as a single-page PDF.
 * The PDF page size matches the canvas pixel size so there is no reflow.
 *
 * @param {HTMLElement} sheetEl - the wrapper node you pass as ref (e.g. sheetRef.current)
 * @param {string} filename - e.g. "Goshudh_labels.pdf"
 */
export async function downloadSheetAsPdf(sheetEl, filename = "labels.pdf") {
  if (!sheetEl) throw new Error("downloadSheetAsPdf: sheetEl is null");

  // 1) Render to canvas (hi-res)
  const canvas = await captureNode(sheetEl, 2);
  const img = canvas.toDataURL("image/png");

  // 2) Make a PDF sized exactly to the canvas (in CSS pixels)
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "px", // important: we pass pixel sizes directly
    format: [canvas.width, canvas.height],
    compress: true,
  });

  // 3) Fill full page with the image
  pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height, undefined, "FAST");

  // 4) Save
  pdf.save(filename);
}

/**
 * Export N copies as a multi-page PDF where EACH PAGE is EXACTLY 4in × 2in (width × height).
 * Use this when you want 1 sticker per page at true physical size (4" × 2").
 *
 * @param {HTMLElement} labelEl - a single label node styled to 4in × 2in
 * @param {number} copies - how many stickers/pages
 * @param {string} filename - output file name
 */
export async function downloadLabelAsMultipagePdf(
  labelEl,
  copies = 1,
  filename = "labels_2x4_pages.pdf"
) {
  if (!labelEl) throw new Error("downloadLabelAsMultipagePdf: labelEl is null");
  if (!copies || copies < 1) copies = 1;

  // Render ONE label to canvas and reuse it across pages
  const canvas = await captureNode(labelEl, 2);
  const img = canvas.toDataURL("image/png");

  // Fixed page size (in inches) — 4 wide × 2 tall
  const WIDTH_IN = 4;
  const HEIGHT_IN = 2;

  // Landscape because width > height
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [WIDTH_IN, HEIGHT_IN],
    compress: true,
  });

  // First page
  pdf.addImage(img, "PNG", 0, 0, WIDTH_IN, HEIGHT_IN, undefined, "FAST");

  // Additional pages
  for (let i = 1; i < copies; i++) {
    pdf.addPage([WIDTH_IN, HEIGHT_IN], "landscape");
    pdf.addImage(img, "PNG", 0, 0, WIDTH_IN, HEIGHT_IN, undefined, "FAST");
  }

  pdf.save(filename);
}
