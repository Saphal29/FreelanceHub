"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { fileDispute, getContracts, getMilestones } from "@/lib/api";
import FileUpload from "@/components/files/FileUpload";
import {
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  FileText,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_OPTIONS = [
  { value: "payment_issue", label: "Payment Issue" },
  { value: "quality_of_work", label: "Quality of Work" },
  { value: "missed_deadline", label: "Missed Deadline" },
  { value: "scope_disagreement", label: "Scope Disagreement" },
  { value: "communication_issue", label: "Communication Issue" },
  { value: "contract_breach", label: "Contract Breach" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function FileDisputeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [contracts, setContracts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    contractId: searchParams.get("contractId") || "",
    milestoneId: "",
    category: "",
    title: "",
    description: "",
    amountDisputed: "",
    priority: "medium",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  useEffect(() => {
    if (formData.contractId) {
      fetchMilestones(formData.contractId);
    } else {
      setMilestones([]);
      setFormData(prev => ({ ...prev, milestoneId: "" }));
    }
  }, [formData.contractId]);

  const fetchContracts = async () => {
    try {
      const response = await getContracts();
      if (response.success) {
        // Only show active contracts
        const activeContracts = (response.contracts || []).filter(
          c => c.status === "active"
        );
        setContracts(activeContracts);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchMilestones = async (contractId) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;
      
      const response = await getMilestones(contract.projectId);
      if (response.success) {
        setMilestones(response.milestones || []);
      }
    } catch (err) {
      console.error("Error fetching milestones:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const disputeData = {
        contractId: formData.contractId,
        milestoneId: formData.milestoneId || null,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        amountDisputed: formData.amountDisputed ? parseFloat(formData.amountDisputed) : null,
        priority: formData.priority,
        fileIds: evidenceFiles.map(f => f.file.id) // Add file IDs
      };
      
      const response = await fileDispute(disputeData);
      
      if (response.success) {
        setSuccess("Dispute filed successfully! Redirecting...");
        setTimeout(() => {
          router.push(`/disputes/${response.dispute.id}`);
        }, 2000);
      } else {
        setError(response.error || "Failed to file dispute");
      }
    } catch (err) {
      console.error("Error filing dispute:", err);
      setError(err.message || "Failed to file dispute");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const userType = user.role === "CLIENT" ? "client" : "freelancer";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/disputes"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Disputes</span>
          </Link>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center font-display text-2xl">
                <FileText className="h-6 w-6 mr-2 text-accent" />
                File a Dispute
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                File a dispute to resolve conflicts with the other party. A mediator will be assigned to help resolve the issue.
              </p>
            </CardHeader>
            
            <CardContent>
              {success && (
                <Alert className="mb-6 border-2 border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 font-semibold">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="mb-6 border-2 border-red-200 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-semibold">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contract Selection */}
                <div className="space-y-2">
                  <Label htmlFor="contractId">Contract *</Label>
                  <select
                    id="contractId"
                    name="contractId"
                    value={formData.contractId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select a contract</option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.projectTitle} - ${contract.agreedBudget}
                      </option>
                    ))}
                  </select>
                  {contracts.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No active contracts found. You need an active contract to file a dispute.
                    </p>
                  )}
                </div>

                {/* Milestone Selection (Optional) */}
                {milestones.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="milestoneId">Milestone (Optional)</Label>
                    <select
                      id="milestoneId"
                      name="milestoneId"
                      value={formData.milestoneId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Not related to a specific milestone</option>
                      {milestones.map((milestone) => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title} - ${milestone.amount}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Dispute Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief summary of the dispute"
                    required
                    maxLength={255}
                    className="border-border bg-background"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed explanation of the issue, including relevant dates, communications, and any attempts to resolve it..."
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as detailed as possible. This will help the mediator understand the situation.
                  </p>
                </div>

                {/* Amount Disputed */}
                <div className="space-y-2">
                  <Label htmlFor="amountDisputed">Amount Disputed (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amountDisputed"
                      name="amountDisputed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountDisputed}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="pl-10 border-border bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If this dispute involves a specific amount of money, enter it here.
                  </p>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evidence Files */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Evidence (Optional)
                  </Label>
                  <FileUpload
                    category="dispute_evidence"
                    maxSize={50}
                    multiple={true}
                    onUploadSuccess={(files) => {
                      setEvidenceFiles(files);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots, documents, or other evidence (Max 50MB per file)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/disputes")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={loading || contracts.length === 0}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Filing Dispute...
                      </>
                    ) : (
                      "File Dispute"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function FileDisputePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <FileDisputeContent />
    </Suspense>
  );
}
