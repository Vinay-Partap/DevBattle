import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { roleHome } from '../../utils/roles';

interface ProtectedRouteProps {
  /** Roles allowed to view the nested routes. Omit to allow any signed-in user. */
  allow?: Role[];
  children?: React.ReactNode;
}

/** Blocks unauthenticated visitors and sends users to their own workspace on role mismatch. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, children }) => {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        Restoring your secure session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(currentUser.role)) {
    return <Navigate to={roleHome(currentUser.role)} replace />;
  }

  return <>{children ?? <Outlet />}</>;
};

/** Keeps signed-in users away from the login / register screens. */
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        Restoring your secure session...
      </div>
    );
  }
  if (currentUser) return <Navigate to={roleHome(currentUser.role)} replace />;
  return <>{children}</>;
};
