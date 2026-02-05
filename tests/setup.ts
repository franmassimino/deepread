// Test setup file
import 'dotenv/config';

// Prevent pdf-parse from loading test files during import
process.env.PDF_PARSE_DISABLE_TEST = 'true';
