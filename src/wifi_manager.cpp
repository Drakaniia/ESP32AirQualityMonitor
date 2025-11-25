#include "wifi_manager.h"
#include "config.h"
#include <Arduino.h>

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