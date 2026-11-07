import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  ShieldAlert,
  Swords,
  X,
} from "lucide-react";
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
  const [outgoingChallenge, setOutgoingChallenge] = useState<ChallengeSentPayload | null>(null);

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
            className={`flex items-start gap-3 rounded-2xl border p-4 bg-[#111115]/95 backdrop-blur-md shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)] ${
              toastMessage.type === "success"
                ? "border-emerald-500/40 text-emerald-300"
                : toastMessage.type === "error"
                ? "border-rose-500/40 text-rose-300"
                : toastMessage.type === "warning"
                ? "border-amber-500/40 text-amber-300"
                : "border-zinc-800 text-zinc-100"
            }`}
          >
            <span className="shrink-0 pt-0.5">
              {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-accent" />}
              {toastMessage.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toastMessage.type === "warning" && <ShieldAlert className="w-5 h-5 text-amber-400" />}
              {toastMessage.type === "info" && <Info className="w-5 h-5 text-cyan-400" />}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white font-display">
                {toastMessage.title}
              </h4>
              <p className="mt-0.5 text-xs text-zinc-400 leading-snug">
                {toastMessage.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INCOMING CHALLENGE MODAL */}
      {incomingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800/90 bg-[#121217] p-6 sm:p-8 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)]">
            <div className="relative z-10 space-y-5 text-center">
              {/* Challenger Avatar */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-850 border border-zinc-700 text-2xl font-bold text-white shadow-inner">
                {incomingChallenge.challenger.name
                  ? incomingChallenge.challenger.name.charAt(0).toUpperCase()
                  : "P"}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-sm shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Incoming Challenge</span>
                </span>
                <h3 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
                  {incomingChallenge.challenger.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                  has challenged you to a 1v1 Tic-Tac-Toe Arena match!
                </p>
              </div>

              {/* Expiry Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                  <span>Auto-declines in</span>
                  <span className="font-mono font-bold text-accent">
                    {countdown}s
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    style={{ width: `${(countdown / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isAccepting}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/80 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="rounded-xl bg-accent py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-accent-hover shadow-[0_0_16px_-2px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_-2px_rgba(34,197,94,0.45)] disabled:opacity-50 cursor-pointer"
                >
                  {isAccepting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Entering...</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-zinc-800/90 bg-[#121217] p-6 sm:p-8 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)]">
            <div className="relative z-10 space-y-5 text-center">
              {/* Radar Swords Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-accent shadow-sm">
                <Swords className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Challenge Sent</span>
                </span>
                <h3 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
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
                  type="button"
                  onClick={handleCancelOutgoing}
                  className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-6 py-2.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900/40 hover:text-rose-200 cursor-pointer"
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
