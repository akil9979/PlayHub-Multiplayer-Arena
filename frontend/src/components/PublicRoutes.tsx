import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAppSelector } from "../redux/hook";

type PublicRouteProps = {
  children: ReactNode;
};

export default function PublicRoute({ children }: PublicRouteProps) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  if (isLoading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-400">Checking authentication...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
