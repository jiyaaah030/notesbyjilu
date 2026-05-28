import fs from 'fs';
import path from 'path';

export type ExtractedNoteText = {
  text: string;
  ext: string;
};

function findReadableFile(fileCandidates: string[]): string | null {
  for (const p of fileCandidates) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

export function resolveNoteFilePaths(noteFilename: string | undefined, noteFileUrl: string | undefined) {
  const filename = noteFilename || path.basename(noteFileUrl || '');
  if (!filename) return [];

  const publicCandidate = path.join(process.cwd(), 'public', 'uploads', filename);
  const uploadServerCandidate = path.join(process.cwd(), 'upload-server', 'uploads', filename);

  // Normalize for safety
  return [path.normalize(publicCandidate), path.normalize(uploadServerCandidate)];
}

export async function extractNoteTextFromFile(args: {
  noteFilename?: string;
  noteFileUrl?: string;
}): Promise<ExtractedNoteText> {
  const candidates = resolveNoteFilePaths(args.noteFilename, args.noteFileUrl);
  if (candidates.length === 0) {
    throw new Error('Note file path could not be resolved');
  }

  const filePath = findReadableFile(candidates);
  if (!filePath) {
    throw new Error(`Note file not found (tried: ${candidates.join(', ')})`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const dataBuffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(dataBuffer);
    return { text: data.text || '', ext };
  }

  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const extractRawText = (mammoth as any).default?.extractRawText ?? (mammoth as any).extractRawText;
    if (!extractRawText) {
      throw new Error('mammoth.extractRawText is not available');
    }

    const result = await extractRawText({ buffer: dataBuffer });
    return { text: result.value || '', ext };
  }

  throw new Error(`Unsupported note file type: ${ext}`);
}

