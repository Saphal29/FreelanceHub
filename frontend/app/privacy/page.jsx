"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Eye, Database, Server } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">

      {/* Public header — no auth required */}
      <header className="border-b border-[var(--ink)] px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif-ledger text-[18px] font-medium text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
          FreelanceHub
        </Link>
        <Link href="/" className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] transition-colors flex items-center space-x-1">
          <ArrowLeft className="h-3 w-3" />
          <span>Return home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-right">
            <span className="text-[var(--signal)] font-bold">[PRIVACY ACT 2075 COMPLIANT]</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[54px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Privacy & Data Protection Policy.
            </h1>
            <p className="text-[15px] text-[var(--muted)] max-w-2xl">
              Transparent disclosure of how FreelanceHub collects, processes, encrypts, and safeguards user identity data, PAN records, and financial transaction logs.
            </p>
          </div>

          <div className="font-mono-ledger text-[11px] text-[var(--muted)] pt-2 flex flex-wrap gap-4">
            <span>LAST REVISED: MARCH 2026</span>
            <span>·</span>
            <span>NEPAL INDIVIDUAL PRIVACY ACT 2075</span>
            <span>·</span>
            <span>GDPR PROTOCOL</span>
          </div>
        </section>

        {/* CONTENT SECTIONS */}
        <div className="space-y-10 text-[14px] leading-relaxed">
          
          {/* SECTION 1 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Database className="h-4 w-4 text-[var(--signal)]" />
              <span>01 / INFORMATION WE COLLECT</span>
            </div>
            <p>
              To maintain an authentic marketplace ledger and satisfy statutory compliance under Nepal tax regulations, FreelanceHub collects:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono-ledger text-[12px] text-[var(--ink)]">
              <li><strong>Account Register Data:</strong> Full legal name, email address, password hashes (bcrypt salt 10), profile photograph, and contact numbers.</li>
              <li><strong>Tax & Identity Verification (KYC):</strong> Permanent Account Number (PAN), citizenship certificate numbers, or business registration certificates for verified payout processing.</li>
              <li><strong>Transaction & Contract Records:</strong> Milestone specifications, escrow deposit receipts, time-tracking logs, work submission attachments, and video teleconference logs.</li>
              <li><strong>System Access Logs:</strong> IP address, device headers, browser user-agent, and authentication session tokens.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Server className="h-4 w-4 text-[var(--signal)]" />
              <span>02 / HOW YOUR DATA IS USED</span>
            </div>
            <p>
              Your personal and professional data is processed strictly for legitimate operational purposes:
            </p>
            <ol className="list-decimal pl-5 space-y-2 font-mono-ledger text-[12px]">
              <li>Executing binding milestone contracts and managing NPR escrow disbursements.</li>
              <li>Authenticating user access via secure JWT bearer tokens.</li>
              <li>Arbitrating contract disputes and reviewing milestone submission logs.</li>
              <li>Preventing fraudulent registrations, fake profiles, and off-platform circumvention.</li>
            </ol>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Lock className="h-4 w-4 text-[var(--signal)]" />
              <span>03 / DATA SECURITY & STORAGE SPECIFICATION</span>
            </div>
            <p>
              All network transmissions are enforced over <strong>256-bit TLS/SSL encryption</strong>. Sensitive database records (passwords, payment verification credentials) are protected using cryptographic hashing and strict PostgreSQL schema isolation.
            </p>
            <div className="p-4 bg-[var(--paper-2)] border border-[var(--ink)] font-mono-ledger text-[12px] space-y-1">
              <span className="font-bold text-[var(--ink)] uppercase">DATA RETENTION DISCLOSURE:</span>
              <p className="text-[var(--muted)]">
                Contractual ledger records and financial transaction receipts are retained for 7 years to satisfy Nepal tax audit requirements, after which non-active account metadata can be permanently purged upon user request.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[12px] uppercase font-bold text-[var(--ink)] flex items-center space-x-2">
              <Eye className="h-4 w-4 text-[var(--signal)]" />
              <span>04 / YOUR PRIVACY RIGHTS</span>
            </div>
            <p>
              Under the <strong>Nepal Individual Privacy Act 2075</strong> and international privacy standards, you maintain the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-mono-ledger text-[12px]">
              <li>Inspect and download a complete archive of your platform activity logs and profile data.</li>
              <li>Request correction of inaccurate tax or identity records.</li>
              <li>Request account closure and removal of non-statutory personal data (&quot;Right to Erasure&quot;).</li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3 border-t border-[var(--ink)] pt-6 font-mono-ledger text-[12px] text-[var(--muted)]">
            <p>
              For data protection requests or privacy inquiries, contact Nantio at <strong>nantio.official@gmail.com</strong>.
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
            <Link href="/privacy" className="font-bold text-[var(--ink)] hover:text-[var(--signal)]">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund-policy" className="hover:text-[var(--ink)]">Escrow Policy</Link>
          </div>
          <span>FreelanceHub · Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
