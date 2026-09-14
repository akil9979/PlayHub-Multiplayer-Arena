import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../Socket";
import Board from "../components/Board";
import type { Game as GameType, Player } from "../types/gameType";
import { useAppSelector } from "../redux/hook";

type GameStatus =
  | "idle"
  | "waiting"
  | "playing"
  | "finished"
  | "opponent-left";

function Game() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read initial match data if navigated from an accepted challenge
  const challengeState = location.state as {
    roomId?: string;
    game?: GameType;
    player?: Player;
  } | null;

  const [roomId, setRoomId] = useState(challengeState?.roomId || "");
  const [roomInput, setRoomInput] = useState("");

  const [opponentRequested, setOpponentRequested] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [copied, setCopied] = useState(false);

  const [gameStatus, setGameStatus] = useState<GameStatus>(
    challengeState?.roomId && challengeState?.game ? "playing" : "idle",
  );

  const [game, setGame] = useState<GameType | null>(
    challengeState?.game || null,
  );
  const [player, setPlayer] = useState<Player | null>(
    challengeState?.player || null,
  );

  const [isConnected, setIsConnected] = useState(socket.connected);

  const user = useAppSelector((state) => state.auth.user);

  const handleCreateRoom = () => {
    if (!socket.connected) {
      alert("Not connected to game server.");
      return;
    }

    setGame(null);
    setPlayer(null);
    setOpponentRequested(false);
    setWaitingForOpponent(false);
    setGameStatus("idle");

    socket.emit("create-room");
  };

  const joinRoom = () => {
    if (!socket.connected) {
      alert("Not connected to game server.");
      return;
    }

    if (!roomInput.trim()) {
      alert("Please enter a room code.");
      return;
    }

    setGame(null);
    setPlayer(null);
    setOpponentRequested(false);
    setWaitingForOpponent(false);
    setGameStatus("idle");

    socket.emit("join-room", roomInput.trim());
  };

  const handleRematchRequest = () => {
    if (!socket.connected) {
      alert("Not connected to game server.");
      return;
    }

    if (!roomId || !game?.winner) {
      return;
    }

    socket.emit("request-rematch", roomId);
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
  };

  const handleBackToDashboard = () => {
    if (roomId) {
      handleLeaveGame();
    }
    navigate("/");
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
      setIsConnected(true);
    };

    const handleConnectError = (error: Error) => {
      console.error("Socket connection failed:", error.message);
      setIsConnected(false);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    };

    const handleRoomCreated = (createdRoomId: string) => {
      setRoomId(createdRoomId);
      setGameStatus("waiting");
    };

    const handleRoomNotFound = () => {
      alert("Room not found! Please check the room code.");
    };

    const handleRoomFull = () => {
      alert("This room is already full (maximum 2 players).");
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

      socket.off("rematch-requested", handleRematchRequested);
      socket.off("rematch-accepted", handleRematchAccepted);
      socket.off("challenge-accepted", handleChallengeAccepted);
    };
  }, []);

  const isMyTurn = game && player && game.currentPlayer === player && !game.winner;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:py-8 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToDashboard}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">
              ←
            </span>
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isConnected
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Main Arena Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

          {/* Arena Title */}
          <div className="mb-6 text-center">
            <span className="rounded-md bg-gradient-to-r from-indigo-600 to-pink-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-md">
              1v1 Tactical Arena
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Tic-Tac-Toe
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Live Multiplayer Turn-Based Battle
            </p>
          </div>

          {/* 1. LOBBY STATE (No Room Selected) */}
          {gameStatus === "idle" && !roomId && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Host a match */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg transition-all hover:border-indigo-500/40">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 text-lg">
                      👑
                    </div>
                    <h3 className="text-base font-bold text-white">Host Match</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generate a private room code and invite a friend to play.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!isConnected}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Private Room
                  </button>
                </div>

                {/* Join a match */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg transition-all hover:border-purple-500/40">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 text-lg">
                      ⚔️
                    </div>
                    <h3 className="text-base font-bold text-white">Join Match</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Enter an invite code provided by another player.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <input
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      placeholder="Enter 6-character code"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none"
                    />
                    <button
                      onClick={joinRoom}
                      disabled={!isConnected}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Info Pill */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center text-xs text-slate-400">
                <span>💡 Circle (⭕) always makes the opening move. 3 in a row to win!</span>
              </div>
            </div>
          )}

          {/* 2. WAITING ROOM STATE */}
          {gameStatus === "waiting" && roomId && (
            <div className="space-y-6 py-4 text-center">
              {/* Radar pulse animation */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/10 text-2xl text-indigo-400 shadow-lg shadow-indigo-500/20">
                  📡
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">
                  Waiting for Challenger
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Share this room code with your opponent. The match starts as soon as they join.
                </p>
              </div>

              {/* Room Code Showcase */}
              <div className="mx-auto max-w-sm rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-5 shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Room Invite Code
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-black tracking-[0.25em] text-white">
                    {roomId}
                  </span>
                  <button
                    onClick={handleCopyRoomId}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 active:scale-95"
                  >
                    <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Cancel / Leave */}
              <div className="pt-2">
                <button
                  onClick={handleLeaveGame}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Cancel & Leave Room
                </button>
              </div>
            </div>
          )}

          {/* 3. ACTIVE GAMEPLAY & RESULTS */}
          {(gameStatus === "playing" || gameStatus === "finished" || gameStatus === "opponent-left") &&
            game &&
            player && (
              <div className="space-y-6">
                {/* VS Header & Player Identity Cards */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  {/* Circle Player Card */}
                  <div
                    className={`relative rounded-2xl border p-3.5 transition-all duration-300 ${
                      game.currentPlayer === "circle" && !game.winner
                        ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                        : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-base font-black text-cyan-400">
                        O
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-white">
                            {player === "circle" ? user?.name || "Player" : "Opponent"}
                          </p>
                          {player === "circle" && (
                            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-cyan-400 font-semibold">
                          Circle (O)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cross Player Card */}
                  <div
                    className={`relative rounded-2xl border p-3.5 transition-all duration-300 ${
                      game.currentPlayer === "cross" && !game.winner
                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                        : "border-slate-800 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-base font-black text-purple-400">
                        X
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-white">
                            {player === "cross" ? user?.name || "Player" : "Opponent"}
                          </p>
                          {player === "cross" && (
                            <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-purple-400 font-semibold">
                          Cross (X)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Turn Status Banner */}
                {!game.winner && gameStatus === "playing" && (
                  <div
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-center text-xs font-bold transition-all ${
                      isMyTurn
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10 animate-pulse"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    <span>{isMyTurn ? "🎯" : "⏳"}</span>
                    <span>
                      {isMyTurn
                        ? "Your Turn — Choose a square to place your symbol"
                        : "Opponent's Turn — Waiting for rival move..."}
                    </span>
                  </div>
                )}

                {/* Opponent Left Notice Banner */}
                {gameStatus === "opponent-left" && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center shadow-xl">
                    <div className="text-3xl">🚪</div>
                    <h3 className="mt-2 text-lg font-bold text-emerald-400">
                      Opponent Disconnected
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">
                      Your opponent has left the match. You have been awarded the victory!
                    </p>
                  </div>
                )}

                {/* Game Result Screen (When finished normally) */}
                {game.winner && gameStatus !== "opponent-left" && (
                  <div
                    className={`rounded-2xl border p-6 text-center shadow-2xl ${
                      game.winner === "draw"
                        ? "border-amber-500/40 bg-amber-500/10"
                        : game.winner === player
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-rose-500/40 bg-rose-500/10"
                    }`}
                  >
                    <div className="text-4xl">
                      {game.winner === "draw"
                        ? "🤝"
                        : game.winner === player
                          ? "🏆"
                          : "💔"}
                    </div>
                    <h2
                      className={`mt-2 text-2xl font-black ${
                        game.winner === "draw"
                          ? "text-amber-300"
                          : game.winner === player
                            ? "text-emerald-300"
                            : "text-rose-300"
                      }`}
                    >
                      {game.winner === "draw"
                        ? "Stalemate — It's a Draw!"
                        : game.winner === player
                          ? "VICTORY — You Won!"
                          : "DEFEAT — You Lost!"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-300">
                      {game.winner === "draw"
                        ? "Well played from both sides. Ready for a decider?"
                        : game.winner === player
                          ? "Great game! Outstanding tactical positioning."
                          : "Better luck next round! Request a rematch to settle the score."}
                    </p>
                  </div>
                )}

                {/* Interactive Game Board */}
                <Board game={game} roomId={roomId} player={player} />

                {/* Rematch Section (Only when game is finished and opponent has NOT left) */}
                {game.winner && gameStatus !== "opponent-left" && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center space-y-3">
                    {opponentRequested && (
                      <p className="text-xs font-semibold text-indigo-300 animate-pulse">
                        ⚔️ Your opponent has requested a rematch!
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {!opponentRequested && (
                        <button
                          onClick={handleRematchRequest}
                          disabled={waitingForOpponent}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {waitingForOpponent
                            ? "Waiting for opponent..."
                            : "🔄 Request Rematch"}
                        </button>
                      )}

                      {opponentRequested && (
                        <button
                          onClick={handleRematchRequest}
                          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-95"
                        >
                          ✓ Accept Rematch
                        </button>
                      )}

                      <button
                        onClick={handleLeaveGame}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                      >
                        Leave Match
                      </button>
                    </div>
                  </div>
                )}

                {/* Leave Game button during active match or after opponent left */}
                {(!game.winner || gameStatus === "opponent-left") && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLeaveGame}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 active:scale-95"
                    >
                      Leave Game
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Game;