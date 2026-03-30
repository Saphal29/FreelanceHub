"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoGrid } from "@/components/calls/VideoGrid";
import { CallControls } from "@/components/calls/CallControls";
import { AlertCircle, PhoneOff } from "lucide-react";

export default function ActiveCallPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    localStream, remoteStreams, callState, callError,
    isAudioMuted, isVideoOff, isScreenSharing,
    endCall, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare,
  } = useWebRTC();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const isOver = callState === "ended" || callState === "failed";

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Status bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <span className="bg-black/60 text-white text-xs px-4 py-1.5 rounded-full backdrop-blur-sm">
          {callState === "connected" ? "Connected" :
           callState === "calling" ? "Calling…" :
           callState === "ringing" ? "Ringing…" :
           callState === "failed" ? "Connection failed" :
           callState === "ended" ? "Call ended" : callState}
        </span>
      </div>

      {/* Error */}
      {callError && !isOver && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-red-600 text-white text-xs px-4 py-2 rounded-full">
          <AlertCircle className="h-4 w-4" />
          {callError}
        </div>
      )}

      {/* Video area */}
      {!isOver ? (
        <div className="flex-1 relative">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            isAudioMuted={isAudioMuted}
            isVideoOff={isVideoOff}
          />
          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <CallControls
              callState={callState}
              isAudioMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isScreenSharing={isScreenSharing}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onStartScreenShare={startScreenShare}
              onStopScreenShare={stopScreenShare}
              onEndCall={endCall}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-white">
          <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <PhoneOff className="h-10 w-10 text-red-400" />
          </div>
          <p className="text-2xl font-semibold">
            {callState === "failed" ? "Connection failed" : "Call ended"}
          </p>
          {callError && <p className="text-sm text-red-400">{callError}</p>}
          <button
            onClick={() => router.push("/calls")}
            className="mt-4 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Back to calls
          </button>
        </div>
      )}
    </div>
  );
}
