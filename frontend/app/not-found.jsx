import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between items-center px-4 py-16 text-center">
      
      <div className="max-w-xl space-y-6 my-auto">
        <div className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
          <span>FREELANCEHUB SYSTEM · 404 NOT FOUND SPECIMEN</span>
        </div>

        <h1 className="font-serif-ledger text-[64px] sm:text-[90px] leading-[0.95] font-medium text-[var(--ink)] tracking-tight">
          404.
        </h1>

        <div className="border-y border-[var(--ink)] py-6 space-y-2">
          <h2 className="font-serif-ledger text-[22px] font-normal text-[var(--ink)]">
            Requested Document or Page Not Found
          </h2>
          <p className="font-mono-ledger text-[12px] text-[var(--muted)] max-w-md mx-auto">
            The brief, contract specimen, or dispatch route you requested does not exist on this ledger directory.
          </p>
        </div>

        <div className="pt-4 font-mono-ledger text-[12px] flex justify-center">
          <Link
            href="/"
            className="bg-[var(--ink)] hover:bg-[var(--signal)] text-[var(--paper)] font-bold px-8 py-3.5 uppercase transition-colors inline-flex items-center space-x-2 shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>RETURN TO MAIN DIRECTORY →</span>
          </Link>
        </div>
      </div>

      <footer className="font-mono-ledger text-[11px] text-[var(--muted)]">
        FreelanceHub · Engineered by Nantio Studio (www.nantio.it.com)
      </footer>

    </div>
  );
}
