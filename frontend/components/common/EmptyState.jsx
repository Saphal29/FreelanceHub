'use client';

import Link from 'next/link';

/**
 * Editorial Open-Document Empty State
 * 
 * Uses whitespace, typography, and rules rather than bordered cards.
 * 
 * Structure:
 * 1. Marker Tag (01 / WORK)
 * 2. Title (Fraunces Serif)
 * 3. Contextual Explanation (What is empty, why it matters, what to do)
 * 4. Direct CTA Button
 */
export default function EmptyState({
  marker = '01 / SPECIMEN',
  title = 'No active engagements yet.',
  description = 'Your workspace is waiting for its first contract. Browse open projects and submit a proposal to begin.',
  actionLabel = 'FIND YOUR FIRST PROJECT →',
  actionHref = null,
  onActionClick = null
}) {
  return (
    <div className="w-full space-y-4 text-left py-4">
      
      {/* Marker Tag */}
      <div className="font-mono-ledger text-[11px] uppercase tracking-wider text-[var(--muted)] flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
        <span className="text-[var(--ink)] font-bold">{marker}</span>
        <span className="text-[var(--line)]">•</span>
        <span className="text-[var(--signal)]">STATUS: EMPTY</span>
      </div>

      {/* Title & Explanation */}
      <div className="space-y-2 max-w-2xl">
        <h3 className="font-serif-ledger text-[24px] sm:text-[28px] font-normal leading-tight text-[var(--ink)]">
          {title}
        </h3>
        <p className="font-sans-ledger text-[14px] leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      </div>

      {/* Contextual CTA */}
      {(actionHref || onActionClick) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
            >
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shadow-xs"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
