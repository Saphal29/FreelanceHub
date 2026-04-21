# Implementation Plan: WebRTC Video Calls

## Overview

Implement real-time 1-to-1 and small group (2–4 person) video/audio calling in FreelanceHub. The backend adds a `/video` Socket.io namespace for signaling and new REST routes for call management. The frontend adds a `useWebRTC` hook, call UI components, and a notification manager. Implementation follows four phases: DB + infrastructure → 1-to-1 MVP → media controls + screen share → group mesh calls + scheduling.

## Tasks

- [x] 1. Database migration — create call tables
  - Create `backend/migrations/009_create_call_tables.sql` with all five tables: `call_rooms`, `calls`, `call_participants`, `call_logs`, `scheduled_calls`, `scheduled_call_participants`
  - Add CHECK constraint on `calls.status` for the eight allowed values
  - Add CHECK constraint on `calls.call_type` for `video` and `audio`
  - Add CHECK constraint on `call_rooms.max_participants` between 2 and 4
  - Add trigger or CHECK constraint enforcing `scheduled_calls.scheduled_at > NOW()` at insert time
  - Add UNIQUE constraint on `scheduled_calls.meeting_url`
  - Add UNIQUE constraint on `scheduled_call_participants(meeting_id, user_id)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 1.1 Write property test for DB schema constraints
    - **Property 1: Valid Call Status Enum** — insert each valid status, assert accepted; insert invalid string, assert rejected
    - **Property 2: Valid Call Type Enum** — insert `video`/`audio`, assert accepted; insert other string, assert rejected
    - **Property 3: Room Participant Count Constraint** — insert values 2–4, assert accepted; insert 1 and 5, assert rejected
    - **Property 4: Scheduled Call Future Timestamp** — insert future timestamp, assert accepted; insert past timestamp, assert rejected
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.10**

- [x] 2. Backend — CallService and RoomService
  - Create `backend/src/services/callService.js` implementing `initiateCall`, `acceptCall`, `rejectCall`, `endCall`, `getCall`, `getCallHistory`
  - Implement `endCall` to compute `duration = Math.floor((end_time - start_time) / 1000)` and store 0 when equal
  - Set `start_time` when call status transitions to `'connected'`
  - Create `backend/src/services/roomService.js` implementing `createRoom`, `joinRoom`, `leaveRoom`, `getRoom`, `getRoomParticipants`, `muteParticipant`, `removeParticipant`
  - `joinRoom` must enforce `max_participants` limit and throw a typed `ROOM_FULL` error when exceeded
  - `leaveRoom` must set room `status = 'ended'` and `ended_at = NOW()` when the last participant leaves
  - _Requirements: 7.2, 7.5, 13.2, 13.3, 13.4, 13.6, 18.1, 19.1, 19.2, 19.3_

  - [ ]* 2.1 Write property test for call duration computation
    - **Property 8: Call Duration Computation** — for any `start_time` S and `end_time` E where E ≥ S, assert `duration === Math.floor((E - S) / 1000)`; assert duration is 0 when E equals S
    - **Validates: Requirements 7.5, 19.1, 19.2**

  - [ ]* 2.2 Write unit tests for CallService and RoomService
    - Test `initiateCall` creates correct DB record and returns formatted call object
    - Test `endCall` computes duration correctly from start/end timestamps
    - Test `joinRoom` returns 409-equivalent error when room is full
    - Test `leaveRoom` sets room to `'ended'` when last participant leaves
    - _Requirements: 7.2, 13.3, 13.6, 19.1_

- [x] 3. Backend — ScheduledCallService
  - Create `backend/src/services/scheduledCallService.js` implementing `scheduleCall`, `getScheduled`, `joinByMeetingId`, `cancelScheduled`
  - `scheduleCall` must validate `scheduled_at > Date.now()` at the application layer and return HTTP 400 if not
  - Generate `meeting_url` as `/calls/join/:meeting_id` using the UUID primary key
  - `cancelScheduled` must verify the requesting user is the host before updating status to `'cancelled'`
  - _Requirements: 17.1, 17.2, 17.3, 17.5, 17.6, 17.7_

  - [ ]* 3.1 Write property test for meeting URL uniqueness
    - **Property 15: Meeting URL Uniqueness** — generate N scheduled calls, assert all `meeting_url` values are distinct
    - **Validates: Requirement 17.2**

  - [ ]* 3.2 Write unit tests for ScheduledCallService
    - Test `scheduleCall` rejects past `scheduled_at` with descriptive error
    - Test `cancelScheduled` returns 403 for non-host users
    - _Requirements: 17.3, 17.7_

- [x] 4. Backend — call and room REST routes
  - Create `backend/src/controllers/callController.js` with handlers for all call and room endpoints
  - Create `backend/src/routes/callRoutes.js` registering:
    - `POST /api/calls/initiate` — returns `{ callId, roomId, status: 'initiated' }`; 404 if callee not found; 409 if callee already in active call
    - `POST /api/calls/:callId/end` — 403 if requester is not a participant
    - `GET /api/calls/:callId` — 403 if requester is not a participant
    - `GET /api/calls/history` — paginated, ordered by `created_at` DESC
    - `POST /api/rooms` — creates room, returns `room_id`
    - `GET /api/rooms/:roomId`
    - `POST /api/rooms/:roomId/join` — 409 with `ROOM_FULL` when full
    - `POST /api/rooms/:roomId/leave`
    - `POST /api/calls/schedule`
    - `GET /api/calls/scheduled`
    - `GET /api/calls/join/:meetingId`
    - `DELETE /api/calls/scheduled/:meetingId`
  - Register `callRoutes` in `backend/src/server.js` under `/api`
  - _Requirements: 12.2, 12.3, 12.4, 13.1, 13.3, 13.5, 17.1, 17.3, 17.4, 17.5, 17.6, 17.7, 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 4.1 Write unit tests for call REST controllers
    - Test `POST /api/calls/initiate` returns 404 for unknown callee
    - Test `POST /api/calls/initiate` returns 409 when callee is busy
    - Test `POST /api/calls/:callId/end` returns 403 for non-participant
    - Test `GET /api/calls/:callId` returns 403 for non-participant
    - _Requirements: 18.2, 18.3, 18.5, 12.4_

- [x] 5. Checkpoint — ensure all backend unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend — VideoSignalingHandler (`/video` namespace)
  - Create `backend/src/socket/videoSignalingHandler.js` with a `/video` Socket.io namespace
  - Reuse the JWT middleware pattern from `socketHandler.js` to authenticate every connection; reject missing/expired/malformed tokens immediately
  - On connection, join the socket to `user:<userId>` room
  - Implement 1-to-1 signaling event handlers: `call:initiate`, `call:accept`, `call:reject`, `call:cancel`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:end`
  - For each relay event, verify the emitting user is a participant of the referenced call before forwarding; reject non-participants silently
  - Relay SDP and ICE payloads byte-for-byte without modification
  - Implement media control relay: `media:toggle-audio`, `media:toggle-video`, `media:screen-share-started`, `media:screen-share-stopped`
  - Implement group room events: `room:join`, `room:leave`, `peer:offer`, `peer:answer`, `peer:ice-candidate`
  - Implement host control events: `host:mute-all`, `host:remove-participant`; reject if emitter is not the room host
  - Emit `peer:disconnect` to remaining participants when a participant disconnects
  - Add per-user rate limiting: reject `call:initiate` beyond 10 events per 60-second window; emit error event to caller when rejected
  - Register `initVideoSignaling` in `backend/src/server.js` by passing the `io` instance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 4.3, 4.5, 4.7, 6.1, 6.2, 6.3, 6.4, 7.3, 14.1, 14.5, 15.1, 15.2, 15.3, 21.1, 21.2_

  - [ ]* 6.1 Write property test for JWT authentication enforcement
    - **Property 5: JWT Authentication Applies to All Connections** — attempt connections with valid token (assert accepted), missing token (assert rejected), expired token (assert rejected), malformed token (assert rejected)
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 6.2 Write property test for signaling authorization
    - **Property 6: Signaling Authorization — Participant-Only Relay** — for any signaling event from a non-participant user, assert the event is never relayed to any peer
    - **Validates: Requirements 2.5, 2.6**

  - [ ]* 6.3 Write property test for signaling relay fidelity
    - **Property 7: Signaling Relay Fidelity** — for any SDP or ICE payload P, assert the payload received by the target peer is byte-for-byte identical to P
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 6.4 Write property test for rate limit enforcement
    - **Property 16: Rate Limit Enforcement** — emit 11+ `call:initiate` events within 60 seconds, assert events 11+ are rejected with an error event
    - **Validates: Requirement 21.1**

  - [ ]* 6.5 Write property test for host-only control enforcement
    - **Property 17: Host-Only Control Enforcement** — for any non-host user, assert `host:mute-all` and `host:remove-participant` are always rejected without relay
    - **Validates: Requirement 15.3**

  - [ ]* 6.6 Write integration tests for VideoSignalingHandler
    - Use two Socket.io test clients on `/video` namespace
    - Test full 1-to-1 call flow: `call:initiate` → `call:incoming` → `call:accept` → `call:accepted` → offer/answer/ICE exchange → `call:end` → `call:ended`
    - Test callee offline path: `call:initiate` → `call:unavailable` + status set to `'missed'`
    - _Requirements: 3.2, 3.3, 4.3, 4.5, 4.7, 7.3_

- [x] 7. Frontend — ICE config and video socket setup
  - Create `frontend/lib/iceConfig.js` exporting `ICE_CONFIG` with two Google STUN servers, optional TURN server from env vars, and `iceCandidatePoolSize: 10`
  - Create `frontend/lib/videoSocket.js` that creates and exports a singleton Socket.io client connected to the `/video` namespace, reusing the token from `localStorage`
  - _Requirements: 22.1, 22.2, 22.3_

- [x] 8. Frontend — call state machine utility
  - Create `frontend/lib/callStateMachine.js` exporting a `transition(currentState, event)` function
  - Implement all valid transitions: `idle+initiateCall→calling`, `idle+incomingCall→ringing`, `calling+callAccepted→connected`, `calling+callRejected→idle`, `calling+cancel→idle`, `ringing+accept→connected`, `ringing+reject→idle`, `ringing+cancelled→idle`, `connected+end→ended`, any state + `iceFailure→failed`
  - Throw an error for any undefined transition
  - _Requirements: 20.1, 20.2_

  - [ ]* 8.1 Write property test for valid call state transitions
    - **Property 13: Valid Call State Transitions** — for every defined (state, event) pair, assert `transition` returns the correct next state and the result is always one of the six valid state strings
    - **Validates: Requirement 20.1**

  - [ ]* 8.2 Write property test for invalid state transitions
    - **Property 14: Invalid State Transitions Throw** — for any (state, event) pair not in the transition table, assert `transition` throws and does not return a value
    - **Validates: Requirement 20.2**

- [x] 9. Frontend — `useWebRTC` hook (1-to-1 core)
  - Create `frontend/hooks/useWebRTC.js` managing `localStream`, `remoteStreams` (Map), `callState`, `isAudioMuted`, `isVideoOff`, `isScreenSharing`, and `peerConnections` (Map)
  - Implement `initiateCall(calleeId, callType)`: guard on `callState === 'idle'`, call `getUserMedia`, emit `call:initiate`, transition state to `'calling'`; surface `NotAllowedError` to UI and keep state `'idle'` on permission denial
  - Implement `acceptCall(callId)`: call `getUserMedia`, emit `call:accept`, transition to `'ringing'`
  - Implement `rejectCall(callId)`: emit `call:reject`, transition to `'idle'`
  - Implement `endCall()`: close all peer connections, stop all local tracks, emit `call:end`, transition to `'ended'`
  - Implement `createPeerConnection(targetUserId)` using `ICE_CONFIG`: add local tracks, wire `onicecandidate` to emit `call:ice-candidate`, wire `ontrack` to update `remoteStreams`, wire `onconnectionstatechange` to transition state and trigger ICE restart on failure
  - Handle incoming socket events: `call:incoming`, `call:accepted`, `call:rejected`, `call:cancelled`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:ended`
  - Use `callStateMachine.transition` for all state changes
  - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.2, 4.4, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 7.1, 7.4, 20.1, 20.2_

  - [ ]* 9.1 Write unit tests for `useWebRTC` hook state transitions
    - Test `initiateCall` transitions `callState` from `idle` to `calling`
    - Test `initiateCall` keeps `callState` as `idle` when `getUserMedia` throws `NotAllowedError`
    - Test `initiateCall` rejects when `callState` is not `idle`
    - Test `endCall` closes peer connections and stops tracks
    - _Requirements: 3.4, 3.5, 3.6, 7.1_

- [x] 10. Frontend — media controls and screen sharing
  - Add `toggleAudio()` to `useWebRTC`: flip `audioTrack.enabled`, update `isAudioMuted`, emit `media:toggle-audio`
  - Add `toggleVideo()` to `useWebRTC`: flip `videoTrack.enabled`, update `isVideoOff`, emit `media:toggle-video`
  - Add `startScreenShare()`: call `getDisplayMedia`, replace video sender track on all peer connections, set `isScreenSharing = true`, emit `media:screen-share-started`; wire `screenTrack.onended` to call `stopScreenShare`; surface error and keep `isScreenSharing = false` if `getDisplayMedia` is denied
  - Add `stopScreenShare()`: replace screen track with original camera track on all senders, set `isScreenSharing = false`, emit `media:screen-share-stopped`
  - Add `switchDevice(deviceId, kind)`: acquire new stream with specified device, replace sender track on all peer connections; surface error and keep current device if device is unavailable
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 16.1, 16.2, 16.3_

  - [ ]* 10.1 Write property test for media toggle round-trip
    - **Property 9: Media Toggle Round-Trip** — for any track, toggling an even number of times returns to original state; toggling an odd number of times inverts it
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 10.2 Write property test for mute state consistency
    - **Property 10: Mute State Reflects Track State** — after every toggle, assert `isAudioMuted === !audioTrack.enabled` and `isVideoOff === !videoTrack.enabled`
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 10.3 Write property test for screen share round-trip
    - **Property 11: Screen Share Round-Trip** — start screen share then stop, assert all video senders are back to the original camera track
    - **Validates: Requirements 9.4, 9.5**

- [x] 11. Frontend — ICE failure recovery
  - In `createPeerConnection`, when `connectionState === 'failed'`, call `pc.restartIce()` and re-emit the offer; track attempt count
  - After 3 failed restart attempts, transition `callState` to `'failed'`, surface error to UI, and emit a `call:log` event to the backend to record the failure in `call_logs`
  - Handle `call:unavailable` socket event: surface "user unavailable" error to UI
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 12. Frontend — group mesh call support in `useWebRTC`
  - Add `joinRoom(roomId)` to `useWebRTC`: emit `room:join`, handle `room:participants` response by creating one `RTCPeerConnection` per existing participant and emitting `peer:offer` to each
  - Handle `peer:offer` event: create peer connection for the offering peer, set remote description, create and emit `peer:answer`
  - Handle `peer:answer` event: set remote description on the corresponding peer connection
  - Handle `peer:ice-candidate` event: add candidate to the corresponding peer connection
  - Handle `peer:disconnect` event: close and remove the peer connection for the disconnected user, remove their stream from `remoteStreams`
  - Add `leaveRoom(roomId)`: emit `room:leave`, close all peer connections, stop local tracks
  - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 12.1 Write property test for mesh connection count
    - **Property 12: Mesh Connection Count** — for a room with N participants (2 ≤ N ≤ 4), assert total peer connections across all participants equals N*(N-1)/2
    - **Validates: Requirements 14.1, 14.2**

- [x] 13. Checkpoint — ensure all frontend unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Frontend — `CallNotificationManager` component
  - Create `frontend/components/calls/CallNotificationManager.jsx`
  - On mount, request push notification permission if not already granted; register push subscription with `POST /api/calls/push-subscribe` once permission is granted
  - Listen for `call:incoming` socket event and display an incoming call modal with caller name, avatar, accept and reject buttons
  - On missed call (socket event or poll), display a missed call badge in the UI
  - Export `useCallNotifications` hook for consuming components to access `incomingCall` state and `acceptCall`/`rejectCall` handlers
  - _Requirements: 4.1, 11.1, 11.3, 11.4_

- [x] 15. Frontend — call UI components
  - Create `frontend/components/calls/CallControls.jsx`: renders mute, video toggle, screen share, end call, and device selector buttons; reads state from `useWebRTC`
  - Create `frontend/components/calls/VideoGrid.jsx`: renders local video (muted) and one `<video>` element per remote stream from `remoteStreams`; handles 1-to-1 and group (2–4) layouts
  - Create `frontend/components/calls/CallButton.jsx`: a reusable button that triggers `initiateCall` for a given user; accepts `calleeId`, `callType`, and `calleeName` props
  - _Requirements: 3.1, 7.1, 8.1, 8.3, 9.1_

- [ ] 16. Frontend — call pages and routing
  - Create `frontend/app/calls/page.jsx`: call history page using `GET /api/calls/history`; displays past calls with duration, type, and status
  - Create `frontend/app/calls/[callId]/page.jsx`: active call page rendering `VideoGrid` and `CallControls`; initializes `useWebRTC` and connects to the `/video` namespace on mount
  - Create `frontend/app/calls/join/[meetingId]/page.jsx`: scheduled meeting join page; calls `GET /api/calls/join/:meetingId` to resolve `roomId`, then joins the room via `useWebRTC`
  - Add call API functions to `frontend/lib/api.js`: `initiateCallApi`, `endCallApi`, `getCallHistory`, `getCallById`, `createRoom`, `joinRoomApi`, `scheduleCall`, `getScheduledCalls`, `joinMeeting`, `cancelScheduledCall`
  - _Requirements: 12.1, 12.2, 12.3, 17.4, 17.5_

- [ ] 17. Wire `CallNotificationManager` into app layout
  - Import and render `<CallNotificationManager />` inside `frontend/app/layout.jsx` (or the root provider tree) so incoming call notifications are available app-wide
  - Ensure the video socket connects only when the user is authenticated (mirror the pattern in `SocketContext.jsx`)
  - _Requirements: 4.1, 11.2, 11.3_

- [ ] 18. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already a common Jest companion; install with `npm install --save-dev fast-check` in the backend)
- The `/video` Socket.io namespace is separate from the existing default namespace in `socketHandler.js` — no changes to existing chat socket code are needed
- TURN server credentials are read from `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USER`, `NEXT_PUBLIC_TURN_CRED` env vars on the frontend
- The `web-push` npm package is needed for push notifications: `npm install web-push` in the backend
- All call REST routes require the existing `authMiddleware` for authentication
