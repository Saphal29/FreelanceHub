"use client";

import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from "lucide-react";

/**
 * CallControls — dark control bar shown during an active call.
 *
 * Props:
 *   isAudioMuted      {boolean}
 *   isVideoOff        {boolean}
 *   isScreenSharing   {boolean}
 *   onToggleAudio     {() => void}
 *   onToggleVideo     {() => void}
 *   onStartScreenShare {() => void}
 *   onStopScreenShare  {() => void}
 *   onEndCall         {() => void}
 *   callState         {string}  — only renders when 'connected'
 */
export function CallControls({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare,
  onEndCall,
  callState,
}) {
  if (callState !== "connected") return null;

  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-md rounded-2xl shadow-modern-xl">
      {/* Mic toggle */}
      <ControlButton
        onClick={onToggleAudio}
        active={!isAudioMuted}
        danger={isAudioMuted}
        label={isAudioMuted ? "Unmute" : "Mute"}
      >
        {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </ControlButton>

      {/* Camera toggle */}
      <ControlButton
        onClick={onToggleVideo}
        active={!isVideoOff}
        danger={isVideoOff}
        label={isVideoOff ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </ControlButton>

      {/* Screen share toggle */}
      <ControlButton
        onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
        active={isScreenSharing}
        success={isScreenSharing}
        label={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </ControlButton>

      {/* Divider */}
      <div className="w-px h-8 bg-white/20" />

      {/* End call */}
      <button
        onClick={onEndCall}
        aria-label="End call"
        className="flex items-center justify-center h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 shadow-lg"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function ControlButton({ onClick, active, danger, success, label, children }) {
  let colorClass = "bg-white/10 hover:bg-white/20 text-white";
  if (danger) colorClass = "bg-red-500 hover:bg-red-600 text-white";
  if (success) colorClass = "bg-green-500 hover:bg-green-600 text-white";

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center h-12 w-12 rounded-full transition-colors duration-200 shadow ${colorClass}`}
    >
      {children}
    </button>
  );
}

export default CallControls;
