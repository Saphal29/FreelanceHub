"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { fileDispute, getContracts, getMilestones } from "@/lib/api";
import FileUpload from "@/components/files/FileUpload";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

const CATEGORY_OPTIONS = [
  { value: "payment_issue", label: "Payment Issue" },
  { value: "quality_of_work", label: "Quality of Work" },
  { value: "missed_deadline", label: "Missed Deadline" },
  { value: "scope_disagreement", label: "Scope Disagreement" },
  { value: "communication_issue", label: "Communication Issue" },
  { value: "contract_breach", label: "Contract Breach" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function FileDisputeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [contracts, setContracts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    contractId: searchParams.get("contractId") || "",
    milestoneId: "",
    category: "",
    title: "",
    description: "",
    amountDisputed: "",
    priority: "medium",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  useEffect(() => {
    if (formData.contractId) {
      fetchMilestones(formData.contractId);
    } else {
      setMilestones([]);
      setFormData(prev => ({ ...prev, milestoneId: "" }));
    }
  }, [formData.contractId]);

  const fetchContracts = async () => {
    try {
      const response = await getContracts();
      if (response.success) {
        const activeContracts = (response.contracts || []).filter(
          c => c.status === "active"
        );
        setContracts(activeContracts);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchMilestones = async (contractId) => {
    try {
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;
      
      const response = await getMilestones(contract.projectId);
      if (response.success) {
        setMilestones(response.milestones || []);
      }
    } catch (err) {
      console.error("Error fetching milestones:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const disputeData = {
        contractId: formData.contractId,
        milestoneId: formData.milestoneId || null,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        amountDisputed: formData.amountDisputed ? parseFloat(formData.amountDisputed) : null,
        priority: formData.priority,
        fileIds: evidenceFiles.map(f => f.file?.id || f.id).filter(Boolean)
      };
      
      const response = await fileDispute(disputeData);
      
      if (response.success) {
        setSuccess("Dispute record filed successfully! Redirecting...");
        setTimeout(() => {
          router.push(`/disputes/${response.dispute.id}`);
        }, 1800);
      } else {
        setError(response.error || "Failed to file dispute");
      }
    } catch (err) {
      console.error("Error filing dispute:", err);
      setError(err.message || "Failed to file dispute");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING DISPUTE FORM...
      </div>
    );
  }

  if (!user) return null;

  const userType = user.role === "CLIENT" ? "client" : "freelancer";

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="font-mono-ledger text-[11px]">
            <Link href="/disputes" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
              ← Back to Dispute Register
            </Link>
          </div>

          <div className="space-y-2">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
              <span>FREELANCEHUB FORM · DISPUTE SPECIFICATION</span>
            </p>
            <h1 className="font-serif-ledger text-[38px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              File a dispute
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              File an official dispute record to initiate platform mediation and review contract specifications.
            </p>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        {success && (
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DISPUTE FORM */}
        <form onSubmit={handleSubmit} className="space-y-6 font-mono-ledger text-[12px]">
          
          {/* Contract Selection */}
          <div className="space-y-1">
            <label htmlFor="contractId" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Contract *
            </label>
            <select
              id="contractId"
              name="contractId"
              value={formData.contractId}
              onChange={handleInputChange}
              required
              className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            >
              <option value="">Select an active contract...</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.projectTitle} - NPR {contract.agreedBudget?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Milestone Selection (Optional) */}
          {milestones.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="milestoneId" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Milestone (optional)
              </label>
              <select
                id="milestoneId"
                name="milestoneId"
                value={formData.milestoneId}
                onChange={handleInputChange}
                className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
              >
                <option value="">Not related to a specific milestone</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title} - NPR {milestone.amount?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div className="space-y-1">
            <label htmlFor="category" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Dispute category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            >
              <option value="">Select dispute category...</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="title" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Dispute title *
            </label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief summary of the issue"
              required
              maxLength={255}
              className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] font-sans-ledger outline-none focus:border-[var(--ink)]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Detailed description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a detailed explanation of the issue, relevant dates, and communication history..."
              required
              rows={6}
              className="w-full bg-[var(--paper)] border border-[var(--line)] p-3 text-[13px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none focus:border-[var(--ink)]"
            />
          </div>

          {/* Amount Disputed with Static NPR Prefix */}
          <div className="space-y-1">
            <label htmlFor="amountDisputed" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Disputed amount (NPR - optional)
            </label>
            <div className="flex items-center border border-[var(--line)] bg-[var(--paper)] focus-within:border-[var(--ink)]">
              <span className="px-3 py-2 bg-[var(--paper-2)] border-r border-[var(--line)] text-[var(--muted)] font-bold">NPR</span>
              <input
                id="amountDisputed"
                name="amountDisputed"
                type="number"
                step="0.01"
                min="0"
                value={formData.amountDisputed}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full bg-transparent p-2 text-[13px] font-bold text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label htmlFor="priority" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Priority level *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              required
              className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Evidence files (optional)
            </label>
            <FileUpload
              category="dispute_evidence"
              maxSize={50}
              multiple={true}
              onUploadSuccess={(files) => setEvidenceFiles(files)}
            />
          </div>

          {/* Buttons */}
          <div className="pt-6 border-t border-[var(--ink)] flex flex-col sm:flex-row items-center justify-end gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => router.push("/disputes")}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold hover:bg-[var(--paper-2)] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || contracts.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
            >
              {loading ? "Filing..." : "File dispute →"}
            </button>
          </div>

        </form>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Dispute Form Archetype G</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function FileDisputePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING DISPUTE FORM...
      </div>
    }>
      <FileDisputeContent />
    </Suspense>
  );
}
