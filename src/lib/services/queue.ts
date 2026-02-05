import { Queue, QueueOptions } from 'bullmq';
import { redis } from './redis';

// Job data type definitions
export interface PdfProcessingJobData {
  bookId: string;
  pdfPath: string;
  type: 'upload' | 'extraction' | 'ai-metadata' | 'content-conversion';
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

export const pdfQueue = new Queue<PdfProcessingJobData>(
  'pdf-processing',
  queueOptions
);

// Job status retrieval helper
export async function getJobStatus(jobId: string) {
  const job = await pdfQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
  };
}
