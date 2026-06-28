import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User as UserIcon, Dumbbell, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isManagement = user?.roles.some((role) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));

  return (
    <nav className="glass-panel sticky top-0 z-50 w-full rounded-none border-t-0 border-x-0 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-6 w-6 text-primary animate-pulse" />
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          NutriTrack
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {isAuthenticated && user ? (
          <>
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              {!isManagement ? (
                <>
                  <Link to="/dashboard" className="text-gray-300 hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/profile" className="text-gray-300 hover:text-primary transition-colors">
                    Mis Alérgenos
                  </Link>
                </>
              ) : (
                <>
                  {user.roles.includes('ROLE_ADMIN') ? (
                    <Link to="/admin" className="text-gray-300 hover:text-primary transition-colors">
                      Panel Admin
                    </Link>
                  ) : (
                    <Link to="/manager" className="text-gray-300 hover:text-primary transition-colors">
                      Panel Gestor
                    </Link>
                  )}
                  <Link to="/products" className="text-gray-300 hover:text-primary transition-colors">
                    Productos
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full border border-white/5">
                <UserIcon className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-gray-200">{user.username}</span>
                {user.roles.includes('ROLE_ADMIN') && (
                  <span className="text-[10px] bg-red-950/50 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                    <ShieldAlert className="h-3 w-3" /> ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-rose-400 transition-colors py-1.5 px-3 rounded-md hover:bg-rose-950/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-primary hover:bg-emerald-600 transition-colors py-2 px-4 rounded-lg shadow-md"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
