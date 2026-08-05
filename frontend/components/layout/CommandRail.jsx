'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Home, 
  Search, 
  Briefcase, 
  FileText, 
  User, 
  LogOut, 
  X,
  ArrowRight
} from 'lucide-react';

export default function CommandRail({ userType = 'freelancer' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isFreelancer = userType === 'freelancer';

  return (
    <>
      {/* DESKTOP EDITORIAL LINE RAIL (Bounded purely by left & right vertical lines) */}
      <aside className="hidden lg:flex flex-col justify-between fixed left-6 top-24 bottom-12 w-10 border-l-2 border-r-2 border-[var(--ink)] bg-transparent z-40 py-4 items-center font-mono-ledger">
        
        {/* Top Instruments */}
        <div className="flex flex-col items-center space-y-4">
          
          {/* Global Create Action '+' */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-7 h-7 bg-[var(--signal)] text-[var(--paper)] font-bold flex items-center justify-center hover:bg-[var(--signal-dark)] transition-colors shadow-xs"
            title="Create / New Record"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="w-4 h-[1px] bg-[var(--ink)]" />

          {/* ⌂ Workspace */}
          <Link
            href={isFreelancer ? '/freelancer' : '/dashboard'}
            className={`w-7 h-7 flex items-center justify-center transition-all ${
              pathname === '/freelancer' || pathname === '/dashboard'
                ? 'bg-[var(--signal)] text-[var(--paper)] font-bold'
                : 'text-[var(--ink)] hover:text-[var(--signal)] hover:bg-[var(--paper-2)]'
            }`}
            title="Workspace"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>

          {/* ⌕ Search / Work */}
          <Link
            href={isFreelancer ? '/projects' : '/client/talent'}
            className={`w-7 h-7 flex items-center justify-center transition-all ${
              pathname === '/projects' || pathname === '/client/talent'
                ? 'bg-[var(--signal)] text-[var(--paper)] font-bold'
                : 'text-[var(--ink)] hover:text-[var(--signal)] hover:bg-[var(--paper-2)]'
            }`}
            title={isFreelancer ? 'Find Work' : 'Find Talent'}
          >
            <Search className="h-3.5 w-3.5" />
          </Link>

          {/* ▤ Proposals / Projects */}
          <Link
            href={isFreelancer ? '/freelancer/proposals' : '/client/projects'}
            className={`w-7 h-7 flex items-center justify-center transition-all ${
              pathname.includes('/proposals') || pathname.includes('/client/projects')
                ? 'bg-[var(--signal)] text-[var(--paper)] font-bold'
                : 'text-[var(--ink)] hover:text-[var(--signal)] hover:bg-[var(--paper-2)]'
            }`}
            title={isFreelancer ? 'Proposals' : 'Projects'}
          >
            <FileText className="h-3.5 w-3.5" />
          </Link>

          {/* ▣ Contracts & Escrow */}
          <Link
            href="/contracts"
            className={`w-7 h-7 flex items-center justify-center transition-all ${
              pathname.includes('/contracts')
                ? 'bg-[var(--signal)] text-[var(--paper)] font-bold'
                : 'text-[var(--ink)] hover:text-[var(--signal)] hover:bg-[var(--paper-2)]'
            }`}
            title="Contracts"
          >
            <Briefcase className="h-3.5 w-3.5" />
          </Link>

        </div>

        {/* Bottom Instruments */}
        <div className="flex flex-col items-center space-y-3">
          {/* ◎ Profile */}
          <Link
            href="/profile"
            className={`w-7 h-7 flex items-center justify-center transition-all ${
              pathname === '/profile'
                ? 'bg-[var(--signal)] text-[var(--paper)] font-bold'
                : 'text-[var(--ink)] hover:text-[var(--signal)] hover:bg-[var(--paper-2)]'
            }`}
            title="Profile"
          >
            <User className="h-3.5 w-3.5" />
          </Link>

          {/* ↪ Logout */}
          <button
            onClick={handleLogout}
            className="w-7 h-7 text-[var(--signal)] hover:bg-red-50 transition-colors flex items-center justify-center"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>


      {/* MOBILE BOTTOM TOOL RAIL */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--paper)] border-t-2 border-[var(--ink)] z-50 px-4 py-2 flex items-center justify-around font-mono-ledger text-[11px]">
        <Link 
          href={isFreelancer ? '/freelancer' : '/dashboard'} 
          className={`flex flex-col items-center space-y-0.5 ${pathname === '/freelancer' || pathname === '/dashboard' ? 'text-[var(--signal)] font-bold' : 'text-[var(--ink)]'}`}
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>

        <Link 
          href={isFreelancer ? '/projects' : '/client/talent'} 
          className={`flex flex-col items-center space-y-0.5 ${pathname === '/projects' || pathname === '/client/talent' ? 'text-[var(--signal)] font-bold' : 'text-[var(--ink)]'}`}
        >
          <Search className="h-4 w-4" />
          <span>{isFreelancer ? 'Work' : 'Talent'}</span>
        </Link>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 bg-[var(--signal)] text-[var(--paper)] rounded-full flex items-center justify-center font-bold shadow-md -mt-5"
        >
          <Plus className="h-5 w-5" />
        </button>

        <Link 
          href="/contracts" 
          className={`flex flex-col items-center space-y-0.5 ${pathname.includes('/contracts') ? 'text-[var(--signal)] font-bold' : 'text-[var(--ink)]'}`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Escrow</span>
        </Link>

        <Link 
          href="/profile" 
          className={`flex flex-col items-center space-y-0.5 ${pathname === '/profile' ? 'text-[var(--signal)] font-bold' : 'text-[var(--ink)]'}`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </div>


      {/* GLOBAL CREATE ACTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[var(--ink)]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--paper)] border-2 border-[var(--ink)] max-w-md w-full p-6 space-y-6 shadow-xl text-left font-sans-ledger">
            
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 font-mono-ledger text-[11px] uppercase tracking-wider">
              <span className="text-[var(--ink)] font-bold">COMMAND CENTER / CREATE RECORD</span>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="font-serif-ledger text-[24px] font-normal text-[var(--ink)]">
              What action would you like to take?
            </h3>

            <div className="space-y-3 font-mono-ledger text-[12px]">
              {isFreelancer ? (
                <>
                  <Link
                    href="/projects"
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center justify-between p-3.5 border border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-all font-bold"
                  >
                    <span>01. BROWSE OPEN PROJECTS & SUBMIT PROPOSAL</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center justify-between p-3.5 border border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-all font-bold"
                  >
                    <span>02. UPDATE SKILLS & PORTFOLIO SPECIMEN</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/client/post-project"
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center justify-between p-3.5 border border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-all font-bold"
                  >
                    <span>01. POST A NEW PROJECT BRIEF</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/client/talent"
                    onClick={() => setShowCreateModal(false)}
                    className="flex items-center justify-between p-3.5 border border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--signal)] hover:text-[var(--paper)] transition-all font-bold"
                  >
                    <span>02. SEARCH & INVITE INDEPENDENT TALENT</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowCreateModal(false)}
                className="font-mono-ledger text-[11px] text-[var(--muted)] hover:text-[var(--ink)] underline"
              >
                Close command window
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
