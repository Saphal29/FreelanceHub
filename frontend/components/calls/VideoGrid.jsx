"use client";

import { useEffect, useRef } from "react";

/**
 * VideoGrid — renders local + remote video streams.
 *
 * Props:
 *   localStream   {MediaStream | null}
 *   remoteStreams  {Map<string, MediaStream>}
 *   isAudioMuted  {boolean}
 *   isVideoOff    {boolean}
 */
export function VideoGrid({ localStream, remoteStreams, isAudioMuted, isVideoOff }) {
  const remoteEntries = remoteStreams ? Array.from(remoteStreams.entries()) : [];
  const hasRemoteStreams = remoteEntries.length > 0;

  console.log("[VideoGrid] Render:", {
    hasLocalStream: !!localStream,
    localStreamTracks: localStream?.getTracks()?.map(t => `${t.kind}: ${t.readyState}`),
    hasRemoteStreams,
    remoteCount: remoteEntries.length,
    isVideoOff
  });

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      {/* ── Remote streams (or empty state) ── */}
      <RemoteArea remoteEntries={remoteEntries} />

      {/* ── Local video ── */}
      {localStream && (
        <>
          {hasRemoteStreams ? (
            // Picture-in-picture when others are connected
            <div className="absolute bottom-6 right-6 w-48 h-36 md:w-64 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 z-10 transition-all hover:scale-105 hover:border-white/30">
              {!isVideoOff ? (
                <VideoElement stream={localStream} muted mirror userId="local" />
              ) : (
                <AvatarPlaceholder label="You" small />
              )}
              {/* Local video label */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                You {isAudioMuted && "🔇"}
              </div>
            </div>
          ) : (
            // Centered card when alone
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-4xl aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
                {!isVideoOff ? (
                  <VideoElement stream={localStream} muted mirror userId="local" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AvatarPlaceholder label="You" small={false} />
                  </div>
                )}
                {/* Status indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Waiting for others...</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Remote area layout ───────────────────────────────────────────────────────

function RemoteArea({ remoteEntries }) {
  console.log("[RemoteArea] Remote entries:", remoteEntries.length, remoteEntries.map(([userId, stream]) => ({
    userId,
    tracks: stream?.getTracks()?.map(t => `${t.kind}: ${t.readyState}`) || []
  })));

  // Don't show anything if no remote streams - local video will be shown centered
  if (remoteEntries.length === 0) {
    return null;
  }

  if (remoteEntries.length === 1) {
    const [userId, stream] = remoteEntries[0];
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          <VideoElement stream={stream} userId={userId} />
        </div>
      </div>
    );
  }

  // 2+ remote streams: grid layout
  return (
    <div className="absolute inset-0 p-4 md:p-6">
      <div
        className={`grid w-full h-full gap-4 ${
          remoteEntries.length === 2 
            ? "grid-cols-1 md:grid-cols-2" 
            : remoteEntries.length === 3
            ? "grid-cols-2 grid-rows-2"
            : "grid-cols-2 grid-rows-2"
        }`}
      >
        {remoteEntries.map(([userId, stream]) => (
          <div key={userId} className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-white/10">
            <VideoElement stream={stream} userId={userId} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single video element ─────────────────────────────────────────────────────

function VideoElement({ stream, muted = false, mirror = false, userId }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    
    // Only update if the stream actually changed
    if (streamRef.current === stream) {
      return;
    }
    
    streamRef.current = stream;
    
    console.log(`[VideoElement] Setting stream for ${userId || 'local'}:`, stream?.getTracks()?.map(t => `${t.kind}: ${t.readyState}`));
    
    if (stream) {
      // Set srcObject
      el.srcObject = stream;
      
      // Play the video, handling interruptions gracefully
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[VideoElement] Video playing for ${userId || 'local'}`);
          })
          .catch(err => {
            // Ignore AbortError which happens when play is interrupted
            if (err.name !== 'AbortError') {
              console.error(`[VideoElement] Play failed for ${userId || 'local'}:`, err);
            }
          });
      }
    } else {
      el.srcObject = null;
    }
  }, [stream, userId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
      style={{ 
        display: 'block',
        backgroundColor: '#1f2937'
      }}
    />
  );
}

// ─── Avatar placeholder ───────────────────────────────────────────────────────

function AvatarPlaceholder({ label, small = false }) {
  const initial = label ? label.charAt(0).toUpperCase() : "?";
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-700 to-gray-800">
      <div className="flex flex-col items-center gap-3">
        <div
          className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold select-none shadow-xl ${
            small ? "h-12 w-12 text-lg" : "h-24 w-24 text-4xl"
          }`}
        >
          {initial}
        </div>
        {!small && (
          <p className="text-white/70 text-sm font-medium">{label}</p>
        )}
      </div>
    </div>
  );
}

export default VideoGrid;
