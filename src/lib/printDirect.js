// src/lib/printDirect.js
import html2canvas from "html2canvas";

/**
 * Direct-print a node at an exact physical page size, with N copies = N pages.
 * - node: DOM element to print
 * - widthIn / heightIn: page size in inches (e.g. 4, 3 for 4x3in)
 * - copies: number of pages to print
 * - title: optional print job title
 *
 * This uses a hidden iframe (no popup tab) and forces one copy per page.
 */
export async function printNodeDirect(node, {
  widthIn,
  heightIn,
  copies = 1,
  title = "Label Print",
  canvasScale = 3,       // bump for sharper print if needed
} = {}) {
  if (!node) return;

  // Render the node to an image (so layout is frozen for print)
  const canvas = await html2canvas(node, {
    scale: canvasScale,
    backgroundColor: "#ffffff",
  });
  const dataUrl = canvas.toDataURL("image/png");

  // Build a print document that locks page size and puts one image per page
  const pageCSS = `
    @page { size: ${widthIn}in ${heightIn}in; margin: 0; }
    @media print {
      html, body { margin: 0; padding: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    .page {
      width: ${widthIn}in;
      height: ${heightIn}in;
      display: block;
      page-break-after: always;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .fit {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain; /* keep aspect */
      background: #ffffff;
    }
  `;

  let html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>${title}</title><style>${pageCSS}</style></head><body>`;

  for (let i = 0; i < Math.max(1, copies); i++) {
    html += `<div class="page"><img class="fit" src="${dataUrl}" /></div>`;
  }

  html += `</body></html>`;

  // Create hidden iframe (no new tab)
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  // Write the print doc into the iframe
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Give the browser a tick to layout images, then print
  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      // Cleanup after a short delay to let print dialog open
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  };

  // If images haven't loaded yet, wait for load
  const imgs = doc.images;
  let pending = imgs.length;
  if (pending === 0) {
    doPrint();
  } else {
    for (const img of imgs) {
      if (img.complete) {
        if (--pending === 0) doPrint();
      } else {
        img.onload = img.onerror = () => {
          if (--pending === 0) doPrint();
        };
      }
    }
  }
}
