import type { Buffer } from 'buffer';

export async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const extractRawText = (mammoth as any).default?.extractRawText ?? (mammoth as any).extractRawText;
  if (!extractRawText) {
    throw new Error('mammoth.extractRawText is not available');
  }

  const result = await extractRawText({ buffer });
  return result?.value ?? '';
}

