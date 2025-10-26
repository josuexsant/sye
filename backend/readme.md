# 🐍 Backend - Servidor WebSocket Python

Servidor simple en Python con WebSockets para coordinar el juego de Serpientes y Escaleras.

## 📋 Características

- ✅ WebSocket puro sin frameworks pesados
- ✅ Logging detallado en consola y archivo
- ✅ Manejo de múltiples conexiones simultáneas
- ✅ Lógica del juego completa (serpientes, escaleras, turnos)
- ✅ Comunicación bidireccional con ESP32 y React
- ✅ Generadores de datos dummy para testing
- ✅ Gestión automática de conexiones

## 🚀 Instalación

### Requisitos
- Python 3.8 o superior
- pip

### Pasos

1. **Ir a la carpeta del backend:**
```bash
cd backend
```

2. **Crear entorno virtual (recomendado):**
```bash
python -m venv venv
```

3. **Activar entorno virtual:**

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

4. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

## ▶️ Ejecución

### Modo Normal
```bash
python server.py
```

El servidor estará disponible en `ws://localhost:5000`

### Modo Testing (con datos dummy)
```bash
python test_server.py
```

Esto iniciará el servidor y simulará eventos automáticamente cada pocos segundos.

## 📊 Logs

Los logs se guardan en dos lugares:

1. **Consola:** Output en tiempo real
2. **Archivo:** `game_server.log` (persiste entre ejecuciones)

**Niveles de log:**
- `INFO`: Eventos importantes (conexiones, movimientos, victorias)
- `DEBUG`: Detalles técnicos (estados, datos enviados)
- `WARNING`: Situaciones anormales pero manejables
- `ERROR`: Errores que requieren atención

**Ejemplo de logs:**
```
2025-10-26 10:30:15 - INFO - INICIANDO SERVIDOR
2025-10-26 10:30:16 - INFO - ✅ Servidor escuchando en ws://0.0.0.0:5000
2025-10-26 10:30:20 - INFO - 🌐 Cliente web conectado desde ('127.0.0.1', 54321)
2025-10-26 10:30:25 - INFO - 🔌 ESP32 conectada desde ('192.168.1.50', 12345)
2025-10-26 10:30:30 - INFO - 🎲 DADO TIRADO
2025-10-26 10:30:30 - DEBUG - Jugador: 1, Dado: 5
```

## 📡 Eventos WebSocket

### Eventos que RECIBE el servidor

#### 1. `start_game`
Inicia una nueva partida

**Payload:**
```json
{
  "event": "start_game",
  "data": {
    "players": [
      {"id": 1, "name": "Ana", "color": "#FF0000"},
      {"id": 2, "name": "Luis", "color": "#0000FF"}
    ],
    "board_size": 100
  }
}
```

#### 2. `dice_rolled`
Se tiró el dado (enviado por ESP32)

**Payload:**
```json
{
  "event": "dice_rolled",
  "data": {
    "player_id": 1,
    "value": 5
  }
}
```

#### 3. `end_turn`
Terminar turno actual

**Payload:**
```json
{
  "event": "end_turn",
  "data": {
    "player_id": 1
  }
}
```

#### 4. `button_pressed`
Botón físico presionado en ESP32

**Payload:**
```json
{
  "event": "button_pressed",
  "data": {
    "button_id": "roll_dice",
    "player_id": 1
  }
}
```

#### 5. `get_state`
Solicitar estado actual del juego

**Payload:**
```json
{
  "event": "get_state",
  "data": {}
}
```

#### 6. `esp32_status`
Estado del hardware ESP32

**Payload:**
```json
{
  "event": "esp32_status",
  "data": {
    "wifi_strength": -45,
    "errors": []
  }
}
```

### Eventos que ENVÍA el servidor

#### 1. `game_started`
Partida iniciada

**Payload:**
```json
{
  "event": "game_started",
  "data": {
    "players": {...},
    "current_player": 1,
    "board_size": 100
  },
  "timestamp": "2025-10-26T10:30:00"
}
```

#### 2. `player_moved`
Jugador se movió

**Payload:**
```json
{
  "event": "player_moved",
  "data": {
    "player_id": 1,
    "player_name": "Ana",
    "old_position": 5,
    "new_position": 10,
    "dice_value": 5,
    "event_type": "normal",
    "total_moves": 3
  },
  "timestamp": "2025-10-26T10:30:05"
}
```

**Tipos de evento:**
- `normal`: Movimiento estándar
- `snake`: Cayó en serpiente
- `ladder`: Cayó en escalera
- `bounce_back`: Se pasó del tablero y rebotó

#### 3. `turn_changed`
Cambió el turno

**Payload:**
```json
{
  "event": "turn_changed",
  "data": {
    "current_player": 2,
    "turn_number": 5
  },
  "timestamp": "2025-10-26T10:30:10"
}
```

#### 4. `player_won`
Jugador ganó

**Payload:**
```json
{
  "event": "player_won",
  "data": {
    "player_id": 1,
    "player_name": "Ana",
    "total_moves": 15
  },
  "timestamp": "2025-10-26T10:35:00"
}
```

#### 5. `game_state`
Estado completo del juego

**Payload:**
```json
{
  "event": "game_state",
  "data": {
    "players": {
      "1": {"id": 1, "name": "Ana", "position": 10, "moves": 3},
      "2": {"id": 2, "name": "Luis", "position": 5, "moves": 2}
    },
    "current_player": 1,
    "dice_value": 5,
    "turn_number": 5,
    "game_started": true,
    "winner": null,
    "board_size": 100
  },
  "timestamp": "2025-10-26T10:30:15"
}
```

### Comandos específicos para ESP32

El servidor envía estos comandos directamente a la ESP32:

#### 1. `move_piece`
Mover pieza física

**Payload:**
```json
{
  "command": "move_piece",
  "player_id": 1,
  "from_position": 5,
  "to_position": 10
}
```

#### 2. `highlight_player`
Resaltar jugador actual

**Payload:**
```json
{
  "command": "highlight_player",
  "player_id": 2,
  "color": "#0000FF"
}
```

## 🏗️ Arquitectura del Código

```
server.py
├── GameState          # Estado del juego
│   ├── add_player()
│   ├── move_player()
│   ├── next_turn()
│   └── get_state()
│
├── ConnectionManager  # Gestión de conexiones
│   ├── connect()
│   ├── disconnect()
│   ├── broadcast()
│   └── send_to_esp32()
│
├── Event Handlers     # Manejadores de eventos
│   ├── handle_start_game()
│   ├── handle_dice_rolled()
│   ├── handle_end_turn()
│   └── handle_button_pressed()
│
└── WebSocket Server   # Servidor principal
    ├── handle_client()
    ├── route_message()
    └── main()
```

## 🧪 Testing sin ESP32

Cada función de manejo de eventos incluye comentarios con generadores de datos dummy.

**Ejemplo:**
```python
async def handle_dice_rolled(data: Dict):
    """
    DUMMY DATA GENERATOR (simula ESP32):
    data = {
        'player_id': game_state.current_player,
        'value': random.randint(1, 6)
    }
    """
    # ... código ...
```

Para probar el servidor sin ESP32, puedes:

1. **Usar el cliente de prueba:**
```bash
python test_client.py
```

2. **Enviar eventos manualmente con Python:**
```python
import asyncio
import websockets
import json

async def test():
    async with websockets.connect('ws://localhost:5000') as ws:
        # Iniciar juego
        await ws.send(json.dumps({
            'event': 'start_game',
            'data': {
                'players': [
                    {'id': 1, 'name': 'Test1', 'color': '#FF0000'},
                    {'id': 2, 'name': 'Test2', 'color': '#0000FF'}
                ]
            }
        }))
        
        # Recibir respuesta
        response = await ws.recv()
        print(response)

asyncio.run(test())
```

## 🐛 Troubleshooting

### El servidor no inicia

**Error:** `Address already in use`
```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### No se conectan los clientes

1. Verificar firewall
2. Verificar que el puerto 5000 esté abierto
3. Usar `0.0.0.0` en lugar de `localhost` para aceptar conexiones externas

### ESP32 no envía eventos

1. Ver logs del servidor - debe aparecer "ESP32 conectada"
2. Verificar que ESP32 envíe `client_type: 'esp32'` en primer mensaje
3. Revisar logs de ESP32

### Los logs no se guardan

Verificar permisos de escritura en la carpeta:
```bash
# Linux/Mac
chmod 755 .
```

## 🔧 Configuración

### Cambiar puerto
Editar `server.py`:
```python
PORT = 5000  # Cambiar a tu puerto deseado
```

### Cambiar nivel de logs
Editar `server.py`:
```python
logging.basicConfig(
    level=logging.DEBUG,  # Cambiar a INFO, WARNING, ERROR
    # ...
)
```

### Configurar tablero
Editar `GameState.__init__()`:
```python
self.board_size = 100  # Tamaño del tablero
self.snakes = {16: 6, 47: 26, ...}  # Serpientes
self.ladders = {1: 38, 4: 14, ...}  # Escaleras
```

## 📈 Próximas Mejoras

- [ ] Persistencia de partidas en archivo JSON
- [ ] Modo replay de partidas
- [ ] Estadísticas de jugadores
- [ ] Soporte para múltiples salas/partidas simultáneas
- [ ] Autenticación de jugadores
- [ ] Rate limiting

## 📞 Soporte

Si encuentras problemas:
1. Revisar `game_server.log`
2. Verificar que Python 3.8+
3. Reinstalar dependencias: `pip install -r requirements.txt --force-reinstall`