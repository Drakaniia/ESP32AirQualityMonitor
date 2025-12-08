#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "Hotspot1"
#define WIFI_PASSWORD "12345678"

#define DEVICE_ID "esp32_01"

// Hardware Pin Configuration
#define MQ2_PIN 34            // Analog pin for MQ-2 sensor
#define RELAY_PIN 26          // Digital pin for relay module
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
#define COMMAND_CHECK_INTERVAL 10000   // Command check interval (ms)

// System Configuration
#define DEBUG true            // Enable debug output
#define LED_BUILTIN 2         // Built-in LED pin

// Air Quality Thresholds (PPM for MQ-2 combustible gas detection)
#define AQ_THRESHOLD_EXCELLENT 200    // Very low combustible gas levels
#define AQ_THRESHOLD_GOOD 500         // Low combustible gas levels
#define AQ_THRESHOLD_MODERATE 1000    // Moderate combustible gas levels
#define AQ_THRESHOLD_POOR 2000        // High combustible gas levels - safety concern
#define AQ_THRESHOLD_VERY_POOR 5000   // Very high combustible gas levels - immediate danger

#endif