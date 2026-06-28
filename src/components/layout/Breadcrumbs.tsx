import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // No renderizar breadcrumbs en login, registro o la raíz si no está logueado
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null;
  }

  // Traducciones amigables para las rutas
  const routeMap: { [key: string]: string } = {
    dashboard: 'Consumos',
    profile: 'Mis Alérgenos',
    manager: 'Panel Control',
    products: 'Productos',
    new: 'Nuevo',
    batches: 'Lotes',
    traceability: 'Trazabilidad pública',
    'quality-reports': 'Reportes de Calidad',
    admin: 'Panel Admin'
  };

  // Rutas intermedias que no deben ser clickeables por no tener páginas individuales independientes
  const nonClickablePaths = new Set(['traceability', 'quality-reports']);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 py-3 px-6 bg-white/5 border-b border-white/5 shadow-inner">
      <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
        <Home className="h-4 w-4" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        
        // Si el valor es numérico (ID de lote/producto), lo mostramos como ID o Código
        const displayName = routeMap[value] || (isNaN(Number(value)) ? value : `#${value}`);
        const shouldBeClickable = !isLast && !nonClickablePaths.has(value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-gray-600" />
            {!shouldBeClickable ? (
              <span className="text-gray-200 font-semibold">{displayName}</span>
            ) : (
              <Link to={to} className="hover:text-primary transition-colors">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
