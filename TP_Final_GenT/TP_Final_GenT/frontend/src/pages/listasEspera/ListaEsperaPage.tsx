/**
 * ListaEsperaPage - Mis listas de espera
 * Reserva Club Frontend
 */

import { useState } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Loader2, Bell, Trash2, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useToastHelpers } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

// ============================================
// Tipos
// ============================================

interface ListaEsperaEntry {
  id: string;
  canchaId: string;
  canchaNombre: string;
  canchaTipo: 'futbol5' | 'padel' | 'tenis';
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'esperando' | 'en_espera_confirmacion' | 'confirmada' | 'expirada' | 'cancelada';
  posicion: number;
  notificadoEn: string | null;
  confirmadoEn: string | null;
  expiradoEn: string | null;
  creadoEn: string;
}

interface MisListasResponse {
  listas: ListaEsperaEntry[];
}

const TIPO_LABELS: Record<string, string> = {
  futbol5: 'Fútbol 5',
  padel: 'Pádel',
  tenis: 'Tenis',
};

const ESTADO_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gray'; icon: React.ReactNode }> = {
  esperando: { label: 'En espera', variant: 'info', icon: <Clock className="w-3 h-3" /> },
  en_espera_confirmacion: { label: 'Confirmar en 30 min', variant: 'warning', icon: <AlertCircle className="w-3 h-3" /> },
  confirmada: { label: 'Confirmada', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
  expirada: { label: 'Expirada', variant: 'danger', icon: <XCircle className="w-3 h-3" /> },
  cancelada: { label: 'Cancelada', variant: 'gray', icon: <XCircle className="w-3 h-3" /> },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// ============================================
// Componente ListaEsperaCard
// ============================================

interface ListaEsperaCardProps {
  entry: ListaEsperaEntry;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
  cancelingId: string | null;
  confirmingId: string | null;
  minutesLeft: number | null;
}

function ListaEsperaCard({ entry, onCancel, onConfirm, cancelingId, confirmingId, minutesLeft }: ListaEsperaCardProps) {
  const config = ESTADO_CONFIG[entry.estado];
  const isConfirming = confirmingId === entry.id;
  const isCanceling = cancelingId === entry.id;
  const showConfirm = entry.estado === 'en_espera_confirmacion';
  const showCancel = ['esperando', 'en_espera_confirmacion'].includes(entry.estado);

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Info principal */}
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-8 h-8 text-accent-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-secondary-900">{entry.canchaNombre}</h3>
                <Badge variant="info">{TIPO_LABELS[entry.canchaTipo]}</Badge>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.variant === 'warning' ? 'bg-accent-100 text-accent-800' : config.variant === 'success' ? 'bg-primary-100 text-primary-800' : config.variant === 'danger' ? 'bg-danger-100 text-danger-800' : 'bg-secondary-100 text-secondary-600'}`}>
                  {config.icon}
                  <span className="ml-1">Posición {entry.posicion}</span>
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(entry.fecha), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {entry.horaInicio} - {entry.horaFin}
                </span>
              </div>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="flex flex-col sm:items-end gap-3 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.variant === 'warning' ? 'bg-accent-100 text-accent-800' : config.variant === 'success' ? 'bg-primary-100 text-primary-800' : config.variant === 'danger' ? 'bg-danger-100 text-danger-800' : config.variant === 'info' ? 'bg-secondary-100 text-secondary-800' : 'bg-secondary-100 text-secondary-600'}`}>
                {config.icon}
                {config.label}
              </span>
            </div>

            {showConfirm && minutesLeft !== null && (
              <div className="flex items-center gap-2 p-2 bg-accent-50 border border-accent-200 rounded-button">
                <RotateCcw className="w-4 h-4 text-accent-600 animate-spin" />
                <span className="text-sm font-medium text-accent-800">
                  {minutesLeft}:{String(minutesLeft % 60).padStart(2, '0')} para confirmar
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {showConfirm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onConfirm(entry.id)}
                  loading={isConfirming}
                  className="whitespace-nowrap"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar
                </Button>
              )}

              {showCancel && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancel(entry.id)}
                  loading={isCanceling}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Salir
                </Button>
              )}

              {!showConfirm && !showCancel && (
                <Badge variant="gray">{config.label}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ListaEsperaPage
// ============================================

export function ListaEsperaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { error: showError, success: showSuccess, warning: showWarning } = useToastHelpers();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinForm, setJoinForm] = useState({ canchaId: '', fecha: '', horaInicio: '' });
  const [canchas, setCanchas] = useState<Array<{id: string; nombre: string; tipo: string}>>([]);

  // Fetch listas de espera
  const { data, isLoading, error, refetch } = useQuery<MisListasResponse>({
    queryKey: ['mis-listas', user?.id],
    queryFn: async () => {
      const response = await api.get('/listas-espera');
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch cada 30s para actualizar countdown
  });

  // Fetch canchas para modal unir
  useQuery({
    queryKey: ['canchas'],
    queryFn: async () => {
      const response = await api.get('/canchas');
      return response.data;
    },
    onSuccess: (data) => setCanchas(data.filter((c: any) => c.activa)),
  });

  const listas = data?.listas || [];

  // Calcular minutos restantes para entries en_espera_confirmacion
  const getMinutesLeft = (entry: ListaEsperaEntry): number | null => {
    if (entry.estado !== 'en_espera_confirmacion' || !entry.notificadoEn) return null;
    const notificado = parseISO(entry.notificadoEn);
    const expira = new Date(notificado.getTime() + 30 * 60 * 1000);
    const now = new Date();
    const diffMs = expira.getTime() - now.getTime();
    return diffMs > 0 ? Math.floor(diffMs / (1000 * 60)) : 0;
  };

  // Mutations
  const unirseMutation = useMutation({
    mutationFn: async (data: { cancha_id: string; fecha: string; hora_inicio: string }) => {
      const response = await api.post('/listas-espera', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mis-listas'] });
      showSuccess('¡Te uniste a la lista!', `Estás en posición ${data.posicion}`);
      setShowJoinModal(false);
      setJoinForm({ canchaId: '', fecha: '', horaInicio: '' });
    },
    onError: (err: Error) => {
      showError('Error al unirte', getErrorMessage(err));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/listas-espera/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-listas'] });
      showSuccess('Saliste de la lista', 'Tu posición ha sido liberada');
      setCancelingId(null);
    },
    onError: (err: Error) => {
      showError('Error al salir', getErrorMessage(err));
      setCancelingId(null);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/listas-espera/${id}/confirmar`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mis-listas'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
      showSuccess('¡Turno confirmado!', 'Tu reserva ha sido creada');
      setConfirmingId(null);
    },
    onError: (err: Error) => {
      showError('Error al confirmar', getErrorMessage(err));
      setConfirmingId(null);
    },
  });

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinForm.canchaId && joinForm.fecha && joinForm.horaInicio) {
      unirseMutation.mutate(joinForm);
    }
  };

  const handleCancel = (id: string) => {
    setCancelingId(id);
    cancelMutation.mutate(id);
  };

  const handleConfirm = (id: string) => {
    setConfirmingId(id);
    confirmMutation.mutate(id);
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
        <p className="text-danger-600">Error cargando listas de espera</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Lista de Espera</h1>
          <p className="text-secondary-600 mt-1">Gestiona tus posiciones en listas de espera</p>
        </div>
        <Button onClick={() => setShowJoinModal(true)}>
          <Bell className="w-4 h-4 mr-2" />
          Unirse a lista
        </Button>
      </div>

      {listas.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No estás en ninguna lista</h3>
          <p className="text-secondary-500 mb-4">Cuando un turno esté ocupado, únete a la lista de espera y te avisaremos cuando se libere.</p>
          <Button onClick={() => setShowJoinModal(true)}>
            <Bell className="w-4 h-4 mr-2" />
            Unirse a lista
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {listas.map(entry => (
            <ListaEsperaCard
              key={entry.id}
              entry={entry}
              onCancel={handleCancel}
              onConfirm={handleConfirm}
              cancelingId={cancelingId}
              confirmingId={confirmingId}
              minutesLeft={getMinutesLeft(entry)}
            />
          ))}
        </div>
      )}

      {/* Modal Unirse a Lista */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Unirse a lista de espera"
        size="md"
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <Input
            label="Cancha"
            error={!joinForm.canchaId && unirMutation.isSubmitted ? 'Selecciona una cancha' : undefined}
          >
            <select
              value={joinForm.canchaId}
              onChange={e => setJoinForm(prev => ({ ...prev, canchaId: e.target.value }))}
              className="input"
              required
            >
              <option value="">Seleccionar cancha</option>
              {canchas.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre} ({TIPO_LABELS[c.tipo]})</option>
              ))}
            </select>
          </Input>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={joinForm.fecha}
              onChange={e => setJoinForm(prev => ({ ...prev, fecha: e.target.value }))}
              required
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <Input
              label="Hora de inicio"
              type="time"
              value={joinForm.horaInicio}
              onChange={e => setJoinForm(prev => ({ ...prev, horaInicio: e.target.value }))}
              required
              min="08:00"
              max="23:00"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowJoinModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={unirseMutation.isPending} className="flex-1">
              Unirse a lista
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}