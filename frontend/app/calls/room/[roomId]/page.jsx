"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoGrid } from "@/components/calls/VideoGrid";
import { CallControls } from "@/components/calls/CallControls";
import { joinRoomApi } from "@/lib/api";
import { AlertCircle, PhoneOff, Loader2 } from "lucide-react";

export default function RoomCallPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId;
  const { user, loading: authLoading } = useAuth();

  const {
    localStream, remoteStreams, callState, callError,
    isAudioMuted, isVideoOff, isScreenSharing,
    endCall, toggleAudio, toggleVideo,
    startScreenShare, stopScreenShare,
    requestMediaAccess, releaseMediaDevices, joinRoom, leaveRoom,
  } = useWebRTC();

  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState("");

  // Debug logging
  useEffect(() => {
    console.log("[RoomCallPage] State:", {
      hasLocalStream: !!localStream,
      localStreamTracks: localStream?.getTracks()?.map(t => `${t.kind}: ${t.label}`),
      remoteStreamsCount: remoteStreams.size,
      callState,
      callError,
      showingEnableCameraOverlay: !localStream
    });
  }, [localStream, remoteStreams, callState, callError]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !roomId) return;

    let joined = false;

    const joinRoomWithMedia = async () => {
      try {
        // First join the room via REST API
        await joinRoomApi(roomId);
        joined = true;
        
        // Join via socket WITHOUT requesting media automatically
        await joinRoom(roomId, false); // false = don't request media automatically
        setJoining(false);
      } catch (err) {
        console.error("Room join error:", err);
        
        if (err?.code === 'ROOM_FULL') {
          setJoinError("Room is full");
        } else {
          // Try to join socket anyway even if REST had an issue
          try {
            joined = true;
            await joinRoom(roomId, false); // false = don't request media automatically
            setJoining(false);
          } catch (socketErr) {
            console.error("Socket join error:", socketErr);
            setJoinError("Failed to join room");
          }
        }
      }
    };

    joinRoomWithMedia();

    return () => {
      if (joined) {
        leaveRoom(roomId);
      }
    };
  }, [user, roomId, joinRoom, leaveRoom]);

  const handleLeave = () => {
    leaveRoom(roomId);
    
    // Check if we came from a contract page by looking at the meeting metadata
    // or check if there's a returnUrl in sessionStorage
    const returnUrl = sessionStorage.getItem(`meeting_${roomId}_returnUrl`);
    
    if (returnUrl) {
      sessionStorage.removeItem(`meeting_${roomId}_returnUrl`);
      router.push(returnUrl);
    } else {
      router.push("/calls");
    }
  };

  if (authLoading || joining) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">
            {authLoading ? "Loading..." : "Joining room..."}
          </p>
        </div>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="font-semibold text-foreground">Failed to join room</p>
          <p className="text-sm text-muted-foreground">{joinError}</p>
          <button
            onClick={() => router.push("/calls")}
            className="w-full py-2 bg-black text-white rounded-xl text-sm font-semibold"
          >
            Back to Calls
          </button>
        </div>
      </div>
    );
  }

  const isOver = callState === "ended" || callState === "failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Status bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white text-sm px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Room Call</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-white/70">
            {remoteStreams.size} {remoteStreams.size === 1 ? "participant" : "participants"}
          </span>
          {localStream && !localStream.getVideoTracks().length && (
            <>
              <div className="w-px h-4 bg-white/20"></div>
              <span className="text-yellow-400 text-xs">🎤 Audio only</span>
            </>
          )}
        </div>
      </div>

      {callError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-md w-full mx-4">
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/20 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-2">{callError}</p>
                <div className="flex gap-2 flex-wrap">
                  {callError.includes("permission") && (
                    <button
                      onClick={() => requestMediaAccess(true, true)}
                      className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Try Video + Audio
                    </button>
                  )}
                  {callError.includes("being used") && (
                    <>
                      <button
                        onClick={() => requestMediaAccess(false, true)}
                        className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Audio Only
                      </button>
                      <button
                        onClick={() => {
                          releaseMediaDevices();
                          setTimeout(() => requestMediaAccess(true, true), 1000);
                        }}
                        className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Release & Retry
                      </button>
                    </>
                  )}
                  {callError.includes("Camera in use") && (
                    <button
                      onClick={() => requestMediaAccess(true, true)}
                      className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Try Video Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video area */}
      <div className="flex-1 relative min-h-0">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
        />

        {/* Show "Waiting for others" only when no local stream and no remote streams */}
        {!localStream && remoteStreams.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-sm font-medium">Waiting for others to join...</span>
              </div>
            </div>
          </div>
        )}

        {/* Enable Camera Button - Show when no local stream */}
        {!localStream && (
          <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 text-center text-white max-w-md w-full shadow-2xl">
              <div className="mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-xl">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Join with Camera & Microphone
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Enable your camera and microphone to participate in the video call
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    console.log("[RoomCallPage] Requesting video + audio access");
                    try {
                      await requestMediaAccess(true, true);
                      console.log("[RoomCallPage] Media access granted, localStream should be set");
                    } catch (err) {
                      console.error("[RoomCallPage] Media access failed:", err);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Enable Video + Audio
                </button>
                <button
                  onClick={async () => {
                    console.log("[RoomCallPage] Requesting audio only access");
                    try {
                      await requestMediaAccess(false, true);
                      console.log("[RoomCallPage] Audio access granted, localStream should be set");
                    } catch (err) {
                      console.error("[RoomCallPage] Audio access failed:", err);
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Audio Only
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  You can join without camera/microphone, but others won't see or hear you
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls — always show in room (not gated by callState) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center justify-center gap-3 px-6 py-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
            <ControlBtn
              onClick={toggleAudio}
              active={!isAudioMuted}
              danger={isAudioMuted}
              label={isAudioMuted ? "Unmute" : "Mute"}
              icon={
                isAudioMuted ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )
              }
            />
            <ControlBtn
              onClick={toggleVideo}
              active={!isVideoOff}
              danger={isVideoOff}
              label={isVideoOff ? "Turn camera on" : "Turn camera off"}
              icon={
                isVideoOff ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )
              }
            />
            <ControlBtn
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              active={isScreenSharing}
              success={isScreenSharing}
              label={isScreenSharing ? "Stop sharing" : "Share screen"}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <div className="w-px h-10 bg-white/20 mx-1"></div>
            <button
              onClick={handleLeave}
              className="flex items-center justify-center h-12 w-12 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-xl hover:scale-105"
              title="Leave room"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlBtn({ onClick, active, danger, success, label, icon }) {
  let cls = "bg-white/10 hover:bg-white/20 text-white border border-white/10";
  if (danger) cls = "bg-red-500/90 hover:bg-red-600 text-white border border-red-400/20";
  if (success) cls = "bg-green-500/90 hover:bg-green-600 text-white border border-green-400/20";
  
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center h-12 w-12 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 ${cls}`}
    >
      {icon}
    </button>
  );
}
