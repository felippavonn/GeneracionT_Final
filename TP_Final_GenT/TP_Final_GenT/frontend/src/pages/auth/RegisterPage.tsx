/**
 * RegisterPage - Registro de usuario
 * Reserva Club Frontend
 */

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToastHelpers } from '../../components/ui/Toast';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { error: showError, success: showSuccess } = useToastHelpers();
  const [showPassword, setShowPassword] = useState(false);

  const redirect = searchParams.get('redirect') || '/mis-reservas';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      await registerUser(data.email, data.password);
    },
    onSuccess: () => {
      showSuccess('¡Cuenta creada!', 'Bienvenido a Reserva Club');
      navigate(redirect, { replace: true });
    },
    onError: (err: Error) => {
      showError('Error al registrarse', err.message);
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const passwordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const strengthLabels = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
  const strengthColors = ['bg-danger-500', 'bg-danger-500', 'bg-accent-500', 'bg-primary-500', 'bg-primary-600'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Reserva Club - Inicio">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-secondary-900">Reserva Club</span>
          </Link>
        </div>

        {/* Card Register */}
        <div className="card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">Crear cuenta</h1>
            <p className="mt-2 text-secondary-600">Regístrate gratis y reserva tus canchas favoritas</p>
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
                placeholder="Mínimo 8 caracteres"
                error={errors.password?.message}
                autoComplete="new-password"
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

            {/* Password Strength */}
            {password && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-secondary-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColors[strength - 1] || 'bg-secondary-200'}`}
                    style={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-secondary-500">{strengthLabels[strength - 1] || ''}</p>
              </div>
            )}

            <Input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              label="Confirmar contraseña"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              disabled={isSubmitting}
            />

            {registerMutation.isError && (
              <div className="p-3 rounded-button bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
                {registerMutation.error?.message || 'Error al crear la cuenta'}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting || registerMutation.isPending}>
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              ¿Ya tienes cuenta?{' '}
              <Link to={`/login?redirect=${redirect}`} className="text-primary-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-secondary-500 hover:text-secondary-700">
              ← Volver al inicio
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-secondary-100 rounded-card text-sm text-secondary-600 text-center">
          <p className="font-medium">Al registrarte aceptas nuestros términos y condiciones.</p>
          <p className="mt-1">Tu cuenta se creará como <strong>No Socio</strong>. Un administrador puede cambiar tu rol a Socio tras verificar tu cuota.</p>
        </div>
      </div>
    </div>
  );
}