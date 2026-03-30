"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { getCallHistory, createRoom } from "@/lib/api";
import { Phone, Video, Clock, AlertCircle, Loader2, Copy, Check, Link as LinkIcon } from "lucide-react";

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const statusColors = {
  ended: "bg-green-100 text-green-700",
  missed: "bg-red-100 text-red-700",
  rejected: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-700",
  connected: "bg-blue-100 text-blue-700",
};

export default function CallsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { initiateCall, callState, callId, callError } = useWebRTC();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Meeting link generation
  const [generatingLink, setGeneratingLink] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Join by link
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Direct call from contract page
  const calleeId = searchParams.get("calleeId");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getCallHistory()
        .then((res) => setCalls(res.calls || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Navigate to call page once call is initiated
  useEffect(() => {
    if (callId && callState === "calling") {
      router.push(`/calls/${callId}`);
    }
  }, [callId, callState, router]);

  // Generate a meeting link — creates an instant room, joinable immediately
  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setError("");
    try {
      const res = await createRoom({ roomName: `Meeting`, maxParticipants: 4 });
      if (res.success) {
        const roomId = res.room.roomId;
        const fullLink = `${window.location.origin}/calls/room/${roomId}`;
        setMeetingLink(fullLink);
      } else {
        setError(res.error || "Failed to generate link");
      }
    } catch (err) {
      setError(err.message || "Failed to generate link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(meetingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = meetingLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy link. Please copy manually: ' + meetingLink);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy link. Please copy manually: ' + meetingLink);
    }
  };

  // Join via pasted link or room ID
  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    let roomId = joinCode.trim();
    // Extract roomId from full URL like http://localhost:3000/calls/room/<id>
    const match = roomId.match(/\/calls\/room\/([a-f0-9-]+)/i);
    if (match) roomId = match[1];
    router.push(`/calls/room/${roomId}`);
  };

  // Direct call from contract
  const handleStartCall = async (type = "video") => {
    if (!calleeId) return;
    setStarting(true);
    try {
      await initiateCall(calleeId, type);
    } catch (err) {
      setError(err.message || "Failed to start call");
    } finally {
      setStarting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const userType = user.role === "CLIENT" ? "client" : "freelancer";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Calls</h1>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Direct call from contract */}
        {calleeId && (
          <div className="mb-6 p-6 bg-card border border-border rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Start a call now</p>
              <p className="text-sm text-muted-foreground mt-0.5">Direct call from your contract</p>
              {callError && <p className="text-xs text-red-500 mt-1">{callError}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleStartCall("video")}
                disabled={starting || callState !== "idle"}
                className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                Video
              </button>
              <button
                onClick={() => handleStartCall("audio")}
                disabled={starting || callState !== "idle"}
                className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-secondary text-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <Phone className="h-4 w-4" />
                Audio
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Generate meeting link */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
            <div>
              <h2 className="font-semibold text-foreground">Create a meeting</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a link and share it — anyone with the link can join
              </p>
            </div>

            {!meetingLink ? (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {generatingLink ? "Generating…" : "New Meeting"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{meetingLink}</span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with the other person. They paste it below to join.
                </p>
                <button
                  onClick={() => router.push(`/calls/room/${meetingLink.split('/calls/room/')[1]}`)}
                  className="w-full py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Join now
                </button>
              </div>
            )}
          </div>

          {/* Join via link */}
          <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
            <div>
              <h2 className="font-semibold text-foreground">Join a meeting</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Paste the meeting link or ID you received
              </p>
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Paste link or meeting ID…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joining}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
              Join
            </button>
          </div>
        </div>

        {/* Call history */}
        <h2 className="font-semibold text-foreground mb-3">Call History</h2>
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Phone className="h-10 w-10" />
            <p className="text-sm">No calls yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const isOutgoing = call.callerId === user.id;
              const otherId = isOutgoing ? call.receiverId : call.callerId;
              return (
                <div key={call.callId} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                    {call.callType === "video"
                      ? <Video className="h-5 w-5 text-accent-foreground" />
                      : <Phone className="h-5 w-5 text-accent-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {isOutgoing ? "↑ Outgoing" : "↓ Incoming"} — {otherId?.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(call.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {call.duration != null && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[call.status] || "bg-gray-100 text-gray-600"}`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
