export type FetchRemoteFileResult = {
  buffer: Buffer;
  contentType?: string;
};

export async function fetchRemoteFile(
  url: string,
  opts?: {
    timeoutMs?: number;
    maxBytes?: number;
  }
): Promise<FetchRemoteFileResult> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const maxBytes = opts?.maxBytes ?? 25 * 1024 * 1024; // 25MB

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? undefined;

    if (!res.ok) {
      throw new Error(`Remote fetch failed: ${res.status} ${res.statusText}`);
    }

    // Ensure we don’t accidentally download huge responses.
    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new Error(`Remote file too large: ${contentLength} bytes`);
    }

    const arr = await res.arrayBuffer();
    if (arr.byteLength > maxBytes) {
      throw new Error(`Remote file too large: ${arr.byteLength} bytes`);
    }

    return {
      buffer: Buffer.from(arr),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

