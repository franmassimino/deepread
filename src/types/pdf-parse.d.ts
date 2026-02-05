// Type declaration for pdf-parse internal module
// This is needed to bypass the debug code in the main index.js that references missing test files

declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    version: string;
  }

  interface PDFParseOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function pdfParse(
    buffer: Buffer,
    options?: PDFParseOptions
  ): Promise<PDFParseResult>;

  export = pdfParse;
}
