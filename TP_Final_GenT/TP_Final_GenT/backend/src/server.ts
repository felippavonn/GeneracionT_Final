/**
 * Entry Point - Reserva Club Backend
 * Solo para producción: levanta el servidor HTTP
 * Tests usan createApp() desde app.ts directamente
 */

import { createApp } from './app';
import { getEnv } from './config/env';
import { closeDb } from './data/database/connection';

const env = getEnv();
const app = createApp();

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Reserva Club Backend corriendo en puerto ${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   API base: http://localhost:${PORT}/api`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n📴 Recibido ${signal}, cerrando servidor...`);
  server.close(async () => {
    console.log('🔌 Servidor HTTP cerrado');
    await closeDb();
    console.log('🗄️  Base de datos desconectada');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️  Force shutdown tras 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});