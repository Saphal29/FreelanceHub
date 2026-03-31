"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadFile, getDisputeFiles, downloadFile } from "@/lib/api";
import {
  AlertCircle, Paperclip, Upload, Download, FileText, Image, File, CheckCircle, X, Loader2
} from "lucide-react";

const FILE_CATEGORIES = [
  { value: "dispute_evidence", label: "Dispute Evidence" },
  { value: "contract_document", label: "Contract Document" },
  { value: "project_attachment", label: "Communication Record" },
  { value: "milestone_attachment", label: "Payment Proof" },
  { value: "chat_attachment", label: "Screenshot" },
  { value: "other", label: "Other" },
];

export default function DisputeEvidence({ disputeId }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    category: "dispute_evidence",
    description: "",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (disputeId) fetchEvidence();
  }, [disputeId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getDisputeFiles(disputeId);
      if (response.success) {
        setEvidence(response.files || []);
      } else {
        setError(response.error || "Failed to load evidence");
      }
    } catch (err) {
      console.error("Error fetching evidence:", err);
      setError(err.message || "Failed to load evidence");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      setError("File size must be less than 25MB");
      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!uploadData.description.trim()) {
      setError("Please provide a description");
      return;
    }

    try {
      setUploading(true);
      setError("");

      // Upload file with metadata
      const metadata = {
        category: uploadData.category,
        description: uploadData.description,
        disputeId: disputeId
      };

      const response = await uploadFile(selectedFile, metadata);

      if (response.success) {
        setSuccess("Evidence uploaded successfully");
        setSelectedFile(null);
        setUploadData({ category: "dispute_evidence", description: "" });
        setShowUploadForm(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // Refresh evidence list
        await fetchEvidence();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to upload evidence");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const blob = await downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name || 'evidence';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download file");
    }
  };

  const getFileIcon = (file) => {
    const mimeType = file.mime_type || '';
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evidence</CardTitle>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            variant={showUploadForm ? "outline" : "default"}
            size="sm"
          >
            {showUploadForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-accent/5">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: 25MB
                </p>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  className="hidden"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={uploadData.category}
                onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
                disabled={uploading}
              >
                <SelectTrigger id="category">
                  <SelectValue>
                    {FILE_CATEGORIES.find(c => c.value === uploadData.category)?.label || "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this evidence..."
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                disabled={uploading}
                rows={3}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </>
              )}
            </Button>
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

        {/* Evidence List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : evidence.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No evidence uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evidence.map((file) => (
              <div
                key={file.id}
                className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/5 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {file.original_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {FILE_CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                      </p>
                      {file.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {file.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleDownload(file)}
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
