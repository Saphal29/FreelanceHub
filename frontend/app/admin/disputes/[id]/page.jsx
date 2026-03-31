"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputeById, resolveDispute } from "@/lib/api";
import DisputeTimeline from "@/components/disputes/DisputeTimeline";
import DisputeMessages from "@/components/disputes/DisputeMessages";
import DisputeEvidence from "@/components/disputes/DisputeEvidence";
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
  Gavel,
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

export default function AdminDisputeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id;
  const { user, loading: authLoading } = useAuth();
  
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resolving, setResolving] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [showMediatorForm, setShowMediatorForm] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedMediator, setSelectedMediator] = useState("");
  const [resolutionData, setResolutionData] = useState({
    resolutionType: "",
    resolutionNotes: "",
    resolutionAmount: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN" && disputeId) {
      fetchDispute();
      fetchAdminUsers();
    }
  }, [user, disputeId]);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users?role=ADMIN&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAdminUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
    }
  };

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

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    
    if (!resolutionData.resolutionType) {
      setError("Please select a resolution type");
      return;
    }
    
    if (!resolutionData.resolutionNotes.trim()) {
      setError("Please provide resolution notes");
      return;
    }
    
    try {
      setResolving(true);
      setError("");
      
      const response = await resolveDispute(disputeId, {
        resolutionType: resolutionData.resolutionType,
        resolutionNotes: resolutionData.resolutionNotes,
        resolutionAmount: resolutionData.resolutionAmount ? parseFloat(resolutionData.resolutionAmount) : null
      });
      
      if (response.success) {
        setSuccess("Dispute resolved successfully");
        setShowResolutionForm(false);
        fetchDispute();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to resolve dispute");
      }
    } catch (err) {
      console.error("Error resolving dispute:", err);
      setError(err.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const handleAssignMediator = async (e) => {
    e.preventDefault();
    
    if (!selectedMediator) {
      setError("Please select a mediator");
      return;
    }
    
    try {
      setAssigning(true);
      setError("");
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/disputes/${disputeId}/assign-mediator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mediatorId: selectedMediator })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess("Mediator assigned successfully");
        setShowMediatorForm(false);
        fetchDispute();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to assign mediator");
      }
    } catch (err) {
      console.error("Error assigning mediator:", err);
      setError(err.message || "Failed to assign mediator");
    } finally {
      setAssigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  if (error && !dispute) {
    return (
      <div className="p-8">
        <Alert className="border-2 border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dispute) return null;

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
  const StatusIcon = statusConfig.icon;
  const canResolve = dispute.status !== "resolved" && dispute.status !== "closed";

  return (
    <div className="p-8">
      <Link
        href="/admin/disputes"
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
            <h1 className="text-3xl font-bold">{dispute.title}</h1>
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-muted-foreground">
            Dispute #{dispute.id.slice(0, 8)} • {CATEGORY_LABELS[dispute.category]}
          </p>
        </div>
        <div className="flex gap-3">
          {!dispute.mediatorId && dispute.status !== "resolved" && dispute.status !== "closed" && (
            <Button
              onClick={() => setShowMediatorForm(!showMediatorForm)}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              {showMediatorForm ? "Cancel" : "Assign Mediator"}
            </Button>
          )}
          {canResolve && (
            <Button
              onClick={() => setShowResolutionForm(!showResolutionForm)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Gavel className="h-4 w-4 mr-2" />
              {showResolutionForm ? "Cancel Resolution" : "Resolve Dispute"}
            </Button>
          )}
        </div>
      </div>

      {/* Mediator Assignment Form */}
      {showMediatorForm && !dispute.mediatorId && (
        <Card className="mb-6 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Shield className="h-5 w-5 mr-2" />
              Assign Mediator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignMediator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Mediator (Admin) *</label>
                <select
                  value={selectedMediator}
                  onChange={(e) => setSelectedMediator(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background"
                  required
                >
                  <option value="">Choose an admin to mediate this dispute</option>
                  {adminUsers.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name} ({admin.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  The selected admin will be able to view all dispute details and resolve it.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={assigning} className="bg-purple-600 hover:bg-purple-700">
                  {assigning ? "Assigning..." : "Assign Mediator"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediatorForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resolution Form */}
      {showResolutionForm && canResolve && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Gavel className="h-5 w-5 mr-2" />
              Resolve Dispute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resolution Type *</label>
                <select
                  value={resolutionData.resolutionType}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionType: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background"
                  required
                >
                  <option value="">Select resolution type</option>
                  <option value="release_to_freelancer">Release Payment to Freelancer</option>
                  <option value="refund_to_client">Refund to Client</option>
                  <option value="partial_settlement">Partial Settlement</option>
                  <option value="no_action">No Action Required</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {(resolutionData.resolutionType === "partial_settlement" || 
                resolutionData.resolutionType === "refund_to_client" ||
                resolutionData.resolutionType === "release_to_freelancer") && (
                <div>
                  <label className="block text-sm font-medium mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={resolutionData.resolutionAmount}
                    onChange={(e) => setResolutionData({ ...resolutionData, resolutionAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-background"
                    placeholder="Enter amount"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Resolution Notes *</label>
                <textarea
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background min-h-[120px]"
                  placeholder="Explain your decision and reasoning..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={resolving} className="bg-green-600 hover:bg-green-700">
                  {resolving ? "Resolving..." : "Submit Resolution"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResolutionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{dispute.description}</p>
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {dispute.status === "resolved" && dispute.resolutionType && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages">
              <DisputeMessages disputeId={disputeId} isMediator={true} />
            </TabsContent>
            
            <TabsContent value="evidence">
              <DisputeEvidence disputeId={disputeId} />
            </TabsContent>
            
            <TabsContent value="timeline">
              <DisputeTimeline disputeId={disputeId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle>Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Filed By</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {dispute.filedByName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{dispute.filedByEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Respondent</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {dispute.respondentName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{dispute.respondentEmail}</p>
                </div>
                {dispute.mediatorName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mediator</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold">
                        {dispute.mediatorName}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Project</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-semibold">{dispute.projectTitle}</span>
                  </div>
                </div>
                {dispute.milestoneTitle && (
                  <div>
                    <p className="text-muted-foreground">Milestone</p>
                    <p className="font-semibold mt-1">{dispute.milestoneTitle}</p>
                  </div>
                )}
                {dispute.amountDisputed && (
                  <div>
                    <p className="text-muted-foreground">Amount Disputed</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">
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
                    <span className="font-semibold">
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
  );
}
