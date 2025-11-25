#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include <Arduino.h>

class OLEDDisplay {
private:
    Adafruit_SSD1306 display;
    int screenWidth;
    int screenHeight;
    int sdaPin;
    int sclPin;
    bool isInitialized;

public:
    OLEDDisplay();
    bool init();
    void clear();
    void showWelcome();
    void showAirQuality(float ppm, String quality, bool relayState);
    void showMessage(String message);
    void showCustomMessage(String message);
    void showWiFiStatus(String ip);
    void showSensorData(float ppm, float voltage, float resistance);
    void showSystemInfo(String status);
    void update();
};

#endif