"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContractById, 
  signContract,
  initiatePayment, 
  initiateEsewaPayment, 
  initiateStripePayment,
  getContractPayments, 
  getContractEscrow,
  releaseEscrow, 
  refundEscrow,
  getMilestones
} from "@/lib/api";
import {
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft, 
  User, 
  Briefcase, 
  Shield, 
  CreditCard, 
  RefreshCw, 
  MessageSquare, 
  Video, 
  Star,
  Banknote,
  Send,
  X
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id;
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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && contractId) {
      fetchAllData();
    }
  }, [user, contractId]);

  // Auto-submit eSewa hidden form
  useEffect(() => {
    if (esewaFormData) {
      const form = document.getElementById('esewa-payment-form');
      if (form) form.submit();
    }
  }, [esewaFormData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");
      const [contractRes, paymentsRes, escrowRes] = await Promise.allSettled([
        getContractById(contractId),
        getContractPayments(contractId),
        getContractEscrow(contractId)
      ]);

      if (contractRes.status === 'fulfilled' && contractRes.value?.success) {
        const contractObj = contractRes.value.contract;
        setContract(contractObj);

        if (contractObj.projectId) {
          const milestonesRes = await getMilestones(contractObj.projectId).catch(() => ({ milestones: [] }));
          const uniqueMilestones = Array.from(
            new Map((milestonesRes.milestones || []).map(m => [m.id, m])).values()
          );
          setMilestones(uniqueMilestones);
        }
      } else {
        setError("Failed to load contract specification.");
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.payments) {
        setPayments(paymentsRes.value.payments);
      }

      if (escrowRes.status === 'fulfilled' && escrowRes.value?.escrow) {
        setEscrowList(escrowRes.value.escrow);
      }

    } catch (err) {
      setError(err.message || "Failed to load contract workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    try {
      setSigning(true);
      setError("");
      const response = await signContract(contractId);
      if (response.success) {
        setSuccessMessage("Digital contract executed successfully!");
        setContract(response.contract);
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(response.error || "Failed to execute contract signature.");
      }
    } catch (err) {
      setError(err.message || "Failed to execute signature.");
    } finally {
      setSigning(false);
    }
  };

  const handleReleaseEscrow = async (escrowId) => {
    try {
      setError("");
      const res = await releaseEscrow(escrowId, "Milestone approved by client");
      if (res.success) {
        setSuccessMessage("Escrow funds released to freelancer balance!");
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(res.error || "Failed to release escrow funds.");
      }
    } catch (err) {
      setError(err.message || "Failed to release escrow.");
    }
  };

  const handleRefundEscrow = async (escrowId) => {
    try {
      setError("");
      const res = await refundEscrow(escrowId, "Escrow refunded by client");
      if (res.success) {
        setSuccessMessage("Escrow refunded successfully!");
        fetchAllData();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setError(res.error || "Failed to refund escrow.");
      }
    } catch (err) {
      setError(err.message || "Failed to refund escrow.");
    }
  };

  const handleDepositSubmit = async (e, gateway) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setError("Please enter a valid deposit amount.");
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
          setEsewaFormData(res.payment.formData);
        } else {
          setError(res.error || "Failed to initiate eSewa deposit.");
        }
      } else if (gateway === 'stripe') {
        const res = await initiateStripePayment(payData);
        if (res.success && res.payment.sessionUrl) {
          window.location.href = res.payment.sessionUrl;
        } else {
          setError(res.error || "Failed to initiate Stripe deposit.");
        }
      } else {
        const res = await initiatePayment(payData);
        if (res.success && res.payment.paymentUrl) {
          window.location.href = res.payment.paymentUrl;
        } else {
          setError(res.error || "Failed to initiate deposit.");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to initiate deposit.");
    } finally {
      setPayLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--signal)] mx-auto"></div>
          <p className="text-[12px] text-[var(--muted)] uppercase">LOADING CONTRACT SPECIMEN...</p>
        </div>
      </div>
    );
  }

  if (!user || (!contract && !error)) return null;

  if (error && !contract) {
    return (
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger">
        <Navbar userType={user.role === "CLIENT" ? "client" : "freelancer"} />
        <main className="max-w-4xl mx-auto px-4 py-16 space-y-6 text-left font-mono-ledger text-[12px]">
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)]">
            {error}
          </div>
          <Link 
            href="/contracts"
            className="inline-flex items-center space-x-2 bg-[var(--ink)] text-[var(--paper)] font-bold px-5 py-2.5 uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN TO CONTRACT REGISTER</span>
          </Link>
        </main>
      </div>
    );
  }

  const userType = user.role === "CLIENT" ? "client" : "freelancer";
  const isClient = contract.clientId === user.id;
  const userHasSigned = isClient ? contract.signedByClient : contract.signedByFreelancer;
  const fullyExecuted = contract.signedByClient && contract.signedByFreelancer;
  const isActive = contract.status === "active";

  const heldEscrow = escrowList.filter((e) => e.status === "held");
  const totalHeld = heldEscrow.reduce((sum, e) => sum + (e.amount || 0), 0);
  const releasedEscrow = escrowList.filter((e) => e.status === "released");
  const totalReleased = releasedEscrow.reduce((sum, e) => sum + (e.netAmount || e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Specimen Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* CONTRACT HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link 
              href="/contracts" 
              className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CONTRACT REGISTER</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">
              SPECIMEN / #{contract.id?.slice(0, 8) || '0001'}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif-ledger text-[34px] sm:text-[48px] leading-[1.1] font-medium tracking-tight text-[var(--ink)]">
              {contract.projectTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-4 font-mono-ledger text-[11px] text-[var(--muted)] border-t border-[var(--line)] pt-3">
              <span>CREATED: {new Date(contract.createdAt || contract.created_at || Date.now()).toLocaleDateString()}</span>
              <span>•</span>
              <span>
                STATUS: <strong className="text-[var(--ink)] font-bold">[{contract.status?.toUpperCase() || 'REGISTERED'}]</strong>
              </span>
              <span>•</span>
              <span>
                SIGNATURES: <strong className={fullyExecuted ? "text-green-700 font-bold" : "text-[var(--signal)] font-bold"}>
                  [{fullyExecuted ? "FULLY EXECUTED" : userHasSigned ? "AWAITING OTHER PARTY" : "NEEDS YOUR SIGNATURE"}]
                </strong>
              </span>
            </div>
          </div>

          {/* Quick Action Strip */}
          <div className="flex flex-wrap items-center gap-3 pt-2 font-mono-ledger text-[11px]">
            <Link 
              href={`/chat?userId=${isClient ? contract.freelancerId : contract.clientId}&contractId=${contractId}`}
              className="px-4 py-2.5 border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] hover:bg-[var(--paper)] transition-colors inline-flex items-center space-x-1.5 font-bold uppercase"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[var(--signal)]" />
              <span>MESSAGE {isClient ? "FREELANCER" : "CLIENT"}</span>
            </Link>

            {isActive && (
              <Link 
                href={`/video-meeting?contractId=${contractId}&userId=${isClient ? contract.freelancerId : contract.clientId}`}
                className="px-4 py-2.5 border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] hover:bg-[var(--paper)] transition-colors inline-flex items-center space-x-1.5 font-bold uppercase"
              >
                <Video className="h-3.5 w-3.5 text-[var(--ink)]" />
                <span>SCHEDULE MEETING</span>
              </Link>
            )}

            {isClient && (
              <button
                onClick={() => {
                  setShowDepositModal(true);
                  setPayAmount(contract.agreedBudget?.toString() || "");
                  setPayDescription(`Escrow deposit for ${contract.projectTitle}`);
                }}
                className="px-5 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors uppercase inline-flex items-center space-x-1 shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>DEPOSIT ESCROW FUNDS →</span>
              </button>
            )}
          </div>

        </section>


        {/* NOTIFICATIONS & EXECUTION BANNERS */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-600 text-green-800 font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {!userHasSigned && contract.status === "pending" && (
          <div className="p-5 border-2 border-[var(--signal)] bg-red-50 space-y-3 font-mono-ledger text-[12px] text-left">
            <div className="flex items-center space-x-2 text-[var(--signal-dark)] font-bold uppercase">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>DIGITAL SIGNATURE REQUIRED</span>
            </div>
            <p className="text-[var(--ink)]">
              This contract requires your official digital signature to activate milestone escrow and begin work.
            </p>
            <button
              onClick={handleSignContract}
              disabled={signing}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-6 py-2.5 uppercase transition-colors"
            >
              {signing ? "EXECUTING SIGNATURE..." : "EXECUTE DIGITAL SIGNATURE →"}
            </button>
          </div>
        )}


        {/* ASYMMETRIC 2-COLUMN WORKSPACE (70% Contract Terms & Milestones / 30% Escrow Instrument) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start text-left">
          
          {/* Left Column (70% Width: Cols 1 to 8) - CONTRACT TERMS & MILESTONES */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 01 / CONTRACT TERMS */}
            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>01 / CONTRACT TERMS & SPECIFICATIONS</span>
                <span className="text-[var(--signal)]">AGREED BUDGET: NPR {contract.agreedBudget?.toLocaleString()}</span>
              </div>

              <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 font-mono-ledger text-[12px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[var(--line)] pb-4">
                  <div>
                    <span className="text-[var(--muted)] text-[10px] uppercase block">TOTAL AGREED BUDGET</span>
                    <span className="text-[20px] font-bold text-[var(--signal)]">
                      NPR {contract.agreedBudget?.toLocaleString()}
                    </span>
                  </div>

                  {contract.agreedTimeline && (
                    <div>
                      <span className="text-[var(--muted)] text-[10px] uppercase block">AGREED TIMELINE</span>
                      <span className="text-[20px] font-bold text-[var(--ink)]">
                        {contract.agreedTimeline}
                      </span>
                    </div>
                  )}
                </div>

                {contract.paymentTerms && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[var(--muted)] text-[10px] uppercase font-bold block">PAYMENT TERMS</span>
                    <p className="font-sans-ledger text-[14px] text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
                      {contract.paymentTerms}
                    </p>
                  </div>
                )}

                {contract.deliverables && (
                  <div className="space-y-1 pt-2 border-t border-[var(--line)]">
                    <span className="text-[var(--muted)] text-[10px] uppercase font-bold block">DELIVERABLES SPECIFICATION</span>
                    <p className="font-sans-ledger text-[14px] text-[var(--ink)] whitespace-pre-wrap leading-relaxed">
                      {contract.deliverables}
                    </p>
                  </div>
                )}
              </div>
            </div>


            {/* 02 / MILESTONE ESCROW & DELIVERABLE REGISTER */}
            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>02 / MILESTONE ESCROW & DELIVERABLE REGISTER</span>
                <span className="text-[var(--signal)]">{milestones.length} MILESTONES</span>
              </div>

              {milestones.length === 0 ? (
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 text-left font-mono-ledger text-[12px] space-y-2">
                  <p className="font-bold text-[var(--ink)]">No specific milestones configured.</p>
                  <p className="text-[var(--muted)]">This contract uses single-sum milestone escrow upon completion.</p>
                </div>
              ) : (
                <div className="border-2 border-[var(--ink)] bg-[var(--paper)] divide-y divide-[var(--line)] font-mono-ledger text-[12px]">
                  {milestones.map((milestone, idx) => {
                    const mEscrow = escrowList.filter(e => e.milestoneId === milestone.id);
                    const isHeld = mEscrow.find(e => e.status === 'held');
                    const isReleased = mEscrow.find(e => e.status === 'released');

                    return (
                      <div key={milestone.id || idx} className="p-5 space-y-3">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[var(--muted)] uppercase font-bold">MILESTONE 0{idx + 1}</span>
                            <h4 className="font-serif-ledger text-[18px] font-medium text-[var(--ink)]">
                              {milestone.title}
                            </h4>
                          </div>

                          <div className="flex items-center space-x-3 text-right">
                            <span className="font-bold text-[var(--signal)] text-[14px]">
                              NPR {milestone.amount?.toLocaleString()}
                            </span>
                            <span className="px-2 py-0.5 border border-[var(--ink)] bg-[var(--paper-2)] font-bold text-[10px] uppercase">
                              [{milestone.status?.toUpperCase() || 'PENDING'}]
                            </span>
                          </div>
                        </div>

                        {milestone.description && (
                          <p className="font-sans-ledger text-[13px] text-[var(--muted)]">
                            {milestone.description}
                          </p>
                        )}

                        {/* Escrow Status Actions */}
                        <div className="pt-2 font-mono-ledger text-[11px]">
                          {isHeld ? (
                            <div className="p-3 bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-amber-900 block">NPR {isHeld.amount?.toLocaleString()} HELD IN ESCROW</span>
                                <span className="text-[10px] text-amber-700 block">FreelanceHub fee 10% applied upon release</span>
                              </div>

                              {isClient && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleReleaseEscrow(isHeld.id)}
                                    className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-3 py-1.5 uppercase transition-colors"
                                  >
                                    RELEASE FUNDS →
                                  </button>
                                  <button
                                    onClick={() => handleRefundEscrow(isHeld.id)}
                                    className="bg-[var(--paper)] border border-[var(--ink)] text-[var(--ink)] font-bold px-3 py-1.5 uppercase hover:bg-red-50 transition-colors"
                                  >
                                    REFUND
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isReleased ? (
                            <div className="p-3 bg-green-50 border border-green-300 text-green-800 font-bold flex items-center justify-between">
                              <span>✓ NPR {isReleased.amount?.toLocaleString()} RELEASED TO FREELANCER</span>
                              <span className="text-[10px] text-green-700 font-normal">
                                RELEASED: {new Date(isReleased.releasedAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)] text-[10px]">
                              STATUS: NO ESCROW FUNDS DEPOSITED YET
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>


          {/* Right Column (30% Width: Cols 9 to 12) - ESCROW FINANCIAL INSTRUMENT */}
          <div className="lg:col-span-4 space-y-8 font-mono-ledger text-[12px]">
            
            {/* ESCROW SUMMARY INSTRUMENT */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>ESCROW FINANCIAL RECORD</span>
                <span className="text-[var(--signal)]">[NPR]</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[var(--muted)] text-[10px] uppercase block">TOTAL CONTRACT BUDGET</span>
                  <span className="font-bold text-[20px] text-[var(--ink)]">
                    NPR {contract.agreedBudget?.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-[var(--line)] pt-2 space-y-1">
                  <span className="text-[var(--muted)] text-[10px] uppercase block">FUNDS HELD IN ESCROW</span>
                  <span className="font-bold text-[18px] text-[var(--signal)] block">
                    NPR {totalHeld.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block">Protected in local reserve</span>
                </div>

                <div className="border-t border-[var(--line)] pt-2 space-y-1">
                  <span className="text-[var(--muted)] text-[10px] uppercase block">RELEASED TO FREELANCER</span>
                  <span className="font-bold text-[18px] text-green-700 block">
                    NPR {totalReleased.toLocaleString()}
                  </span>
                </div>

                {isClient && (
                  <div className="pt-3 border-t border-[var(--ink)]">
                    <button
                      onClick={() => {
                        setShowDepositModal(true);
                        setPayAmount(contract.agreedBudget?.toString() || "");
                        setPayDescription(`Escrow deposit for ${contract.projectTitle}`);
                      }}
                      className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[11px] uppercase tracking-wider py-2.5 transition-colors shadow-xs"
                    >
                      DEPOSIT ESCROW FUNDS →
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* DIGITAL SIGNATURE RECORD */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>DIGITAL SIGNATURES</span>
                <span className="text-[var(--signal)]">• RECORD</span>
              </div>

              <div className="space-y-3 text-[11px]">
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">CLIENT SIGNATURE</span>
                  <span className={contract.signedByClient ? "font-bold text-green-700" : "font-bold text-[var(--signal)]"}>
                    {contract.signedByClient ? "[SIGNED]" : "[PENDING]"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[var(--line)]">
                  <span className="text-[var(--muted)]">FREELANCER SIGNATURE</span>
                  <span className={contract.signedByFreelancer ? "font-bold text-green-700" : "font-bold text-[var(--signal)]"}>
                    {contract.signedByFreelancer ? "[SIGNED]" : "[PENDING]"}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-[var(--ink)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--paper)] border-2 border-[var(--ink)] max-w-md w-full p-6 space-y-6 shadow-xl text-left font-sans-ledger">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px] uppercase tracking-wider">
              <span className="text-[var(--ink)] font-bold">ESCROW DEPOSIT WINDOW</span>
              <button onClick={() => setShowDepositModal(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-serif-ledger text-[24px] font-normal text-[var(--ink)]">
              Deposit Funds into Escrow
            </h3>

            <div className="space-y-4 font-mono-ledger text-[12px]">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold">DEPOSIT AMOUNT (NPR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 font-bold text-[16px] focus:outline-none"
                  placeholder="45000"
                />
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">SELECT PAYMENT GATEWAY</span>
                <button
                  type="button"
                  onClick={(e) => handleDepositSubmit(e, 'esewa')}
                  disabled={payLoading}
                  className="w-full bg-green-700 text-white font-bold py-3 uppercase hover:bg-green-800 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>PAY WITH ESEWA (NPR) →</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDepositSubmit(e, 'stripe')}
                  disabled={payLoading}
                  className="w-full bg-[var(--ink)] text-[var(--paper)] font-bold py-3 uppercase hover:bg-[var(--signal)] transition-colors flex items-center justify-center space-x-2"
                >
                  <span>PAY WITH CARD / STRIPE →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden eSewa Auto-Submit Form */}
      {esewaFormData && (
        <form id="esewa-payment-form" method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" className="hidden">
          {Object.entries(esewaFormData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Contract Execution & Escrow Workspace</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
