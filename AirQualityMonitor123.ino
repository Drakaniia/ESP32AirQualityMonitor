// Include all necessary libraries
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

// Include our new IoT protocol and other modules
#include "src/config.h"
#include "src/iot_protocol.h"

// Forward declarations for classes
class WiFiManager;
class IoTProtocol;
class MQ2Sensor;
class OLEDDisplay;
class RelayController;

// WiFi Manager class
class WiFiManager {
private:
    const char* ssid;
    const char* password;
    unsigned long connectionTimeout;
    bool isConnected;

public:
    WiFiManager();
    bool connect();
    bool reconnect();
    bool checkConnection();
    String getLocalIP();
    int getSignalStrength();
    void disconnect();
};

WiFiManager::WiFiManager() {
    ssid = WIFI_SSID;
    password = WIFI_PASSWORD;
    connectionTimeout = 20000; // 20 seconds
    isConnected = false;
}

bool WiFiManager::connect() {
    Serial.println("Connecting to WiFi...");

    WiFi.begin(ssid, password);

    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < connectionTimeout) {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
        isConnected = true;
        Serial.println("\nWiFi connected successfully!");
        Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
        return true;
    } else {
        isConnected = false;
        Serial.println("\nWiFi connection failed!");
        return false;
    }
}

bool WiFiManager::reconnect() {
    if (WiFi.status() == WL_CONNECTED) {
        return true;
    }

    disconnect();
    return connect();
}

bool WiFiManager::checkConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        isConnected = false;
        return false;
    }

    if (!isConnected) {
        isConnected = true;
    }

    return true;
}

String WiFiManager::getLocalIP() {
    if (isConnected) {
        return WiFi.localIP().toString();
    }
    return "0.0.0.0";
}

int WiFiManager::getSignalStrength() {
    if (isConnected) {
        return WiFi.RSSI();
    }
    return -100;
}

void WiFiManager::disconnect() {
    WiFi.disconnect();
    isConnected = false;
    Serial.println("WiFi disconnected");
}

// MQ2 Sensor class for detecting LPG, Butane, Propane, Methane, Alcohol, Hydrogen
class MQ2Sensor {
private:
    int sensorPin;
    float r0;
    float rl;  // Load resistance in series with sensor (typically 10K)
    float ppm;
    float voltage;
    float rs;
    float ratio;

    float calculateResistance();
    float calculateRatio();
    float calculatePPM();
    void calibrate();

public:
    MQ2Sensor();
    void init();
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    bool isCalibrated();
};

MQ2Sensor::MQ2Sensor() {
    sensorPin = MQ2_PIN;  // Use MQ2-specific pin
    r0 = MQ2_R0;          // Default R0 value for MQ2 (will be calibrated)
    rl = 10.0;            // Load resistance in kΩ (typical value)
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
}

void MQ2Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-2 sensor initializing...");

    // Allow sensor to warm up (recommended 24-48 hours for best results, but we'll use 60 seconds for practicality)
    Serial.println("Warming up sensor (60 seconds)...");
    for (int i = 0; i < 60; i++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nSensor warmed up!");

    // Calibrate sensor in clean air
    calibrate();

    Serial.printf("MQ-2 sensor initialized. R0: %.2f\n", r0);
}

void MQ2Sensor::calibrate() {
    Serial.println("Calibrating MQ-2 sensor in clean air...");

    float sum = 0;
    int samples = 100;

    // Take multiple readings for calibration in clean air
    for (int i = 0; i < samples; i++) {
        float adcValue = analogRead(sensorPin);
        sum += adcValue;
        delay(10);
    }

    float avgAdc = sum / samples;
    float voltage = (avgAdc / 4095.0) * 3.3;  // ESP32 ADC is 12-bit (0-4095)

    // Calculate RS in clean air
    float vrl = voltage * rl / 3.3;
    rs = (3.3 - voltage) / vrl * rl;

    // For MQ-2 sensor detecting LPG/Butane, typical R0 value is calculated from RS/correction factor
    // The Rs/R0 ratio in clean air is typically around 9.8 for LPG (from datasheet curves)
    r0 = rs / 9.8;  // Typical ratio in clean air for LPG detection

    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f\n", r0, rs);
}

float MQ2Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    ppm = calculatePPM();

    return ppm;
}

float MQ2Sensor::calculateResistance() {
    if (voltage <= 0) {
        return 0;
    }

    // Calculate voltage across the load resistor
    float vrl = voltage * rl / 3.3;
    if (vrl <= 0) {
        return (3.3 - voltage) / 0.001 * rl;  // Prevent division by zero
    }

    // Calculate sensor resistance: Rs = (Vcc - Vout) * RL / Vout
    return (3.3 - voltage) / vrl * rl;
}

float MQ2Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }

    // Return the ratio of sensor resistance in gas to sensor resistance in clean air
    return rs / r0;
}

float MQ2Sensor::calculatePPM() {
    // MQ-2 equation for LPG/Butane detection
    // Based on datasheet sensitivity curves: log(Rs/Ro) vs. log(C) (concentration)
    // For LPG, the relationship is approximately: ppm = a * (Rs/Ro)^b
    // From typical MQ-2 sensitivity chart for LPG/Butane: a = 1000.0, b = -2.182
    // These values are derived from the log-log relationship in the datasheet

    if (ratio <= 0) {
        return 0;
    }

    // For LPG (propane, butane) detection, use the following power law equation
    // This equation is derived from the typical MQ-2 sensitivity curves
    float ppm = 987.98 * pow(ratio, -2.182);

    // Limit the range to reasonable values
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;

    return ppm;
}

String MQ2Sensor::getAirQuality(float ppm) {
    // Air quality categories based on LPG/Butane PPM
    if (ppm < 100) {
        return "Excellent";
    } else if (ppm < 200) {
        return "Good";
    } else if (ppm < 500) {
        return "Moderate";
    } else if (ppm < 1000) {
        return "Poor";
    } else if (ppm < 2000) {
        return "Very Poor";
    } else {
        return "Hazardous";
    }
}

float MQ2Sensor::getVoltage() {
    return voltage;
}

float MQ2Sensor::getResistance() {
    return rs;
}

bool MQ2Sensor::isCalibrated() {
    return (r0 > 0);
}

// Relay Controller class
class RelayController {
private:
    int relayPin;
    bool currentState;
    bool isInitialized;
    unsigned long lastToggleTime;
    unsigned long debounceDelay;

public:
    RelayController();
    bool init();
    void setState(bool state);
    bool getState();
    void toggle();
    void turnOn();
    void turnOff();
    bool isOn();
    bool isOff();
    void pulse(unsigned long duration);
    unsigned long getLastToggleTime();
};

RelayController::RelayController() {
    relayPin = RELAY_PIN;
    currentState = false;
    isInitialized = false;
    lastToggleTime = 0;
    debounceDelay = 100; // 100ms debounce
}

bool RelayController::init() {
    pinMode(relayPin, OUTPUT);

    // Initialize relay to OFF state
    digitalWrite(relayPin, HIGH); // Most relay modules are active LOW
    currentState = false;

    isInitialized = true;
    Serial.println("Relay controller initialized");
    Serial.println("Relay state: OFF");

    return true;
}

void RelayController::setState(bool state) {
    if (!isInitialized) {
        Serial.println("Relay not initialized");
        return;
    }

    // Debounce protection
    unsigned long currentTime = millis();
    if (currentTime - lastToggleTime < debounceDelay) {
        return;
    }

    if (state != currentState) {
        currentState = state;

        // Most relay modules are active LOW
        if (state) {
            digitalWrite(relayPin, LOW); // Turn ON
        } else {
            digitalWrite(relayPin, HIGH); // Turn OFF
        }

        lastToggleTime = currentTime;

        Serial.printf("Relay state changed to: %s\n", currentState ? "ON" : "OFF");
    }
}

bool RelayController::getState() {
    return currentState;
}

void RelayController::toggle() {
    setState(!currentState);
}

void RelayController::turnOn() {
    setState(true);
}

void RelayController::turnOff() {
    setState(false);
}

bool RelayController::isOn() {
    return currentState;
}

bool RelayController::isOff() {
    return !currentState;
}

void RelayController::pulse(unsigned long duration) {
    if (!isInitialized) {
        Serial.println("Relay not initialized");
        return;
    }

    Serial.printf("Pulsing relay for %lu ms\n", duration);

    turnOn();
    delay(duration);
    turnOff();

    Serial.println("Relay pulse completed");
}

unsigned long RelayController::getLastToggleTime() {
    return lastToggleTime;
}

// OLED Display class
class OLEDDisplay {
private:
    Adafruit_SSD1306 display;
    int screenWidth;
    int screenHeight;
    int sdaPin;
    int sclPin;
    bool isInitialized;

public:
    OLEDDisplay();
    bool init();
    void clear();
    void showWelcome();
    void showAirQuality(float ppm, String quality, bool relayState);
    void showMessage(String message);
    void showCustomMessage(String message);
    void showWiFiStatus(String ip);
    void showSensorData(float ppm, float voltage, float resistance);
    void showSystemInfo(String status);
    void update();
};

OLEDDisplay::OLEDDisplay() : display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1) {
    screenWidth = SCREEN_WIDTH;
    screenHeight = SCREEN_HEIGHT;
    sdaPin = OLED_SDA;
    sclPin = OLED_SCL;
    isInitialized = false;
}

bool OLEDDisplay::init() {
    Wire.begin(sdaPin, sclPin);

    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println("SSD1306 allocation failed");
        return false;
    }

    isInitialized = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);

    Serial.println("OLED display initialized successfully");
    return true;
}

void OLEDDisplay::clear() {
    if (!isInitialized) return;

    display.clearDisplay();
    display.setCursor(0, 0);
}

void OLEDDisplay::showWelcome() {
    if (!isInitialized) return;

    clear();

    display.setTextSize(2);
    display.setCursor(20, 10);
    display.println("ESP32");
    display.setCursor(15, 35);
    display.println("AQ Monitor");

    display.setTextSize(1);
    display.setCursor(30, 55);
    display.println("Starting...");

    display.display();
}

void OLEDDisplay::showAirQuality(float ppm, String quality, bool relayState) {
    if (!isInitialized) return;

    clear();

    // Title
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("Air Quality Monitor");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    // PPM Value
    display.setTextSize(2);
    display.setCursor(10, 18);
    display.print(ppm, 1);
    display.setTextSize(1);
    display.println(" PPM");

    // Quality Status
    display.setTextSize(1);
    display.setCursor(10, 40);
    display.print("Quality: ");

    // Color coding based on quality
    if (quality == "Excellent" || quality == "Good") {
        display.println(quality);
    } else if (quality == "Moderate") {
        display.println(quality);
    } else {
        display.println(quality);
    }

    // Relay Status
    display.setCursor(10, 52);
    display.print("Relay: ");
    display.println(relayState ? "ON" : "OFF");

    // Status indicator
    display.drawCircle(120, 8, 3, SSD1306_WHITE);
    if (relayState) {
        display.fillCircle(120, 8, 2, SSD1306_WHITE);
    }

    display.display();
}

void OLEDDisplay::showMessage(String message) {
    if (!isInitialized) return;

    clear();

    display.setTextSize(1);
    display.setCursor(0, 0);

    // Word wrap for long messages
    int line = 0;
    int col = 0;
    for (int i = 0; i < message.length(); i++) {
        if (col > 20 || message.charAt(i) == '\n') {
            line++;
            col = 0;
            if (line > 7) break; // Max lines for 128x64 display
        }

        if (message.charAt(i) != '\n') {
            display.setCursor(col * 6, line * 8);
            display.print(message.charAt(i));
            col++;
        }
    }

    display.display();
}

void OLEDDisplay::showCustomMessage(String message) {
    showMessage(message);
}

void OLEDDisplay::showWiFiStatus(String ip) {
    if (!isInitialized) return;

    clear();

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("WiFi Status");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    display.setCursor(0, 20);
    display.println("Connected!");

    display.setCursor(0, 30);
    display.print("IP: ");
    display.println(ip);

    display.setCursor(0, 45);
    display.println("System Ready");

    display.display();
}

void OLEDDisplay::showSensorData(float ppm, float voltage, float resistance) {
    if (!isInitialized) return;

    clear();

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("Sensor Data");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    display.setCursor(0, 18);
    display.print("PPM: ");
    display.println(ppm, 1);

    display.setCursor(0, 28);
    display.print("Voltage: ");
    display.print(voltage, 2);
    display.println("V");

    display.setCursor(0, 38);
    display.print("RS: ");
    display.print(resistance, 1);
    display.println("kΩ");

    display.setCursor(0, 48);
    display.println("System Running");

    display.display();
}

void OLEDDisplay::showSystemInfo(String status) {
    if (!isInitialized) return;

    clear();

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("System Info");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    display.setCursor(0, 20);
    display.print("Status: ");
    display.println(status);

    display.setCursor(0, 30);
    display.print("Free Heap: ");
    display.print(ESP.getFreeHeap() / 1024);
    display.println("KB");

    display.setCursor(0, 40);
    display.print("Uptime: ");
    display.print(millis() / 1000);
    display.println("s");

    display.setCursor(0, 50);
    display.println("ESP32 AQ Monitor");

    display.display();
}

void OLEDDisplay::update() {
    if (!isInitialized) return;
    display.display();
}

// IoT Protocol class
class IoTProtocol {
private:
    WiFiClient espClient;
    PubSubClient mqttClient;
    WebSocketsClient webSocket;
    HTTPClient httpClient;

    String serverAddress;
    int protocolType;
    bool isConnected;
    String deviceId;

    String getCurrentTimestamp();

    // MQTT callbacks
    static void mqttCallback(char* topic, byte* payload, unsigned int length);

    // WebSocket callbacks
    void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);

public:
    IoTProtocol();
    bool init(int protocol, String server = "", String deviceId = "esp32_01");
    bool connect();
    bool sendSensorData(float ppm, String quality, bool relayState);
    String getCommands();
    String createSensorData(float ppm, String quality, bool relayState);
    bool updateDeviceStatus(bool online);
    bool isConnectedToServer();
    void loop();  // Call this in your main loop for MQTT and WebSocket
};

IoTProtocol::IoTProtocol() : mqttClient(espClient) {
    protocolType = COMM_PROTOCOL;
    isConnected = false;
    deviceId = DEVICE_ID;
}

bool IoTProtocol::init(int protocol, String server, String devId) {
    protocolType = protocol;
    serverAddress = server;
    deviceId = devId;

    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            // Configure MQTT client
            mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
            mqttClient.setCallback(mqttCallback);
            Serial.println("MQTT Protocol initialized");
            break;

        case COMM_PROTOCOL_WEBSOCKET:
            // Configure WebSocket client
            webSocket.begin(serverAddress, WS_PORT, "/");
            webSocket.onEvent([this](WStype_t type, uint8_t * payload, size_t length) {
                this->webSocketEvent(type, payload, length);
            });
            Serial.println("WebSocket Protocol initialized");
            break;

        case COMM_PROTOCOL_HTTP:
            Serial.println("HTTP Protocol initialized");
            break;

        default:
            Serial.println("Unknown protocol selected");
            return false;
    }

    return true;
}

String IoTProtocol::getCurrentTimestamp() {
    // Get current time from NTP server
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        // Fallback to timestamp in seconds
        return String(millis());
    }

    char buffer[64];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buffer);
}

bool IoTProtocol::sendSensorData(float ppm, String quality, bool relayState) {
    // Create JSON payload
    DynamicJsonDocument doc(512);
    doc["device_id"] = deviceId;
    doc["ppm"] = ppm;
    doc["quality"] = quality;
    doc["relay_state"] = relayState ? "ON" : "OFF";
    doc["timestamp"] = getCurrentTimestamp();

    String jsonString;
    serializeJson(doc, jsonString);

    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                bool success = mqttClient.publish(MQTT_DEVICE_TOPIC, jsonString.c_str());
                Serial.printf("MQTT Publish result: %s\n", success ? "Success" : "Failed");
                return success;
            }
            break;

        case COMM_PROTOCOL_WEBSOCKET:
            if (isConnected) {
                bool success = webSocket.sendTXT(jsonString);
                Serial.printf("WebSocket Send result: %s\n", success ? "Success" : "Failed");
                return success;
            }
            break;

        case COMM_PROTOCOL_HTTP:
            {
                httpClient.begin(espClient, "http://your-http-endpoint.com/api/sensor-data");
                httpClient.addHeader("Content-Type", "application/json");

                int httpResponseCode = httpClient.POST(jsonString);
                String response = httpClient.getString();

                Serial.printf("HTTP POST response code: %d, Response: %s\n", httpResponseCode, response.c_str());

                httpClient.end();

                return (httpResponseCode > 0 && httpResponseCode < 300);
            }
            break;
    }

    return false;
}

String IoTProtocol::getCommands() {
    String command = "";

    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();  // Process MQTT messages
                // Command handling is done in callback
            }
            break;

        case COMM_PROTOCOL_WEBSOCKET:
            webSocket.loop();
            // Command handling is done in webSocketEvent
            break;

        case COMM_PROTOCOL_HTTP:
            {
                // HTTP is not ideal for receiving commands in real-time
                // Would need to poll for commands
                httpClient.begin(espClient, "http://your-http-endpoint.com/api/device-commands/" + deviceId);
                int httpResponseCode = httpClient.GET();

                if (httpResponseCode > 0) {
                    command = httpClient.getString();
                }

                httpClient.end();
            }
            break;
    }

    return command;
}

String IoTProtocol::createSensorData(float ppm, String quality, bool relayState) {
    DynamicJsonDocument doc(512);
    doc["device_id"] = deviceId;
    doc["ppm"] = ppm;
    doc["quality"] = quality;
    doc["relay_state"] = relayState ? "ON" : "OFF";
    doc["timestamp"] = getCurrentTimestamp();

    String output;
    serializeJson(doc, output);
    return output;
}


bool IoTProtocol::updateDeviceStatus(bool online) {
    DynamicJsonDocument doc(256);
    doc["device_id"] = deviceId;
    doc["status"] = online ? "online" : "offline";
    doc["timestamp"] = getCurrentTimestamp();

    String jsonString;
    serializeJson(doc, jsonString);

    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                return mqttClient.publish(MQTT_STATUS_TOPIC, jsonString.c_str());
            }
            break;

        case COMM_PROTOCOL_WEBSOCKET:
            if (isConnected) {
                return webSocket.sendTXT("status:" + jsonString);
            }
            break;

        case COMM_PROTOCOL_HTTP:
            {
                httpClient.begin(espClient, "http://your-http-endpoint.com/api/device-status");
                httpClient.addHeader("Content-Type", "application/json");

                int httpResponseCode = httpClient.PUT(jsonString);
                httpClient.end();

                return (httpResponseCode > 0 && httpResponseCode < 300);
            }
            break;
    }

    return false;
}

// Global objects
WiFiManager wifiManager;
IoTProtocol iotProtocol;
MQ2Sensor sensor;
OLEDDisplay display;
RelayController relay;

// Global variables
unsigned long lastSensorRead = 0;
unsigned long lastMQTTUpdate = 0;
unsigned long lastCommandCheck = 0;
unsigned long customMessageTime = 0;
float currentPPM = 0;
String currentQuality = "";
bool relayState = false;
int samplingInterval = 5; // seconds
String customMessage = "";

void setup() {
    Serial.begin(115200);
    Serial.println("ESP32 Air Quality Monitor Starting...");

    // Initialize components
    display.init();
    display.showWelcome();

    relay.init();

    sensor.init();

    // Connect to WiFi
    if (!wifiManager.connect()) {
        Serial.println("WiFi connection failed!");
        display.showMessage("WiFi Failed");
        ESP.restart();
    }

    // Initialize IoT Protocol (using MQTT for dashboard communication)
    if (!iotProtocol.init(COMM_PROTOCOL_MQTT, MQTT_SERVER)) {
        Serial.println("IoT Protocol initialization failed!");
        display.showMessage("IoT Protocol Error");
    } else {
        // Attempt to connect to the MQTT broker
        if (iotProtocol.connect()) {
            Serial.println("MQTT connected successfully");
            // Update device status to online
            iotProtocol.updateDeviceStatus(true);
        } else {
            Serial.println("MQTT connection failed");
        }
    }

    display.showMessage("System Ready");
    delay(2000);
}

void loop() {
    unsigned long currentMillis = millis();

    // Check for message timeout
    if (customMessage.length() > 0 && currentMillis - customMessageTime > 10000) {
        customMessage = "";
        customMessageTime = 0;
        Serial.println("Custom message cleared after 10 seconds");
        // Force display update to show air quality immediately
        display.showAirQuality(currentPPM, currentQuality, relayState);
    }

    // Read sensor data at sampling interval
    if (currentMillis - lastSensorRead >= samplingInterval * 1000) {
        lastSensorRead = currentMillis;

        currentPPM = sensor.readPPM();
        currentQuality = sensor.getAirQuality(currentPPM);

        Serial.printf("PPM: %.2f, Quality: %s\n", currentPPM, currentQuality.c_str());

        // Update display (only if no custom message is active)
        if (customMessage.length() > 0) {
            // Message is already displayed, but we can refresh it if needed
            // or just do nothing and let the message stay
        } else {
            display.showAirQuality(currentPPM, currentQuality, relayState);
        }
    }

    // Send sensor data to MQTT broker every 30 seconds
    if (currentMillis - lastMQTTUpdate >= MQTT_UPDATE_INTERVAL) {
        lastMQTTUpdate = currentMillis;

        if (iotProtocol.sendSensorData(currentPPM, currentQuality, relayState)) {
            Serial.println("Data sent to MQTT broker successfully");
        } else {
            Serial.println("Failed to send data to MQTT broker");
        }
    }

    // Check for commands from MQTT every 5 seconds
    if (currentMillis - lastCommandCheck >= 5000) {
        lastCommandCheck = currentMillis;

        // For MQTT, commands are handled in the callback, so we just need to make sure loop is running
    }

    // Call loop for IoT protocol (needed for MQTT command handling)
    iotProtocol.loop();

    delay(100);
}

// Forward declaration for processCommands function
void processCommands(String commandsJson);

// MQTT callback function
void IoTProtocol::mqttCallback(char* topic, byte* payload, unsigned int length) {
    // This would handle incoming MQTT messages
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.printf("MQTT Message received on topic %s: %s\n", topic, message.c_str());

    // Process the command
    processCommands(message);
}

// WebSocket event handler function
void IoTProtocol::webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WSc] Disconnected!\n");
            isConnected = false;
            break;
        case WStype_CONNECTED:
            Serial.printf("[WSc] Connected to url: %s\n", payload);
            isConnected = true;
            break;
        case WStype_TEXT:
            Serial.printf("[WSc] Received text: %s\n", payload);
            // Process the command
            processCommands((char*)payload);
            break;
        case WStype_BIN:
            Serial.printf("[WSc] Got binary length: %u\n", length);
            break;
    }
}

bool IoTProtocol::connect() {
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (!mqttClient.connected()) {
                String clientId = "ESP32Client-" + String(random(0xffff), HEX);

                if (mqttClient.connect(clientId.c_str())) {
                    Serial.println("MQTT Connected");
                    // Subscribe to command topic
                    mqttClient.subscribe(MQTT_COMMAND_TOPIC);
                    isConnected = true;
                    return true;
                } else {
                    Serial.printf("MQTT connection failed, state: %d\n", mqttClient.state());
                    isConnected = false;
                    return false;
                }
            }
            return true;

        case COMM_PROTOCOL_WEBSOCKET:
            if (!isConnected) {
                webSocket.begin(serverAddress, WS_PORT, "/");
            }
            return isConnected;

        case COMM_PROTOCOL_HTTP:
            // HTTP doesn't maintain a connection, so always "connected"
            isConnected = true;
            return true;

        default:
            return false;
    }
}

bool IoTProtocol::isConnectedToServer() {
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            return mqttClient.connected();
        case COMM_PROTOCOL_WEBSOCKET:
            return isConnected;
        case COMM_PROTOCOL_HTTP:
            // For HTTP, check WiFi connection
            return WiFi.status() == WL_CONNECTED;
        default:
            return false;
    }
}

void IoTProtocol::loop() {
    // Call this in your main loop for proper operation
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();
            } else {
                // Try to reconnect
                connect();
            }
            break;

        case COMM_PROTOCOL_WEBSOCKET:
            webSocket.loop();
            break;
    }
}

void processCommands(String commandsJson) {
    Serial.printf("Processing command: %s\n", commandsJson.c_str());
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, commandsJson);

    if (error) {
        Serial.printf("Failed to parse commands JSON: %s\n", error.c_str());
        return;
    }

    Serial.println("Commands JSON parsed successfully");

    // Process relay command
    if (doc.containsKey("relay_state")) {
        String newRelayState = doc["relay_state"];
        bool newState = (newRelayState == "ON");
        if (newState != relayState) {
            relayState = newState;
            relay.setState(relayState);
            Serial.printf("Relay state changed to: %s\n", relayState ? "ON" : "OFF");
        }
    }

    // Process sampling interval command
    if (doc.containsKey("sampling_interval")) {
        int newInterval = doc["sampling_interval"];
        if (newInterval >= 1 && newInterval <= 300) {
            samplingInterval = newInterval;
            Serial.printf("Sampling interval changed to: %d seconds\n", samplingInterval);
        }
    }

    // Process OLED message command
    if (doc.containsKey("oled_message")) {
        String newMessage = doc["oled_message"];
        customMessage = newMessage;
        customMessageTime = millis(); // Record when message was set
        Serial.printf("OLED message set to: '%s'\n", customMessage.c_str());
        
        // Update display immediately
        display.showCustomMessage(customMessage);

        // Handle CLEAR command immediately
        if (customMessage == "CLEAR") {
            customMessage = "";
            customMessageTime = 0;
            Serial.println("OLED message cleared");
            display.showAirQuality(currentPPM, currentQuality, relayState);
        }
    }
}
