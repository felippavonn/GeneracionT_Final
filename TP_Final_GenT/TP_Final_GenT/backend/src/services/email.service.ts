/**
 * Email Service - Adapter pattern para notificaciones
 * Reserva Club - Club Atlético Villanorte
 */

import { getEnv } from '../config/env';

export interface EmailAdapter {
  send(to: string, subject: string, html: string): Promise<void>;
}

export interface EmailTemplateData {
  usuarioNombre?: string;
  canchaNombre?: string;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  precioFinal?: number;
  posicion?: number;
  minutosRestantes?: number;
  motivo?: string;
}

// ============================================
// Adapter: Console (tests)
// ============================================

export class ConsoleEmailAdapter implements EmailAdapter {
  async send(to: string, subject: string, html: string): Promise<void> {
    console.log('📧 [EMAIL - CONSOLE]');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML: ${html.substring(0, 200)}...`);
  }
}

// ============================================
// Adapter: Ethereal (desarrollo - preview real)
// ============================================

let etherealTransporter: any = null;
let etherealPreviewUrl: string | null = null;

async function getEtherealTransporter() {
  if (etherealTransporter) return etherealTransporter;

  const nodemailer = await import('nodemailer');
  const testAccount = await nodemailer.createTestAccount();

  etherealTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  etherealPreviewUrl = `https://ethereal.email/messages`;
  console.log('📧 Ethereal email configurado. Preview:', etherealPreviewUrl);

  return etherealTransporter;
}

export class EtherealEmailAdapter implements EmailAdapter {
  async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = await getEtherealTransporter();
    const info = await transporter.sendMail({
      from: '"Reserva Club" <noresponder@reservaclub.com>',
      to,
      subject,
      html,
    });

    const previewUrl = require('nodemailer').getTestMessageUrl(info);
    console.log('📧 [EMAIL - ETHEREAL] Enviado a', to);
    console.log('   Preview:', previewUrl);
  }
}

// ============================================
// Adapter: SendGrid (producción)
// ============================================

export class SendGridEmailAdapter implements EmailAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(this.apiKey);

    await sgMail.default.send({
      to,
      from: 'noresponder@reservaclub.com',
      subject,
      html,
    });
  }
}

// ============================================
// Adapter: Resend (producción alternativa)
// ============================================

export class ResendEmailAdapter implements EmailAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    const resend = await import('resend');
    const client = new resend.Resend(this.apiKey);

    await client.emails.send({
      from: 'Reserva Club <noresponder@reservaclub.com>',
      to,
      subject,
      html,
    });
  }
}

// ============================================
// Factory
// ============================================

export function getEmailAdapter(): EmailAdapter {
  const env = getEnv();

  switch (env.EMAIL_ADAPTER) {
    case 'console':
      return new ConsoleEmailAdapter();
    case 'ethereal':
      return new EtherealEmailAdapter();
    case 'sendgrid':
      if (!env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY requerido para adapter sendgrid');
      }
      return new SendGridEmailAdapter(env.SENDGRID_API_KEY);
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY requerido para adapter resend');
      }
      return new ResendEmailAdapter(env.RESEND_API_KEY);
    default:
      return new ConsoleEmailAdapter();
  }
}

// ============================================
// Templates de email
// ============================================

export function renderEmailTemplate(
  template: 'reserva_confirmada' | 'reserva_cancelada' | 'lista_espera_disponible' | 'lista_espera_expirada' | 'inasistencia' | 'bloqueo_inasistencias' | 'recordatorio_24h',
  data: EmailTemplateData
): { subject: string; html: string } {
  const formatPrice = (cents: number) => `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

  const baseStyle = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        {{CONTENT}}
      </div>
      <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 16px;">
        Reserva Club - Club Atlético Villanorte
      </p>
    </div>
  `;

  const templates: Record<string, { subject: string; content: string }> = {
    reserva_confirmada: {
      subject: `✅ Reserva confirmada - ${data.canchaNombre} el ${data.fecha} a las ${data.horaInicio}`,
      content: `
        <h1 style="color: #059669; margin-bottom: 16px;">¡Reserva confirmada!</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Total</td><td style="padding: 8px 0; font-weight: 600; color: #059669;">${formatPrice(data.precioFinal || 0)}</td></tr>
        </table>
        <p style="color: #64748b; font-size: 14px;">Recuerda hacer check-in entre 15 min antes y 15 min después de la hora de inicio.</p>
      `,
    },
    reserva_cancelada: {
      subject: `❌ Reserva cancelada - ${data.canchaNombre} el ${data.fecha}`,
      content: `
        <h1 style="color: #dc2626; margin-bottom: 16px;">Reserva cancelada</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>Tu reserva ha sido cancelada:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Motivo</td><td style="padding: 8px 0; font-weight: 600;">${data.motivo || 'Cancelación de usuario'}</td></tr>
        </table>
        ${data.precioFinal ? `<p>Se aplicó un cargo de ${formatPrice(data.precioFinal)} (50% del turno).</p>` : '<p>No se aplicó cargo (cancelación con más de 24h de antelación).</p>'}
      `,
    },
    lista_espera_disponible: {
      subject: `🎉 ¡Tu turno está disponible! - ${data.canchaNombre} el ${data.fecha} a las ${data.horaInicio}`,
      content: `
        <h1 style="color: #059669; margin-bottom: 16px;">¡Buenas noticias!</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>Se ha liberado un turno en el que estabas en lista de espera:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
        </table>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e;"><strong>⏰ Tienes ${data.minutosRestantes || 30} minutos para confirmar</strong> antes de que pase al siguiente en la lista.</p>
        </div>
        <p><a href="${process.env.FRONTEND_URL}/lista-espera" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Confirmar mi turno</a></p>
      `,
    },
    lista_espera_expirada: {
      subject: `⏰ Se agotó el tiempo - ${data.canchaNombre} el ${data.fecha}`,
      content: `
        <h1 style="color: #dc2626; margin-bottom: 16px;">Ventana de confirmación expirada</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>No confirmaste tu turno en la lista de espera a tiempo. El turno ha pasado al siguiente usuario.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
        </table>
        <p>Puedes volver a unirte a la lista de espera si sigues interesado.</p>
      `,
    },
    inasistencia: {
      subject: `⚠️ Inasistencia registrada - ${data.canchaNombre} el ${data.fecha}`,
      content: `
        <h1 style="color: #dc2626; margin-bottom: 16px;">Inasistencia registrada</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>No se detectó tu check-in dentro de los 15 minutos de tolerancia. Se ha registrado una inasistencia:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
        </table>
        <p style="color: #64748b;">Esta es tu inasistencia número <strong>${data.posicion || 1}</strong> en los últimos 30 días.</p>
        ${(data.posicion || 1) >= 3 ? '<p style="color: #dc2626; font-weight: 600;">⚠️ Has alcanzado 3 inasistencias. Tu cuenta ha sido bloqueada por 30 días para realizar nuevas reservas.</p>' : ''}
      `,
    },
    bloqueo_inasistencias: {
      subject: `🚫 Cuenta bloqueada por inasistencias`,
      content: `
        <h1 style="color: #dc2626; margin-bottom: 16px;">Cuenta bloqueada</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>Has acumulado 3 inasistencias en los últimos 30 días. Tu cuenta ha sido bloqueada por 30 días.</p>
        <p>Durante este período no podrás crear nuevas reservas. Las reservas existentes no se ven afectadas.</p>
        <p>Si consideras que esto es un error, contacta a la administración del club.</p>
      `,
    },
    recordatorio_24h: {
      subject: `⏰ Recordatorio: Tu reserva es mañana - ${data.canchaNombre}`,
      content: `
        <h1 style="color: #0891b2; margin-bottom: 16px;">Recordatorio de reserva</h1>
        <p>Hola ${data.usuarioNombre || 'usuario'},</p>
        <p>Tu reserva es mañana:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Cancha</td><td style="padding: 8px 0; font-weight: 600;">${data.canchaNombre}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${data.fecha}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Horario</td><td style="padding: 8px 0; font-weight: 600;">${data.horaInicio} - ${data.horaFin}</td></tr>
        </table>
        <p>Recuerda: cancelación gratuita hasta 24h antes. Check-in disponible 15 min antes.</p>
      `,
    },
  };

  const t = templates[template];
  if (!t) throw new Error(`Template no encontrado: ${template}`);

  return {
    subject: t.subject,
    html: baseStyle.replace('{{CONTENT}}', t.content),
  };
}