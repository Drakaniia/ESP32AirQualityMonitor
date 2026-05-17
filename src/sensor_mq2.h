#ifndef SENSOR_MQ2_H
#define SENSOR_MQ2_H

#include <Arduino.h>

class MQ2Sensor {
private:
    int sensorPin;
    float r0;
    float rl;
    float ppm;
    float voltage;
    float rs;
    float ratio;

    static constexpr int SMOOTHING_SAMPLES = 10;
    float readings[SMOOTHING_SAMPLES];
    int readIndex;
    float total;
    bool initialized;

    float calculateResistance() const;
    float calculateRatio() const;
    float calculatePPM() const;
    float applySmoothing(float currentPPM);
    void calibrate();

public:
    MQ2Sensor();
    void init();
    float readPPM();
    const String getAirQuality(float ppm) const;
    float getVoltage() const { return voltage; }
    float getResistance() const { return rs; }
    bool isCalibrated() const { return r0 > 0.0F; }
};

#endif
