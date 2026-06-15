import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="glass-panel p-8 max-w-md w-full flex flex-col items-center gap-6 shadow-2xl rounded-2xl">
        <div className="bg-amber-950/30 border border-amber-800 p-4 rounded-full">
          <AlertTriangle className="h-12 w-12 text-amber-500 animate-bounce" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
        <p className="text-xl font-bold text-gray-200">Página No Encontrada</p>
        <p className="text-sm text-gray-400">
          Lo sentimos, la página que estás buscando no existe o ha sido movida temporalmente.
        </p>
        <Button asChild className="w-full bg-primary hover:bg-emerald-600 text-white flex items-center gap-2 mt-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Link>
        </Button>
      </div>
    </div>
  );
};
export default NotFound;
