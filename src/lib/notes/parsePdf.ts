import type { Buffer } from 'buffer';

export async function parsePdf(buffer: Buffer): Promise<string> {
  const { default: pdfParse } = await import('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text ?? '';
}

