/**
 * LoginPage - Inicio de sesión
 * Reserva Club Frontend
 */

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToastHelpers } from '../../components/ui/Toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError } = useToastHelpers();
  const [showPassword, setShowPassword] = useState(false);

  const redirect = searchParams.get('redirect') || '/mis-reservas';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      await login(data.email, data.password);
    },
    onSuccess: () => {
      navigate(redirect, { replace: true });
    },
    onError: (err: Error) => {
      showError('Error al iniciar sesión', err.message);
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Reserva Club - Inicio">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-secondary-900">Reserva Club</span>
          </Link>
        </div>

        {/* Card Login */}
        <div className="card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">Iniciar sesión</h1>
            <p className="mt-2 text-secondary-600">Accede a tu cuenta para reservar canchas</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-secondary-400 hover:text-secondary-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginMutation.isError && (
              <div className="p-3 rounded-button bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
                {loginMutation.error?.message || 'Credenciales inválidas'}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting || loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              ¿No tienes cuenta?{' '}
              <Link to={`/register?redirect=${redirect}`} className="text-primary-600 hover:underline font-medium">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-secondary-500 hover:text-secondary-700">
              ← Volver al inicio
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-secondary-100 rounded-card text-sm text-secondary-600">
          <p className="font-medium mb-2">Credenciales de prueba:</p>
          <p className="font-mono text-xs">admin@club.com / Admin123!</p>
          <p className="font-mono text-xs">(Rol: administrador)</p>
        </div>
      </div>
    </div>
  );
}