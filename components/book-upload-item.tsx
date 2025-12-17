"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

const uploadSteps = [
  {
    label: "Uploading file...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
  {
    label: "Parsing PDF...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Extracting text...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Generating metadata...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  {
    label: "Creating chapters...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    label: "Finalizing...",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
];

export interface BookUploadItemProps {
  fileName: string;
  progress: number;
  currentStep: number;
}

export function BookUploadItem({ fileName, progress, currentStep }: BookUploadItemProps) {
  const displayName = fileName.replace('.pdf', '');

  return (
    <Card className="relative overflow-hidden h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col p-6">
        {/* Book Cover Placeholder with Loading Animation */}
        <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-neutral-100 p-4 relative shrink-0">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 animate-shimmer"
               style={{
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 2s infinite linear'
               }}
          />

          {/* Loading icon */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              {/* Pulsating circle */}
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 rounded-full p-4">
                <div className="text-primary animate-pulse">
                  {uploadSteps[currentStep]?.icon || <BookOpen className="h-6 w-6" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="shrink-0">
            <h3 className="font-semibold leading-tight text-neutral-900 line-clamp-2">
              {displayName}
            </h3>
            <p className="mt-1 text-sm text-neutral-600">Uploading...</p>
          </div>

          {/* Progress */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 text-xs">
                {uploadSteps[currentStep]?.label || 'Processing...'}
              </span>
              <span className="font-medium text-neutral-900">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Mini step indicators */}
          <div className="flex items-center space-x-1.5 pt-1 shrink-0">
            {uploadSteps.map((_, index) => (
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
        </div>
      </CardContent>
    </Card>
  );
}
