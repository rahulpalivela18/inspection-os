/**
 * Rasterize every page of a PDF file to a JPEG data URL. Used so uploaded
 * report intro pages can be stored and printed as ordinary images.
 *
 * pdfjs is loaded on demand so its ~1 MB bundle only ships when a user
 * actually uploads a PDF.
 */
export async function pdfFileToPageImages(
  file: File,
  scale = 2,
): Promise<string[]> {
  const [pdfjsLib, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const context = canvas.getContext("2d");
      if (!context) continue;

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.85));
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}
