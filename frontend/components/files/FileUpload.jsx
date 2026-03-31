"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
  showPreview = true,
  className = ""
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${maxSize}MB limit`);
      return;
    }

    if (multiple) {
      setFiles([...files, ...selectedFiles]);
    } else {
      setFiles(selectedFiles);
    }
    setError("");
    
    // Auto-upload files immediately after selection
    handleUpload(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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
      
      setSuccess(`Successfully uploaded ${results.length} file(s)`);
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

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium mb-2">
          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-sm text-muted-foreground">
          Maximum file size: {maxSize}MB
        </p>
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

      {/* Uploading Progress */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading files...</span>
        </div>
      )}

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
