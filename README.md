# 🎲 Serpientes y Escaleras IoT

Juego de Serpientes y Escaleras con hardware físico controlado por ESP32, backend en Python y frontend en React.

## 📋 Descripción

Sistema completo que integra:
- **Hardware físico** (ESP32) para controlar el tablero físico
- **Backend Python** con WebSockets para coordinar el juego
- **Frontend React** para la interfaz visual

## 🏗️ Arquitectura

```
serpientes-escaleras-iot/
├── backend/           # Servidor Python con WebSockets
├── frontend/          # Aplicación React
├── esp32/            # Código para ESP32
├── .gitignore        # Ignorar archivos
└── README.md         # Este archivo
```

**Flujo de comunicación:**
```
React ←→ Backend (WebSockets) ←→ ESP32
```

## 🚀 Inicio Rápido

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```
El servidor estará en `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
La app estará en `http://localhost:3000`

### 3. ESP32
1. Abrir `esp32/esp32_game_controller.ino` en Arduino IDE
2. Instalar librerías necesarias (ver `esp32/README.md`)
3. Configurar WiFi y IP del servidor
4. Subir código a ESP32

## 🧪 Modo Testing (Sin ESP32)

Cada componente puede funcionar independientemente:

**Backend:** Genera datos dummy automáticamente para simular ESP32
```bash
cd backend
python test_server.py  # Modo testing con eventos simulados
```

**Frontend:** Se conecta al backend y funciona sin ESP32
```bash
cd frontend
npm start  # Ya tiene manejo de errores si ESP32 no está
```

**ESP32:** Puede testear conexión y envío de eventos sin backend
```bash
# Ver logs en Serial Monitor (115200 baud)
```

## 📊 Features Principales

- ✅ Múltiples jugadores (2-4)
- ✅ Control físico con ESP32
- ✅ Interfaz web en tiempo real
- ✅ Serpientes y escaleras configurables
- ✅ Sistema de turnos automático
- ✅ Detección de ganador
- ✅ Logs detallados en todos los componentes
- ✅ Testing independiente

## 🔧 Requisitos

### Backend
- Python 3.8+
- Ver `backend/requirements.txt`

### Frontend
- Node.js 16+
- npm 8+

### ESP32
- Arduino IDE o PlatformIO
- ESP32 Dev Board
- Componentes electrónicos (ver `esp32/README.md`)

## 📡 Endpoints WebSocket

Ver documentación completa en `backend/README.md`

**Principales:**
- `dice_rolled` - ESP32 envía valor del dado
- `player_moved` - Backend notifica movimiento
- `turn_changed` - Backend notifica cambio de turno
- `game_started` - Inicio de partida
- `player_won` - Victoria detectada

## 🐛 Debugging

**Ver logs:**
- Backend: Consola donde corre `server.py`
- Frontend: Consola del navegador (F12)
- ESP32: Serial Monitor (115200 baud)

**Problemas comunes:**
- ESP32 no conecta: Verificar IP y WiFi
- Frontend no recibe eventos: Verificar CORS en backend
- Dados no funcionan: Ver logs de ESP32

## 📝 Variables de Entorno

### Backend
Crear `backend/.env`:
```
PORT=5000
DEBUG=True
```

### Frontend
Crear `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:5000
```

### ESP32
Editar directamente en `esp32_game_controller.ino`:
```cpp
const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";
const char* serverIP = "192.168.1.100";
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - Ver archivo `LICENSE`

## 👥 Autores

Tu equipo aquí

## 🙏 Agradecimientos

- Documentación de ESP32
- Comunidad de Socket.IO
- React Team