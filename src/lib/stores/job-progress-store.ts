'use client';

import { create } from 'zustand';
import { JobProgress } from '@/lib/hooks/use-job-progress';

export interface ActiveJob {
  jobId: string;
  bookId: string;
  fileName: string;
  uploadId: string;
  progress: JobProgress | null;
}

interface JobProgressStore {
  activeJobs: Record<string, ActiveJob>; // keyed by jobId
  setJobProgress: (jobId: string, progress: JobProgress) => void;
  registerJob: (job: ActiveJob) => void;
  unregisterJob: (jobId: string) => void;
  getJobByUploadId: (uploadId: string) => ActiveJob | undefined;
  getJobByBookId: (bookId: string) => ActiveJob | undefined;
}

/**
 * Global store for tracking job progress across the application.
 * This allows progress to persist when navigating between pages.
 */
export const useJobProgressStore = create<JobProgressStore>((set, get) => ({
  activeJobs: {},

  setJobProgress: (jobId: string, progress: JobProgress) => {
    set((state) => ({
      activeJobs: {
        ...state.activeJobs,
        [jobId]: {
          ...state.activeJobs[jobId],
          progress,
        },
      },
    }));
  },

  registerJob: (job: ActiveJob) => {
    set((state) => ({
      activeJobs: {
        ...state.activeJobs,
        [job.jobId]: job,
      },
    }));
  },

  unregisterJob: (jobId: string) => {
    set((state) => {
      const { [jobId]: _, ...rest } = state.activeJobs;
      return { activeJobs: rest };
    });
  },

  getJobByUploadId: (uploadId: string) => {
    return Object.values(get().activeJobs).find(
      (job) => job.uploadId === uploadId
    );
  },

  getJobByBookId: (bookId: string) => {
    return Object.values(get().activeJobs).find(
      (job) => job.bookId === bookId
    );
  },
}));
