/**
 * Controles del Juego
 * Botones para iniciar partida, tirar dado, terminar turno, etc.
 */

import React, { useState } from 'react';
import './GameControls.css';

const GameControls = ({
  gameStarted,
  winner,
  currentPlayer,
  diceValue,
  onStartGame,
  onRollDice,
  onEndTurn,
  onResetGame,
  esp32Connected
}) => {
  console.log('🎮 Renderizando controles del juego', { gameStarted, winner, esp32Connected });

  // Estado para el formulario de inicio
  const [showStartForm, setShowStartForm] = useState(false);
  const [players, setPlayers] = useState([
    { id: 1, name: 'Jugador 1', color: '#FF6B6B' },
    { id: 2, name: 'Jugador 2', color: '#4ECDC4' }
  ]);

  /**
   * Agrega un nuevo jugador al formulario
   */
  const addPlayer = () => {
    if (players.length >= 4) {
      alert('Máximo 4 jugadores');
      return;
    }

    const colors = ['#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
    const newPlayer = {
      id: players.length + 1,
      name: `Jugador ${players.length + 1}`,
      color: colors[players.length]
    };

    console.log('➕ Agregando jugador', newPlayer);
    setPlayers([...players, newPlayer]);
  };

  /**
   * Elimina un jugador del formulario
   */
  const removePlayer = (playerId) => {
    if (players.length <= 2) {
      alert('Mínimo 2 jugadores');
      return;
    }

    console.log('➖ Eliminando jugador', playerId);
    setPlayers(players.filter(p => p.id !== playerId));
  };

  /**
   * Actualiza datos de un jugador
   */
  const updatePlayer = (playerId, field, value) => {
    console.log(`✏️ Actualizando jugador ${playerId}: ${field} = ${value}`);
    
    setPlayers(players.map(p =>
      p.id === playerId ? { ...p, [field]: value } : p
    ));
  };

  /**
   * Inicia la partida con los jugadores configurados
   */
  const handleStartGame = () => {
    console.log('🎯 Iniciando partida con jugadores:', players);
    
    // Validar que todos tengan nombre
    if (players.some(p => !p.name.trim())) {
      alert('Todos los jugadores deben tener nombre');
      return;
    }

    onStartGame(players);
    setShowStartForm(false);
  };

  /**
   * Maneja el click del botón de tirar dado
   */
  const handleRollDice = () => {
    console.log('🎲 Tirando dado...');
    onRollDice();
  };

  /**
   * Maneja el click del botón de terminar turno
   */
  const handleEndTurn = () => {
    console.log('⏭️ Terminando turno...');
    onEndTurn();
  };

  /**
   * Maneja el click del botón de reiniciar
   */
  const handleReset = () => {
    console.log('🔄 Reiniciando juego...');
    
    if (window.confirm('¿Estás seguro de reiniciar el juego?')) {
      onResetGame();
      setShowStartForm(false);
    }
  };

  return (
    <div className="game-controls">
      <h3>🎮 Controles</h3>

      {/* Formulario de inicio */}
      {!gameStarted && (
        <>
          {!showStartForm ? (
            <button
              className="btn btn-primary btn-large"
              onClick={() => setShowStartForm(true)}
            >
              🎯 Iniciar Nueva Partida
            </button>
          ) : (
            <div className="start-game-form">
              <h4>Configurar Jugadores</h4>
              
              {players.map((player, index) => (
                <div key={player.id} className="player-form-item">
                  <span className="player-number">{index + 1}</span>
                  
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                    placeholder="Nombre del jugador"
                    maxLength={20}
                  />
                  
                  <input
                    type="color"
                    value={player.color}
                    onChange={(e) => updatePlayer(player.id, 'color', e.target.value)}
                    title="Color del jugador"
                  />
                  
                  {players.length > 2 && (
                    <button
                      className="btn-remove"
                      onClick={() => removePlayer(player.id)}
                      title="Eliminar jugador"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <div className="form-actions">
                {players.length < 4 && (
                  <button
                    className="btn btn-secondary"
                    onClick={addPlayer}
                  >
                    ➕ Agregar Jugador
                  </button>
                )}
                
                <button
                  className="btn btn-primary"
                  onClick={handleStartGame}
                >
                  🎮 Comenzar Juego
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowStartForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Controles durante el juego */}
      {gameStarted && !winner && (
        <div className="game-actions">
          {/* Indicador de dado */}
          {diceValue > 0 && (
            <div className="dice-display">
              <div className="dice-value">🎲 {diceValue}</div>
            </div>
          )}

          {/* Botón de tirar dado */}
          <button
            className="btn btn-primary btn-large"
            onClick={handleRollDice}
            disabled={diceValue > 0}
            title={esp32Connected ? 'O presiona el botón físico en ESP32' : 'Simula tirar el dado'}
          >
            🎲 Tirar Dado
          </button>

          {esp32Connected && (
            <p className="info-text">
              💡 También puedes usar el botón físico en la ESP32
            </p>
          )}

          {/* Botón de terminar turno */}
          {diceValue > 0 && (
            <button
              className="btn btn-success"
              onClick={handleEndTurn}
            >
              ⏭️ Terminar Turno
            </button>
          )}

          {/* Botón de reiniciar */}
          <button
            className="btn btn-danger"
            onClick={handleReset}
          >
            🔄 Reiniciar Juego
          </button>
        </div>
      )}

      {/* Mensaje de victoria */}
      {winner && (
        <div className="winner-section">
          <h2>🏆 ¡Partida Terminada!</h2>
          <button
            className="btn btn-primary btn-large"
            onClick={handleReset}
          >
            🎮 Nueva Partida
          </button>
        </div>
      )}
    </div>
  );
};

export default GameControls;