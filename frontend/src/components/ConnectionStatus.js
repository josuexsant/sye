/**
 * Indicador de Estado de Conexión
 * Muestra si está conectado al servidor y si ESP32 está conectada
 */

import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ connected, esp32Connected }) => {
  console.log('📡 Estado de conexión:', { connected, esp32Connected });

  return (
    <div className="connection-status">
      <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {connected ? '✅ Servidor' : '❌ Desconectado'}
        </span>
      </div>

      <div className={`status-indicator ${esp32Connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {esp32Connected ? '🔌 ESP32' : '⚠️ ESP32 no conectada'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;