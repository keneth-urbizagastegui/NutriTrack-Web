import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Loader2, Lock, Mail, User, Check, X } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Reglas de validación de contraseña en tiempo real
  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[@$!%*?&!#%^&()*+_\-=[\]{}|;:',.<>/?~]/.test(password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('Todos los campos son obligatorios.');
      return;
    }

    if (!isPasswordValid) {
      toast.error('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', { username, email, password });
      toast.success('Registro exitoso. Por favor, inicia sesión.');
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al registrar el usuario. El correo o usuario ya existe.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <Card className="glass-panel border-none w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white tracking-tight">Registro</CardTitle>
          <CardDescription className="text-gray-400">
            Crea tu cuenta de deportista y empieza a trazar tu nutrición
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
                  className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="deportista@utec.edu.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pl-10 focus:border-primary"
                  disabled={loading}
                  required
                />
              </div>

              {/* Indicador visual de seguridad de contraseña */}
              {password.length > 0 && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-1.5 mt-2 text-xs">
                  <p className="font-semibold text-gray-300 mb-1">Requisitos de contraseña:</p>
                  <div className="flex items-center gap-1.5">
                    {rules.minLength ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
                    <span className={rules.minLength ? 'text-gray-300' : 'text-gray-500'}>Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasUpper ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
                    <span className={rules.hasUpper ? 'text-gray-300' : 'text-gray-500'}>Una mayúscula</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasNumber ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
                    <span className={rules.hasNumber ? 'text-gray-300' : 'text-gray-500'}>Un número</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasSpecial ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
                    <span className={rules.hasSpecial ? 'text-gray-300' : 'text-gray-500'}>Un carácter especial (ej: @, $, !)</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 mt-4"
              disabled={loading || !isPasswordValid}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Ingresa aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
export default Register;
