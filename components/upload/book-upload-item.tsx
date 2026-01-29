"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { UploadStatus } from "@/lib/stores/upload-store";

// Processing step labels (matches upload-store.tsx)
const processingSteps = [
  "Uploading file...",
  "Parsing PDF...",
  "Extracting text...",
  "Generating metadata...",
  "Creating chapters...",
  "Finalizing...",
];

export interface BookUploadItemProps {
  id: string;
  fileName: string;
  progress: number;
  currentStep: number;
  status: UploadStatus;
  error: string | null;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function BookUploadItem({
  id,
  fileName,
  progress,
  currentStep,
  status,
  error,
  onCancel,
  onRetry,
}: BookUploadItemProps) {
  const displayName = fileName.replace('.pdf', '');
  const isActivelyProcessing = status === 'uploading' || status === 'processing';

  const getStatusDisplay = () => {
    switch (status) {
      case 'uploading':
        return { label: 'Uploading...', color: 'text-neutral-600' };
      case 'processing':
        return { label: 'Processing...', color: 'text-blue-600' };
      case 'ready':
        return { label: 'Ready!', color: 'text-green-600' };
      case 'error':
        return { label: error || 'Upload failed', color: 'text-red-600' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-neutral-500' };
      default:
        return { label: 'Processing...', color: 'text-neutral-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  const getBackgroundStyle = () => {
    switch (status) {
      case 'ready':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'cancelled':
        return 'bg-neutral-100';
      case 'processing':
        return 'bg-blue-50';
      default:
        return 'bg-neutral-100';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-neutral-400" />;
      case 'processing':
        return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
      default:
        return (
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'ready':
        return '[&>div]:bg-green-500';
      case 'error':
        return '[&>div]:bg-red-500';
      case 'cancelled':
        return '[&>div]:bg-neutral-400';
      case 'processing':
        return '[&>div]:bg-blue-500';
      default:
        return '';
    }
  };

  const getCurrentStepLabel = () => {
    if (status === 'error') return 'Failed';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'ready') return 'Complete';
    return processingSteps[currentStep] || 'Processing...';
  };

  // Progress is now unified (0-100%) from the store
  // Upload = 0-30%, Processing = 30-100%
  const getVisualProgress = () => {
    return progress;
  };

  return (
    <Card className={`relative overflow-hidden h-full flex flex-col ${status === 'error' ? 'border-red-200' : status === 'ready' ? 'border-green-200' : status === 'processing' ? 'border-blue-200' : ''}`}>
      <CardContent className="flex-1 flex flex-col">
        {/* Book Cover Placeholder with Status-based Animation */}
        <div className={`mb-4 flex h-48 items-center justify-center rounded-lg ${getBackgroundStyle()} p-4 relative shrink-0`}>
          {/* Animated gradient background for active processing */}
          {isActivelyProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 animate-shimmer rounded-lg"
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 2s infinite linear'
                 }}
            />
          )}

          {/* Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              {status === 'uploading' && (
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              )}
              <div className={`relative rounded-full p-4 ${isActivelyProcessing ? 'bg-primary/10' : ''} ${status === 'uploading' ? 'animate-pulse' : ''}`}>
                {getIcon()}
              </div>
            </div>
          </div>

          {/* Cancel button (top right, only during upload - not processing) */}
          {status === 'uploading' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-neutral-200/80 z-20"
              onClick={() => onCancel(id)}
              title="Cancel upload"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Book Info */}
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="shrink-0">
            <h3 className="font-semibold leading-tight text-neutral-900 line-clamp-2">
              {displayName}
            </h3>
            <p className={`mt-1 text-sm ${statusDisplay.color}`}>
              {statusDisplay.label}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 text-xs">
                {getCurrentStepLabel()}
              </span>
              <span className="font-medium text-neutral-900">{Math.round(getVisualProgress())}%</span>
            </div>
            <Progress value={getVisualProgress()} className={`h-1.5 ${getProgressBarColor()}`} />
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Step indicators for processing */}
          {isActivelyProcessing && (
            <div className="flex items-center space-x-1.5 pt-1 shrink-0">
              {processingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`transition-all duration-300 rounded-full ${
                    index < currentStep
                      ? "w-1.5 h-1.5 bg-primary"
                      : index === currentStep
                      ? "w-2 h-2 bg-primary animate-pulse"
                      : "w-1.5 h-1.5 bg-neutral-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Action buttons for error/cancelled states */}
          {(status === 'error' || status === 'cancelled') && onRetry && (
            <div className="flex gap-2 pt-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onRetry(id)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Ready indicator */}
          {status === 'ready' && (
            <div className="flex items-center justify-center gap-2 pt-2 shrink-0 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Added to library</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
