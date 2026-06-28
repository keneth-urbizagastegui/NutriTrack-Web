import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { Navbar } from '../components/layout/Navbar';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useAuthStore } from '../store/useAuthStore';

// Lazy loading de las vistas
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Traceability = lazy(() => import('../pages/Traceability'));
const UserDashboard = lazy(() => import('../pages/UserDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const ManagerDashboard = lazy(() => import('../pages/ManagerDashboard'));
const ProductList = lazy(() => import('../pages/ProductList'));
const CreateProduct = lazy(() => import('../pages/CreateProduct'));
const CreateBatch = lazy(() => import('../pages/CreateBatch'));
const CreateQualityReport = lazy(() => import('../pages/CreateQualityReport'));
const Profile = lazy(() => import('../pages/Profile'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Componente inteligente de redirección raíz según el rol del usuario autenticado
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const isAdmin = user.roles.includes('ROLE_ADMIN');
  const isManager = user.roles.includes('ROLE_MANAGER');
  
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isManager) return <Navigate to="/manager" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-dark-bg">
      <Navbar />
      <Breadcrumbs />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12 min-h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        }>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/traceability/:batchId" element={<Traceability />} />

            {/* Rutas Privadas Comunes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Rutas Privadas Deportista (ROLE_USER) */}
            <Route element={<PrivateRoute allowedRoles={['ROLE_USER']} />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/quality-reports/new/:batchId" element={<CreateQualityReport />} />
            </Route>

            {/* Rutas Privadas Admin (ROLE_ADMIN) */}
            <Route element={<PrivateRoute allowedRoles={['ROLE_ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Rutas Privadas Manager (ROLE_MANAGER) */}
            <Route element={<PrivateRoute allowedRoles={['ROLE_MANAGER']} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
            </Route>

            {/* Rutas Privadas Gestión Compartidas */}
            <Route element={<PrivateRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER']} />}>
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<CreateProduct />} />
              <Route path="/products/:productId/batches/new" element={<CreateBatch />} />
            </Route>

            {/* Redirección por defecto */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};
export default AppRoutes;
