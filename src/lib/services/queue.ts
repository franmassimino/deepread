import { Queue, QueueOptions, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { extractProcessor, ExtractJobData } from '@/lib/jobs/extract-job';
import { aiMetadataProcessor, AIMetadataJobData } from '@/lib/jobs/ai-metadata-job';
import { convertProcessor, ConvertJobData } from '@/lib/jobs/convert-job';

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

// Worker singleton
let worker: Worker | null = null;
let isInitializing = false;

/**
 * Initialize workers
 * Call this once when the application starts (server-side only)
 */
export function initializeWorkers(): void {
  // Skip if already initialized or initializing
  if (worker || isInitializing) {
    return;
  }
  
  // Skip on client-side
  if (typeof window !== 'undefined') {
    return;
  }
  
  isInitializing = true;
  
  console.log('[Queue] Initializing job workers...');
  
  // Single worker that dispatches to correct processor based on job name
  worker = new Worker(
    'pdf-processing',
    async (job: Job) => {
      const jobName = job.name;
      
      console.log(`[Worker] Processing job ${job.id} of type ${jobName}`);
      
      switch (jobName) {
        case 'EXTRACT':
          return extractProcessor(job as Job<ExtractJobData>);
        case 'AI_METADATA':
          return aiMetadataProcessor(job as Job<AIMetadataJobData>);
        case 'CONVERT':
          return convertProcessor(job as Job<ConvertJobData>);
        default:
          throw new Error(`Unknown job type: ${jobName}`);
      }
    },
    { 
      connection: redis, 
      concurrency: 3,
      autorun: true,
    }
  );
  
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });
  
  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });
  
  console.log('[Queue] Job workers initialized');
  isInitializing = false;
}

/**
 * Close workers (for graceful shutdown)
 */
export async function closeWorkers(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[Queue] Workers closed');
  }
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

// Auto-initialize on server-side (lazy)
if (typeof window === 'undefined') {
  // Use a flag to prevent multiple initializations
  let initialized = false;
  
  // Delay initialization to avoid issues during build/import
  setTimeout(() => {
    if (!initialized) {
      initialized = true;
      initializeWorkers();
    }
  }, 100);
}
