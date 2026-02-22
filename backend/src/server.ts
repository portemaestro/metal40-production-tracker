import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import logger from './utils/logger';
import prisma from './utils/prisma';

const app = createApp();
const httpServer = createServer(app);

// ── Socket.io ──
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Rende io accessibile ai controller tramite req.app
app.set('io', io);

// Autenticazione Socket.io tramite JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token mancante'));
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      ruolo: 'ufficio' | 'operatore';
    };
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Token non valido'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  logger.info(`Socket connesso: ${user.email} (${user.ruolo})`, { socketId: socket.id });

  // Join room personale (per notifiche dirette, es. problema_risolto al segnalatore)
  socket.join(`user_${user.userId}`);

  // Join room ruolo ufficio (per notifiche broadcast)
  if (user.ruolo === 'ufficio') {
    socket.join('ufficio');
  }

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnesso: ${user.email}`, { socketId: socket.id, reason });
  });
});

// ── Avvio server ──
const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  try {
    // Verifica connessione database
    await prisma.$connect();
    logger.info('Database connesso');

    httpServer.listen(PORT, () => {
      logger.info(`Server avviato su porta ${PORT}`, { env: process.env.NODE_ENV || 'development' });
    });
  } catch (err) {
    logger.error('Errore avvio server', err);
    process.exit(1);
  }
}

// ── Graceful shutdown ──
function shutdown() {
  logger.info('Shutdown in corso...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    logger.info('Server chiuso');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();

export { io };
