"""
Servidor WebSocket para Juego de Serpientes y Escaleras
Coordina la comunicación entre React (frontend) y ESP32 (hardware)
No usa frameworks, solo librerías estándar de Python
"""

import asyncio
import websockets
import json
import logging
import random
from datetime import datetime
from typing import Dict, Set, List, Optional

# ==================== CONFIGURACIÓN ====================

# Configurar logging detallado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('game_server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constantes del servidor
HOST = '0.0.0.0'
PORT = 5001

# ==================== ESTADO DEL JUEGO ====================

class GameState:
    """Mantiene el estado completo del juego"""
    
    def __init__(self):
        """Inicializa el estado del juego con valores por defecto"""
        logger.info("Inicializando estado del juego")
        
        self.players = {}  # {player_id: {name, position, color}}
        self.current_player = 1
        self.dice_value = 0
        self.turn_number = 0
        self.game_started = False
        self.winner = None
        
        # Configuración del tablero
        self.board_size = 100
        self.snakes = {
            16: 6, 47: 26, 49: 11, 56: 53,
            62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78
        }
        self.ladders = {
            1: 38, 4: 14, 9: 31, 21: 42,
            28: 84, 36: 44, 51: 67, 71: 91, 80: 100
        }
        
        logger.debug(f"Tablero inicializado: {self.board_size} casillas")
        logger.debug(f"Serpientes: {len(self.snakes)}, Escaleras: {len(self.ladders)}")
    
    def add_player(self, player_id: int, name: str, color: str):
        """
        Agrega un nuevo jugador al juego
        
        Args:
            player_id: ID único del jugador
            name: Nombre del jugador
            color: Color del jugador en formato hex
        """
        self.players[player_id] = {
            'id': player_id,
            'name': name,
            'color': color,
            'position': 0,
            'moves': 0
        }
        logger.info(f"Jugador agregado: {name} (ID: {player_id}, Color: {color})")
    
    def move_player(self, player_id: int, dice_value: int) -> Dict:
        """
        Mueve un jugador según el valor del dado
        
        Args:
            player_id: ID del jugador a mover
            dice_value: Valor del dado (1-6)
            
        Returns:
            Dict con información del movimiento
        """
        logger.info(f"=== MOVIENDO JUGADOR {player_id} ===")
        logger.debug(f"Dado: {dice_value}")
        
        if player_id not in self.players:
            logger.error(f"Jugador {player_id} no existe")
            return {'error': 'Player not found'}
        
        player = self.players[player_id]
        old_position = player['position']
        new_position = old_position + dice_value
        
        logger.debug(f"Posición anterior: {old_position}")
        logger.debug(f"Posición calculada: {new_position}")
        
        # Verificar si se pasa del tablero
        if new_position > self.board_size:
            logger.warning(f"Rebote: {new_position} > {self.board_size}")
            new_position = self.board_size - (new_position - self.board_size)
            event_type = 'bounce_back'
        else:
            event_type = 'normal'
        
        # Verificar serpientes
        if new_position in self.snakes:
            snake_tail = self.snakes[new_position]
            logger.warning(f"¡SERPIENTE! De {new_position} a {snake_tail}")
            new_position = snake_tail
            event_type = 'snake'
        
        # Verificar escaleras
        elif new_position in self.ladders:
            ladder_top = self.ladders[new_position]
            logger.info(f"¡ESCALERA! De {new_position} a {ladder_top}")
            new_position = ladder_top
            event_type = 'ladder'
        
        # Actualizar posición
        player['position'] = new_position
        player['moves'] += 1
        
        logger.info(f"Nueva posición final: {new_position}")
        logger.debug(f"Tipo de movimiento: {event_type}")
        
        # Verificar victoria
        if new_position >= self.board_size:
            self.winner = player_id
            logger.info(f"🏆 ¡GANADOR! Jugador {player_id} ({player['name']})")
        
        return {
            'player_id': player_id,
            'player_name': player['name'],
            'old_position': old_position,
            'new_position': new_position,
            'dice_value': dice_value,
            'event_type': event_type,
            'total_moves': player['moves']
        }
    
    def next_turn(self) -> int:
        """
        Cambia al siguiente jugador
        
        Returns:
            ID del siguiente jugador
        """
        player_ids = sorted(self.players.keys())
        current_index = player_ids.index(self.current_player)
        next_index = (current_index + 1) % len(player_ids)
        self.current_player = player_ids[next_index]
        self.turn_number += 1
        
        logger.info(f"Turno {self.turn_number}: Jugador {self.current_player}")
        return self.current_player
    
    def get_state(self) -> Dict:
        """
        Obtiene el estado completo del juego
        
        Returns:
            Dict con todo el estado actual
        """
        return {
            'players': self.players,
            'current_player': self.current_player,
            'dice_value': self.dice_value,
            'turn_number': self.turn_number,
            'game_started': self.game_started,
            'winner': self.winner,
            'board_size': self.board_size
        }

# ==================== GESTOR DE CONEXIONES ====================

class ConnectionManager:
    """Gestiona todas las conexiones WebSocket activas"""
    
    def __init__(self):
        """Inicializa el gestor de conexiones"""
        self.active_connections: Set[websockets.WebSocketServerProtocol] = set()
        self.esp32_connection: Optional[websockets.WebSocketServerProtocol] = None
        self.client_types: Dict[websockets.WebSocketServerProtocol, str] = {}
        
        logger.info("ConnectionManager inicializado")
    
    async def connect(self, websocket: websockets.WebSocketServerProtocol, client_type: str = 'web'):
        """
        Registra una nueva conexión
        
        Args:
            websocket: Objeto de conexión WebSocket
            client_type: Tipo de cliente ('web' o 'esp32')
        """
        self.active_connections.add(websocket)
        self.client_types[websocket] = client_type
        
        if client_type == 'esp32':
            self.esp32_connection = websocket
            logger.info(f"🔌 ESP32 conectada desde {websocket.remote_address}")
        else:
            logger.info(f"🌐 Cliente web conectado desde {websocket.remote_address}")
        
        logger.debug(f"Total conexiones activas: {len(self.active_connections)}")
    
    def disconnect(self, websocket: websockets.WebSocketServerProtocol):
        """
        Elimina una conexión
        
        Args:
            websocket: Objeto de conexión a eliminar
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            client_type = self.client_types.pop(websocket, 'unknown')
            
            if websocket == self.esp32_connection:
                self.esp32_connection = None
                logger.warning("❌ ESP32 desconectada")
            else:
                logger.info(f"👋 Cliente {client_type} desconectado")
            
            logger.debug(f"Total conexiones activas: {len(self.active_connections)}")
    
    async def broadcast(self, message: Dict):
        """
        Envía un mensaje a todas las conexiones activas
        
        Args:
            message: Diccionario con el mensaje a enviar
        """
        if not self.active_connections:
            logger.warning("No hay conexiones activas para broadcast")
            return
        
        logger.debug(f"📡 Broadcasting: {message.get('event', 'unknown')}")
        message_json = json.dumps(message)
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send(message_json)
                logger.debug(f"Mensaje enviado a {connection.remote_address}")
            except websockets.exceptions.ConnectionClosed:
                logger.warning(f"Conexión cerrada durante broadcast: {connection.remote_address}")
                disconnected.add(connection)
            except Exception as e:
                logger.error(f"Error enviando mensaje: {e}")
                disconnected.add(connection)
        
        # Limpiar conexiones cerradas
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_to_esp32(self, message: Dict):
        """
        Envía un mensaje específicamente a la ESP32
        
        Args:
            message: Diccionario con el comando para ESP32
        """
        if not self.esp32_connection:
            logger.warning("⚠️  ESP32 no conectada, no se puede enviar comando")
            return
        
        logger.info(f"📤 Enviando a ESP32: {message.get('command', 'unknown')}")
        try:
            await self.esp32_connection.send(json.dumps(message))
            logger.debug("Comando enviado exitosamente a ESP32")
        except Exception as e:
            logger.error(f"Error enviando a ESP32: {e}")
            self.esp32_connection = None

# ==================== INSTANCIAS GLOBALES ====================

game_state = GameState()
connection_manager = ConnectionManager()

# ==================== MANEJADORES DE EVENTOS ====================

async def handle_start_game(data: Dict):
    """
    Inicia una nueva partida
    
    Args:
        data: {players: [{id, name, color}], board_size: int}
    
    DUMMY DATA GENERATOR:
    data = {
        'players': [
            {'id': 1, 'name': 'Jugador 1', 'color': '#FF0000'},
            {'id': 2, 'name': 'Jugador 2', 'color': '#0000FF'}
        ],
        'board_size': 100
    }
    """
    logger.info("=" * 50)
    logger.info("INICIANDO NUEVA PARTIDA")
    logger.info("=" * 50)
    
    # Reiniciar estado
    game_state.__init__()
    
    # Agregar jugadores
    for player in data.get('players', []):
        game_state.add_player(
            player['id'],
            player['name'],
            player['color']
        )
    
    game_state.game_started = True
    game_state.board_size = data.get('board_size', 100)
    
    logger.info(f"Partida iniciada con {len(game_state.players)} jugadores")
    
    # Notificar a todos
    await connection_manager.broadcast({
        'event': 'game_started',
        'data': game_state.get_state(),
        'timestamp': datetime.now().isoformat()
    })

async def handle_dice_rolled(data: Dict):
    """
    Procesa cuando se tira el dado
    
    Args:
        data: {player_id: int, value: int}
    
    DUMMY DATA GENERATOR (simula ESP32):
    data = {
        'player_id': game_state.current_player,
        'value': random.randint(1, 6)
    }
    """
    logger.info("🎲 DADO TIRADO")
    
    player_id = data.get('player_id')
    dice_value = data.get('value')
    
    logger.debug(f"Jugador: {player_id}, Dado: {dice_value}")
    
    if player_id != game_state.current_player:
        logger.warning(f"No es el turno del jugador {player_id}")
        return
    
    game_state.dice_value = dice_value
    
    # Mover jugador
    move_result = game_state.move_player(player_id, dice_value)
    
    # Broadcast del movimiento
    await connection_manager.broadcast({
        'event': 'player_moved',
        'data': move_result,
        'timestamp': datetime.now().isoformat()
    })
    
    # Enviar comando a ESP32 para mover físicamente
    await connection_manager.send_to_esp32({
        'command': 'move_piece',
        'player_id': player_id,
        'from_position': move_result['old_position'],
        'to_position': move_result['new_position']
    })
    
    # Verificar victoria
    if game_state.winner:
        logger.info(f"🏆 JUEGO TERMINADO - Ganador: {player_id}")
        await connection_manager.broadcast({
            'event': 'player_won',
            'data': {
                'player_id': player_id,
                'player_name': game_state.players[player_id]['name'],
                'total_moves': game_state.players[player_id]['moves']
            },
            'timestamp': datetime.now().isoformat()
        })

async def handle_end_turn(data: Dict):
    """
    Termina el turno actual y pasa al siguiente jugador
    
    Args:
        data: {player_id: int}
    
    DUMMY DATA GENERATOR:
    data = {'player_id': game_state.current_player}
    """
    logger.info("⏭️  FIN DE TURNO")
    
    player_id = data.get('player_id')
    
    if player_id != game_state.current_player:
        logger.warning(f"Jugador {player_id} intentó terminar turno que no es suyo")
        return
    
    # Cambiar turno
    next_player = game_state.next_turn()
    
    logger.info(f"Nuevo turno: Jugador {next_player}")
    
    # Notificar cambio de turno
    await connection_manager.broadcast({
        'event': 'turn_changed',
        'data': {
            'current_player': next_player,
            'turn_number': game_state.turn_number
        },
        'timestamp': datetime.now().isoformat()
    })
    
    # Resaltar jugador en ESP32
    await connection_manager.send_to_esp32({
        'command': 'highlight_player',
        'player_id': next_player,
        'color': game_state.players[next_player]['color']
    })

async def handle_button_pressed(data: Dict):
    """
    Maneja cuando se presiona un botón en la ESP32
    
    Args:
        data: {button_id: str, player_id: int}
    
    DUMMY DATA GENERATOR:
    data = {
        'button_id': 'roll_dice',
        'player_id': game_state.current_player
    }
    """
    logger.info(f"🔘 Botón presionado: {data.get('button_id')}")
    
    button_id = data.get('button_id')
    player_id = data.get('player_id')
    
    if button_id == 'roll_dice':
        # Simular tirada de dado
        dice_value = random.randint(1, 6)
        logger.info(f"Simulando dado: {dice_value}")
        
        await handle_dice_rolled({
            'player_id': player_id,
            'value': dice_value
        })

async def handle_esp32_status(data: Dict):
    """
    Recibe el estado de la ESP32
    
    Args:
        data: {wifi_strength: int, errors: []}
    
    DUMMY DATA GENERATOR:
    data = {
        'wifi_strength': random.randint(-80, -30),
        'errors': []
    }
    """
    logger.debug(f"📊 Estado ESP32: WiFi {data.get('wifi_strength')} dBm")
    
    if data.get('errors'):
        logger.warning(f"Errores en ESP32: {data.get('errors')}")

async def handle_get_state(websocket):
    """
    Envía el estado actual del juego a un cliente
    
    Args:
        websocket: Conexión del cliente
    """
    logger.debug("Enviando estado del juego a cliente")
    
    await websocket.send(json.dumps({
        'event': 'game_state',
        'data': game_state.get_state(),
        'timestamp': datetime.now().isoformat()
    }))

# ==================== ROUTER DE EVENTOS ====================

EVENT_HANDLERS = {
    'start_game': handle_start_game,
    'dice_rolled': handle_dice_rolled,
    'end_turn': handle_end_turn,
    'button_pressed': handle_button_pressed,
    'esp32_status': handle_esp32_status,
    'get_state': lambda data: handle_get_state(data)
}

async def route_message(message: Dict, websocket):
    """
    Enruta mensajes entrantes al manejador apropiado
    
    Args:
        message: Diccionario con el evento y datos
        websocket: Conexión que envió el mensaje
    """
    event = message.get('event')
    data = message.get('data', {})
    
    logger.info(f"📨 Evento recibido: {event}")
    logger.debug(f"Datos: {data}")
    
    if event in EVENT_HANDLERS:
        if event == 'get_state':
            await handle_get_state(websocket)
        else:
            await EVENT_HANDLERS[event](data)
    else:
        logger.warning(f"Evento desconocido: {event}")

# ==================== SERVIDOR WEBSOCKET ====================

async def handle_client(websocket, path):
    """
    Maneja una conexión WebSocket de un cliente
    
    Args:
        websocket: Objeto de conexión WebSocket
        path: Ruta de la conexión
    """
    logger.info(f"Nueva conexión desde {websocket.remote_address}")
    
    # Registrar conexión
    await connection_manager.connect(websocket, 'web')
    
    # Enviar estado actual al nuevo cliente
    await handle_get_state(websocket)
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.debug(f"Mensaje recibido: {data}")
                
                # Detectar si es ESP32
                if data.get('client_type') == 'esp32':
                    connection_manager.client_types[websocket] = 'esp32'
                    connection_manager.esp32_connection = websocket
                    logger.info("Cliente identificado como ESP32")
                
                await route_message(data, websocket)
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parseando JSON: {e}")
            except Exception as e:
                logger.error(f"Error procesando mensaje: {e}", exc_info=True)
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Conexión cerrada: {websocket.remote_address}")
    finally:
        connection_manager.disconnect(websocket)

async def main():
    """Función principal que inicia el servidor"""
    logger.info("=" * 60)
    logger.info("INICIANDO SERVIDOR DE SERPIENTES Y ESCALERAS")
    logger.info("=" * 60)
    logger.info(f"Host: {HOST}")
    logger.info(f"Puerto: {PORT}")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    async with websockets.serve(handle_client, HOST, PORT):
        logger.info(f"✅ Servidor escuchando en ws://{HOST}:{PORT}")
        logger.info("Esperando conexiones...")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n🛑 Servidor detenido por usuario")
    except Exception as e:
        logger.error(f"❌ Error fatal: {e}", exc_info=True)