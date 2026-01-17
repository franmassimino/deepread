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
import { useUploadStore } from "@/lib/stores/upload-store";
import { X } from "lucide-react";

const MAX_FILES = 3;

export function UploadPdfDialog() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const startUpload = useUploadStore((state) => state.startUpload);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(file => file.type === "application/pdf");

    if (pdfFiles.length !== newFiles.length) {
      alert("Only PDF files are allowed");
    }

    const remainingSlots = MAX_FILES - files.length;
    const filesToAdd = pdfFiles.slice(0, remainingSlots);

    if (filesToAdd.length < pdfFiles.length) {
      alert(`You can only upload up to ${MAX_FILES} files at once`);
    }

    setFiles(prev => [...prev, ...filesToAdd]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    // Start all uploads in the background
    files.forEach(file => startUpload(file));

    // Close dialog and reset form immediately
    setFiles([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="py-4 px-6">
          Upload a book
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>Upload PDF Books</DialogTitle>
          <DialogDescription>
            Drag and drop or click to select up to {MAX_FILES} PDF files.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : files.length >= MAX_FILES
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
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
              multiple
              onChange={handleFileChange}
              disabled={files.length >= MAX_FILES}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
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
                {files.length > 0 ? (
                  <p className="font-medium text-primary">
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </p>
                ) : (
                  <>
                    <label
                      htmlFor="pdf-upload"
                      className="relative cursor-pointer font-medium text-primary hover:text-primary/80"
                    >
                      Choose files
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                PDF files only ({files.length}/{MAX_FILES})
              </p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-w-sm">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      className="h-5 w-5 text-red-500 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={files.length === 0}>
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
