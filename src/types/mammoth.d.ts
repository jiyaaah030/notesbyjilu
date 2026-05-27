declare module 'mammoth' {
  const mammoth: any;
  export default mammoth;
  export function extractRawText(options: { buffer: ArrayBuffer | Buffer | Uint8Array } | { path: string }): Promise<{ value: string; messages?: any[] }>;
}
