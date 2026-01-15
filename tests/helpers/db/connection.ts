// Test database connection
import { prisma } from '@/lib/db/db';

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);

    // Test User model operations
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Current count: ${userCount}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
