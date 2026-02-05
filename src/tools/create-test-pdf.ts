import fs from 'fs/promises';
import path from 'path';

// Create a minimal valid PDF for testing
// This is a very basic PDF structure that pdf-parse can read
const minimalPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World from PDF Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
308
%%EOF`;

async function createTestPDF() {
  const testDir = path.join(process.cwd(), 'tests/fixtures/pdfs');
  await fs.mkdir(testDir, { recursive: true });
  
  const pdfPath = path.join(testDir, 'sample.pdf');
  await fs.writeFile(pdfPath, minimalPDF);
  
  console.log(`Created test PDF at: ${pdfPath}`);
}

createTestPDF();
