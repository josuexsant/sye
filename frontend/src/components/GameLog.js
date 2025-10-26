/**
 * Log del Juego
 * Muestra el historial de eventos del juego en tiempo real
 */

import React, { useEffect, useRef } from 'react';
import './GameLog.css';

const GameLog = ({ logs }) => {
  console.log('📜 Actualizando log, total de entradas:', logs.length);
  
  const logContainerRef = useRef(null);

  // Auto-scroll al agregar nuevos logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0; // Scroll al top ya que agregamos arriba
    }
  }, [logs]);

  /**
   * Obtiene el ícono según el tipo de log
   */
  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="game-log">
      <h3>📜 Historial del Juego</h3>
      
      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <p className="no-logs">No hay eventos aún...</p>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`log-entry log-${log.type}`}>
              <span className="log-icon">{getLogIcon(log.type)}</span>
              <div className="log-content">
                <span className="log-message">{log.message}</span>
                <span className="log-time">{log.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameLog;