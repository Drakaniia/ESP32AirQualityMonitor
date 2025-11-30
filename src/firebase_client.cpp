#include "firebase_client.h"
#include <Arduino.h>
#include <WiFiClientSecure.h>

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
    // Test Firebase connection
    String testUrl = "https://firestore.googleapis.com/v1/projects/" + String(projectId) + "/databases/(default)";
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
    WiFiClientSecure* client = new WiFiClientSecure();
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
    WiFiClientSecure* client = new WiFiClientSecure();
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