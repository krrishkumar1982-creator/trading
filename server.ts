import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app, startBackgroundRetryProcessor } from './src/server/app.ts';

import http from 'http';
import { initSocketServer } from './src/server/socket.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nginx / ingress listens on PORT (e.g. 8080) and proxies to the application on port 3000.
// If we attempt to bind to PORT when it is 8080, it crashes due to EADDRINUSE.
// Therefore, we must bind our Express server to the internal port 3000.
const PORT = process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000;

// Serve static frontend assets from dist in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback all routes to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startBackgroundRetryProcessor();
});

// Import cleanup helpers for Graceful Shutdown
import { stopBackgroundRetryProcessor } from './src/server/app.ts';
import { closeSocketServer } from './src/server/socket.ts';

let isShuttingDown = false;

async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Graceful Shutdown] Received ${signal}. Initiating graceful termination sequence...`);

  // Enforce a hard timeout limit of 10 seconds to avoid hanging processes during deployment rollouts
  const hardTimeout = setTimeout(() => {
    console.error('[Graceful Shutdown] Shutdown timed out! Forcing immediate termination...');
    process.exit(1);
  }, 10000);
  hardTimeout.unref();

  try {
    // 1. Terminate background retry loops
    console.log('[Graceful Shutdown] Stopping background retry worker...');
    stopBackgroundRetryProcessor();

    // 2. Shut down Socket.IO server connections
    console.log('[Graceful Shutdown] Closing all Socket.IO client connections...');
    await closeSocketServer();

    // 3. Stop accepting new HTTP requests on the Express server
    console.log('[Graceful Shutdown] Stopping HTTP server...');
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[Graceful Shutdown] Express HTTP server close failed:', err);
        } else {
          console.log('[Graceful Shutdown] Express HTTP server stopped accepting new requests.');
        }
        resolve();
      });
    });

    // 4. Safely drain and disconnect PostgreSQL client connections pool
    if (global._postgresPool) {
      console.log('[Graceful Shutdown] Draining and closing database connection pool...');
      await global._postgresPool.end();
      console.log('[Graceful Shutdown] Database connection pool cleanly drained.');
    }

    console.log('[Graceful Shutdown] Successfully exited. Systems are offline.');
    clearTimeout(hardTimeout);
    process.exit(0);
  } catch (error: any) {
    console.error('[Graceful Shutdown] Unexpected error during cleanup:', error?.message || error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
