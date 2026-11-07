import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Handshake,
  Hourglass,
  Loader2,
  LogOut,
  Radio,
  RotateCcw,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
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

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message: unknown }).message === "string" &&
    (payload as { message: string }).message.trim() !== ""
  ) {
    return (payload as { message: string }).message.trim();
  }
  return fallback;
}

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
  const [matchError, setMatchError] = useState<string | null>(null);

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

  const gameStatusRef = useRef(gameStatus);
  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

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
    setMatchError(null);
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
    setMatchError(null);
    setRematchError(null);
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

      if (gameStatusRef.current === "finished") {
        setWaitingForOpponent(false);
        setOpponentRequested(false);
        setRematchError(
          "Connection to the game server was lost. Please reconnect before requesting another rematch.",
        );
      } else if (gameStatusRef.current === "playing") {
        setMatchError("Game server connection error. Retrying...");
      } else {
        setLobbyError("Game server connection error. Retrying...");
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      setWaitingForOpponent(false);
      setOpponentRequested(false);

      if (gameStatusRef.current === "finished") {
        setRematchError(
          "Connection to the game server was lost. Please reconnect before requesting another rematch.",
        );
      }
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
      setMatchError(null);
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
      setMatchError(null);

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
      setMatchError(null);
    };

    const handleRematchRequested = () => {
      setOpponentRequested(true);
    };

    const handleRematchAccepted = (newGame: GameType) => {
      setGame(newGame);
      setGameStatus("playing");
      setOpponentRequested(false);
      setWaitingForOpponent(false);
      setRematchError(null);
      setMatchError(null);
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
      setMatchError(null);
    };

    const handleGameCreationFailed = () => {
      setIsCreatingRoom(false);
      setLobbyError("Failed to create room. Please try again.");
    };

    const handleJoinFailed = () => {
      setIsJoiningRoom(false);
      setLobbyError("Failed to join room. Please try again.");
    };

    const handleGameError = (payload: unknown) => {
      const message = extractErrorMessage(
        payload,
        "An unexpected game error occurred.",
      );

      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      setWaitingForOpponent(false);

      if (gameStatusRef.current === "playing") {
        setMatchError(message);
      } else if (gameStatusRef.current === "finished") {
        setRematchError(message);
      } else {
        setLobbyError(message);
      }
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

    socket.on("game-creation-failed", handleGameCreationFailed);
    socket.on("join-failed", handleJoinFailed);
    socket.on("game-error", handleGameError);

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

      socket.off("game-creation-failed", handleGameCreationFailed);
      socket.off("join-failed", handleJoinFailed);
      socket.off("game-error", handleGameError);
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
        <div
          className={`mx-auto flex w-full max-w-xl flex-1 min-h-0 flex-col justify-between px-3 sm:px-4 py-2 sm:py-3 gap-1.5 sm:gap-2 ${
            isMatchLive ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          {/* 1. Compact Header */}
          <div className="shrink-0 text-center space-y-1 w-full">
            <div className="flex items-center justify-between gap-2 w-full">
              {!isMatchLive ? (
                <button
                  type="button"
                  onClick={handleBackToDashboard}
                  className="group inline-flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white cursor-pointer select-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
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
              <span className="match-compact-hide inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
                <Sparkles className="w-3 h-3 text-accent" />
                <span>1v1 Tactical Arena</span>
              </span>
              <h1 className="match-compact-title mt-1 text-lg sm:text-2xl font-black tracking-tight text-white font-display">
                Tic-Tac-Toe
              </h1>
              <p className="match-compact-hide text-[11px] sm:text-xs text-zinc-400">
                Live Multiplayer Turn-Based Battle
              </p>
            </div>
          </div>

          {/* 2. Compact Player Row */}
          <div className="shrink-0 grid grid-cols-2 gap-2.5 w-full">
            {/* Circle Player Card */}
            <div
              className={`relative rounded-xl border p-2 sm:p-2.5 transition-all duration-200 ${
                game.currentPlayer === "circle" && !game.winner
                  ? "border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_16px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/40"
                  : "border-zinc-800/80 bg-[#101015]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-sm sm:text-base font-black text-cyan-400 shadow-sm">
                  O
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-white">
                      {player === "circle"
                        ? user?.name || "Player"
                        : "Opponent"}
                    </p>
                    {player === "circle" && (
                      <span className="shrink-0 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold text-cyan-300">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-cyan-400 font-semibold truncate">
                    Circle (O)
                  </p>
                </div>
              </div>
            </div>

            {/* Cross Player Card */}
            <div
              className={`relative rounded-xl border p-2 sm:p-2.5 transition-all duration-200 ${
                game.currentPlayer === "cross" && !game.winner
                  ? "border-purple-500/60 bg-purple-950/20 shadow-[0_0_16px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40"
                  : "border-zinc-800/80 bg-[#101015]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-950/40 text-sm sm:text-base font-black text-purple-400 shadow-sm">
                  X
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-white">
                      {player === "cross" ? user?.name || "Player" : "Opponent"}
                    </p>
                    {player === "cross" && (
                      <span className="shrink-0 rounded-full bg-purple-500/20 border border-purple-500/40 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold text-purple-300">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-purple-400 font-semibold truncate">
                    Cross (X)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Compact Turn / Status Banner */}
          <div className="shrink-0 w-full space-y-1.5">
            {matchError && (
              <ErrorMessage
                compact
                message={matchError}
                onDismiss={() => setMatchError(null)}
              />
            )}

            {!game.winner && gameStatus === "playing" && (
              <div
                className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-center text-xs font-bold leading-tight truncate shadow-sm transition-all ${
                  isMyTurn
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 shadow-[0_0_16px_rgba(34,197,94,0.15)]"
                    : "border-amber-500/40 bg-amber-950/30 text-amber-300"
                }`}
              >
                {isMyTurn ? (
                  <Target className="w-4 h-4 shrink-0 text-accent animate-pulse" />
                ) : (
                  <Hourglass className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
                )}
                <span className="font-bold">
                  {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                </span>
                <span className="hidden sm:inline text-xs text-zinc-400 truncate">
                  {isMyTurn
                    ? "— Choose an empty cell to place your symbol"
                    : "— Waiting for rival to move..."}
                </span>
              </div>
            )}

            {gameStatus === "opponent-left" && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2 text-center text-xs font-bold text-emerald-300 leading-tight truncate shadow-sm">
                <LogOut className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-bold">Opponent Disconnected</span>
                <span className="hidden sm:inline text-xs text-zinc-400 truncate">
                  — Your opponent has left the match. You have been awarded the
                  victory!
                </span>
              </div>
            )}

            {gameStatus === "opponent-disconnected" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-center text-xs text-zinc-400">
                Your opponent left the finished match. Return to the dashboard
                to start a new game.
              </div>
            )}

            {game.winner && gameStatus !== "opponent-left" && (
              <div
                className={`flex items-center justify-center gap-2.5 rounded-xl border px-3.5 py-2 text-center text-xs font-bold leading-tight truncate shadow-sm ${
                  game.winner === "draw"
                    ? "border-zinc-700 bg-zinc-850 text-white"
                    : game.winner === player
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    : "border-rose-500/40 bg-rose-950/40 text-rose-300"
                }`}
              >
                {game.winner === "draw" ? (
                  <Handshake className="w-4 h-4 shrink-0 text-zinc-300" />
                ) : game.winner === player ? (
                  <Trophy className="w-4 h-4 shrink-0 text-accent animate-bounce-short" />
                ) : (
                  <span className="text-base shrink-0">💔</span>
                )}
                <span className="font-bold">
                  {game.winner === "draw"
                    ? "Stalemate — It's a Draw!"
                    : game.winner === player
                    ? "VICTORY — You Won!"
                    : "DEFEAT — You Lost!"}
                </span>
                <span className="hidden sm:inline text-xs text-zinc-400 truncate">
                  {game.winner === "draw"
                    ? "— Well played from both sides. Ready for a decider?"
                    : game.winner === player
                    ? "— Outstanding tactical positioning."
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
            <Board
              game={game}
              roomId={roomId}
              player={player}
              onError={setMatchError}
            />
          </div>

          {/* 5. Bottom Actions Row */}
          <div className="shrink-0 w-full py-1">
            {game.winner && gameStatus === "finished" ? (
              <div className="space-y-2">
                {rematchError && (
                  <ErrorMessage
                    compact
                    message={rematchError}
                    onDismiss={() => setRematchError(null)}
                  />
                )}
                {opponentRequested && (
                  <div className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-accent animate-pulse">
                    <Swords className="w-3.5 h-3.5" />
                    <span>Your opponent has requested a rematch!</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 w-full">
                  {!opponentRequested && (
                    <button
                      type="button"
                      onClick={handleRematchRequest}
                      disabled={waitingForOpponent}
                      className="btn-primary min-h-[40px] sm:min-h-[44px] w-full sm:w-auto px-5 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-accent-glow"
                    >
                      {waitingForOpponent ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Waiting for opponent...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Request Rematch</span>
                        </span>
                      )}
                    </button>
                  )}

                  {opponentRequested && (
                    <button
                      type="button"
                      onClick={handleRematchRequest}
                      disabled={waitingForOpponent}
                      className="btn-primary min-h-[40px] sm:min-h-[44px] w-full sm:w-auto px-5 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-accent-glow"
                    >
                      {waitingForOpponent ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Starting Rematch...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Rematch</span>
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleLeaveGame}
                    className="btn-secondary min-h-[40px] sm:min-h-[44px] w-full sm:w-auto px-5 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <span>Leave Match</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleLeaveGame}
                  className="inline-flex min-h-[38px] sm:min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-5 py-2 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-900/40 hover:text-rose-200 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Game</span>
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
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white cursor-pointer select-none"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Dashboard</span>
              </button>

              {gameStatus === "idle" &&
                !roomId &&
                selectedGame === "tic-tac-toe" && (
                  <button
                    type="button"
                    onClick={() => setSelectedGame(null)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white cursor-pointer select-none"
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
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121217] p-5 sm:p-8 shadow-[0_16px_50px_-10px_rgba(0,0,0,0.7)]">
          {/* Arena Title */}
          <div className="mb-6 sm:mb-8 text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>1v1 Tactical Arena</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display">
              {selectedGame === null && gameStatus === "idle" && !roomId
                ? "Select Game"
                : "Tic-Tac-Toe Arena"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
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
                  <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#0d0d10] p-5 transition-all duration-150 hover:border-zinc-700 hover:bg-[#111115]">
                    <div className="space-y-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-400 shadow-sm">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-display">
                          Host Match
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                          Generate a private room code and invite a friend to play.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      disabled={!isConnected || isCreatingRoom || isJoiningRoom}
                      className="btn-primary mt-6 flex min-h-[44px] items-center justify-center gap-2 w-full py-3 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-accent-glow"
                    >
                      {isCreatingRoom && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>
                        {isCreatingRoom
                          ? "Creating Room..."
                          : "Create Private Room"}
                      </span>
                    </button>
                  </div>

                  {/* Join a match */}
                  <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#0d0d10] p-5 transition-all duration-150 hover:border-zinc-700 hover:bg-[#111115]">
                    <div className="space-y-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/30 text-purple-400 shadow-sm">
                        <Swords className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-display">
                          Join Match
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                          Enter an invite code provided by another player.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5">
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
                        className={`w-full min-h-[44px] rounded-xl border bg-[#141419] px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none uppercase font-mono tracking-widest transition-all ${
                          roomError
                            ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                            : "border-zinc-800 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                        type="button"
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
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        <span>
                          {isJoiningRoom ? "Joining Room..." : "Join Room"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Game Info Pill */}
                <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-[#0d0d10] p-3 text-center text-xs text-zinc-400">
                  <span className="text-accent font-semibold">Tip:</span>
                  <span>Circle (⭕) always makes the opening move. 3 in a row to win!</span>
                </div>
              </div>
            ))}

          {/* 2. WAITING ROOM STATE */}
          {gameStatus === "waiting" && roomId && (
            <div className="space-y-6 py-4 text-center">
              {lobbyError && (
                <div className="max-w-sm mx-auto text-left">
                  <ErrorMessage
                    compact
                    message={lobbyError}
                    onDismiss={() => setLobbyError(null)}
                  />
                </div>
              )}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/30 text-accent shadow-sm">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white font-display">
                  Waiting for Challenger
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Share this room code with your opponent. The match starts as
                  soon as they join.
                </p>
              </div>

              {/* Room Code Showcase */}
              <div className="mx-auto max-w-sm rounded-2xl border border-zinc-800/90 bg-[#0d0d10] p-5 shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Room Invite Code
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-black tracking-[0.25em] text-white select-all">
                    {roomId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRoomId}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 cursor-pointer shadow-sm active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Cancel / Leave */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLeaveGame}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/40 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cancel & Leave Room</span>
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
