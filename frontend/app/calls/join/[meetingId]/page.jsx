"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { joinMeeting, createRoom } from "@/lib/api";
import { Video, AlertCircle, Loader2 } from "lucide-react";

export default function JoinMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { joinRoom } = useWebRTC();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !params.meetingId) return;
    joinMeeting(params.meetingId)
      .then((res) => setMeeting(res.meeting))
      .catch((err) => {
        if (err.status === 403) setError("You are not a participant of this meeting.");
        else if (err.status === 404) setError("Meeting not found.");
        else setError(err.message || "Failed to load meeting.");
      })
      .finally(() => setLoading(false));
  }, [user, params.meetingId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      // Use the meetingId as the roomId so all participants join the same room
      const roomId = params.meetingId;
      
      // Try to create or join the room
      try {
        await createRoom({ roomName: meeting?.title || 'Meeting', roomId });
      } catch (err) {
        // Room might already exist, that's okay - we'll join it
        console.log('Room may already exist, proceeding to join');
      }
      
      joinRoom(roomId);
      router.push(`/calls/room/${roomId}`);
    } catch (err) {
      setError(err.message || "Failed to join meeting.");
    } finally {
      setJoining(false);
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-8 w-full max-w-md text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mx-auto">
          <Video className="h-8 w-8 text-accent-foreground" />
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        ) : meeting ? (
          <>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{meeting.title}</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Scheduled for {new Date(meeting.scheduledAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
              {joining ? "Joining…" : "Join Call"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
