"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { getDisputes } from "@/lib/api";
import {
  AlertCircle,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: FileText },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  in_mediation: { label: "In Mediation", color: "bg-purple-100 text-purple-700", icon: MessageSquare },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

const CATEGORY_OPTIONS = [
  { value: "payment_issue", label: "Payment Issue" },
  { value: "quality_of_work", label: "Quality of Work" },
  { value: "missed_deadline", label: "Missed Deadline" },
  { value: "scope_disagreement", label: "Scope Disagreement" },
  { value: "communication_issue", label: "Communication Issue" },
  { value: "contract_breach", label: "Contract Breach" },
  { value: "other", label: "Other" },
];

export default function DisputesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user, statusFilter, categoryFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError("");
      
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;
      
      const response = await getDisputes(filters);
      
      if (response.success) {
        setDisputes(response.disputes || []);
      } else {
        setError(response.error || "Failed to load disputes");
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
      setError(err.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.open;
  };

  const getCategoryLabel = (category) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (authLoading || loading) {
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                My <span className="text-amber-500">Disputes</span>
              </h1>
              <p className="text-muted-foreground mt-1">Manage and track your disputes</p>
            </div>
            <Link href="/disputes/file">
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                File Dispute
              </Button>
            </Link>
          </div>

          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="border-border mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">All Statuses</option>
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">All Categories</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disputes List */}
          {disputes.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    No disputes found
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {statusFilter || categoryFilter
                      ? "Try adjusting your filters"
                      : "You don't have any disputes yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {disputes
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((dispute) => {
                const statusConfig = getStatusConfig(dispute.status);
                const StatusIcon = statusConfig.icon;
                const isFiledByUser = dispute.filedBy === user.id;
                
                return (
                  <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                    <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground text-lg">{dispute.title}</h3>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                                {getCategoryLabel(dispute.category)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {dispute.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span>Project: {dispute.projectTitle}</span>
                              {dispute.milestoneTitle && <span>Milestone: {dispute.milestoneTitle}</span>}
                              {dispute.amountDisputed && (
                                <span className="font-semibold text-foreground">
                                  Amount: ${dispute.amountDisputed.toLocaleString()}
                                </span>
                              )}
                              <span>{isFiledByUser ? "Filed by you" : `Filed by ${dispute.filedByName}`}</span>
                              <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span>{dispute.messageCount} messages</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Paperclip className="h-3 w-3" />
                                <span>{dispute.evidenceCount} evidence files</span>
                              </div>
                              {dispute.mediatorName && (
                                <div className="text-xs text-muted-foreground">
                                  Mediator: {dispute.mediatorName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(disputes.length / itemsPerPage)}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                itemsPerPage={itemsPerPage}
                totalItems={disputes.length}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
