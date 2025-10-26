"""
Cliente de prueba para el servidor WebSocket
Simula eventos para testing sin necesidad de ESP32 o React
"""

import asyncio
import websockets
import json
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SERVER_URL = "ws://localhost:5000"

async def test_game_flow():
    """
    Simula un flujo completo de juego
    """
    logger.info("🧪 Iniciando test del servidor...")
    
    async with websockets.connect(SERVER_URL) as websocket:
        logger.info("✅ Conectado al servidor")
        
        # 1. Iniciar juego
        logger.info("\n1️⃣ Iniciando juego...")
        await websocket.send(json.dumps({
            'event': 'start_game',
            'data': {
                'players': [
                    {'id': 1, 'name': 'Jugador Test 1', 'color': '#FF0000'},
                    {'id': 2, 'name': 'Jugador Test 2', 'color': '#0000FF'}
                ],
                'board_size': 100
            }
        }))
        
        response = await websocket.recv()
        logger.info(f"Respuesta: {json.loads(response)['event']}")
        await asyncio.sleep(1)
        
        # 2. Simular varios turnos
        for turn in range(5):
            logger.info(f"\n🎲 Turno {turn + 1}")
            
            # Tirar dado
            dice_value = random.randint(1, 6)
            current_player = (turn % 2) + 1
            
            logger.info(f"Jugador {current_player} tira dado: {dice_value}")
            await websocket.send(json.dumps({
                'event': 'dice_rolled',
                'data': {
                    'player_id': current_player,
                    'value': dice_value
                }
            }))
            
            # Recibir respuesta
            response = await websocket.recv()
            event_data = json.loads(response)
            logger.info(f"Evento recibido: {event_data['event']}")
            
            if event_data['event'] == 'player_moved':
                move = event_data['data']
                logger.info(f"  {move['player_name']}: {move['old_position']} → {move['new_position']}")
                logger.info(f"  Tipo: {move['event_type']}")
            
            await asyncio.sleep(1)
            
            # Terminar turno
            logger.info(f"Terminando turno del jugador {current_player}")
            await websocket.send(json.dumps({
                'event': 'end_turn',
                'data': {'player_id': current_player}
            }))
            
            response = await websocket.recv()
            logger.info(f"Turno cambiado")
            await asyncio.sleep(1)
        
        # 3. Obtener estado final
        logger.info("\n📊 Obteniendo estado final...")
        await websocket.send(json.dumps({
            'event': 'get_state',
            'data': {}
        }))
        
        response = await websocket.recv()
        state = json.loads(response)
        logger.info(f"\nEstado del juego:")
        for player_id, player in state['data']['players'].items():
            logger.info(f"  {player['name']}: Posición {player['position']}, {player['moves']} movimientos")
        
        logger.info("\n✅ Test completado exitosamente")

async def test_esp32_simulation():
    """
    Simula comportamiento de ESP32
    """
    logger.info("🤖 Simulando ESP32...")
    
    async with websockets.connect(SERVER_URL) as websocket:
        # Identificarse como ESP32
        await websocket.send(json.dumps({
            'event': 'esp32_status',
            'data': {
                'client_type': 'esp32',
                'wifi_strength': -45,
                'errors': []
            }
        }))
        
        logger.info("✅ ESP32 conectada")
        
        # Simular presión de botón
        await asyncio.sleep(2)
        logger.info("🔘 Simulando presión de botón...")
        
        await websocket.send(json.dumps({
            'event': 'button_pressed',
            'data': {
                'button_id': 'roll_dice',
                'player_id': 1
            }
        }))
        
        # Escuchar comandos
        try:
            while True:
                message = await asyncio.wait_for(websocket.recv(), timeout=5)
                command = json.loads(message)
                
                if 'command' in command:
                    logger.info(f"📤 Comando recibido: {command['command']}")
                    logger.info(f"   Datos: {command}")
        except asyncio.TimeoutError:
            logger.info("⏱️  Timeout - finalizando simulación")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("CLIENTE DE PRUEBA - Serpientes y Escaleras")
    print("="*60)
    print("\nOpciones:")
    print("1. Test de flujo completo del juego")
    print("2. Simular ESP32")
    print("="*60)
    
    choice = input("\nElige una opción (1 o 2): ").strip()
    
    try:
        if choice == "1":
            asyncio.run(test_game_flow())
        elif choice == "2":
            asyncio.run(test_esp32_simulation())
        else:
            print("❌ Opción inválida")
    except KeyboardInterrupt:
        print("\n\n🛑 Test interrumpido por usuario")
    except Exception as e:
        logger.error(f"❌ Error: {e}", exc_info=True)