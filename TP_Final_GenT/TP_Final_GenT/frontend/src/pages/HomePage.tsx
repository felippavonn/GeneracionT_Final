/**
 * HomePage - Página principal con disponibilidad pública
 * Reserva Club Frontend
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Search, Trophy, Users, Shield } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';

// ============================================
// Tipos
// ============================================

interface Cancha {
  id: string;
  nombre: string;
  tipo: 'futbol5' | 'padel' | 'tenis';
  duracionMinutos: number;
  precioBase: number;
  activa: boolean;
}

interface SlotDisponibilidad {
  horaInicio: string;
  horaFin: string;
  precioFinal: number;
  disponible: boolean;
  motivoNoDisponible?: string;
}

interface DisponibilidadResponse {
  cancha: Cancha;
  fecha: string;
  slots: SlotDisponibilidad[];
}

// ============================================
// Helpers
// ============================================

const TIPO_LABELS: Record<string, string> = {
  futbol5: 'Fútbol 5',
  padel: 'Pádel',
  tenis: 'Tenis',
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  futbol5: <Trophy className="w-5 h-5" />,
  padel: <Users className="w-5 h-5" />,
  tenis: <Shield className="w-5 h-5" />,
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function getMotivoBadge(motivo?: string) {
  const motivos: Record<string, { label: string; variant: 'gray' | 'warning' | 'danger' | 'info' }> = {
    mantenimiento: { label: 'Mantenimiento', variant: 'warning' },
    pasado: { label: 'Pasado', variant: 'gray' },
    ocupado: { label: 'Ocupado', variant: 'danger' },
    fuera_horario: { label: 'Fuera de horario', variant: 'gray' },
  };
  const m = motivos[motivo || ''];
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : null;
}

// ============================================
// Componentes
// ============================================

function SlotCard({ slot, onClick, disabled }: { slot: SlotDisponibilidad; onClick: () => void; disabled?: boolean }) {
  const isDisabled = disabled || !slot.disponible;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`slot-card ${slot.disponible ? '' : 'slot-card--disabled'} ${slot.motivoNoDisponible === 'mantenimiento' ? 'slot-card--maintenance' : ''}`}
      aria-label={slot.disponible ? `Reservar ${slot.horaInicio} - ${slot.horaFin} por ${formatPrice(slot.precioFinal)}` : `No disponible: ${slot.motivoNoDisponible}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-secondary-900">{slot.horaInicio} - {slot.horaFin}</span>
        <span className="font-bold text-primary-600">{formatPrice(slot.precioFinal)}</span>
      </div>
      {slot.motivoNoDisponible && (
        <div className="text-xs text-secondary-500">{slot.motivoNoDisponible}</div>
      )}
      {isDisabled && !slot.motivoNoDisponible && (
        <div className="text-xs text-secondary-500">No disponible</div>
      )}
    </button>
  );
}

function CanchaCard({ cancha, fecha, onSelectSlot }: { cancha: Cancha; fecha: string; onSelectSlot: (slot: SlotDisponibilidad) => void }) {
  const { data, isLoading, error } = useQuery<DisponibilidadResponse>({
    queryKey: ['disponibilidad', cancha.id, fecha],
    queryFn: async () => {
      const response = await api.get(`/canchas/${cancha.id}/disponibilidad`, { params: { fecha } });
      return response.data;
    },
    enabled: !!fecha,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            {TIPO_ICONS[cancha.tipo]}
            <h3 className="font-semibold text-secondary-900">{cancha.nombre}</h3>
            <Badge variant="info">{TIPO_LABELS[cancha.tipo]}</Badge>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-button" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger-200">
        <div className="card-body text-center py-8">
          <p className="text-danger-600">Error cargando disponibilidad</p>
        </div>
      </div>
    );
  }

  const slots = data?.slots || [];

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2 flex-wrap">
          {TIPO_ICONS[cancha.tipo]}
          <h3 className="font-semibold text-secondary-900">{cancha.nombre}</h3>
          <Badge variant="info">{TIPO_LABELS[cancha.tipo]}</Badge>
          <span className="ml-auto text-sm text-secondary-500">{cancha.duracionMinutos} min</span>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {slots.map((slot) => (
            <SlotCard
              key={`${cancha.id}-${slot.horaInicio}`}
              slot={slot}
              onClick={() => onSelectSlot(slot)}
              disabled={!slot.disponible}
            />
          ))}
          {slots.length === 0 && (
            <div className="col-span-full text-center py-8 text-secondary-500">
              No hay horarios disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HomePage
// ============================================

export function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [fecha, setFecha] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponibilidad | null>(null);
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null);
  const [showReservaModal, setShowReservaModal] = useState(false);

  // Obtener canchas
  const { data: canchasData, isLoading: canchasLoading } = useQuery<Cancha[]>({
    queryKey: ['canchas'],
    queryFn: async () => {
      const response = await api.get('/canchas');
      return response.data;
    },
  });

  const canchas = canchasData?.filter(c => c.activa) || [];

  const handleSelectSlot = (slot: SlotDisponibilidad, cancha: Cancha) => {
    if (!user) {
      setSelectedSlot(slot);
      setSelectedCancha(cancha);
      setShowReservaModal(true);
      return;
    }
    // TODO: Navegar a flujo de reserva autenticado
    console.log('Reservar:', slot, cancha);
  };

  const handleLoginRedirect = () => {
    setShowReservaModal(false);
    // El link en el modal manejará el redirect
  };

  const fechaAnterior = () => setFecha(f => format(addDays(parseISO(f), -1), 'yyyy-MM-dd'));
  const fechaSiguiente = () => setFecha(f => format(addDays(parseISO(f), 1), 'yyyy-MM-dd'));
  const hoy = () => setFecha(format(new Date(), 'yyyy-MM-dd'));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-secondary-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-secondary-900 tracking-tight">
              Reserva tu cancha en <span className="text-primary-600">segundos</span>
            </h1>
            <p className="mt-4 text-lg text-secondary-600">
              Club Atlético Villanorte - Fútbol 5, Pádel y Tenis. Disponibilidad en tiempo real, listas de espera automáticas y gestión simple.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn btn-primary btn-lg w-full sm:w-auto">
                Crear cuenta gratis
              </Link>
              <Link to="/" className="btn btn-outline btn-lg w-full sm:w-auto">
                Ver disponibilidad
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Date Picker + Canchas Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Date Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={fechaAnterior} aria-label="Día anterior">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-button border border-secondary-200">
                <Calendar className="w-5 h-5 text-secondary-500" />
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-secondary-900 font-medium w-36"
                  aria-label="Seleccionar fecha"
                />
              </div>
              <Button variant="ghost" onClick={fechaSiguiente} aria-label="Día siguiente">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={hoy} className="ml-2 hidden sm:inline-flex">
                Hoy
              </Button>
            </div>

            <div className="text-sm text-secondary-500">
              {format(parseISO(fecha), "EEEE d 'de' MMMM", { locale: es })}
            </div>
          </div>

          {/* Canchas Grid */}
          {canchasLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="card-header">
                    <div className="skeleton h-6 w-32 rounded" />
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="skeleton h-20 rounded-button" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {canchas.map(cancha => (
                <CanchaCard
                  key={cancha.id}
                  cancha={cancha}
                  fecha={fecha}
                  onSelectSlot={handleSelectSlot}
                />
              ))}
              {canchas.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-secondary-500">No hay canchas disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-secondary-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Disponibilidad en tiempo real"
              description="Ve horarios libres al instante. Precios actualizados según hora pico, fines de semana y tu condición de socio."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Listas de espera automáticas"
              description="Si tu horario está ocupado, únete a la lista. Te avisamos por email cuando se libere y tienes 30 min para confirmar."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Gestión transparente"
              description="Historial de precios inmutable, cancelaciones claras (gratis >24h, 50% <24h), y control de inasistencias automático."
            />
          </div>
        </div>
      </section>
    </div>

    {/* Modal: Requiere login para reservar */}
    <Modal
      isOpen={showReservaModal}
      onClose={() => setShowReservaModal(false)}
      title="Iniciar sesión para reservar"
      size="md"
    >
      <div className="space-y-4 text-center">
        <p className="text-secondary-600">
          Para reservar <strong>{selectedCancha?.nombre}</strong> el {format(parseISO(fecha || ''), "d 'de' MMMM", { locale: es })} a las {selectedSlot?.horaInicio}
        </p>
        <p className="text-secondary-600">Precio: <strong className="text-primary-600">{selectedSlot ? formatPrice(selectedSlot.precioFinal) : ''}</strong></p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReservaModal(false)} className="flex-1">
            Cancelar
          </Button>
          <Link to={`/login?redirect=/mis-reservas`}>
            <Button variant="primary" className="flex-1">
              Iniciar sesión / Registrarse
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card p-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h3>
      <p className="text-secondary-600">{description}</p>
    </div>
  );
}