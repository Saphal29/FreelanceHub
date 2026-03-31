"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectProposals, acceptProposal, rejectProposal, getProposalFiles, downloadFile } from "@/lib/api";
import { getAbsoluteFileUrl, formatFileSize as formatSize } from "@/lib/fileUtils";
import { 
  Users,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  File,
  Image as ImageIcon
} from "lucide-react";

export default function ProposalList({ projectId, onProposalAccepted }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedProposal, setExpandedProposal] = useState(null);
  const [proposalFiles, setProposalFiles] = useState({});

  useEffect(() => {
    fetchProposals();
  }, [projectId, statusFilter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await getProjectProposals(projectId, params);

      if (response.success) {
        const proposalsList = response.proposals || [];
        setProposals(proposalsList);
        
        // Fetch files for each proposal
        proposalsList.forEach(async (proposal) => {
          try {
            const filesResponse = await getProposalFiles(proposal.id);
            if (filesResponse.success && filesResponse.files.length > 0) {
              setProposalFiles(prev => ({
                ...prev,
                [proposal.id]: filesResponse.files
              }));
            }
          } catch (err) {
            console.error(`Error fetching files for proposal ${proposal.id}:`, err);
          }
        });
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

  const handleAccept = async (proposalId) => {
    if (!confirm("Are you sure you want to accept this proposal? This will start the project.")) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [proposalId]: "accepting" });
      setError("");
      setSuccessMessage("");

      const response = await acceptProposal(proposalId);

      if (response.success) {
        setSuccessMessage("Proposal accepted! Project is now in progress.");
        setProposals(proposals.map(p => 
          p.id === proposalId ? { ...p, status: "accepted" } : p
        ));
        setTimeout(() => setSuccessMessage(""), 3000);
        
        // Notify parent component
        if (onProposalAccepted) {
          onProposalAccepted(response.proposal);
        }
      } else {
        setError(response.error || "Failed to accept proposal");
      }
    } catch (err) {
      console.error("Error accepting proposal:", err);
      setError(err.message || "Failed to accept proposal");
    } finally {
      setActionLoading({ ...actionLoading, [proposalId]: null });
    }
  };

  const handleReject = async (proposalId) => {
    if (!confirm("Are you sure you want to reject this proposal?")) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [proposalId]: "rejecting" });
      setError("");
      setSuccessMessage("");

      const response = await rejectProposal(proposalId);

      if (response.success) {
        setSuccessMessage("Proposal rejected.");
        setProposals(proposals.map(p => 
          p.id === proposalId ? { ...p, status: "rejected" } : p
        ));
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error || "Failed to reject proposal");
      }
    } catch (err) {
      console.error("Error rejecting proposal:", err);
      setError(err.message || "Failed to reject proposal");
    } finally {
      setActionLoading({ ...actionLoading, [proposalId]: null });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending" },
      accepted: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Accepted" },
      rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Rejected" },
      withdrawn: { bg: "bg-gray-100", text: "text-gray-700", icon: XCircle, label: "Withdrawn" }
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

  const handleDownloadFile = async (file) => {
    try {
      // Use the API client to download the file as a blob
      const blob = await downloadFile(file.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center font-display text-xl">
          <Users className="h-5 w-5 mr-2 text-accent" />
          Proposals ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Error Message */}
        {error && (
          <Alert className="mb-4 border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-4 border-2 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && proposals.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No proposals yet</p>
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="rounded-xl border border-border bg-secondary/30 p-4"
            >
              {/* Freelancer Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {proposal.freelancer.avatar ? (
                    <img
                      src={getAbsoluteFileUrl(proposal.freelancer.avatar)}
                      alt={proposal.freelancer.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-semibold text-lg">
                        {proposal.freelancer.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{proposal.freelancer.name}</p>
                    {proposal.freelancer.title && (
                      <p className="text-sm text-muted-foreground">{proposal.freelancer.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {proposal.freelancer.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {parseFloat(proposal.freelancer.rating).toFixed(1)}
                        </span>
                      )}
                      {proposal.freelancer.jobsCompleted > 0 && (
                        <span>{proposal.freelancer.jobsCompleted} jobs completed</span>
                      )}
                      {proposal.freelancer.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {proposal.freelancer.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(proposal.status)}
              </div>

              {/* Proposal Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {proposal.proposedBudget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Proposed Budget</p>
                      <p className="font-semibold text-foreground">${proposal.proposedBudget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {proposal.proposedTimeline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                      <p className="font-semibold text-foreground">{proposal.proposedTimeline}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground mb-2">Cover Letter:</p>
                <div className="rounded-lg bg-card p-3">
                  <p className={`text-sm text-muted-foreground ${expandedProposal === proposal.id ? '' : 'line-clamp-3'}`}>
                    {proposal.coverLetter}
                  </p>
                  {proposal.coverLetter.length > 200 && (
                    <button
                      onClick={() => setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)}
                      className="text-xs text-accent hover:underline mt-2"
                    >
                      {expandedProposal === proposal.id ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {proposalFiles[proposal.id] && proposalFiles[proposal.id].length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Attachments ({proposalFiles[proposal.id].length}):
                  </p>
                  <div className="space-y-2">
                    {proposalFiles[proposal.id].map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        {getFileIcon(file.mimeType)}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(file.fileSize)}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(file)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {proposal.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleAccept(proposal.id)}
                    disabled={actionLoading[proposal.id] === "accepting"}
                    className="flex-1"
                  >
                    {actionLoading[proposal.id] === "accepting" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(proposal.id)}
                    disabled={actionLoading[proposal.id] === "rejecting"}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading[proposal.id] === "rejecting" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Submitted Date */}
              <p className="text-xs text-muted-foreground mt-3">
                Submitted {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
