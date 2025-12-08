#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "Hotspot1"
#define WIFI_PASSWORD "12345678"

#define DEVICE_ID "esp32_01"

// Hardware Pin Configuration
#define MQ2_PIN 34            // Analog pin for MQ-2 sensor
#define RELAY_PIN 26          // Digital pin for relay module (for controlling external devices - independent of LED/buzzer)
#define LED_PIN 25            // Digital pin for LED
#define BUZZER_PIN 27         // Digital pin for buzzer
#define OLED_SDA 21           // I2C SDA pin for OLED
#define OLED_SCL 22           // I2C SCL pin for OLED

// OLED Display Configuration
#define SCREEN_WIDTH 128      // OLED display width, in pixels
#define SCREEN_HEIGHT 64      // OLED display height, in pixels
#define OLED_ADDRESS 0x3C     // I2C address for SSD1306

// MQ-2 Sensor Configuration
#define MQ2_R0 0.0            // Initial R0 value for MQ-2 sensor (will be calibrated during initialization)

// Timing Configuration
#define SENSOR_READ_INTERVAL 5000     // Sensor reading interval (ms)
#define MQTT_UPDATE_INTERVAL 30000    // MQTT update interval (ms)
#define COMMAND_CHECK_INTERVAL 2000    // Command check interval (ms) - reduced for faster response

// System Configuration
#define DEBUG true            // Enable debug output
#define LED_BUILTIN 2         // Built-in LED pin

// Communication Protocol Configuration
#define COMM_PROTOCOL_MQTT 1
#define COMM_PROTOCOL_WEBSOCKET 2
#define COMM_PROTOCOL_HTTP 3
#define COMM_PROTOCOL COMM_PROTOCOL_MQTT    // Default communication protocol

// MQTT Configuration
#define MQTT_SERVER "broker.hivemq.com"  // Public MQTT broker
#define MQTT_PORT 1883
#define MQTT_DEVICE_TOPIC "airquality/esp32_01/sensor"
#define MQTT_STATUS_TOPIC "airquality/esp32_01/status"
#define MQTT_COMMAND_TOPIC "airquality/esp32_01/command"

// WebSocket Configuration
#define WS_PORT 8080

// Air Quality Thresholds (PPM for MQ-2 combustible gas detection)
#define AQ_THRESHOLD_EXCELLENT 50     // Background levels
#define AQ_THRESHOLD_GOOD 200          // Normal indoor air
#define AQ_THRESHOLD_MODERATE 500     // After cooking/light activity
#define AQ_THRESHOLD_POOR 1000        // Elevated levels - investigate
#define AQ_THRESHOLD_VERY_POOR 2000    // High levels - potential concern
#define AQ_THRESHOLD_HAZARDOUS 5000    // Dangerous levels - immediate action

#endif