// Job workers initialization
// This module initializes BullMQ workers for PDF processing

import { initializeWorkers } from '@/lib/services/queue';

let initialized = false;

/**
 * Initialize job workers
 * Safe to call multiple times - will only initialize once
 */
export function initWorkers(): void {
  if (initialized) {
    return;
  }
  
  if (typeof window === 'undefined') {
    // Only run on server
    initializeWorkers();
    initialized = true;
    console.log('[Init] Job workers initialized');
  }
}

// Auto-initialize when this module is imported on server
initWorkers();
