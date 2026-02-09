import { JobType, JobStatus } from '@prisma/client';

/**
 * Get a human-readable message for the current job stage
 */
export function getStageMessage(
  type: JobType,
  progress: number,
  status: JobStatus,
  customMessage?: string | null
): string {
  // Return custom message if provided
  if (customMessage) {
    return customMessage;
  }

  // Handle terminal states
  if (status === 'FAILED') {
    return 'Processing failed';
  }
  
  if (status === 'COMPLETED') {
    return 'Ready!';
  }

  if (status === 'PENDING') {
    return 'Waiting to start...';
  }

  // Handle active states based on job type and progress
  switch (type) {
    case 'EXTRACT':
      if (progress < 33) {
        return 'Extracting text...';
      }
      if (progress < 67) {
        return 'Extracting tables and images...';
      }
      return 'Finalizing extraction...';

    case 'AI_METADATA':
      return 'Analyzing content...';

    case 'CONVERT':
      return 'Converting to HTML...';

    default:
      return 'Processing...';
  }
}

/**
 * Get a short stage identifier for UI components
 */
export function getStageIdentifier(
  type: JobType,
  progress: number,
  status: JobStatus
): string {
  if (status === 'FAILED') return 'failed';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'PENDING') return 'pending';

  switch (type) {
    case 'EXTRACT':
      if (progress < 33) return 'extract-text';
      if (progress < 67) return 'extract-visual';
      return 'extract-finalize';
    case 'AI_METADATA':
      return 'ai-analysis';
    case 'CONVERT':
      return 'convert-html';
    default:
      return 'processing';
  }
}

/**
 * Calculate overall progress for a job chain
 * This aggregates progress across all job types
 */
export function calculateOverallProgress(
  currentType: JobType,
  currentProgress: number
): number {
  // Map each job type to a range of the overall 0-100 progress
  const jobRanges: Record<JobType, { min: number; max: number }> = {
    EXTRACT: { min: 0, max: 40 },
    AI_METADATA: { min: 40, max: 70 },
    CONVERT: { min: 70, max: 100 },
  };

  const range = jobRanges[currentType];
  if (!range) return currentProgress;

  // Scale the current progress to fit within the job's range
  const scaledProgress = range.min + (currentProgress / 100) * (range.max - range.min);
  return Math.round(scaledProgress);
}
