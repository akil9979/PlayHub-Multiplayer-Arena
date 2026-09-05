import { useEffect, useState } from "react";
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
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");

  const [opponentRequested, setOpponentRequested] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");

  const [game, setGame] = useState<GameType | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

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

  const handleCopyRoomId = async () => {
    if (!roomId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(roomId);
      alert("Room code copied!");
    } catch (error) {
      console.error("Failed to copy room code:", error);
    }
  };

  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected!");
      console.log("Socket ID:", socket.id);
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
      alert("Room not found!");
    };

    const handleRoomFull = () => {
      alert("Room is full!");
    };

    const handlePlayerJoined = () => {
      setGameStatus("playing");
      alert("A player has joined the room!");
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

      alert("Your opponent has disconnected!");
    };

    const handleRematchRequested = () => {
      setOpponentRequested(true);
      alert("Your opponent has requested a rematch!");
    };

    const handleRematchAccepted = (newGame: GameType) => {
      setGame(newGame);
      setGameStatus("playing");

      setOpponentRequested(false);
      setWaitingForOpponent(false);

      alert("Rematch accepted! Game reset.");
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tic Tac Toe
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Multiplayer game
            </p>
          </div>

          <div className="space-y-6">
            {/* Connection status */}
            <div className="flex justify-center">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isConnected
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {isConnected ? "● Connected" : "● Disconnected"}
              </span>
            </div>

            {/* Room selection / room code */}
            {!roomId ? (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={handleCreateRoom}
                    disabled={!isConnected}
                    className="flex-1 rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create Room
                  </button>

                  <div className="flex flex-1 gap-2">
                    <input
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      placeholder="Enter room code"
                      className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                    />

                    <button
                      onClick={joinRoom}
                      disabled={!isConnected}
                      className="rounded-xl bg-slate-700 px-5 py-3 font-semibold transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 text-center">
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Room Code
                </p>

                <div className="mt-2 flex items-center justify-center gap-3">
                  <p className="text-xl font-bold tracking-[0.3em] text-indigo-300">
                    {roomId}
                  </p>

                  <button
                    onClick={handleCopyRoomId}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Player information */}
            {game && player && (
              <div className="mb-8">
                <div className="mb-4 text-center">
                  <p className="text-sm text-slate-400">
                    Welcome, {user?.name || "Player"}
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    You are{" "}
                    {player === "circle"
                      ? "⭕ Circle"
                      : "❌ Cross"}
                  </p>
                </div>

                <div
                  className={`mx-auto w-fit rounded-full px-6 py-3 text-sm font-bold ${
                    game.winner
                      ? "bg-slate-700 text-slate-300"
                      : game.currentPlayer === player
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {game.winner
                    ? "Game Finished"
                    : game.currentPlayer === player
                      ? "🎯 Your Turn"
                      : "⏳ Opponent's Turn"}
                </div>
              </div>
            )}

            {/* Waiting state */}
            {gameStatus === "waiting" && (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-400" />

                <h2 className="text-xl font-semibold">
                  Waiting for opponent...
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Share the room code with your opponent.
                </p>
              </div>
            )}

            {/* Active game */}
            {gameStatus === "playing" && game && player && (
              <Board
                game={game}
                roomId={roomId}
                player={player}
              />
            )}

            {/* Opponent left */}
            {gameStatus === "opponent-left" && (
              <div className="py-10 text-center">
                <h2 className="text-xl font-semibold">
                  Opponent Left the Game
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Your opponent has disconnected. You won the game.
                </p>
              </div>
            )}

            {/* Result */}
            {game?.winner && gameStatus !== "opponent-left" && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-6 text-center">
                <h2 className="text-2xl font-bold">
                  {game.winner === "draw"
                    ? "🤝 It's a Draw!"
                    : game.winner === player
                      ? "🏆 You Win!"
                      : "💔 You Lose!"}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {game.winner === "draw"
                    ? "Great game from both sides."
                    : game.winner === player
                      ? "Congratulations! You played well."
                      : "Better luck next game."}
                </p>
              </div>
            )}

            {/* Rematch */}
            {game?.winner &&
              !gameStatus.includes("opponent-left") && (
                <div className="flex flex-col items-center gap-3">
                  {!opponentRequested && (
                    <button
                      onClick={handleRematchRequest}
                      disabled={waitingForOpponent}
                      className="w-full max-w-xs rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {waitingForOpponent
                        ? "Waiting for opponent..."
                        : "Request Rematch"}
                    </button>
                  )}

                  {waitingForOpponent && (
                    <p className="text-sm text-slate-400">
                      Waiting for your opponent to accept...
                    </p>
                  )}

                  {opponentRequested && (
                    <>
                      <p className="text-sm text-slate-300">
                        Your opponent wants a rematch.
                      </p>

                      <button
                        onClick={handleRematchRequest}
                        className="w-full max-w-xs rounded-xl bg-emerald-500 px-5 py-3 font-semibold transition hover:bg-emerald-400"
                      >
                        Accept Rematch
                      </button>
                    </>
                  )}
                </div>
              )}

            {/* Leave */}
            {roomId && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLeaveGame}
                  className="rounded-xl border border-red-500/40 px-6 py-3 font-semibold text-red-400 transition hover:bg-red-500/10"
                >
                  Leave Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;