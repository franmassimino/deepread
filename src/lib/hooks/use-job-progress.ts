'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { JobType, JobStatus } from '@prisma/client';
import { getStageMessage, calculateOverallProgress } from '@/lib/utils/job-stages';

export interface JobProgress {
  jobId: string;
  bookId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  overallProgress: number;
  stage: string | null;
  message: string;
  error: string | null;
}

interface SSEData {
  jobId: string;
  bookId?: string;
  type?: JobType;
  status?: JobStatus;
  progress?: number;
  stage?: string | null;
  message?: string | null;
  error?: string | null;
}

const INITIAL_PROGRESS: JobProgress = {
  jobId: '',
  bookId: '',
  type: 'EXTRACT',
  status: 'PENDING',
  progress: 0,
  overallProgress: 0,
  stage: null,
  message: 'Initializing...',
  error: null,
};

/**
 * React hook for subscribing to job progress via Server-Sent Events
 * @param jobId - The job ID to subscribe to, or null to disconnect
 */
export function useJobProgress(jobId: string | null): JobProgress {
  const [progress, setProgress] = useState<JobProgress>(INITIAL_PROGRESS);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!jobId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const eventSource = new EventSource(`/api/jobs/${jobId}/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`[SSE] Connected to job ${jobId}`);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };

    eventSource.onmessage = (event) => {
      try {
        // Handle keep-alive comments
        if (event.data.startsWith(':')) {
          return;
        }

        const data: SSEData = JSON.parse(event.data);
        
        setProgress((prev) => {
          const type = data.type || prev.type;
          const status = data.status || prev.status;
          const progressValue = data.progress ?? prev.progress;
          
          return {
            jobId: data.jobId || prev.jobId,
            bookId: data.bookId || prev.bookId,
            type,
            status,
            progress: progressValue,
            overallProgress: calculateOverallProgress(type, progressValue),
            stage: data.stage ?? prev.stage,
            message: getStageMessage(type, progressValue, status, data.message),
            error: data.error ?? prev.error,
          };
        });

        // Close connection if job is terminal
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      
      // Close the failed connection
      eventSource.close();
      eventSourceRef.current = null;

      // Don't reconnect if job is in terminal state
      if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
        return;
      }

      // Attempt reconnection with exponential backoff
      const maxReconnectAttempts = 5;
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;
        
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error('[SSE] Max reconnection attempts reached');
        setProgress((prev) => ({
          ...prev,
          message: 'Connection lost. Please refresh the page.',
        }));
      }
    };
  }, [jobId, progress.status]);

  useEffect(() => {
    if (jobId) {
      // Reset state when jobId changes
      setProgress(INITIAL_PROGRESS);
      reconnectAttemptsRef.current = 0;
      connect();
    }

    return () => {
      // Cleanup on unmount or jobId change
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [jobId, connect]);

  return progress;
}

/**
 * Hook for tracking multiple jobs simultaneously
 */
export function useMultipleJobProgress(jobIds: string[]): Record<string, JobProgress> {
  const [progressMap, setProgressMap] = useState<Record<string, JobProgress>>({});
  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  useEffect(() => {
    // Connect to new jobs
    jobIds.forEach((jobId) => {
      if (!eventSourcesRef.current[jobId]) {
        const eventSource = new EventSource(`/api/jobs/${jobId}/progress`);
        eventSourcesRef.current[jobId] = eventSource;

        eventSource.onmessage = (event) => {
          try {
            if (event.data.startsWith(':')) return;
            
            const data: SSEData = JSON.parse(event.data);
            const type = data.type || 'EXTRACT';
            const status = data.status || 'PENDING';
            const progressValue = data.progress ?? 0;

            setProgressMap((prev) => ({
              ...prev,
              [jobId]: {
                jobId: data.jobId || jobId,
                bookId: data.bookId || '',
                type,
                status,
                progress: progressValue,
                overallProgress: calculateOverallProgress(type, progressValue),
                stage: data.stage ?? null,
                message: getStageMessage(type, progressValue, status, data.message),
                error: data.error ?? null,
              },
            }));

            if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              eventSource.close();
              delete eventSourcesRef.current[jobId];
            }
          } catch (error) {
            console.error(`[SSE] Error parsing message for job ${jobId}:`, error);
          }
        };

        eventSource.onerror = () => {
          // Auto-reconnect is handled by EventSource, just log
          console.error(`[SSE] Error for job ${jobId}`);
        };
      }
    });

    // Cleanup disconnected jobs
    Object.keys(eventSourcesRef.current).forEach((existingJobId) => {
      if (!jobIds.includes(existingJobId)) {
        eventSourcesRef.current[existingJobId].close();
        delete eventSourcesRef.current[existingJobId];
        setProgressMap((prev) => {
          const { [existingJobId]: _, ...rest } = prev;
          return rest;
        });
      }
    });

    return () => {
      // Cleanup all connections on unmount
      Object.values(eventSourcesRef.current).forEach((es) => es.close());
      eventSourcesRef.current = {};
    };
  }, [jobIds]);

  return progressMap;
}
