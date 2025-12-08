#ifndef SENSOR_MQ2_H
#define SENSOR_MQ2_H

#include <Arduino.h>
#include "config.h"

class MQ2Sensor {
private:
    int sensorPin;
    float r0;          // Clean air resistance
    float rl;          // Load resistance (typically 10kΩ)
    float ppm;         // Current PPM reading
    float voltage;     // Current voltage reading
    float rs;          // Sensor resistance
    float ratio;       // RS/R0 ratio

    float calculateResistance();
    float calculateRatio();
    float calculatePPM();
    void calibrate();

public:
    MQ2Sensor();
    void init();
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    bool isCalibrated();
};

#endif