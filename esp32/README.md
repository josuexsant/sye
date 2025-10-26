# 🔌 ESP32 - Control de Hardware

Código para ESP32 que controla el hardware físico del juego de Serpientes y Escaleras.

## 📋 Hardware Necesario

### Componentes Principales
- **1x ESP32 Dev Board** (cualquier modelo con WiFi)
- **4x Botones pulsadores** (para tirar dado de cada jugador)
- **4x Resistencias 10kΩ** (opcional, se usa pull-up interno)
- **4x LEDs** (indicador de turno, cualquier color)
- **4x Resistencias 220Ω** (para los LEDs)
- **1x Buzzer activo o pasivo** (para sonidos)
- **Cables jumper** (macho-macho y macho-hembra)
- **Protoboard** (para conexiones)

### Componentes Opcionales
- **2-4x Servomotores** (para mover fichas físicamente)
- **Fuente de alimentación 5V** (si usas servos)
- **Módulo de expansión de pines** (si necesitas más GPIO)

## 🔧 Conexiones

### Diagrama de Pines

```
ESP32 GPIO    →    Componente
────────────────────────────────
GPIO 12       →    Botón Jugador 1
GPIO 13       →    Botón Jugador 2
GPIO 14       →    Botón Jugador 3
GPIO 15       →    Botón Jugador 4

GPIO 16       →    LED Jugador 1 (+ resistencia 220Ω)
GPIO 17       →    LED Jugador 2 (+ resistencia 220Ω)
GPIO 18       →    LED Jugador 3 (+ resistencia 220Ω)
GPIO 19       →    LED Jugador 4 (+ resistencia 220Ω)

GPIO 25       →    Buzzer (+)

GPIO 26       →    Servo 1 (opcional)
GPIO 27       →    Servo 2 (opcional)

GND           →    Común de todos los componentes
3.3V/5V       →    VCC según componente
```

### Esquema de Botones

```
ESP32 GPIO ----[Botón]---- GND
            |
         (Pull-up interno activado)
```

### Esquema de LEDs

```
ESP32 GPIO ----[Resistencia 220Ω]----[LED]---- GND
```

### Esquema de Buzzer

```
ESP32 GPIO 25 ----[Buzzer+]
GND           ----[Buzzer-]
```

## 🚀 Instalación

### Requisitos de Software
- **Arduino IDE** 1.8.13 o superior, O
- **PlatformIO** (extensión de VS Code)

### Librerías Necesarias

1. **ESP32 Board Support**
   - En Arduino IDE: Archivo → Preferencias
   - URLs de Gestor de Tarjetas: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Herramientas → Placa → Gestor de Tarjetas → Buscar "ESP32" → Instalar

2. **WebSocketsClient**
   - Herramientas → Administrar Bibliotecas
   - Buscar "WebSockets" by Markus Sattler
   - Instalar versión 2.3.6 o superior

3. **ArduinoJson**
   - Herramientas → Administrar Bibliotecas
   - Buscar "ArduinoJson" by Benoit Blanchon
   - Instalar versión 6.x

## 📝 Configuración

### 1. Editar Credenciales WiFi

Abrir `esp32_game_controller.ino` y modificar:

```cpp
const char* WIFI_SSID = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";
```

### 2. Configurar IP del Servidor

```cpp
const char* WS_HOST = "192.168.1.100";  // IP de tu computadora con el backend
const int WS_PORT = 5000;
```

**¿Cómo obtener la IP de tu computadora?**

**Windows:**
```cmd
ipconfig
```
Buscar "Dirección IPv4"

**Linux/Mac:**
```bash
ifconfig
```
O
```bash
ip addr show
```

### 3. Ajustar Pines (si es necesario)

Si tus conexiones son diferentes, modifica:

```cpp
const int BUTTON_PINS[] = {12, 13, 14, 15};
const int LED_PINS[] = {16, 17, 18, 19};
const int BUZZER_PIN = 25;
```

## ⬆️ Subir el Código

### Con Arduino IDE

1. **Conectar ESP32 a la computadora** via USB
2. **Seleccionar placa:** Herramientas → Placa → ESP32 Dev Module
3. **Seleccionar puerto:** Herramientas → Puerto → (tu puerto COM/ttyUSB)
4. **Configurar velocidad:** Herramientas → Upload Speed → 115200
5. **Compilar y subir:** Click en botón ➡️ (Upload)

### Con PlatformIO

1. Abrir proyecto en VS Code
2. Modificar `platformio.ini` si es necesario
3. Click en ✓ (Build) y luego → (Upload)

## 🖥️ Monitor Serial

Abrir monitor serial a **115200 baudios** para ver logs:

**Arduino IDE:** Herramientas → Monitor Serie

**PlatformIO:** Click en 🔌 (Serial Monitor)

### Logs Esperados

```
========================================
SERPIENTES Y ESCALERAS - ESP32
========================================
[INFO] [1023ms] Iniciando sistema...
[INFO] [1024ms] Configurando hardware...
[INFO] [1025ms] Botón jugador 1 en GPIO 12
[INFO] [1026ms] Botón jugador 2 en GPIO 13
...
[INFO] [1500ms] Conectando a WiFi: TuWiFi
.....
[INFO] [3200ms] WiFi conectado!
[INFO] [3201ms] IP: 192.168.1.50
[INFO] [3202ms] Señal: -45 dBm
[INFO] [3500ms] Conectando a WebSocket...
[INFO] [3800ms] WebSocket conectado!
[INFO] [3801ms] Enviado: identificación ESP32
========================================
```

## 🎮 Uso

### Funcionamiento Normal

1. **Al encender:**
   - LEDs parpadean en secuencia (test)
   - Buzzer hace dos tonos (test)
   - Se conecta a WiFi (LED 1 parpadea)
   - Conecta a servidor (todos los LEDs parpadean 3 veces)

2. **Durante el juego:**
   - LED del jugador actual está encendido
   - Jugador presiona su botón para tirar dado
   - ESP32 simula dado (1-6) y envía al servidor
   - LED parpadea al mover
   - Buzzer hace sonidos según eventos

3. **Eventos especiales:**
   - **Serpiente:** Tono descendente
   - **Escalera:** Tono ascendente
   - **Victoria:** Melodía y todos los LEDs parpadean

### Presionar Botones

- Solo funciona el botón del jugador en turno
- Si presionas botón equivocado: sonido de error
- Después de presionar: esperar a que termine el turno

## 🐛 Debugging

### Problema: No conecta a WiFi

**Solución:**
1. Verificar credenciales WiFi
2. Verificar que red es 2.4GHz (ESP32 no soporta 5GHz)
3. Acercar ESP32 al router
4. Ver logs en Serial Monitor

### Problema: No conecta a servidor

**Solución:**
1. Verificar que backend esté corriendo
2. Verificar IP del servidor en código
3. Ping desde ESP32: verificar que estén en misma red
4. Desactivar firewall temporalmente

### Problema: Botones no responden

**Solución:**
1. Verificar conexiones de botones
2. Verificar que pines son correctos
3. Probar con otro botón
4. Ver logs: debe aparecer "Botón presionado"

### Problema: LEDs no encienden

**Solución:**
1. Verificar polaridad del LED (pata larga = +)
2. Verificar resistencias (220Ω)
3. Probar LED directamente con 3.3V
4. Verificar pines en código

### Problema: Buzzer no suena

**Solución:**
1. Verificar tipo de buzzer (activo/pasivo)
2. Verificar polaridad (+ a GPIO, - a GND)
3. Probar con LED en mismo pin
4. Aumentar volumen si es buzzer pasivo

### Problema: ESP32 se reinicia constantemente

**Solución:**
1. Verificar alimentación (usar cable USB de datos, no solo carga)
2. Si usas servos, necesitas fuente externa de 5V
3. Verificar que no haya cortocircuitos
4. Resetear ESP32: mantener botón BOOT + presionar RESET

## 📊 Logs y Eventos

### Eventos que ENVÍA la ESP32

#### esp32_status
```json
{
  "event": "esp32_status",
  "data": {
    "client_type": "esp32",
    "wifi_strength": -45,
    "errors": []
  }
}
```

#### dice_rolled
```json
{
  "event": "dice_rolled",
  "data": {
    "player_id": 1,
    "value": 5
  }
}
```

### Comandos que RECIBE la ESP32

#### move_piece
```json
{
  "command": "move_piece",
  "player_id": 1,
  "from_position": 5,
  "to_position": 10
}
```

#### highlight_player
```json
{
  "command": "highlight_player",
  "player_id": 2,
  "color": "#0000FF"
}
```

#### play_sound
```json
{
  "command": "play_sound",
  "sound_type": "win"
}
```

#### reset_board
```json
{
  "command": "reset_board"
}
```

## 🔧 Personalización

### Cambiar Melodías

Editar función `playMelody()`:

```cpp
void playMelody(String melody) {
  if (melody == "custom") {
    playTone(440, 200);  // La (440 Hz)
    playTone(494, 200);  // Si (494 Hz)
    playTone(523, 300);  // Do (523 Hz)
  }
}
```

### Agregar Más Jugadores

1. Modificar:
```cpp
const int NUM_PLAYERS = 6;  // Cambiar de 4 a 6
```

2. Agregar pines:
```cpp
const int BUTTON_PINS[] = {12, 13, 14, 15, 21, 22};
const int LED_PINS[] = {16, 17, 18, 19, 23, 32};
```

### Agregar Servomotores

```cpp
#include <ESP32Servo.h>

Servo servo1;

void setup() {
  servo1.attach(26);  // GPIO 26
}

void moverServo(int position) {
  // Convertir posición del tablero a ángulo
  int angle = map(position, 0, 100, 0, 180);
  servo1.write(angle);
  logInfo("Servo movido a " + String(angle) + "°");
}
```

Luego en `handleMovePiece()`:
```cpp
void handleMovePiece(JsonObject doc) {
  int toPos = doc["to_position"] | 0;
  moverServo(toPos);
}
```

### Agregar Display LCD

```cpp
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("Serpientes");
  lcd.setCursor(0, 1);
  lcd.print("Escaleras");
}

void mostrarTurno(int player) {
  lcd.clear();
  lcd.print("Turno Jugador");
  lcd.setCursor(0, 1);
  lcd.print(player);
}
```

## 🔋 Alimentación

### Opción 1: USB (Desarrollo)
- Conectar a computadora via USB
- Suficiente para botones, LEDs y buzzer
- **NO suficiente** para servos

### Opción 2: Fuente Externa (Producción)
- Usar adaptador 5V 2A mínimo
- Conectar a pin VIN (no 3.3V)
- GND común con todos los componentes

### Opción 3: Batería (Portátil)
- Batería LiPo 3.7V con regulador
- Power bank via USB
- Calcular consumo total

**Consumo aproximado:**
- ESP32: ~80mA (WiFi activo)
- 4 LEDs: ~80mA (20mA c/u)
- Buzzer: ~30mA
- Servos: ~500mA c/u (bajo carga)

## 📡 Alcance WiFi

Para mejorar la conexión:

1. **Antena externa** (si tu ESP32 tiene conector)
2. **Acercar al router**
3. **Usar repetidor WiFi**
4. **Configurar WiFi estático:**

```cpp
IPAddress local_IP(192, 168, 1, 50);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

WiFi.config(local_IP, gateway, subnet);
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
```

## 🛠️ Testing Standalone

Puedes probar la ESP32 sin conectar al backend:

```cpp
// En setup(), comentar:
// connectWebSocket();

// En loop(), agregar:
void loop() {
  // Test de botones
  for (int i = 0; i < NUM_PLAYERS; i++) {
    if (digitalRead(BUTTON_PINS[i]) == LOW) {
      Serial.println("Botón " + String(i+1) + " presionado");
      blinkLED(i, 2);
      playTone(1000, 100);
      delay(500);
    }
  }
}
```

## 📈 Próximas Mejoras

- [ ] Modo offline (juego sin servidor)
- [ ] Display OLED para mostrar estado
- [ ] Sensor de dados real (giroscopio)
- [ ] Tablero LED con matriz 10x10
- [ ] Control por voz
- [ ] Vibración en fichas
- [ ] Cámara para detectar posiciones

## 🔐 Seguridad

### Protección de Datos

```cpp
// No hardcodear credenciales en producción
// Usar archivo de configuración o portal web
```

### OTA (Over The Air) Updates

```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.setHostname("esp32-serpientes");
  ArduinoOTA.setPassword("tu_password");
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // resto del código...
}
```

## 🆘 Soporte

### Errores Comunes

**"Sketch too big"**
- Solución: Herramientas → Partition Scheme → "Huge APP (3MB No OTA)"

**"A fatal error occurred: Failed to connect"**
- Solución: Mantener BOOT presionado mientras sube código

**"Brownout detector triggered"**
- Solución: Problema de alimentación, usar fuente con más amperaje

### Recursos Útiles

- **ESP32 Pinout:** https://randomnerdtutorials.com/esp32-pinout-reference-gpios/
- **WebSockets Library:** https://github.com/Links2004/arduinoWebSockets
- **ArduinoJson:** https://arduinojson.org/
- **Ejemplos ESP32:** Archivo → Ejemplos → WiFi

## 📞 Contacto

Si encuentras problemas:
1. Revisar logs en Serial Monitor (115200 baud)
2. Verificar todas las conexiones físicas
3. Probar componentes individualment
4. Verificar versiones de librerías

---

**¡Feliz construcción! 🎮🔌**