'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck, Clock, Menu, X, Github, Twitter, Globe, Instagram, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusState, setStatusState] = useState('accepted');

  // IntersectionObserver for data-reveal scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.data-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Status crossfade timer ("accepted → in progress")
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusState((prev) => (prev === 'accepted' ? 'in progress' : 'accepted'));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)]">
      
      {/* SECTION 1: NAV */}
      <header className="sticky top-0 z-50 bg-[var(--paper)]/95 backdrop-blur-sm border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex items-center justify-between">
          
          {/* Wordmark */}
          <Link href="/" className="font-serif-ledger text-[19px] font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
            FreelanceHub
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-[14px]">
            <Link 
              href="/projects" 
              className="text-[var(--ink)] hover:text-[var(--signal)] transition-colors"
            >
              Explore work
            </Link>
            <Link 
              href="/login" 
              className="text-[var(--ink)] hover:text-[var(--signal)] transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/register" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-sans-ledger font-medium text-[14px] px-4 py-2 transition-colors inline-flex items-center"
            >
              <span>Explore demo</span>
              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 inline text-[var(--paper)]" />
            </Link>
          </nav>

          {/* Mobile Nav Toggle */}
          <div className="flex md:hidden items-center space-x-3">
            <Link 
              href="/register" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-sans-ledger text-[13px] font-medium px-3 py-1.5 transition-colors inline-flex items-center"
            >
              <span>Demo</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5 text-[var(--paper)]" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-[var(--ink)] hover:text-[var(--signal)]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--line)] bg-[var(--paper-2)] px-4 py-5 space-y-3">
            <Link 
              href="/projects"
              className="block text-[15px] text-[var(--ink)] hover:text-[var(--signal)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore work
            </Link>
            <Link 
              href="/login"
              className="block text-[15px] text-[var(--ink)] hover:text-[var(--signal)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
          </div>
        )}
      </header>


      {/* SECTION 2: HERO WITH FULL-WIDTH EDITORIAL GALLERY DECK */}
      <section className="pt-10 pb-16 md:pt-16 md:pb-20">
        
        {/* Top Editorial Headline Block */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6 text-left pb-12 md:pb-16">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            PORTFOLIO SHOWCASE · MARKETPLACE ARCHITECTURE FOR NEPAL
          </p>

          <h1 className="font-serif-ledger text-[40px] sm:text-[64px] lg:text-[88px] leading-[0.98] font-medium tracking-tight text-[var(--ink)] max-w-4xl">
            Nepal’s open freelance ledger.
          </h1>

          <p className="text-[16px] sm:text-[18px] leading-relaxed text-[var(--muted)] max-w-2xl">
            A software studio case study by Nantio. Engineered with direct contracts, transparent escrow in Nepalese Rupees, and zero hidden platform overhead.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-6">
            <Link 
              href="/register" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-sans-ledger font-medium text-[15px] px-5 py-3 transition-colors inline-flex items-center shadow-sm"
            >
              <span>Explore demo application</span>
              <ArrowRight className="ml-2 h-4 w-4 text-[var(--paper)]" />
            </Link>

            <Link 
              href="/projects" 
              className="ledger-link inline-flex items-center text-[15px] font-medium"
            >
              <span>View platform architecture</span>
              <ArrowRight className="ml-2 h-4 w-4 text-[var(--signal)]" />
            </Link>
          </div>
        </div>

        {/* Full-Width Studio Case-Study Specimen Gallery Deck */}
        <div className="w-full border-t border-b border-[var(--line)] bg-[var(--paper-2)] py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-4">
            
            {/* Gallery Section Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] border-b border-[var(--line)] pb-3">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
                <span>STUDIO CASE-STUDY SPECIMEN GALLERY</span>
              </span>
              <span>3 VERIFIED PORTFOLIO ARTIFACTS</span>
            </div>

            {/* 3-Card Spacious Full-Width Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-2">
              
              {/* CARD 1: Brand Collateral & Client Acquisition (4 cols) */}
              <div className="lg:col-span-4 bg-[var(--paper)] border-2 border-[var(--ink)] shadow-sm hover:shadow-xl hover:border-[var(--signal)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden group/card1">
                <div className="border-b border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] flex items-center justify-between font-mono-ledger text-[11px] text-[var(--ink)] font-semibold">
                  <span>01 / BRAND COLLATERAL</span>
                  <span className="text-[var(--muted)]">NANTIO STUDIO</span>
                </div>
                <div className="p-3 bg-[var(--paper)] flex items-center justify-center flex-1">
                  <img 
                    src="/brand-identity.svg" 
                    alt="Brand Identity & Hero Illustration - Find Your Perfect Client" 
                    className="w-full h-auto object-contain block"
                  />
                </div>
                <div className="border-t border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] font-mono-ledger text-[10px] text-[var(--muted)] truncate">
                  SPECIMEN: Hero Illustration & Client Acquisition ("Find Your Perfect Client")
                </div>
              </div>

              {/* CARD 2: Responsive Mobile Viewports (Primary Feature - 4 cols) */}
              <div className="lg:col-span-4 bg-[var(--paper)] border-2 border-[var(--ink)] border-t-4 border-t-[var(--signal)] shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden relative group/card2">
                
                {/* Red Approval Stamp Pinned Top Right */}
                <div className="absolute right-3 top-10 z-10 rotate-3">
                  <div className="bg-[var(--signal)] text-[var(--paper)] font-mono-ledger text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 border border-[var(--ink)] shadow-sm">
                    DEMO SPECIMEN
                  </div>
                </div>

                <div className="border-b border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] flex items-center justify-between font-mono-ledger text-[11px] text-[var(--ink)] font-bold">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse inline-block"></span>
                    <span>02 / RESPONSIVE VIEWPORTS</span>
                  </span>
                  <span className="text-[var(--signal)]">PRIMARY FEATURE</span>
                </div>

                <div className="p-3 bg-[var(--paper)] flex items-center justify-center flex-1">
                  <img 
                    src="/mobile-app-ui.svg" 
                    alt="Cross-Device App Interfaces - Works well on all devices" 
                    className="w-full h-auto object-contain block"
                  />
                </div>

                <div className="border-t border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] font-mono-ledger text-[10px] text-[var(--signal)] font-medium truncate">
                  SPECIMEN: Cross-Device App Viewports ("Works well on all devices")
                </div>
              </div>

              {/* CARD 3: User Journey & Workflow (4 cols) */}
              <div className="lg:col-span-4 md:col-span-2 lg:col-span-4 bg-[var(--paper)] border-2 border-[var(--ink)] shadow-sm hover:shadow-xl hover:border-[var(--signal)] transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden group/card3">
                <div className="border-b border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] flex items-center justify-between font-mono-ledger text-[11px] text-[var(--ink)] font-semibold">
                  <span>03 / USER JOURNEY ("EASY TO USE")</span>
                  <span className="text-[var(--muted)]">CANVA ARTWORK</span>
                </div>
                <div className="p-3 bg-[var(--paper)] flex items-center justify-center flex-1">
                  <img 
                    src="/editorial-print.svg" 
                    alt="Platform User Journey - Easy to Use" 
                    className="w-full h-auto object-contain block"
                  />
                </div>
                <div className="border-t border-[var(--line)] px-3.5 py-2 bg-[var(--paper-2)] font-mono-ledger text-[10px] text-[var(--muted)] truncate">
                  SPECIMEN: 4-Step Workflow (Find Clients · Get Paid · Find Freelancers · Get Work Done)
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>


      {/* SECTION 3: LIVE LEDGER RECORD */}
      <section className="border-t border-b border-[var(--line)] bg-[var(--paper)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Ledger Format Specimen
            </span>
            <span className="font-mono-ledger text-[11px] text-[var(--signal)] flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] inline-block mr-1.5 animate-pulse"></span>
              REAL-TIME TRANSACTION SPEC
            </span>
          </div>

          {/* Ledger Table - Horizontally scrollable on mobile */}
          <div className="ledger-scroll w-full">
            <div className="min-w-[680px] font-mono-ledger text-[13px] py-2 grid grid-cols-12 gap-4 items-center border-t border-b border-[var(--line)]/60 text-[var(--ink)]">
              
              <div className="col-span-4 truncate">
                <span className="text-[var(--muted)]">Project: </span>
                <span className="font-medium">NPR-8902 · FinTech API Redesign</span>
              </div>

              <div className="col-span-4 flex items-center space-x-2 truncate">
                <span className="text-[var(--muted)]">Party: </span>
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center text-[9px] font-bold text-[var(--signal)]">
                    AM
                  </div>
                  <span className="font-medium">Aayush M.</span>
                  <span className="text-[var(--muted)]">→</span>
                  <div className="w-5 h-5 rounded-full bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center text-[9px] font-bold text-[var(--ink)]">
                    SS
                  </div>
                  <span className="font-medium">Sunita S.</span>
                </div>
              </div>

              <div className="col-span-2 truncate">
                <span className="text-[var(--muted)]">Amount: </span>
                <span className="font-medium text-[var(--signal)]">NPR 185,000</span>
              </div>

              <div className="col-span-2 text-right font-medium text-[var(--signal)]">
                [ESCROW ACTIVE]
              </div>

            </div>
          </div>
        </div>
      </section>


      {/* SECTION 4: INVERTED MARQUEE (SIGNATURE KINETIC BEAT) */}
      <section className="bg-[var(--ink)] text-[var(--paper)] py-4 overflow-hidden border-t border-b border-[var(--line-inverted)]">
        <div className="animate-marquee font-mono-ledger text-[13px] sm:text-[14px] whitespace-nowrap">
          
          {/* Marquee Content Set 1 */}
          <div className="flex items-center space-x-8 pr-8">
            <span>MARKETPLACE ARCHITECTURE</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">TRANSPARENT ESCROW RESERVE</span>
            <span className="text-[var(--signal)]">•</span>
            <span>DIRECT LOCAL PAYMENTS (eSewa / Khalti / Bank)</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">BINDING MILESTONE CONTRACTS</span>
            <span className="text-[var(--signal)]">•</span>
            <span>BUILT BY NANTIO STUDIO</span>
            <span className="text-[var(--signal)]">•</span>
            <span>TAILORED FOR NEPAL</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">ZERO HIDDEN OVERHEAD</span>
            <span className="text-[var(--signal)]">•</span>
          </div>

          {/* Marquee Content Set 2 (Seamless loop copy) */}
          <div className="flex items-center space-x-8 pr-8">
            <span>MARKETPLACE ARCHITECTURE</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">TRANSPARENT ESCROW RESERVE</span>
            <span className="text-[var(--signal)]">•</span>
            <span>DIRECT LOCAL PAYMENTS (eSewa / Khalti / Bank)</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">BINDING MILESTONE CONTRACTS</span>
            <span className="text-[var(--signal)]">•</span>
            <span>BUILT BY NANTIO STUDIO</span>
            <span className="text-[var(--signal)]">•</span>
            <span>TAILORED FOR NEPAL</span>
            <span className="text-[var(--signal)]">•</span>
            <span className="text-[var(--signal)] font-bold">ZERO HIDDEN OVERHEAD</span>
            <span className="text-[var(--signal)]">•</span>
          </div>

        </div>
      </section>


      {/* SECTION 5: TRANSACTION SEQUENCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 md:py-16 space-y-10">
        <div className="space-y-2 text-left">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            Ledger Sequence
          </p>
          <h2 className="font-serif-ledger text-[24px] sm:text-[28px] font-normal text-[var(--ink)]">
            How every engagement is recorded.
          </h2>
        </div>

        <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
          
          {/* Row 1: Posted */}
          <div className="data-reveal py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
              <span className="font-mono-ledger text-[11px] tracking-[0.06em] text-[var(--muted)] block">
                01 / STAGE
              </span>
              <h3 className="font-mono-ledger text-[16px] font-medium text-[var(--ink)]">
                Posted
              </h3>
            </div>
            <div className="md:col-span-8 flex items-start space-x-4">
              {/* Avatar thumbnail - 40x40 fixed */}
              <div className="w-10 h-10 shrink-0 bg-[var(--paper-2)] border border-[var(--line)] rounded-full flex items-center justify-center font-mono-ledger text-[12px] text-[var(--ink)] overflow-hidden">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" fill="#EFE9D8"/>
                  <circle cx="20" cy="15" r="7" fill="#6E6A5D"/>
                  <path d="M7 36C7 28.8203 12.8203 23 20 23C27.1797 23 33 28.8203 33 36" stroke="#6E6A5D" strokeWidth="3"/>
                </svg>
              </div>
              <div className="space-y-1 text-left">
                <p className="font-mono-ledger text-[12px] text-[var(--signal)]">
                  Sunita Shrestha (Client) · Kathmandu Tech Lead
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">
                  The client publishes project deliverables, timeline, and scope in Nepalese Rupees. The entry is timestamped on the ledger open for proposals.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Proposed */}
          <div className="data-reveal py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
              <span className="font-mono-ledger text-[11px] tracking-[0.06em] text-[var(--muted)] block">
                02 / STAGE
              </span>
              <h3 className="font-mono-ledger text-[16px] font-medium text-[var(--ink)]">
                Proposed
              </h3>
            </div>
            <div className="md:col-span-8 flex items-start space-x-4">
              {/* Avatar thumbnail - 40x40 fixed */}
              <div className="w-10 h-10 shrink-0 bg-[var(--paper-2)] border border-[var(--line)] rounded-full flex items-center justify-center font-mono-ledger text-[12px] text-[var(--signal)] overflow-hidden">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" fill="#EFE9D8"/>
                  <circle cx="20" cy="15" r="7" fill="#E8371A"/>
                  <path d="M7 36C7 28.8203 12.8203 23 20 23C27.1797 23 33 28.8203 33 36" stroke="#E8371A" strokeWidth="3"/>
                </svg>
              </div>
              <div className="space-y-1 text-left">
                <p className="font-mono-ledger text-[12px] text-[var(--signal)]">
                  Aayush Maharjan (Freelancer) · Senior Mobile Engineer
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">
                  Talent submits a structured proposal with milestone breakdowns. No bidding races to the bottom—just direct scope estimates and verified proof.
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: In progress (with interactive status crossfade) */}
          <div className="data-reveal py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-2">
              <span className="font-mono-ledger text-[11px] tracking-[0.06em] text-[var(--muted)] block">
                03 / STAGE
              </span>
              <h3 className="font-mono-ledger text-[16px] font-medium text-[var(--ink)]">
                In progress
              </h3>
              {/* Status Badge Crossfade element */}
              <div className="pt-1">
                <span className="inline-flex items-center font-mono-ledger text-[11px] px-2.5 py-1 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--signal)]">
                  status:
                  <span className="ml-1.5 font-bold status-crossfade">
                    {statusState}
                  </span>
                </span>
              </div>
            </div>
            <div className="md:col-span-8 flex items-start space-x-4">
              <div className="w-10 h-10 shrink-0 bg-[var(--paper-2)] border border-[var(--line)] rounded-full flex items-center justify-center font-mono-ledger text-[12px] text-[var(--ink)] overflow-hidden">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" fill="#EFE9D8"/>
                  <circle cx="20" cy="15" r="7" fill="#0A0A08"/>
                  <path d="M7 36C7 28.8203 12.8203 23 20 23C27.1797 23 33 28.8203 33 36" stroke="#0A0A08" strokeWidth="3"/>
                </svg>
              </div>
              <div className="space-y-1 text-left">
                <p className="font-mono-ledger text-[12px] text-[var(--signal)]">
                  Escrow Reserve Locked · Milestone 1 Active
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">
                  Upon agreement, milestone funds enter secure escrow reserve. The freelancer builds knowing payment is guaranteed, while the client retains approval control.
                </p>
              </div>
            </div>
          </div>

          {/* Row 4: Paid */}
          <div className="data-reveal py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 space-y-1">
              <span className="font-mono-ledger text-[11px] tracking-[0.06em] text-[var(--muted)] block">
                04 / STAGE
              </span>
              <h3 className="font-mono-ledger text-[16px] font-medium text-[var(--ink)]">
                Paid
              </h3>
            </div>
            <div className="md:col-span-8 flex items-start space-x-4">
              <div className="w-10 h-10 shrink-0 bg-[var(--paper-2)] border border-[var(--line)] rounded-full flex items-center justify-center font-mono-ledger text-[12px] text-[var(--signal)] overflow-hidden">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" fill="#EFE9D8"/>
                  <circle cx="20" cy="15" r="7" fill="#E8371A"/>
                  <path d="M7 36C7 28.8203 12.8203 23 20 23C27.1797 23 33 28.8203 33 36" stroke="#E8371A" strokeWidth="3"/>
                </svg>
              </div>
              <div className="space-y-1 text-left">
                <p className="font-mono-ledger text-[12px] text-[var(--signal)]">
                  Direct Transfer (eSewa / Khalti / Local Bank)
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--muted)]">
                  Work is approved and funds release directly to local accounts. The entry updates permanently on the ledger with verified feedback.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 6: NEPAL ANCHOR WITH INTERACTIVE LINK OVERLAYS */}
      <section className="bg-[var(--paper-2)] border-t border-b border-[var(--line)] py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
          
          {/* Pullquote copy */}
          <div className="max-w-3xl text-left space-y-3">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Local Anchor
            </p>
            <p className="font-serif-ledger text-[20px] sm:text-[24px] leading-[1.38] text-[var(--ink)]">
              "This ledger runs on <span className="text-[var(--signal)] font-normal">rupees</span>. We built FreelanceHub specifically for Nepal’s growing ecosystem of engineers, designers, and creative directors—connecting local enterprise with verified independent talent."
            </p>
            <p className="font-mono-ledger text-[12px] text-[var(--signal)] flex items-center space-x-2">
              <span>— Nantio Product Studio, Lalitpur</span>
            </p>
          </div>

          {/* Nepal Anchor Graphic */}
          <div className="space-y-3">
            <div className="relative w-full overflow-hidden border border-[var(--line)] bg-[var(--paper)] group">
              <img 
                src="/Nepal anchor image.svg" 
                alt="A look inside our workspace - Nantio Software Studio"
                className="w-full h-auto object-cover block"
              />
            </div>

            {/* Direct Text Links below the graphic */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 font-mono-ledger text-[12px] text-[var(--muted)] border-t border-[var(--line)]/50">
              <a 
                href="https://www.instagram.com/nantio.official/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-[var(--signal)] hover:text-[var(--signal-dark)] transition-colors font-medium"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>Instagram: @nantio.official</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a 
                href="https://www.nantio.it.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-[var(--ink)] hover:text-[var(--signal)] transition-colors font-medium"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Official Website: www.nantio.it.com</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 7: MECHANICS (Escrow / Disputes / Ratings) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 md:py-16 space-y-6">
        <div className="space-y-2 text-left">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            System Rules
          </p>
          <h2 className="font-serif-ledger text-[24px] font-normal text-[var(--ink)]">
            Built-in trust mechanics.
          </h2>
        </div>

        <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)] font-mono-ledger text-[14px]">
          
          {/* Row 1 */}
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[var(--ink)]">
              <Lock className="h-4 w-4 text-[var(--ink)] shrink-0" />
              <span>01. Escrow reserve funding</span>
            </div>
            <div className="text-right text-[var(--signal)] font-medium">
              held
            </div>
          </div>

          {/* Row 2 */}
          <div className="py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[var(--ink)]">
              <ShieldCheck className="h-4 w-4 text-[var(--ink)] shrink-0" />
              <span>02. Binding contract & dispute resolution</span>
            </div>
            <div className="text-right text-[var(--signal)] font-medium">
              logged
            </div>
          </div>

          {/* Row 3 */}
          <div className="py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[var(--ink)]">
              <Clock className="h-4 w-4 text-[var(--ink)] shrink-0" />
              <span>03. Work delivery & milestone verification</span>
            </div>
            <div className="text-right text-[var(--signal)] font-medium">
              recorded
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 8: CLOSING CTA */}
      <section className="py-14 md:py-16 border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-left space-y-5">
          <h2 className="font-serif-ledger text-[32px] sm:text-[40px] font-normal text-[var(--ink)]">
            Explore the project.
          </h2>
          <div>
            <Link 
              href="/register" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-sans-ledger font-medium text-[15px] px-5 py-2.5 transition-colors inline-flex items-center"
            >
              <span>Explore demo application</span>
              <ArrowRight className="ml-2 h-4 w-4 text-[var(--paper)]" />
            </Link>
          </div>
        </div>
      </section>


      {/* SECTION 9: FOOTER */}
      <footer className="border-t border-[var(--line)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <span className="font-serif-ledger text-[17px] font-semibold text-[var(--ink)]">
              FreelanceHub
            </span>
            <span className="text-[var(--muted)] text-[13px]">·</span>
            <span className="font-mono-ledger text-[12px] text-[var(--muted)]">
              Nepal
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <a 
              href="https://www.nantio.it.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-mono-ledger text-[12px] text-[var(--muted)] hover:text-[var(--signal)] transition-colors"
            >
              A Nantio project (www.nantio.it.com)
            </a>
            <div className="flex items-center space-x-3 text-[var(--muted)]">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)] transition-colors" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/nantio.official/" target="_blank" rel="noreferrer" className="hover:text-[var(--signal)] transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.nantio.it.com" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)] transition-colors" aria-label="Website">
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
