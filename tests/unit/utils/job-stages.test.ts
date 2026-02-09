import { describe, it, expect } from 'vitest';
import { getStageMessage, getStageIdentifier, calculateOverallProgress } from '@/lib/utils/job-stages';
import { JobType, JobStatus } from '@prisma/client';

describe('job-stages utilities', () => {
  describe('getStageMessage', () => {
    it('should return custom message when provided', () => {
      const result = getStageMessage('EXTRACT' as JobType, 50, 'ACTIVE' as JobStatus, 'Custom message');
      expect(result).toBe('Custom message');
    });

    it('should return failed message for FAILED status', () => {
      const result = getStageMessage('EXTRACT' as JobType, 50, 'FAILED' as JobStatus);
      expect(result).toBe('Processing failed');
    });

    it('should return ready message for COMPLETED status', () => {
      const result = getStageMessage('EXTRACT' as JobType, 100, 'COMPLETED' as JobStatus);
      expect(result).toBe('Ready!');
    });

    it('should return pending message for PENDING status', () => {
      const result = getStageMessage('EXTRACT' as JobType, 0, 'PENDING' as JobStatus);
      expect(result).toBe('Waiting to start...');
    });

    it('should return correct message for EXTRACT type at different progress levels', () => {
      expect(getStageMessage('EXTRACT' as JobType, 10, 'ACTIVE' as JobStatus))
        .toBe('Extracting text...');
      expect(getStageMessage('EXTRACT' as JobType, 50, 'ACTIVE' as JobStatus))
        .toBe('Extracting tables and images...');
      expect(getStageMessage('EXTRACT' as JobType, 80, 'ACTIVE' as JobStatus))
        .toBe('Finalizing extraction...');
    });

    it('should return correct message for AI_METADATA type', () => {
      const result = getStageMessage('AI_METADATA' as JobType, 50, 'ACTIVE' as JobStatus);
      expect(result).toBe('Analyzing content...');
    });

    it('should return correct message for CONVERT type', () => {
      const result = getStageMessage('CONVERT' as JobType, 50, 'ACTIVE' as JobStatus);
      expect(result).toBe('Converting to HTML...');
    });
  });

  describe('getStageIdentifier', () => {
    it('should return correct identifier for terminal states', () => {
      expect(getStageIdentifier('EXTRACT' as JobType, 50, 'FAILED' as JobStatus)).toBe('failed');
      expect(getStageIdentifier('EXTRACT' as JobType, 100, 'COMPLETED' as JobStatus)).toBe('completed');
      expect(getStageIdentifier('EXTRACT' as JobType, 0, 'PENDING' as JobStatus)).toBe('pending');
    });

    it('should return correct identifier for EXTRACT stages', () => {
      expect(getStageIdentifier('EXTRACT' as JobType, 10, 'ACTIVE' as JobStatus)).toBe('extract-text');
      expect(getStageIdentifier('EXTRACT' as JobType, 50, 'ACTIVE' as JobStatus)).toBe('extract-visual');
      expect(getStageIdentifier('EXTRACT' as JobType, 80, 'ACTIVE' as JobStatus)).toBe('extract-finalize');
    });

    it('should return correct identifier for other job types', () => {
      expect(getStageIdentifier('AI_METADATA' as JobType, 50, 'ACTIVE' as JobStatus)).toBe('ai-analysis');
      expect(getStageIdentifier('CONVERT' as JobType, 50, 'ACTIVE' as JobStatus)).toBe('convert-html');
    });
  });

  describe('calculateOverallProgress', () => {
    it('should calculate EXTRACT progress correctly', () => {
      // EXTRACT: 0-40% range
      expect(calculateOverallProgress('EXTRACT' as JobType, 0)).toBe(0);
      expect(calculateOverallProgress('EXTRACT' as JobType, 50)).toBe(20);
      expect(calculateOverallProgress('EXTRACT' as JobType, 100)).toBe(40);
    });

    it('should calculate AI_METADATA progress correctly', () => {
      // AI_METADATA: 40-70% range
      expect(calculateOverallProgress('AI_METADATA' as JobType, 0)).toBe(40);
      expect(calculateOverallProgress('AI_METADATA' as JobType, 50)).toBe(55);
      expect(calculateOverallProgress('AI_METADATA' as JobType, 100)).toBe(70);
    });

    it('should calculate CONVERT progress correctly', () => {
      // CONVERT: 70-100% range
      expect(calculateOverallProgress('CONVERT' as JobType, 0)).toBe(70);
      expect(calculateOverallProgress('CONVERT' as JobType, 50)).toBe(85);
      expect(calculateOverallProgress('CONVERT' as JobType, 100)).toBe(100);
    });

    it('should handle unknown job types', () => {
      expect(calculateOverallProgress('UNKNOWN' as JobType, 50)).toBe(50);
    });
  });
});
