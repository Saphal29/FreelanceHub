"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Download,
  Plus,
} from "lucide-react";

// Dummy time entries
const timeEntries = [
  {
    id: 1,
    project: "E-commerce Website Development",
    client: "TechStart Inc.",
    date: "Dec 15, 2024",
    duration: "4h 30m",
    description: "Implemented shopping cart functionality",
    hourlyRate: 50,
    amount: 225,
  },
  {
    id: 2,
    project: "Mobile App UI/UX Design",
    client: "HealthApp Co.",
    date: "Dec 15, 2024",
    duration: "3h 15m",
    description: "Created wireframes for user profile screens",
    hourlyRate: 45,
    amount: 146.25,
  },
  {
    id: 3,
    project: "E-commerce Website Development",
    client: "TechStart Inc.",
    date: "Dec 14, 2024",
    duration: "5h 00m",
    description: "Set up payment gateway integration",
    hourlyRate: 50,
    amount: 250,
  },
  {
    id: 4,
    project: "Brand Identity Package",
    client: "GreenLeaf Organic",
    date: "Dec 14, 2024",
    duration: "2h 45m",
    description: "Designed logo variations and color palette",
    hourlyRate: 40,
    amount: 110,
  },
  {
    id: 5,
    project: "Mobile App UI/UX Design",
    client: "HealthApp Co.",
    date: "Dec 13, 2024",
    duration: "4h 00m",
    description: "User research and competitor analysis",
    hourlyRate: 45,
    amount: 180,
  },
];

export default function TimeTrackingPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentProject, setCurrentProject] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");

  useEffect(() => {
    let interval;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!currentProject) {
      alert("Please select a project first");
      return;
    }
    setIsTracking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsTracking(false);
    setIsPaused(false);
    setElapsedTime(0);
    setCurrentProject("");
    setCurrentDescription("");
  };

  const totalHoursThisWeek = timeEntries.reduce((acc, entry) => {
    const [hours, minutes] = entry.duration.split("h ");
    return acc + parseInt(hours) + parseInt(minutes) / 60;
  }, 0);

  const totalEarningsThisWeek = timeEntries.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Time Tracking
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Track your work hours and manage your time efficiently
              </p>
            </div>
            <Button variant="outline" className="hidden sm:flex">
              <Download className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {totalHoursThisWeek.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    ${totalEarningsThisWeek.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rate</p>
                  <p className="font-display text-2xl font-bold text-foreground">$45/hr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Timer Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Timer */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="mb-6 font-display text-xl font-semibold text-foreground">
                Time Tracker
              </h2>

              {/* Timer Display */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center rounded-2xl bg-secondary p-8">
                  <span className="font-display text-6xl font-bold text-foreground">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>

              {/* Project Selection */}
              <div className="mb-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Project
                  </label>
                  <select
                    value={currentProject}
                    onChange={(e) => setCurrentProject(e.target.value)}
                    disabled={isTracking}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                  >
                    <option value="">Select a project...</option>
                    <option value="E-commerce Website Development">
                      E-commerce Website Development
                    </option>
                    <option value="Mobile App UI/UX Design">Mobile App UI/UX Design</option>
                    <option value="Brand Identity Package">Brand Identity Package</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Description (Optional)
                  </label>
                  <Input
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    disabled={isTracking}
                    placeholder="What are you working on?"
                    className="border-border bg-card"
                  />
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex gap-3">
                {!isTracking ? (
                  <Button
                    onClick={handleStart}
                    variant="accent"
                    size="lg"
                    className="flex-1"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePause}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleStop}
                      variant="destructive"
                      size="lg"
                      className="flex-1"
                    >
                      <Square className="mr-2 h-5 w-5" />
                      Stop & Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Recent Time Entries */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Recent Entries
                </h2>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual Entry
                </Button>
              </div>

              <div className="space-y-4">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between rounded-xl border border-border bg-secondary p-4 transition-colors hover:bg-secondary/80"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{entry.project}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {entry.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {entry.duration}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-accent">
                        ${entry.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">${entry.hourlyRate}/hr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Summary */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                <BarChart3 className="mr-2 h-5 w-5 text-accent" />
                This Week
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monday</span>
                  <span className="font-semibold text-foreground">6.5h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tuesday</span>
                  <span className="font-semibold text-foreground">7.0h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Wednesday</span>
                  <span className="font-semibold text-foreground">5.5h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Thursday</span>
                  <span className="font-semibold text-foreground">8.0h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Friday</span>
                  <span className="font-semibold text-accent">
                    {totalHoursThisWeek.toFixed(1)}h
                  </span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Total</span>
                    <span className="font-display text-xl font-bold text-accent">
                      {totalHoursThisWeek.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Breakdown */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                By Project
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-foreground">E-commerce Website</span>
                    <span className="font-semibold text-foreground">9.5h</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[50%] rounded-full bg-accent" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-foreground">Mobile App Design</span>
                    <span className="font-semibold text-foreground">7.25h</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[38%] rounded-full bg-accent" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-foreground">Brand Identity</span>
                    <span className="font-semibold text-foreground">2.75h</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[14%] rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Timesheet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
