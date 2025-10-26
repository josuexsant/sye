/**
 * Componente principal de la aplicación Serpientes y Escaleras
 * Maneja la conexión WebSocket y el estado global del juego
 */

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import GameControls from './components/GameControls';
import ConnectionStatus from './components/ConnectionStatus';
import GameLog from './components/GameLog';

// Configuración del servidor WebSocket
const WS_URL = process.env.REACT_APP_BACKEND_URL || 'ws://localhost:5000';

function App() {
  // Estado de conexión
  const [connected, setConnected] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);
  const wsRef = useRef(null);

  // Estado del juego
  const [gameState, setGameState] = useState({
    players: {},
    current_player: 1,
    dice_value: 0,
    turn_number: 0,
    game_started: false,
    winner: null,
    board_size: 100
  });

  // Logs del juego
  const [gameLogs, setGameLogs] = useState([]);

  /**
   * Agrega un log al historial
   * @param {string} message - Mensaje a agregar
   * @param {string} type - Tipo de log (info, success, warning, error)
   */
  const addLog = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const newLog = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setGameLogs(prev => [newLog, ...prev].slice(0, 50)); // Mantener últimos 50 logs
  };

  /**
   * Establece conexión WebSocket con el servidor
   */
  const connectWebSocket = () => {
    console.log(`🔌 Conectando a ${WS_URL}...`);
    addLog('Conectando al servidor...', 'info');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        setConnected(true);
        addLog('Conectado al servidor exitosamente', 'success');

        // Solicitar estado actual
        sendMessage({ event: 'get_state', data: {} });
      };

      ws.onclose = () => {
        console.log('❌ WebSocket desconectado');
        setConnected(false);
        addLog('Desconectado del servidor', 'warning');

        // Reintentar conexión después de 3 segundos
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('🔄 Reintentando conexión...');
            addLog('Reintentando conexión...', 'info');
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        addLog('Error de conexión con el servidor', 'error');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Mensaje recibido:', message);
          handleServerMessage(message);
        } catch (error) {
          console.error('Error parseando mensaje:', error);
        }
      };

    } catch (error) {
      console.error('Error creando WebSocket:', error);
      addLog('Error al conectar con el servidor', 'error');
    }
  };

  /**
   * Envía un mensaje al servidor
   * @param {Object} message - Mensaje a enviar
   */
  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('📤 Enviando mensaje:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket no está conectado');
      addLog('No se puede enviar mensaje: desconectado', 'error');
    }
  };

  /**
   * Maneja mensajes recibidos del servidor
   * @param {Object} message - Mensaje del servidor
   */
  const handleServerMessage = (message) => {
    const { event, data } = message;

    console.log(`🎮 Evento: ${event}`, data);

    switch (event) {
      case 'game_state':
        console.log('📊 Actualizando estado del juego');
        setGameState(data);
        addLog('Estado del juego actualizado', 'info');
        break;

      case 'game_started':
        console.log('🎯 Juego iniciado');
        setGameState(data);
        addLog('¡Juego iniciado! Que comience la diversión 🎲', 'success');
        break;

      case 'player_moved':
        console.log(`👤 Jugador ${data.player_id} se movió`);
        
        // Actualizar posición del jugador
        setGameState(prev => ({
          ...prev,
          players: {
            ...prev.players,
            [data.player_id]: {
              ...prev.players[data.player_id],
              position: data.new_position,
              moves: data.total_moves
            }
          },
          dice_value: data.dice_value
        }));

        // Log según tipo de evento
        if (data.event_type === 'snake') {
          addLog(`😱 ${data.player_name} cayó en una serpiente! ${data.old_position} → ${data.new_position}`, 'warning');
        } else if (data.event_type === 'ladder') {
          addLog(`🎉 ${data.player_name} subió por una escalera! ${data.old_position} → ${data.new_position}`, 'success');
        } else if (data.event_type === 'bounce_back') {
          addLog(`↩️ ${data.player_name} rebotó del final! ${data.old_position} → ${data.new_position}`, 'info');
        } else {
          addLog(`➡️ ${data.player_name} se movió: ${data.old_position} → ${data.new_position} (dado: ${data.dice_value})`, 'info');
        }
        break;

      case 'turn_changed':
        console.log(`🔄 Turno cambiado a jugador ${data.current_player}`);
        setGameState(prev => ({
          ...prev,
          current_player: data.current_player,
          turn_number: data.turn_number
        }));

        const playerName = gameState.players[data.current_player]?.name || `Jugador ${data.current_player}`;
        addLog(`🎲 Turno de ${playerName}`, 'info');
        break;

      case 'player_won':
        console.log(`🏆 Jugador ${data.player_id} ganó!`);
        setGameState(prev => ({
          ...prev,
          winner: data.player_id
        }));
        addLog(`🏆 ¡${data.player_name} ha ganado el juego! (${data.total_moves} movimientos)`, 'success');
        break;

      case 'esp32_connected':
        console.log('🔌 ESP32 conectada');
        setEsp32Connected(true);
        addLog('ESP32 conectada al sistema', 'success');
        break;

      case 'esp32_disconnected':
        console.log('❌ ESP32 desconectada');
        setEsp32Connected(false);
        addLog('ESP32 desconectada', 'warning');
        break;

      default:
        console.log(`⚠️ Evento no manejado: ${event}`);
    }
  };

  /**
   * Inicia una nueva partida
   * @param {Array} players - Lista de jugadores
   */
  const startGame = (players) => {
    console.log('🎮 Iniciando nueva partida con', players.length, 'jugadores');
    
    sendMessage({
      event: 'start_game',
      data: {
        players: players,
        board_size: 100
      }
    });
  };

  /**
   * Simula tirar el dado (para testing sin ESP32)
   */
  const rollDice = () => {
    const diceValue = Math.floor(Math.random() * 6) + 1;
    console.log(`🎲 Simulando dado: ${diceValue}`);
    
    sendMessage({
      event: 'dice_rolled',
      data: {
        player_id: gameState.current_player,
        value: diceValue
      }
    });
  };

  /**
   * Termina el turno actual
   */
  const endTurn = () => {
    console.log(`⏭️ Terminando turno del jugador ${gameState.current_player}`);
    
    sendMessage({
      event: 'end_turn',
      data: {
        player_id: gameState.current_player
      }
    });
  };

  /**
   * Reinicia el juego
   */
  const resetGame = () => {
    console.log('🔄 Reiniciando juego');
    
    setGameState({
      players: {},
      current_player: 1,
      dice_value: 0,
      turn_number: 0,
      game_started: false,
      winner: null,
      board_size: 100
    });
    
    setGameLogs([]);
    addLog('Juego reiniciado', 'info');
  };

  // Conectar al montar el componente
  useEffect(() => {
    console.log('🚀 Iniciando aplicación');
    addLog('Aplicación iniciada', 'info');
    connectWebSocket();

    // Limpiar al desmontar
    return () => {
      console.log('🛑 Cerrando conexión WebSocket');
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎲 Serpientes y Escaleras IoT</h1>
        <ConnectionStatus 
          connected={connected} 
          esp32Connected={esp32Connected} 
        />
      </header>

      <div className="App-content">
        <div className="left-panel">
          <GameControls
            gameStarted={gameState.game_started}
            winner={gameState.winner}
            currentPlayer={gameState.current_player}
            diceValue={gameState.dice_value}
            onStartGame={startGame}
            onRollDice={rollDice}
            onEndTurn={endTurn}
            onResetGame={resetGame}
            esp32Connected={esp32Connected}
          />
          
          <PlayerPanel
            players={gameState.players}
            currentPlayer={gameState.current_player}
            winner={gameState.winner}
          />
        </div>

        <div className="center-panel">
          <GameBoard
            players={gameState.players}
            boardSize={gameState.board_size}
          />
        </div>

        <div className="right-panel">
          <GameLog logs={gameLogs} />
        </div>
      </div>
    </div>
  );
}

export default App;