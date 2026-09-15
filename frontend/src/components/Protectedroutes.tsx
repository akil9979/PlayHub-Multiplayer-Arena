import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAppSelector } from "../redux/hook";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
