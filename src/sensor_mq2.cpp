#include "sensor_mq2.h"
#include "config.h"
#include <Arduino.h>
#include <math.h>

MQ2Sensor::MQ2Sensor() {
    sensorPin = MQ2_PIN;
    r0 = MQ2_R0;     // Initial R0 value for MQ-2 (will be calibrated)
    rl = 10.0;       // 10kΩ load resistance (typical value)
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
}

void MQ2Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-2 sensor initializing...");

    // Allow sensor to warm up (recommended 24-48 hours for best results, but we'll use 60 seconds for practicality)
    Serial.println("Warming up sensor (60 seconds)...");
    for (int i = 0; i < 60; i++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nSensor warmed up!");

    // Calibrate sensor in clean air
    calibrate();

    Serial.printf("MQ-2 sensor initialized. R0: %.2f\n", r0);
}

void MQ2Sensor::calibrate() {
    Serial.println("Calibrating MQ-2 sensor in clean air...");

    float sum = 0;
    int samples = 100;

    // Take multiple readings for calibration in clean air
    for (int i = 0; i < samples; i++) {
        float adcValue = analogRead(sensorPin);
        sum += adcValue;
        delay(10);
    }

    float avgAdc = sum / samples;
    float voltage = (avgAdc / 4095.0) * 3.3;  // ESP32 ADC is 12-bit (0-4095)

    // Calculate RS in clean air
    float vrl = voltage * rl / 3.3;
    rs = (3.3 - voltage) / vrl * rl;

    // For MQ-2 sensor detecting LPG/Butane, typical R0 value is calculated from RS/correction factor
    // The Rs/R0 ratio in clean air is typically around 9.8 for LPG (from datasheet curves)
    r0 = rs / 9.8;  // Typical ratio in clean air for LPG detection

    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f\n", r0, rs);
}

float MQ2Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    ppm = calculatePPM();

    return ppm;
}

float MQ2Sensor::calculateResistance() {
    if (voltage <= 0) {
        return 0;
    }

    // Calculate voltage across the load resistor
    float vrl = voltage * rl / 3.3;
    if (vrl <= 0) {
        return (3.3 - voltage) / 0.001 * rl;  // Prevent division by zero
    }

    // Calculate sensor resistance: Rs = (Vcc - Vout) * RL / Vout
    return (3.3 - voltage) / vrl * rl;
}

float MQ2Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }

    // Return the ratio of sensor resistance in gas to sensor resistance in clean air
    return rs / r0;
}

float MQ2Sensor::calculatePPM() {
    // MQ-2 equation for LPG/Butane detection
    // Based on datasheet sensitivity curves: log(Rs/Ro) vs. log(C) (concentration)
    // For LPG, the relationship is approximately: ppm = a * (Rs/Ro)^b
    // From typical MQ-2 sensitivity chart for LPG/Butane: a = 987.98, b = -2.182
    // These values are derived from the log-log relationship in the datasheet
    
    if (ratio <= 0) {
        return 0;
    }

    // For LPG (propane, butane) detection, use the following power law equation
    // This equation is derived from the typical MQ-2 sensitivity curves
    float ppm = 987.98 * pow(ratio, -2.182);

    // Limit the range to reasonable values
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;

    return ppm;
}

String MQ2Sensor::getAirQuality(float ppm) {
    // Air quality categories based on LPG/Butane PPM
    if (ppm < 100) {
        return "Excellent";
    } else if (ppm < 200) {
        return "Good";
    } else if (ppm < 500) {
        return "Moderate";
    } else if (ppm < 1000) {
        return "Poor";
    } else if (ppm < 2000) {
        return "Very Poor";
    } else {
        return "Hazardous";
    }
}

float MQ2Sensor::getVoltage() {
    return voltage;
}

float MQ2Sensor::getResistance() {
    return rs;
}

bool MQ2Sensor::isCalibrated() {
    return (r0 > 0);
}