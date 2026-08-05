'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between items-center px-4 py-16 text-center">
      
      <div className="max-w-xl space-y-6 my-auto">
        <div className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--signal)] flex items-center justify-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-[var(--signal)]" />
          <span>FREELANCEHUB SYSTEM · RUNTIME ERROR LOGGED</span>
        </div>

        <h1 className="font-serif-ledger text-[48px] sm:text-[60px] leading-[1.05] font-medium text-[var(--ink)] tracking-tight">
          System Interrupted.
        </h1>

        <div className="border-y border-[var(--ink)] py-6 space-y-2 font-mono-ledger text-[12px]">
          <p className="font-bold text-[var(--signal-dark)] uppercase">
            {error?.message || 'An unexpected client execution error occurred.'}
          </p>
          <p className="text-[var(--muted)]">
            Our engineering log has captured this runtime anomaly. You can retry state synchronization below.
          </p>
        </div>

        <div className="pt-4 font-mono-ledger text-[12px] flex items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-6 py-3.5 uppercase transition-colors inline-flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>RETRY SYNCHRONIZATION</span>
          </button>

          <Link
            href="/"
            className="bg-[var(--paper-2)] border-2 border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--paper)] font-bold px-6 py-3.5 uppercase transition-colors inline-block"
          >
            RETURN HOME →
          </Link>
        </div>
      </div>

      <footer className="font-mono-ledger text-[11px] text-[var(--muted)]">
        FreelanceHub · Engineered by Nantio Studio (www.nantio.it.com)
      </footer>

    </div>
  );
}
