"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const uploadSteps = [
  {
    label: "Uploading file...",
    duration: 1000,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
  {
    label: "Parsing PDF...",
    duration: 1500,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Extracting text...",
    duration: 1200,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    label: "Generating metadata...",
    duration: 1000,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  {
    label: "Creating chapters...",
    duration: 800,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    label: "Finalizing...",
    duration: 500,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
];

export function UploadPdfDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload PDF files only");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        alert("Please upload PDF files only");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setCurrentStep(0);
    setProgress(0);

    // Simular cada paso de carga
    for (let i = 0; i < uploadSteps.length; i++) {
      setCurrentStep(i);
      const stepProgress = ((i + 1) / uploadSteps.length) * 100;

      // Animar el progreso gradualmente
      const startProgress = (i / uploadSteps.length) * 100;
      const duration = uploadSteps[i].duration;
      const steps = 20;
      const increment = (stepProgress - startProgress) / steps;

      for (let j = 0; j <= steps; j++) {
        await new Promise((resolve) => setTimeout(resolve, duration / steps));
        setProgress(startProgress + (increment * j));
      }
    }

    setIsUploading(false);
    setFile(null);
    setOpen(false);
    setProgress(0);
    setCurrentStep(0);

    alert(`PDF "${file.name}" uploaded successfully (simulated)`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="py-4 px-6">
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Upload PDF Book</DialogTitle>
          <DialogDescription>
            Drag and drop or click to select a PDF file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isUploading ? (
            <>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <svg
                    className="mx-auto h-10 w-10 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {file ? (
                      <p className="font-medium text-primary">{file.name}</p>
                    ) : (
                      <>
                        <label
                          htmlFor="pdf-upload"
                          className="relative cursor-pointer font-medium text-primary hover:text-primary/80"
                        >
                          Choose a file
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!file}>
                  Upload
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6 py-6">
              {/* Icono principal animado del paso actual */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  {/* Círculo de fondo pulsante */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative bg-primary/10 rounded-full p-6">
                    <div className="text-primary animate-pulse">
                      {uploadSteps[currentStep].icon}
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-lg text-gray-800">
                    {uploadSteps[currentStep].label}
                  </p>
                  <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <Progress value={progress} className="h-2" />

              {/* Mini indicadores de todos los pasos */}
              <div className="flex justify-center items-center space-x-2">
                {uploadSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      index < currentStep
                        ? "w-2 h-2 bg-primary rounded-full"
                        : index === currentStep
                        ? "w-3 h-3 bg-primary rounded-full animate-pulse"
                        : "w-2 h-2 bg-gray-300 rounded-full"
                    }`}
                    title={step.label}
                  />
                ))}
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
