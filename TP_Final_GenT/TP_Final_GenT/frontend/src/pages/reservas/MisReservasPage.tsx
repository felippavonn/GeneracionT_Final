/**
 * MisReservasPage - Lista de reservas del usuario
 * Reserva Club Frontend
 */

import { useState } from 'react';
import { format, parseISO, isPast, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Trash2, LogIn } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useToastHelpers } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';

// ============================================
// Tipos
// ============================================

interface Reserva {
  id: string;
  canchaId: string;
  canchaNombre: string;
  canchaTipo: 'futbol5' | 'padel' | 'tenis';
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  estado: string;
  precioFinal: number;
  checkinEn: string | null;
  creadoEn: string;
}

interface MisReservasResponse {
  reservas: Reserva[];
  total: number;
}

// ============================================
// Helpers
// ============================================

const ESTADO_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gray' }> = {
  confirmada: { label: 'Confirmada', variant: 'success' },
  en_espera_confirmacion: { label: 'Pendiente confirmación', variant: 'warning' },
  cancelada_gratis: { label: 'Cancelada (gratis)', variant: 'gray' },
  cancelada_con_cargo: { label: 'Cancelada (50%)', variant: 'danger' },
  completada: { label: 'Completada', variant: 'info' },
  inasistencia: { label: 'Inasistencia', variant: 'danger' },
  pendiente_pago: { label: 'Pendiente pago', variant: 'warning' },
};

const TIPO_LABELS: Record<string, string> = {
  futbol5: 'Fútbol 5',
  padel: 'Pádel',
  tenis: 'Tenis',
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function getEstadoBadge(estado: string) {
  const config = ESTADO_LABELS[estado] || { label: estado, variant: 'gray' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function canCancel(reserva: Reserva): boolean {
  if (reserva.estado !== 'confirmada' && reserva.estado !== 'en_espera_confirmacion') return false;
  const now = new Date();
  const reservaDateTime = parseISO(`${reserva.fecha}T${reserva.horaInicio}:00`);
  const diffHours = (reservaDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours > 0; // Se puede cancelar si aún no pasó la hora
}

function canCheckin(reserva: Reserva): boolean {
  if (reserva.estado !== 'confirmada' && reserva.estado !== 'en_espera_confirmacion') return false;
  if (reserva.checkinEn) return false;
  const now = new Date();
  const reservaDateTime = parseISO(`${reserva.fecha}T${reserva.horaInicio}:00`);
  const diffMinutes = differenceInMinutes(now, reservaDateTime);
  return diffMinutes >= -15 && diffMinutes <= 15; // Ventana ±15 min
}

// ============================================
// Componente ReservaCard
// ============================================

interface ReservaCardProps {
  reserva: Reserva;
  onCancel: (id: string) => void;
  onCheckin: (id: string) => void;
  cancelingId: string | null;
  checkingInId: string | null;
}

function ReservaCard({ reserva, onCancel, onCheckin, cancelingId, checkingInId }: ReservaCardProps) {
  const isCanceling = cancelingId === reserva.id;
  const isCheckingIn = checkingInId === reserva.id;
  const showCancel = canCancel(reserva);
  const showCheckin = canCheckin(reserva);
  const isPastReserva = isPast(parseISO(`${reserva.fecha}T${reserva.horaFin}:00`));

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Info principal */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-secondary-900">{reserva.canchaNombre}</h3>
                <Badge variant="info">{TIPO_LABELS[reserva.canchaTipo]}</Badge>
                <Badge variant="gray">{reserva.duracionMinutos} min</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(reserva.fecha), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {reserva.horaInicio} - {reserva.horaFin}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones y estado */}
          <div className="flex flex-col sm:items-end gap-3 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right sm:hidden">
                <p className="text-sm text-secondary-500">Total</p>
                <p className="font-bold text-primary-600">{formatPrice(reserva.precioFinal)}</p>
              </div>
              {getEstadoBadge(reserva.estado)}
            </div>

            <div className="flex items-center gap-2">
              {showCheckin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCheckin(reserva.id)}
                  loading={isCheckingIn}
                  className="whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  Check-in
                </Button>
              )}

              {showCancel && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancel(reserva.id)}
                  loading={isCanceling}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancelar
                </Button>
              )}

              {!showCancel && !showCheckin && !isPastReserva && (
                <Badge variant="gray">Sin acciones</Badge>
              )}

              {isPastReserva && reserva.estado === 'confirmada' && (
                <Badge variant="danger">Expirada</Badge>
              )}
            </div>

            <div className="sm:hidden text-right w-full">
              <p className="text-sm text-secondary-500">Total</p>
              <p className="font-bold text-primary-600">{formatPrice(reserva.precioFinal)}</p>
            </div>
          </div>
        </div>

        {/* Info adicional para canceladas con cargo */}
        {(reserva.estado === 'cancelada_con_cargo' || reserva.estado === 'inasistencia') && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-button">
            <p className="text-sm text-danger-700">
              {reserva.estado === 'cancelada_con_cargo'
                ? `Se aplicó cargo del 50% (${formatPrice(Math.round(reserva.precioFinal * 0.5))})`
                : 'Inasistencia registrada. 3 inasistencias en 30 días = bloqueo 30 días.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MisReservasPage
// ============================================

export function MisReservasPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { error: showError, success: showSuccess } = useToastHelpers();
  const [activeTab, setActiveTab] = useState<'proximas' | 'pasadas' | 'canceladas'>('proximas');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<{ reserva: Reserva; cargo: number } | null>(null);

  // Fetch reservas
  const { data, isLoading, error } = useQuery<MisReservasResponse>({
    queryKey: ['mis-reservas', user?.id],
    queryFn: async () => {
      const response = await api.get('/reservas');
      return response.data;
    },
    enabled: !!user,
  });

  const reservas = data?.reservas || [];

  // Filtrar por tab
  const now = new Date();
  const filteredReservas = reservas.filter(r => {
    const reservaEnd = parseISO(`${r.fecha}T${r.horaFin}:00`);
    const isPastReserva = isPast(reservaEnd);

    switch (activeTab) {
      case 'proximas':
        return !isPastReserva && ['confirmada', 'en_espera_confirmacion', 'pendiente_pago'].includes(r.estado);
      case 'pasadas':
        return isPastReserva || ['completada', 'inasistencia'].includes(r.estado);
      case 'canceladas':
        return ['cancelada_gratis', 'cancelada_con_cargo'].includes(r.estado);
      default:
        return true;
    }
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/reservas/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      queryClient.invalidateQueries({ queryKey: ['disponibilidad'] });
      const cargo = data.estado === 'cancelada_con_cargo' ? data.precioFinal * 0.5 : 0;
      if (cargo > 0) {
        showSuccess('Reserva cancelada', `Se aplicó cargo de ${formatPrice(cargo)} (50%)`);
      } else {
        showSuccess('Reserva cancelada', 'Sin cargo (más de 24h de antelación)');
      }
      setCancelingId(null);
    },
    onError: (err: Error) => {
      showError('Error al cancelar', getErrorMessage(err));
      setCancelingId(null);
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/reservas/${id}/checkin`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      showSuccess('¡Check-in realizado!', 'Disfruta tu partido');
      setCheckingInId(null);
    },
    onError: (err: Error) => {
      showError('Error en check-in', getErrorMessage(err));
      setCheckingInId(null);
    },
  });

  const handleCancel = (reserva: Reserva) => {
    const now = new Date();
    const reservaDateTime = parseISO(`${reserva.fecha}T${reserva.horaInicio}:00`);
    const diffHours = (reservaDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const cargo = diffHours <= 24 ? Math.round(reserva.precioFinal * 0.5) : 0;

    setShowCancelConfirm({ reserva, cargo });
  };

  const confirmCancel = () => {
    if (showCancelConfirm) {
      setCancelingId(showCancelConfirm.reserva.id);
      cancelMutation.mutate(showCancelConfirm.reserva.id);
      setShowCancelConfirm(null);
    }
  };

  const handleCheckin = (id: string) => {
    setCheckingInId(id);
    checkinMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="flex gap-4">
                  <div className="skeleton w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-6 w-48" />
                    <div className="skeleton h-4 w-64" />
                    <div className="skeleton h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-danger-600">Error cargando reservas</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Mis Reservas</h1>
        <p className="text-secondary-600 mt-1">Gestiona tus turnos reservados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary-100 rounded-button p-1" role="tablist">
        {[
          { id: 'proximas', label: 'Próximas', count: filteredReservas.filter(r => activeTab === 'proximas').length },
          { id: 'pasadas', label: 'Pasadas', count: filteredReservas.filter(r => activeTab === 'pasadas').length },
          { id: 'canceladas', label: 'Canceladas', count: filteredReservas.filter(r => activeTab === 'canceladas').length },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-button text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-card'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs text-secondary-400">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Lista de reservas */}
      {filteredReservas.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No hay reservas</h3>
          <p className="text-secondary-500 mb-4">
            {activeTab === 'proximas' ? 'No tienes reservas próximas.' :
             activeTab === 'pasadas' ? 'No tienes reservas pasadas.' :
             'No tienes reservas canceladas.'}
          </p>
          <a href="/" className="btn btn-primary">
            Reservar cancha
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservas.map(reserva => (
            <ReservaCard
              key={reserva.id}
              reserva={reserva}
              onCancel={handleCancel}
              onCheckin={handleCheckin}
              cancelingId={cancelingId}
              checkingInId={checkingInId}
            />
          ))}
        </div>
      )}

      {/* Confirm Dialog Cancelación */}
      <ConfirmDialog
        isOpen={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={confirmCancel}
        title="Confirmar cancelación"
        message={
          <div>
            <p>¿Estás seguro de cancelar <strong>{showCancelConfirm?.reserva.canchaNombre}</strong> el {format(parseISO(showCancelConfirm?.reserva.fecha || ''), "d 'de' MMMM", { locale: es })} a las {showCancelConfirm?.reserva.horaInicio}?</p>
            {showCancelConfirm && showCancelConfirm.cargo > 0 && (
              <div className="mt-3 p-3 bg-accent-50 border border-accent-200 rounded-button">
                <p className="text-sm text-accent-800">
                  <strong>Se aplicará cargo del 50%:</strong> {formatPrice(showCancelConfirm.cargo)}
                </p>
                <p className="text-xs text-accent-600 mt-1">Cancelación con menos de 24h de antelación</p>
              </div>
            )}
            {showCancelConfirm && showCancelConfirm.cargo === 0 && (
              <p className="mt-3 text-sm text-primary-600">✓ Cancelación gratuita (más de 24h de antelación)</p>
            )}
          </div>
        }
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        variant="danger"
        loading={cancelingId === showCancelConfirm?.reserva.id}
      />
    </div>
  );
}