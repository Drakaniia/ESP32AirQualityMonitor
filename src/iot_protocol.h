#ifndef IOT_PROTOCOL_H
#define IOT_PROTOCOL_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>  // For MQTT
#include <WebSocketsClient.h>  // For WebSocket
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// WebSocket Configuration
#define WS_SERVER_URL "ws://your-websocket-server.com"
#define WS_PORT 8080

// HTTP Configuration
#define HTTP_SERVER_URL "http://your-http-server.com"
#define HTTP_UPDATE_INTERVAL 30000  // 30 seconds

class IoTProtocol {
private:
    WiFiClient wifiClient;
    PubSubClient mqttClient;
    WebSocketsClient webSocket;
    HTTPClient httpClient;
    
    String serverAddress;
    int protocolType;
    bool isConnected;
    String lastReceivedCommand;
    
    // MQTT callbacks
    static void mqttCallback(char* topic, byte* payload, unsigned int length);
    
    // WebSocket callbacks
    void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);

public:
    IoTProtocol();
    bool init(int protocol, String server = "");
    bool connect();
    bool publishSensorData(float ppm, String quality, bool relayState);
    bool sendCommand(String command);
    String receiveCommand();
    bool updateDeviceStatus(bool online);
    bool isConnectedToServer();
    void loop();  // Call this in your main loop for MQTT and WebSocket
};

#endif