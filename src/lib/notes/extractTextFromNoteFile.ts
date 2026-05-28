import type { Buffer } from 'buffer';
import { fetchRemoteFile } from '@/lib/notes/fetchRemoteFile';
import { parsePdf } from '@/lib/notes/parsePdf';
import { parseDocx } from '@/lib/notes/parseDocx';

function inferExtFromUrl(fileUrl: string): string {
  try {
    const pathname = new URL(fileUrl).pathname;
    const lower = pathname.toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.docx')) return 'docx';
  } catch {
    // ignore
  }

  const lower = fileUrl.toLowerCase();
  if (lower.includes('.pdf')) return 'pdf';
  if (lower.includes('.docx')) return 'docx';

  return 'unknown';
}

export async function extractTextFromNoteFile(fileUrl: string): Promise<{ text: string; ext: string }> {
  if (!fileUrl) {
    throw new Error('fileUrl is required');
  }

  const { buffer, contentType } = await fetchRemoteFile(fileUrl);
  const ext = inferExtFromUrl(fileUrl);

  const resolvedExt =
    ext !== 'unknown'
      ? ext
      : contentType?.includes('pdf')
        ? 'pdf'
        : contentType?.includes('word') || contentType?.includes('officedocument')
          ? 'docx'
          : 'unknown';

  if (resolvedExt === 'pdf') {
    const text = await parsePdf(buffer as Buffer);
    return { text, ext: 'pdf' };
  }

  if (resolvedExt === 'docx') {
    const text = await parseDocx(buffer as Buffer);
    return { text, ext: 'docx' };
  }

  throw new Error('Unsupported file type');
}

