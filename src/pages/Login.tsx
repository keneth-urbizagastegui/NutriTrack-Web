import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = response.data;

      // Guardar en el contexto de autenticación
      login(username, accessToken, refreshToken);
      
      toast.success('Sesión iniciada correctamente.');
      
      // Redirigir según el rol
      const isManagement = username.toLowerCase().includes('admin') || username.toLowerCase().includes('manager');
      if (isManagement) {
        navigate('/manager');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Credenciales inválidas o error de conexión.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <Card className="glass-panel border-none w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Adorno estético superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white tracking-tight">NutriTrack</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa a tu cuenta para continuar con tu trazabilidad fitness
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="victor.fitness"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pl-10 pr-10 focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pb-8 pt-2">
          <p className="text-xs text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
export default Login;

