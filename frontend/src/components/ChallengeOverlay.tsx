import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../Socket";
import type {
  ChallengeAcceptedPayload,
  ChallengeCancelledPayload,
  ChallengeDeclinedPayload,
  ChallengeErrorPayload,
  ChallengeReceivedPayload,
  ChallengeSentPayload,
} from "../types/game";

export default function ChallengeOverlay() {
  const navigate = useNavigate();

  // Incoming challenge received from someone else
  const [incomingChallenge, setIncomingChallenge] =
    useState<ChallengeReceivedPayload | null>(null);

  // Outgoing challenge sent by the current player
  const [outgoingChallenge, setOutgoingChallenge] =
    useState<ChallengeSentPayload | null>(null);

  // Informational toast / notification banner
  const [toastMessage, setToastMessage] = useState<{
    type: "info" | "success" | "error" | "warning";
    title: string;
    description: string;
  } | null>(null);

  // Loading state when accepting a challenge
  const [isAccepting, setIsAccepting] = useState(false);

  // Countdown timer for incoming challenge (30 seconds)
  const [countdown, setCountdown] = useState(30);

  // Auto-dismiss toast helper
  const showToast = (
    title: string,
    description: string,
    type: "info" | "success" | "error" | "warning" = "info",
  ) => {
    setToastMessage({ title, description, type });
    setTimeout(() => {
      setToastMessage((current) =>
        current?.title === title ? null : current,
      );
    }, 4500);
  };

  // Countdown effect for incoming challenge
  useEffect(() => {
    if (!incomingChallenge) {
      setCountdown(30);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Expired locally, auto-decline
          socket.emit("decline-challenge", {
            challengeId: incomingChallenge.challengeId,
          });
          setIncomingChallenge(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingChallenge]);

  // Socket listeners for challenge events
  useEffect(() => {
    const handleChallengeReceived = (payload: ChallengeReceivedPayload) => {
      setIncomingChallenge(payload);
      setCountdown(30);
    };

    const handleChallengeSent = (payload: ChallengeSentPayload) => {
      setOutgoingChallenge(payload);
    };

    const handleChallengeAccepted = (payload: ChallengeAcceptedPayload) => {
      setIncomingChallenge(null);
      setOutgoingChallenge(null);
      setIsAccepting(false);

      showToast(
        "Challenge Accepted!",
        `Entering arena match against ${payload.opponent.name}...`,
        "success",
      );

      // Navigate both players directly to Game page with the room and match data
      navigate("/game", {
        state: {
          roomId: payload.roomId,
          game: payload.game,
          player: payload.player,
          opponent: payload.opponent,
        },
      });
    };

    const handleChallengeDeclined = (payload: ChallengeDeclinedPayload) => {
      setOutgoingChallenge(null);
      showToast(
        "Challenge Declined",
        payload.reason
          ? `${payload.target.name}: ${payload.reason}`
          : `${payload.target.name} declined your challenge.`,
        "warning",
      );
    };

    const handleChallengeCancelled = (payload: ChallengeCancelledPayload) => {
      setIncomingChallenge(null);
      showToast(
        "Challenge Cancelled",
        payload.reason ||
          `${payload.challenger?.name || "The opponent"} cancelled the challenge.`,
        "info",
      );
    };

    const handleChallengeError = (payload: ChallengeErrorPayload) => {
      setOutgoingChallenge(null);
      setIsAccepting(false);
      showToast("Challenge Unavailable", payload.message, "error");
    };

    const handleDisconnect = () => {
      setIncomingChallenge((prev) => {
        if (prev) {
          showToast(
            "Disconnected",
            "Lost connection to server. Incoming challenge cancelled.",
            "warning"
          );
        }
        return null;
      });
      setOutgoingChallenge((prev) => {
        if (prev) {
          showToast(
            "Disconnected",
            "Lost connection to server. Outgoing challenge cancelled.",
            "warning"
          );
        }
        return null;
      });
      setIsAccepting(false);
    };

    socket.on("challenge-received", handleChallengeReceived);
    socket.on("challenge-sent", handleChallengeSent);
    socket.on("challenge-accepted", handleChallengeAccepted);
    socket.on("challenge-declined", handleChallengeDeclined);
    socket.on("challenge-cancelled", handleChallengeCancelled);
    socket.on("challenge-error", handleChallengeError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("challenge-received", handleChallengeReceived);
      socket.off("challenge-sent", handleChallengeSent);
      socket.off("challenge-accepted", handleChallengeAccepted);
      socket.off("challenge-declined", handleChallengeDeclined);
      socket.off("challenge-cancelled", handleChallengeCancelled);
      socket.off("challenge-error", handleChallengeError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [navigate]);

  const handleAccept = () => {
    if (!incomingChallenge || isAccepting || !socket.connected) return;
    setIsAccepting(true);
    socket.emit("accept-challenge", {
      challengeId: incomingChallenge.challengeId,
    });
  };

  const handleDecline = () => {
    if (!incomingChallenge) return;
    socket.emit("decline-challenge", {
      challengeId: incomingChallenge.challengeId,
    });
    setIncomingChallenge(null);
  };

  const handleCancelOutgoing = () => {
    if (!outgoingChallenge) return;
    socket.emit("cancel-challenge", {
      challengeId: outgoingChallenge.challengeId,
    });
    setOutgoingChallenge(null);
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm animate-bounce-short">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              toastMessage.type === "success"
                ? "border-emerald-500/40 bg-slate-900/95 text-emerald-300 shadow-emerald-500/10"
                : toastMessage.type === "error"
                  ? "border-rose-500/40 bg-slate-900/95 text-rose-300 shadow-rose-500/10"
                  : toastMessage.type === "warning"
                    ? "border-amber-500/40 bg-slate-900/95 text-amber-300 shadow-amber-500/10"
                    : "border-indigo-500/40 bg-slate-900/95 text-indigo-300 shadow-indigo-500/10"
            }`}
          >
            <span className="text-xl">
              {toastMessage.type === "success" && "🏆"}
              {toastMessage.type === "error" && "⚠️"}
              {toastMessage.type === "warning" && "🛡️"}
              {toastMessage.type === "info" && "ℹ️"}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white">
                {toastMessage.title}
              </h4>
              <p className="mt-0.5 text-xs text-slate-300 leading-snug">
                {toastMessage.description}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* INCOMING CHALLENGE MODAL */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-2xl shadow-indigo-500/20">
            {/* Ambient decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 space-y-5 text-center">
              {/* Pulsing Avatar */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-25"></span>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-2xl font-black text-white shadow-xl shadow-indigo-500/30">
                  {incomingChallenge.challenger.name
                    ? incomingChallenge.challenger.name.charAt(0).toUpperCase()
                    : "P"}
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                  Incoming Challenge
                </span>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {incomingChallenge.challenger.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  has challenged you to a 1v1 Tic-Tac-Toe Arena match!
                </p>
              </div>

              {/* Expiry Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Auto-declines in</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {countdown}s
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDecline}
                  disabled={isAccepting}
                  className="rounded-xl border border-slate-700 bg-slate-800/90 py-3 text-xs font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white active:scale-95 disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] hover:shadow-emerald-500/40 active:scale-95 disabled:opacity-50"
                >
                  {isAccepting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Entering...
                    </span>
                  ) : (
                    "✓ Accept & Play"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OUTGOING CHALLENGE WAITING MODAL */}
      {outgoingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/60 p-6 sm:p-8 shadow-2xl shadow-purple-500/20">
            {/* Ambient decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 space-y-5 text-center">
              {/* Radar pulse */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-25"></span>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-2xl font-black text-white shadow-xl shadow-purple-500/30">
                  ⚔️
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  Challenge Sent
                </span>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Waiting for {outgoingChallenge.target.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Invitation delivered! Match will automatically start once
                  accepted.
                </p>
              </div>

              {/* Cancel Challenge CTA */}
              <div className="pt-2">
                <button
                  onClick={handleCancelOutgoing}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 active:scale-95"
                >
                  Cancel Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
