#ifndef CONFIG_H
#define CONFIG_H

#include <cstdint>

// ============================================================================
// Device Identity
// ============================================================================
constexpr const char* DEVICE_ID = "esp32_01";

// ============================================================================
// WiFi Configuration
// ============================================================================
constexpr const char* WIFI_SSID = "Hotspot1";
constexpr const char* WIFI_PASSWORD = "12345678";
constexpr uint32_t WIFI_CONNECTION_TIMEOUT_MS = 20000;

// ============================================================================
// Hardware Pin Configuration (ESP32)
// ============================================================================
constexpr int MQ2_PIN = 34;       // Analog pin for MQ-2 sensor (ADC1_CH6)
constexpr int RELAY_PIN = 26;     // Digital pin for relay module
constexpr int LED_PIN = 25;       // Digital pin for status LED
constexpr int BUZZER_PIN = 27;    // Digital pin for buzzer
constexpr int OLED_SDA = 21;      // I2C SDA pin
constexpr int OLED_SCL = 22;      // I2C SCL pin
constexpr int DHT_PIN = 14;       // Digital pin for DHT sensor
constexpr int LED_BUILTIN = 2;    // Built-in LED pin

// ============================================================================
// OLED Display Configuration
// ============================================================================
constexpr int SCREEN_WIDTH = 128;
constexpr int SCREEN_HEIGHT = 64;
constexpr uint8_t OLED_ADDRESS = 0x3C;

// ============================================================================
// MQ-2 Sensor Configuration
// ============================================================================
constexpr float MQ2_R0_DEFAULT = 0.0F;
constexpr float MQ2_LOAD_RESISTANCE_KOHM = 10.0F;
constexpr float MQ2_VCC = 3.3F;
constexpr int MQ2_ADC_RESOLUTION = 4095;
constexpr float MQ2_BASELINE_PPM = 15.0F;

// ============================================================================
// DHT Sensor Configuration
// ============================================================================
#define DHT_TYPE DHT11

constexpr float DHT_TEMP_OFFSET_C = -2.0F;
constexpr float DHT_HUMID_OFFSET_PCT = 5.0F;
constexpr int DHT_READING_SAMPLES = 5;
constexpr int DHT_READING_DELAY_MS = 2000;

constexpr float DHT_TEMP_MIN_C = -40.0F;
constexpr float DHT_TEMP_MAX_C = 80.0F;
constexpr float DHT_HUMID_MIN_PCT = 0.0F;
constexpr float DHT_HUMID_MAX_PCT = 100.0F;
constexpr float DHT_TEMP_CLAMP_MIN_C = -20.0F;
constexpr float DHT_TEMP_CLAMP_MAX_C = 50.0F;
constexpr float DHT_HUMID_CLAMP_MIN_PCT = 10.0F;
constexpr float DHT_HUMID_CLAMP_MAX_PCT = 95.0F;

// ============================================================================
// Timing Configuration (milliseconds)
// ============================================================================
constexpr uint32_t SENSOR_READ_INTERVAL_MS = 2000;
constexpr uint32_t MQTT_UPDATE_INTERVAL_MS = 30000;
constexpr uint32_t COMMAND_CHECK_INTERVAL_MS = 2000;
constexpr uint32_t MQTT_RECONNECT_INTERVAL_MS = 5000;
constexpr uint32_t CUSTOM_MESSAGE_TIMEOUT_MS = 10000;
constexpr uint32_t RELAY_DEBOUNCE_MS = 100;

// ============================================================================
// System Configuration
// ============================================================================
constexpr bool DEBUG_ENABLED = true;

// ============================================================================
// Communication Protocol Selection
// ============================================================================
enum class CommProtocol : uint8_t {
    MQTT = 1,
    WEBSOCKET = 2,
    HTTP = 3
};
constexpr CommProtocol COMM_PROTOCOL = CommProtocol::MQTT;

// ============================================================================
// MQTT Configuration
// ============================================================================
constexpr const char* MQTT_SERVER = "broker.hivemq.com";
constexpr uint16_t MQTT_PORT = 1883;
constexpr const char* MQTT_DEVICE_TOPIC = "airquality/esp32_01/sensor";
constexpr const char* MQTT_STATUS_TOPIC = "airquality/esp32_01/status";
constexpr const char* MQTT_COMMAND_TOPIC = "airquality/esp32_01/command";

// ============================================================================
// WebSocket Configuration
// ============================================================================
constexpr const char* WS_SERVER_URL = "ws://your-websocket-server.com";
constexpr uint16_t WS_PORT = 8080;

// ============================================================================
// HTTP Configuration
// ============================================================================
constexpr const char* HTTP_SERVER_URL = "http://your-http-server.com";
constexpr uint32_t HTTP_UPDATE_INTERVAL_MS = 30000;

// ============================================================================
// Air Quality Thresholds (PPM - MQ-2 combustible gas)
// ============================================================================
constexpr float AQ_THRESHOLD_EXCELLENT = 25.0F;
constexpr float AQ_THRESHOLD_GOOD = 50.0F;
constexpr float AQ_THRESHOLD_MODERATE = 200.0F;
constexpr float AQ_THRESHOLD_POOR = 500.0F;
constexpr float AQ_THRESHOLD_VERY_POOR = 1000.0F;
constexpr float AQ_THRESHOLD_HAZARDOUS = 5000.0F;
constexpr float AQ_ALERT_THRESHOLD = 1000.0F;

// ============================================================================
// Alert Controller Configuration
// ============================================================================
constexpr uint32_t ALERT_BLINK_INTERVAL_MS = 500;
constexpr uint32_t ALERT_BEEP_INTERVAL_MS = 1000;

#endif // CONFIG_H
