import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User as UserIcon, Dumbbell, ShieldAlert, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const isManagement = user?.roles.some((role) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));

  return (
    <>
      <nav className="glass-panel sticky top-0 z-50 w-full rounded-none border-t-0 border-x-0 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary animate-pulse" />
          <Link to="/" className="text-xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            NutriTrack
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated && user ? (
            <>
              {/* Desktop Menu */}
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

              {/* User badge and logout button (Desktop) */}
              <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-6">
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
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-rose-400 transition-colors py-1.5 px-3 rounded-md hover:bg-rose-950/20 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
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

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && isAuthenticated && user && (
        <div className="md:hidden w-full glass-panel border-t-0 border-x-0 border-b border-white/10 px-6 py-4 space-y-4 animate-fade-in shadow-xl bg-[#030712]/95 backdrop-blur-md">
          <div className="flex flex-col gap-3 font-semibold text-sm">
            {!isManagement ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-primary transition-colors py-1.5"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-primary transition-colors py-1.5"
                >
                  Mis Alérgenos
                </Link>
              </>
            ) : (
              <>
                {user.roles.includes('ROLE_ADMIN') ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-350 hover:text-primary transition-colors py-1.5"
                  >
                    Panel Admin
                  </Link>
                ) : (
                  <Link
                    to="/manager"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-350 hover:text-primary transition-colors py-1.5"
                  >
                    Panel Gestor
                  </Link>
                )}
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-350 hover:text-primary transition-colors py-1.5"
                >
                  Productos
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-white/5 py-1 px-3 w-fit rounded-full border border-white/5">
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
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-rose-400 transition-colors py-1.5 w-fit rounded-md cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default Navbar;
