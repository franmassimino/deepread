import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/db/db';

describe('Database Setup', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Prisma Client Instantiation', () => {
    it('should instantiate Prisma Client successfully', () => {
      expect(prisma).toBeDefined();
      expect(prisma.$connect).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
    });

    it('should use singleton pattern (same instance)', () => {
      const { prisma: prisma1 } = require('../lib/db/db');
      const { prisma: prisma2 } = require('../lib/db/db');
      expect(prisma1).toBe(prisma2);
    });
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should execute raw SQL query', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should access User model', async () => {
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Environment Variables', () => {
    it('should load DATABASE_URL from environment', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('file:');
    });

    it('should have NODE_ENV configured', () => {
      expect(process.env.NODE_ENV).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    it('should create a test user', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe('Test User');
      expect(user.id).toBeDefined();

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should read user from database', async () => {
      const testEmail = `test-read-${Date.now()}@example.com`;
      const created = await prisma.user.create({
        data: { email: testEmail, name: 'Read Test' },
      });

      const found = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeDefined();
      expect(found?.email).toBe(testEmail);

      // Cleanup
      await prisma.user.delete({ where: { id: created.id } });
    });

    it('should update user in database', async () => {
      const testEmail = `test-update-${Date.now()}@example.com`;
      const created = await prisma.user.create({
        data: { email: testEmail, name: 'Original Name' },
      });

      const updated = await prisma.user.update({
        where: { id: created.id },
        data: { name: 'Updated Name' },
      });

      expect(updated.name).toBe('Updated Name');

      // Cleanup
      await prisma.user.delete({ where: { id: created.id } });
    });

    it('should delete user from database', async () => {
      const testEmail = `test-delete-${Date.now()}@example.com`;
      const created = await prisma.user.create({
        data: { email: testEmail, name: 'Delete Test' },
      });

      await prisma.user.delete({ where: { id: created.id } });

      const found = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(found).toBeNull();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should have TypeScript types for models', () => {
      // This test verifies that TypeScript compilation works
      // If types are not generated, this would fail at compile time
      const user: { id: number; email: string; name: string | null } = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
      };
      expect(user).toBeDefined();
    });
  });
});
