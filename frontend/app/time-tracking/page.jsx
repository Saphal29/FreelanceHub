"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import {
  startTimer, 
  stopTimer, 
  getActiveTimer,
  createManualTimeEntry, 
  updateTimeEntry, 
  deleteTimeEntry,
  getContractTimeEntries, 
  submitTimeEntriesForApproval,
  approveTimeEntry, 
  rejectTimeEntry, 
  getContractTimeSummary,
  getUserContracts
} from "@/lib/api";
import {
  Play, 
  Square, 
  Plus, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle, 
  Trash2, 
  Edit2, 
  Send, 
  Timer,
  ArrowRight
} from "lucide-react";

const formatDuration = (minutes) => {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
};

const formatElapsed = (startTime) => {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function TimeTrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedEntries, setSelectedEntries] = useState([]);

  // Forms
  const [showStartForm, setShowStartForm] = useState(false);
  const [timerDesc, setTimerDesc] = useState("");
  const [timerRate, setTimerRate] = useState("");

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    description: "", startTime: "", endTime: "", hourlyRate: "", isBillable: true
  });

  const [editingEntry, setEditingEntry] = useState(null);

  const timerRef = useRef(null);
  const isFreelancer = user?.role === "FREELANCER";
  const isClient = user?.role === "CLIENT";

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchContracts();
  }, [user]);

  useEffect(() => {
    const contractId = searchParams.get("contractId");
    if (contractId && contracts.length > 0) {
      const found = contracts.find(c => c.id === contractId);
      if (found) setSelectedContract(found);
    }
  }, [searchParams, contracts]);

  useEffect(() => {
    if (selectedContract) {
      fetchTimeEntries();
      fetchSummary();
      if (isFreelancer) fetchActiveTimer();
    }
  }, [selectedContract, isFreelancer]);

  useEffect(() => {
    if (isFreelancer) fetchActiveTimer();
  }, [isFreelancer]);

  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setElapsed(formatElapsed(activeTimer.startTime));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed("00:00:00");
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  const fetchContracts = async () => {
    try {
      const res = await getUserContracts({ status: 'active' });
      setContracts(res.contracts || []);
      if (res.contracts?.length > 0 && !selectedContract) {
        setSelectedContract(res.contracts[0]);
      }
    } catch (err) {
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTimer = async () => {
    try {
      const res = await getActiveTimer();
      setActiveTimer(res.activeTimer);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimeEntries = async () => {
    if (!selectedContract) return;
    try {
      const res = await getContractTimeEntries(selectedContract.id);
      setTimeEntries(res.timeEntries || []);
    } catch {}
  };

  const fetchSummary = async () => {
    if (!selectedContract) return;
    try {
      const res = await getContractTimeSummary(selectedContract.id);
      setSummary(res.summary);
    } catch {}
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3500); };

  const handleStartTimer = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await startTimer({
        contractId: selectedContract.id,
        projectId: selectedContract.projectId,
        description: timerDesc,
        hourlyRate: timerRate ? parseFloat(timerRate) : null
      });
      if (res.success) {
        setActiveTimer(res.timeEntry);
        setShowStartForm(false);
        setTimerDesc("");
        setTimerRate("");
        showSuccess("Stopwatch timer initiated!");
      } else {
        setError(res.error || "Could not start timer");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      setError("");
      const res = await stopTimer(activeTimer.id);
      if (res.success) {
        setActiveTimer(null);
        fetchTimeEntries();
        fetchSummary();
        showSuccess("Timer stopped and logged into timesheet.");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await createManualTimeEntry({
        contractId: selectedContract.id,
        projectId: selectedContract.projectId,
        ...manualForm,
        hourlyRate: manualForm.hourlyRate ? parseFloat(manualForm.hourlyRate) : null
      });
      if (res.success) {
        setShowManualForm(false);
        setManualForm({ description: "", startTime: "", endTime: "", hourlyRate: "", isBillable: true });
        fetchTimeEntries();
        fetchSummary();
        showSuccess("Manual time entry added to log!");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await approveTimeEntry(id);
      if (res.success) { fetchTimeEntries(); fetchSummary(); showSuccess("Time entry approved for billing!"); }
    } catch (err) { setError(err.message); }
  };

  const userType = isClient ? "client" : "freelancer";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING TIMESHEET REGISTER...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · TIMESHEET DIRECTORY</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Time Tracking.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Log billable development hours, manage stopwatch timers, and review milestone timesheet approvals in NPR.
              </p>
            </div>
          </div>
        </section>


        {/* NOTIFICATIONS */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-600 text-green-800 font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}


        {/* CONTRACT SELECTOR & ACTIVE TIMER */}
        <div className="space-y-6 font-mono-ledger">
          
          {contracts.length > 0 ? (
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 space-y-2">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">SELECT CONTRACT ENGAGEMENT</label>
              <select
                value={selectedContract?.id || ""}
                onChange={(e) => {
                  const c = contracts.find(c => c.id === e.target.value);
                  setSelectedContract(c);
                }}
                className="w-full max-w-md bg-[var(--paper)] border border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none"
              >
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.projectTitle}</option>
                ))}
              </select>
            </div>
          ) : (
            <EmptyState
              marker="HOURLY LOG"
              title="No active contracts found."
              description="Time tracking requires an active, signed contract engagement."
              actionLabel="VIEW CONTRACT REGISTER →"
              actionHref="/contracts"
            />
          )}

          {/* ACTIVE STOPWATCH TIMER BANNER */}
          {isFreelancer && activeTimer && (
            <div className="border-2 border-[var(--signal)] bg-red-50 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--signal)] pb-2 text-[11px] uppercase font-bold text-[var(--signal-dark)]">
                <span>[LIVE STOPWATCH TIMER RUNNING]</span>
                <span>PROJECT: {activeTimer.projectTitle}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[40px] font-bold tracking-tight text-[var(--signal)] font-mono-ledger">
                    {elapsed}
                  </span>
                  <p className="text-[12px] text-[var(--ink)] font-sans-ledger">
                    {activeTimer.description || "Work in progress..."}
                  </p>
                </div>

                <button
                  onClick={handleStopTimer}
                  className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider px-6 py-3.5 transition-colors"
                >
                  STOP TIMER & LOG HOURS →
                </button>
              </div>
            </div>
          )}

          {/* START TIMER CONTROLS */}
          {isFreelancer && !activeTimer && selectedContract && (
            <div className="border border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase font-bold text-[var(--ink)]">
                Initiate new work log
              </div>

              {!showStartForm && !showManualForm ? (
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <button
                    onClick={() => setShowStartForm(true)}
                    className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold px-5 py-2.5 uppercase transition-colors flex items-center space-x-1"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Start instant stopwatch →</span>
                  </button>

                  <button
                    onClick={() => setShowManualForm(true)}
                    className="bg-[var(--paper)] border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--paper-2)] font-bold px-5 py-2.5 uppercase transition-colors"
                  >
                    Add manual time entry
                  </button>
                </div>
              ) : showStartForm ? (
                <form onSubmit={handleStartTimer} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Work description (e.g. Refactoring API Endpoint Architecture)"
                    value={timerDesc}
                    onChange={e => setTimerDesc(e.target.value)}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-[var(--signal)] text-[var(--paper)] font-bold px-5 py-2 uppercase text-[11px]">
                      Start timer now →
                    </button>
                    <button type="button" onClick={() => setShowStartForm(false)} className="px-4 py-2 border border-[var(--ink)] text-[11px] font-bold">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleManualEntry} className="space-y-3 text-[12px]">
                  <input
                    type="text"
                    placeholder="Description of work completed"
                    value={manualForm.description}
                    onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[var(--muted)] uppercase block">Start time</label>
                      <input
                        type="datetime-local"
                        value={manualForm.startTime}
                        onChange={e => setManualForm(p => ({ ...p, startTime: e.target.value }))}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] p-2 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--muted)] uppercase block">End time</label>
                      <input
                        type="datetime-local"
                        value={manualForm.endTime}
                        onChange={e => setManualForm(p => ({ ...p, endTime: e.target.value }))}
                        className="w-full bg-[var(--paper)] border border-[var(--line)] p-2 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="bg-[var(--signal)] text-[var(--paper)] font-bold px-5 py-2 uppercase text-[11px]">
                      Log manual entry →
                    </button>
                    <button type="button" onClick={() => setShowManualForm(false)} className="px-4 py-2 border border-[var(--ink)] text-[11px] font-bold">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>


        {/* SUMMARY CARDS */}
        {summary && selectedContract && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono-ledger text-left">
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5 space-y-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">TOTAL HOURS</span>
              <span className="text-[22px] font-bold text-[var(--ink)]">{summary.totalHours}h</span>
            </div>

            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-5 space-y-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">BILLABLE HOURS</span>
              <span className="text-[22px] font-bold text-[var(--signal)]">{summary.billableHours}h</span>
            </div>

            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5 space-y-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">BILLABLE (NPR)</span>
              <span className="text-[20px] font-bold text-[var(--ink)]">NPR {summary.totalBillableAmount?.toLocaleString()}</span>
            </div>

            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-5 space-y-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">APPROVED (NPR)</span>
              <span className="text-[20px] font-bold text-green-700">NPR {summary.approvedAmount?.toLocaleString()}</span>
            </div>
          </section>
        )}


        {/* TIME ENTRIES LEDGER */}
        {selectedContract && (
          <section className="space-y-4 text-left font-mono-ledger">
            <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
              <span>TIMESHEET WORK LOGS</span>
              <span className="text-[var(--signal)]">{timeEntries.length} LOGS</span>
            </div>

            {timeEntries.length === 0 ? (
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-8 text-center text-[12px] text-[var(--muted)]">
                NO TIME ENTRIES LOGGED FOR THIS CONTRACT YET.
              </div>
            ) : (
              <div className="border-2 border-[var(--ink)] bg-[var(--paper)] divide-y divide-[var(--line)] text-[12px]">
                {timeEntries.map(entry => (
                  <div key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-[var(--ink)] text-[14px]">
                        {entry.description || "Work Log Entry"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--muted)]">
                        <span>{new Date(entry.startTime).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>DURATION: {formatDuration(entry.durationMinutes)}</span>
                        {entry.isBillable && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-[var(--signal)]">NPR {entry.totalAmount?.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <span className="px-2.5 py-0.5 border border-[var(--ink)] bg-[var(--paper-2)] font-bold text-[10px] uppercase">
                        [{entry.status?.toUpperCase() || 'DRAFT'}]
                      </span>

                      {isClient && entry.status === 'submitted' && (
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="bg-green-700 text-white font-bold text-[10px] uppercase px-3 py-1.5"
                        >
                          APPROVE →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Hourly Work Log & Timesheet</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function TimeTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING TIMESHEET REGISTER...</p>
      </div>
    }>
      <TimeTrackingContent />
    </Suspense>
  );
}
