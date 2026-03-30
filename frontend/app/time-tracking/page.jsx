"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import {
  startTimer, stopTimer, getActiveTimer,
  createManualTimeEntry, updateTimeEntry, deleteTimeEntry,
  getContractTimeEntries, submitTimeEntriesForApproval,
  approveTimeEntry, rejectTimeEntry, getContractTimeSummary
} from "@/lib/api";
import { getUserContracts } from "@/lib/api";
import {
  Play, Square, Plus, Clock, DollarSign, CheckCircle,
  XCircle, AlertCircle, Trash2, Edit2, Send, Timer
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

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disputed: "bg-orange-100 text-orange-700"
};

export default function TimeTrackingPage() {
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

  // Timer start form
  const [showStartForm, setShowStartForm] = useState(false);
  const [timerDesc, setTimerDesc] = useState("");
  const [timerRate, setTimerRate] = useState("");

  // Manual entry form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    description: "", startTime: "", endTime: "", hourlyRate: "", isBillable: true
  });

  // Edit form
  const [editingEntry, setEditingEntry] = useState(null);

  // Reject modal
  const [rejectingEntry, setRejectingEntry] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

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
    }
  }, [selectedContract]);

  useEffect(() => {
    if (isFreelancer) fetchActiveTimer();
  }, [isFreelancer]);

  // Tick elapsed timer
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
    } catch {}
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

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

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
        showSuccess("Timer started!");
      } else {
        setError(res.error);
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
        showSuccess("Timer stopped!");
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
        showSuccess("Time entry added!");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await updateTimeEntry(editingEntry.id, {
        description: editingEntry.description,
        hourlyRate: editingEntry.hourlyRate,
        isBillable: editingEntry.isBillable
      });
      if (res.success) {
        setEditingEntry(null);
        fetchTimeEntries();
        fetchSummary();
        showSuccess("Entry updated!");
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await deleteTimeEntry(id);
      if (res.success) {
        fetchTimeEntries();
        fetchSummary();
        showSuccess("Entry deleted!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitSelected = async () => {
    if (!selectedEntries.length) return;
    try {
      const res = await submitTimeEntriesForApproval(selectedEntries);
      if (res.success) {
        setSelectedEntries([]);
        fetchTimeEntries();
        showSuccess(`${res.timeEntries.length} entries submitted for approval!`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await approveTimeEntry(id);
      if (res.success) { fetchTimeEntries(); fetchSummary(); showSuccess("Entry approved!"); }
    } catch (err) { setError(err.message); }
  };

  const handleReject = async () => {
    if (!rejectingEntry) return;
    try {
      const res = await rejectTimeEntry(rejectingEntry, rejectReason);
      if (res.success) {
        setRejectingEntry(null);
        setRejectReason("");
        fetchTimeEntries();
        showSuccess("Entry rejected.");
      }
    } catch (err) { setError(err.message); }
  };

  const toggleSelectEntry = (id) => {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const draftEntries = timeEntries.filter(e => e.status === 'draft' && e.endTime);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={isClient ? "client" : "freelancer"} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Time Tracking</h1>
              <p className="text-muted-foreground mt-1">Track and manage billable hours</p>
            </div>
          </div>

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Contract Selector */}
          {contracts.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Select Contract</label>
              <select
                value={selectedContract?.id || ""}
                onChange={(e) => {
                  const c = contracts.find(c => c.id === e.target.value);
                  setSelectedContract(c);
                }}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-md"
              >
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.projectTitle}</option>
                ))}
              </select>
            </div>
          )}

          {contracts.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No active contracts found.</p>
              </CardContent>
            </Card>
          )}

          {selectedContract && (
            <div className="space-y-6">
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Hours", value: `${summary.totalHours}h`, icon: Clock },
                    { label: "Billable Hours", value: `${summary.billableHours}h`, icon: DollarSign },
                    { label: "Billable Amount", value: `NPR ${summary.totalBillableAmount.toLocaleString()}`, icon: DollarSign },
                    { label: "Approved", value: `NPR ${summary.approvedAmount.toLocaleString()}`, icon: CheckCircle }
                  ].map(({ label, value, icon: Icon }) => (
                    <Card key={label} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-accent" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Active Timer (freelancer only) */}
              {isFreelancer && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center font-display text-xl">
                      <Timer className="h-5 w-5 mr-2 text-accent" />
                      Timer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTimer ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-4xl font-mono font-bold text-foreground">{elapsed}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeTimer.description || "No description"} — {activeTimer.projectTitle}
                          </p>
                          {activeTimer.hourlyRate && (
                            <p className="text-xs text-muted-foreground">
                              NPR {activeTimer.hourlyRate}/hr
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleStopTimer}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="lg"
                        >
                          <Square className="h-5 w-5 mr-2" />
                          Stop
                        </Button>
                      </div>
                    ) : (
                      <>
                        {!showStartForm ? (
                          <div className="flex gap-3">
                            <Button variant="accent" onClick={() => setShowStartForm(true)}>
                              <Play className="h-4 w-4 mr-2" />
                              Start Timer
                            </Button>
                            <Button variant="outline" onClick={() => setShowManualForm(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Manual Entry
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleStartTimer} className="space-y-3">
                            <input
                              type="text"
                              placeholder="What are you working on?"
                              value={timerDesc}
                              onChange={e => setTimerDesc(e.target.value)}
                              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <input
                              type="number"
                              placeholder="Hourly rate (NPR, optional)"
                              value={timerRate}
                              onChange={e => setTimerRate(e.target.value)}
                              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <div className="flex gap-2">
                              <Button type="submit" variant="accent">
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setShowStartForm(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Manual Entry Form */}
              {showManualForm && isFreelancer && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Add Manual Entry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleManualEntry} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={manualForm.description}
                        onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                          <input
                            type="datetime-local"
                            value={manualForm.startTime}
                            onChange={e => setManualForm(p => ({ ...p, startTime: e.target.value }))}
                            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                          <input
                            type="datetime-local"
                            value={manualForm.endTime}
                            onChange={e => setManualForm(p => ({ ...p, endTime: e.target.value }))}
                            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Hourly rate (NPR)"
                          value={manualForm.hourlyRate}
                          onChange={e => setManualForm(p => ({ ...p, hourlyRate: e.target.value }))}
                          className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualForm.isBillable}
                            onChange={e => setManualForm(p => ({ ...p, isBillable: e.target.checked }))}
                            className="rounded"
                          />
                          Billable
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="accent">Add Entry</Button>
                        <Button type="button" variant="outline" onClick={() => setShowManualForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Submit for Approval */}
              {isFreelancer && draftEntries.length > 0 && (
                <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    {selectedEntries.length > 0
                      ? `${selectedEntries.length} entries selected`
                      : `${draftEntries.length} draft entries ready to submit`}
                  </p>
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={selectedEntries.length === 0}
                    onClick={handleSubmitSelected}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </div>
              )}

              {/* Time Entries List */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-accent" />
                    Time Entries
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {timeEntries.length} entries
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeEntries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No time entries yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.map(entry => (
                        <div key={entry.id} className="flex items-start gap-3 p-3 bg-muted rounded-xl">
                          {/* Checkbox for freelancer draft entries */}
                          {isFreelancer && entry.status === 'draft' && entry.endTime && (
                            <input
                              type="checkbox"
                              checked={selectedEntries.includes(entry.id)}
                              onChange={() => toggleSelectEntry(entry.id)}
                              className="mt-1 rounded"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            {editingEntry?.id === entry.id ? (
                              <form onSubmit={handleUpdateEntry} className="space-y-2">
                                <input
                                  type="text"
                                  value={editingEntry.description}
                                  onChange={e => setEditingEntry(p => ({ ...p, description: e.target.value }))}
                                  className="w-full border border-border rounded-lg px-2 py-1 text-sm bg-background"
                                />
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="number"
                                    value={editingEntry.hourlyRate || ""}
                                    onChange={e => setEditingEntry(p => ({ ...p, hourlyRate: e.target.value }))}
                                    placeholder="Rate"
                                    className="w-24 border border-border rounded-lg px-2 py-1 text-sm bg-background"
                                  />
                                  <label className="flex items-center gap-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editingEntry.isBillable}
                                      onChange={e => setEditingEntry(p => ({ ...p, isBillable: e.target.checked }))}
                                    />
                                    Billable
                                  </label>
                                  <Button type="submit" size="sm" variant="accent">Save</Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
                                </div>
                              </form>
                            ) : (
                              <>
                                <p className="font-medium text-foreground text-sm truncate">
                                  {entry.description || "No description"}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{new Date(entry.startTime).toLocaleDateString()}</span>
                                  {entry.endTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(entry.durationMinutes)}
                                    </span>
                                  )}
                                  {!entry.endTime && (
                                    <span className="text-green-600 font-medium">Running...</span>
                                  )}
                                  {entry.isBillable && entry.totalAmount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      NPR {entry.totalAmount.toLocaleString()}
                                    </span>
                                  )}
                                  {!entry.isBillable && (
                                    <span className="text-muted-foreground">Non-billable</span>
                                  )}
                                </div>
                                {entry.rejectionReason && (
                                  <p className="text-xs text-red-600 mt-1">Rejected: {entry.rejectionReason}</p>
                                )}
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[entry.status] || STATUS_STYLES.draft}`}>
                              {entry.status}
                            </span>

                            {/* Freelancer actions */}
                            {isFreelancer && ['draft', 'rejected'].includes(entry.status) && entry.endTime && (
                              <>
                                <button
                                  onClick={() => setEditingEntry(entry)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="text-muted-foreground hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Client actions */}
                            {isClient && entry.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => handleApprove(entry.id)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setRejectingEntry(entry.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {rejectingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Reject Time Entry</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                Reject
              </Button>
              <Button variant="outline" onClick={() => { setRejectingEntry(null); setRejectReason(""); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
