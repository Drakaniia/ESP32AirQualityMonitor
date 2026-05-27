#include <Arduino.h>
#include <WiFi.h>
#include "DHT.h"
#include "config.h"
#include "wifi_manager.h"
#include "iot_protocol.h"
#include "sensor_mq2.h"
#include "oled_display.h"
#include "relay_controller.h"
#include "alert_controller.h"

// Global objects
WiFiManager wifiManager;
IoTProtocol iotProtocol;
MQ2Sensor sensor;
OLEDDisplay display;
RelayController relay;
AlertController alert;
DHT dht(DHT_PIN, DHT_TYPE);

// State variables
struct SystemState {
    unsigned long lastSensorRead = 0;
    unsigned long lastMQTTUpdate = 0;
    unsigned long lastCommandCheck = 0;
    unsigned long customMessageTime = 0;
    float ppm = 0.0F;
    String quality;
    bool relayState = false;
    int samplingInterval = 5;
    String customMessage;
    float temperature = 0.0F;
    float humidity = 0.0F;
    bool dhtInitialized = false;
};

SystemState state;

// DHT calibration
struct DHTCalibration {
    float temp[DHT_READING_SAMPLES] = {0};
    float humidity[DHT_READING_SAMPLES] = {0};
    int index = 0;
};

DHTCalibration dhtCal;

void readCalibratedDHT() {
    float tempSum = 0.0F, humidSum = 0.0F;
    int valid = 0;
    
    for (int i = 0; i < DHT_READING_SAMPLES; ++i) {
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        
        if (!isnan(t) && !isnan(h) &&
            t >= DHT_TEMP_MIN_C && t <= DHT_TEMP_MAX_C &&
            h >= DHT_HUMID_MIN_PCT && h <= DHT_HUMID_MAX_PCT) {
            
            t = constrain(t + DHT_TEMP_OFFSET_C, DHT_TEMP_CLAMP_MIN_C, DHT_TEMP_CLAMP_MAX_C);
            h = constrain(h + DHT_HUMID_OFFSET_PCT, DHT_HUMID_CLAMP_MIN_PCT, DHT_HUMID_CLAMP_MAX_PCT);
            
            tempSum += t;
            humidSum += h;
            valid++;
            delay(DHT_READING_DELAY_MS / DHT_READING_SAMPLES);
        }
    }
    
    if (valid > 0) {
        state.temperature = tempSum / valid;
        state.humidity = humidSum / valid;
        Serial.printf_P(PSTR("DHT11: %.1f°C, %.1f%% (%d readings)\n"), 
                       state.temperature, state.humidity, valid);
    }
}

void processCommands(const String& json);

void setup() {
    Serial.begin(115200);
    Serial.println(F("\n=== ESP32 AQ Monitor Starting ==="));
    
    // Initialize components
    display.init();
    display.showWelcome();
    
    relay.init();
    alert.init(&relay);
    relay.turnOn();
    state.relayState = true;
    
    sensor.init();
    dht.begin();
    
    // Init DHT calibration array
    for (int i = 0; i < DHT_READING_SAMPLES; ++i) {
        dhtCal.temp[i] = 0.0F;
        dhtCal.humidity[i] = 0.0F;
    }
    state.dhtInitialized = true;
    Serial.println(F("DHT11 initialized"));
    
    // WiFi
    if (!wifiManager.connect()) {
        Serial.println(F("WiFi failed - offline mode"));
        display.showMessage(F("WiFi Failed"));
    }
    
    // IoT Protocol
    if (!iotProtocol.init(COMM_PROTOCOL)) {
        Serial.println(F("IoT init failed"));
        display.showMessage(F("IoT Error"));
    } else if (iotProtocol.connect()) {
        Serial.println(F("MQTT connected"));
        iotProtocol.updateDeviceStatus(true);
    } else {
        Serial.println(F("MQTT connect failed"));
    }
    
    display.showMessage(F("System Ready"));
    delay(2000);
}

void loop() {
    const unsigned long now = millis();
    
    // Sensor reading
    if (now - state.lastSensorRead >= static_cast<unsigned long>(state.samplingInterval) * 1000UL) {
        state.lastSensorRead = now;
        
        state.ppm = sensor.readPPM();
        state.quality = sensor.getAirQuality(state.ppm);
        
        if (state.dhtInitialized) readCalibratedDHT();
        
        Serial.printf_P(PSTR("PPM: %.1f, Quality: %s\n"), state.ppm, state.quality.c_str());
        
        alert.checkPPMLevel(state.ppm);
        alert.update();
        
        // Display update
        if (state.customMessage.length() > 0) {
            display.showCustomMessage(state.customMessage);
            if (now - state.customMessageTime > 10000UL) {
                state.customMessage = "";
            }
        } else {
            display.showAirQuality(state.ppm, state.quality, state.relayState);
        }
    }
    
    // MQTT publish
    if (now - state.lastMQTTUpdate >= MQTT_UPDATE_INTERVAL_MS) {
        state.lastMQTTUpdate = now;
        
        if (iotProtocol.publishSensorData(state.ppm, state.quality, state.relayState,
                                         state.temperature, state.humidity)) {
            Serial.println(F("MQTT publish OK"));
        } else {
            Serial.println(F("MQTT publish FAIL"));
        }
    }
    
    // Command check
    if (now - state.lastCommandCheck >= COMMAND_CHECK_INTERVAL_MS) {
        state.lastCommandCheck = now;
        
        String cmd = iotProtocol.receiveCommand();
        if (cmd.length() > 0) {
            Serial.println(F("=== COMMAND ==="));
            Serial.println(cmd);
            processCommands(cmd);
            Serial.println(F("=== END ==="));
        }
    }
    
    iotProtocol.loop();
    delay(100);
}

void processCommands(const String& jsonStr) {
    DynamicJsonDocument doc(1024);
    DeserializationError err = deserializeJson(doc, jsonStr);
    
    if (err) {
        Serial.println(F("JSON parse failed"));
        return;
    }
    
    // Buzzer override
    if (doc.containsKey("buzzer_override")) {
        bool override = doc["buzzer_override"];
        bool on = doc["buzzer_state"];
        if (!state.relayState) {
            relay.turnOn();
            state.relayState = true;
        }
        alert.setBuzzerManualOverride(override, on);
    }
    
    // LED override
    if (doc.containsKey("led_override")) {
        alert.setLedManualOverride(doc["led_override"], doc["led_state"]);
    }
    
    // Clear overrides
    if (doc["clear_override"]) {
        alert.clearManualOverride();
    }
    
    // Relay control
    if (doc.containsKey("relay_state")) {
        bool newState = (String(doc["relay_state"]) == "ON");
        if (newState != state.relayState) {
            state.relayState = newState;
            relay.setState(newState);
            display.showAirQuality(state.ppm, state.quality, state.relayState);
        }
    }
    
    // Sampling interval
    if (doc.containsKey("sampling_interval")) {
        int val = doc["sampling_interval"];
        if (val >= 1 && val <= 300) {
            state.samplingInterval = val;
            Serial.printf_P(PSTR("Interval: %ds\n"), val);
        }
    }
    
    // OLED message
    if (doc.containsKey("oled_message")) {
        state.customMessage = doc["oled_message"];
        state.customMessageTime = millis();
        if (state.customMessage == "CLEAR") state.customMessage = "";
    }
    
    // Direct tests
    if (doc["test_buzzer"]) {
        if (!state.relayState) { relay.turnOn(); state.relayState = true; }
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(LED_PIN, HIGH);
        Serial.println(F("Direct test: ON"));
    }
    
    if (doc["test_led"]) {
        digitalWrite(LED_PIN, doc["test_led"] ? HIGH : LOW);
    }
    
    if (doc["check_pins"]) {
        Serial.printf_P(PSTR("LED:%d=%d BUZ:%d=%d REL:%d\n"),
                       LED_PIN, digitalRead(LED_PIN),
                       BUZZER_PIN, digitalRead(BUZZER_PIN),
                       RELAY_PIN, digitalRead(RELAY_PIN));
    }
}
