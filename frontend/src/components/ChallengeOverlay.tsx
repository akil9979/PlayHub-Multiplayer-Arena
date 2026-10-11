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
            className={`flex items-start gap-3 rounded-xl border p-4 bg-[#111113] ${
              toastMessage.type === "success"
                ? "border-emerald-500/40 text-emerald-300"
                : toastMessage.type === "error"
                  ? "border-red-500/40 text-red-300"
                  : toastMessage.type === "warning"
                    ? "border-amber-500/40 text-amber-300"
                    : "border-[#27272a] text-[#fafafa]"
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
              <p className="mt-0.5 text-xs text-zinc-400 leading-snug">
                {toastMessage.description}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-zinc-500 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* INCOMING CHALLENGE MODAL */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/80 p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-[#27272a] bg-[#111113] p-6 sm:p-8">
            <div className="relative z-10 space-y-5 text-center">
              {/* Flat Avatar */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#27272a] border border-[#3f3f46] text-2xl font-bold text-white">
                {incomingChallenge.challenger.name
                  ? incomingChallenge.challenger.name.charAt(0).toUpperCase()
                  : "P"}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Incoming Challenge
                </span>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {incomingChallenge.challenger.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                  has challenged you to a 1v1 Tic-Tac-Toe Arena match!
                </p>
              </div>

              {/* Expiry Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>Auto-declines in</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {countdown}s
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#27272a]">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDecline}
                  disabled={isAccepting}
                  className="rounded-lg border border-[#3f3f46] bg-[#27272a] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#3f3f46] disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="rounded-lg bg-[#22c55e] py-2.5 text-xs font-semibold text-[#052e16] transition-colors hover:bg-[#16a34a] disabled:opacity-50"
                >
                  {isAccepting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#052e16] border-t-transparent" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0b]/80 p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-xl border border-[#27272a] bg-[#111113] p-6 sm:p-8">
            <div className="relative z-10 space-y-5 text-center">
              {/* Flat Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[#27272a] border border-[#3f3f46] text-2xl font-bold text-white">
                ⚔️
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Challenge Sent
                </span>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Waiting for {outgoingChallenge.target.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                  Invitation delivered! Match will automatically start once
                  accepted.
                </p>
              </div>

              {/* Cancel Challenge CTA */}
              <div className="pt-2">
                <button
                  onClick={handleCancelOutgoing}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
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
