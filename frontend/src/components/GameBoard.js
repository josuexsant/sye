/**
 * Componente del Tablero de Juego
 * Muestra el tablero con las casillas, serpientes, escaleras y jugadores
 */

import React from 'react';
import './GameBoard.css';

const GameBoard = ({ players, boardSize = 100 }) => {
  console.log('🎨 Renderizando tablero', { players, boardSize });

  // Configuración de serpientes y escaleras
  const snakes = {
    16: 6, 47: 26, 49: 11, 56: 53,
    62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
  };

  const ladders = {
    1: 38, 4: 14, 9: 31, 21: 42,
    28: 84, 36: 44, 51: 67, 71: 91, 80: 100
  };

  /**
   * Genera el array de casillas del tablero
   * El tablero se construye de abajo hacia arriba en formato serpentina
   */
  const generateBoard = () => {
    const board = [];
    const rows = Math.sqrt(boardSize);
    
    for (let row = rows - 1; row >= 0; row--) {
      const rowCells = [];
      
      for (let col = 0; col < rows; col++) {
        let cellNumber;
        
        // Formato serpentina: filas pares de izquierda a derecha, impares al revés
        if ((rows - 1 - row) % 2 === 0) {
          cellNumber = row * rows + col + 1;
        } else {
          cellNumber = row * rows + (rows - col);
        }
        
        rowCells.push(cellNumber);
      }
      
      board.push(rowCells);
    }
    
    return board;
  };

  /**
   * Obtiene los jugadores en una casilla específica
   */
  const getPlayersInCell = (cellNumber) => {
    return Object.values(players).filter(player => player.position === cellNumber);
  };

  /**
   * Determina el tipo de casilla (normal, serpiente, escalera)
   */
  const getCellType = (cellNumber) => {
    if (snakes[cellNumber]) return 'snake';
    if (ladders[cellNumber]) return 'ladder';
    return 'normal';
  };

  /**
   * Obtiene información adicional de la casilla
   */
  const getCellInfo = (cellNumber) => {
    if (snakes[cellNumber]) {
      return `🐍 → ${snakes[cellNumber]}`;
    }
    if (ladders[cellNumber]) {
      return `🪜 → ${ladders[cellNumber]}`;
    }
    return null;
  };

  const board = generateBoard();

  return (
    <div className="game-board-container">
      <h2>Tablero de Juego</h2>
      
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map(cellNumber => {
              const cellType = getCellType(cellNumber);
              const cellInfo = getCellInfo(cellNumber);
              const playersInCell = getPlayersInCell(cellNumber);
              const isStart = cellNumber === 0;
              const isEnd = cellNumber === boardSize;

              return (
                <div
                  key={cellNumber}
                  className={`board-cell ${cellType} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}
                  title={cellInfo || `Casilla ${cellNumber}`}
                >
                  <div className="cell-number">{cellNumber}</div>
                  
                  {cellInfo && (
                    <div className="cell-info">{cellInfo}</div>
                  )}
                  
                  {playersInCell.length > 0 && (
                    <div className="cell-players">
                      {playersInCell.map(player => (
                        <div
                          key={player.id}
                          className="player-piece"
                          style={{ backgroundColor: player.color }}
                          title={player.name}
                        >
                          {player.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="board-legend">
        <div className="legend-item">
          <div className="legend-color normal"></div>
          <span>Normal</span>
        </div>
        <div className="legend-item">
          <div className="legend-color snake"></div>
          <span>🐍 Serpiente</span>
        </div>
        <div className="legend-item">
          <div className="legend-color ladder"></div>
          <span>🪜 Escalera</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;