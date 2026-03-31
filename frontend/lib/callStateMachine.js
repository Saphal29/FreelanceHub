/**
 * Call state machine for WebRTC calls.
 *
 * Valid states: idle | calling | ringing | connected | ended | failed
 *
 * Valid transitions:
 *   idle      + initiateCall  → calling
 *   idle      + incomingCall  → ringing
 *   calling   + callAccepted  → connected
 *   calling   + callRejected  → idle
 *   calling   + cancel        → idle
 *   ringing   + accept        → connected
 *   ringing   + reject        → idle
 *   ringing   + cancelled     → idle
 *   connected + end           → ended
 *   any       + iceFailure    → failed
 */

const VALID_STATES = new Set(["idle", "calling", "ringing", "connected", "ended", "failed"]);

const TRANSITIONS = {
  idle: {
    initiateCall: "calling",
    incomingCall: "ringing",
  },
  calling: {
    callAccepted: "connected",
    callRejected: "idle",
    cancel: "idle",
  },
  ringing: {
    accept: "connected",
    reject: "idle",
    cancelled: "idle",
  },
  connected: {
    end: "ended",
  },
};

/**
 * Transition the call state machine.
 * @param {string} currentState - Current call state
 * @param {string} event - Event to apply
 * @returns {string} Next state
 * @throws {Error} If the transition is invalid
 */
export const transition = (currentState, event) => {
  // iceFailure is valid from any state
  if (event === "iceFailure") return "failed";

  const stateTransitions = TRANSITIONS[currentState];
  if (!stateTransitions) {
    throw new Error(`Invalid transition: no transitions defined for state '${currentState}'`);
  }

  const nextState = stateTransitions[event];
  if (!nextState) {
    throw new Error(`Invalid transition: event '${event}' is not valid in state '${currentState}'`);
  }

  if (!VALID_STATES.has(nextState)) {
    throw new Error(`Invalid transition: next state '${nextState}' is not a valid state`);
  }

  return nextState;
};

export const CALL_STATES = {
  IDLE: "idle",
  CALLING: "calling",
  RINGING: "ringing",
  CONNECTED: "connected",
  ENDED: "ended",
  FAILED: "failed",
};
