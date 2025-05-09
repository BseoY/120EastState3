import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../auth';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  authChecked: boolean;
  allowedRoles: string[];
  user: any;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  authChecked,
  allowedRoles,
  user,
  children,
}) => {
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
    return <Navigate to="/error" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
