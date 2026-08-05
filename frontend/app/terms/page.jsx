"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import { ArrowLeft, ShieldCheck, FileText, Scale, Lock, AlertTriangle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Floating Tool Rail */}
      <CommandRail userType="client" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>RETURN HOME</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">[LEGAL SPECIMEN · ETA 2063 COMPLIANT]</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[54px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Terms of Service & Platform Agreement.
            </h1>
            <p className="text-[15px] text-[var(--muted)] max-w-2xl">
              Official legal terms governing the access, contract execution, escrow financial settlements, and dispute resolution on the FreelanceHub marketplace platform.
            </p>
          </div>

          <div className="font-mono-ledger text-[11px] text-[var(--muted)] pt-2 flex flex-wrap gap-4">
            <span>EFFECTIVE DATE: MARCH 2026</span>
            <span>·</span>
            <span>JURISDICTION: KATHMANDU, NEPAL</span>
            <span>·</span>
            <span>OPERATOR: NANTIO STUDIO</span>
          </div>
        </section>

        {/* CONTENT SECTIONS */}
        <div className="space-y-10 text-[14px] leading-relaxed">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <FileText className="h-4 w-4 text-[var(--signal)]" />
              <span>01 / ACCEPTANCE OF TERMS & OPERATIONAL SCOPE</span>
            </div>
            <p>
              By registering an account, creating a project brief, submitting a proposal, or initiating an escrow contract on <strong>FreelanceHub</strong> (operated by <strong>Nantio Studio</strong>), you agree to be bound by these Terms of Service. If you do not accept these terms in full, you must immediately cease all access and use of the platform.
            </p>
            <p className="text-[var(--muted)]">
              FreelanceHub acts as a digital venue connecting independent software engineers, designers, and digital professionals (&quot;Freelancers&quot;) with individuals or business entities seeking professional services (&quot;Clients&quot;). FreelanceHub is not a employer, contractor, or employment agency.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-[var(--signal)]" />
              <span>02 / ESCROW FINANCIAL SETTLEMENTS & NPR PAYMENTS</span>
            </div>
            <p>
              All milestone contracts on FreelanceHub utilize a binding Escrow Reserve System denominated in <strong>Nepalese Rupees (NPR)</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono-ledger text-[12px] text-[var(--ink)]">
              <li><strong>Milestone Escrow Deposit:</strong> Upon contract execution, the Client deposits the full amount for the active milestone into escrow via approved Nepalese payment gateways (eSewa / Direct Ledger).</li>
              <li><strong>Fund Protection:</strong> Escrowed funds remain locked in reserve until the Client verifies deliverable submission or a dispute resolution ruling is rendered.</li>
              <li><strong>Release of Payment:</strong> Upon Client approval of a milestone deliverable, escrowed funds are released to the Freelancer&apos;s verified wallet balance.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-[var(--signal)]" />
              <span>03 / CIRCUMVENTION BAN & OFF-PLATFORM TRANSACTIONS</span>
            </div>
            <div className="p-4 bg-[var(--paper-2)] border-2 border-[var(--signal)] space-y-2">
              <p className="font-mono-ledger text-[12px] font-bold text-[var(--signal-dark)] uppercase">
                STRICT OFF-PLATFORM TRANSACTION PROHIBITION:
              </p>
              <p className="text-[13px]">
                Users are strictly prohibited from soliciting, offering, or accepting payments outside the FreelanceHub platform for relationships established on FreelanceHub. Any attempt to bypass platform escrow or communicate alternative external payment arrangements will result in immediate and permanent account termination, forfeiture of reputation badges, and potential legal recovery of lost fees under the <strong>Nepal Electronic Transaction Act 2063 (ETA)</strong>.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Scale className="h-4 w-4 text-[var(--signal)]" />
              <span>04 / DISPUTE RESOLUTION & ARBITRATION</span>
            </div>
            <p>
              In the event of a disagreement regarding deliverable completeness or quality:
            </p>
            <ol className="list-decimal pl-5 space-y-2 font-mono-ledger text-[12px]">
              <li>Either party may open a formal Dispute Record via the Dispute Mediation Register (`/disputes`).</li>
              <li>Nantio Arbitration Officers will review submitted milestone work logs, time tracking proofs, and chat records.</li>
              <li>Arbitration decisions rendered by FreelanceHub are final and binding for the distribution of held escrow funds.</li>
            </ol>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Lock className="h-4 w-4 text-[var(--signal)]" />
              <span>05 / INTELLECTUAL PROPERTY & CONTRACT DELIVERABLES</span>
            </div>
            <p>
              Upon full payment release from escrow to the Freelancer, all Intellectual Property (IP) rights, ownership, and copyright for custom code, graphic design, or documentation produced under the contract automatically transfer completely to the Client, free of encumbrances, unless explicitly specified otherwise in writing prior to contract signing.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3 border-t border-[var(--ink)] pt-6 font-mono-ledger text-[12px] text-[var(--muted)]">
            <p>
              For legal inquiries, copyright notices, or official regulatory communications, contact Nantio Legal Affairs at <strong>legal@nantio.it.com</strong> or visit <strong>www.nantio.it.com</strong>.
            </p>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex space-x-4">
            <Link href="/terms" className="font-bold text-[var(--ink)] hover:text-[var(--signal)]">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund-policy" className="hover:text-[var(--ink)]">Escrow Policy</Link>
          </div>
          <span>FreelanceHub · Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
