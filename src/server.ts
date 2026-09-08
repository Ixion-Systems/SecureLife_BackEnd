import dotenv from 'dotenv';
dotenv.config();

import { ensureEmbeddedDatabase } from './config/embeddedDb';
import { ensureAdminSeed } from './config/seed-admin';
import { app } from './app';
import { cotizadorSyncService } from './modules/cotizador/cotizador.sync.service';

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  // Asegurar inicialización y ejecución del motor PostgreSQL embebido
  await ensureEmbeddedDatabase();
  // Asegurar semilla del administrador de BackOffice
  await ensureAdminSeed();

  const server = app.listen(PORT, () => {
    console.log(`🚀 [SecureLife Backend] Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`🛡️  Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🚗 Cotizaciones Auto: http://localhost:${PORT}/api/v1/cotizaciones/auto`);
    console.log(`📊 Catálogo Cotizador: http://localhost:${PORT}/api/v1/cotizador/marcas`);

    // Iniciar planificador semanal automático de valuaciones ACARA / DNRPA
    cotizadorSyncService.startScheduler();
  });

  // Cierre seguro (Graceful Shutdown)
  const gracefulShutdown = (signal: string): void => {
    console.log(`\n🛑 Recibida señal ${signal}. Cerrando conexiones del servidor de forma segura...`);
    server.close(() => {
      console.log('✅ Servidor HTTP cerrado correctamente.');
      process.exit(0);
    });

    // Forzar cierre si no finalizan las conexiones activas en 10s
    setTimeout(() => {
      console.error('⚠️ Forzando cierre del servidor tras superar tiempo límite de espera.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Error al iniciar el servidor SecureLife:', err);
  process.exit(1);
});

