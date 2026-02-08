"use client";

import { useState } from "react";
import { useUploadStore } from "@/lib/stores/upload-store";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface EmptyLibraryUploadProps {
  maxFiles?: number;
  className?: string;
}

export function EmptyLibraryUpload({ 
  maxFiles = 3, 
  className = ""
}: EmptyLibraryUploadProps) {
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
      processFiles(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter(file => file.type === "application/pdf");

    if (pdfFiles.length !== newFiles.length) {
      alert("Only PDF files are allowed");
    }

    const filesToAdd = pdfFiles.slice(0, maxFiles);

    if (filesToAdd.length < pdfFiles.length) {
      alert(`You can only upload up to ${maxFiles} files at once`);
    }

    // Start uploads immediately
    filesToAdd.forEach(file => startUpload(file));
  };

  return (
    <motion.div
      className={`relative border-2 border-dashed rounded-xl text-center transition-all duration-300 overflow-hidden ${
        dragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/20"
      } ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <input
        type="file"
        id="pdf-upload-empty"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      {/* Content */}
      <div className="flex flex-col items-center justify-center py-14 px-8">
        {/* Icon */}
        <motion.div 
          className="text-7xl mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          📚
        </motion.div>
        
        {/* Title */}
        <motion.h3 
          className="text-2xl font-semibold text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          Your library is empty
        </motion.h3>
        
        {/* Description */}
        <motion.p 
          className="mt-3 text-center text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Upload your first PDF to start building your knowledge base.
        </motion.p>
        
        {/* Upload hint */}
        <motion.div 
          className="mt-2 flex items-center gap-2 text-sm text-muted-foreground/60"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <svg
            className="h-4 w-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>or drag and drop files here</span>
        </motion.div>

        {/* Upload Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-4"
        >
          <Button 
            size="lg" 
            className="px-8"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('pdf-upload-empty')?.click();
            }}
          >
            <Upload className="h-4 w-4" />
            Upload a Book
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
