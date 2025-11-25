#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Configuration
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
#define DEVICE_ID "esp32_01"

// Hardware Pin Configuration
#define MQ135_PIN 34          // Analog pin for MQ-135 sensor
#define RELAY_PIN 26          // Digital pin for relay module
#define OLED_SDA 21           // I2C SDA pin for OLED
#define OLED_SCL 22           // I2C SCL pin for OLED

// OLED Display Configuration
#define SCREEN_WIDTH 128      // OLED display width, in pixels
#define SCREEN_HEIGHT 64      // OLED display height, in pixels
#define OLED_ADDRESS 0x3C     // I2C address for SSD1306

// MQ-135 Sensor Configuration
#define MQ135_R0 76.63        // Clean air resistance value (will be calibrated)

// Timing Configuration
#define SENSOR_READ_INTERVAL 5000     // Sensor reading interval (ms)
#define FIREBASE_UPDATE_INTERVAL 30000 // Firebase update interval (ms)
#define COMMAND_CHECK_INTERVAL 10000   // Command check interval (ms)

// System Configuration
#define DEBUG true            // Enable debug output
#define LED_BUILTIN 2         // Built-in LED pin

// Air Quality Thresholds (PPM)
#define AQ_THRESHOLD_EXCELLENT 50
#define AQ_THRESHOLD_GOOD 100
#define AQ_THRESHOLD_MODERATE 200
#define AQ_THRESHOLD_POOR 400
#define AQ_THRESHOLD_VERY_POOR 800

#endif