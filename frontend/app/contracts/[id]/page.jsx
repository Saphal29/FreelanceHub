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
import { CheckCircle2, AlertCircle, X } from "lucide-react";
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
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING CONTRACT RECORD...
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
            className="inline-block text-[var(--ink)] font-bold hover:text-[var(--signal)] underline"
          >
            ← Back to Contract Register
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

  // Timeline events (most recent first)
  const timelineEvents = [
    ...(payments.map(p => ({
      id: p.id,
      timestamp: p.created_at || p.createdAt,
      actor: p.payer_name || (isClient ? user.fullName : contract.clientName) || 'Client',
      avatarChar: (p.payer_name || 'C').charAt(0),
      desc: `Escrow payment of ${formatCurrency(p.amount)} initiated via ${p.payment_method?.toUpperCase() || 'ESEWA'}`
    }))),
    ...(escrowList.map(e => ({
      id: e.id,
      timestamp: e.releasedAt || e.createdAt,
      actor: isClient ? user.fullName : contract.clientName || 'Client',
      avatarChar: 'C',
      desc: e.status === 'released' ? `Released ${formatCurrency(e.netAmount || e.amount)} to freelancer account` : `Escrow reserve of ${formatCurrency(e.amount)} held`
    }))),
    ...(contract.signedByFreelancer ? [{
      id: 'sig-free',
      timestamp: contract.updatedAt || contract.createdAt,
      actor: contract.freelancerName || 'Freelancer',
      avatarChar: (contract.freelancerName || 'F').charAt(0),
      desc: 'Executed digital signature on contract agreement'
    }] : []),
    ...(contract.signedByClient ? [{
      id: 'sig-client',
      timestamp: contract.createdAt,
      actor: contract.clientName || 'Client',
      avatarChar: (contract.clientName || 'C').charAt(0),
      desc: 'Executed digital signature and created contract'
    }] : []),
    {
      id: 'init',
      timestamp: contract.createdAt,
      actor: contract.clientName || 'Client',
      avatarChar: 'C',
      desc: 'Contract agreement drafted on platform ledger'
    }
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* ARCHETYPE F: 1. BACK LINK */}
        <div className="font-mono-ledger text-[11px]">
          <Link href="/contracts" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← Back to Contract Register
          </Link>
        </div>

        {/* ARCHETYPE F: 2. RECORD SUMMARY STRIP (EXPANDED LEDGER ENTRY) */}
        <section className="space-y-2">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            CONTRACT RECORD · #{contract.id?.slice(0, 8) || '0001'}
          </p>

          <div className="border-y-2 border-[var(--ink)] py-5 my-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 font-mono-ledger text-[12px]">
            {/* Title & Parties with 40x40 avatars */}
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif-ledger text-[28px] sm:text-[36px] font-medium text-[var(--ink)] leading-snug">
                {contract.projectTitle}
              </h1>

              <div className="flex items-center space-x-6 text-[12px] pt-1">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(contract.clientName || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block uppercase">CLIENT</span>
                    <span className="font-bold text-[var(--ink)]">{contract.clientName || 'Client Participant'}</span>
                  </div>
                </div>

                <span className="text-[var(--muted)]">↔</span>

                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-[var(--signal)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(contract.freelancerName || 'F').charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted)] block uppercase">FREELANCER</span>
                    <span className="font-bold text-[var(--ink)]">{contract.freelancerName || 'Independent Talent'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount & Status Bracket Tag */}
            <div className="text-left lg:text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[var(--muted)] uppercase block">Total Agreed Budget</span>
              <span className="text-[26px] font-bold text-[var(--signal)] block">
                {formatCurrency(contract.agreedBudget || 0)}
              </span>
              <span className="text-[12px] font-bold text-[var(--signal)] block">
                [{fullyExecuted ? "EXECUTED" : userHasSigned ? "PENDING OTHER SIGNATURE" : "NEEDS YOUR SIGNATURE"}]
              </span>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        {successMessage && (
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* ARCHETYPE F: 3. TWO-COLUMN BODY (65 / 35 SPLIT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (65%): MILESTONE LOG & RECORD HISTORY */}
          <div className="lg:col-span-8 space-y-8">
            
            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>MILESTONE LOG & RECORD HISTORY</span>
                <span className="text-[var(--signal)]">MOST RECENT FIRST</span>
              </div>

              {/* Chronological Timeline Log */}
              <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)] font-mono-ledger text-[12px]">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="p-4 flex items-start space-x-3 hover:bg-[var(--paper-2)] transition-colors">
                    <div className="w-8 h-8 bg-[var(--ink)] text-[var(--paper)] font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      {evt.avatarChar}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)] uppercase">
                        <span className="font-bold text-[var(--ink)]">{evt.actor}</span>
                        <span>{new Date(evt.timestamp || Date.now()).toLocaleString()}</span>
                      </div>
                      <p className="font-sans-ledger text-[13px] text-[var(--ink)] leading-relaxed">
                        {evt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Specifications Details */}
            <div className="space-y-3 font-mono-ledger text-[12px]">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Contract Specifications & Terms
              </span>
              <div className="border border-[var(--ink)] bg-[var(--paper)] p-5 space-y-3 font-sans-ledger text-[13px]">
                {contract.paymentTerms && (
                  <div>
                    <strong className="font-mono-ledger text-[11px] uppercase text-[var(--muted)] block">PAYMENT TERMS:</strong>
                    <p className="text-[var(--ink)] pt-1">{contract.paymentTerms}</p>
                  </div>
                )}
                {contract.deliverables && (
                  <div className="pt-2 border-t border-[var(--line)]">
                    <strong className="font-mono-ledger text-[11px] uppercase text-[var(--muted)] block">DELIVERABLES:</strong>
                    <p className="text-[var(--ink)] pt-1">{contract.deliverables}</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (35%): ACTION PANEL */}
          <div className="lg:col-span-4 space-y-6 font-mono-ledger text-[12px]">
            
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-5">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                Action Panel
              </span>

              {/* Single Primary Action Button */}
              {!userHasSigned && contract.status === "pending" ? (
                <button
                  onClick={handleSignContract}
                  disabled={signing}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                >
                  {signing ? "Executing signature..." : "Execute digital signature →"}
                </button>
              ) : isClient && heldEscrow.length > 0 ? (
                <button
                  onClick={() => handleReleaseEscrow(heldEscrow[0].id)}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                >
                  Release milestone payment →
                </button>
              ) : isClient ? (
                <button
                  onClick={() => {
                    setShowDepositModal(true);
                    setPayAmount(contract.agreedBudget?.toString() || "");
                    setPayDescription(`Escrow deposit for ${contract.projectTitle}`);
                  }}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors"
                >
                  Deposit escrow funds →
                </button>
              ) : (
                <Link
                  href={`/chat?userId=${contract.clientId}&contractId=${contractId}`}
                  className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-4 transition-colors block text-center"
                >
                  Message client →
                </Link>
              )}

              {/* Secondary Actions as Plain Underlined Text Links */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)] text-[11px]">
                <Link 
                  href={`/chat?userId=${isClient ? contract.freelancerId : contract.clientId}&contractId=${contractId}`}
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Message {isClient ? "freelancer" : "client"} →
                </Link>

                <Link 
                  href={`/video-meeting?contractId=${contractId}`}
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Schedule video call →
                </Link>

                <Link 
                  href="/time-tracking"
                  className="text-[var(--ink)] font-bold hover:text-[var(--signal)] underline block"
                >
                  Log time entries →
                </Link>
              </div>

              {/* Compact Parties Block */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-3">
                <span className="font-bold text-[var(--ink)] uppercase text-[10px] block">Contract Parties</span>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(contract.clientName || 'C').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{contract.clientName || 'Client'}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">CLIENT</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--signal)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {(contract.freelancerName || 'F').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] block">{contract.freelancerName || 'Freelancer'}</span>
                    <span className="text-[10px] text-[var(--muted)] uppercase block">FREELANCER</span>
                  </div>
                </div>
              </div>

              {/* Record Details Key-Value List */}
              <div className="pt-4 border-t border-[var(--ink)] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Contract ID:</span>
                  <span className="font-bold text-[var(--ink)]">#{contract.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Escrow Status:</span>
                  <span className="font-bold text-[var(--signal)]">
                    [{heldEscrow.length > 0 ? "RESERVED" : releasedEscrow.length > 0 ? "RELEASED" : "UNFUNDED"}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Digital Signature:</span>
                  <span className="font-bold text-[var(--ink)]">
                    [{fullyExecuted ? "VERIFIED" : "PENDING"}]
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ARCHETYPE F: 4. SUB-ITEMS (MILESTONES ROW PATTERN) */}
        {milestones.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-[var(--ink)]">
            <span className="font-mono-ledger font-bold text-[11px] uppercase text-[var(--ink)] block">
              Contract Milestones ({milestones.length})
            </span>
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)] font-mono-ledger text-[12px]">
              {milestones.map((m, idx) => (
                <div key={m.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] text-[var(--muted)] uppercase">Milestone 0{idx + 1}</span>
                    <h4 className="font-serif-ledger text-[16px] font-medium text-[var(--ink)]">{m.title}</h4>
                    <p className="font-sans-ledger text-[12px] text-[var(--muted)]">{m.description}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-bold text-[var(--signal)] text-[16px] block">{formatCurrency(m.amount)}</span>
                    <span className="text-[10px] font-bold text-[var(--ink)] block">[{m.status?.toUpperCase() || 'PENDING'}]</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                  <span>Pay with eSewa (NPR) →</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDepositSubmit(e, 'stripe')}
                  disabled={payLoading}
                  className="w-full bg-[var(--ink)] text-[var(--paper)] font-bold py-3 uppercase hover:bg-[var(--signal)] transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Pay with card / Stripe →</span>
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
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Contract Record Archetype F</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
