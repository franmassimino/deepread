/**
 * Manual Test Script for Redis and BullMQ Setup
 *
 * Prerequisites:
 * 1. Start Redis: docker-compose up -d
 * 2. Run this script: npx tsx tests/manual/redis-bullmq-test.ts
 */

import { redis } from '@/lib/services/redis';
import { pdfQueue, getJobStatus, PdfProcessingJobData } from '@/lib/services/queue';
import { Worker, QueueEvents } from 'bullmq';

async function testRedisConnection() {
  console.log('\n=== Testing Redis Connection ===');
  try {
    const pong = await redis.ping();
    console.log('✓ Redis PING response:', pong);
    return true;
  } catch (error) {
    console.error('✗ Redis connection failed:', error);
    return false;
  }
}

async function testQueueAndWorker() {
  console.log('\n=== Testing BullMQ Queue and Worker ===');

  // Create queue events for listening
  const queueEvents = new QueueEvents('pdf-processing', { connection: redis });

  // Add test job
  console.log('Adding test job to queue...');
  const job = await pdfQueue.add('test-job', {
    bookId: 'test-123',
    pdfPath: '/test/path.pdf',
    type: 'upload',
  } as PdfProcessingJobData);

  console.log('✓ Job added with ID:', job.id);

  // Create simple worker
  const worker = new Worker<PdfProcessingJobData>(
    'pdf-processing',
    async (job) => {
      console.log('  → Processing job:', job.id);
      console.log('  → Job data:', job.data);

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('  ✓ Job completed');
      return { success: true };
    },
    { connection: redis }
  );

  // Wait for job to complete
  await job.waitUntilFinished(queueEvents);

  const status = await getJobStatus(job.id!);
  console.log('✓ Job status:', status);

  await worker.close();
  await queueEvents.close();
}

async function testRetryLogic() {
  console.log('\n=== Testing Retry Logic with Failing Job ===');

  let attemptCount = 0;
  const queueEvents = new QueueEvents('pdf-processing', { connection: redis });

  const worker = new Worker<PdfProcessingJobData>(
    'pdf-processing',
    async (job) => {
      attemptCount++;
      console.log(`  → Attempt ${attemptCount} for job ${job.id}`);

      // Always fail to test retries
      throw new Error('Intentional failure for testing');
    },
    { connection: redis }
  );

  const job = await pdfQueue.add('failing-job', {
    bookId: 'test-456',
    pdfPath: '/test/fail.pdf',
    type: 'upload',
  } as PdfProcessingJobData);

  console.log('✓ Failing job added with ID:', job.id);
  console.log('  Waiting for retries (2s, 4s, 8s delays)...');

  // Wait for all retries to complete (about 15 seconds total)
  await new Promise(resolve => setTimeout(resolve, 20000));

  const status = await getJobStatus(job.id!);
  console.log('✓ Final job status:', status);
  console.log(`✓ Total attempts: ${attemptCount} (expected: 3)`);

  if (attemptCount === 3) {
    console.log('✓ Exponential backoff working correctly!');
  } else {
    console.log('✗ Retry count mismatch');
  }

  await worker.close();
  await queueEvents.close();
}

// Run all tests
(async () => {
  try {
    const redisConnected = await testRedisConnection();

    if (!redisConnected) {
      console.error('\n✗ Redis is not running. Please start it with: docker-compose up -d');
      process.exit(1);
    }

    await testQueueAndWorker();
    await testRetryLogic();

    console.log('\n✅ All tests passed!');
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    await redis.quit();
    process.exit(1);
  }
})();
