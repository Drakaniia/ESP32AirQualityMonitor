#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include "config.h"
#include "wifi_manager.h"
#include "iot_protocol.h"
#include "sensor_mq2.h"
#include "oled_display.h"
#include "relay_controller.h"
#include "alert_controller.h"

// Global objects
WiFiManager wifiManager;
IoTProtocol iotProtocol;
MQ2Sensor sensor;
OLEDDisplay display;
RelayController relay;
AlertController alert;

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
    alert.init(&relay);
    
    // Initialize relay to ON state (normal operation - buzzer and LED powered)
    relay.turnOn();
    relayState = true;
    
    sensor.init();
    
    // Connect to WiFi
    if (!wifiManager.connect()) {
        Serial.println("WiFi connection failed! Continuing in offline mode...");
        display.showMessage("WiFi Failed");
        // ESP.restart(); // Don't restart, allow offline operation
    }
    
    // Initialize IoT Protocol (using MQTT for dashboard communication)
    if (!iotProtocol.init(COMM_PROTOCOL_MQTT)) {
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

void processCommands(String commandsJson);

void loop() {
    unsigned long currentMillis = millis();

    // Read sensor data at sampling interval
    if (currentMillis - lastSensorRead >= samplingInterval * 1000) {
        lastSensorRead = currentMillis;

        currentPPM = sensor.readPPM();
        currentQuality = sensor.getAirQuality(currentPPM);

        Serial.printf("PPM: %.2f, Quality: %s\n", currentPPM, currentQuality.c_str());
        
        // Check PPM level and control alerts
        alert.checkPPMLevel(currentPPM);
        
        // Update alert state (LED and buzzer)
        alert.update();

        // Update display
        if (customMessage.length() > 0) {
            display.showCustomMessage(customMessage);
            // Clear custom message after 10 seconds
            if (millis() - customMessageTime > 10000) {
                customMessage = "";
            }
        } else {
            display.showAirQuality(currentPPM, currentQuality, relayState);
        }
    }

    // Send sensor data to MQTT broker every 30 seconds
    if (currentMillis - lastMQTTUpdate >= MQTT_UPDATE_INTERVAL) {
        lastMQTTUpdate = currentMillis;

        if (iotProtocol.publishSensorData(currentPPM, currentQuality, relayState)) {
            Serial.println("Data sent to MQTT broker successfully");
        } else {
            Serial.println("Failed to send data to MQTT broker");
        }
    }

    // Check for commands from MQTT every 2 seconds
    if (currentMillis - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
        lastCommandCheck = currentMillis;

        String commands = iotProtocol.receiveCommand();
        if (commands.length() > 0) {
            Serial.printf("=== COMMAND RECEIVED ===\n");
            Serial.printf("Raw command: %s\n", commands.c_str());
            processCommands(commands);
            Serial.printf("=== COMMAND PROCESSED ===\n");
        } else {
            // Debug: Show we're checking for commands
            static unsigned long lastDebug = 0;
            if (currentMillis - lastDebug > 10000) { // Every 10 seconds
                Serial.println("Checking for commands... none received");
                lastDebug = currentMillis;
            }
        }
    }

    // Call loop for IoT protocol (needed for MQTT command handling)
    iotProtocol.loop();

    delay(100);
}

void processCommands(String commandsJson) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, commandsJson);

    if (error) {
        Serial.println("Failed to parse commands JSON");
        return;
    }

    // Process buzzer manual override command
    if (doc.containsKey("buzzer_override")) {
        bool override = doc["buzzer_override"];
        bool state = doc["buzzer_state"];
        Serial.printf("Processing buzzer command - Override: %s, State: %s\n", override ? "ON" : "OFF", state ? "ON" : "OFF");
        Serial.printf("Relay state: %s, Buzzer pin: %d\n", relayState ? "ON" : "OFF", BUZZER_PIN);
        
        // Ensure relay is ON to power buzzer
        if (!relayState) {
            Serial.println("Warning: Relay is OFF, turning ON to power buzzer");
            relay.turnOn();
            relayState = true;
        }
        
        alert.setBuzzerManualOverride(override, state);
        Serial.printf("Buzzer override set: %s, State: %s\n", override ? "ON" : "OFF", state ? "ON" : "OFF");
    }
    
    // Process LED override command (separate from buzzer)
    if (doc.containsKey("led_override")) {
        bool override = doc["led_override"];
        bool state = doc["led_state"];
        alert.setLedManualOverride(override, state);
        Serial.printf("LED override: %s, State: %s\n", override ? "ON" : "OFF", state ? "ON" : "OFF");
    }
    
    // Clear manual override when using normal toggle (no override flag)
    if (doc.containsKey("clear_override") && doc["clear_override"]) {
        alert.clearManualOverride();
    }

    // Process relay command (for backward compatibility)
    if (doc.containsKey("relay_state")) {
        String newRelayState = doc["relay_state"];
        bool newState = (newRelayState == "ON");
        if (newState != relayState) {
            relayState = newState;
            relay.setState(relayState);
            Serial.printf("Relay state changed to: %s\n", relayState ? "ON" : "OFF");
            
            // Update OLED display immediately to show relay state change
            display.showAirQuality(currentPPM, currentQuality, relayState);
            
            // Note: Relay should remain ON at all times to power LED/buzzer
            // Dashboard commands should control buzzer/LED directly, not the relay
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
        customMessageTime = millis();  // Record when message was set
        Serial.printf("OLED message: %s\n", customMessage.c_str());

        // Handle clear command
        if (customMessage == "CLEAR") {
            customMessage = "";
        }
    }
    
    // Process direct buzzer test command
    if (doc.containsKey("test_buzzer")) {
        bool testState = doc["test_buzzer"];
        Serial.printf("=== DIRECT BUZZER TEST ===\n");
        Serial.printf("Relay state: %s\n", relayState ? "ON" : "OFF");
        Serial.printf("Buzzer pin: %d\n", BUZZER_PIN);
        Serial.printf("Setting pin %d to %s\n", BUZZER_PIN, testState ? "HIGH" : "LOW");
        
        // Ensure relay is ON
        if (!relayState) {
            Serial.println("Turning relay ON for buzzer test");
            relay.turnOn();
            relayState = true;
        }
        
        // Direct pin control - bypass all alert controller logic
        digitalWrite(BUZZER_PIN, testState ? HIGH : LOW);
        Serial.printf("BUZZER PIN %d DIRECTLY SET TO %s\n", BUZZER_PIN, testState ? "HIGH" : "LOW");
        
        // Also test LED
        digitalWrite(LED_PIN, testState ? HIGH : LOW);
        Serial.printf("LED PIN %d DIRECTLY SET TO %s\n", LED_PIN, testState ? "HIGH" : "LOW");
        
        Serial.printf("=== END DIRECT TEST ===\n");
    }
    
    // Process LED test command
    if (doc.containsKey("test_led")) {
        bool testState = doc["test_led"];
        Serial.printf("=== DIRECT LED TEST ===\n");
        Serial.printf("LED pin: %d\n", LED_PIN);
        Serial.printf("Setting pin %d to %s\n", LED_PIN, testState ? "HIGH" : "LOW");
        
        // Direct pin control - bypass all alert controller logic
        digitalWrite(LED_PIN, testState ? HIGH : LOW);
        Serial.printf("LED PIN %d DIRECTLY SET TO %s\n", LED_PIN, testState ? "HIGH" : "LOW");
        
        Serial.printf("=== END LED TEST ===\n");
    }
    
    // Process pin status check command
    if (doc.containsKey("check_pins")) {
        Serial.printf("=== PIN STATUS CHECK ===\n");
        Serial.printf("LED Pin: %d, Mode: OUTPUT, State: %s\n", LED_PIN, digitalRead(LED_PIN) ? "HIGH" : "LOW");
        Serial.printf("Buzzer Pin: %d, Mode: OUTPUT, State: %s\n", BUZZER_PIN, digitalRead(BUZZER_PIN) ? "HIGH" : "LOW");
        Serial.printf("Relay Pin: %d, State: %s\n", RELAY_PIN, digitalRead(RELAY_PIN) ? "HIGH" : "LOW");
        Serial.printf("Relay State Variable: %s\n", relayState ? "ON" : "OFF");
        Serial.printf("=== END PIN CHECK ===\n");
    }
}