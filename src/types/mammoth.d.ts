declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages: string[];
  }

  interface Mammoth {
    extractRawText(options: {
      buffer: Buffer;
    }): Promise<ExtractRawTextResult>;
  }

  const mammoth: Mammoth;

  export default mammoth;
}