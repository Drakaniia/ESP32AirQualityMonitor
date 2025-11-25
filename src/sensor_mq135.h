#ifndef SENSOR_MQ135_H
#define SENSOR_MQ135_H

#include <Arduino.h>

class MQ135Sensor {
private:
    int sensorPin;
    float r0;          // Clean air resistance
    float rl;          // Load resistance
    float ppm;         // Current PPM reading
    float voltage;     // Current voltage reading
    float rs;          // Sensor resistance
    float ratio;       // RS/R0 ratio
    
    float calculateResistance();
    float calculateRatio();
    float calculatePPM();
    void calibrate();

public:
    MQ135Sensor();
    void init();
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    bool isCalibrated();
};

#endif