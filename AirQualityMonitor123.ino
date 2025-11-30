// Configuration constants
#define WIFI_SSID "AirQualityMonitorNetwork"  
#define WIFI_PASSWORD "SecurePassword123"  
#define FIREBASE_PROJECT_ID "air-quality-monitor-c0862"
#define FIREBASE_API_KEY "AIzaSyAgCNERlOUnJyQsgFFGawHm9gIygUTxwQM"
#define DEVICE_ID "esp32_01"
#define MQ135_PIN 34
#define RELAY_PIN 26
#define OLED_SDA 21
#define OLED_SCL 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDRESS 0x3C
#define MQ135_R0 76.63
#define SENSOR_READ_INTERVAL 5000
#define FIREBASE_UPDATE_INTERVAL 30000
#define COMMAND_CHECK_INTERVAL 10000
#define DEBUG true
#define LED_BUILTIN 2
#define AQ_THRESHOLD_EXCELLENT 50
#define AQ_THRESHOLD_GOOD 100
#define AQ_THRESHOLD_MODERATE 200
#define AQ_THRESHOLD_POOR 400
#define AQ_THRESHOLD_VERY_POOR 800

// Include all necessary libraries
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

// Forward declarations for classes
class WiFiManager;
class FirebaseClient;
class MQ135Sensor;
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

// MQ135 Sensor class
class MQ135Sensor {
private:
    int sensorPin;
    float r0;
    float rl;
    float ppm;
    float voltage;
    float rs;
    float ratio;

    float calculateResistance();
    float calculateRatio();
    float calculatePPM();
    void calibrate();

public:
    MQ135Sensor();
    void init();
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    bool isCalibrated();
};

MQ135Sensor::MQ135Sensor() {
    sensorPin = MQ135_PIN;
    r0 = MQ135_R0;
    rl = 10.0;
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
}

void MQ135Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-135 sensor initializing...");

    // Allow sensor to warm up
    Serial.println("Warming up sensor (60 seconds)...");
    for (int i = 0; i < 60; i++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nSensor warmed up!");

    // Calibrate sensor
    calibrate();

    Serial.printf("MQ-135 sensor initialized. R0: %.2f\n", r0);
}

void MQ135Sensor::calibrate() {
    Serial.println("Calibrating MQ-135 sensor...");

    float sum = 0;
    int samples = 100;

    // Take multiple readings for calibration
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

    // R0 = RS in clean air (approximately 76.63 for MQ-135)
    r0 = rs / 9.83;  // Ratio for clean air

    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f\n", r0, rs);
}

float MQ135Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    ppm = calculatePPM();

    return ppm;
}

float MQ135Sensor::calculateResistance() {
    if (voltage <= 0) {
        return 0;
    }

    float vrl = voltage * rl / 3.3;
    if (vrl <= 0) {
        return 0;
    }

    return (3.3 - voltage) / vrl * rl;
}

float MQ135Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }

    return rs / r0;
}

float MQ135Sensor::calculatePPM() {
    // MQ-135 equation for CO2 approximation
    // PPM = a * (RS/R0)^b
    // For CO2: a = 116.6020682, b = -2.769034857

    if (ratio <= 0) {
        return 0;
    }

    float logRatio = log10(ratio);
    float ppm = 116.6020682 * pow(10, -2.769034857 * logRatio);

    // Limit the range to reasonable values
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;

    return ppm;
}

String MQ135Sensor::getAirQuality(float ppm) {
    // Air quality categories based on PPM
    if (ppm < 50) {
        return "Excellent";
    } else if (ppm < 100) {
        return "Good";
    } else if (ppm < 200) {
        return "Moderate";
    } else if (ppm < 400) {
        return "Poor";
    } else if (ppm < 800) {
        return "Very Poor";
    } else {
        return "Hazardous";
    }
}

float MQ135Sensor::getVoltage() {
    return voltage;
}

float MQ135Sensor::getResistance() {
    return rs;
}

bool MQ135Sensor::isCalibrated() {
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

// Firebase Client class
class FirebaseClient {
private:
    HTTPClient http;
    String projectId;
    String apiKey;
    String deviceId;
    String firestoreUrl;
    String realtimeDbUrl;
    bool isInitialized;

    String getCurrentTimestamp();
    bool sendHttpRequest(String url, String method, String payload = "");
    String getHttpRequest(String url);

public:
    FirebaseClient();
    bool init();
    bool sendSensorData(String jsonData);
    String getCommands();
    String createSensorData(float ppm, String quality, bool relayState);
    void setDeviceId(String id);
    bool updateDeviceStatus(bool online);
};

FirebaseClient::FirebaseClient() {
    projectId = FIREBASE_PROJECT_ID;
    apiKey = FIREBASE_API_KEY;
    deviceId = DEVICE_ID;
    firestoreUrl = "https://firestore.googleapis.com/v1/projects/" + String(projectId) + "/databases/(default)/documents/readings";
    realtimeDbUrl = "https://" + String(projectId) + "-default-rtdb.firebaseio.com/commands/" + deviceId + ".json";
    isInitialized = false;
}

bool FirebaseClient::init() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected for Firebase initialization");
        return false;
    }

    // Test Firebase connection
    String testUrl = "https://firestore.googleapis.com/v1/projects/" + String(projectId);
    http.begin(testUrl);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.GET();
    http.end();

    if (httpCode == HTTP_CODE_OK) {
        isInitialized = true;
        Serial.println("Firebase initialized successfully");
        return true;
    } else {
        Serial.printf("Firebase initialization failed with HTTP code: %d\n", httpCode);
        return false;
    }
}

String FirebaseClient::getCurrentTimestamp() {
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

bool FirebaseClient::sendSensorData(String jsonData) {
    if (!isInitialized) {
        Serial.println("Firebase not initialized");
        return false;
    }

    String url = firestoreUrl + "?key=" + apiKey;
    return sendHttpRequest(url, "POST", jsonData);
}

String FirebaseClient::getCommands() {
    if (!isInitialized) {
        return "";
    }

    return getHttpRequest(realtimeDbUrl);
}

String FirebaseClient::createSensorData(float ppm, String quality, bool relayState) {
    DynamicJsonDocument doc(1024);

    // Create the document structure for Firestore
    JsonObject fields = doc.createNestedObject("fields");

    // Device ID
    JsonObject deviceValue = fields.createNestedObject("device_id");
    deviceValue["stringValue"] = deviceId;

    // PPM value
    JsonObject ppmValue = fields.createNestedObject("ppm");
    ppmValue["doubleValue"] = ppm;

    // Quality
    JsonObject qualityValue = fields.createNestedObject("quality");
    qualityValue["stringValue"] = quality;

    // Relay state
    JsonObject relayValue = fields.createNestedObject("relay_state");
    relayValue["stringValue"] = relayState ? "ON" : "OFF";

    // Timestamp
    JsonObject timestampValue = fields.createNestedObject("timestamp");
    timestampValue["timestampValue"] = getCurrentTimestamp();

    String output;
    serializeJson(doc, output);
    return output;
}

bool FirebaseClient::sendHttpRequest(String url, String method, String payload) {
    HTTPClient http;
    WiFiClientSecure *client = new WiFiClientSecure;
    if(client == NULL){
        Serial.println("Unable to create WiFiClientSecure");
        return false;
    }

    client->setInsecure(); // Skip certificate verification for simplicity
    http.begin(*client, url);
    http.addHeader("Content-Type", "application/json");

    int httpCode = 0;
    if (method == "POST") {
        httpCode = http.POST(payload);
    } else if (method == "PUT") {
        httpCode = http.PUT(payload);
    } else if (method == "GET") {
        httpCode = http.GET();
    }

    String response = http.getString();

    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
        Serial.printf("HTTP %s successful: %s\n", method.c_str(), response.c_str());
        http.end();
        delete client;
        return true;
    } else {
        Serial.printf("HTTP %s failed with code %d: %s\n", method.c_str(), httpCode, response.c_str());
        http.end();
        delete client;
        return false;
    }
}

String FirebaseClient::getHttpRequest(String url) {
    HTTPClient http;
    WiFiClientSecure *client = new WiFiClientSecure;
    if(client == NULL){
        Serial.println("Unable to create WiFiClientSecure");
        return "";
    }

    client->setInsecure(); // Skip certificate verification for simplicity
    http.begin(*client, url);
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.GET();
    String response = http.getString();

    http.end();
    delete client;

    if (httpCode == HTTP_CODE_OK) {
        return response;
    } else {
        Serial.printf("HTTP GET failed with code %d: %s\n", httpCode, response.c_str());
        return "";
    }
}

void FirebaseClient::setDeviceId(String id) {
    deviceId = id;
    realtimeDbUrl = "https://" + String(projectId) + "-default-rtdb.firebaseio.com/commands/" + deviceId + ".json";
}

bool FirebaseClient::updateDeviceStatus(bool online) {
    if (!isInitialized) {
        return false;
    }

    String statusUrl = "https://" + String(projectId) + "-default-rtdb.firebaseio.com/devices/" + deviceId + "/status.json";
    String payload = online ? "\"online\"" : "\"offline\"";

    return sendHttpRequest(statusUrl, "PUT", payload);
}

// Global objects
WiFiManager wifiManager;
FirebaseClient firebaseClient;
MQ135Sensor sensor;
OLEDDisplay display;
RelayController relay;

// Global variables
unsigned long lastSensorRead = 0;
unsigned long lastFirebaseUpdate = 0;
unsigned long lastCommandCheck = 0;
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

    // Initialize Firebase
    if (!firebaseClient.init()) {
        Serial.println("Firebase initialization failed!");
        display.showMessage("Firebase Error");
    }

    display.showMessage("System Ready");
    delay(2000);
}

void loop() {
    unsigned long currentMillis = millis();

    // Read sensor data at sampling interval
    if (currentMillis - lastSensorRead >= samplingInterval * 1000) {
        lastSensorRead = currentMillis;

        currentPPM = sensor.readPPM();
        currentQuality = sensor.getAirQuality(currentPPM);

        Serial.printf("PPM: %.2f, Quality: %s\n", currentPPM, currentQuality.c_str());

        // Update display
        if (customMessage.length() > 0) {
            display.showCustomMessage(customMessage);
        } else {
            display.showAirQuality(currentPPM, currentQuality, relayState);
        }
    }

    // Send data to Firebase every 30 seconds
    if (currentMillis - lastFirebaseUpdate >= 30000) {
        lastFirebaseUpdate = currentMillis;

        String jsonData = firebaseClient.createSensorData(currentPPM, currentQuality, relayState);
        if (firebaseClient.sendSensorData(jsonData)) {
            Serial.println("Data sent to Firebase successfully");
        } else {
            Serial.println("Failed to send data to Firebase");
        }
    }

    // Check for Firebase commands every 10 seconds
    if (currentMillis - lastCommandCheck >= 10000) {
        lastCommandCheck = currentMillis;

        String commands = firebaseClient.getCommands();
        if (commands.length() > 0) {
            processCommands(commands);
        }
    }

    delay(100);
}

void processCommands(String commandsJson) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, commandsJson);

    if (error) {
        Serial.println("Failed to parse commands JSON");
        return;
    }

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
        Serial.printf("OLED message: %s\n", customMessage.c_str());

        // Clear custom message after 10 seconds
        if (customMessage == "CLEAR") {
            customMessage = "";
        }
    }
}
