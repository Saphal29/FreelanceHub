"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, ShieldCheck, RefreshCw, Banknote, AlertCircle, FileCheck } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>RETURN HOME</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">[ESCROW GUARANTEE SPECIMEN]</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[54px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Escrow & Refund Protection Policy.
            </h1>
            <p className="text-[15px] text-[var(--muted)] max-w-2xl">
              Transparent terms governing Client milestone deposits, fund reservation security, milestone cancellations, and escrow refund disbursements in NPR.
            </p>
          </div>

          <div className="font-mono-ledger text-[11px] text-[var(--muted)] pt-2 flex flex-wrap gap-4">
            <span>ESCROW CURRENCY: NPR</span>
            <span>·</span>
            <span>MEDIATION WINDOW: 7 DAYS</span>
            <span>·</span>
            <span>STATUS: ACTIVE</span>
          </div>
        </section>

        {/* CONTENT SECTIONS */}
        <div className="space-y-10 text-[14px] leading-relaxed">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Banknote className="h-4 w-4 text-[var(--signal)]" />
              <span>01 / THE ESCROW PROTECTION MECHANISM</span>
            </div>
            <p>
              FreelanceHub operates a strict <strong>Milestone-Based Escrow System</strong> designed to protect both Clients and Freelancers:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono-ledger text-[12px] text-[var(--ink)]">
              <li><strong>Pre-Funded Security:</strong> Work begins only after the Client deposits funds for the active milestone into the platform escrow reserve.</li>
              <li><strong>Conditional Holding:</strong> Deposited funds are held securely by FreelanceHub and cannot be unilaterally withdrawn by either party while milestone work is active.</li>
              <li><strong>Controlled Release:</strong> Funds are disbursed to the Freelancer only after the Client inspects and approves the submitted deliverable.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-[var(--signal)]" />
              <span>02 / REFUND ELIGIBILITY CONDITIONS</span>
            </div>
            <p>
              A Client is eligible to request a full or partial refund of escrowed milestone funds under the following conditions:
            </p>
            <ol className="list-decimal pl-5 space-y-2 font-mono-ledger text-[12px]">
              <li><strong>Unstarted Milestone:</strong> The milestone has not been started by the Freelancer, and both parties mutually agree to cancel the contract.</li>
              <li><strong>Missed Deadline & Incomplete Deliverables:</strong> The Freelancer fails to submit the agreed milestone deliverable within the specified project deadline without prior extension approval.</li>
              <li><strong>Dispute Ruling in Client Favor:</strong> The Nantio Dispute Mediation Board issues a binding resolution ruling that submitted deliverables do not satisfy contract specifications.</li>
            </ol>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)]" />
              <span>03 / NON-REFUNDABLE SCENARIOS</span>
            </div>
            <div className="p-4 bg-[var(--paper-2)] border-2 border-[var(--ink)] font-mono-ledger text-[12px] space-y-2">
              <span className="font-bold text-[var(--ink)] uppercase block">REFUNDS ARE NOT GRANTED WHEN:</span>
              <ul className="list-disc pl-5 space-y-1 text-[var(--muted)]">
                <li>The Client has already clicked <strong>[APPROVE & RELEASE FUNDS]</strong> for the milestone.</li>
                <li>The work delivered strictly matches the agreed project brief specifications, but the Client changes scope requirements post-delivery.</li>
                <li>The Client fails to participate in active dispute mediation within the mandatory 7-day response window.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-[var(--signal)]" />
              <span>04 / REFUND DISBURSEMENT TIMELINE</span>
            </div>
            <p>
              Once a refund is approved by mutual consent or arbitration ruling, funds are credited back to the Client&apos;s primary wallet balance or original payment account (eSewa / Bank Transfer) within <strong>3 to 5 business days</strong>.
            </p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3 border-t border-[var(--ink)] pt-6 font-mono-ledger text-[12px] text-[var(--muted)]">
            <p>
              To request escrow arbitration or check refund status, visit the <strong>Dispute Resolution Register (`/disputes`)</strong> or email <strong>billing@nantio.it.com</strong>.
            </p>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex space-x-4">
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund-policy" className="font-bold text-[var(--ink)] hover:text-[var(--signal)]">Escrow Policy</Link>
          </div>
          <span>FreelanceHub · Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
