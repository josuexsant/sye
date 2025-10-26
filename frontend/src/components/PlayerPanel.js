/**
 * Panel de Jugadores
 * Muestra información de todos los jugadores en la partida
 */

import React from 'react';
import './PlayerPanel.css';

const PlayerPanel = ({ players, currentPlayer, winner }) => {
  console.log('👥 Renderizando panel de jugadores', { players, currentPlayer, winner });

  const playerList = Object.values(players);

  if (playerList.length === 0) {
    return (
      <div className="player-panel">
        <h3>👥 Jugadores</h3>
        <p className="no-players">No hay jugadores aún. Inicia una partida para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="player-panel">
      <h3>👥 Jugadores</h3>
      
      <div className="players-list">
        {playerList.map(player => {
          const isCurrentPlayer = player.id === currentPlayer;
          const isWinner = player.id === winner;

          return (
            <div
              key={player.id}
              className={`player-card ${isCurrentPlayer ? 'active' : ''} ${isWinner ? 'winner' : ''}`}
            >
              <div className="player-header">
                <div
                  className="player-color"
                  style={{ backgroundColor: player.color }}
                ></div>
                <div className="player-info">
                  <h4>{player.name}</h4>
                  {isWinner && <span className="winner-badge">🏆 GANADOR</span>}
                  {isCurrentPlayer && !isWinner && <span className="turn-badge">🎲 Su turno</span>}
                </div>
              </div>

              <div className="player-stats">
                <div className="stat">
                  <span className="stat-label">Posición:</span>
                  <span className="stat-value">{player.position || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Movimientos:</span>
                  <span className="stat-value">{player.moves || 0}</span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(player.position / 100) * 100}%`,
                    backgroundColor: player.color
                  }}
                ></div>
              </div>
              <div className="progress-label">{player.position || 0}/100</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerPanel;