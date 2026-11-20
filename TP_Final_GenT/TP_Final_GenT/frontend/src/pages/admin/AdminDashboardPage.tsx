/**
 * AdminDashboardPage - Panel principal de administración
 * Reserva Club Frontend
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, Badge, Button } from '../../components/ui';
import { Users, Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// Tipos
// ============================================

interface DashboardStats {
  totalUsuarios: number;
  sociosActivos: number;
  reservasHoy: number;
  ingresosMes: number;
  canchasActivas: number;
  alertasPendientes: number;
}

interface ReservaReciente {
  id: string;
  canchaNombre: string;
  usuarioEmail: string;
  fecha: string;
  horaInicio: string;
  estado: string;
  precioFinal: number;
}

interface DashboardData {
  stats: DashboardStats;
  reservasRecientes: ReservaReciente[];
}

// ============================================
// Stats Cards
// ============================================

const statsCards = [
  { key: 'totalUsuarios', label: 'Total Usuarios', icon: Users, color: 'primary' },
  { key: 'sociosActivos', label: 'Socios Activos', icon: Users, color: 'success' },
  { key: 'reservasHoy', label: 'Reservas Hoy', icon: Calendar, color: 'info' },
  { key: 'ingresosMes', label: 'Ingresos Mes', icon: DollarSign, color: 'warning' },
  { key: 'canchasActivas', label: 'Canchas Activas', icon: CheckCircle, color: 'success' },
  { key: 'alertasPendientes', label: 'Alertas', icon: AlertTriangle, color: 'danger' },
] as const;

function StatCard({ stat, label, icon: Icon, color }: { stat: number; label: string; icon: React.ComponentType<{className?: string}>; color: string }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-accent-100 text-accent-600',
    danger: 'bg-danger-100 text-danger-600',
    gray: 'bg-secondary-100 text-secondary-600',
  };

  return (
    <Card>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-500">{label}</p>
            <p className="text-3xl font-bold text-secondary-900 mt-1">{stat.toLocaleString('es-AR')}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// AdminDashboardPage
// ============================================

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="skeleton h-5 w-32 mb-2" />
                <div className="skeleton h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-body">
            <div className="skeleton h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-48" />
                    <div className="skeleton h-4 w-64" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger-600">Error cargando dashboard</p>
      </div>
    );
  }

  const stats = data?.stats;
  const reservasRecientes = data?.reservasRecientes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-1">Resumen general del club - {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map(({ key, label, icon: Icon, color }) => (
          <StatCard key={key} stat={stats?.[key as keyof DashboardStats] || 0} label={label} icon={Icon} color={color} />
        ))}
      </div>

      {/* Reservas Recientes */}
      <Card>
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Reservas Recientes</h2>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/reservas">Ver todas</a>
          </Button>
        </div>
        <div className="card-body p-0">
          {reservasRecientes.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">No hay reservas recientes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500">Cancha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500">Fecha / Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasRecientes.map(reserva => (
                    <tr key={reserva.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="px-4 py-3 text-sm text-secondary-900">{reserva.canchaNombre}</td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{reserva.usuarioEmail}</td>
                      <td className="px-4 py-3 text-sm text-secondary-600">
                        {format(new Date(reserva.fecha), "d 'de' MMM", { locale: es })} {reserva.horaInicio}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          reserva.estado === 'confirmada' ? 'success' :
                          reserva.estado === 'cancelada_gratis' || reserva.estado === 'cancelada_con_cargo' ? 'danger' :
                          reserva.estado === 'completada' ? 'info' :
                          'gray'
                        }>
                          {reserva.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-primary-600">
                        ${(reserva.precioFinal / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink href="/admin/canchas" icon={<Calendar />} label="Gestionar Canchas" />
        <QuickLink href="/admin/usuarios" icon={<Users />} label="Gestionar Usuarios" />
        <QuickLink href="/admin/feriados" icon={<AlertTriangle />} label="Feriados" />
        <QuickLink href="/admin/reportes" icon={<TrendingUp />} label="Reportes" />
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} className="card p-6 flex flex-col items-center text-center hover:shadow-card-hover transition-shadow">
      <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 mb-3">
        {icon}
      </div>
      <span className="font-medium text-secondary-900">{label}</span>
    </a>
  );
}