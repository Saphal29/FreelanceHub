"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MilestoneCard from "@/components/milestones/MilestoneCard";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, getMilestones, startTimer, stopTimer, getContractTimeEntries, getUserContracts, createManualTimeEntry } from "@/lib/api";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle,
  FileText,
  MessageSquare,
  Video,
  CheckCircle,
  Clock,
  Play,
  Square,
  Timer,
  Plus,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function FreelancerProjectWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId;
  const { user, loading: authLoading } = useAuth();
  
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  
  // Time tracking state
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState([]);
  const [timerDescription, setTimerDescription] = useState("");
  const [showTimeTracking, setShowTimeTracking] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "FREELANCER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData();
    }
  }, [projectId, user]);

  // Fetch time entries when contract is loaded
  useEffect(() => {
    if (contract) {
      fetchTimeEntries();
    }
  }, [contract]);

  // Timer effect
  useEffect(() => {
    if (activeTimer) {
      console.log('Active timer data:', activeTimer);
      const startTime = new Date(activeTimer.start_time || activeTimer.startTime).getTime();
      console.log('Start time:', startTime, new Date(activeTimer.start_time || activeTimer.startTime));
      
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setElapsedTime(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimer]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [projectResponse, milestonesResponse, contractsResponse] = await Promise.all([
        getProjectById(projectId),
        getMilestones(projectId),
        getUserContracts({ project_id: projectId })
      ]);
      
      if (projectResponse.success) {
        setProject(projectResponse.project);
      } else {
        setError(projectResponse.error || "Failed to load project");
      }

      if (milestonesResponse.success) {
        setMilestones(milestonesResponse.milestones || []);
      }

      // Find active contract for this project
      if (contractsResponse.success && contractsResponse.contracts) {
        const activeContract = contractsResponse.contracts.find(
          c => (c.project_id === projectId || c.projectId === projectId) && 
               (c.status === 'active' || c.status === 'ACTIVE')
        );
        console.log('Found contracts:', contractsResponse.contracts);
        console.log('Looking for projectId:', projectId);
        console.log('Active contract:', activeContract);
        setContract(activeContract || null);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      // If no contract, can't fetch time entries
      if (!contract) {
        setTimeEntries([]);
        return;
      }

      const response = await getContractTimeEntries(contract.id);
      console.log('Time entries response:', response);
      
      if (response.success) {
        setTimeEntries(response.timeEntries || []);
        
        // Check for active timer (entry without end_time or endTime)
        const active = response.timeEntries?.find(entry => !entry.end_time && !entry.endTime);
        console.log('Active timer found:', active);
        
        if (active) {
          setActiveTimer(active);
          setTimerDescription(active.description || "");
        }
      }
    } catch (err) {
      console.error("Error fetching time entries:", err);
    }
  };

  const handleStartTimer = async () => {
    if (!contract) {
      setError("No active contract found for this project. You need an active contract to track time.");
      return;
    }

    try {
      setError("");
      console.log('Starting timer with contract:', contract.id);
      const response = await startTimer({
        contractId: contract.id,
        description: timerDescription || "Working on project"
      });
      
      console.log('Start timer response:', response);
      
      if (response.success) {
        setActiveTimer(response.timeEntry);
        await fetchTimeEntries();
      } else {
        setError(response.error || "Failed to start timer");
      }
    } catch (err) {
      console.error("Error starting timer:", err);
      setError(err.message || "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      setError("");
      console.log('Stopping timer:', activeTimer.id);
      const response = await stopTimer(activeTimer.id);
      
      console.log('Stop timer response:', response);
      
      if (response.success) {
        setActiveTimer(null);
        setTimerDescription("");
        await fetchTimeEntries();
      } else {
        setError(response.error || "Failed to stop timer");
      }
    } catch (err) {
      console.error("Error stopping timer:", err);
      setError(err.message || "Failed to stop timer");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    return formatTime(duration);
  };

  const calculateTotalHours = () => {
    const total = timeEntries.reduce((sum, entry) => {
      const endTime = entry.end_time || entry.endTime;
      if (endTime) {
        const start = new Date(entry.start_time || entry.startTime).getTime();
        const end = new Date(endTime).getTime();
        return sum + (end - start) / 1000;
      }
      return sum;
    }, 0);
    return (total / 3600).toFixed(2);
  };

  const handleManualEntrySubmit = async () => {
    if (!contract) {
      setError("No active contract found for this project.");
      return;
    }

    const { description, startDate, startTime, endDate, endTime } = manualEntry;

    if (!startDate || !startTime || !endDate || !endTime) {
      setError("Please fill in all date and time fields");
      return;
    }

    try {
      setError("");
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        setError("End time must be after start time");
        return;
      }

      const response = await createManualTimeEntry({
        contractId: contract.id,
        description: description || "Manual time entry",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (response.success) {
        setShowManualEntry(false);
        setManualEntry({
          description: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
        });
        await fetchTimeEntries();
      } else {
        setError(response.error || "Failed to create manual entry");
      }
    } catch (err) {
      console.error("Error creating manual entry:", err);
      setError(err.message || "Failed to create manual entry");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType="freelancer" />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error || "Project not found"}
            </AlertDescription>
          </Alert>
          <Link href="/freelancer/my-projects">
            <Button variant="outline" className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/freelancer/my-projects">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Projects
              </Button>
            </Link>
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  {project.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {project.category}
                  </span>
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/chat?userId=${project.client?.id}&projectId=${projectId}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Client
                  </Button>
                </Link>
                <Link href={`/video-meeting?projectId=${projectId}&userId=${project.client?.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Video className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Project Info Card */}
          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center font-display text-xl">
                <FileText className="h-5 w-5 mr-2 text-accent" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Budget</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <p className="font-semibold text-foreground">
                      {formatCurrency(project.budget?.min)} - {formatCurrency(project.budget?.max)}
                    </p>
                  </div>
                </div>
                {project.duration && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duration</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent" />
                      <p className="font-semibold text-foreground">{project.duration}</p>
                    </div>
                  </div>
                )}
                {project.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent" />
                      <p className="font-semibold text-foreground">
                        {new Date(project.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {project.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Tracking Section */}
          <Card className="border-border mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center font-display text-xl">
                  <Clock className="h-5 w-5 mr-2 text-accent" />
                  Time Tracking
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimeTracking(!showTimeTracking)}
                >
                  {showTimeTracking ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>
            
            {showTimeTracking && (
              <CardContent>
                {/* Error Display */}
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* No Contract Warning */}
                {!contract && (
                  <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You need an active contract for this project to track time. Please ensure you have an accepted proposal and signed contract.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Contract Info */}
                {contract && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Active contract found - Time tracking enabled
                    </p>
                  </div>
                )}

                {/* Active Timer */}
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${activeTimer ? 'bg-green-100' : contract ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                        <Timer className={`h-6 w-6 ${activeTimer ? 'text-green-600' : contract ? 'text-gray-400' : 'text-yellow-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {activeTimer ? "Timer Running" : contract ? "Start Tracking Time" : "Contract Required"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTimer ? "Working on this project" : contract ? "Track your work hours" : "Active contract needed"}
                        </p>
                      </div>
                    </div>
                    
                    {activeTimer && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-accent font-mono">
                          {formatTime(elapsedTime)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Started {new Date(activeTimer.start_time || activeTimer.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {!activeTimer && contract && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="What are you working on?"
                        value={timerDescription}
                        onChange={(e) => setTimerDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  )}

                  {activeTimer && activeTimer.description && (
                    <div className="mb-4 p-3 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Description:</p>
                      <p className="text-foreground">{activeTimer.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {!activeTimer ? (
                      <>
                        <Button
                          onClick={handleStartTimer}
                          disabled={!contract}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play className="h-4 w-4" />
                          {contract ? "Start Timer" : "Contract Required"}
                        </Button>
                        <Button
                          onClick={() => setShowManualEntry(!showManualEntry)}
                          disabled={!contract}
                          variant="outline"
                          className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                          Manual Entry
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleStopTimer}
                        variant="destructive"
                        className="flex-1 gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Stop Timer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Manual Entry Form */}
                {showManualEntry && contract && (
                  <div className="bg-background border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Edit className="h-5 w-5 text-accent" />
                        Add Manual Time Entry
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManualEntry(false)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="What did you work on?"
                          value={manualEntry.description}
                          onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={manualEntry.startDate}
                            onChange={(e) => setManualEntry({ ...manualEntry, startDate: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={manualEntry.startTime}
                            onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={manualEntry.endDate}
                            onChange={(e) => setManualEntry({ ...manualEntry, endDate: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={manualEntry.endTime}
                            onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleManualEntrySubmit}
                        className="w-full bg-accent hover:bg-accent/90 text-white"
                      >
                        Add Time Entry
                      </Button>
                    </div>
                  </div>
                )}

                {/* Time Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-background border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-foreground">{calculateTotalHours()}h</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Entries</p>
                    <p className="text-2xl font-bold text-foreground">{timeEntries.length}</p>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">This Week</p>
                    <p className="text-2xl font-bold text-foreground">
                      {timeEntries.filter(entry => {
                        const entryDate = new Date(entry.start_time || entry.startTime);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return entryDate >= weekAgo;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Recent Time Entries */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    Recent Time Entries
                  </h4>
                  
                  {timeEntries.length === 0 ? (
                    <div className="text-center py-8 bg-background border border-border rounded-lg">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No time entries yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start the timer to track your work
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeEntries.slice(0, 5).map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {entry.description || "No description"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(entry.start_time || entry.startTime).toLocaleDateString()} at{" "}
                              {new Date(entry.start_time || entry.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground font-mono">
                              {(entry.end_time || entry.endTime) ? formatDuration(entry.start_time || entry.startTime, entry.end_time || entry.endTime) : (
                                <span className="text-green-600">Running...</span>
                              )}
                            </div>
                            {(entry.end_time || entry.endTime) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {timeEntries.length > 5 && (
                        <Button variant="outline" className="w-full mt-2">
                          View All {timeEntries.length} Entries
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Milestones Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center font-display text-xl">
                <CheckCircle className="h-5 w-5 mr-2 text-accent" />
                Project Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                    No milestones yet
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    This project doesn't have any milestones
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      userRole="freelancer"
                      onUpdate={fetchProjectData}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
