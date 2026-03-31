"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ICE_CONFIG from "@/lib/iceConfig";
import { transition } from "@/lib/callStateMachine";
import { connectVideoSocket, disconnectVideoSocket } from "@/lib/videoSocket";
import { useAuth } from "@/contexts/AuthContext";

export function useWebRTC() {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [callState, setCallState] = useState("idle");
  const [callId, setCallId] = useState(null);
  const [calleeId, setCalleeId] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError, setCallError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const peerConnections = useRef(new Map());
  const iceRestartAttempts = useRef(new Map());
  const socketRef = useRef(null);
  // Keep a ref to callState so event handlers always see the latest value
  const callStateRef = useRef("idle");
  const callIdRef = useRef(null);
  const calleeIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const roomIdRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callIdRef.current = callId; }, [callId]);
  useEffect(() => { calleeIdRef.current = calleeId; }, [calleeId]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const safeTransition = useCallback((event) => {
    try {
      const next = transition(callStateRef.current, event);
      setCallState(next);
      callStateRef.current = next;
      return next;
    } catch (err) {
      console.warn("[useWebRTC] invalid transition:", err.message);
      return callStateRef.current;
    }
  }, []);

  const updateRemoteStream = useCallback((userId, stream) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.set(userId, stream);
      return next;
    });
  }, []);

  const removeRemoteStream = useCallback((userId) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const closePeerConnection = useCallback((userId) => {
    const pc = peerConnections.current.get(userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(userId);
    }
    iceRestartAttempts.current.delete(userId);
    removeRemoteStream(userId);
  }, [removeRemoteStream]);

  const closeAllPeerConnections = useCallback(() => {
    for (const userId of peerConnections.current.keys()) {
      const pc = peerConnections.current.get(userId);
      if (pc) pc.close();
    }
    peerConnections.current.clear();
    iceRestartAttempts.current.clear();
    setRemoteStreams(new Map());
  }, []);

  const stopLocalStream = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        t.stop();
        console.log(`[useWebRTC] Stopped ${t.kind} track`);
      });
      setLocalStream(null);
      localStreamRef.current = null;
    }
  }, []);

  // ─── releaseMediaDevices ────────────────────────────────────────────────────

  const releaseMediaDevices = useCallback(() => {
    console.log("[useWebRTC] Releasing media devices");
    stopLocalStream();
    setCallError(null);
  }, [stopLocalStream]);

  // ─── createPeerConnection ────────────────────────────────────────────────────

  const createPeerConnection = useCallback((targetUserId) => {
    // Check if peer connection already exists
    if (peerConnections.current.has(targetUserId)) {
      console.log(`[useWebRTC] Reusing existing peer connection for ${targetUserId}`);
      return peerConnections.current.get(targetUserId);
    }

    const socket = socketRef.current;
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Debug logging for signaling state changes
    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] Peer connection ${targetUserId} signaling state:`, pc.signalingState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer connection ${targetUserId} connection state:`, pc.connectionState);
    };

    // Add local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // ICE candidate relay
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        if (roomIdRef.current) {
          socket.emit("peer:ice-candidate", {
            roomId: roomIdRef.current,
            targetUserId,
            candidate,
          });
        } else {
          socket.emit("call:ice-candidate", {
            callId: callIdRef.current,
            candidate,
          });
        }
      }
    };

    // Remote stream
    pc.ontrack = ({ streams }) => {
      console.log(`[WebRTC] Received track from ${targetUserId}, streams:`, streams?.length);
      if (streams && streams[0]) {
        console.log(`[WebRTC] Setting remote stream for ${targetUserId}:`, streams[0].getTracks().map(t => `${t.kind}: ${t.label || 'unlabeled'}`));
        updateRemoteStream(targetUserId, streams[0]);
      } else {
        console.warn(`[WebRTC] No streams received in ontrack for ${targetUserId}`);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = async () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] Peer connection ${targetUserId} connection state:`, state);
      
      // Only trigger call state changes for 1-to-1 calls, not group calls
      if (!roomIdRef.current) {
        if (state === "connected") {
          safeTransition("callAccepted");
        } else if (state === "failed") {
          const attempts = iceRestartAttempts.current.get(targetUserId) || 0;
          if (attempts < 3) {
            console.log(`[WebRTC] Connection failed for ${targetUserId}, attempting ICE restart (attempt ${attempts + 1})`);
            iceRestartAttempts.current.set(targetUserId, attempts + 1);
            pc.restartIce();
            try {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              const socket = socketRef.current;
              if (socket) {
                socket.emit("call:offer", { callId: callIdRef.current, sdp: offer });
              }
            } catch (err) {
              console.warn("[useWebRTC] ICE restart offer failed:", err.message);
            }
          } else {
            safeTransition("iceFailure");
            setCallError("Connection failed. Please check your network and try again.");
            const socket = socketRef.current;
            if (socket) {
              socket.emit("call:log", {
                callId: callIdRef.current,
                event: "ice_failed",
                metadata: { attempts: 3 },
              });
            }
          }
        }
      } else {
        // For group calls, handle connection failures differently
        if (state === "failed") {
          console.warn(`[useWebRTC] Group call peer connection failed for ${targetUserId}, will attempt reconnection`);
          // Remove the failed connection and let the room rejoin logic handle reconnection
          setTimeout(() => {
            if (pc.connectionState === "failed") {
              console.log(`[useWebRTC] Removing failed peer connection for ${targetUserId}`);
              closePeerConnection(targetUserId);
            }
          }, 5000); // Give it 5 seconds to potentially recover
        } else if (state === "connected") {
          console.log(`[useWebRTC] Group call peer connection established with ${targetUserId}`);
        }
      }
    };

    peerConnections.current.set(targetUserId, pc);
    return pc;
  }, [safeTransition, updateRemoteStream]);

  // ─── initiateCall ────────────────────────────────────────────────────────────

  const initiateCall = useCallback(async (targetCalleeId, callType = "video") => {
    if (callStateRef.current !== "idle") {
      throw new Error(`Cannot initiate call: current state is '${callStateRef.current}'`);
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCallError("Camera/microphone permission denied. Please allow access and try again.");
        return;
      }
      setCallError(err.message || "Failed to access media devices.");
      return;
    }

    setLocalStream(stream);
    localStreamRef.current = stream;
    safeTransition("initiateCall");
    setCalleeId(targetCalleeId);
    calleeIdRef.current = targetCalleeId;
    setCallError(null);

    const socket = socketRef.current;
    if (socket) {
      socket.emit("call:initiate", { calleeId: targetCalleeId, callType });
    }
  }, [safeTransition]);

  // ─── acceptCall ─────────────────────────────────────────────────────────────

  const acceptCall = useCallback(async (acceptedCallId) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      setCallError(err.message || "Failed to access media devices.");
      return;
    }

    setLocalStream(stream);
    localStreamRef.current = stream;
    safeTransition("accept");
    setCallId(acceptedCallId);
    callIdRef.current = acceptedCallId;

    const socket = socketRef.current;
    if (socket) {
      socket.emit("call:accept", { callId: acceptedCallId });
    }

    // Don't create offer here - wait for the caller to send the offer
    // The caller will create the offer in onCallAccepted handler
    setIncomingCall(null);
  }, [safeTransition]);

  // ─── rejectCall ─────────────────────────────────────────────────────────────

  const rejectCall = useCallback((rejectedCallId) => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("call:reject", { callId: rejectedCallId });
    }
    safeTransition("reject");
    setIncomingCall(null);
  }, [safeTransition]);

  // ─── endCall ────────────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    const socket = socketRef.current;
    const currentCallId = callIdRef.current;
    if (currentCallId && socket) {
      socket.emit("call:end", { callId: currentCallId });
    }
    closeAllPeerConnections();
    stopLocalStream();
    safeTransition("end");
    setCallId(null);
    callIdRef.current = null;
    setCalleeId(null);
    calleeIdRef.current = null;
  }, [safeTransition, closeAllPeerConnections, stopLocalStream]);

  // ─── toggleAudio ────────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const muted = !track.enabled;
    setIsAudioMuted(muted);
    const socket = socketRef.current;
    if (socket) {
      socket.emit("media:toggle-audio", { callId: callIdRef.current, muted });
    }
  }, []);

  // ─── toggleVideo ────────────────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    console.log("[useWebRTC] toggleVideo called");
    const stream = localStreamRef.current;
    if (!stream) {
      console.warn("[useWebRTC] No local stream to toggle video");
      return;
    }
    const track = stream.getVideoTracks()[0];
    if (!track) {
      console.warn("[useWebRTC] No video track found");
      return;
    }
    
    // Toggle the track
    track.enabled = !track.enabled;
    const videoOff = !track.enabled;
    console.log("[useWebRTC] Video track enabled:", track.enabled, "videoOff:", videoOff);
    setIsVideoOff(videoOff);
    
    const socket = socketRef.current;
    if (socket && roomIdRef.current) {
      // For room calls, we don't need to emit this
      console.log("[useWebRTC] Room call - not emitting media toggle event");
    } else if (socket) {
      socket.emit("media:toggle-video", { callId: callIdRef.current, videoOff });
    }
  }, []);

  // ─── startScreenShare ────────────────────────────────────────────────────────

  const stopScreenShare = useCallback(() => {
    const cameraTrack = cameraTrackRef.current;
    for (const [, pc] of peerConnections.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    }
    setIsScreenSharing(false);
    const socket = socketRef.current;
    if (socket) {
      socket.emit("media:screen-share-stopped", { callId: callIdRef.current });
    }
    screenTrackRef.current = null;
  }, []);

  const startScreenShare = useCallback(async () => {
    let screenStream;
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch (err) {
      setCallError(err.message || "Screen share permission denied.");
      return;
    }

    const screenTrack = screenStream.getVideoTracks()[0];
    const stream = localStreamRef.current;
    const cameraTrack = stream ? stream.getVideoTracks()[0] : null;

    // Replace video sender on all peer connections
    for (const [, pc] of peerConnections.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }
    }

    setIsScreenSharing(true);
    screenTrackRef.current = screenTrack;
    cameraTrackRef.current = cameraTrack;

    const socket = socketRef.current;
    if (socket) {
      socket.emit("media:screen-share-started", { callId: callIdRef.current });
    }

    // Auto-stop when user clicks browser's "Stop sharing" button
    screenTrack.onended = () => stopScreenShare();
  }, [stopScreenShare]);

  // ─── switchDevice ────────────────────────────────────────────────────────────

  const switchDevice = useCallback(async (deviceId, kind) => {
    const constraints = {
      [kind === "audioinput" ? "audio" : "video"]: { deviceId: { exact: deviceId } },
    };

    let newStream;
    try {
      newStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      setCallError(err.message || "Failed to switch device.");
      return;
    }

    const isAudio = kind === "audioinput";
    const newTrack = isAudio
      ? newStream.getAudioTracks()[0]
      : newStream.getVideoTracks()[0];

    if (!newTrack) return;

    // Replace sender on all peer connections
    for (const [, pc] of peerConnections.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === newTrack.kind);
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }

    // Update localStream ref tracks
    const stream = localStreamRef.current;
    if (stream) {
      const oldTracks = isAudio ? stream.getAudioTracks() : stream.getVideoTracks();
      oldTracks.forEach((t) => {
        t.stop();
        stream.removeTrack(t);
      });
      stream.addTrack(newTrack);
    }
  }, []);

  // ─── requestMediaAccess ─────────────────────────────────────────────────────

  const requestMediaAccess = useCallback(async (video = true, audio = true) => {
    try {
      // Check current permissions first
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        console.log("[useWebRTC] Camera permission:", cameraPermission.state);
        console.log("[useWebRTC] Microphone permission:", micPermission.state);
      }

      console.log(`[useWebRTC] Requesting media access: video=${video}, audio=${audio}`);
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      console.log("[useWebRTC] Media access granted, tracks:", stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallError(null);
      
      // Initialize video state based on actual track state
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setIsVideoOff(!videoTrack.enabled);
        console.log("[useWebRTC] Initial video state - track enabled:", videoTrack.enabled, "isVideoOff:", !videoTrack.enabled);
      }
      
      // Add tracks to existing peer connections
      const tracks = stream.getTracks();
      for (const [userId, pc] of peerConnections.current) {
        console.log(`[useWebRTC] Adding tracks to existing peer connection for ${userId}`);
        
        // Get existing senders to check if tracks are already added
        const existingSenders = pc.getSenders();
        
        for (const track of tracks) {
          try {
            // Check if this track kind is already being sent
            const existingSender = existingSenders.find(s => s.track?.kind === track.kind);
            
            if (existingSender) {
              // Replace the existing track
              console.log(`[useWebRTC] Replacing ${track.kind} track for ${userId}`);
              await existingSender.replaceTrack(track);
            } else {
              // Add new track
              console.log(`[useWebRTC] Adding ${track.kind} track to peer connection for ${userId}`);
              pc.addTrack(track, stream);
            }
          } catch (err) {
            console.warn(`[useWebRTC] Failed to add/replace ${track.kind} track for ${userId}:`, err.message);
          }
        }
        
        // Renegotiate the connection to include the new tracks
        if (pc.signalingState === "stable") {
          try {
            console.log(`[useWebRTC] Renegotiating connection with ${userId} to include new tracks`);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            const socket = socketRef.current;
            const roomId = roomIdRef.current;
            if (socket && roomId) {
              socket.emit("peer:offer", {
                roomId,
                targetUserId: userId,
                sdp: offer,
              });
            }
          } catch (err) {
            console.error(`[useWebRTC] Failed to renegotiate with ${userId}:`, err);
          }
        } else {
          console.warn(`[useWebRTC] Cannot renegotiate with ${userId} - signaling state is ${pc.signalingState}`);
        }
      }
      
      return stream;
    } catch (err) {
      console.error("[useWebRTC] Media access error:", err);
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCallError("Camera/microphone permission denied. Please allow access and try again.");
      } else if (err.name === "NotReadableError") {
        setCallError("Camera/microphone is being used by another application. Please close other apps and try again.");
      } else if (err.name === "NotFoundError") {
        setCallError("No camera or microphone found. Please connect a device and try again.");
      } else {
        setCallError(err.message || "Failed to access media devices.");
      }
      throw err;
    }
  }, []);

  // ─── joinRoom ────────────────────────────────────────────────────────────────

  const joinRoom = useCallback(async (roomId, requestMedia = false) => {
    console.log(`[useWebRTC] Joining room ${roomId}, requestMedia: ${requestMedia}`);
    
    // Join the room first without media
    const socket = socketRef.current;
    if (socket) {
      roomIdRef.current = roomId;
      socket.emit("room:join", { roomId });
    }

    // NEVER request media automatically - only when explicitly requested
    if (requestMedia && !localStreamRef.current) {
      try {
        console.log("[useWebRTC] Explicitly requesting media access");
        // Try video + audio first
        await requestMediaAccess(true, true);
      } catch (err) {
        console.warn("[useWebRTC] Video access failed, trying audio only:", err);
        try {
          // Fallback to audio only if video fails (camera in use)
          await requestMediaAccess(false, true);
          setCallError("Camera in use by another tab. Joined with audio only.");
        } catch (audioErr) {
          console.error("[useWebRTC] Audio access also failed:", audioErr);
          // Continue with the call even if all media access fails
          setCallError("Media access failed. Click 'Enable Camera' to join with video/audio.");
        }
      }
    } else {
      console.log("[useWebRTC] Joined room without requesting media access");
    }
  }, [requestMediaAccess]);

  // ─── leaveRoom ───────────────────────────────────────────────────────────────

  const leaveRoom = useCallback((roomId) => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit("room:leave", { roomId });
    }
    closeAllPeerConnections();
    stopLocalStream();
    roomIdRef.current = null;
  }, [closeAllPeerConnections, stopLocalStream]);

  // ─── socket event handlers ───────────────────────────────────────────────────

  useEffect(() => {
    const socket = connectVideoSocket();
    socketRef.current = socket;
    if (!socket) return;

    const onCallIncoming = ({ callId: incomingCallId, callerId, callerName, callType }) => {
      setIncomingCall({ callId: incomingCallId, callerId, callerName, callType });
      safeTransition("incomingCall");
    };

    const onCallAccepted = async ({ callId: acceptedCallId }) => {
      setCallId(acceptedCallId);
      callIdRef.current = acceptedCallId;

      const targetId = calleeIdRef.current;
      if (!targetId) return;

      // Check if peer connection already exists (avoid duplicates)
      let pc = peerConnections.current.get(targetId);
      if (!pc) {
        pc = createPeerConnection(targetId);
      }

      // Only create offer if we're in stable state
      if (pc.signalingState !== "stable") {
        console.warn("[useWebRTC] Skipping offer creation in signaling state:", pc.signalingState);
        return;
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", { callId: acceptedCallId, sdp: offer });
      } catch (err) {
        console.error("[useWebRTC] Error creating offer:", err);
        setCallError("Failed to establish connection. Please try again.");
      }
    };

    const onCallRejected = () => {
      safeTransition("callRejected");
      setCalleeId(null);
      calleeIdRef.current = null;
    };

    const onCallCancelled = () => {
      safeTransition("cancelled");
      setIncomingCall(null);
    };

    const onCallOffer = async ({ callId: offerCallId, sdp }) => {
      // Determine the other party's userId
      const otherUserId = calleeIdRef.current || incomingCall?.callerId;
      let pc = peerConnections.current.get(otherUserId);
      if (!pc && otherUserId) {
        pc = createPeerConnection(otherUserId);
      }
      if (!pc) return;

      // Only apply offer when in stable state (ignore duplicates from StrictMode)
      if (pc.signalingState !== "stable") {
        console.warn("[useWebRTC] Ignoring offer in signaling state:", pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { callId: offerCallId, sdp: answer });
      } catch (err) {
        console.error("[useWebRTC] Error handling offer:", err);
        setCallError("Failed to establish connection. Please try again.");
      }
    };

    const onCallAnswer = async ({ sdp }) => {
      const targetId = calleeIdRef.current;
      if (!targetId) return;
      const pc = peerConnections.current.get(targetId);
      if (!pc) return;
      
      // Only apply answer when we're waiting for one (have-local-offer state)
      if (pc.signalingState !== "have-local-offer") {
        console.warn("[useWebRTC] Ignoring answer in signaling state:", pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("[useWebRTC] Error handling answer:", err);
        setCallError("Failed to establish connection. Please try again.");
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      // Try to find the right peer connection
      for (const [, pc] of peerConnections.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[useWebRTC] addIceCandidate error:", err.message);
        }
      }
    };

    const onCallEnded = () => {
      closeAllPeerConnections();
      stopLocalStream();
      safeTransition("end");
      setCallId(null);
      callIdRef.current = null;
      setCalleeId(null);
      calleeIdRef.current = null;
    };

    const onCallUnavailable = () => {
      setCallError("User is unavailable");
      safeTransition("callRejected");
    };

    const onCallError = ({ message }) => {
      setCallError(message || "An error occurred during the call.");
    };

    // ─── group call handlers ─────────────────────────────────────────────────

    const onRoomParticipants = async ({ participants }) => {
      const currentRoomId = roomIdRef.current;
      const currentUserId = user?.id;
      
      console.log(`[useWebRTC] Room participants:`, participants.map(p => p.userId), `(I am ${currentUserId})`);
      
      if (!currentUserId) {
        console.warn("[useWebRTC] No current user ID, cannot establish peer connections");
        return;
      }
      
      for (const participant of participants) {
        // Skip if we already have a peer connection for this user
        if (peerConnections.current.has(participant.userId)) {
          console.log(`[useWebRTC] Skipping ${participant.userId} - peer connection already exists`);
          continue;
        }

        // Only create offer if our userId is lexicographically smaller
        // This prevents both sides from creating offers simultaneously
        if (currentUserId < participant.userId) {
          console.log(`[useWebRTC] Creating offer to ${participant.userId} (I am ${currentUserId})`);
          const pc = createPeerConnection(participant.userId);
          
          // Create offer even without local stream - the other side might have media
          // If we don't have media yet, we'll renegotiate when we get it
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("peer:offer", {
              roomId: currentRoomId,
              targetUserId: participant.userId,
              sdp: offer,
            });
            console.log(`[useWebRTC] Sent offer to ${participant.userId} (hasLocalStream: ${!!localStreamRef.current})`);
          } catch (err) {
            console.error(`[useWebRTC] Error creating offer to ${participant.userId}:`, err);
          }
        } else {
          // Just create the peer connection, wait for the other side to offer
          console.log(`[useWebRTC] Waiting for offer from ${participant.userId} (I am ${currentUserId})`);
          createPeerConnection(participant.userId);
        }
      }
    };

    const onPeerOffer = async ({ roomId, fromUserId, sdp }) => {
      const currentUserId = user?.id;
      console.log(`[useWebRTC] Received peer offer from ${fromUserId} (I am ${currentUserId})`);
      
      let pc = peerConnections.current.get(fromUserId);
      if (!pc) {
        pc = createPeerConnection(fromUserId);
      }
      
      // Only apply offer when in stable state (ignore duplicates from StrictMode)
      if (pc.signalingState !== "stable") {
        console.warn("[useWebRTC] Ignoring peer offer in signaling state:", pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("peer:answer", { roomId, targetUserId: fromUserId, sdp: answer });
        console.log(`[useWebRTC] Sent peer answer to ${fromUserId}`);
      } catch (err) {
        console.error("[useWebRTC] Error handling peer offer:", err);
      }
    };

    const onPeerAnswer = async ({ fromUserId, sdp }) => {
      const currentUserId = user?.id;
      console.log(`[useWebRTC] Received peer answer from ${fromUserId} (I am ${currentUserId})`);
      
      const pc = peerConnections.current.get(fromUserId);
      if (!pc) {
        console.warn("[useWebRTC] No peer connection found for", fromUserId);
        return;
      }
      
      // Only apply answer when we're waiting for one
      if (pc.signalingState !== "have-local-offer") {
        console.warn("[useWebRTC] Ignoring peer answer in signaling state:", pc.signalingState);
        return;
      }

      try {
        const answerDesc = new RTCSessionDescription(sdp);
        console.log(`[useWebRTC] Setting remote description (answer) for ${fromUserId}`);
        await pc.setRemoteDescription(answerDesc);
        console.log(`[useWebRTC] Applied peer answer from ${fromUserId}`);
      } catch (err) {
        console.error("[useWebRTC] Error handling peer answer:", err);
        
        // If SDP order issue, try to recreate the peer connection
        if (err.message.includes("order of m-lines")) {
          console.warn(`[useWebRTC] SDP m-line order issue with ${fromUserId}, recreating connection`);
          closePeerConnection(fromUserId);
          // The other side should retry the offer
        }
      }
    };

    const onPeerIceCandidate = async ({ fromUserId, candidate }) => {
      const pc = peerConnections.current.get(fromUserId);
      if (!pc) {
        console.warn("[useWebRTC] No peer connection found for ICE candidate from", fromUserId);
        return;
      }
      
      // Check if remote description is set before adding ICE candidate
      if (!pc.remoteDescription) {
        console.warn("[useWebRTC] Remote description not set, queuing ICE candidate for", fromUserId);
        // Could implement ICE candidate queuing here if needed
        return;
      }
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`[useWebRTC] Added ICE candidate from ${fromUserId}`);
      } catch (err) {
        console.warn("[useWebRTC] peer:ice-candidate error:", err.message);
      }
    };

    const onPeerDisconnect = ({ userId }) => {
      closePeerConnection(userId);
    };

    const onRoomUserJoined = () => {
      // New user will initiate the offer to us via peer:offer — nothing to do here
    };

    socket.on("call:incoming", onCallIncoming);
    socket.on("call:accepted", onCallAccepted);
    socket.on("call:rejected", onCallRejected);
    socket.on("call:cancelled", onCallCancelled);
    socket.on("call:offer", onCallOffer);
    socket.on("call:answer", onCallAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:ended", onCallEnded);
    socket.on("call:unavailable", onCallUnavailable);
    socket.on("call:error", onCallError);
    socket.on("room:participants", onRoomParticipants);
    socket.on("room:user-joined", onRoomUserJoined);
    socket.on("peer:offer", onPeerOffer);
    socket.on("peer:answer", onPeerAnswer);
    socket.on("peer:ice-candidate", onPeerIceCandidate);
    socket.on("peer:disconnect", onPeerDisconnect);

    return () => {
      socket.off("call:incoming", onCallIncoming);
      socket.off("call:accepted", onCallAccepted);
      socket.off("call:rejected", onCallRejected);
      socket.off("call:cancelled", onCallCancelled);
      socket.off("call:offer", onCallOffer);
      socket.off("call:answer", onCallAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:ended", onCallEnded);
      socket.off("call:unavailable", onCallUnavailable);
      socket.off("call:error", onCallError);
      socket.off("room:participants", onRoomParticipants);
      socket.off("room:user-joined", onRoomUserJoined);
      socket.off("peer:offer", onPeerOffer);
      socket.off("peer:answer", onPeerAnswer);
      socket.off("peer:ice-candidate", onPeerIceCandidate);
      socket.off("peer:disconnect", onPeerDisconnect);
      disconnectVideoSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    localStream,
    remoteStreams,
    callState,
    callId,
    incomingCall,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    callError,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchDevice,
    requestMediaAccess,
    releaseMediaDevices,
    joinRoom,
    leaveRoom,
  };
}
