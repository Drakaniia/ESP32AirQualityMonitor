#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include "config.h"
#include "wifi_manager.h"
#include "firebase_client.h"
#include "sensor_mq135.h"
#include "oled_display.h"
#include "relay_controller.h"

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