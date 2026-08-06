"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/api";

export default function FileUpload({ 
  category = "other",
  maxSize = 25, // MB
  accept = "*/*",
  multiple = false,
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  metadata = {},
  className = ""
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File size exceeds maximum ${maxSize}MB limit`);
      return;
    }

    if (multiple) {
      setFiles([...files, ...selectedFiles]);
    } else {
      setFiles(selectedFiles);
    }
    setError("");
    
    handleUpload(selectedFiles);
  };

  const handleUpload = async (filesToUpload = files) => {
    if (filesToUpload.length === 0) {
      setError("Please select at least one file");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      
      if (onUploadStart) {
        onUploadStart();
      }

      const uploadPromises = filesToUpload.map(file => 
        uploadFile(file, { category, ...metadata })
      );

      const results = await Promise.all(uploadPromises);
      
      setSuccess(`Uploaded ${results.length} file(s)`);
      setFiles([]);
      
      if (onUploadSuccess) {
        onUploadSuccess(results);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to upload files";
      setError(errorMsg);
      
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-2 font-mono-ledger text-[12px] ${className}`}>
      {/* ARCHETYPE G: SINGLE HAIRLINE-BORDERED UPLOAD ROW */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border border-[var(--ink)] bg-[var(--paper-2)] p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--paper)] transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-3">
          <Upload className="h-5 w-5 text-[var(--ink)] shrink-0" />
          <span className="font-bold text-[var(--ink)]">
            {uploading ? 'Uploading specimen file...' : 'Attach files'}
          </span>
        </div>

        <span className="text-[11px] text-[var(--muted)]">
          Up to {maxSize}MB
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Uploading Status */}
      {uploading && (
        <div className="flex items-center space-x-2 text-[11px] text-[var(--muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--signal)]" />
          <span>Uploading attachment to ledger...</span>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] text-[11px] flex items-center space-x-2">
          <AlertCircle className="h-3.5 w-3.5 text-[var(--signal)] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-2.5 bg-[var(--paper)] border border-[var(--signal)] text-[var(--ink)] text-[11px] flex items-center space-x-2">
          <CheckCircle className="h-3.5 w-3.5 text-[var(--signal)] shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}
    </div>
  );
}
