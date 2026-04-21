# Requirements Document

## Introduction

This document defines the requirements for the WebRTC Video Calls feature in FreelanceHub. The feature enables real-time 1-to-1 and small group (2–4 person) video and audio calls between clients and freelancers. It is built on WebRTC for peer-to-peer media transport, with Socket.io handling signaling via a dedicated `/video` namespace. The system covers call initiation, media controls, screen sharing, group mesh calls, push notifications, and scheduled meetings.

## Glossary

- **VideoSignalingHandler**: The Socket.io `/video` namespace handler on the backend that relays all WebRTC signaling events and manages call/room state.
- **CallService**: Backend service responsible for 1-to-1 call lifecycle business logic and persistence.
- **RoomService**: Backend service responsible for group call room management.
- **ScheduledCallService**: Backend service responsible for meeting scheduling, calendar invites, and shareable URLs.
- **useWebRTC**: Frontend React hook that encapsulates all WebRTC peer connection logic, media stream management, and signaling socket events.
- **CallNotificationManager**: Frontend component that handles incoming call UI (ringtone, browser push notifications, missed call badges).
- **RTCPeerConnection**: The browser's native WebRTC peer connection object.
- **ICE**: Interactive Connectivity Establishment — the protocol used to find the best network path between peers.
- **STUN**: Session Traversal Utilities for NAT — a server that helps peers discover their public IP addresses.
- **TURN**: Traversal Using Relays around NAT — a relay server used when direct peer-to-peer connection fails.
- **SDP**: Session Description Protocol — the format used to describe media capabilities in WebRTC offers and answers.
- **Mesh**: A group call topology where every participant connects directly to every other participant.
- **MeshConnection**: A single RTCPeerConnection between two participants in a group call.
- **CallState**: The current state of a call from the perspective of a single user: `idle`, `calling`, `ringing`, `connected`, `ended`, or `failed`.
- **System**: The FreelanceHub WebRTC video calling system as a whole.
- **DB**: The PostgreSQL database used for persisting call metadata.

---

## Requirements

### Requirement 1: Database Schema

**User Story:** As a system architect, I want a well-defined database schema for call metadata, so that all call events and participants are reliably persisted.

#### Acceptance Criteria

1. THE DB SHALL contain a `calls` table with columns: `call_id` (UUID PK), `caller_id` (UUID FK), `receiver_id` (UUID FK nullable), `room_id` (UUID FK nullable), `status` (VARCHAR), `call_type` (VARCHAR), `start_time` (TIMESTAMP nullable), `end_time` (TIMESTAMP nullable), `duration` (INTEGER nullable), `created_at`, `updated_at`.
2. THE DB SHALL enforce that `calls.status` is one of: `initiated`, `ringing`, `connected`, `ended`, `rejected`, `cancelled`, `failed`, `missed`.
3. THE DB SHALL enforce that `calls.call_type` is one of: `video`, `audio`.
4. THE DB SHALL contain a `call_rooms` table with columns: `room_id` (UUID PK), `host_id` (UUID FK), `room_name` (VARCHAR nullable), `max_participants` (INTEGER), `status` (VARCHAR), `created_at`, `ended_at` (TIMESTAMP nullable).
5. THE DB SHALL enforce that `call_rooms.max_participants` is between 2 and 4 inclusive.
6. THE DB SHALL contain a `call_participants` table with columns: `id` (UUID PK), `call_id` (UUID FK nullable), `room_id` (UUID FK nullable), `user_id` (UUID FK), `joined_at`, `left_at` (TIMESTAMP nullable), `is_muted` (BOOLEAN), `is_video_off` (BOOLEAN).
7. THE DB SHALL contain a `call_logs` table with columns: `id` (UUID PK), `call_id` (UUID FK), `user_id` (UUID FK), `event` (VARCHAR), `metadata` (JSONB nullable), `created_at`.
8. THE DB SHALL contain a `scheduled_calls` table with columns: `meeting_id` (UUID PK), `host_id` (UUID FK), `title` (VARCHAR), `scheduled_at` (TIMESTAMP), `duration_mins` (INTEGER), `meeting_url` (TEXT UNIQUE), `status` (VARCHAR), `created_at`.
9. THE DB SHALL contain a `scheduled_call_participants` table with a unique constraint on `(meeting_id, user_id)`.
10. THE DB SHALL enforce that `scheduled_calls.scheduled_at` is strictly greater than the current timestamp at the time of insertion.

---

### Requirement 2: Authentication and Authorization

**User Story:** As a security-conscious platform operator, I want all video call connections and signaling events to be authenticated and authorized, so that only legitimate participants can exchange media and call data.

#### Acceptance Criteria

1. THE VideoSignalingHandler SHALL authenticate every incoming socket connection to the `/video` namespace before allowing any events.
2. WHEN a socket connection to the `/video` namespace is attempted without a valid JWT token, THE VideoSignalingHandler SHALL reject the connection immediately.
3. WHEN a socket connection to the `/video` namespace is attempted with an expired or malformed JWT token, THE VideoSignalingHandler SHALL reject the connection immediately.
4. WHEN a socket connection to the `/video` namespace is attempted with a valid JWT token, THE VideoSignalingHandler SHALL allow the connection and associate the socket with the authenticated user.
5. WHEN a signaling event referencing a call or room is received, THE VideoSignalingHandler SHALL verify that the emitting user is a recorded participant of that call or room before relaying the event.
6. IF a signaling event is received from a user who is not a participant of the referenced call or room, THEN THE VideoSignalingHandler SHALL reject the event without relaying it.

---

### Requirement 3: 1-to-1 Call Initiation

**User Story:** As a client or freelancer, I want to initiate a video or audio call with another user, so that I can communicate in real time.

#### Acceptance Criteria

1. WHEN a user invokes `initiateCall` with a valid `calleeId` and `callType`, THE useWebRTC hook SHALL emit a `call:initiate` event to the VideoSignalingHandler.
2. WHEN `call:initiate` is received, THE VideoSignalingHandler SHALL create a call record in the DB with `status = 'initiated'` and emit `call:incoming` to the callee.
3. WHEN `call:initiate` is received and the callee is not connected to the `/video` namespace, THE VideoSignalingHandler SHALL set the call record `status` to `'missed'` and emit `call:unavailable` to the caller.
4. WHEN `initiateCall` is invoked, THE useWebRTC hook SHALL transition `callState` from `idle` to `calling`.
5. IF `initiateCall` is invoked when `callState` is not `idle`, THEN THE useWebRTC hook SHALL reject the invocation without creating a new call.
6. IF the user has not granted camera or microphone permissions when `initiateCall` is invoked for a video call, THEN THE useWebRTC hook SHALL surface a permission error to the UI and keep `callState` as `idle`.

---

### Requirement 4: 1-to-1 Call Acceptance and Rejection

**User Story:** As a callee, I want to accept or reject incoming calls, so that I have control over when I enter a call.

#### Acceptance Criteria

1. WHEN a callee receives `call:incoming`, THE CallNotificationManager SHALL display an incoming call notification with the caller's name and avatar.
2. WHEN a callee accepts a call, THE useWebRTC hook SHALL emit `call:accept` to the VideoSignalingHandler and transition `callState` to `ringing`.
3. WHEN `call:accept` is received, THE VideoSignalingHandler SHALL emit `call:accepted` to the caller and update the call record `status` to `'ringing'`.
4. WHEN a callee rejects a call, THE useWebRTC hook SHALL emit `call:reject` to the VideoSignalingHandler and transition `callState` to `idle`.
5. WHEN `call:reject` is received, THE VideoSignalingHandler SHALL emit `call:rejected` to the caller and update the call record `status` to `'rejected'`.
6. WHEN a caller cancels an outgoing call, THE useWebRTC hook SHALL emit `call:cancel` to the VideoSignalingHandler and transition `callState` to `idle`.
7. WHEN `call:cancel` is received, THE VideoSignalingHandler SHALL emit `call:cancelled` to the callee and update the call record `status` to `'cancelled'`.

---

### Requirement 5: WebRTC Peer Connection Setup

**User Story:** As a user in a call, I want a reliable peer-to-peer media connection to be established automatically, so that I can see and hear the other party without manual configuration.

#### Acceptance Criteria

1. WHEN a call is accepted, THE useWebRTC hook SHALL acquire a local media stream via `getUserMedia` before creating the RTCPeerConnection.
2. WHEN creating an RTCPeerConnection, THE useWebRTC hook SHALL configure it with at least one STUN server and the optional TURN server from environment variables.
3. WHEN an RTCPeerConnection is created, THE useWebRTC hook SHALL add all local media tracks to the connection.
4. WHEN the caller's RTCPeerConnection is ready, THE useWebRTC hook SHALL create an SDP offer, set it as the local description, and emit `call:offer` to the VideoSignalingHandler.
5. WHEN `call:offer` is received by the callee, THE useWebRTC hook SHALL set the remote description, create an SDP answer, set it as the local description, and emit `call:answer`.
6. WHEN `call:answer` is received by the caller, THE useWebRTC hook SHALL set the remote description on the RTCPeerConnection.
7. WHEN an ICE candidate is generated, THE useWebRTC hook SHALL emit `call:ice-candidate` to the VideoSignalingHandler for relay to the remote peer.
8. WHEN `call:ice-candidate` is received, THE useWebRTC hook SHALL add the candidate to the appropriate RTCPeerConnection.
9. WHEN the RTCPeerConnection `connectionState` becomes `connected`, THE useWebRTC hook SHALL transition `callState` to `connected`.

---

### Requirement 6: Signaling Relay Fidelity

**User Story:** As a developer, I want the signaling server to relay SDP and ICE payloads without modification, so that WebRTC negotiation succeeds correctly.

#### Acceptance Criteria

1. WHEN `call:offer` is received by the VideoSignalingHandler, THE VideoSignalingHandler SHALL relay the SDP payload byte-for-byte to the target peer.
2. WHEN `call:answer` is received by the VideoSignalingHandler, THE VideoSignalingHandler SHALL relay the SDP payload byte-for-byte to the target peer.
3. WHEN `call:ice-candidate` is received by the VideoSignalingHandler, THE VideoSignalingHandler SHALL relay the ICE candidate payload byte-for-byte to the target peer.
4. WHEN `peer:offer`, `peer:answer`, or `peer:ice-candidate` is received by the VideoSignalingHandler for a group call, THE VideoSignalingHandler SHALL relay the payload byte-for-byte to the specified target peer.

---

### Requirement 7: Call Termination and Duration

**User Story:** As a user, I want to end a call at any time and have the call duration recorded accurately, so that I have a reliable call history.

#### Acceptance Criteria

1. WHEN a user ends a call, THE useWebRTC hook SHALL close all RTCPeerConnection instances, stop all local media tracks, and emit `call:end` to the VideoSignalingHandler.
2. WHEN `call:end` is received, THE CallService SHALL update the call record with `status = 'ended'`, `end_time = NOW()`, and `duration` computed as the integer number of seconds between `start_time` and `end_time`.
3. WHEN `call:end` is received, THE VideoSignalingHandler SHALL emit `call:ended` to all other participants.
4. WHEN `call:ended` is received, THE useWebRTC hook SHALL transition `callState` to `ended`.
5. WHEN `end_time` equals `start_time`, THE CallService SHALL store `duration` as 0.

---

### Requirement 8: Audio and Video Media Controls

**User Story:** As a user in a call, I want to mute my microphone and turn off my camera independently, so that I can control my media presence during the call.

#### Acceptance Criteria

1. WHEN a user toggles audio, THE useWebRTC hook SHALL flip the `enabled` property of the local audio track.
2. WHEN a user toggles audio, THE useWebRTC hook SHALL emit `media:toggle-audio` with the new muted state to the VideoSignalingHandler for relay to remote peers.
3. WHEN a user toggles video, THE useWebRTC hook SHALL flip the `enabled` property of the local video track.
4. WHEN a user toggles video, THE useWebRTC hook SHALL emit `media:toggle-video` with the new video-off state to the VideoSignalingHandler for relay to remote peers.
5. WHILE audio is toggled, THE useWebRTC hook SHALL keep `isAudioMuted` equal to `!audioTrack.enabled`.
6. WHILE video is toggled, THE useWebRTC hook SHALL keep `isVideoOff` equal to `!videoTrack.enabled`.

---

### Requirement 9: Screen Sharing

**User Story:** As a user in a connected call, I want to share my screen with the other party, so that I can present work or collaborate visually.

#### Acceptance Criteria

1. WHEN a user starts screen sharing, THE useWebRTC hook SHALL acquire a screen capture stream via `getDisplayMedia`.
2. WHEN a screen capture stream is acquired, THE useWebRTC hook SHALL replace the video sender track on all active RTCPeerConnections with the screen track.
3. WHEN screen sharing starts, THE useWebRTC hook SHALL emit `media:screen-share-started` to the VideoSignalingHandler for relay to remote peers.
4. WHEN the user stops screen sharing (either via the UI or via the browser's native stop button), THE useWebRTC hook SHALL replace the screen track on all video senders with the original camera track.
5. WHEN screen sharing stops, THE useWebRTC hook SHALL emit `media:screen-share-stopped` to the VideoSignalingHandler for relay to remote peers.
6. IF `getDisplayMedia` is denied by the user, THEN THE useWebRTC hook SHALL keep `isScreenSharing` as `false` and surface an error to the UI.

---

### Requirement 10: ICE Failure Recovery

**User Story:** As a user in a call, I want the system to attempt automatic recovery when the peer connection fails, so that transient network issues do not permanently drop the call.

#### Acceptance Criteria

1. WHEN `RTCPeerConnection.connectionState` becomes `failed`, THE useWebRTC hook SHALL attempt an ICE restart via `pc.restartIce()` and re-emit the offer.
2. WHEN ICE restart fails after 3 consecutive attempts, THE useWebRTC hook SHALL transition `callState` to `failed`, notify the user, and log the failure event to `call_logs`.
3. WHEN the TURN server is unreachable and all ICE candidates fail, THE useWebRTC hook SHALL transition `callState` to `failed` and surface an error to the user.

---

### Requirement 11: Push Notifications for Incoming Calls

**User Story:** As a user, I want to receive a browser push notification when someone calls me while I am not on the call page, so that I do not miss incoming calls.

#### Acceptance Criteria

1. WHEN a user grants push notification permission, THE CallNotificationManager SHALL register a push subscription with the backend.
2. WHEN a callee is offline or not connected to the `/video` namespace, THE VideoSignalingHandler SHALL send a push notification to the callee's registered subscription.
3. WHEN a missed call occurs, THE CallNotificationManager SHALL display a missed call badge in the UI.
4. WHEN a user has not granted push notification permission, THE CallNotificationManager SHALL request permission before attempting to register a subscription.

---

### Requirement 12: Call History

**User Story:** As a user, I want to view my call history, so that I can review past calls and missed calls.

#### Acceptance Criteria

1. THE CallService SHALL expose a `getCallHistory` method that returns a paginated list of calls for a given user.
2. WHEN `GET /api/calls/history` is requested by an authenticated user, THE System SHALL return a paginated list of calls involving that user, ordered by `created_at` descending.
3. WHEN `GET /api/calls/:callId` is requested by an authenticated user who is a participant of that call, THE System SHALL return the full call details.
4. IF `GET /api/calls/:callId` is requested by a user who is not a participant of that call, THEN THE System SHALL return a 403 error.

---

### Requirement 13: Group Call Room Management

**User Story:** As a host, I want to create and manage a group call room with up to 4 participants, so that I can facilitate multi-party video calls.

#### Acceptance Criteria

1. WHEN `POST /api/rooms` is requested by an authenticated user, THE System SHALL create a `call_rooms` record with the requesting user as host and return the `room_id`.
2. WHEN `POST /api/rooms/:roomId/join` is requested, THE RoomService SHALL add the user to the room's participant list and return the current participant list.
3. WHEN `POST /api/rooms/:roomId/join` is requested and the room already has `max_participants` active participants, THE System SHALL return HTTP 409 with `{ error: 'Room is full', code: 'ROOM_FULL' }`.
4. WHEN `POST /api/rooms/:roomId/leave` is requested, THE RoomService SHALL remove the user from the room's participant list.
5. WHEN `GET /api/rooms/:roomId` is requested, THE System SHALL return the room details and current participant list.
6. WHEN the last participant leaves a room, THE RoomService SHALL update the room `status` to `'ended'` and set `ended_at` to the current timestamp.
7. THE System SHALL enforce that `call_rooms.max_participants` is between 2 and 4 inclusive at the application layer.

---

### Requirement 14: Group Mesh Call Signaling

**User Story:** As a participant joining a group call, I want peer connections to be established automatically with all existing participants, so that I can see and hear everyone in the room.

#### Acceptance Criteria

1. WHEN a user joins a room via `room:join`, THE VideoSignalingHandler SHALL emit `room:participants` to the joining user with the list of existing participants.
2. WHEN `room:participants` is received, THE useWebRTC hook SHALL create one RTCPeerConnection per existing participant.
3. WHEN `room:participants` is received, THE useWebRTC hook SHALL create and emit a `peer:offer` to each existing participant via the VideoSignalingHandler.
4. WHEN `peer:offer` is received by an existing participant, THE useWebRTC hook SHALL create and emit a `peer:answer` back via the VideoSignalingHandler.
5. WHEN a participant disconnects from a group room, THE VideoSignalingHandler SHALL emit `peer:disconnect` to all remaining participants with the disconnected user's ID.
6. WHEN `peer:disconnect` is received, THE useWebRTC hook SHALL close and remove the RTCPeerConnection for the disconnected peer.

---

### Requirement 15: Group Call Host Controls

**User Story:** As a room host, I want to mute all participants or remove a participant from the room, so that I can maintain order during group calls.

#### Acceptance Criteria

1. WHEN a host emits `host:mute-all`, THE VideoSignalingHandler SHALL relay a mute command to all non-host participants in the room.
2. WHEN a host emits `host:remove-participant` with a `targetUserId`, THE VideoSignalingHandler SHALL disconnect the target participant from the room and notify all remaining participants.
3. IF a non-host user emits `host:mute-all` or `host:remove-participant`, THEN THE VideoSignalingHandler SHALL reject the event without relaying it.

---

### Requirement 16: Device Selection

**User Story:** As a user, I want to switch between available audio and video input devices during a call, so that I can use the correct microphone or camera.

#### Acceptance Criteria

1. WHEN `switchDevice` is invoked with a valid `deviceId` and `kind`, THE useWebRTC hook SHALL acquire a new media stream using the specified device.
2. WHEN a new device stream is acquired, THE useWebRTC hook SHALL replace the corresponding sender track on all active RTCPeerConnections.
3. IF the specified device is unavailable, THEN THE useWebRTC hook SHALL surface an error to the UI and keep the current device active.

---

### Requirement 17: Scheduled Meetings

**User Story:** As a user, I want to schedule a video meeting in advance and share a meeting URL, so that participants can join at the agreed time.

#### Acceptance Criteria

1. WHEN `POST /api/calls/schedule` is requested with a valid title, `scheduled_at`, and participant list, THE ScheduledCallService SHALL create a `scheduled_calls` record and return the `meeting_id` and `meeting_url`.
2. THE ScheduledCallService SHALL generate a unique `meeting_url` of the form `/calls/join/:meeting_id` for every scheduled call.
3. IF `scheduled_at` is not strictly in the future at the time of the request, THEN THE System SHALL return HTTP 400 with a descriptive error.
4. WHEN `GET /api/calls/scheduled` is requested by an authenticated user, THE System SHALL return the list of upcoming scheduled calls for that user.
5. WHEN `GET /api/calls/join/:meetingId` is requested by an authenticated user, THE ScheduledCallService SHALL return the associated `roomId` and an access token.
6. WHEN `DELETE /api/calls/scheduled/:meetingId` is requested by the meeting host, THE ScheduledCallService SHALL update the meeting `status` to `'cancelled'`.
7. IF `DELETE /api/calls/scheduled/:meetingId` is requested by a user who is not the meeting host, THEN THE System SHALL return HTTP 403.

---

### Requirement 18: REST API for Calls

**User Story:** As a frontend developer, I want a REST API for call management, so that I can create, query, and end calls from the UI.

#### Acceptance Criteria

1. WHEN `POST /api/calls/initiate` is requested by an authenticated user with a valid `calleeId`, THE System SHALL create a call record and return `{ callId, roomId, status: 'initiated' }`.
2. IF `POST /api/calls/initiate` is requested with a `calleeId` that does not exist, THEN THE System SHALL return HTTP 404.
3. IF `POST /api/calls/initiate` is requested and the callee is already in an active call, THEN THE System SHALL return HTTP 409.
4. WHEN `POST /api/calls/:callId/end` is requested by an authenticated participant of that call, THE System SHALL update the call record and return the updated call object.
5. IF `POST /api/calls/:callId/end` is requested by a user who is not a participant of that call, THEN THE System SHALL return HTTP 403.

---

### Requirement 19: Call Duration Accuracy

**User Story:** As a user, I want the recorded call duration to be accurate, so that I can trust the call history data.

#### Acceptance Criteria

1. WHEN a call ends, THE CallService SHALL compute `duration` as `Math.floor((end_time.getTime() - start_time.getTime()) / 1000)`.
2. WHEN `end_time` equals `start_time`, THE CallService SHALL store `duration` as 0.
3. THE CallService SHALL set `start_time` to the timestamp when the call `status` transitions to `'connected'`.

---

### Requirement 20: Call State Machine

**User Story:** As a developer, I want the call state machine to enforce valid transitions, so that the UI and backend remain consistent throughout the call lifecycle.

#### Acceptance Criteria

1. WHEN a valid state transition event is applied to a `callState`, THE useWebRTC hook SHALL transition to the correct next state as defined: `idle + initiateCall → calling`, `idle + incomingCall → ringing`, `calling + callAccepted → connected`, `calling + callRejected → idle`, `calling + cancel → idle`, `ringing + accept → connected`, `ringing + reject → idle`, `ringing + cancelled → idle`, `connected + end → ended`, `any + iceFailure → failed`.
2. IF an event that is not a valid transition for the current `callState` is applied, THEN THE useWebRTC hook SHALL throw an error and SHALL NOT change `callState`.

---

### Requirement 21: Rate Limiting

**User Story:** As a platform operator, I want call initiation to be rate-limited, so that the system is protected from abuse and spam.

#### Acceptance Criteria

1. WHEN an authenticated user emits more than 10 `call:initiate` events within a 60-second window, THE VideoSignalingHandler SHALL reject all events beyond the 10th in that window.
2. WHEN a `call:initiate` event is rejected due to rate limiting, THE VideoSignalingHandler SHALL emit an error event to the caller indicating the rate limit has been exceeded.

---

### Requirement 22: ICE Configuration

**User Story:** As a developer, I want the ICE configuration to include both STUN and TURN servers, so that calls can be established across different network topologies.

#### Acceptance Criteria

1. THE useWebRTC hook SHALL configure every RTCPeerConnection with at least one STUN server URL.
2. WHERE a TURN server URL, username, and credential are provided via environment variables, THE useWebRTC hook SHALL include the TURN server in the ICE configuration.
3. THE useWebRTC hook SHALL set `iceCandidatePoolSize` to 10 to pre-gather ICE candidates and reduce connection setup latency.
