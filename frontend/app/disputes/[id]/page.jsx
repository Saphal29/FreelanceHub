"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputeById, closeDispute } from "@/lib/api";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import DisputeMessages from "@/components/disputes/DisputeMessages";
import DisputeEvidence from "@/components/disputes/DisputeEvidence";
import DisputeResolution from "@/components/disputes/DisputeResolution";
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Briefcase,
  Calendar,
  Shield,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: FileText },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  in_mediation: { label: "In Mediation", color: "bg-purple-100 text-purple-700", icon: Shield },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const CATEGORY_LABELS = {
  payment_issue: "Payment Issue",
  quality_of_work: "Quality of Work",
  missed_deadline: "Missed Deadline",
  scope_disagreement: "Scope Disagreement",
  communication_issue: "Communication Issue",
  contract_breach: "Contract Breach",
  other: "Other",
};

export default function DisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id;
  const { user, loading: authLoading } = useAuth();
  
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && disputeId) {
      fetchDispute();
    }
  }, [user, disputeId]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await getDisputeById(disputeId);
      
      if (response.success) {
        setDispute(response.dispute);
      } else {
        setError(response.error || "Failed to load dispute");
      }
    } catch (err) {
      console.error("Error fetching dispute:", err);
      setError(err.message || "Failed to load dispute");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDispute = async () => {
    if (!confirm("Are you sure you want to close this dispute? This action cannot be undone.")) {
      return;
    }
    
    try {
      setClosing(true);
      setError("");
      
      const response = await closeDispute(disputeId);
      
      if (response.success) {
        setSuccess("Dispute closed successfully");
        fetchDispute();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to close dispute");
      }
    } catch (err) {
      console.error("Error closing dispute:", err);
      setError(err.message || "Failed to close dispute");
    } finally {
      setClosing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  if (error && !dispute) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType={user.role === "CLIENT" ? "client" : "freelancer"} />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!dispute) return null;

  const userType = user.role === "CLIENT" ? "client" : "freelancer";
  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
  const StatusIcon = statusConfig.icon;
  const isFiledByUser = dispute.filedBy === user.id;
  const isMediator = dispute.mediatorId === user.id;
  const canClose = dispute.status === "resolved" || dispute.status === "closed";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/disputes"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Disputes</span>
          </Link>

          {success && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-foreground">{dispute.title}</h1>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-muted-foreground">
                Dispute #{dispute.id.slice(0, 8)} • {CATEGORY_LABELS[dispute.category]}
              </p>
            </div>
            {dispute.status !== "closed" && (
              <Button
                variant="outline"
                onClick={handleCloseDispute}
                disabled={closing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {closing ? "Closing..." : "Close Dispute"}
              </Button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{dispute.description}</p>
                </CardContent>
              </Card>

              {/* Resolution (if resolved) */}
              {dispute.status === "resolved" && dispute.resolutionType && (
                <Card className="border-border border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center font-display text-xl text-green-800">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-green-800">Resolution Type:</p>
                      <p className="text-green-700 capitalize">
                        {dispute.resolutionType.replace(/_/g, " ")}
                      </p>
                    </div>
                    {dispute.resolutionAmount && (
                      <div>
                        <p className="text-sm font-semibold text-green-800">Amount:</p>
                        <p className="text-green-700">${dispute.resolutionAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {dispute.resolutionNotes && (
                      <div>
                        <p className="text-sm font-semibold text-green-800">Notes:</p>
                        <p className="text-green-700 whitespace-pre-wrap">{dispute.resolutionNotes}</p>
                      </div>
                    )}
                    {dispute.resolvedByName && (
                      <div>
                        <p className="text-sm font-semibold text-green-800">Resolved By:</p>
                        <p className="text-green-700">{dispute.resolvedByName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-green-800">Resolved At:</p>
                      <p className="text-green-700">
                        {new Date(dispute.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  {isMediator && dispute.status === "in_mediation" && (
                    <TabsTrigger value="resolution">Resolution</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="messages">
                  <DisputeMessages disputeId={disputeId} isMediator={isMediator} />
                </TabsContent>
                
                <TabsContent value="evidence">
                  <DisputeEvidence disputeId={disputeId} />
                </TabsContent>
                
                <TabsContent value="timeline">
                  <DisputeTimeline disputeId={disputeId} />
                </TabsContent>
                
                {isMediator && dispute.status === "in_mediation" && (
                  <TabsContent value="resolution">
                    <DisputeResolution 
                      disputeId={disputeId} 
                      dispute={dispute}
                      onResolved={fetchDispute}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                {/* Parties */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Parties Involved</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Filed By</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {dispute.filedByName}
                          {isFiledByUser && " (You)"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Respondent</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">
                          {dispute.respondentName}
                          {!isFiledByUser && " (You)"}
                        </span>
                      </div>
                    </div>
                    {dispute.mediatorName && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Mediator</p>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-accent" />
                          <span className="text-sm font-semibold text-foreground">
                            {dispute.mediatorName}
                            {isMediator && " (You)"}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Details */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Project</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-foreground">{dispute.projectTitle}</span>
                      </div>
                    </div>
                    {dispute.milestoneTitle && (
                      <div>
                        <p className="text-muted-foreground">Milestone</p>
                        <p className="font-semibold text-foreground mt-1">{dispute.milestoneTitle}</p>
                      </div>
                    )}
                    {dispute.amountDisputed && (
                      <div>
                        <p className="text-muted-foreground">Amount Disputed</p>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-foreground">
                            ${dispute.amountDisputed.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Priority</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                        dispute.priority === "urgent" ? "bg-red-100 text-red-700" :
                        dispute.priority === "high" ? "bg-orange-100 text-orange-700" :
                        dispute.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {dispute.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Filed On</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
