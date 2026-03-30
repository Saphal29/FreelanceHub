"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContractById, signContract,
  initiatePayment, initiateEsewaPayment,
  getContractPayments, getContractEscrow,
  releaseEscrow, refundEscrow
} from "@/lib/api";
import {
  FileText, DollarSign, Clock, CheckCircle, AlertCircle,
  ArrowLeft, User, Briefcase, Shield, CreditCard, RefreshCw, MessageSquare, Video, Star
} from "lucide-react";
import Link from "next/link";

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id;
  const { user, loading: authLoading } = useAuth();

  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [escrowList, setEscrowList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [signing, setSigning] = useState(false);

  const [esewaFormData, setEsewaFormData] = useState(null);
  const [esewaUrl, setEsewaUrl] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [payLoading, setPayLoading] = useState(false);

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
      if (contractRes.success) setContract(contractRes.contract);
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
    if (!confirm("Are you sure you want to sign this contract? This action cannot be undone.")) return;
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

  const handleRelease = async (escrowId) => {
    if (!confirm("Release funds to the freelancer? This cannot be undone.")) return;
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

  const handleRefund = async (escrowId) => {
    if (!confirm("Refund this escrow back to you?")) return;
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
              <Link href={`/calls?calleeId=${isClient ? contract.freelancerId : contract.clientId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Video className="h-4 w-4" />
                  Video Call
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
                      <DollarSign className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">
                        ${parseFloat(contract.agreedBudget).toLocaleString()}
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

              {/* Escrow / Payment Section - only when contract is active */}
              {isActive && (
                <>
                  {/* Escrow Summary */}
                  {heldEscrow.length > 0 && (
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center font-display text-xl">
                          <Shield className="h-5 w-5 mr-2 text-accent" />
                          Escrow Funds
                          <span className="ml-auto text-base font-bold text-green-600">
                            NPR {totalHeld.toLocaleString()} held
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {escrowList.map((escrow) => (
                          <div key={escrow.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                NPR {escrow.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Freelancer gets: NPR {escrow.netAmount.toLocaleString()} (after 10% fee)
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
                          Deposit to Escrow
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!showPayForm ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Securely deposit funds via Khalti or eSewa. Funds are held until you approve the work.
                            </p>
                            <Button variant="accent" onClick={() => setShowPayForm(true)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Deposit
                            </Button>
                          </div>
                        ) : (
                          <form className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Amount (NPR)
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                placeholder="e.g. 5000"
                                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                required
                              />
                              {payAmount && parseFloat(payAmount) > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Platform fee (10%): NPR {(parseFloat(payAmount) * 0.1).toFixed(2)} —
                                  Freelancer receives: NPR {(parseFloat(payAmount) * 0.9).toFixed(2)}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Description (optional)
                              </label>
                              <input
                                type="text"
                                value={payDescription}
                                onChange={(e) => setPayDescription(e.target.value)}
                                placeholder="e.g. Payment for milestone 1"
                                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="accent"
                                disabled={payLoading}
                                onClick={(e) => handleInitiatePayment(e, 'khalti')}
                              >
                                {payLoading ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : null}
                                Pay with Khalti
                              </Button>
                              <Button
                                type="button"
                                disabled={payLoading}
                                onClick={(e) => handleInitiatePayment(e, 'esewa')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Pay with eSewa
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setShowPayForm(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
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
                              <p className="font-semibold text-foreground">NPR {p.amount.toLocaleString()}</p>
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
