import { Queue, QueueOptions, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { extractProcessor, ExtractJobData } from '@/lib/jobs/extract-job';
import { aiMetadataProcessor, AIMetadataJobData } from '@/lib/jobs/ai-metadata-job';
import { convertProcessor, ConvertJobData } from '@/lib/jobs/convert-job';

// Initialize workers on module load (server-side only)
if (typeof window === 'undefined') {
  // Delay initialization to avoid issues during build
  setTimeout(() => {
    initializeWorkers();
  }, 0);
}

// Job data type definitions
export interface PdfProcessingJobData {
  bookId: string;
  processingJobId: string;
}

const queueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
};

// Main PDF processing queue
export const pdfQueue = new Queue<ExtractJobData | AIMetadataJobData | ConvertJobData>(
  'pdf-processing',
  queueOptions
);

// Job type to processor mapping
type JobProcessor<T> = (job: Job<T>) => Promise<unknown>;

// Workers
let extractWorker: Worker | null = null;
let aiWorker: Worker | null = null;
let convertWorker: Worker | null = null;

/**
 * Initialize workers
 * Call this once when the application starts
 */
export function initializeWorkers(): void {
  console.log('[Queue] Initializing job workers...');
  
  // EXTRACT worker
  extractWorker = new Worker<ExtractJobData>(
    'pdf-processing',
    async (job) => {
      // Only process EXTRACT jobs here
      if (job.name !== 'EXTRACT') {
        return; // Skip, let other workers handle
      }
      return extractProcessor(job);
    },
    { connection: redis, concurrency: 2 }
  );
  
  extractWorker.on('completed', (job) => {
    console.log(`[Worker:EXTRACT] Job ${job.id} completed`);
  });
  
  extractWorker.on('failed', (job, err) => {
    console.error(`[Worker:EXTRACT] Job ${job?.id} failed:`, err.message);
  });
  
  // AI_METADATA worker
  aiWorker = new Worker<AIMetadataJobData>(
    'pdf-processing',
    async (job) => {
      if (job.name !== 'AI_METADATA') {
        return;
      }
      return aiMetadataProcessor(job);
    },
    { connection: redis, concurrency: 2 }
  );
  
  aiWorker.on('completed', (job) => {
    console.log(`[Worker:AI_METADATA] Job ${job.id} completed`);
  });
  
  aiWorker.on('failed', (job, err) => {
    console.error(`[Worker:AI_METADATA] Job ${job?.id} failed:`, err.message);
  });
  
  // CONVERT worker
  convertWorker = new Worker<ConvertJobData>(
    'pdf-processing',
    async (job) => {
      if (job.name !== 'CONVERT') {
        return;
      }
      return convertProcessor(job);
    },
    { connection: redis, concurrency: 2 }
  );
  
  convertWorker.on('completed', (job) => {
    console.log(`[Worker:CONVERT] Job ${job.id} completed`);
  });
  
  convertWorker.on('failed', (job, err) => {
    console.error(`[Worker:CONVERT] Job ${job?.id} failed:`, err.message);
  });
  
  console.log('[Queue] Job workers initialized');
}

/**
 * Close all workers (for graceful shutdown)
 */
export async function closeWorkers(): Promise<void> {
  await Promise.all([
    extractWorker?.close(),
    aiWorker?.close(),
    convertWorker?.close(),
  ]);
  console.log('[Queue] Workers closed');
}

// Job status retrieval helper
export async function getJobStatus(jobId: string) {
  const job = await pdfQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
  };
}

/**
 * Add a job to the queue
 */
export async function addJob<T extends ExtractJobData | AIMetadataJobData | ConvertJobData>(
  name: 'EXTRACT' | 'AI_METADATA' | 'CONVERT',
  data: T
): Promise<Job<T>> {
  return pdfQueue.add(name, data) as Promise<Job<T>>;
}
