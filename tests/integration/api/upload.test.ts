import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const API_URL = 'http://localhost:3000/api/upload';

describe('Upload API', () => {
  it('should accept valid PDF upload', async () => {
    const formData = new FormData();
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'test.pdf');

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.bookId).toBeDefined();
  });

  it('should reject non-PDF files', async () => {
    const formData = new FormData();
    const blob = new Blob([Buffer.from('not a pdf')], { type: 'text/plain' });
    formData.append('file', blob, 'test.txt');

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid PDF');
  });

  it('should reject files over 50MB', async () => {
    const formData = new FormData();
    const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
    const blob = new Blob([largeBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'large.pdf');

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(413);
  });

  it('should return 400 when no file provided', async () => {
    const formData = new FormData();

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);
  });
});
