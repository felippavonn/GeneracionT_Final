import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layout/PublicLayout';
import { AuthLayout } from './layout/AuthLayout';
import { AdminLayout } from './layout/AdminLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { MisReservasPage } from './pages/reservas/MisReservasPage';
import { ListaEsperaPage } from './pages/listasEspera/ListaEsperaPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCanchasPage } from './pages/admin/AdminCanchasPage';
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage';
import { AdminFeriadosPage } from './pages/admin/AdminFeriadosPage';
import { AdminFranjasPicoPage } from './pages/admin/AdminFranjasPicoPage';
import { AdminBloqueosPage } from './pages/admin/AdminBloqueosPage';
import { AdminAuditoriaPage } from './pages/admin/AdminAuditoriaPage';
import { AdminReportesPage } from './pages/admin/AdminReportesPage';
import { useAuth } from './hooks/useAuth';

// Wrapper que redirige si no autenticado
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Wrapper que redirige si no es admin
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user || user.rol !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Wrapper para páginas públicas (si ya logueado, redirige a home)
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route element={<PublicOnly />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Rutas usuario autenticado */}
      <Route element={<AuthLayout />}>
        <Route element={<RequireAuth />}>
          <Route path="mis-reservas" element={<MisReservasPage />} />
          <Route path="lista-espera" element={<ListaEsperaPage />} />
        </Route>
      </Route>

      {/* Rutas admin */}
      <Route element={<AdminLayout />}>
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/canchas" element={<AdminCanchasPage />} />
          <Route path="admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="admin/feriados" element={<AdminFeriadosPage />} />
          <Route path="admin/franjas-pico" element={<AdminFranjasPicoPage />} />
          <Route path="admin/bloqueos" element={<AdminBloqueosPage />} />
          <Route path="admin/auditoria" element={<AdminAuditoriaPage />} />
          <Route path="admin/reportes" element={<AdminReportesPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}