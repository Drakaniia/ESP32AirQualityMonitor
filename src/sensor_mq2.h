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
    
    // Smoothing variables
    float readings[10]; // Array to store last 10 readings
    int readIndex;      // Current index in array
    float total;        // Running total
    bool initialized;   // Whether smoothing array is initialized

    float calculateResistance();
    float calculateRatio();
    float calculatePPM();
    float getSmoothedPPM();
    void calibrate();

public:
    MQ2Sensor();
    void init();
    float readPPM();
    String getAirQuality(float ppm);
    float getVoltage();
    float getResistance();
    bool isCalibrated();
    float getSmoothedPPM(float currentPPM);
};

#endif