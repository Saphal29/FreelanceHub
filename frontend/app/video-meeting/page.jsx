"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Copy,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import api from "@/lib/api";

function VideoMeetingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [meetingLink, setMeetingLink] = useState("");
  const [meetingCodeInput, setMeetingCodeInput] = useState("");
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isFreelancer = user?.role === 'FREELANCER';
  const userType = isFreelancer ? 'freelancer' : 'client';
  const contractId = searchParams.get('contractId');

  useEffect(() => {
    if (user) fetchMeetings();
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const [scheduledRes, historyRes] = await Promise.allSettled([
        api.get('/calls/scheduled'),
        api.get('/calls/history')
      ]);

      if (scheduledRes.status === 'fulfilled' && scheduledRes.value?.data?.success) {
        setUpcomingMeetings(scheduledRes.value.data.meetings || []);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.data?.success) {
        const completed = (historyRes.value.data.calls || [])
          .filter(call => call.status === 'ended' || call.status === 'connected')
          .slice(0, 5);
        setRecentMeetings(completed);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingLink = () => {
    const randomId = crypto.randomUUID();
    let link = `${window.location.origin}/calls/join/${randomId}`;
    if (contractId) link += `?contractId=${contractId}`;
    setMeetingLink(link);
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const startMeeting = () => {
    const randomId = crypto.randomUUID();
    let url = `/calls/join/${randomId}`;
    if (contractId) url += `?contractId=${contractId}`;
    router.push(url);
  };

  const joinMeeting = () => {
    if (!meetingCodeInput.trim()) {
      alert("Please enter a valid meeting code or link.");
      return;
    }

    let meetingId = meetingCodeInput.trim();
    if (meetingCodeInput.includes('/calls/join/')) {
      const parts = meetingCodeInput.split('/calls/join/');
      meetingId = parts[parts.length - 1];
    } else if (meetingCodeInput.includes('/meet/')) {
      const parts = meetingCodeInput.split('/meet/');
      meetingId = parts[parts.length - 1];
    }

    if (meetingId.length < 5) {
      alert("Invalid meeting code or link format.");
      return;
    }

    router.push(`/calls/join/${meetingId}`);
  };

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
            <span>FREELANCEHUB DISPATCH · VIDEO COLLABORATION STATION</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Video Meetings.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Initiate instant encrypted video calls, generate meeting links for participants, and join scheduled milestone reviews.
              </p>
            </div>
          </div>
        </section>


        {/* ASYMMETRIC MEETING WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (Cols 1 to 8: 70% Width) - QUICK CONTROLS & JOIN */}
          <div className="lg:col-span-8 space-y-8 font-mono-ledger">
            
            {/* INSTANT MEETING CONTROLS */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>01 / INITIATE VIDEO MEETING</span>
                <span className="text-[var(--signal)]">[LIVE CONFERENCING]</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={startMeeting}
                  className="flex-1 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider py-3.5 px-6 transition-colors shadow-xs flex items-center justify-center space-x-2"
                >
                  <Video className="h-4 w-4" />
                  <span>START INSTANT MEETING →</span>
                </button>

                <button
                  onClick={generateMeetingLink}
                  className="flex-1 bg-[var(--paper-2)] border-2 border-[var(--ink)] hover:bg-[var(--paper)] text-[var(--ink)] font-bold text-[12px] uppercase py-3.5 px-6 transition-colors flex items-center justify-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>GENERATE MEETING LINK</span>
                </button>
              </div>

              {meetingLink && (
                <div className="p-4 border-2 border-[var(--ink)] bg-[var(--paper-2)] space-y-2">
                  <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">GENERATED MEETING SPECIMEN LINK:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meetingLink}
                      readOnly
                      className="flex-1 bg-[var(--paper)] border border-[var(--ink)] p-2.5 text-[12px] font-bold"
                    />
                    <button
                      onClick={copyMeetingLink}
                      className="bg-[var(--ink)] text-[var(--paper)] font-bold text-[11px] px-4 uppercase hover:bg-[var(--signal)] transition-colors"
                    >
                      {copied ? "COPIED ✓" : "COPY LINK"}
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* JOIN MEETING WITH CODE */}
            <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                02 / JOIN EXISTING MEETING ROOM
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter meeting code or paste link..."
                  value={meetingCodeInput}
                  onChange={(e) => setMeetingCodeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') joinMeeting(); }}
                  className="flex-1 bg-[var(--paper)] border-2 border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none"
                />
                <button
                  onClick={joinMeeting}
                  className="bg-[var(--ink)] text-[var(--paper)] font-bold text-[11px] uppercase px-6 hover:bg-[var(--signal)] transition-colors"
                >
                  JOIN ROOM →
                </button>
              </div>
            </div>


            {/* RECENT CALL LOGS */}
            <div className="space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>RECENT TELECONFERENCE HISTORY</span>
                <span className="text-[var(--signal)]">{recentMeetings.length} CALLS</span>
              </div>

              {loading ? (
                <div className="border-2 border-[var(--line)] bg-[var(--paper-2)] p-6 text-center text-[11px] text-[var(--muted)]">
                  LOADING CALL HISTORY...
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 text-center text-[11px] text-[var(--muted)]">
                  NO RECENT VIDEO CALLS ON RECORD
                </div>
              ) : (
                <div className="border-2 border-[var(--ink)] bg-[var(--paper)] divide-y divide-[var(--line)] text-[12px]">
                  {recentMeetings.map((call) => {
                    const isOutgoing = call.callerId === user?.id;
                    const callDate = new Date(call.createdAt);
                    const durationMins = call.duration ? Math.floor(call.duration / 60) : 0;

                    return (
                      <div key={call.callId} className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="font-bold text-[var(--ink)] block">
                            {isOutgoing ? 'OUTGOING' : 'INCOMING'} {call.callType?.toUpperCase() || 'VIDEO'} CALL
                          </span>
                          <span className="text-[10px] text-[var(--muted)] block">
                            {callDate.toLocaleDateString()} AT {callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • DURATION: {durationMins} MINS
                          </span>
                        </div>

                        <span className="px-2.5 py-0.5 border border-[var(--ink)] bg-[var(--paper-2)] text-[10px] uppercase font-bold">
                          [{call.status?.toUpperCase() || 'COMPLETED'}]
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>


          {/* Right Column (Cols 9 to 12: 30% Width) - UPCOMING MEETINGS */}
          <div className="lg:col-span-4 space-y-6 font-mono-ledger text-[12px]">
            
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 space-y-4">
              <div className="border-b border-[var(--ink)] pb-2 text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
                <span>SCHEDULED MEETINGS</span>
                <span className="text-[var(--signal)] font-bold">• CALENDAR</span>
              </div>

              {loading ? (
                <p className="text-[11px] text-[var(--muted)]">Loading upcoming schedule...</p>
              ) : upcomingMeetings.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)]">NO UPCOMING MEETINGS SCHEDULED</p>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.meetingId} className="border border-[var(--ink)] bg-[var(--paper-2)] p-4 space-y-2 text-left">
                      <span className="font-bold text-[var(--ink)] text-[13px] block">{meeting.title}</span>
                      <span className="text-[10px] text-[var(--muted)] block">
                        {new Date(meeting.scheduledAt).toLocaleDateString()} AT {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => router.push(meeting.meetingUrl)}
                        className="w-full bg-[var(--signal)] text-[var(--paper)] font-bold text-[10px] uppercase py-2 transition-colors mt-2"
                      >
                        JOIN MEETING ROOM →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Video Collaboration Station</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function VideoMeetingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING MEETING STATION...</p>
      </div>
    }>
      <VideoMeetingContent />
    </Suspense>
  );
}
