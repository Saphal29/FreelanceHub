"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProposals, withdrawProposal } from "@/lib/api";
import { 
  Clock,
  DollarSign,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  MinusCircle,
  User
} from "lucide-react";

export default function MyProposalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if not authenticated or not a freelancer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!user || user.role !== "FREELANCER") return;

      try {
        setLoading(true);
        setError("");

        const params = {};
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const response = await getMyProposals(params);

        if (response.success) {
          setProposals(response.proposals || []);
        } else {
          setError(response.error || "Failed to load proposals");
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
        setError(err.message || "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProposals();
    }
  }, [user, authLoading, statusFilter]);

  // Handle withdraw proposal
  const handleWithdraw = async (proposalId) => {
    if (!confirm("Are you sure you want to withdraw this proposal?")) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [proposalId]: "withdrawing" });
      setError("");
      setSuccessMessage("");

      const response = await withdrawProposal(proposalId);

      if (response.success) {
        setSuccessMessage("Proposal withdrawn successfully!");
        setProposals(proposals.map(p => 
          p.id === proposalId ? { ...p, status: "withdrawn" } : p
        ));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error || "Failed to withdraw proposal");
      }
    } catch (err) {
      console.error("Error withdrawing proposal:", err);
      setError(err.message || "Failed to withdraw proposal");
    } finally {
      setActionLoading({ ...actionLoading, [proposalId]: null });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending" },
      accepted: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Accepted" },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rejected" },
      withdrawn: { bg: "bg-gray-100", text: "text-gray-700", icon: MinusCircle, label: "Withdrawn" }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </div>
    );
  };

  if (authLoading || (loading && proposals.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "FREELANCER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Proposals
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your submitted proposals
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              variant={statusFilter === "all" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "pending" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === "accepted" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("accepted")}
            >
              Accepted
            </Button>
            <Button 
              variant={statusFilter === "rejected" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
            </Button>
            <Button 
              variant={statusFilter === "withdrawn" ? "accent" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("withdrawn")}
            >
              Withdrawn
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && proposals.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No proposals found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start browsing projects and submit your first proposal
                </p>
                <Link href="/freelancer/jobs">
                  <Button variant="accent">
                    Browse Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="border-border hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/projects/${proposal.projectId}`}>
                          <CardTitle className="font-display text-lg hover:text-accent transition-colors cursor-pointer">
                            {proposal.project.title}
                          </CardTitle>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Submitted {new Date(proposal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(proposal.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Client Info */}
                      {proposal.client && (
                        <div className="flex items-center gap-2 pb-3 border-b border-border">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{proposal.client.name}</p>
                            {proposal.client.company && (
                              <p className="text-xs text-muted-foreground">{proposal.client.company}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Proposal Details */}
                      {proposal.proposedBudget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-accent" />
                          <span className="text-sm text-muted-foreground">Budget:</span>
                          <span className="font-semibold text-foreground">
                            ${proposal.proposedBudget.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {proposal.proposedTimeline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          <span className="text-sm text-muted-foreground">Timeline:</span>
                          <span className="font-semibold text-foreground">
                            {proposal.proposedTimeline}
                          </span>
                        </div>
                      )}

                      {/* Cover Letter Preview */}
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-foreground mb-1">Cover Letter:</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {proposal.coverLetter}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Link href={`/projects/${proposal.projectId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Project
                          </Button>
                        </Link>
                        {proposal.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdraw(proposal.id)}
                            disabled={actionLoading[proposal.id] === "withdrawing"}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {actionLoading[proposal.id] === "withdrawing" ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                                Withdrawing...
                              </>
                            ) : (
                              "Withdraw"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
