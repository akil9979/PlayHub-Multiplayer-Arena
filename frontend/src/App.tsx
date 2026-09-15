import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/Protectedroutes";
import PublicRoute from "./components/PublicRoutes";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux/hook";
import { logout, setUser } from "./redux/slices/authSlice";
import api from "./api/axios";
import { socket } from "./Socket";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import ChallengeOverlay from "./components/ChallengeOverlay";

function AuthLoadingScreen() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
          aria-hidden
        />
        <p className="font-display text-sm font-semibold tracking-wider text-indigo-300">
          PLAYHUB
        </p>
        <p className="text-sm text-slate-400">Checking authentication...</p>
      </div>
    </div>
  );
}

function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/users/profile");
        dispatch(setUser(response.data));
      } catch (error) {
        console.error(error);
        dispatch(logout());
      }
    };

    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <>
      {isAuthenticated && <ChallengeOverlay />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </>
  );
}

export default App;
