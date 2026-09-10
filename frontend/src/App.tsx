import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/Protectedroutes";
import PublicRoute from "./components/PublicRoutes";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux/hook";
import { logout, setUser } from "./redux/slices/authSlice";
import api from "./api/axios";
import { socket } from "./Socket";
import Profile from "./pages/Profile";
  

function App() {
  const dispatch = useAppDispatch();

const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );

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
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;