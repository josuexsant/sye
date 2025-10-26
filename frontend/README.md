# ⚛️ Frontend - React Application

Interfaz web en React para el juego de Serpientes y Escaleras con ESP32.

## 📋 Características

- ✅ Interfaz moderna y responsive
- ✅ Conexión WebSocket en tiempo real
- ✅ Tablero visual interactivo (10x10)
- ✅ Panel de jugadores con progreso
- ✅ Sistema de logs en vivo
- ✅ Indicador de conexión (Servidor y ESP32)
- ✅ Modo testing sin ESP32
- ✅ Animaciones y efectos visuales
- ✅ Soporte para 2-4 jugadores

## 🚀 Instalación

### Requisitos
- Node.js 16+ 
- npm 8+

### Pasos

1. **Ir a la carpeta del frontend:**
```bash
cd frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno (opcional):**

Crear archivo `.env` en la carpeta `frontend/`:
```
REACT_APP_BACKEND_URL=ws://localhost:5000
```

Si no se configura, usa `ws://localhost:5000` por defecto.

## ▶️ Ejecución

### Modo Desarrollo
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

### Compilar para Producción
```bash
npm run build
```

Los archivos compilados estarán en la carpeta `build/`

## 🏗️ Estructura del Proyecto

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── GameBoard.js         # Tablero de juego
│   │   ├── GameBoard.css
│   │   ├── PlayerPanel.js       # Panel de jugadores
│   │   ├── PlayerPanel.css
│   │   ├── GameControls.js      # Controles del juego
│   │   ├── GameControls.css
│   │   ├── ConnectionStatus.js  # Indicador de conexión
│   │   ├── ConnectionStatus.css
│   │   ├── GameLog.js          # Historial de eventos
│   │   └── GameLog.css
│   ├── App.js                   # Componente principal
│   ├── App.css
│   └── index.js                 # Punto de entrada
├── package.json
└── README.md
```

## 🎮 Componentes Principales

### App.js
**Componente raíz que maneja:**
- Conexión WebSocket con el servidor
- Estado global del juego
- Comunicación con backend
- Logs del sistema

**Funciones principales:**
- `connectWebSocket()` - Establece conexión
- `sendMessage(message)` - Envía eventos al servidor
- `handleServerMessage(message)` - Procesa eventos recibidos
- `startGame(players)` - Inicia nueva partida
- `rollDice()` - Simula dado (para testing)
- `endTurn()` - Termina turno actual
- `resetGame()` - Reinicia juego

### GameBoard.js
**Tablero visual del juego:**
- Muestra 100 casillas en formato 10x10
- Disposición serpentina (zigzag)
- Resalta serpientes (🐍) y escaleras (🪜)
- Muestra posición de jugadores
- Casillas especiales (inicio/fin)

### PlayerPanel.js
**Panel de información de jugadores:**
- Lista de jugadores con colores
- Posición actual de cada jugador
- Número de movimientos
- Barra de progreso (0-100)
- Indicador de turno actual
- Badge de ganador

### GameControls.js
**Controles del juego:**
- Formulario para configurar jugadores (2-4)
- Botón para tirar dado (virtual)
- Botón para terminar turno
- Botón para reiniciar juego
- Muestra el último valor del dado

### ConnectionStatus.js
**Indicador de estado:**
- Conexión al servidor (verde/rojo)
- ESP32 conectada (verde/amarillo)
- Animación de pulso en indicadores

### GameLog.js
**Historial de eventos:**
- Últimos 50 eventos
- Tipos: info, success, warning, error
- Timestamp de cada evento
- Auto-scroll
- Colores según tipo de evento

## 📡 Comunicación WebSocket

### Eventos que ENVÍA el frontend:

#### start_game
```javascript
{
  event: 'start_game',
  data: {
    players: [
      {id: 1, name: 'Ana', color: '#FF0000'},
      {id: 2, name: 'Luis', color: '#0000FF'}
    ],
    board_size: 100
  }
}
```

#### dice_rolled (para testing sin ESP32)
```javascript
{
  event: 'dice_rolled',
  data: {
    player_id: 1,
    value: 5
  }
}
```

#### end_turn
```javascript
{
  event: 'end_turn',
  data: {
    player_id: 1
  }
}
```

#### get_state
```javascript
{
  event: 'get_state',
  data: {}
}
```

### Eventos que RECIBE el frontend:

- `game_state` - Estado completo del juego
- `game_started` - Partida iniciada
- `player_moved` - Jugador se movió
- `turn_changed` - Cambió el turno
- `player_won` - Jugador ganó
- `esp32_connected` - ESP32 se conectó
- `esp32_disconnected` - ESP32 se desconectó

Ver detalles completos en `backend/README.md`

## 🧪 Testing sin ESP32

El frontend funciona perfectamente sin ESP32 conectada:

1. **Iniciar servidor backend:**
```bash
cd backend
python server.py
```

2. **Iniciar frontend:**
```bash
cd frontend
npm start
```

3. **Usar botón "Tirar Dado":**
   - Simula el dado electrónico
   - Genera valores aleatorios 1-6
   - Funciona igual que el hardware

4. **Verificar logs:**
   - Abre consola del navegador (F12)
   - Verás todos los eventos WebSocket
   - Útil para debugging

## 🎨 Personalización

### Cambiar colores del tema

Editar `src/App.css`:
```css
body {
  background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}
```

### Cambiar tamaño del tablero

Editar `src/components/GameBoard.js`:
```javascript
const GameBoard = ({ players, boardSize = 100 }) => {
  // Cambiar 100 por el tamaño deseado (debe ser cuadrado perfecto)
}
```

### Modificar serpientes y escaleras

Editar `src/components/GameBoard.js`:
```javascript
const snakes = {
  16: 6,   // De casilla 16 a 6
  47: 26,
  // Agregar más...
};

const ladders = {
  1: 38,   // De casilla 1 a 38
  4: 14,
  // Agregar más...
};
```

### Cambiar servidor WebSocket

Método 1 - Variable de entorno (`.env`):
```
REACT_APP_BACKEND_URL=ws://192.168.1.100:5000
```

Método 2 - Directamente en código (`src/App.js`):
```javascript
const WS_URL = 'ws://TU_IP:TU_PUERTO';
```

## 🐛 Debugging

### Abrir consola del navegador
- Chrome/Edge: F12 o Ctrl+Shift+I
- Firefox: F12 o Ctrl+Shift+K
- Safari: Cmd+Option+I

### Logs importantes:
```
🔌 Conectando a ws://localhost:5000...
✅ WebSocket conectado
📨 Mensaje recibido: {event: 'game_state', ...}
📤 Enviando mensaje: {event: 'start_game', ...}
🎲 Simulando dado: 5
```

### Problemas comunes:

**1. No se conecta al servidor**
- Verificar que el backend esté corriendo
- Verificar URL en `.env` o código
- Revisar firewall

**2. No se ve el tablero**
- Abrir consola (F12) y buscar errores
- Verificar que `players` tenga datos
- Refrescar página (Ctrl+R)

**3. Los jugadores no se mueven**
- Verificar conexión WebSocket (indicador verde)
- Ver logs en consola
- Verificar que sea el turno correcto

**4. ESP32 no aparece conectada**
- ESP32 debe enviar `client_type: 'esp32'`
- Verificar logs del backend
- Verificar que ESP32 esté conectada

## 📱 Responsive Design

La interfaz se adapta a diferentes tamaños:

- **Desktop (>1400px):** Layout de 3 columnas
- **Tablet (1024px-1400px):** Layout compacto
- **Mobile (<1024px):** Layout vertical en una columna

## 🔧 Scripts Disponibles

```bash
npm start          # Inicia servidor de desarrollo
npm run build      # Compila para producción
npm test           # Ejecuta tests
npm run eject      # Expone configuración (irreversible)
```

## 📈 Próximas Mejoras

- [ ] Modo oscuro
- [ ] Sonidos y efectos de audio
- [ ] Animaciones de movimiento de fichas
- [ ] Chat entre jugadores
- [ ] Replay de partidas
- [ ] Estadísticas detalladas
- [ ] Tableros personalizados
- [ ] Themes/Skins

## 🤝 Integración con Backend

El frontend se comunica con el backend a través de WebSocket. Asegúrate de:

1. Backend corriendo en el puerto configurado
2. CORS habilitado en el backend (ya configurado)
3. Misma red si usas IP local

## 📞 Soporte

Si encuentras problemas:
1. Verificar logs en consola del navegador (F12)
2. Verificar que el backend esté corriendo
3. Limpiar cache: Ctrl+Shift+R
4. Reinstalar dependencias: `rm -rf node_modules && npm install`