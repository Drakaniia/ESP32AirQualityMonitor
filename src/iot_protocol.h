#ifndef IOT_PROTOCOL_H
#define IOT_PROTOCOL_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <WebSocketsClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

enum class ProtocolType : uint8_t { MQTT, WEBSOCKET, HTTP };

class IoTProtocol {
private:
    WiFiClient espClient;
    PubSubClient mqttClient;
    WebSocketsClient webSocket;
    HTTPClient httpClient;
    
    ProtocolType protocolType;
    bool isConnected;
    String lastReceivedCommand;
    
    static void mqttCallback(char* topic, byte* payload, unsigned int length);
    void webSocketEvent(WStype_t type, uint8_t* payload, size_t length);

public:
    IoTProtocol();
    bool init(ProtocolType protocol, const String& server = "");
    bool connect();
    bool publishSensorData(float ppm, const String& quality, bool relayState, 
                          float temperature, float humidity);
    bool updateDeviceStatus(bool online);
    String receiveCommand();
    bool isConnectedToServer() const;
    void loop();
};

#endif
