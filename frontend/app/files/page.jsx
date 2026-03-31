"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from "@/components/files/FileUpload";
import FileList from "@/components/files/FileList";
import { getStorageUsage } from "@/lib/api";
import { HardDrive, Upload, Files, Loader2 } from "lucide-react";

export default function FilesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [storageUsage, setStorageUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStorageUsage();
    }
  }, [user]);

  const loadStorageUsage = async () => {
    try {
      setLoadingUsage(true);
      const response = await getStorageUsage();
      if (response.success) {
        setStorageUsage(response.usage);
      }
    } catch (err) {
      console.error("Error loading storage usage:", err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleUploadSuccess = () => {
    loadStorageUsage();
  };

  const handleFileDeleted = () => {
    loadStorageUsage();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const userType = user.role === "FREELANCER" ? "freelancer" : "client";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Files className="h-8 w-8 text-accent" />
            File Manager
          </h1>
          <p className="text-muted-foreground">
            Upload, manage, and organize your files
          </p>
        </div>

        {/* Storage Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-accent" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : storageUsage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {storageUsage.totalSizeMB} MB
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {storageUsage.totalFiles} file{storageUsage.totalFiles !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                {storageUsage.sizeByCategory && Object.keys(storageUsage.sizeByCategory).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">By Category</p>
                    {Object.entries(storageUsage.sizeByCategory).map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <span className="text-foreground">
                          {data.count} files • {(data.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No storage data available</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">
              <Files className="h-4 w-4 mr-2" />
              All Files
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileList 
                  onFileDeleted={handleFileDeleted}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  category="other"
                  maxSize={25}
                  multiple={true}
                  onUploadSuccess={handleUploadSuccess}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
