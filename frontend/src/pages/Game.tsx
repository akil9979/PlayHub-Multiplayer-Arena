import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../Socket";
import Board from "../components/Board";
import GameList from "../components/GameList";
import Navbar from "../components/Navbar";
import SocketStatusBadge from "../components/common/SocketStatusBadge";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useSocketStatus } from "../utils/useSocketStatus";
import type { Game as GameType, Player } from "../types/gameType";
import { useAppSelector } from "../redux/hook";
import { normalizeRoomCode, validateRoomCode } from "../utils/validation";

type GameStatus =
  | "idle"
  | "waiting"
  | "playing"
  | "finished"
  | "opponent-left"
  | "opponent-disconnected";

function Game() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read initial match data if navigated from an accepted challenge
  const challengeState = location.state as {
    roomId?: string;
    game?: GameType;
    player?: Player;
  } | null;

  const [selectedGame, setSelectedGame] = useState<string | null>(
    challengeState?.roomId ? "tic-tac-toe" : null,
  );
  const [roomId, setRoomId] = useState(challengeState?.roomId || "");
  const [roomInput, setRoomInput] = useState("");

  const [opponentRequested, setOpponentRequested] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [rematchError, setRematchError] = useState<string | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>(
    challengeState?.roomId && challengeState?.game ? "playing" : "idle",
  );

  const [game, setGame] = useState<GameType | null>(
    challengeState?.game || null,
  );
  const [player, setPlayer] = useState<Player | null>(
    challengeState?.player || null,
  );

  const { status, isConnected } = useSocketStatus();

  const user = useAppSelector((state) => state.auth.user);

  // Warn before closing or refreshing during an active live match
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameStatus]);

  const handleCreateRoom = () => {
    if (!isConnected) {
      setLobbyError("Cannot create room: not connected to game server.");
      return;
    }

    setLobbyError(null);
    setIsCreatingRoom(true);
    setGame(null);
    setPlayer(null);
    setOpponentRequested(false);
    setWaitingForOpponent(false);
    setGameStatus("idle");

    socket.emit("create-room");
  };

  const joinRoom = () => {
    if (!isConnected) {
      setLobbyError("Cannot join room: not connected to game server.");
      return;
    }

    const code = normalizeRoomCode(roomInput);
    const codeError = validateRoomCode(code);
    if (codeError) {
      setRoomError(codeError);
      return;
    }

    setRoomError(null);
    setLobbyError(null);
    setIsJoiningRoom(true);
    setGame(null);
    setPlayer(null);
    setOpponentRequested(false);
    setWaitingForOpponent(false);
    setGameStatus("idle");

    socket.emit("join-room", code);
  };

  const handleRematchRequest = () => {
    if (!socket.connected) {
      setRematchError(
        "Connection to the game server is unavailable. Please reconnect and try again.",
      );
      return;
    }

    if (!roomId || !game?.winner) {
      return;
    }

    socket.emit("request-rematch", roomId);
    setRematchError(null);
    setWaitingForOpponent(true);
  };

  const handleLeaveGame = () => {
    if (!roomId) {
      return;
    }

    socket.emit("leave-game", roomId);

    setRoomId("");
    setGame(null);
    setPlayer(null);
    setGameStatus("idle");
    setOpponentRequested(false);
    setWaitingForOpponent(false);
    setIsCreatingRoom(false);
    setIsJoiningRoom(false);
    setLobbyError(null);
  };

  const handleBackToDashboard = () => {
    if (roomId) {
      handleLeaveGame();
    }
    navigate("/dashboard");
  };

  const handleCopyRoomId = async () => {
    if (!roomId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected! Socket ID:", socket.id);
      setLobbyError(null);
    };

    const handleConnectError = (error: Error) => {
      console.error("Socket connection failed:", error.message);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      setLobbyError("Game server connection error. Retrying...");
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    };

    const handleRoomCreated = (createdRoomId: string) => {
      setIsCreatingRoom(false);
      setLobbyError(null);
      setRoomId(createdRoomId);
      setGameStatus("waiting");
    };

    const handleRoomNotFound = () => {
      setIsJoiningRoom(false);
      setLobbyError(
        "Room not found! Please check the room code and try again.",
      );
    };

    const handleRoomFull = () => {
      setIsJoiningRoom(false);
      setLobbyError("This room is already full (maximum 2 players).");
    };

    const handlePlayerJoined = () => {
      setGameStatus("playing");
    };

    const handleGameCreated = (createdGame: GameType) => {
      setGame(createdGame);
    };

    const handlePlayerAssigned = (assignedPlayer: Player) => {
      setPlayer(assignedPlayer);
    };

    const handleRoomJoined = (joinedRoomId: string) => {
      setIsJoiningRoom(false);
      setLobbyError(null);
      setRoomId(joinedRoomId);
      setGameStatus("waiting");
    };

    const handleGameUpdated = (updatedGame: GameType) => {
      setGame(updatedGame);

      if (updatedGame.winner !== null) {
        setGameStatus("finished");
      }
    };

    const handlePlayerDisconnected = (updatedGame: GameType) => {
      setGame(updatedGame);
      setGameStatus("opponent-left");
      setOpponentRequested(false);
      setWaitingForOpponent(false);
    };
    const handlePlayerLeftFinishedGame = (updatedGame: GameType) => {
      setGame(updatedGame);
      setGameStatus("opponent-disconnected");
      setOpponentRequested(false);
      setWaitingForOpponent(false);
      setRematchError(null);
    };

    const handleRematchRequested = () => {
      setOpponentRequested(true);
    };

    const handleRematchAccepted = (newGame: GameType) => {
      setGame(newGame);
      setGameStatus("playing");
      setOpponentRequested(false);
      setWaitingForOpponent(false);
    };

    const handleChallengeAccepted = (payload: {
      roomId: string;
      game: GameType;
      player: Player;
    }) => {
      setRoomId(payload.roomId);
      setGame(payload.game);
      setPlayer(payload.player);
      setGameStatus("playing");
      setOpponentRequested(false);
      setWaitingForOpponent(false);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    socket.on("room-created", handleRoomCreated);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("room-full", handleRoomFull);
    socket.on("player-joined", handlePlayerJoined);

    socket.on("game-created", handleGameCreated);
    socket.on("player-assigned", handlePlayerAssigned);
    socket.on("room-joined", handleRoomJoined);

    socket.on("game-updated", handleGameUpdated);
    socket.on("player-disconnected", handlePlayerDisconnected);
    socket.on("player-left-finished-game", handlePlayerLeftFinishedGame);

    socket.on("rematch-requested", handleRematchRequested);
    socket.on("rematch-accepted", handleRematchAccepted);
    socket.on("challenge-accepted", handleChallengeAccepted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);

      socket.off("room-created", handleRoomCreated);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("room-full", handleRoomFull);
      socket.off("player-joined", handlePlayerJoined);

      socket.off("game-created", handleGameCreated);
      socket.off("player-assigned", handlePlayerAssigned);
      socket.off("room-joined", handleRoomJoined);

      socket.off("game-updated", handleGameUpdated);
      socket.off("player-disconnected", handlePlayerDisconnected);
      socket.off("player-left-finished-game", handlePlayerLeftFinishedGame);

      socket.off("rematch-requested", handleRematchRequested);
      socket.off("rematch-accepted", handleRematchAccepted);
      socket.off("challenge-accepted", handleChallengeAccepted);
    };
  }, []);

  const isMyTurn =
    game && player && game.currentPlayer === player && !game.winner;
  const isMatchLive = gameStatus === "playing";
  const isMatchScreen =
    (gameStatus === "playing" ||
      gameStatus === "finished" ||
      gameStatus === "opponent-left" ||
      gameStatus === "opponent-disconnected") &&
    Boolean(game) &&
    Boolean(player);

  if (isMatchScreen && game && player) {
    return (
      <div
        className="page-shell h-dvh flex flex-col overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <style>{`
          @media (max-height: 700px) {
            .match-compact-hide { display: none !important; }
            .match-compact-title { font-size: 0.95rem !important; margin-top: 0.125rem !important; margin-bottom: 0.125rem !important; }
          }
        `}</style>

        {/* Top Navbar: only shown after the match concludes. */}
        {!isMatchLive && (
          <div className="shrink-0">
            <Navbar variant="authenticated" />
          </div>
        )}

        {/* Live Match Container: exactly fits the remaining viewport height */}
        <div className="mx-auto flex w-full max-w-xl flex-1 min-h-0 flex-col justify-between overflow-hidden px-3 sm:px-4 py-2 sm:py-3 gap-1.5 sm:gap-2">
          {/* 1. Compact Header */}
          <div className="shrink-0 text-center space-y-1 w-full">
            <div className="flex items-center justify-between gap-2 w-full">
              {!isMatchLive ? (
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className="group inline-flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111113] px-3 py-1.5 text-xs font-semibold text-[#a1a1aa] transition hover:border-[#3f3f46] hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer"
                >
                  <span className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none">
                    ←
                  </span>
                  <span>Back to Dashboard</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <SocketStatusBadge showRetry />
              </div>
            </div>

            <div>
              <span className="match-compact-hide inline-block rounded-md border border-[#3f3f46] bg-[#18181b] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#fafafa]">
                1v1 Tactical Arena
              </span>
              <h1 className="match-compact-title mt-1 text-lg sm:text-2xl font-black tracking-tight text-[#fafafa]">
                Tic-Tac-Toe
              </h1>
              <p className="match-compact-hide text-[11px] sm:text-xs text-[#a1a1aa]">
                Live Multiplayer Turn-Based Battle
              </p>
            </div>
          </div>

          {/* 2. Compact Player Row */}
          <div className="shrink-0 grid grid-cols-2 gap-2 w-full">
            {/* Circle Player Card */}
            <div
              className={`relative rounded-lg sm:rounded-xl border p-2 sm:p-2.5 transition-colors ${
                game.currentPlayer === "circle" && !game.winner
                  ? "border-[#5ab0e6] bg-[#0a0a0b]"
                  : "border-[#27272a] bg-[#0a0a0b]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#111113] text-xs sm:text-sm font-black text-[#5ab0e6]">
                  O
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold text-[#fafafa]">
                      {player === "circle"
                        ? user?.name || "Player"
                        : "Opponent"}
                    </p>
                    {player === "circle" && (
                      <span className="shrink-0 rounded bg-[#5ab0e6]/20 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-[#5ab0e6]">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5ab0e6] font-semibold truncate">
                    Circle (O)
                  </p>
                </div>
              </div>
            </div>

            {/* Cross Player Card */}
            <div
              className={`relative rounded-lg sm:rounded-xl border p-2 sm:p-2.5 transition-colors ${
                game.currentPlayer === "cross" && !game.winner
                  ? "border-[#7c6ee6] bg-[#0a0a0b]"
                  : "border-[#27272a] bg-[#0a0a0b]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md border border-[#27272a] bg-[#111113] text-xs sm:text-sm font-black text-[#7c6ee6]">
                  X
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold text-[#fafafa]">
                      {player === "cross" ? user?.name || "Player" : "Opponent"}
                    </p>
                    {player === "cross" && (
                      <span className="shrink-0 rounded bg-[#7c6ee6]/20 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-[#7c6ee6]">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#7c6ee6] font-semibold truncate">
                    Cross (X)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Compact Turn / Status Banner */}
          <div className="shrink-0 w-full">
            {!game.winner && gameStatus === "playing" && (
              <div
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-center text-xs font-bold leading-tight truncate ${
                  isMyTurn
                    ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}
              >
                <span className="shrink-0">{isMyTurn ? "🎯" : "⏳"}</span>
                <span className="truncate">
                  {isMyTurn
                    ? "Your Turn — Choose a square to place your symbol"
                    : "Opponent's Turn — Waiting for rival move..."}
                </span>
              </div>
            )}

            {gameStatus === "opponent-left" && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-[#22c55e]/40 bg-[#22c55e]/10 px-3 py-1.5 text-center text-xs font-bold text-[#22c55e] leading-tight truncate">
                <span className="shrink-0">🚪</span>
                <span className="font-bold">Opponent Disconnected</span>
                <span className="hidden sm:inline text-xs text-[#a1a1aa] truncate">
                  — Your opponent has left the match. You have been awarded the
                  victory!
                </span>
              </div>
            )}

            {gameStatus === "opponent-disconnected" && (
              <div className="rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-center text-xs text-[#a1a1aa]">
                Your opponent left the finished match. Return to the dashboard
                to start a new game.
              </div>
            )}

            {game.winner && gameStatus !== "opponent-left" && (
              <div
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-center text-xs font-bold leading-tight truncate ${
                  game.winner === "draw"
                    ? "border-[#3f3f46] bg-[#18181b] text-[#fafafa]"
                    : game.winner === player
                      ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                }`}
              >
                <span className="shrink-0">
                  {game.winner === "draw"
                    ? "🤝"
                    : game.winner === player
                      ? "🏆"
                      : "💔"}
                </span>
                <span className="font-bold">
                  {game.winner === "draw"
                    ? "Stalemate — It's a Draw!"
                    : game.winner === player
                      ? "VICTORY — You Won!"
                      : "DEFEAT — You Lost!"}
                </span>
                <span className="hidden sm:inline text-xs text-[#a1a1aa] truncate">
                  {game.winner === "draw"
                    ? "— Well played from both sides. Ready for a decider?"
                    : game.winner === player
                      ? "— Great game! Outstanding tactical positioning."
                      : "— Better luck next round! Request a rematch to settle the score."}
                </span>
              </div>
            )}
          </div>

          {/* 4. Board Area: takes ALL remaining height and centers the board */}
          <div
            className="flex-1 min-h-0 w-full flex items-center justify-center p-1 sm:p-2"
            style={{ containerType: "size" }}
          >
            <Board game={game} roomId={roomId} player={player} />
          </div>

          {/* 5. Bottom Actions Row */}
          <div className="shrink-0 w-full py-1">
            {game.winner && gameStatus === "finished" ? (
              <div className="space-y-1.5">
                {rematchError && (
                  <ErrorMessage
                    compact
                    message={rematchError}
                    onDismiss={() => setRematchError(null)}
                  />
                )}
                {opponentRequested && (
                  <p className="text-center text-xs font-semibold text-[#22c55e]">
                    ⚔️ Your opponent has requested a rematch!
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                  {!opponentRequested && (
                    <button
                      type="button"
                      onClick={handleRematchRequest}
                      disabled={waitingForOpponent}
                      className="btn-primary min-h-[40px] sm:min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {waitingForOpponent
                        ? "Waiting for opponent..."
                        : "🔄 Request Rematch"}
                    </button>
                  )}

                  {opponentRequested && (
                    <button
                      type="button"
                      onClick={handleRematchRequest}
                      className="btn-primary min-h-[40px] sm:min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold cursor-pointer"
                    >
                      ✓ Accept Rematch
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLeaveGame}
                    className="btn-secondary min-h-[40px] sm:min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Leave Match
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleLeaveGame}
                  className="inline-flex min-h-[40px] sm:min-h-[44px] items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 cursor-pointer"
                >
                  Leave Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar variant="authenticated" />

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 sm:space-y-6 px-4 py-4 sm:py-8">
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between gap-3">
          {!isMatchLive ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#27272a] bg-[#111113] px-3.5 sm:px-4 py-2 text-xs font-semibold text-[#a1a1aa] transition hover:border-[#3f3f46] hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer"
              >
                <span className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none">
                  ←
                </span>
                <span>Back to Dashboard</span>
              </button>

              {gameStatus === "idle" &&
                !roomId &&
                selectedGame === "tic-tac-toe" && (
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#111113] px-3.5 sm:px-4 py-2 text-xs font-semibold text-[#a1a1aa] transition hover:border-[#3f3f46] hover:bg-[#18181b] hover:text-[#fafafa] cursor-pointer"
                  >
                    <span>All games</span>
                  </button>
                )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <SocketStatusBadge showRetry />
          </div>
        </div>

        {/* Main Arena Card */}
        <div className="relative overflow-hidden rounded-xl border border-[#27272a] bg-[#111113] p-4 sm:p-8">
          {/* Arena Title */}
          <div className="mb-4 sm:mb-6 text-center">
            <span className="rounded-md border border-[#3f3f46] bg-[#18181b] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#fafafa]">
              1v1 Tactical Arena
            </span>
            <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl font-black tracking-tight text-[#fafafa]">
              {selectedGame === null && gameStatus === "idle" && !roomId
                ? "Select Game"
                : "Tic-Tac-Toe"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa]">
              {selectedGame === null && gameStatus === "idle" && !roomId
                ? "Choose a title to enter the arena"
                : "Live Multiplayer Turn-Based Battle"}
            </p>
          </div>

          {/* 1. LOBBY STATE (No Room Selected) */}
          {gameStatus === "idle" &&
            !roomId &&
            (selectedGame === null ? (
              <GameList onSelect={setSelectedGame} />
            ) : (
              <div className="space-y-6">
                {status === "connecting" && (
                  <LoadingSpinner
                    center
                    size="sm"
                    label="Connecting to game server..."
                  />
                )}
                {status === "error" && (
                  <ErrorMessage
                    compact
                    message="Unable to connect to the game server. Use Reconnect above and try again."
                  />
                )}
                {lobbyError && (
                  <ErrorMessage
                    compact
                    message={lobbyError}
                    onDismiss={() => setLobbyError(null)}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Host a match */}
                  <div className="flex flex-col justify-between rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4 sm:p-5 transition hover:border-[#3f3f46]">
                    <div className="space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-base">
                        👑
                      </div>
                      <h3 className="text-base font-bold text-[#fafafa]">
                        Host Match
                      </h3>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed">
                        Generate a private room code and invite a friend to
                        play.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateRoom}
                      disabled={!isConnected || isCreatingRoom || isJoiningRoom}
                      className="btn-primary mt-4 flex min-h-[44px] items-center justify-center gap-2 w-full py-3 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isCreatingRoom && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#052e16] border-t-transparent" />
                      )}
                      <span>
                        {isCreatingRoom
                          ? "Creating Room..."
                          : "Create Private Room"}
                      </span>
                    </button>
                  </div>

                  {/* Join a match */}
                  <div className="flex flex-col justify-between rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4 sm:p-5 transition hover:border-[#3f3f46]">
                    <div className="space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-base">
                        ⚔️
                      </div>
                      <h3 className="text-base font-bold text-[#fafafa]">
                        Join Match
                      </h3>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed">
                        Enter an invite code provided by another player.
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <input
                        value={roomInput}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setRoomInput(val);
                          if (lobbyError) setLobbyError(null);
                          if (roomError && validateRoomCode(val) === null) {
                            setRoomError(null);
                          }
                        }}
                        onBlur={() => {
                          if (roomInput.trim()) {
                            setRoomError(validateRoomCode(roomInput));
                          }
                        }}
                        aria-invalid={!!roomError}
                        aria-describedby={
                          roomError ? "join-room-error" : undefined
                        }
                        placeholder="Enter 6-character code"
                        maxLength={6}
                        inputMode="text"
                        autoCapitalize="characters"
                        spellCheck={false}
                        disabled={isCreatingRoom || isJoiningRoom}
                        className={`w-full min-h-[44px] rounded-lg border bg-[#111113] px-3.5 py-2.5 text-xs text-[#fafafa] placeholder:text-[#71717a] focus:outline-none uppercase font-mono tracking-wider transition ${
                          roomError
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-[#27272a] focus:border-[#22c55e]"
                        }`}
                      />
                      {roomError && (
                        <p
                          id="join-room-error"
                          role="alert"
                          className="text-xs text-rose-400 mt-1"
                        >
                          {roomError}
                        </p>
                      )}
                      <button
                        onClick={joinRoom}
                        disabled={
                          !isConnected ||
                          isCreatingRoom ||
                          isJoiningRoom ||
                          !roomInput.trim()
                        }
                        className="btn-secondary flex min-h-[44px] items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isJoiningRoom && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <span>
                          {isJoiningRoom ? "Joining Room..." : "Join Room"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Game Info Pill */}
                <div className="rounded-lg border border-[#27272a] bg-[#0a0a0b] p-3 text-center text-xs text-[#a1a1aa]">
                  <span>
                    💡 Circle (⭕) always makes the opening move. 3 in a row to
                    win!
                  </span>
                </div>
              </div>
            ))}

          {/* 2. WAITING ROOM STATE */}
          {gameStatus === "waiting" && roomId && (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[#27272a] bg-[#18181b] text-2xl">
                📡
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#fafafa]">
                  Waiting for Challenger
                </h3>
                <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
                  Share this room code with your opponent. The match starts as
                  soon as they join.
                </p>
              </div>

              {/* Room Code Showcase */}
              <div className="mx-auto max-w-sm rounded-xl border border-[#27272a] bg-[#0a0a0b] p-4 sm:p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">
                  Room Invite Code
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-[#fafafa]">
                    {roomId}
                  </span>
                  <button
                    onClick={handleCopyRoomId}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#18181b] px-3.5 py-2 text-xs font-semibold text-[#fafafa] transition hover:bg-[#27272a] cursor-pointer"
                  >
                    <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Cancel / Leave */}
              <div className="pt-2">
                <button
                  onClick={handleLeaveGame}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 cursor-pointer"
                >
                  Cancel & Leave Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;
