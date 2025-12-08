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

    // Check for commands from MQTT every 10 seconds
    if (currentMillis - lastCommandCheck >= COMMAND_CHECK_INTERVAL) {
        lastCommandCheck = currentMillis;

        String commands = iotProtocol.receiveCommand();
        if (commands.length() > 0) {
            processCommands(commands);
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
        customMessageTime = millis();  // Record when message was set
        Serial.printf("OLED message: %s\n", customMessage.c_str());

        // Handle clear command
        if (customMessage == "CLEAR") {
            customMessage = "";
        }
    }
}