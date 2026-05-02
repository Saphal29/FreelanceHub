"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContractById, signContract,
  initiatePayment, initiateEsewaPayment, initiateStripePayment,
  getContractPayments, getContractEscrow,
  releaseEscrow, refundEscrow,
  getMilestones
} from "@/lib/api";
import {
  FileText, Clock, CheckCircle, AlertCircle,
  ArrowLeft, User, Briefcase, Shield, CreditCard, RefreshCw, MessageSquare, Video, Star,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id;
  const { user, loading: authLoading } = useAuth();

  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [escrowList, setEscrowList] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [signing, setSigning] = useState(false);

  const [esewaFormData, setEsewaFormData] = useState(null);
  const [esewaUrl, setEsewaUrl] = useState("");
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, data: null });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && contractId) {
      fetchAll();
    }
  }, [user, contractId]);

  // Auto-submit eSewa form when formData is ready
  useEffect(() => {
    if (esewaFormData) {
      const form = document.getElementById('esewa-payment-form');
      if (form) form.submit();
    }
  }, [esewaFormData]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [contractRes, paymentsRes, escrowRes] = await Promise.all([
        getContractById(contractId),
        getContractPayments(contractId).catch(() => ({ payments: [] })),
        getContractEscrow(contractId).catch(() => ({ escrow: [] }))
      ]);
      if (contractRes.success) {
        setContract(contractRes.contract);
        // Fetch milestones for the project
        if (contractRes.contract.projectId) {
          const milestonesRes = await getMilestones(contractRes.contract.projectId).catch(() => ({ milestones: [] }));
          // Deduplicate milestones by ID to prevent duplicate key errors
          const uniqueMilestones = Array.from(
            new Map((milestonesRes.milestones || []).map(m => [m.id, m])).values()
          );
          setMilestones(uniqueMilestones);
        }
      }
      else setError(contractRes.error || "Failed to load contract");
      setPayments(paymentsRes.payments || []);
      setEscrowList(escrowRes.escrow || []);
    } catch (err) {
      setError(err.message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setConfirmDialog({ open: true, type: 'sign', data: null });
  };

  const handleRelease = async (escrowId) => {
    setConfirmDialog({ open: true, type: 'release', data: escrowId });
  };

  const handleRefund = async (escrowId) => {
    setConfirmDialog({ open: true, type: 'refund', data: escrowId });
  };

  const confirmAction = async () => {
    const { type, data } = confirmDialog;
    setConfirmDialog({ open: false, type: null, data: null });

    if (type === 'sign') {
      await executeSign();
    } else if (type === 'release') {
      await executeRelease(data);
    } else if (type === 'refund') {
      await executeRefund(data);
    }
  };

  const executeSign = async () => {
    try {
      setSigning(true);
      setError("");
      const response = await signContract(contractId);
      if (response.success) {
        setSuccessMessage("Contract signed successfully!");
        setContract(response.contract);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(response.error || "Failed to sign contract");
      }
    } catch (err) {
      setError(err.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  const executeRelease = async (escrowId) => {
    try {
      setError("");
      const res = await releaseEscrow(escrowId, "Milestone approved");
      if (res.success) {
        setSuccessMessage("Funds released to freelancer!");
        fetchAll();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(res.error || "Failed to release escrow");
      }
    } catch (err) {
      setError(err.message || "Failed to release escrow");
    }
  };

  const executeRefund = async (escrowId) => {
    try {
      setError("");
      const res = await refundEscrow(escrowId, "Refunded by client");
      if (res.success) {
        setSuccessMessage("Escrow refunded successfully!");
        fetchAll();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(res.error || "Failed to refund escrow");
      }
    } catch (err) {
      setError(err.message || "Failed to refund escrow");
    }
  };

  const handleInitiatePayment = async (e, gateway) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    try {
      setPayLoading(true);
      setError("");
      const payData = {
        contractId,
        amount: parseFloat(payAmount),
        description: payDescription || `Escrow deposit for ${contract.projectTitle}`
      };

      if (gateway === 'esewa') {
        const res = await initiateEsewaPayment(payData);
        if (res.success) {
          // Set form data in state - hidden form will auto-submit
          setEsewaUrl(res.payment.esewaUrl);
          setEsewaFormData(res.payment.formData);
        } else {
          setError(res.error || "Failed to initiate eSewa payment");
        }
      } else if (gateway === 'stripe') {
        const res = await initiateStripePayment(payData);
        if (res.success && res.payment.sessionUrl) {
          // Redirect to Stripe Checkout
          window.location.href = res.payment.sessionUrl;
        } else {
          setError(res.error || "Failed to initiate Stripe payment");
        }
      } else {
        const res = await initiatePayment(payData);
        if (res.success && res.payment.paymentUrl) {
          window.location.href = res.payment.paymentUrl;
        } else {
          setError(res.error || "Failed to initiate payment");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to initiate payment");
    } finally {
      setPayLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!contract && !error)) return null;

  if (error && !contract) {
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

  const userType = user.role === "CLIENT" ? "client" : "freelancer";
  const isClient = contract.clientId === user.id;
  const userHasSigned = isClient ? contract.signedByClient : contract.signedByFreelancer;
  const fullyExecuted = contract.signedByClient && contract.signedByFreelancer;
  const isActive = contract.status === "active";

  const heldEscrow = escrowList.filter((e) => e.status === "held");
  const totalHeld = heldEscrow.reduce((sum, e) => sum + e.amount, 0);

  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending Signatures" },
      active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
      completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
      disputed: { bg: "bg-orange-100", text: "text-orange-700", label: "Disputed" }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getEscrowBadge = (status) => {
    const map = {
      held: "bg-yellow-100 text-yellow-700",
      released: "bg-green-100 text-green-700",
      refunded: "bg-gray-100 text-gray-700",
      disputed: "bg-red-100 text-red-700"
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, data: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'sign' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Sign Contract
                </>
              )}
              {confirmDialog.type === 'release' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Release Escrow Funds
                </>
              )}
              {confirmDialog.type === 'refund' && (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Refund Escrow
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'sign' && 
                "Are you sure you want to sign this contract? By signing, you agree to all terms and conditions outlined in the contract. This action cannot be undone."}
              {confirmDialog.type === 'release' && 
                "Are you sure you want to release these funds to the freelancer? Once released, the funds will be transferred and this action cannot be undone."}
              {confirmDialog.type === 'refund' && 
                "Are you sure you want to refund this escrow back to your account? This will cancel the associated milestone or payment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null, data: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'refund' ? 'outline' : 'accent'}
              onClick={confirmAction}
            >
              {confirmDialog.type === 'sign' && 'Sign Contract'}
              {confirmDialog.type === 'release' && 'Release Funds'}
              {confirmDialog.type === 'refund' && 'Refund Escrow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Navbar userType={userType} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/contracts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Contracts</span>
          </Link>

          {successMessage && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">{successMessage}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{contract.projectTitle}</h1>
              <p className="text-muted-foreground mt-1">Contract #{contract.id.slice(0, 8)}</p>
            </div>
            {getStatusBadge(contract.status)}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href={`/${userType}/projects/${contract.projectId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" />
                View Project
              </Button>
            </Link>
            <Link href={`/chat?userId=${isClient ? contract.freelancerId : contract.clientId}&contractId=${contractId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message {isClient ? "Freelancer" : "Client"}
              </Button>
            </Link>
            {isActive && (
              <Link href={`/video-meeting?contractId=${contractId}&userId=${isClient ? contract.freelancerId : contract.clientId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Video className="h-4 w-4" />
                  Schedule a Meeting
                </Button>
              </Link>
            )}
            {contract.status === "completed" && (
              <Link href={`/contracts/${contractId}/review`}>
                <Button variant="accent" size="sm" className="gap-2">
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              </Link>
            )}
          </div>

          {!fullyExecuted && (
            <Alert className="mb-6 border-2 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {userHasSigned
                  ? `Waiting for ${isClient ? "freelancer" : "client"} to sign the contract`
                  : "This contract requires your signature to proceed"}
              </AlertDescription>
            </Alert>
          )}

          {fullyExecuted && isActive && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">
                Contract is fully executed and active!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Contract Terms */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Contract Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Agreed Budget</h4>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">
                        {formatCurrency(contract.agreedBudget)}
                      </span>
                    </div>
                  </div>
                  {contract.agreedTimeline && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Timeline</h4>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        <span className="text-lg font-semibold text-foreground">{contract.agreedTimeline}</span>
                      </div>
                    </div>
                  )}
                  {contract.paymentTerms && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Payment Terms</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{contract.paymentTerms}</p>
                    </div>
                  )}
                  {contract.deliverables && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{contract.deliverables}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sign Button */}
              {!userHasSigned && contract.status === "pending" && (
                <Card className="border-border border-accent/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Ready to sign?</h3>
                        <p className="text-sm text-muted-foreground">
                          By signing, you agree to the terms and conditions outlined above
                        </p>
                      </div>
                      <Button onClick={handleSign} disabled={signing} size="lg" variant="accent">
                        {signing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Signing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Sign Contract
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Escrow / Payment Section - show for active and completed contracts */}
              {(isActive || contract.status === 'completed') && (
                <>
                  {/* Payment Summary */}
                  {milestones.length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <Banknote className="h-5 w-5 mr-2 text-accent" />
                          Payment Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Total Contract Amount */}
                          <div className="bg-white rounded-lg p-4 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Total Contract</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(contract.agreedBudget)}</p>
                          </div>
                          
                          {/* Paid to Freelancer */}
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-xs text-green-700 mb-1">Paid to Freelancer</p>
                            <p className="text-2xl font-bold text-green-700">
                              {formatCurrency(
                                escrowList
                                  .filter(e => e.status === 'released')
                                  .reduce((sum, e) => sum + e.netAmount, 0)
                              )}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {escrowList.filter(e => e.status === 'released').length} milestone(s) completed
                            </p>
                          </div>
                          
                          {/* In Escrow */}
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-xs text-yellow-700 mb-1">Held in Escrow</p>
                            <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totalHeld)}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                              {heldEscrow.length} milestone(s) funded
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Payment Progress</span>
                            <span>
                              {Math.round(
                                (escrowList.reduce((sum, e) => sum + e.amount, 0) / contract.agreedBudget) * 100
                              )}% funded
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div className="flex h-full">
                              {/* Released (Green) */}
                              <div 
                                className="bg-green-500 transition-all duration-500"
                                style={{ 
                                  width: `${(escrowList.filter(e => e.status === 'released').reduce((sum, e) => sum + e.amount, 0) / contract.agreedBudget) * 100}%` 
                                }}
                                title="Paid to Freelancer"
                              />
                              {/* Held (Yellow) */}
                              <div 
                                className="bg-yellow-500 transition-all duration-500"
                                style={{ 
                                  width: `${(totalHeld / contract.agreedBudget) * 100}%` 
                                }}
                                title="Held in Escrow"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-green-500 rounded"></div>
                              <span className="text-muted-foreground">Paid</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                              <span className="text-muted-foreground">In Escrow</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Milestone-Based Escrow Display */}
                  {milestones.length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <Shield className="h-5 w-5 mr-2 text-accent" />
                          Milestone Escrow Funds
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {milestones.map((milestone, index) => {
                          // Find escrow for this milestone
                          const milestoneEscrow = escrowList.filter(e => e.milestoneId === milestone.id);
                          const heldEscrow = milestoneEscrow.find(e => e.status === 'held');
                          const releasedEscrow = milestoneEscrow.find(e => e.status === 'released');
                          const totalEscrowAmount = milestoneEscrow.reduce((sum, e) => sum + e.amount, 0);
                          
                          return (
                            <div key={milestone.id} className="border border-border rounded-lg p-4 bg-secondary/20">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent font-semibold text-xs">
                                      {index + 1}
                                    </span>
                                    <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground ml-8">
                                    Amount: {formatCurrency(milestone.amount)}
                                  </p>
                                  {milestone.dueDate && (
                                    <p className="text-xs text-muted-foreground ml-8">
                                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  milestone.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                  milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {milestone.status.replace('_', ' ')}
                                </span>
                              </div>
                              
                              {/* Escrow Status for this Milestone */}
                              <div className="ml-8 space-y-2">
                                {heldEscrow ? (
                                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {formatCurrency(heldEscrow.amount)} in Escrow
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Freelancer gets: {formatCurrency(heldEscrow.netAmount)} (after 10% fee)
                                      </p>
                                    </div>
                                    {isClient && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="accent"
                                          onClick={() => handleRelease(heldEscrow.id)}
                                          disabled={milestone.status !== 'completed'}
                                          title={milestone.status !== 'completed' ? 'Milestone must be completed first' : 'Release funds to freelancer'}
                                        >
                                          Release
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRefund(heldEscrow.id)}
                                        >
                                          Refund
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : releasedEscrow ? (
                                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="text-sm font-semibold text-green-700">
                                        {formatCurrency(releasedEscrow.amount)} Released
                                      </p>
                                      <p className="text-xs text-green-600">
                                        Released on {new Date(releasedEscrow.releasedAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">No funds deposited</p>
                                      {isClient && (
                                        <p className="text-xs text-gray-600">
                                          Deposit {formatCurrency(milestone.amount)} to start this milestone
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Summary */}
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">Total Held in Escrow:</span>
                            <span className="text-lg font-bold text-accent">{formatCurrency(totalHeld)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Escrow Summary for contracts without milestones */}
                  {milestones.length === 0 && heldEscrow.length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <Shield className="h-5 w-5 mr-2 text-accent" />
                          Escrow Funds
                          <span className="ml-auto text-base font-bold text-green-600">
                            {formatCurrency(totalHeld)} held
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {escrowList.map((escrow) => (
                          <div key={escrow.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {formatCurrency(escrow.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Freelancer gets: {formatCurrency(escrow.netAmount)} (after 10% fee)
                              </p>
                              {escrow.milestoneTitle && (
                                <p className="text-xs text-muted-foreground">Milestone: {escrow.milestoneTitle}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getEscrowBadge(escrow.status)}
                              {isClient && escrow.status === "held" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="accent"
                                    onClick={() => handleRelease(escrow.id)}
                                  >
                                    Release
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRefund(escrow.id)}
                                  >
                                    Refund
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Deposit to Escrow - client only */}
                  {isClient && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <CreditCard className="h-5 w-5 mr-2 text-accent" />
                          Deposit Funds to Escrow
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!showDepositDialog ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                              <div>
                                <p className="text-sm font-medium text-foreground">Total Contract Amount</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(contract.agreedBudget)}</p>
                              </div>
                              <Button 
                                variant="accent" 
                                size="lg" 
                                onClick={() => {
                                  setShowDepositDialog(true);
                                  setPayAmount(contract.agreedBudget.toString());
                                  setPayDescription(`Full payment for ${contract.projectTitle}`);
                                }}
                                className="h-12 px-6"
                              >
                                <CreditCard className="h-5 w-5 mr-2" />
                                Deposit Funds
                              </Button>
                            </div>
                            
                            {/* Milestone Breakdown */}
                            {milestones.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Milestone Payment Breakdown</h4>
                                <div className="space-y-2">
                                  {milestones.map((milestone, index) => (
                                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">{index + 1}. {milestone.title}</p>
                                        <p className="text-xs text-muted-foreground">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-foreground">{formatCurrency(milestone.amount)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                                          milestone.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {milestone.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg border-2 border-accent/20">
                                    <p className="text-sm font-bold text-foreground">Total Milestones</p>
                                    <p className="text-lg font-bold text-accent">
                                      {formatCurrency(milestones.reduce((sum, m) => sum + m.amount, 0))}
                                    </p>
                                  </div>
                                  {Math.abs(milestones.reduce((sum, m) => sum + m.amount, 0) - contract.agreedBudget) > 0.01 && (
                                    <Alert className="border-yellow-200 bg-yellow-50">
                                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                                      <AlertDescription className="text-yellow-800 text-xs">
                                        Warning: Milestone total ({formatCurrency(milestones.reduce((sum, m) => sum + m.amount, 0))}) 
                                        doesn't match contract amount ({formatCurrency(contract.agreedBudget)})
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              💡 Funds are held securely in escrow until you approve the work. Platform fee: 10%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Payment methods: eSewa (Nepal) • Stripe (International cards)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-accent/10 rounded-lg">
                              <p className="text-sm font-medium text-foreground mb-2">Deposit Amount</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-accent">{formatCurrency(parseFloat(payAmount) || 0)}</span>
                              </div>
                              {payAmount && parseFloat(payAmount) > 0 && (
                                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                  <p>• Platform fee (10%): {formatCurrency(parseFloat(payAmount) * 0.1)}</p>
                                  <p>• Freelancer receives: {formatCurrency(parseFloat(payAmount) * 0.9)}</p>
                                  <p className="text-blue-600 font-medium mt-2">
                                    • Stripe amount: ${(parseFloat(payAmount) * 0.0075).toFixed(2)} USD
                                    <span className="text-xs text-muted-foreground ml-1">(1 NPR ≈ 0.0075 USD)</span>
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Amount (NPR) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Description (optional)
                              </label>
                              <input
                                type="text"
                                value={payDescription}
                                onChange={(e) => setPayDescription(e.target.value)}
                                placeholder="e.g. Payment for milestone 1"
                                className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                            
                            <div className="pt-4 border-t border-border">
                              <p className="text-sm font-medium text-foreground mb-3">Select Payment Method</p>
                              <div className="flex gap-3 flex-wrap">
                                <Button
                                  type="button"
                                  disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                                  onClick={(e) => handleInitiatePayment(e, 'esewa')}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                                  size="lg"
                                >
                                  {payLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <CreditCard className="h-5 w-5 mr-2" />
                                  )}
                                  Pay with eSewa
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                                  onClick={(e) => handleInitiatePayment(e, 'stripe')}
                                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                                  size="lg"
                                >
                                  {payLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <CreditCard className="h-5 w-5 mr-2" />
                                  )}
                                  Pay with Stripe
                                </Button>
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowDepositDialog(false)}
                                className="w-full mt-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment History */}
                  {payments.length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <RefreshCw className="h-5 w-5 mr-2 text-accent" />
                          Payment History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-xl text-sm">
                            <div>
                              <p className="font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                              <p className="text-xs text-muted-foreground">{p.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.status === "completed" ? "bg-green-100 text-green-700" :
                              p.status === "failed" ? "bg-red-100 text-red-700" :
                              p.status === "refunded" ? "bg-gray-100 text-gray-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                {/* Signature Status */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Signatures</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Client</span>
                      </div>
                      {contract.signedByClient ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Signed</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </div>
                    {contract.clientSignedAt && (
                      <p className="text-xs text-muted-foreground pl-6">
                        {new Date(contract.clientSignedAt).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Freelancer</span>
                      </div>
                      {contract.signedByFreelancer ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Signed</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </div>
                    {contract.freelancerSignedAt && (
                      <p className="text-xs text-muted-foreground pl-6">
                        {new Date(contract.freelancerSignedAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Contract Info */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold text-foreground">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {contract.startedAt && (
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-semibold text-foreground">
                          {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {contract.completedAt && (
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-semibold text-foreground">
                          {new Date(contract.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden eSewa auto-submit form */}
      {esewaFormData && (
        <form id="esewa-payment-form" method="POST" action={esewaUrl} style={{ display: 'none' }}>
          {Object.entries(esewaFormData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}
