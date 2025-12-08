// Include all necessary libraries
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include <PubSubClient.h>
#include <WebSocketsClient.h>
#include "DHT.h"

// Include our configuration and other modules
#include "src/config.h"

// Forward declarations for classes
class WiFiManager;
class IoTProtocol;
class MQ2Sensor;
class OLEDDisplay;
class RelayController;
class AlarmController;
class DHTSensor;

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
    float r0;              // Sensor resistance in clean air
    float rl;              // Load resistance in series with sensor (typically 10K)
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
    void initWithQuickWarmup();  // Alternative initialization with faster warmup
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    float getR0();
    bool isCalibrated();
};

MQ2Sensor::MQ2Sensor() {
    sensorPin = MQ2_PIN;    // Analog pin for MQ2 sensor
    r0 = 0.0;              // Will be set during calibration (initially zero)
    rl = 10.0;             // Load resistance in kΩ (typical value for MQ2)
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
}

void MQ2Sensor::initWithQuickWarmup() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-2 sensor initializing with quick warmup...");

    // Quick warmup - only 2 seconds instead of 60
    Serial.println("Quick warmup (2 seconds)...");
    for (int i = 0; i < 2; i++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nQuick warmup complete!");

    // Calibrate sensor in clean air
    calibrate();

    Serial.printf("MQ-2 sensor initialized with quick warmup. R0: %.2f\n", r0);
}

void MQ2Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-2 sensor initializing...");

    // Allow sensor to warm up - Reduce warmup time significantly
    // The MQ-2 needs less warmup time for initial calibration than the recommended 24-48 hours
    Serial.println("Warming up sensor (10 seconds)...");
    for (int i = 0; i < 10; i++) {
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
    Serial.println("Place sensor in clean air for accurate calibration!");

    float sum = 0;
    int samples = 20;  // Reduced samples for faster calibration while maintaining accuracy

    // Take multiple readings for calibration in clean air
    for (int i = 0; i < samples; i++) {
        float adcValue = analogRead(sensorPin);
        sum += adcValue;

        // Provide feedback during calibration
        if (i % 5 == 0) {
            Serial.print("*");  // Print a character every 5 readings for progress feedback
        }

        delay(10);  // Slightly increased delay between readings but fewer samples
    }

    float avgAdc = sum / samples;
    voltage = (avgAdc / 4095.0) * 3.3;  // ESP32 ADC is 12-bit (0-4095)

    // Calculate RS in clean air: Rs = ( (Vc - Vrl) / Vrl ) * RL
    // where Vrl = voltage across the load resistor
    float vrl = voltage;  // Voltage at the sensor output
    rs = ((3.3 - voltage) / voltage) * rl;  // Correct formula for MQ2

    // For MQ-2 sensor in clean air (100ppm of H2), typical RS/R0 ratio is around 9.8 for LPG
    // But for proper calibration we use H2 as reference: RS/R0 = ~1.0 for H2 in clean air
    // For MQ-2, Rs/R0 is typically ~1 in clean air (different gases have different baseline values)
    // Using the typical H2 value as baseline for calibration
    r0 = rs / 1.0;  // For H2 in clean air, RS/R0 ≈ 1.0

    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f, Voltage: %.2fV\n", r0, rs, voltage);
}

float MQ2Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    ppm = calculatePPM();

    return ppm;
}

float MQ2Sensor::calculateResistance() {
    if (voltage <= 0.01) {  // Prevent division by very small numbers
        // Calculate voltage from current reading if not cached
        float currentVoltage = (analogRead(sensorPin) / 4095.0) * 3.3;
        if (currentVoltage <= 0.01) currentVoltage = 0.01; // Prevent division by zero
        return ((3.3 - currentVoltage) / currentVoltage) * rl;
    }

    // Calculate sensor resistance: Rs = ( (Vc - Vrl) / Vrl ) * RL
    // where Vrl = voltage across the load resistor (which is the sensor output)
    return ((3.3 - voltage) / voltage) * rl;
}

float MQ2Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }

    // Return the ratio of sensor resistance in gas to sensor resistance in clean air
    return rs / r0;
}

float MQ2Sensor::calculatePPM() {
    // MQ-2 equation for LPG detection (which is the most common use case)
    // Based on MQ-2 sensitivity curve: log(Rs/R0) vs log(C) is approximately linear
    // The typical sensitivity characteristic for LPG follows a power law relationship
    // From MQ-2 datasheet: for LPG, the relationship is approximately: ppm = a * (Rs/R0)^b
    // For LPG detection: a ≈ 1012.7, b ≈ -2.518 (based on log-log plot from datasheet)

    if (ratio <= 0) {
        return 0;
    }

    // For LPG detection using MQ-2 (most common application)
    // Formula derived from log-log relationship on sensitivity chart
    float ppm = 1012.7 * pow(ratio, -2.518);

    // Limit the range to reasonable values (MQ-2 can detect from 100-10000ppm typically)
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;

    return ppm;
}

String MQ2Sensor::getAirQuality(float ppm) {
    // Air quality categories based on LPG/Combustible gas detection (MQ-2 primary use)
    // The MQ-2 is primarily sensitive to LPG, Propane, Hydrogen, etc.
    if (ppm < 200) {
        return "Excellent";  // Very low combustible gas concentration
    } else if (ppm < 500) {
        return "Good";       // Low levels of combustible gases
    } else if (ppm < 1000) {
        return "Moderate";   // Moderate levels of combustible gases
    } else if (ppm < 2000) {
        return "Poor";       // High levels, potential safety concern
    } else if (ppm < 5000) {
        return "Very Poor";  // Very high levels, immediate concern
    } else {
        return "Hazardous";  // Dangerous levels of combustible gases
    }
}

float MQ2Sensor::getVoltage() {
    return voltage;
}

float MQ2Sensor::getResistance() {
    return rs;
}

float MQ2Sensor::getR0() {
    return r0;
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

// Alarm Controller class for LED and Buzzer (Direct GPIO Control - Independent of Relay)
class AlarmController {
private:
    int ledPin;
    int buzzerPin;
    bool ledState;
    bool buzzerState;
    bool alarmActive;
    bool isInitialized;
    unsigned long lastBlinkTime;
    unsigned long blinkInterval; // 500ms for blinking
    unsigned long lastBeepTime;
    unsigned long beepInterval;  // 500ms for beeping

public:
    AlarmController();
    bool init();
    void setAlarmState(bool state);
    bool getAlarmState();
    void update(); // Call this in main loop for blinking/beeping
    void setLedState(bool state);
    void setBuzzerState(bool state);
    bool getLedState();
    bool getBuzzerState();
    void enableAlarm();
    void disableAlarm();
    bool isAlarmEnabled();
};

AlarmController::AlarmController() {
    ledPin = LED_PIN;           // Direct GPIO control of LED (independent of relay)
    buzzerPin = BUZZER_PIN;     // Direct GPIO control of buzzer (independent of relay)
    ledState = false;
    buzzerState = false;
    alarmActive = false;
    isInitialized = false;
    lastBlinkTime = 0;
    blinkInterval = 500; // 500ms blink interval
    lastBeepTime = 0;
    beepInterval = 500; // 500ms beep interval
}

bool AlarmController::init() {
    pinMode(ledPin, OUTPUT);      // Configure LED pin for direct GPIO control
    pinMode(buzzerPin, OUTPUT);   // Configure buzzer pin for direct GPIO control

    // Initialize to OFF state
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);

    ledState = false;
    buzzerState = false;
    alarmActive = false;
    isInitialized = true;

    Serial.println("Alarm controller initialized (LED/Buzzer directly controlled by GPIO)");
    return true;
}

void AlarmController::setAlarmState(bool state) {
    if (!isInitialized) {
        Serial.println("Alarm controller not initialized");
        return;
    }

    alarmActive = state;

    if (!alarmActive) {
        // Turn off both LED and buzzer when alarm is disabled
        setLedState(false);
        setBuzzerState(false);
    } else {
        // When enabling, start with LED on and buzzer on initially
        setLedState(true);
        setBuzzerState(true);
    }
}

bool AlarmController::getAlarmState() {
    return alarmActive;
}

void AlarmController::update() {
    if (!isInitialized || !alarmActive) {
        return;
    }

    unsigned long currentTime = millis();

    // Handle LED blinking
    if (currentTime - lastBlinkTime >= blinkInterval) {
        ledState = !ledState; // Toggle LED state
        digitalWrite(ledPin, ledState ? HIGH : LOW);
        lastBlinkTime = currentTime;
    }

    // Handle buzzer beeping (50% duty cycle - on for 250ms, off for 250ms)
    if (currentTime - lastBeepTime >= beepInterval) {
        buzzerState = !buzzerState; // Toggle buzzer state
        digitalWrite(buzzerPin, buzzerState ? HIGH : LOW);
        lastBeepTime = currentTime;
    }
}

void AlarmController::setLedState(bool state) {
    if (!isInitialized) return;

    ledState = state;
    digitalWrite(ledPin, ledState ? HIGH : LOW);
}

void AlarmController::setBuzzerState(bool state) {
    if (!isInitialized) return;

    buzzerState = state;
    digitalWrite(buzzerPin, buzzerState ? HIGH : LOW);
}

bool AlarmController::getLedState() {
    return ledState;
}

bool AlarmController::getBuzzerState() {
    return buzzerState;
}

void AlarmController::enableAlarm() {
    setAlarmState(true);
}

void AlarmController::disableAlarm() {
    setAlarmState(false);
}

bool AlarmController::isAlarmEnabled() {
    return alarmActive;
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

    // Relay Status (for devices controlled by relay)
    display.setCursor(10, 52);
    display.print("Relay: ");
    display.print(relayState ? "ON" : "OFF");

    // Add alarm status indicator (for LED/buzzer which are now directly controlled)
    bool alarmStatus = alarm.getAlarmState();
    if (alarmStatus) {
        display.print(" ALARM!");
    }

    // Status indicator - use for alarm status instead of relay when showing alarm
    display.drawCircle(120, 8, 3, SSD1306_WHITE);
    if (alarmStatus) {  // Show alarm status instead of relay status when alarm is active
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
    if (!isInitialized) return;

    clear();

    // Display message in a dedicated format
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("MESSAGE:");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);

    // Word wrap for long messages with proper spacing for the dedicated message screen
    int line = 2; // Start below the header
    int col = 0;
    int maxLines = 7; // Leave space for header

    for (int i = 0; i < message.length(); i++) {
        if (col > 20 || message.charAt(i) == '\n') {
            line++;
            col = 0;
            if (line >= maxLines) break; // Stop if we've reached max lines
        }

        if (message.charAt(i) != '\n') {
            display.setCursor(col * 6, line * 8);
            display.print(message.charAt(i));
            col++;
        }
    }

    display.display();
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
    display.print("System Running");

    // Add alarm status
    bool alarmStatus = alarm.getAlarmState();
    if (alarmStatus) {
        display.print(" ALARM!");
    }

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
    doc["alarm_state"] = alarm.getAlarmState() ? "ACTIVE" : "INACTIVE";  // LED/buzzer alarm state
    doc["temperature"] = currentTemperature;
    doc["humidity"] = currentHumidity;
    doc["timestamp"] = getCurrentTimestamp();

    String jsonString;
    serializeJson(doc, jsonString);

    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                bool success = mqttClient.publish(MQTT_DEVICE_TOPIC, jsonString.c_str());
                Serial.printf("MQTT Publish result: %s\n", success ? "Success" : "Failed");
                Serial.printf("Published JSON: %s\n", jsonString.c_str()); // Debug output
                return success;
            } else {
                Serial.println("MQTT not connected when trying to publish");
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
    doc["alarm_state"] = alarm.getAlarmState() ? "ACTIVE" : "INACTIVE";
    doc["temperature"] = currentTemperature;
    doc["humidity"] = currentHumidity;
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

// DHT Temperature/Humidity Sensor class
class DHTSensor {
private:
    DHT dht;
    int sensorPin;
    float temperature;
    float humidity;

public:
    DHTSensor();
    void init();
    float readTemperature();
    float readHumidity();
    float readTemperatureWithAveraging(int samples = DHT_READING_SAMPLES);
    float readHumidityWithAveraging(int samples = DHT_READING_SAMPLES);
    float readTemperatureWithRetry(int maxRetries = 3);
    float readHumidityWithRetry(int maxRetries = 3);
    bool readBothWithAveragingAndRetry(float& outTemp, float& outHumidity, int samples = DHT_READING_SAMPLES, int maxRetries = 2);
    bool isValidReading();
};

DHTSensor::DHTSensor() : dht(DHT_PIN, DHT_TYPE) {
    sensorPin = DHT_PIN;
    temperature = 0.0;
    humidity = 0.0;
}

void DHTSensor::init() {
    dht.begin();
    Serial.println("DHT sensor initialized");
}

float DHTSensor::readTemperature() {
    // Read temperature in Celsius
    temperature = dht.readTemperature();

    // Apply calibration offset from config.h
    temperature += DHT_TEMP_OFFSET;

    if (isnan(temperature)) {
        Serial.println("Failed to read temperature from DHT sensor!");
        return 0.0;
    }
    Serial.printf("Temperature: %.2f°C (calibrated)\n", temperature);
    return temperature;
}

float DHTSensor::readHumidity() {
    // Read humidity
    humidity = dht.readHumidity();

    // Apply calibration offset from config.h
    humidity += DHT_HUMID_OFFSET;

    // Ensure humidity stays within reasonable bounds
    if (humidity < 0) humidity = 0;
    if (humidity > 100) humidity = 100;

    if (isnan(humidity)) {
        Serial.println("Failed to read humidity from DHT sensor!");
        return 0.0;
    }
    Serial.printf("Humidity: %.2f%% (calibrated)\n", humidity);
    return humidity;
}

float DHTSensor::readTemperatureWithAveraging(int samples) {
    float totalTemp = 0;
    int validReadings = 0;

    for (int i = 0; i < samples; i++) {
        float temp = dht.readTemperature();

        if (!isnan(temp)) {
            // Apply calibration offset
            temp += DHT_TEMP_OFFSET;
            totalTemp += temp;
            validReadings++;
        } else {
            Serial.printf("Invalid temperature reading at sample %d\n", i);
        }

        // Add small delay between readings to improve accuracy
        if (i < samples - 1) {
            delay(50); // Small delay for sensor stabilization
        }
    }

    if (validReadings > 0) {
        temperature = totalTemp / validReadings;
        Serial.printf("Temperature: %.2f°C (average of %d valid readings)\n", temperature, validReadings);
    } else {
        Serial.println("All temperature readings were invalid!");
        temperature = 0.0;
    }

    return temperature;
}

float DHTSensor::readHumidityWithAveraging(int samples) {
    float totalHumidity = 0;
    int validReadings = 0;

    for (int i = 0; i < samples; i++) {
        float humidityReading = dht.readHumidity();

        if (!isnan(humidityReading)) {
            // Apply calibration offset
            humidityReading += DHT_HUMID_OFFSET;

            // Ensure humidity stays within reasonable bounds
            if (humidityReading < 0) humidityReading = 0;
            if (humidityReading > 100) humidityReading = 100;

            totalHumidity += humidityReading;
            validReadings++;
        } else {
            Serial.printf("Invalid humidity reading at sample %d\n", i);
        }

        // Add small delay between readings to improve accuracy
        if (i < samples - 1) {
            delay(50); // Small delay for sensor stabilization
        }
    }

    if (validReadings > 0) {
        humidity = totalHumidity / validReadings;
        Serial.printf("Humidity: %.2f%% (average of %d valid readings)\n", humidity, validReadings);
    } else {
        Serial.println("All humidity readings were invalid!");
        humidity = 0.0;
    }

    return humidity;
}

float DHTSensor::readTemperatureWithRetry(int maxRetries) {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
        float temp = dht.readTemperature();

        if (!isnan(temp)) {
            // Apply calibration offset
            temp += DHT_TEMP_OFFSET;
            temperature = temp;
            Serial.printf("Temperature: %.2f°C (read on attempt %d)\n", temperature, attempt + 1);
            return temperature;
        }

        Serial.printf("Temperature read failed on attempt %d, retrying...\n", attempt + 1);

        // Wait before retrying
        if (attempt < maxRetries - 1) {
            delay(250); // Wait 250ms before next attempt
        }
    }

    Serial.println("Temperature read failed after all retries!");
    temperature = 0.0;
    return temperature;
}

float DHTSensor::readHumidityWithRetry(int maxRetries) {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
        float humidityReading = dht.readHumidity();

        if (!isnan(humidityReading)) {
            // Apply calibration offset
            humidityReading += DHT_HUMID_OFFSET;

            // Ensure humidity stays within reasonable bounds
            if (humidityReading < 0) humidityReading = 0;
            if (humidityReading > 100) humidityReading = 100;

            humidity = humidityReading;
            Serial.printf("Humidity: %.2f%% (read on attempt %d)\n", humidity, attempt + 1);
            return humidity;
        }

        Serial.printf("Humidity read failed on attempt %d, retrying...\n", attempt + 1);

        // Wait before retrying
        if (attempt < maxRetries - 1) {
            delay(250); // Wait 250ms before next attempt
        }
    }

    Serial.println("Humidity read failed after all retries!");
    humidity = 0.0;
    return humidity;
}

bool DHTSensor::readBothWithAveragingAndRetry(float& outTemp, float& outHumidity, int samples, int maxRetries) {
    for (int retry = 0; retry < maxRetries; retry++) {
        float totalTemp = 0, totalHumidity = 0;
        int validTempReadings = 0, validHumidityReadings = 0;
        bool allReadingsValid = true;

        // Attempt to get multiple samples for averaging
        for (int i = 0; i < samples; i++) {
            float temp = dht.readTemperature();
            float humidity = dht.readHumidity();

            // Check if readings are valid
            bool tempValid = !isnan(temp);
            bool humidityValid = !isnan(humidity);

            if (tempValid) {
                // Apply calibration offset
                temp += DHT_TEMP_OFFSET;
                totalTemp += temp;
                validTempReadings++;
            } else {
                allReadingsValid = false;
                Serial.printf("Invalid temperature reading at sample %d, retry %d\n", i, retry);
            }

            if (humidityValid) {
                // Apply calibration offset
                humidity += DHT_HUMID_OFFSET;

                // Ensure humidity stays within reasonable bounds
                if (humidity < 0) humidity = 0;
                if (humidity > 100) humidity = 100;

                totalHumidity += humidity;
                validHumidityReadings++;
            } else {
                allReadingsValid = false;
                Serial.printf("Invalid humidity reading at sample %d, retry %d\n", i, retry);
            }

            // Add small delay between readings
            if (i < samples - 1) {
                delay(50);
            }
        }

        // Calculate averages if we have at least one valid reading for each
        bool tempSuccess = (validTempReadings > 0);
        bool humiditySuccess = (validHumidityReadings > 0);

        if (tempSuccess && humiditySuccess) {
            outTemp = totalTemp / validTempReadings;
            outHumidity = totalHumidity / validHumidityReadings;
            temperature = outTemp;
            this->humidity = outHumidity;

            Serial.printf("Temperature: %.2f°C (average of %d readings), Humidity: %.2f%% (average of %d readings) - Read on retry %d\n",
                         outTemp, validTempReadings, outHumidity, validHumidityReadings, retry + 1);
            return true; // Both readings successful
        } else if (tempSuccess && !humiditySuccess) {
            // If we only have temperature, we can still return that
            outTemp = totalTemp / validTempReadings;
            outHumidity = -1; // Indicate invalid humidity reading
            temperature = outTemp;

            Serial.printf("Temperature: %.2f°C (average of %d readings) - Partial read on retry %d\n",
                         outTemp, validTempReadings, retry + 1);
            return true;
        } else if (!tempSuccess && humiditySuccess) {
            // If we only have humidity, we can still return that
            outTemp = -1000; // Indicate invalid temperature reading
            outHumidity = totalHumidity / validHumidityReadings;
            this->humidity = outHumidity;

            Serial.printf("Humidity: %.2f%% (average of %d readings) - Partial read on retry %d\n",
                         outHumidity, validHumidityReadings, retry + 1);
            return true;
        }

        // If we reach here, we need to retry
        Serial.printf("Both readings failed on retry %d, attempting again...\n", retry + 1);
        if (retry < maxRetries - 1) {
            delay(500); // Wait before next retry
        }
    }

    // If we get here, all retries failed
    Serial.println("All retries failed for both temperature and humidity!");
    outTemp = 0.0;
    outHumidity = 0.0;
    return false;
}

bool DHTSensor::isValidReading() {
    // Check if the last readings were valid
    return (!isnan(temperature) && !isnan(humidity));
}

// Global objects
WiFiManager wifiManager;
IoTProtocol iotProtocol;
MQ2Sensor sensor;
OLEDDisplay display;
RelayController relay;
AlarmController alarm;
DHTSensor dhtSensor;

// Global variables
unsigned long lastSensorRead = 0;
unsigned long lastMQTTUpdate = 0;
unsigned long lastCommandCheck = 0;
unsigned long customMessageTime = 0;
float currentPPM = 0;
String currentQuality = "";
bool relayState = false;
bool alarmState = false;  // Track alarm state separately
int samplingInterval = 5; // seconds
String customMessage = "";
float currentTemperature = 0.0;
float currentHumidity = 0.0;

void setup() {
    Serial.begin(115200);
    Serial.println("ESP32 Air Quality Monitor Starting...");

    // Initialize components
    display.init();
    display.showWelcome();

    alarm.init();  // Initialize alarm controller first (LED/buzzer)
    relay.init();  // Initialize relay for other devices (independent of alarm)

    // Start sensor initialization with improved quick warmup
    Serial.println("MQ-2 sensor initializing with quick warmup...");
    display.showMessage("Sensor Warmup");

    pinMode(MQ2_PIN, INPUT);  // Direct pin setup before the warmup

    // Shorter warmup to reduce initial delay, with visual feedback
    Serial.println("Warming up sensor (3 seconds)...");
    for (int i = 0; i < 3; i++) {
        delay(1000);
        Serial.print(".");

        // Update display with progress during warmup
        String progress = "Warmup: " + String(3 - i) + "s";
        display.showMessage(progress);
    }
    Serial.println("\nSensor warmup complete!");

    // Calibrate sensor in clean air
    Serial.println("Calibrating MQ-2 sensor in clean air...");
    display.showMessage("Calibrating...");

    sensor.calibrate();  // Call calibration method directly with visual feedback

    Serial.printf("MQ-2 sensor initialized. R0: %.2f\n", sensor.getR0());

    dhtSensor.init();  // Initialize DHT temperature/humidity sensor

    // Connect to WiFi
    display.showMessage("WiFi Connect");
    if (!wifiManager.connect()) {
        Serial.println("WiFi connection failed!");
        display.showMessage("WiFi Failed");
        ESP.restart();
    }

    // Initialize IoT Protocol (using MQTT for dashboard communication)
    display.showMessage("MQTT Connect");
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

    // Check for message timeout (10 seconds as requested)
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

        // Read temperature and humidity with averaging and retry for maximum accuracy
        float temp, humidity;
        if (dhtSensor.readBothWithAveragingAndRetry(temp, humidity)) {
            currentTemperature = temp;
            currentHumidity = humidity;
        } else {
            // Fallback to basic read if advanced method fails
            currentTemperature = dhtSensor.readTemperature();
            currentHumidity = dhtSensor.readHumidity();
        }

        Serial.printf("PPM: %.2f, Quality: %s\n", currentPPM, currentQuality.c_str());
        Serial.printf("Temperature: %.2f°C, Humidity: %.2f%%\n", currentTemperature, currentHumidity);

        // Check if PPM has reached dangerous level (1000) to activate alarm
        if (currentPPM >= 1000 && !alarmState) {
            // Activate alarm if PPM reaches 1000 and it's not already active
            alarmState = true;
            alarm.enableAlarm();
            Serial.println("ALARM ACTIVATED: PPM reached dangerous level!");
        } else if (currentPPM < 500 && alarmState) {
            // Deactivate alarm when PPM returns to normal levels
            // Using 500 as the return threshold to avoid oscillation around the threshold
            alarmState = false;
            alarm.disableAlarm();
            Serial.println("ALARM DEACTIVATED: PPM returned to normal levels");
        }

        // The alarm now operates independently of the relay
        // (Removed the relay-dependent alarm deactivation)

        // Update display (only if no custom message is active)
        if (customMessage.length() > 0) {
            // Refresh the custom message display periodically to ensure it stays visible
            // Only refresh every few seconds to avoid excessive flickering
            static unsigned long lastMessageRefresh = 0;
            if (millis() - lastMessageRefresh > 3000) {  // Refresh every 3 seconds while showing message
                display.showCustomMessage(customMessage);
                lastMessageRefresh = millis();
            }
        } else {
            display.showAirQuality(currentPPM, currentQuality, relayState);
        }

        // Note: Alarm (LED/buzzer) operates independently of relay state
        // based on air quality readings and alarm state
    }

    // Send sensor data to MQTT broker every 30 seconds
    if (currentMillis - lastMQTTUpdate >= MQTT_UPDATE_INTERVAL) {
        lastMQTTUpdate = currentMillis;

        if (iotProtocol.sendSensorData(currentPPM, currentQuality, relayState)) {
            Serial.println("Data sent to MQTT broker successfully");

            // Also update device status periodically to maintain presence
            iotProtocol.updateDeviceStatus(true);
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

    // Update alarm state (handles LED blinking and buzzer beeping)
    alarm.update();

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

                // Set MQTT client parameters for better reliability
                mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
                mqttClient.setCallback(mqttCallback);

                // Attempt to connect with improved settings
                // Set keepalive to 60 seconds for better connection stability
                mqttClient.setKeepAlive(60);

                if (mqttClient.connect(clientId.c_str(), MQTT_STATUS_TOPIC, 0, true, "offline")) {
                    Serial.println("MQTT Connected");
                    // Subscribe to command topic
                    if (mqttClient.subscribe(MQTT_COMMAND_TOPIC)) {
                        Serial.println("Successfully subscribed to command topic");
                    } else {
                        Serial.println("Failed to subscribe to command topic");
                    }

                    // Publish online status
                    mqttClient.publish(MQTT_STATUS_TOPIC, "online", true);

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
            bool connected = mqttClient.connected();
            if (!connected) {
                Serial.println("MQTT not connected, state: " + String(mqttClient.state()));
            }
            return connected;
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
                // Try to reconnect with exponential backoff
                static unsigned long lastReconnectAttempt = 0;
                if (millis() - lastReconnectAttempt > 10000) {  // Try reconnect every 10 seconds
                    lastReconnectAttempt = millis();
                    connect();
                }
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

            // Relay is now independent of alarm - no longer turn off alarm when relay is OFF
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
