import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface PrivateRouteProps {
  allowedRoles?: string[];
  fallbackPath?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const hasRequiredRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      // Si el rol es ROLE_USER, redirige a /dashboard, si es ADMIN/MANAGER, a /manager
      const isAdmin = user.roles.includes('ROLE_ADMIN');
      const isManager = user.roles.includes('ROLE_MANAGER');
      const finalFallback = isAdmin ? '/admin' : (isManager ? '/manager' : '/dashboard');
      return <Navigate to={finalFallback} replace />;
    }
  }

  return <Outlet />;
};
