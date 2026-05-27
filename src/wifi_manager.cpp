#include "wifi_manager.h"
#include <Arduino.h>

// Import config values
extern const char* WIFI_SSID;
extern const char* WIFI_PASSWORD;
extern const uint32_t WIFI_CONNECTION_TIMEOUT_MS;

WiFiManager::WiFiManager() 
    : ssid(WIFI_SSID)
    , password(WIFI_PASSWORD)
    , connectionTimeout(WIFI_CONNECTION_TIMEOUT_MS)
    , isConnected(false) {}

bool WiFiManager::connect() {
    Serial.println(F("Connecting to WiFi..."));
    
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(100);
    
    WiFi.begin(ssid, password);
    
    const uint32_t startTime = millis();
    while (WiFi.status() != WL_CONNECTED && 
           (millis() - startTime) < connectionTimeout) {
        delay(500);
        Serial.print('.');
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        isConnected = true;
        Serial.println(F("\nWiFi connected!"));
        Serial.printf_P(PSTR("IP: %s\n"), WiFi.localIP().toString().c_str());
        return true;
    }
    
    isConnected = false;
    Serial.println(F("\nWiFi failed!"));
    return false;
}

bool WiFiManager::reconnect() {
    if (WiFi.status() == WL_CONNECTED) return true;
    disconnect();
    return connect();
}

bool WiFiManager::checkConnection() const {
    return WiFi.status() == WL_CONNECTED;
}

String WiFiManager::getLocalIP() const {
    return isConnected ? WiFi.localIP().toString() : F("0.0.0.0");
}

int WiFiManager::getSignalStrength() const {
    return isConnected ? WiFi.RSSI() : -100;
}

void WiFiManager::disconnect() {
    WiFi.disconnect();
    isConnected = false;
    Serial.println(F("WiFi disconnected"));
}
