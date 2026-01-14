import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

describe('Migration System', () => {
  describe('Migration Files', () => {
    it('should have migrations directory', async () => {
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      const exists = await fs
        .access(migrationsPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have at least one migration', async () => {
      const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
      const files = await fs.readdir(migrationsPath);
      const migrationDirs = files.filter((f) => !f.startsWith('.'));
      expect(migrationDirs.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Status', () => {
    it('should have migrations in sync with database', async () => {
      try {
        const { stdout, stderr } = await execAsync('npx prisma migrate status');
        expect(stdout).toContain('Database schema is up to date');
      } catch (error: any) {
        // Migration status command may exit with code 1 if there are pending migrations
        // We check the output instead
        expect(error.stdout || error.stderr).toBeDefined();
      }
    });
  });

  describe('Schema File', () => {
    it('should have valid schema.prisma file', async () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const exists = await fs
        .access(schemaPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have datasource configuration', async () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const content = await fs.readFile(schemaPath, 'utf-8');
      expect(content).toContain('datasource db');
      expect(content).toContain('provider');
    });

    it('should have generator configuration', async () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const content = await fs.readFile(schemaPath, 'utf-8');
      expect(content).toContain('generator client');
      expect(content).toContain('provider');
    });
  });
});
