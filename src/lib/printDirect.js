// Open a clean print-only window and print the given node at exact inches.
// Usage: printNodeDirect(ref.current, { widthIn: 4, heightIn: 3, copies: 5, title: "Goshudh 3x4" })
export async function printNodeDirect(node, { widthIn, heightIn, copies = 1, title = "Label Print" } = {}) {
  if (!node) return;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const html = node.outerHTML;
  const pages = Array.from({ length: Math.max(1, Number(copies) || 1) })
    .map((_, i) => `<div class="page">${html}</div>`)
    .join("");

  // NOTE: @page sets paper size; margins 0 so your label fills the page.
  // We also set inch dimensions on .page to avoid scaling.
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <base href="${location.origin}/" />
        <style>
          @page { size: ${widthIn}in ${heightIn}in; margin: 0; }
          html, body { padding: 0; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { all: initial; } /* defensive reset, your label uses inline styles */
          .page {
            width: ${widthIn}in;
            height: ${heightIn}in;
            display: block;
            page-break-after: always;
            overflow: hidden;
          }
          .page:last-child { page-break-after: auto; }
        </style>
      </head>
      <body>
        ${pages}
      </body>
    </html>
  `);

  // Give images time to load before printing
  const waitForImages = () =>
    new Promise((resolve) => {
      const imgs = w.document.images;
      if (!imgs || imgs.length === 0) return resolve();
      let loaded = 0;
      for (const img of imgs) {
        if (img.complete) {
          loaded++;
          if (loaded === imgs.length) resolve();
        } else {
          img.addEventListener("load", () => {
            loaded++;
            if (loaded === imgs.length) resolve();
          });
          img.addEventListener("error", () => {
            loaded++;
            if (loaded === imgs.length) resolve();
          });
        }
      }
    });

  w.document.close();
  await waitForImages();

  // Print & close the tab afterward (the user’s dialog decides printer/copies)
  w.focus();
  w.print();
  // Optional: close after a delay (comment out if you prefer to keep it open)
  setTimeout(() => { try { w.close(); } catch {} }, 300);
}
