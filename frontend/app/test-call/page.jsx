"use client";

import { useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useCallNotifications } from "@/components/calls/CallNotificationManager";

export default function TestCallPage() {
  const [calleeId, setCalleeId] = useState("");
  const { 
    callState, 
    localStream, 
    remoteStreams, 
    callError,
    initiateCall, 
    endCall, 
    toggleAudio, 
    toggleVideo,
    isAudioMuted,
    isVideoOff 
  } = useWebRTC();

  const { incomingCall, acceptCall, rejectCall } = useCallNotifications();

  const handleInitiateCall = async () => {
    if (!calleeId.trim()) {
      alert("Please enter a callee ID");
      return;
    }
    
    try {
      await initiateCall(calleeId, "video");
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Call Test</h1>
        
        {/* Call State */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Call Status</h2>
          <p className="text-lg">
            Current State: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{callState}</span>
          </p>
          {callError && (
            <p className="text-red-600 mt-2">Error: {callError}</p>
          )}
        </div>

        {/* Call Controls */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Call Controls</h2>
          
          {callState === "idle" && (
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Enter callee user ID"
                value={calleeId}
                onChange={(e) => setCalleeId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 flex-1"
              />
              <button
                onClick={handleInitiateCall}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
              >
                Start Video Call
              </button>
            </div>
          )}

          {callState !== "idle" && callState !== "ended" && (
            <div className="flex gap-4">
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 rounded font-semibold ${
                  isAudioMuted 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                {isAudioMuted ? "Unmute" : "Mute"}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 rounded font-semibold ${
                  isVideoOff 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                {isVideoOff ? "Turn On Video" : "Turn Off Video"}
              </button>
              
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-semibold"
              >
                End Call
              </button>
            </div>
          )}
        </div>

        {/* Video Streams */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Video Streams</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Local Stream */}
            <div>
              <h3 className="text-lg font-medium mb-2">Local Video</h3>
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                {localStream ? (
                  <video
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <p className="text-white">No local video</p>
                )}
              </div>
            </div>

            {/* Remote Streams */}
            <div>
              <h3 className="text-lg font-medium mb-2">Remote Video</h3>
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                {remoteStreams.size > 0 ? (
                  Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                    <video
                      key={userId}
                      ref={(video) => {
                        if (video && stream) {
                          video.srcObject = stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ))
                ) : (
                  <p className="text-white">No remote video</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Call Notification */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Incoming Call</h3>
              <p className="mb-4">
                {incomingCall.callerName || "Unknown"} is calling you
              </p>
              <div className="flex gap-4">
                <button
                  onClick={rejectCall}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-semibold"
                >
                  Decline
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}