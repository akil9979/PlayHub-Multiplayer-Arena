import { useEffect, useState } from "react";
import { Loader2, Radio, Swords, Users } from "lucide-react";
import type { OnlineUser } from "../types/game";
import { socket } from "../Socket";
import { useSocketStatus } from "../utils/useSocketStatus";
import EmptyState from "./common/EmptyState";
import LoadingSpinner from "./common/LoadingSpinner";
import ErrorMessage from "./common/ErrorMessage";
import SocketStatusBadge from "./common/SocketStatusBadge";

interface OnlinePlayersProps {
  onlineUsers: OnlineUser[];
  currentUserId?: number;
  isLoading?: boolean;
}

export default function OnlinePlayers({
  onlineUsers,
  currentUserId,
  isLoading = false,
}: OnlinePlayersProps) {
  // Filter out the current user to display other online players
  const otherPlayers = onlineUsers.filter((u) => u.userId !== currentUserId);

  // Track which player we currently have an outgoing challenge with
  const [pendingTargetId, setPendingTargetId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { isConnected } = useSocketStatus();

  useEffect(() => {
    const handleSent = (payload: { target: { userId: number } }) => {
      setPendingTargetId(payload.target.userId);
      setActionError(null);
    };

    const handleClear = () => {
      setPendingTargetId(null);
    };

    const handleChallengeError = (payload: { message?: string }) => {
      setPendingTargetId(null);
      setActionError(payload.message || "Unable to send this challenge. Please try again.");
    };

    socket.on("challenge-sent", handleSent);
    socket.on("challenge-accepted", handleClear);
    socket.on("challenge-declined", handleClear);
    socket.on("challenge-cancelled", handleClear);
    socket.on("challenge-error", handleChallengeError);

    return () => {
      socket.off("challenge-sent", handleSent);
      socket.off("challenge-accepted", handleClear);
      socket.off("challenge-declined", handleClear);
      socket.off("challenge-cancelled", handleClear);
      socket.off("challenge-error", handleChallengeError);
    };
  }, []);

  const handleSendChallenge = (targetUserId: number) => {
    if (!isConnected) {
      setActionError("Cannot challenge: connecting to game server...");
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    if (pendingTargetId !== null) {
      return; // Already challenging someone
    }

    setActionError(null);
    setPendingTargetId(targetUserId);
    socket.emit("send-challenge", { targetUserId });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-display">
            <Radio className="w-5 h-5 text-accent animate-pulse" />
            <span>Online Players</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Challenge players currently active in the PlayHub arena
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <SocketStatusBadge showLabel={false} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-sm shadow-sm select-none">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>
              {onlineUsers.length} Active{" "}
              {onlineUsers.length === 1 ? "Player" : "Players"}
            </span>
          </span>
        </div>
      </div>

      {actionError && (
        <ErrorMessage compact message={actionError} onDismiss={() => setActionError(null)} />
      )}

      {isLoading ? (
        <LoadingSpinner center label="Finding online players..." />
      ) : otherPlayers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-zinc-500" />}
          title="No other players online right now"
          description="You're currently the only player in the arena. Create a private match room to invite a friend!"
          action={{
            label: "Host Match",
            to: "/game",
          }}
          compact
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherPlayers.map((player) => {
            const isPendingThisPlayer = pendingTargetId === player.userId;
            const isAnyPending = pendingTargetId !== null;
            const isDisabled = isAnyPending || !isConnected;

            return (
              <div
                key={player.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-[#121217] p-3.5 transition-all duration-150 hover:border-zinc-700 hover:bg-[#15151c] shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-850 border border-zinc-750 text-sm font-bold text-white shadow-inner">
                    {player.name ? player.name.charAt(0).toUpperCase() : "P"}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#121217] bg-emerald-500 shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-100">
                      {player.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-accent font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>Ready to play</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSendChallenge(player.userId)}
                    disabled={isDisabled}
                    title={
                      !isConnected
                        ? "Connecting to server..."
                        : isPendingThisPlayer
                        ? "Challenge in progress"
                        : "Send challenge"
                    }
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all select-none cursor-pointer ${
                      isPendingThisPlayer
                        ? "border border-amber-500/40 bg-amber-950/30 text-amber-300 cursor-not-allowed"
                        : isDisabled
                        ? "border border-zinc-800 bg-zinc-900/60 text-zinc-500 cursor-not-allowed"
                        : "bg-accent text-zinc-950 hover:bg-accent-hover shadow-[0_0_12px_-2px_rgba(34,197,94,0.3)] hover:shadow-[0_0_16px_-2px_rgba(34,197,94,0.45)] active:scale-95"
                    }`}
                  >
                    {isPendingThisPlayer ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Pending...</span>
                      </span>
                    ) : !isConnected ? (
                      "Offline"
                    ) : (
                      <>
                        <Swords className="w-3.5 h-3.5" />
                        <span>Challenge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
