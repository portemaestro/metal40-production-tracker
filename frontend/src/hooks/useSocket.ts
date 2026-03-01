import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { requestNotificationPermission, showBrowserNotification } from '@/utils/notifications';
import type {
  AppNotification,
  SocketProblemaSegnalato,
  SocketMaterialeArrivato,
  SocketFaseCompletata,
  SocketProblemaRisolto,
  SocketFtPreparato,
  SocketFtConsegnato,
} from '@/types';

// Alert sound for bloccante problems (short beep via Web Audio API)
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'square';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setConnected = useNotificationStore((s) => s.setConnected);
  const queryClient = useQueryClient();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      setConnected(false);
      connectedRef.current = false;
      return;
    }

    // Prevent duplicate connections
    if (connectedRef.current) return;
    connectedRef.current = true;

    const socket = connectSocket(token);

    socket.on('connect', () => {
      setConnected(true);
      requestNotificationPermission();
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // ── Event: Problema segnalato ──
    socket.on('problema_segnalato', (data: SocketProblemaSegnalato) => {
      const isBloccante = data.gravita === 'alta_bloccante';
      const notification: AppNotification = {
        id: makeId(),
        type: 'problema_segnalato',
        title: isBloccante ? 'PROBLEMA BLOCCANTE' : 'Nuovo problema',
        message: `${data.tipo_problema} - ${data.numero_conferma} (${data.cliente})`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        gravita: data.gravita,
        timestamp: new Date().toISOString(),
        read: false,
      };
      addNotification(notification);

      if (isBloccante) {
        playAlertSound();
        showBrowserNotification(
          'PROBLEMA BLOCCANTE',
          `Ord. ${data.numero_conferma} - ${data.tipo_problema}`,
          `problema-${data.problema_id}`,
          true, // requireInteraction for bloccante
        );
      } else {
        showBrowserNotification(
          'Nuovo problema segnalato',
          `${data.tipo_problema} - ${data.numero_conferma}`,
          `problema-${data.problema_id}`,
        );
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['problemi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordine', data.ordine_id] });
    });

    // ── Event: Materiale arrivato ──
    socket.on('materiale_arrivato', (data: SocketMaterialeArrivato) => {
      const label = data.sottotipo ? `${data.tipo_materiale} (${data.sottotipo})` : data.tipo_materiale;
      const notification: AppNotification = {
        id: makeId(),
        type: 'materiale_arrivato',
        title: 'Materiale arrivato',
        message: `${label} - ${data.numero_conferma} (${data.cliente})`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        timestamp: data.timestamp,
        read: false,
      };
      addNotification(notification);
      showBrowserNotification(
        'Materiale arrivato',
        `${label} - ${data.numero_conferma}`,
        `materiale-${data.materiale_id}`,
      );

      queryClient.invalidateQueries({ queryKey: ['materiali'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordine', data.ordine_id] });
    });

    // ── Event: Fase completata ──
    socket.on('fase_completata', (data: SocketFaseCompletata) => {
      const notification: AppNotification = {
        id: makeId(),
        type: 'fase_completata',
        title: 'Fase completata',
        message: `${data.nome_fase} - ${data.numero_conferma} (${data.cliente})`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        timestamp: data.data_completamento,
        read: false,
      };
      addNotification(notification);
      showBrowserNotification(
        'Fase completata',
        `${data.nome_fase} - ${data.numero_conferma}`,
        `fase-${data.fase_id}`,
      );

      queryClient.invalidateQueries({ queryKey: ['fasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordine', data.ordine_id] });
    });

    // ── Event: Problema risolto ──
    socket.on('problema_risolto', (data: SocketProblemaRisolto) => {
      const notification: AppNotification = {
        id: makeId(),
        type: 'problema_risolto',
        title: 'Problema risolto',
        message: `${data.numero_conferma} (${data.cliente}) - Risolto da ${data.risolto_da_nome}`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        timestamp: data.data_risoluzione,
        read: false,
      };
      addNotification(notification);
      showBrowserNotification(
        'Problema risolto',
        `${data.numero_conferma} - Risolto da ${data.risolto_da_nome}`,
        `problema-risolto-${data.problema_id}`,
      );

      queryClient.invalidateQueries({ queryKey: ['problemi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordine', data.ordine_id] });
    });

    // ── Event: Falsotelaio preparato ──
    socket.on('ft_preparato', (data: SocketFtPreparato) => {
      const notification: AppNotification = {
        id: makeId(),
        type: 'ft_preparato',
        title: 'Falsotelaio preparato',
        message: `${data.numero_conferma} (${data.cliente}) - Preparato da ${data.preparato_da}`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        timestamp: data.data_preparazione,
        read: false,
      };
      addNotification(notification);
      showBrowserNotification(
        'Falsotelaio preparato',
        `${data.numero_conferma} - Preparato da ${data.preparato_da}`,
        `ft-preparato-${data.ordine_id}`,
      );

      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordini', data.ordine_id] });
    });

    // ── Event: Falsotelaio consegnato ──
    socket.on('ft_consegnato', (data: SocketFtConsegnato) => {
      const notification: AppNotification = {
        id: makeId(),
        type: 'ft_consegnato',
        title: 'Falsotelaio consegnato',
        message: `${data.numero_conferma} (${data.cliente}) - Consegnato da ${data.consegnato_da}`,
        ordine_id: data.ordine_id,
        numero_conferma: data.numero_conferma,
        timestamp: data.data_consegna,
        read: false,
      };
      addNotification(notification);
      showBrowserNotification(
        'Falsotelaio consegnato',
        `${data.numero_conferma} (${data.cliente})`,
        `ft-consegnato-${data.ordine_id}`,
      );

      queryClient.invalidateQueries({ queryKey: ['ordini'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ordini', data.ordine_id] });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('problema_segnalato');
      socket.off('materiale_arrivato');
      socket.off('fase_completata');
      socket.off('problema_risolto');
      socket.off('ft_preparato');
      socket.off('ft_consegnato');
      disconnectSocket();
      setConnected(false);
      connectedRef.current = false;
    };
  }, [token, user, addNotification, setConnected, queryClient]);
}
