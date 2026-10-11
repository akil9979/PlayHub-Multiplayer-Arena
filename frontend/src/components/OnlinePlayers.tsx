import { useEffect, useState } from "react";
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🟢 Online Players</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Challenge players currently active in the PlayHub arena
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <SocketStatusBadge showLabel={false} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {onlineUsers.length} Active{" "}
            {onlineUsers.length === 1 ? "Player" : "Players"}
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
          icon="👥"
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
                className="flex items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#111113] p-3.5 transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#27272a] border border-[#3f3f46] text-sm font-bold text-[#fafafa]">
                    {player.name ? player.name.charAt(0).toUpperCase() : "P"}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#111113] bg-emerald-500"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#fafafa]">
                      {player.name}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>Online</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleSendChallenge(player.userId)}
                    disabled={isDisabled}
                    title={
                      !isConnected
                        ? "Connecting to server..."
                        : isPendingThisPlayer
                        ? "Challenge in progress"
                        : "Send challenge"
                    }
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isPendingThisPlayer
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 cursor-not-allowed"
                        : isDisabled
                          ? "border border-[#27272a] bg-[#18181b] text-zinc-500 cursor-not-allowed"
                          : "bg-[#22c55e] text-[#052e16] hover:bg-[#16a34a]"
                    }`}
                  >
                    {isPendingThisPlayer ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Pending...
                      </span>
                    ) : !isConnected ? (
                      "Offline"
                    ) : (
                      "⚔️ Challenge"
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
