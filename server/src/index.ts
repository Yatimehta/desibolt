import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { db } from './db.js';

const PORT = process.env.PORT || 5001;

let ioInstance: Server | null = null;

const app = createApp((event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
});

const httpServer = createServer(app);

ioInstance = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

ioInstance.on('connection', (socket) => {
  console.log(`[DESI BOLT Socket] Client connected: ${socket.id}`);

  socket.on('driver:location_update', (data) => {
    ioInstance?.emit('driver:location_changed', data);
  });

  socket.on('order:subscribe', (orderId: string) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[DESI BOLT Socket] Client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

const shutdown = async (signal: string) => {
  console.log(`\n[DESI BOLT] ${signal} received — shutting down gracefully…`);
  httpServer.close(async () => {
    await db.disconnect().catch(() => {});
    console.log('[DESI BOLT] Server closed.');
    process.exit(0);
  });
  // Force exit after 10 s if connections don't drain
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ---------------------------------------------------------------------------
// Startup sequence (only outside test env)
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // 1. Auto-run migration (idempotent — safe to run on every deploy)
      await db.runMigration();

      // 2. Verify DB connectivity with exponential back-off retry
      await db.connectWithRetry(5, 1000);

      // 3. Start listening
      httpServer.listen(PORT, () => {
        console.log(`⚡️ DESI BOLT Backend Server running on http://localhost:${PORT}`);
      });
    } catch (err: any) {
      console.error('[DESI BOLT] ❌ Startup failed:', err.message);
      process.exit(1);
    }
  })();
}

export { app, httpServer, ioInstance };
