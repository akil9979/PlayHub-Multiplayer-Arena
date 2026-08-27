import { useEffect, useState } from "react";
import { socket } from "../Socket";
import Board from "../components/Board";
import type { Game as GameType, Player } from "../types/gameType";
import { useAppSelector } from "../redux/hook";

function Game() {
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");

  const [opponentRequested, setOpponentRequested] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const [game, setGame] = useState<GameType | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const user = useAppSelector((state) => state.auth.user);

  const handleCreateRoom = () => {
    if (!socket.connected) {
      alert("Not connected to game server.");
      return;
    }

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

    socket.emit("join-room", roomInput.trim());
  };

  const handleRematchRequest = () => {
    if (!socket.connected) {
      alert("Not connected to game server.");
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

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    socket.on("room-created", (roomId) => {
      setRoomId(roomId);
    });

    socket.on("room-not-found", () => {
      alert("Room not found!");
    });

    socket.on("room-full", () => {
      alert("Room is full!");
    });

    socket.on("player-joined", () => {
      alert("A player has joined the room!");
    });

    socket.on("game-created", (createdGame) => {
      setGame(createdGame);
    });

    socket.on("player-assigned", (player) => {
      setPlayer(player);
    });

    socket.on("room-joined", (joinedRoomId) => {
      setRoomId(joinedRoomId);
    });

    socket.on("game-updated", (updatedGame) => {
      setGame(updatedGame);
    });

    socket.on("player-disconnected", (updatedGame) => {
      setGame(updatedGame);
      alert("Your opponent has disconnected!");
    });

    socket.on("rematch-requested", () => {
      setOpponentRequested(true);
      alert("Your opponent has requested a rematch!");
    });

    socket.on("rematch-accepted", (newGame) => {
      setGame(newGame);
      setWaitingForOpponent(false);
      setOpponentRequested(false);
      alert("Rematch accepted! Game reset.");
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-created");
      socket.off("player-assigned");
      socket.off("room-not-found");
      socket.off("room-full");
      socket.off("player-joined");
      socket.off("game-created");
      socket.off("room-joined");
      socket.off("game-updated");
      socket.off("player-disconnected");
      socket.off("rematch-requested");
      socket.off("rematch-accepted");
    };
  }, []);

  return (
    <>
      <h1>Tic Tac Toe</h1>

      <button onClick={handleCreateRoom}>Create Room</button>

      <p>Room Code: {roomId}</p>

      <input
        value={roomInput}
        onChange={(e) => setRoomInput(e.target.value)}
        placeholder="Enter room code"
      />

      <button onClick={joinRoom}>Join Room</button>

      {game !== null && (
        <>
          <p>
            {"Welcome, " + (user?.name || "Player")}! You are:{" "}
            {player === "circle" ? "⭕ Circle" : "❌ Cross"}
          </p>

          <p>
            {game.currentPlayer === player
              ? "🎯 Your Turn"
              : "⏳ Opponent's Turn"}
          </p>
        </>
      )}

      <Board game={game} roomId={roomId} />
      <button onClick={handleLeaveGame}>Leave Game</button>

      {game?.winner && (
        <p>
          {game.winner === player
            ? "🏆 You Win!"
            : game.winner === "draw"
              ? "🤝 It's a Draw!"
              : "💔 You Lose!"}
        </p>
      )}

      {game?.winner && !opponentRequested && (
        <>
          <button onClick={handleRematchRequest} disabled={waitingForOpponent}>
            {waitingForOpponent ? "Waiting for opponent..." : "Request Rematch"}
          </button>

          {waitingForOpponent && <p>Waiting for your opponent to accept...</p>}
        </>
      )}

      {game?.winner && opponentRequested && (
        <>
          <p>Your opponent wants a rematch.</p>

          <button onClick={handleRematchRequest}>Accept Rematch</button>
        </>
      )}
    </>
  );
}

export default Game;
