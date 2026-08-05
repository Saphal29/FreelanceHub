"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Check } from "lucide-react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = (choice) => {
    localStorage.setItem("cookie_consent", choice);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 max-w-lg z-50 bg-[var(--paper)] border-2 border-[var(--ink)] shadow-2xl p-5 font-sans-ledger space-y-4 animate-slide-up text-left">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex items-center space-x-2 font-mono-ledger text-[12px] font-bold text-[var(--ink)] uppercase tracking-wider">
          <Cookie className="h-4 w-4 text-[var(--signal)] shrink-0" />
          <span>PRIVACY & COOKIE CONSENT</span>
        </div>
        <button
          onClick={() => handleAccept("essential")}
          className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 text-[13px] text-[var(--ink)] leading-relaxed">
        <p>
          FreelanceHub uses essential session cookies to manage secure JWT authentication, escrow financial ledger state, and platform performance in accordance with our{" "}
          <Link href="/privacy" className="font-bold underline text-[var(--signal)] hover:text-[var(--ink)]">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="font-bold underline text-[var(--signal)] hover:text-[var(--ink)]">
            Terms of Service
          </Link>.
        </p>
      </div>

      <div className="pt-1 flex flex-col sm:flex-row items-center gap-2 font-mono-ledger text-[12px]">
        <button
          onClick={() => handleAccept("essential")}
          className="w-full sm:w-auto px-4 py-2.5 border border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] hover:bg-[var(--paper)] font-bold transition-colors uppercase"
        >
          ESSENTIAL ONLY
        </button>
        <button
          onClick={() => handleAccept("all")}
          className="w-full sm:w-1/2 px-5 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors flex items-center justify-center space-x-1.5 uppercase shadow-xs"
        >
          <Check className="h-3.5 w-3.5" />
          <span>ACCEPT ALL COOKIES</span>
        </button>
      </div>
    </div>
  );
}
