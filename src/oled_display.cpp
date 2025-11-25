#include "oled_display.h"
#include "config.h"
#include <Arduino.h>

OLEDDisplay::OLEDDisplay() : display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1) {
    screenWidth = SCREEN_WIDTH;
    screenHeight = SCREEN_HEIGHT;
    sdaPin = OLED_SDA;
    sclPin = OLED_SCL;
    isInitialized = false;
}

bool OLEDDisplay::init() {
    Wire.begin(sdaPin, sclPin);
    
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println("SSD1306 allocation failed");
        return false;
    }
    
    isInitialized = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    
    Serial.println("OLED display initialized successfully");
    return true;
}

void OLEDDisplay::clear() {
    if (!isInitialized) return;
    
    display.clearDisplay();
    display.setCursor(0, 0);
}

void OLEDDisplay::showWelcome() {
    if (!isInitialized) return;
    
    clear();
    
    display.setTextSize(2);
    display.setCursor(20, 10);
    display.println("ESP32");
    display.setCursor(15, 35);
    display.println("AQ Monitor");
    
    display.setTextSize(1);
    display.setCursor(30, 55);
    display.println("Starting...");
    
    display.display();
}

void OLEDDisplay::showAirQuality(float ppm, String quality, bool relayState) {
    if (!isInitialized) return;
    
    clear();
    
    // Title
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("Air Quality Monitor");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    // PPM Value
    display.setTextSize(2);
    display.setCursor(10, 18);
    display.print(ppm, 1);
    display.setTextSize(1);
    display.println(" PPM");
    
    // Quality Status
    display.setTextSize(1);
    display.setCursor(10, 40);
    display.print("Quality: ");
    
    // Color coding based on quality
    if (quality == "Excellent" || quality == "Good") {
        display.println(quality);
    } else if (quality == "Moderate") {
        display.println(quality);
    } else {
        display.println(quality);
    }
    
    // Relay Status
    display.setCursor(10, 52);
    display.print("Relay: ");
    display.println(relayState ? "ON" : "OFF");
    
    // Status indicator
    display.drawCircle(120, 8, 3, SSD1306_WHITE);
    if (relayState) {
        display.fillCircle(120, 8, 2, SSD1306_WHITE);
    }
    
    display.display();
}

void OLEDDisplay::showMessage(String message) {
    if (!isInitialized) return;
    
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    
    // Word wrap for long messages
    int line = 0;
    int col = 0;
    for (int i = 0; i < message.length(); i++) {
        if (col > 20 || message.charAt(i) == '\n') {
            line++;
            col = 0;
            if (line > 7) break; // Max lines for 128x64 display
        }
        
        if (message.charAt(i) != '\n') {
            display.setCursor(col * 6, line * 8);
            display.print(message.charAt(i));
            col++;
        }
    }
    
    display.display();
}

void OLEDDisplay::showCustomMessage(String message) {
    showMessage(message);
}

void OLEDDisplay::showWiFiStatus(String ip) {
    if (!isInitialized) return;
    
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("WiFi Status");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    display.setCursor(0, 20);
    display.println("Connected!");
    
    display.setCursor(0, 30);
    display.print("IP: ");
    display.println(ip);
    
    display.setCursor(0, 45);
    display.println("System Ready");
    
    display.display();
}

void OLEDDisplay::showSensorData(float ppm, float voltage, float resistance) {
    if (!isInitialized) return;
    
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("Sensor Data");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    display.setCursor(0, 18);
    display.print("PPM: ");
    display.println(ppm, 1);
    
    display.setCursor(0, 28);
    display.print("Voltage: ");
    display.print(voltage, 2);
    display.println("V");
    
    display.setCursor(0, 38);
    display.print("RS: ");
    display.print(resistance, 1);
    display.println("kΩ");
    
    display.setCursor(0, 48);
    display.println("System Running");
    
    display.display();
}

void OLEDDisplay::showSystemInfo(String status) {
    if (!isInitialized) return;
    
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("System Info");
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    display.setCursor(0, 20);
    display.print("Status: ");
    display.println(status);
    
    display.setCursor(0, 30);
    display.print("Free Heap: ");
    display.print(ESP.getFreeHeap() / 1024);
    display.println("KB");
    
    display.setCursor(0, 40);
    display.print("Uptime: ");
    display.print(millis() / 1000);
    display.println("s");
    
    display.setCursor(0, 50);
    display.println("ESP32 AQ Monitor");
    
    display.display();
}

void OLEDDisplay::update() {
    if (!isInitialized) return;
    display.display();
}