import { useAppSelector } from "../redux/hook";
import api from "../api/axios";
import { useAppDispatch } from "../redux/hook";
import { logout } from "../redux/slices/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { useState} from "react";
import { useEffect } from "react";
// import Game from "./Game";
import GameHistoryComponent from "../components/GameHistory";
import type { GameHistory } from "../types/game";




export default function Dashboard() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  const user = useAppSelector((state) => state.auth.user);
  const handleLogout=async () => {
    try {
      const result=await api.get("/users/logout")
      console.log(result.data);
      dispatch(logout())
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  }
  
useEffect(() => {
  const fetchGameHistory = async () => {
    try {
      const result = await api.get("/games/history");
      setGameHistory(result.data);
    } catch (error) {
      console.error(error);
    }
  };

  fetchGameHistory();
}, []);
  return (
    <>
      <h1>Dashboard</h1>
       <p>Welcome, {user?.name}</p>

      <GameHistoryComponent games={gameHistory} userId={user?.id} />

      <Link to="/game">Go to Game</Link>
      <br />
      <button onClick={handleLogout}>logout</button>
    </>
  )
}
