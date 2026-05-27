#include "oled_display.h"
#include <Arduino.h>

// Import config values
extern const int SCREEN_WIDTH;
extern const int SCREEN_HEIGHT;
extern const int OLED_SDA;
extern const int OLED_SCL;
extern const uint8_t OLED_ADDRESS;

OLEDDisplay::OLEDDisplay() 
    : display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1)
    , isInitialized(false) {}

bool OLEDDisplay::init() {
    Wire.begin(OLED_SDA, OLED_SCL);
    
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        return false;
    }
    
    isInitialized = true;
    clear();
    Serial.println(F("OLED initialized"));
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
    display.println(F("ESP32"));
    display.setCursor(15, 35);
    display.println(F("AQ Monitor"));
    
    display.setTextSize(1);
    display.setCursor(30, 55);
    display.println(F("Starting..."));
    
    display.display();
}

void OLEDDisplay::showAirQuality(float ppm, const String& quality, bool relayState) {
    if (!isInitialized) return;
    clear();
    
    // Title
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("Air Quality"));
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    // PPM
    display.setTextSize(2);
    display.setCursor(10, 18);
    display.print(ppm, 1);
    display.setTextSize(1);
    display.println(F(" PPM"));
    
    // Quality
    display.setCursor(10, 40);
    display.print(F("Q: "));
    display.println(quality);
    
    // Relay
    display.setCursor(10, 52);
    display.print(F("Relay: "));
    display.println(relayState ? F("ON") : F("OFF"));
    
    // Status indicator
    display.drawCircle(120, 8, 3, SSD1306_WHITE);
    if (relayState) display.fillCircle(120, 8, 2, SSD1306_WHITE);
    
    display.display();
}

void OLEDDisplay::showMessage(const String& message) {
    if (!isInitialized) return;
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    
    int line = 0, col = 0;
    for (size_t i = 0; i < message.length() && line < 8; ++i) {
        char c = message.charAt(i);
        if (c == '\n' || col > 20) {
            line++;
            col = 0;
            if (c == '\n') continue;
        }
        display.setCursor(col * 6, line * 8);
        display.print(c);
        col++;
    }
    
    display.display();
}

void OLEDDisplay::showWiFiStatus(const String& ip) {
    if (!isInitialized) return;
    clear();
    
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println(F("WiFi Status"));
    display.drawLine(0, 12, 127, 12, SSD1306_WHITE);
    
    display.setCursor(0, 20);
    display.println(F("Connected!"));
    
    display.setCursor(0, 30);
    display.print(F("IP: "));
    display.println(ip);
    
    display.setCursor(0, 45);
    display.println(F("System Ready"));
    
    display.display();
}

void OLEDDisplay::update() {
    if (isInitialized) display.display();
}
