declare module 'mammoth' {
  export interface ExtractRawTextResult {
    value: string;
    messages: string[];
  }

  export function extractRawText(options: {
    buffer: Buffer;
  }): Promise<ExtractRawTextResult>;

  interface MammothModule {
    extractRawText: typeof extractRawText;
  }

  const mammoth: MammothModule;

  export default mammoth;
}

