"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  File, Image, FileText, Download, Trash2, 
  AlertCircle, Loader2, ExternalLink 
} from "lucide-react";
import { getUserFiles, deleteFile, generateDownloadLink } from "@/lib/api";

export default function FileList({ 
  category = null,
  showActions = true,
  onFileDeleted,
  className = ""
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadFiles();
  }, [category]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError("");

      const filters = category ? { category } : {};
      const response = await getUserFiles(filters);

      if (response.success) {
        setFiles(response.files || []);
      } else {
        setError(response.error || "Failed to load files");
      }
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setDeletingId(fileId);
      const response = await deleteFile(fileId);

      if (response.success) {
        setFiles(files.filter(f => f.id !== fileId));
        if (onFileDeleted) {
          onFileDeleted(fileId);
        }
      } else {
        setError(response.error || "Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      setError("");
      const response = await generateDownloadLink(file.id);
      
      if (response.success && response.downloadUrl) {
        // Fetch the file as a blob to avoid mixed content issues
        const fileResponse = await fetch(response.downloadUrl);
        
        if (!fileResponse.ok) {
          throw new Error('Download failed');
        }
        
        const blob = await fileResponse.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file. Please try again.");
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
        >
          {getFileIcon(file.mimeType)}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.originalName}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{formatFileSize(file.fileSize)}</span>
              <span>•</span>
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="capitalize">{file.category.replace('_', ' ')}</span>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(file)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(file.fileUrl, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(file.id)}
                disabled={deletingId === file.id}
                className="text-red-600 hover:bg-red-50"
                title="Delete"
              >
                {deletingId === file.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
