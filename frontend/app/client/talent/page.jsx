"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import InviteModal from "@/components/invites/InviteModal";
import EmptyState from "@/components/common/EmptyState";
import { searchFreelancers } from "@/lib/api";
import { 
  Search, 
  Star, 
  MapPin,
  Clock,
  Shield,
  Filter,
  Briefcase,
  Award,
  AlertCircle,
  User,
  Send
} from "lucide-react";

export default function FindTalentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  
  const [filters, setFilters] = useState({
    minRate: "",
    maxRate: "",
    location: "",
    availability: "",
  });

  const rolePills = ["ALL", "SOFTWARE ENGINEERS", "MOBILE APPS", "UI/UX DESIGN", "BACKEND & DATA", "AI & COMPUTING"];

  // Load freelancers on mount
  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async (searchFilters = {}) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await searchFreelancers(searchFilters);
      
      if (response.success) {
        setFreelancers(response.freelancers || []);
      } else {
        setError("Failed to load independent talent index.");
      }
    } catch (err) {
      console.error("Error loading freelancers:", err);
      setError(err.message || "Network error loading talent directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const searchFilters = {};
    if (searchQuery.trim()) searchFilters.search = searchQuery.trim();
    if (filters.minRate) searchFilters.minRate = parseFloat(filters.minRate);
    if (filters.maxRate) searchFilters.maxRate = parseFloat(filters.maxRate);
    if (filters.location) searchFilters.location = filters.location;
    if (filters.availability) searchFilters.availability = filters.availability;
    
    loadFreelancers(searchFilters);
  };

  const clearSearchFilters = () => {
    setFilters({ minRate: "", maxRate: "", location: "", availability: "" });
    setSearchQuery("");
    setSelectedRoleFilter("ALL");
    loadFreelancers();
  };

  const handleInviteClick = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowInviteModal(true);
  };

  // Client-side filtering by role pill
  const filteredFreelancers = freelancers.filter((freelancer) => {
    if (selectedRoleFilter === "ALL") return true;
    const roleTag = selectedRoleFilter.split(' ')[0].toLowerCase();
    const titleMatch = freelancer.title?.toLowerCase().includes(roleTag);
    const bioMatch = freelancer.bio?.toLowerCase().includes(roleTag);
    const skillsMatch = Array.isArray(freelancer.skills) 
      ? freelancer.skills.some(s => s.toLowerCase().includes(roleTag))
      : typeof freelancer.skills === 'string' && freelancer.skills.toLowerCase().includes(roleTag);
    return titleMatch || bioMatch || skillsMatch;
  });

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Floating Tool Rail */}
      <CommandRail userType="client" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 text-left border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB TALENT DIRECTORY · VERIFIED PROFESSIONALS</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Find Independent Talent.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Discover verified independent software engineers, designers, and digital specialists across Nepal ready to execute your project briefs.
              </p>
            </div>

            <Link 
              href="/client/post-project" 
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0 shadow-xs"
            >
              <span>POST A PROJECT BRIEF →</span>
            </Link>
          </div>
        </section>


        {/* SEARCH & ROLE FILTER BAR */}
        <section className="space-y-4 text-left font-mono-ledger text-[12px]">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search independent talent by skills, title, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] py-3 pl-11 pr-4 text-[13px] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--signal)]"
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--ink)] text-[var(--paper)] font-bold px-6 py-3 hover:bg-[var(--signal)] transition-colors uppercase"
            >
              SEARCH
            </button>
          </form>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[var(--ink)] pb-4">
            <span className="text-[var(--muted)] text-[10px] uppercase font-bold mr-2">DISCIPLINE:</span>
            {rolePills.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1 text-[11px] border transition-colors ${
                  selectedRoleFilter === role
                    ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                    : "bg-[var(--paper-2)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </section>


        {/* ERROR BANNER */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={clearSearchFilters}
              className="px-3 py-1 bg-[var(--signal)] text-[var(--paper)] font-sans-ledger font-medium text-[12px] hover:bg-[var(--signal-dark)] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}


        {/* TALENT DIRECTORY SPECIMEN GRID */}
        <section className="space-y-6 text-left">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="border-2 border-[var(--line)] bg-[var(--paper-2)] h-64 animate-pulse p-6 space-y-4">
                  <div className="h-4 bg-[var(--line)] w-1/3"></div>
                  <div className="h-6 bg-[var(--line)] w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <EmptyState
              marker="TALENT DIRECTORY"
              title="No independent professionals found."
              description={searchQuery ? "No freelancers matched your filter criteria. Try resetting your search terms." : "There are currently no active freelancer profiles registered."}
              actionLabel="RESET SEARCH FILTERS"
              onActionClick={clearSearchFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filteredFreelancers.map((freelancer) => {
                const skills = Array.isArray(freelancer.skills) 
                  ? freelancer.skills 
                  : (typeof freelancer.skills === 'string' 
                    ? freelancer.skills.split(',').map(s => s.trim()) 
                    : []);

                return (
                  <div
                    key={freelancer.id}
                    className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4 text-left hover:border-[var(--signal)] transition-colors flex flex-col justify-between shadow-xs group"
                  >
                    <div className="space-y-3">
                      
                      {/* Talent Specimen Header */}
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5 font-mono-ledger text-[10px] uppercase">
                        <span className="text-[var(--signal)] font-bold flex items-center space-x-1">
                          <span>TALENT SPECIMEN / #{freelancer.id?.slice(0, 6) || '0042'}</span>
                        </span>
                        <span className="text-[var(--ink)] font-bold flex items-center space-x-1">
                          <Star className="h-3 w-3 text-[var(--signal)] fill-[var(--signal)]" />
                          <span>{freelancer.averageRating ? parseFloat(freelancer.averageRating).toFixed(1) : "5.0"}</span>
                        </span>
                      </div>

                      {/* Name & Title */}
                      <div className="flex items-start space-x-3">
                        <div className="w-11 h-11 bg-[var(--ink)] text-[var(--paper)] font-bold text-[14px] flex items-center justify-center shrink-0">
                          {freelancer.fullName?.charAt(0) || 'F'}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-serif-ledger text-[18px] font-medium leading-tight text-[var(--ink)] truncate group-hover:text-[var(--signal)] transition-colors">
                            {freelancer.fullName}
                          </h3>
                          <p className="font-mono-ledger text-[11px] text-[var(--muted)] truncate uppercase">
                            {freelancer.title || "Independent Developer"}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="font-sans-ledger text-[13px] text-[var(--muted)] line-clamp-3 leading-relaxed">
                        {freelancer.bio || "Verified independent professional specializing in software architecture and modern web systems."}
                      </p>

                      {/* Skills Specimen Pills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skills.slice(0, 4).map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="font-mono-ledger text-[9px] uppercase px-2 py-0.5 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>

                    {/* Footer & Actions */}
                    <div className="pt-4 border-t border-[var(--line)] space-y-3 font-mono-ledger text-[11px]">
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                        <span>LOCATION: {freelancer.location?.toUpperCase() || 'NEPAL'}</span>
                        <span className="font-bold text-[var(--ink)]">
                          {freelancer.hourlyRate ? `NPR ${freelancer.hourlyRate}/HR` : 'AGREED RATE'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Link
                          href={`/freelancer/profile/${freelancer.id}`}
                          className="w-full bg-[var(--paper-2)] border border-[var(--ink)] hover:bg-[var(--paper)] text-[var(--ink)] font-bold text-[10px] uppercase py-2 text-center block transition-colors"
                        >
                          PROFILE →
                        </Link>

                        <button
                          onClick={() => handleInviteClick(freelancer)}
                          className="w-full bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[10px] uppercase py-2 text-center transition-colors"
                        >
                          INVITE BRIEF →
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* INVITE MODAL */}
      {showInviteModal && selectedFreelancer && (
        <InviteModal
          freelancer={selectedFreelancer}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedFreelancer(null);
          }}
        />
      )}

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Independent Talent Directory</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
