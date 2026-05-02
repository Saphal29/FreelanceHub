"use client";

import { useEffect, useRef } from "react";

/**
 * VideoGrid — renders local + remote video streams.
 * Detects screen sharing and displays it prominently.
 *
 * Props:
 *   localStream   {MediaStream | null}
 *   remoteStreams  {Map<string, MediaStream>}
 *   isAudioMuted  {boolean}
 *   isVideoOff    {boolean}
 *   isScreenSharing {boolean} - whether local user is sharing screen
 */
export function VideoGrid({ localStream, remoteStreams, isAudioMuted, isVideoOff, isScreenSharing }) {
  const remoteEntries = remoteStreams ? Array.from(remoteStreams.entries()) : [];
  const hasRemoteStreams = remoteEntries.length > 0;
  const totalParticipants = (localStream ? 1 : 0) + remoteEntries.length;

  console.log("[VideoGrid] Render:", {
    hasLocalStream: !!localStream,
    localStreamTracks: localStream?.getTracks()?.map(t => `${t.kind}: ${t.readyState}`),
    hasRemoteStreams,
    remoteCount: remoteEntries.length,
    totalParticipants,
    isVideoOff,
    isScreenSharing
  });

  // Detect if any remote user is sharing screen (screen tracks usually have label containing "screen")
  const remoteScreenSharer = remoteEntries.find(([userId, stream]) => {
    const videoTrack = stream.getVideoTracks()[0];
    return videoTrack && (
      videoTrack.label.toLowerCase().includes('screen') ||
      videoTrack.label.toLowerCase().includes('window') ||
      videoTrack.label.toLowerCase().includes('monitor')
    );
  });

  // SCREEN SHARING LAYOUT: Show screen share prominently with thumbnails on the side
  if (isScreenSharing || remoteScreenSharer) {
    const screenStream = isScreenSharing ? localStream : remoteScreenSharer[1];
    const screenUserId = isScreenSharing ? 'local' : remoteScreenSharer[0];
    const screenUserLabel = isScreenSharing ? "You (presenting)" : `User ${screenUserId.slice(0, 8)} (presenting)`;
    
    // Collect all other participants (not the screen sharer)
    const otherParticipants = [];
    if (isScreenSharing) {
      // Local is sharing, show all remote users as thumbnails
      remoteEntries.forEach(([userId, stream]) => {
        otherParticipants.push({ userId, stream, isLocal: false });
      });
    } else {
      // Remote is sharing, show local + other remotes as thumbnails
      if (localStream) {
        otherParticipants.push({ userId: 'local', stream: localStream, isLocal: true });
      }
      remoteEntries.forEach(([userId, stream]) => {
        if (userId !== screenUserId) {
          otherParticipants.push({ userId, stream, isLocal: false });
        }
      });
    }

    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
        {/* Main screen share area */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <VideoElement 
              stream={screenStream} 
              muted={isScreenSharing} 
              mirror={false}
              userId={screenUserId}
              isScreenShare={true}
            />
            {/* Screen share label */}
            <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {screenUserLabel}
            </div>
          </div>
        </div>

        {/* Thumbnails sidebar */}
        {otherParticipants.length > 0 && (
          <div className="absolute top-4 right-4 flex flex-col gap-3 max-h-[calc(100vh-8rem)] overflow-y-auto z-10">
            {otherParticipants.map(({ userId, stream, isLocal }) => {
              const videoTracks = stream?.getVideoTracks() || [];
              const hasActiveVideo = videoTracks.some(track => track.enabled && track.readyState === 'live');
              const shouldShowAvatar = isLocal ? isVideoOff : !hasActiveVideo;
              const userLabel = isLocal ? "You" : `User ${userId.slice(0, 8)}`;
              const userInitials = isLocal ? "YO" : userId.slice(0, 2).toUpperCase();

              return (
                <div 
                  key={userId} 
                  className="relative w-48 h-36 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden"
                >
                  {shouldShowAvatar ? (
                    <AvatarPlaceholder label={userLabel} initials={userInitials} small={true} />
                  ) : (
                    <VideoElement stream={stream} muted={isLocal} mirror={isLocal} userId={userId} />
                  )}
                  {/* User label */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                    {isLocal ? `You ${isAudioMuted ? "🔇" : ""}` : userLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // NORMAL LAYOUT: Grid view when no screen sharing
  if (localStream && hasRemoteStreams) {
    const allStreams = [
      { userId: 'local', stream: localStream, isLocal: true },
      ...remoteEntries.map(([userId, stream]) => ({ userId, stream, isLocal: false }))
    ];

    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 p-4 md:p-6">
          <div
            className={`grid w-full h-full gap-4 ${
              allStreams.length === 2 
                ? "grid-cols-1 md:grid-cols-2" 
                : allStreams.length === 3
                ? "grid-cols-2 grid-rows-2"
                : "grid-cols-2 grid-rows-2"
            }`}
          >
            {allStreams.map(({ userId, stream, isLocal }) => {
              const videoTracks = stream?.getVideoTracks() || [];
              const hasActiveVideo = videoTracks.some(track => track.enabled && track.readyState === 'live');
              const shouldShowAvatar = isLocal ? isVideoOff : !hasActiveVideo;
              const userLabel = isLocal ? "You" : `User ${userId.slice(0, 8)}`;
              const userInitials = isLocal ? "YO" : userId.slice(0, 2).toUpperCase();

              return (
                <div key={userId} className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-white/10">
                  {shouldShowAvatar ? (
                    <AvatarPlaceholder label={userLabel} initials={userInitials} small={false} />
                  ) : (
                    <VideoElement stream={stream} muted={isLocal} mirror={isLocal} userId={userId} />
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg">
                    {isLocal ? `You ${isAudioMuted ? "🔇" : ""}` : userLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Original behavior when only local or only remote
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <RemoteArea remoteEntries={remoteEntries} />
      {localStream && !hasRemoteStreams && (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            {!isVideoOff ? (
              <VideoElement stream={localStream} muted mirror userId="local" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AvatarPlaceholder label="You" small={false} />
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-xl">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Waiting for others...</span>
            </div>
          </div>
        </div>
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
    
    // Check if this stream has active video
    const videoTracks = stream?.getVideoTracks() || [];
    const hasActiveVideo = videoTracks.some(track => track.enabled && track.readyState === 'live');
    const userLabel = `User ${userId.slice(0, 8)}`;
    const userInitials = userId.slice(0, 2).toUpperCase();
    
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {hasActiveVideo ? (
            <VideoElement stream={stream} userId={userId} />
          ) : (
            <AvatarPlaceholder label={userLabel} initials={userInitials} small={false} />
          )}
          {/* User label */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg">
            {userLabel}
          </div>
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
        {remoteEntries.map(([userId, stream]) => {
          // Check if this stream has active video
          const videoTracks = stream?.getVideoTracks() || [];
          const hasActiveVideo = videoTracks.some(track => track.enabled && track.readyState === 'live');
          const userLabel = `User ${userId.slice(0, 8)}`;
          const userInitials = userId.slice(0, 2).toUpperCase();
          
          return (
            <div key={userId} className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-white/10">
              {hasActiveVideo ? (
                <VideoElement stream={stream} userId={userId} />
              ) : (
                <AvatarPlaceholder label={userLabel} initials={userInitials} small={false} />
              )}
              {/* User label */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg">
                {userLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Single video element ─────────────────────────────────────────────────────

function VideoElement({ stream, muted = false, mirror = false, userId, isScreenShare = false }) {
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
      className={`w-full h-full ${isScreenShare ? 'object-contain' : 'object-cover'} ${mirror ? "scale-x-[-1]" : ""}`}
      style={{ 
        display: 'block',
        backgroundColor: isScreenShare ? '#000' : '#1f2937'
      }}
    />
  );
}

// ─── Avatar placeholder ───────────────────────────────────────────────────────

function AvatarPlaceholder({ label, initials, small = false }) {
  // Use provided initials or extract from label
  const displayInitials = initials || (label ? label.slice(0, 2).toUpperCase() : "??");
  
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-700 to-gray-800">
      <div className="flex flex-col items-center gap-3">
        <div
          className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold select-none shadow-xl ${
            small ? "h-12 w-12 text-lg" : "h-24 w-24 text-4xl"
          }`}
        >
          {displayInitials}
        </div>
        {!small && (
          <p className="text-white/70 text-sm font-medium">{label}</p>
        )}
      </div>
    </div>
  );
}

export default VideoGrid;
