import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";

type Props = {
  roles?: Array<"MASTER_ADMIN" | "ADMIN" | "TEKNISI">;
  redirectTo?: string;
  children?: React.ReactNode;
};

export function ProtectedRoute({ roles, redirectTo = "/login", children }: Props) {
  const { user, loading } = useAuth();

  const isAllowed = useMemo(() => {
    if (!roles || roles.length === 0) return true;
    if (!user) return false;
    return roles.includes(user.role);
  }, [roles, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center">
        <p className="text-xl font-semibold text-slate-800">Akses Ditolak</p>
        <p className="text-slate-500">Role kamu tidak diizinkan membuka halaman ini.</p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
