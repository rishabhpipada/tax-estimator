import Tesseract from 'tesseract.js';

export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(/,/g, '');
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : Math.round(value * 100) / 100;
}

/**
 * Render a PDF file to a canvas image for OCR processing.
 * Uses pdfjs-dist to render the first page at high DPI.
 */
export async function pdfToImageBlob(file: File): Promise<Blob> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use local worker file copied to public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // Render at 2x scale for better OCR accuracy
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d')!;
  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert PDF page to image'));
      },
      'image/png'
    );
  });
}

/**
 * Run Tesseract OCR on a file (image or PDF).
 * If PDF, renders the first page to an image first.
 */
export async function performOcr(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  let ocrInput: File | Blob = file;

  if (file.type === 'application/pdf') {
    if (onProgress) onProgress(5);
    try {
      ocrInput = await pdfToImageBlob(file);
      if (onProgress) onProgress(15);
    } catch (err) {
      console.error('PDF rendering failed:', err);
      throw new Error('Failed to render PDF. Try uploading an image instead.');
    }
  }

  const result = await Tesseract.recognize(ocrInput, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        const base = file.type === 'application/pdf' ? 15 : 0;
        const range = 100 - base;
        onProgress(base + Math.round(m.progress * range));
      }
    },
  });

  return result.data.text;
}
