#ifndef FIREBASE_CLIENT_H
#define FIREBASE_CLIENT_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include "config.h"

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

#endif