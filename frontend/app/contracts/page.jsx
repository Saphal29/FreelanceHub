"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getUserContracts } from "@/lib/api";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default function ContractsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user, filter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = filter !== "all" ? { status: filter } : {};
      const response = await getUserContracts(params);
      
      if (response.success) {
        setContracts(response.contracts || []);
      } else {
        setError(response.error || "Failed to load contracts");
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", icon: FileText, label: "Draft" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending" },
      active: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Active" },
      completed: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle, label: "Completed" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Cancelled" },
      disputed: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle, label: "Disputed" }
    };
    
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userType = user.role === "CLIENT" ? "client" : "freelancer";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Contracts
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your contracts
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filter === "all" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "active" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "completed" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Contracts List */}
          {contracts.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contracts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contracts.map((contract) => (
                <Card
                  key={contract.id}
                  className="border-border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-display text-lg">
                          {contract.projectTitle}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contract #{contract.id.slice(0, 8)}
                        </p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Budget:</span>
                        <span className="font-semibold text-foreground">
                          ${parseFloat(contract.agreedBudget).toLocaleString()}
                        </span>
                      </div>
                      
                      {contract.agreedTimeline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-accent" />
                          <span className="text-sm text-muted-foreground">Timeline:</span>
                          <span className="font-semibold text-foreground">
                            {contract.agreedTimeline}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Created {new Date(contract.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-3">
                            {contract.signedByClient && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Client signed
                              </span>
                            )}
                            {contract.signedByFreelancer && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Freelancer signed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/chat?userId=${user?.role === "CLIENT" ? contract.freelancerId : contract.clientId}&contractId=${contract.id}`}
                          >
                            <Button variant="outline" size="sm" className="w-full gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Message {user?.role === "CLIENT" ? "Freelancer" : "Client"}
                            </Button>
                          </Link>
                        </div>
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
