#include "sensor_mq2.h"
#include <Arduino.h>
#include <math.h>

// Import config values
extern const float MQ2_LOAD_RESISTANCE_KOHM;
extern const float MQ2_VCC;
extern const int MQ2_ADC_RESOLUTION;
extern const float MQ2_BASELINE_PPM;
extern const int MQ2_PIN;

MQ2Sensor::MQ2Sensor() 
    : sensorPin(MQ2_PIN)
    , r0(0.0F)
    , rl(MQ2_LOAD_RESISTANCE_KOHM)
    , ppm(0.0F)
    , voltage(0.0F)
    , rs(0.0F)
    , ratio(0.0F)
    , readIndex(0)
    , total(0.0F)
    , initialized(false) {
    for (int i = 0; i < SMOOTHING_SAMPLES; ++i) {
        readings[i] = 0.0F;
    }
}

void MQ2Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println(F("MQ-2 sensor initializing..."));
    
    Serial.println(F("Warming up sensor (60 seconds)..."));
    for (int i = 0; i < 60; ++i) {
        delay(1000);
        if (i % 10 == 0) Serial.print('.');
    }
    Serial.println(F("\nSensor warmed up!"));
    
    calibrate();
    Serial.printf_P(PSTR("MQ-2 initialized. R0: %.2f kΩ\n"), r0);
}

void MQ2Sensor::calibrate() {
    Serial.println(F("Calibrating MQ-2 in clean air..."));
    
    constexpr int SAMPLES = 100;
    float sum = 0.0F;
    
    for (int i = 0; i < SAMPLES; ++i) {
        sum += analogRead(sensorPin);
        delay(10);
    }
    
    const float avgAdc = sum / SAMPLES;
    voltage = (avgAdc / MQ2_ADC_RESOLUTION) * MQ2_VCC;
    
    // Rs = ((Vcc - Vout) / Vout) * RL
    rs = ((MQ2_VCC - voltage) / voltage) * rl;
    r0 = rs;  // Clean air calibration
    
    Serial.printf_P(PSTR("Calibration: R0=%.2f, RS=%.2f, V=%.2fV\n"), r0, rs, voltage);
}

float MQ2Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / static_cast<float>(MQ2_ADC_RESOLUTION)) * MQ2_VCC;
    rs = calculateResistance();
    ratio = calculateRatio();
    const float currentPPM = calculatePPM();
    ppm = applySmoothing(currentPPM);
    return ppm;
}

float MQ2Sensor::calculateResistance() const {
    const float v = (voltage <= 0.01F) ? 0.01F : voltage;
    return ((MQ2_VCC - v) / v) * rl;
}

float MQ2Sensor::calculateRatio() const {
    return (r0 <= 0.01F) ? 0.0F : (rs / r0);
}

float MQ2Sensor::calculatePPM() const {
    if (ratio <= 0.01F) return 0.0F;
    
    // Power law: ppm = a * (Rs/R0)^b
    // Calibrated for MQ-2 LPG detection
    float ppm = 50.0F * pow(ratio, -2.5F);
    
    // Recovery logic for clean air
    if (ratio > 0.8F && ratio < 1.2F) {
        ppm = ppm * 0.3F + MQ2_BASELINE_PPM * 0.7F;
    }
    
    // Clamp to valid range
    return constrain(ppm, 0.0F, 10000.0F);
}

const String MQ2Sensor::getAirQuality(float ppm) const {
    if (ppm < 25.0F) return F("Excellent");
    if (ppm < 50.0F) return F("Good");
    if (ppm < 200.0F) return F("Moderate");
    if (ppm < 500.0F) return F("Poor");
    if (ppm < 1000.0F) return F("Very Poor");
    if (ppm < 5000.0F) return F("Hazardous");
    return F("Critical");
}

float MQ2Sensor::applySmoothing(float currentPPM) {
    total -= readings[readIndex];
    readings[readIndex] = currentPPM;
    total += readings[readIndex];
    readIndex = (readIndex + 1) % SMOOTHING_SAMPLES;
    
    if (!initialized) {
        if (readIndex == 0) initialized = true;
        return currentPPM;
    }
    
    const float average = total / SMOOTHING_SAMPLES;
    const float diff = fabs(currentPPM - average);
    
    // Adaptive smoothing: less smoothing on rapid changes
    return (diff > average * 0.3F) 
        ? (average * 0.3F + currentPPM * 0.7F)
        : average;
}
