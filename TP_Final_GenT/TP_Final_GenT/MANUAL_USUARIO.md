# Manual de Usuario - Reserva Club
## Club Atlético Villanorte

> Guía rápida para socios, no socios y administradores

---

## 1. Acceso al Sistema

### 1.1 Registrarse
1. Ir a la web → botón **"Registrarse"**
2. Completar email y contraseña (mínimo 8 caracteres)
3. Tu cuenta se crea como **No Socio** por defecto
4. Un administrador puede cambiarte a **Socio** tras verificar tu cuota

### 1.2 Iniciar Sesión
1. Botón **"Iniciar sesión"**
2. Email + contraseña
3. Quedas logueado 7 días (refresh automático)

### 1.3 Roles
| Rol | Beneficios |
|-----|------------|
| **Invitado** | Solo ver disponibilidad |
| **No Socio** | Reservar (3 días anticipación, 1 reserva activa), lista de espera |
| **Socio** | Reservar (7 días anticipación, 2 reservas activas), **20% descuento**, lista de espera |
| **Admin** | Gestión total del club |

---

## 2. Reservar una Cancha

### 2.1 Desde la Home (invitado o logueado)
1. Seleccionar **fecha** en el selector
2. Ver canchas disponibles con horarios y precios
3. Click en un **horario libre** (tarjeta verde)
4. Si no estás logueado → te pide login/registro
5. Confirmar → **Reserva creada**

### 2.2 Precios
- **Precio base** según cancha
- **+30% hora pico** (Lun-Vie 18-22hs, configurable)
- **+30% fin de semana/feriado** (sumable con pico)
- **-20% descuento socio** (sobre total con recargos)

### 2.3 Límites
| | Socio | No Socio |
|--|-------|----------|
| Anticipación máx. | 7 días | 3 días |
| Reservas activas | 2 | 1 |

---

## 3. Mis Reservas

### 3.1 Acceder
Menú → **"Mis reservas"** (requiere login)

### 3.2 Pestañas
- **Próximas**: Reservas futuras confirmadas
- **Pasadas**: Completadas, inasistencias
- **Canceladas**: Historial de cancelaciones

### 3.3 Acciones disponibles
| Acción | Cuándo | Resultado |
|--------|--------|-----------|
| **Cancelar gratis** | >24h antes | Sin cargo, cupo liberado |
| **Cancelar 50%** | ≤24h antes | Cargo 50%, cupo liberado |
| **Check-in** | ±15 min hora inicio | Marca presencia, evita inasistencia |

> ⚠️ **El botón "Cancelar" se desactiva exactamente a la hora de inicio del turno**

---

## 4. Lista de Espera

### 4.1 Unirse
1. Si un horario está **ocupado** → botón "Unirse a lista de espera"
2. Seleccionas cancha, fecha, hora exacta
3. Quedas en posición **N** (FIFO)

### 4.2 Cuando se libera el turno
1. Recibís **email** (simulado en dev)
2. Tenés **30 minutos** para confirmar
3. Click en **"Confirmar ahora"** → reserva creada
4. Si no confirmás → pasa al siguiente en la lista

### 4.3 Ver tus listas
Menú → **"Lista de espera"** → ves posición, estado, cuenta regresiva

---

## 5. Reglas Importantes

### 5.1 Inasistencias
- Ventana check-in: **15 min antes a 15 min después** de la hora
- Sin check-in → **inasistencia automática**
- **3 inasistencias en 30 días** → **bloqueo 30 días** (no podés reservar)
- Admin puede desbloquear manualmente

### 5.2 Cancelaciones
| Antelación | Cargo | Cupo |
|------------|-------|------|
| > 24 horas | $0 (gratis) | Libera inmediato |
| ≤ 24 horas | 50% del turno | Libera inmediato |

### 5.3 Precio Histórico
- El precio **se congela** al momento de reservar
- Cambios de tarifas posteriores **no afectan** tu reserva

---

## 6. Panel Administrador (solo admins)

Acceso: Menú → **"Admin"** o `/admin`

### 6.1 Pestañas
| Pestaña | Qué gestiona |
|---------|--------------|
| **Dashboard** | Resumen: usuarios, reservas hoy, ingresos, alertas |
| **Canchas** | Crear/editar/desactivar canchas, precios base |
| **Usuarios** | Cambiar rol (socio/no_socio), cuota, bloqueos, deudas |
| **Feriados** | Agregar/quitar feriados (aplican recargo +30%) |
| **Franjas Pico** | Definir horarios pico (recargo +30%) |
| **Mantenimiento** | Bloquear canchas por rangos/horarios (recurrentes) |
| **Auditoría** | Log completo de acciones admin |
| **Reportes** | Ocupación por cancha/franja horaria |

### 6.2 Overrides (solo admin)
- Reservar **fuera de horario**, sin cupo, precio $0, saltar lista espera
- Todo queda **auditado** (admin, acción, timestamp, motivo)

---

## 7. Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| **Admin** | admin@club.com | Admin123! | admin |

> Registrarse crea usuario **No Socio**. Admin cambia a **Socio** en panel Usuarios.

---

## 8. Preguntas Frecuentes

**¿Puedo reservar dos canchas a la misma hora?**
Sí, si sos socio (2 reservas activas). No hay restricción cross-court.

**¿La lista de espera es por cualquier cancha de pádel?**
No, es **por cancha exacta + fecha + hora**. Si estás en "Pádel 1 - 20hs" y se libera "Pádel 2 - 20hs", no te notifica.

**¿Qué pasa si me olvido de confirmar en 30 min?**
Pierdes el turno, pasa al siguiente. Podés volver a unirte (vas al final).

**¿Puedo editar una reserva?**
No en v1. Tenés que cancelar y crear nueva (sujeto a reglas de anticipación/cupo).

**¿Los feriados recargan reservas ya hechas?**
No. Precio histórico inmutable.

---

## 9. Soporte

- **Admin del club**: Para cambios de rol, desbloqueos, consultas de deuda
- **Email notificaciones**: Simulado en desarrollo (ver console/ethereal)
- **Errores técnicos**: Reportar a desarrollo con captura de pantalla

---

*Reserva Club - Club Atlético Villanorte - Sistema de gestión de canchas deportivas*