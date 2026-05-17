#include "iot_protocol.h"
#include <Arduino.h>

// Import config values
extern const char* MQTT_SERVER;
extern const uint16_t MQTT_PORT;
extern const char* MQTT_DEVICE_TOPIC;
extern const char* MQTT_STATUS_TOPIC;
extern const char* MQTT_COMMAND_TOPIC;
extern const uint32_t MQTT_RECONNECT_INTERVAL_MS;

static IoTProtocol* g_instance = nullptr;

void IoTProtocol::mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; ++i) msg += (char)payload[i];
    Serial.printf_P(PSTR("MQTT [%s]: %s\n"), topic, msg.c_str());
    if (g_instance) g_instance->lastReceivedCommand = msg;
}

IoTProtocol::IoTProtocol() 
    : mqttClient(espClient)
    , protocolType(ProtocolType::MQTT)
    , isConnected(false) {
    g_instance = this;
}

bool IoTProtocol::init(ProtocolType protocol, const String& server) {
    protocolType = protocol;
    
    switch (protocolType) {
        case ProtocolType::MQTT:
            mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
            mqttClient.setCallback(mqttCallback);
            Serial.println(F("MQTT initialized"));
            break;
        case ProtocolType::WEBSOCKET:
            webSocket.begin(server.c_str(), 8080, "/");
            webSocket.onEvent([this](WStype_t t, uint8_t* p, size_t l) {
                webSocketEvent(t, p, l);
            });
            Serial.println(F("WebSocket initialized"));
            break;
        case ProtocolType::HTTP:
            Serial.println(F("HTTP initialized"));
            break;
    }
    return true;
}

void IoTProtocol::webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            isConnected = false;
            Serial.println(F("[WS] Disconnected"));
            break;
        case WStype_CONNECTED:
            isConnected = true;
            Serial.printf_P(PSTR("[WS] Connected: %s\n"), payload);
            break;
        case WStype_TEXT:
            Serial.printf_P(PSTR("[WS] Received: %s\n"), payload);
            lastReceivedCommand = String((char*)payload);
            break;
        default:
            break;
    }
}

bool IoTProtocol::connect() {
    switch (protocolType) {
        case ProtocolType::MQTT:
            if (!mqttClient.connected()) {
                String clientId = "ESP32-" + String(random(0xffff), HEX);
                if (mqttClient.connect(clientId.c_str())) {
                    Serial.println(F("MQTT connected"));
                    mqttClient.subscribe(MQTT_COMMAND_TOPIC);
                    isConnected = true;
                    return true;
                }
                Serial.printf_P(PSTR("MQTT failed: %d\n"), mqttClient.state());
                isConnected = false;
                return false;
            }
            return true;
            
        case ProtocolType::WEBSOCKET:
            webSocket.loop();
            return isConnected;
            
        case ProtocolType::HTTP:
            isConnected = true;
            return true;
    }
    return false;
}

bool IoTProtocol::publishSensorData(float ppm, const String& quality, bool relayState,
                                    float temperature, float humidity) {
    DynamicJsonDocument doc(512);
    doc["device_id"] = "esp32_01";
    doc["ppm"] = ppm;
    doc["quality"] = quality;
    doc["relay_state"] = relayState ? "ON" : "OFF";
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["timestamp"] = millis();
    
    String json;
    serializeJson(doc, json);
    
    switch (protocolType) {
        case ProtocolType::MQTT:
            if (mqttClient.connected()) {
                bool ok = mqttClient.publish(MQTT_DEVICE_TOPIC, json.c_str());
                Serial.println(ok ? F("MQTT publish OK") : F("MQTT publish FAIL"));
                return ok;
            }
            break;
        case ProtocolType::WEBSOCKET:
            if (isConnected) return webSocket.sendTXT(json);
            break;
        case ProtocolType::HTTP:
            httpClient.begin("http://192.168.1.100:3000/api/sensor-data");
            httpClient.addHeader("Content-Type", "application/json");
            int code = httpClient.POST(json);
            httpClient.end();
            return code > 0 && code < 300;
    }
    return false;
}

bool IoTProtocol::updateDeviceStatus(bool online) {
    DynamicJsonDocument doc(256);
    doc["device_id"] = "esp32_01";
    doc["status"] = online ? "online" : "offline";
    doc["timestamp"] = millis();
    
    String json;
    serializeJson(doc, json);
    
    switch (protocolType) {
        case ProtocolType::MQTT:
            return mqttClient.connected() && 
                   mqttClient.publish(MQTT_STATUS_TOPIC, json.c_str());
        case ProtocolType::WEBSOCKET:
            return isConnected && webSocket.sendTXT("status:" + json);
        default:
            return false;
    }
}

String IoTProtocol::receiveCommand() {
    String cmd;
    switch (protocolType) {
        case ProtocolType::MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();
                cmd = std::move(lastReceivedCommand);
            }
            break;
        case ProtocolType::WEBSOCKET:
            webSocket.loop();
            break;
        default:
            break;
    }
    return cmd;
}

bool IoTProtocol::isConnectedToServer() const {
    switch (protocolType) {
        case ProtocolType::MQTT:
            return mqttClient.connected();
        case ProtocolType::WEBSOCKET:
            return isConnected;
        case ProtocolType::HTTP:
            return WiFi.status() == WL_CONNECTED;
    }
    return false;
}

void IoTProtocol::loop() {
    static uint32_t lastReconnect = 0;
    
    switch (protocolType) {
        case ProtocolType::MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();
            } else if (millis() - lastReconnect >= MQTT_RECONNECT_INTERVAL_MS) {
                lastReconnect = millis();
                connect();
            }
            break;
        case ProtocolType::WEBSOCKET:
            webSocket.loop();
            break;
        default:
            break;
    }
}
