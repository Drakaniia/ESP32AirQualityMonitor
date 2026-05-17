#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Adafruit_SSD1306.h>
#include <Wire.h>

class OLEDDisplay {
private:
    Adafruit_SSD1306 display;
    bool isInitialized;

public:
    OLEDDisplay();
    bool init();
    void clear();
    void showWelcome();
    void showAirQuality(float ppm, const String& quality, bool relayState);
    void showMessage(const String& message);
    void showCustomMessage(const String& message) { showMessage(message); }
    void showWiFiStatus(const String& ip);
    void update();
};

#endif
