/**
 * ICE server configuration for WebRTC peer connections.
 * Uses Google's free STUN servers + optional TURN server from env vars.
 */
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN server — only included if env vars are set
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USER,
            credential: process.env.NEXT_PUBLIC_TURN_CRED,
          },
        ]
      : []),
  ],
  iceCandidatePoolSize: 10,
};

export default ICE_CONFIG;
