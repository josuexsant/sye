/**
 * Control de Hardware para Juego de Serpientes y Escaleras
 * ESP32 - Arduino Framework
 * 
 * Hardware requerido:
 * - ESP32 Dev Board
 * - 4x Botones (para tirar dado de cada jugador)
 * - 4x LEDs (indicador de turno de cada jugador)
 * - 1x Buzzer (sonidos del juego)
 * - Opcional: Servos para mover fichas físicas
 * 
 * Conexiones:
 * - Botones: GPIO 12, 13, 14, 15 (con pull-up)
 * - LEDs: GPIO 16, 17, 18, 19
 * - Buzzer: GPIO 25
 * - Servos (opcional): GPIO 26, 27
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURACIÓN ====================

// WiFi credentials
const char* WIFI_SSID = "TU_WIFI";          // Cambiar por tu red WiFi
const char* WIFI_PASSWORD = "TU_PASSWORD";   // Cambiar por tu contraseña

// WebSocket server
const char* WS_HOST = "192.168.1.100";       // Cambiar por IP de tu servidor
const int WS_PORT = 5000;
const char* WS_PATH = "/";

// Pines de hardware
const int BUTTON_PINS[] = {12, 13, 14, 15};  // Botones de los 4 jugadores
const int LED_PINS[] = {16, 17, 18, 19};     // LEDs de los 4 jugadores
const int BUZZER_PIN = 25;                   // Buzzer para sonidos
const int SERVO_PINS[] = {26, 27};           // Servos (opcional)

const int NUM_PLAYERS = 4;

// Estados de los botones (para debounce)
bool lastButtonState[NUM_PLAYERS] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastDebounceTime[NUM_PLAYERS] = {0, 0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 50;

// ==================== OBJETOS GLOBALES ====================

WebSocketsClient webSocket;

// Estado del juego
int currentPlayer = 1;
bool gameStarted = false;

// ==================== FUNCIONES DE LOG ====================

/**
 * Imprime log con timestamp
 * @param message Mensaje a imprimir
 */
void logInfo(String message) {
  Serial.print("[INFO] [");
  Serial.print(millis());
  Serial.print("ms] ");
  Serial.println(message);
}

/**
 * Imprime log de error
 * @param message Mensaje de error
 */
void logError(String message) {
  Serial.print("[ERROR] [");
  Serial.print(millis());
  Serial.print("ms] ");
  Serial.println(message);
}

/**
 * Imprime log de advertencia
 * @param message Mensaje de advertencia
 */
void logWarning(String message) {
  Serial.print("[WARNING] [");
  Serial.print(millis());
  Serial.print("ms] ");
  Serial.println(message);
}

// ==================== SETUP DE HARDWARE ====================

/**
 * Configura los pines del hardware
 */
void setupHardware() {
  logInfo("Configurando hardware...");
  
  // Configurar botones con pull-up interno
  for (int i = 0; i < NUM_PLAYERS; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    logInfo("Botón jugador " + String(i + 1) + " en GPIO " + String(BUTTON_PINS[i]));
  }
  
  // Configurar LEDs
  for (int i = 0; i < NUM_PLAYERS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
    logInfo("LED jugador " + String(i + 1) + " en GPIO " + String(LED_PINS[i]));
  }
  
  // Configurar buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  logInfo("Buzzer en GPIO " + String(BUZZER_PIN));
  
  // Test de LEDs al inicio
  logInfo("Probando LEDs...");
  for (int i = 0; i < NUM_PLAYERS; i++) {
    digitalWrite(LED_PINS[i], HIGH);
    delay(200);
    digitalWrite(LED_PINS[i], LOW);
  }
  
  // Test de buzzer
  logInfo("Probando buzzer...");
  playTone(1000, 100);
  delay(100);
  playTone(1500, 100);
  
  logInfo("Hardware configurado correctamente");
}

// ==================== CONEXIÓN WIFI ====================

/**
 * Conecta a la red WiFi
 */
void connectWiFi() {
  logInfo("Conectando a WiFi: " + String(WIFI_SSID));
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Parpadear LED del jugador 1 mientras conecta
    digitalWrite(LED_PINS[0], !digitalRead(LED_PINS[0]));
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    logInfo("WiFi conectado!");
    logInfo("IP: " + WiFi.localIP().toString());
    logInfo("Señal: " + String(WiFi.RSSI()) + " dBm");
    
    // Parpadeo rápido de todos los LEDs (éxito)
    for (int i = 0; i < 3; i++) {
      for (int j = 0; j < NUM_PLAYERS; j++) {
        digitalWrite(LED_PINS[j], HIGH);
      }
      delay(100);
      for (int j = 0; j < NUM_PLAYERS; j++) {
        digitalWrite(LED_PINS[j], LOW);
      }
      delay(100);
    }
    
    playTone(2000, 200);
  } else {
    logError("No se pudo conectar a WiFi");
    // Parpadeo lento del LED 1 (error)
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED_PINS[0], HIGH);
      delay(500);
      digitalWrite(LED_PINS[0], LOW);
      delay(500);
    }
  }
}

// ==================== WEBSOCKET ====================

/**
 * Callback de eventos WebSocket
 * @param type Tipo de evento
 * @param payload Datos del evento
 * @param length Longitud de los datos
 */
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      logWarning("WebSocket desconectado");
      gameStarted = false;
      // Apagar todos los LEDs
      for (int i = 0; i < NUM_PLAYERS; i++) {
        digitalWrite(LED_PINS[i], LOW);
      }
      break;
      
    case WStype_CONNECTED:
      {
        logInfo("WebSocket conectado!");
        logInfo("URL: " + String((char*)payload));
        
        // Identificarse como ESP32
        DynamicJsonDocument doc(256);
        doc["event"] = "esp32_status";
        JsonObject data = doc.createNestedObject("data");
        data["client_type"] = "esp32";
        data["wifi_strength"] = WiFi.RSSI();
        JsonArray errors = data.createNestedArray("errors");
        
        String output;
        serializeJson(doc, output);
        webSocket.sendTXT(output);
        logInfo("Enviado: identificación ESP32");
        
        // Sonido de conexión
        playMelody("connect");
      }
      break;
      
    case WStype_TEXT:
      {
        logInfo("Mensaje recibido: " + String((char*)payload));
        handleServerMessage((char*)payload);
      }
      break;
      
    case WStype_ERROR:
      logError("Error en WebSocket");
      break;
      
    default:
      break;
  }
}

/**
 * Conecta al servidor WebSocket
 */
void connectWebSocket() {
  logInfo("Conectando a WebSocket...");
  logInfo("Host: " + String(WS_HOST) + ":" + String(WS_PORT));
  
  webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  logInfo("WebSocket configurado");
}

// ==================== MANEJO DE MENSAJES ====================

/**
 * Procesa mensajes del servidor
 * @param payload JSON string del mensaje
 */
void handleServerMessage(char* payload) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    logError("Error parseando JSON: " + String(error.c_str()));
    return;
  }
  
  String event = doc["event"] | "";
  JsonObject data = doc["data"];
  
  logInfo("Evento: " + event);
  
  // Procesar según el evento
  if (event == "game_started") {
    handleGameStarted(data);
  } 
  else if (event == "turn_changed") {
    handleTurnChanged(data);
  }
  else if (event == "player_moved") {
    handlePlayerMoved(data);
  }
  else if (event == "player_won") {
    handlePlayerWon(data);
  }
  // Comandos específicos para ESP32
  else if (doc.containsKey("command")) {
    String command = doc["command"];
    logInfo("Comando: " + command);
    
    if (command == "move_piece") {
      handleMovePiece(doc);
    }
    else if (command == "highlight_player") {
      handleHighlightPlayer(doc);
    }
    else if (command == "play_sound") {
      handlePlaySound(doc);
    }
    else if (command == "reset_board") {
      handleResetBoard();
    }
  }
}

/**
 * Maneja evento de juego iniciado
 */
void handleGameStarted(JsonObject data) {
  logInfo("¡Juego iniciado!");
  gameStarted = true;
  currentPlayer = data["current_player"] | 1;
  
  playMelody("start");
  
  // Encender LED del jugador actual
  highlightPlayer(currentPlayer);
}

/**
 * Maneja evento de cambio de turno
 */
void handleTurnChanged(JsonObject data) {
  currentPlayer = data["current_player"] | 1;
  logInfo("Turno cambiado a jugador " + String(currentPlayer));
  
  highlightPlayer(currentPlayer);
  playTone(1000, 100);
}

/**
 * Maneja evento de jugador movido
 */
void handlePlayerMoved(JsonObject data) {
  int playerId = data["player_id"] | 0;
  int oldPos = data["old_position"] | 0;
  int newPos = data["new_position"] | 0;
  String eventType = data["event_type"] | "normal";
  
  logInfo("Jugador " + String(playerId) + " movido: " + 
          String(oldPos) + " -> " + String(newPos));
  
  // Sonido según tipo de evento
  if (eventType == "snake") {
    playMelody("snake");
  } else if (eventType == "ladder") {
    playMelody("ladder");
  } else {
    playTone(800, 150);
  }
  
  // Parpadear LED del jugador
  blinkLED(playerId - 1, 3);
}

/**
 * Maneja evento de jugador ganó
 */
void handlePlayerWon(JsonObject data) {
  int playerId = data["player_id"] | 0;
  logInfo("¡Jugador " + String(playerId) + " ganó!");
  
  gameStarted = false;
  playMelody("win");
  
  // Animación de victoria
  for (int i = 0; i < 5; i++) {
    for (int j = 0; j < NUM_PLAYERS; j++) {
      digitalWrite(LED_PINS[j], HIGH);
    }
    delay(200);
    for (int j = 0; j < NUM_PLAYERS; j++) {
      digitalWrite(LED_PINS[j], LOW);
    }
    delay(200);
  }
  
  // Dejar encendido solo el LED del ganador
  digitalWrite(LED_PINS[playerId - 1], HIGH);
}

/**
 * Maneja comando de mover pieza
 */
void handleMovePiece(JsonObject doc) {
  int playerId = doc["player_id"] | 0;
  int fromPos = doc["from_position"] | 0;
  int toPos = doc["to_position"] | 0;
  
  logInfo("Comando: Mover pieza del jugador " + String(playerId));
  logInfo("De posición " + String(fromPos) + " a " + String(toPos));
  
  // Aquí iría el código para mover servos/motores
  // Ejemplo: moverServo(playerId, toPos);
  
  // Por ahora solo feedback visual
  blinkLED(playerId - 1, 2);
}

/**
 * Maneja comando de resaltar jugador
 */
void handleHighlightPlayer(JsonObject doc) {
  int playerId = doc["player_id"] | 0;
  logInfo("Comando: Resaltar jugador " + String(playerId));
  
  highlightPlayer(playerId);
}

/**
 * Maneja comando de reproducir sonido
 */
void handlePlaySound(JsonObject doc) {
  String soundType = doc["sound_type"] | "";
  logInfo("Comando: Reproducir sonido " + soundType);
  
  playMelody(soundType);
}

/**
 * Maneja comando de reiniciar tablero
 */
void handleResetBoard() {
  logInfo("Comando: Reiniciar tablero");
  
  gameStarted = false;
  currentPlayer = 1;
  
  // Apagar todos los LEDs
  for (int i = 0; i < NUM_PLAYERS; i++) {
    digitalWrite(LED_PINS[i], LOW);
  }
  
  playTone(500, 200);
}

// ==================== FUNCIONES DE HARDWARE ====================

/**
 * Resalta el LED del jugador actual
 * @param playerId ID del jugador (1-4)
 */
void highlightPlayer(int playerId) {
  // Apagar todos los LEDs
  for (int i = 0; i < NUM_PLAYERS; i++) {
    digitalWrite(LED_PINS[i], LOW);
  }
  
  // Encender LED del jugador actual
  if (playerId >= 1 && playerId <= NUM_PLAYERS) {
    digitalWrite(LED_PINS[playerId - 1], HIGH);
    logInfo("LED jugador " + String(playerId) + " encendido");
  }
}

/**
 * Parpadea el LED de un jugador
 * @param ledIndex Índice del LED (0-3)
 * @param times Número de parpadeos
 */
void blinkLED(int ledIndex, int times) {
  if (ledIndex < 0 || ledIndex >= NUM_PLAYERS) return;
  
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PINS[ledIndex], HIGH);
    delay(150);
    digitalWrite(LED_PINS[ledIndex], LOW);
    delay(150);
  }
}

/**
 * Reproduce un tono en el buzzer
 * @param frequency Frecuencia en Hz
 * @param duration Duración en ms
 */
void playTone(int frequency, int duration) {
  tone(BUZZER_PIN, frequency, duration);
  delay(duration);
  noTone(BUZZER_PIN);
}

/**
 * Reproduce una melodía predefinida
 * @param melody Nombre de la melodía
 */
void playMelody(String melody) {
  if (melody == "connect") {
    playTone(1000, 100);
    delay(50);
    playTone(1500, 100);
    delay(50);
    playTone(2000, 150);
  }
  else if (melody == "start") {
    playTone(523, 200);  // Do
    playTone(659, 200);  // Mi
    playTone(784, 300);  // Sol
  }
  else if (melody == "snake") {
    playTone(800, 100);
    delay(50);
    playTone(600, 100);
    delay(50);
    playTone(400, 200);
  }
  else if (melody == "ladder") {
    playTone(400, 100);
    delay(50);
    playTone(600, 100);
    delay(50);
    playTone(800, 200);
  }
  else if (melody == "win") {
    playTone(523, 150);  // Do
    playTone(659, 150);  // Mi
    playTone(784, 150);  // Sol
    playTone(1047, 400); // Do alto
  }
}

// ==================== LECTURA DE BOTONES ====================

/**
 * Lee el estado de los botones con debounce
 */
void readButtons() {
  if (!gameStarted) return;
  
  for (int i = 0; i < NUM_PLAYERS; i++) {
    int reading = digitalRead(BUTTON_PINS[i]);
    
    // Si el estado cambió, reiniciar temporizador de debounce
    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = millis();
    }
    
    // Si pasó el tiempo de debounce
    if ((millis() - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
      // Si el botón fue presionado (LOW porque usamos INPUT_PULLUP)
      if (reading == LOW && lastButtonState[i] == HIGH) {
        handleButtonPress(i + 1);
      }
    }
    
    lastButtonState[i] = reading;
  }
}

/**
 * Maneja la presión de un botón
 * @param playerId ID del jugador que presionó (1-4)
 */
void handleButtonPress(int playerId) {
  logInfo("Botón presionado: Jugador " + String(playerId));
  
  // Solo permitir si es el turno del jugador
  if (playerId != currentPlayer) {
    logWarning("No es el turno del jugador " + String(playerId));
    playTone(300, 200);  // Sonido de error
    return;
  }
  
  // Simular tirada de dado
  int diceValue = random(1, 7);
  logInfo("Dado simulado: " + String(diceValue));
  
  // Feedback visual y sonoro
  blinkLED(playerId - 1, 1);
  playTone(1000, 100);
  
  // Enviar evento al servidor
  sendDiceRolled(playerId, diceValue);
}

/**
 * Envía evento de dado tirado al servidor
 * @param playerId ID del jugador
 * @param diceValue Valor del dado (1-6)
 */
void sendDiceRolled(int playerId, int diceValue) {
  DynamicJsonDocument doc(256);
  doc["event"] = "dice_rolled";
  JsonObject data = doc.createNestedObject("data");
  data["player_id"] = playerId;
  data["value"] = diceValue;
  
  String output;
  serializeJson(doc, output);
  
  webSocket.sendTXT(output);
  logInfo("Enviado: dice_rolled - Jugador " + String(playerId) + ", Dado " + String(diceValue));
}

/**
 * Envía estado periódico al servidor
 */
void sendStatus() {
  static unsigned long lastStatusTime = 0;
  
  // Enviar cada 30 segundos
  if (millis() - lastStatusTime > 30000) {
    lastStatusTime = millis();
    
    DynamicJsonDocument doc(256);
    doc["event"] = "esp32_status";
    JsonObject data = doc.createNestedObject("data");
    data["wifi_strength"] = WiFi.RSSI();
    JsonArray errors = data.createNestedArray("errors");
    
    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(output);
    
    logInfo("Estado enviado - WiFi: " + String(WiFi.RSSI()) + " dBm");
  }
}

// ==================== SETUP Y LOOP ====================

void setup() {
  // Inicializar Serial
  Serial.begin(115200);
  delay(1000);
  
  Serial.println();
  Serial.println("========================================");
  Serial.println("SERPIENTES Y ESCALERAS - ESP32");
  Serial.println("========================================");
  logInfo("Iniciando sistema...");
  
  // Configurar hardware
  setupHardware();
  
  // Conectar WiFi
  connectWiFi();
  
  // Conectar WebSocket
  if (WiFi.status() == WL_CONNECTED) {
    connectWebSocket();
  }
  
  // Inicializar random seed
  randomSeed(analogRead(0));
  
  logInfo("Sistema iniciado correctamente");
  Serial.println("========================================");
}

void loop() {
  // Mantener conexión WebSocket
  webSocket.loop();
  
  // Leer botones
  readButtons();
  
  // Enviar estado periódicamente
  sendStatus();
  
  // Pequeño delay para no saturar
  delay(10);
}