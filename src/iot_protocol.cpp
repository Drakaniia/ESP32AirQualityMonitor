#include "iot_protocol.h"

WiFiClient espClient;
IoTProtocol* g_iotProtocol = nullptr;

// Static callback for MQTT
void IoTProtocol::mqttCallback(char* topic, byte* payload, unsigned int length) {
    // This would handle incoming MQTT messages
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.printf("MQTT Message received on topic %s: %s\n", topic, message.c_str());
    
    // Store the command for receiveCommand() to retrieve
    // Note: This is a static method, so we need to get the instance
    // For simplicity, we'll use a global variable approach
    extern IoTProtocol* g_iotProtocol;
    if (g_iotProtocol) {
        g_iotProtocol->lastReceivedCommand = message;
    }
}

IoTProtocol::IoTProtocol() : mqttClient(espClient) {
    protocolType = COMM_PROTOCOL;
    isConnected = false;
    g_iotProtocol = this;
}

bool IoTProtocol::init(int protocol, String server) {
    protocolType = protocol;
    serverAddress = server;
    
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            // Configure MQTT client
            mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
            mqttClient.setCallback(mqttCallback);
            Serial.println("MQTT Protocol initialized");
            break;
            
        case COMM_PROTOCOL_WEBSOCKET:
            // Configure WebSocket client
            webSocket.begin(serverAddress, WS_PORT, "/");
            webSocket.onEvent([this](WStype_t type, uint8_t * payload, size_t length) {
                this->webSocketEvent(type, payload, length);
            });
            Serial.println("WebSocket Protocol initialized");
            break;
            
        case COMM_PROTOCOL_HTTP:
            Serial.println("HTTP Protocol initialized");
            break;
            
        default:
            Serial.println("Unknown protocol selected");
            return false;
    }
    
    return true;
}

void IoTProtocol::webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WSc] Disconnected!\n");
            isConnected = false;
            break;
        case WStype_CONNECTED:
            Serial.printf("[WSc] Connected to url: %s\n", payload);
            isConnected = true;
            break;
        case WStype_TEXT:
            Serial.printf("[WSc] Received text: %s\n", payload);
            // Handle received command
            break;
        case WStype_BIN:
            Serial.printf("[WSc] Got binary length: %u\n", length);
            break;
    }
}

bool IoTProtocol::connect() {
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (!mqttClient.connected()) {
                String clientId = "ESP32Client-" + String(random(0xffff), HEX);
                
                if (mqttClient.connect(clientId.c_str())) {
                    Serial.println("MQTT Connected");
                    // Subscribe to command topic
                    mqttClient.subscribe(MQTT_COMMAND_TOPIC);
                    isConnected = true;
                    return true;
                } else {
                    Serial.printf("MQTT connection failed, state: %d\n", mqttClient.state());
                    isConnected = false;
                    return false;
                }
            }
            return true;
            
        case COMM_PROTOCOL_WEBSOCKET:
            webSocket.loop();
            // WebSocket connection happens automatically after config
            if (!isConnected) {
                webSocket.begin(serverAddress, WS_PORT, "/");
            }
            return isConnected;
            
        case COMM_PROTOCOL_HTTP:
            // HTTP doesn't maintain a connection, so always "connected"
            isConnected = true;
            return true;
            
        default:
            return false;
    }
}

bool IoTProtocol::publishSensorData(float ppm, String quality, bool relayState) {
    // Create JSON payload
    DynamicJsonDocument doc(512);
    doc["device_id"] = "esp32_01";
    doc["ppm"] = ppm;
    doc["quality"] = quality;
    doc["relay_state"] = relayState ? "ON" : "OFF";
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                bool success = mqttClient.publish(MQTT_DEVICE_TOPIC, jsonString.c_str());
                Serial.printf("MQTT Publish result: %s\n", success ? "Success" : "Failed");
                return success;
            }
            break;
            
        case COMM_PROTOCOL_WEBSOCKET:
            if (isConnected) {
                bool success = webSocket.sendTXT(jsonString);
                Serial.printf("WebSocket Send result: %s\n", success ? "Success" : "Failed");
                return success;
            }
            break;
            
        case COMM_PROTOCOL_HTTP:
            {
                httpClient.begin("http://your-http-endpoint.com/api/sensor-data");
                httpClient.addHeader("Content-Type", "application/json");
                
                int httpResponseCode = httpClient.POST(jsonString);
                String response = httpClient.getString();
                
                Serial.printf("HTTP POST response code: %d, Response: %s\n", httpResponseCode, response.c_str());
                
                httpClient.end();
                
                return (httpResponseCode > 0 && httpResponseCode < 300);
            }
            break;
    }
    
    return false;
}

bool IoTProtocol::updateDeviceStatus(bool online) {
    DynamicJsonDocument doc(256);
    doc["device_id"] = "esp32_01";
    doc["status"] = online ? "online" : "offline";
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                return mqttClient.publish(MQTT_STATUS_TOPIC, jsonString.c_str());
            }
            break;
            
        case COMM_PROTOCOL_WEBSOCKET:
            if (isConnected) {
                return webSocket.sendTXT("status:" + jsonString);
            }
            break;
            
        case COMM_PROTOCOL_HTTP:
            {
                httpClient.begin("http://your-http-endpoint.com/api/device-status");
                httpClient.addHeader("Content-Type", "application/json");
                
                int httpResponseCode = httpClient.PUT(jsonString);
                httpClient.end();
                
                return (httpResponseCode > 0 && httpResponseCode < 300);
            }
            break;
    }
    
    return false;
}

bool IoTProtocol::sendCommand(String command) {
    // For ESP32, typically commands come IN rather than going OUT
    // This would be used if the ESP32 needs to send commands to other devices
    return false;
}

String IoTProtocol::receiveCommand() {
    String command = "";
    
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();  // Process MQTT messages
                // Return the stored command and clear it
                command = lastReceivedCommand;
                if (command.length() > 0) {
                    lastReceivedCommand = "";  // Clear after reading
                }
            }
            break;
            
        case COMM_PROTOCOL_WEBSOCKET:
            webSocket.loop();
            // Command handling is done in webSocketEvent
            break;
            
        case COMM_PROTOCOL_HTTP:
            {
                // HTTP is not ideal for receiving commands in real-time
                // Would need to poll for commands
                httpClient.begin("http://your-http-endpoint.com/api/device-commands/esp32_01");
                int httpResponseCode = httpClient.GET();
                
                if (httpResponseCode > 0) {
                    command = httpClient.getString();
                }
                
                httpClient.end();
            }
            break;
    }
    
    return command;
}

bool IoTProtocol::isConnectedToServer() {
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            return mqttClient.connected();
        case COMM_PROTOCOL_WEBSOCKET:
            return isConnected;
        case COMM_PROTOCOL_HTTP:
            // For HTTP, check WiFi connection
            return WiFi.status() == WL_CONNECTED;
        default:
            return false;
    }
}

void IoTProtocol::loop() {
    // Call this in your main loop for proper operation
    switch(protocolType) {
        case COMM_PROTOCOL_MQTT:
            if (mqttClient.connected()) {
                mqttClient.loop();
            } else {
                // Try to reconnect
                connect();
            }
            break;
            
        case COMM_PROTOCOL_WEBSOCKET:
            webSocket.loop();
            break;
    }
}