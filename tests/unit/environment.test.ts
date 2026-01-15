import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Environment Configuration', () => {
  describe('.env file', () => {
    it('should have .env file', async () => {
      const envPath = path.join(process.cwd(), '.env');
      const exists = await fs
        .access(envPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load DATABASE_URL from .env', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(typeof process.env.DATABASE_URL).toBe('string');
    });
  });

  describe('.env.example file', () => {
    it('should have .env.example file', async () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const exists = await fs
        .access(envExamplePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have DATABASE_URL template in .env.example', async () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const content = await fs.readFile(envExamplePath, 'utf-8');
      expect(content).toContain('DATABASE_URL');
    });
  });

  describe('.gitignore', () => {
    it('should ignore .env files', async () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toMatch(/\.env/);
    });
  });
});
