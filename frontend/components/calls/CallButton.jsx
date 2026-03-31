"use client";

import { Phone, Video, Loader2 } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

/**
 * CallButton — triggers a call to a specific user.
 *
 * Props:
 *   calleeId    {string}           — UUID of the user to call
 *   calleeName  {string}           — display name (for aria-label)
 *   callType    {'video'|'audio'}  — defaults to 'video'
 *   className   {string}           — extra Tailwind classes
 */
export function CallButton({ calleeId, calleeName, callType = "video", className = "" }) {
  const { initiateCall, callState, callError } = useWebRTC();

  const isCalling = callState === "calling";
  const isDisabled = isCalling || (callState !== "idle");

  const handleClick = async () => {
    if (isDisabled) return;
    try {
      await initiateCall(calleeId, callType);
    } catch {
      // error is surfaced via callError state
    }
  };

  const Icon = callType === "video" ? Video : Phone;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={`${callType === "video" ? "Video" : "Audio"} call ${calleeName || ""}`}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
          ${isDisabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-black hover:bg-gray-800 text-white shadow hover:shadow-lg"
          } ${className}`}
      >
        {isCalling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {isCalling ? "Calling…" : callType === "video" ? "Video Call" : "Call"}
      </button>

      {callError && (
        <p className="text-red-500 text-xs mt-1">{callError}</p>
      )}
    </div>
  );
}

export default CallButton;
