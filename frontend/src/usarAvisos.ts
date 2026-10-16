import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL, obtenerSesion } from './api';

// Ejecuta `alCambiar` cada vez que el servidor avisa de un cambio en los pedidos.
export function usarAvisos(alCambiar: () => void) {
  useEffect(() => {
    const sesion = obtenerSesion();
    if (!sesion) return;

    const socket = io(API_URL, { auth: { token: sesion.accessToken } });
    socket.on('pedidos:cambio', alCambiar);
    // Al conectar o reconectar, se pone al día con lo que se haya perdido
    socket.on('connect', alCambiar);

    return () => {
      socket.disconnect();
    };
  }, [alCambiar]);
}