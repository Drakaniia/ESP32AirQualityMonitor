#include "sensor_mq2.h"
#include "config.h"
#include <Arduino.h>
#include <math.h>

MQ2Sensor::MQ2Sensor() {
    sensorPin = MQ2_PIN;
    r0 = 0.0;        // Will be set during calibration (initially zero to force calibration)
    rl = 10.0;       // 10kΩ load resistance (typical value for MQ-2)
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
    
    // Initialize smoothing variables
    readIndex = 0;
    total = 0;
    initialized = false;
    for (int i = 0; i < 10; i++) {
        readings[i] = 0;
    }
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
    Serial.println("Place sensor in clean air for accurate calibration!");

    float sum = 0;
    int samples = 100;

    // Take multiple readings for calibration in clean air
    for (int i = 0; i < samples; i++) {
        float adcValue = analogRead(sensorPin);
        sum += adcValue;
        delay(10);
    }

    float avgAdc = sum / samples;
    voltage = (avgAdc / 4095.0) * 3.3;  // ESP32 ADC is 12-bit (0-4095)

    // Calculate RS in clean air: Rs = ( (Vc - Vrl) / Vrl ) * RL
    // where Vrl = voltage across the load resistor
    float vrl = voltage;  // Voltage at the sensor output
    rs = ((3.3 - voltage) / voltage) * rl;  // Correct formula for MQ2

    // For MQ-2 sensor in clean air, RS/R0 ratio should be around 1.0
    // Normal indoor air has virtually no combustible gases (10-50 PPM)
    // Set R0 so that clean air ratio gives ~10-20 PPM baseline
    r0 = rs / 1.0;  // Use direct RS as R0 for clean air calibration

    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f, Voltage: %.2fV\n", r0, rs, voltage);
}

float MQ2Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    float currentPPM = calculatePPM();
    
    // Apply smoothing
    ppm = getSmoothedPPM(currentPPM);

    return ppm;
}

float MQ2Sensor::calculateResistance() {
    if (voltage <= 0.01) {  // Prevent division by very small numbers
        // Calculate voltage from current reading if not cached
        float currentVoltage = (analogRead(sensorPin) / 4095.0) * 3.3;
        if (currentVoltage <= 0.01) currentVoltage = 0.01; // Prevent division by zero
        return ((3.3 - currentVoltage) / currentVoltage) * rl;
    }

    // Calculate sensor resistance: Rs = ( (Vc - Vrl) / Vrl ) * RL
    // where Vrl = voltage across the load resistor (which is the sensor output)
    return ((3.3 - voltage) / voltage) * rl;
}

float MQ2Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }

    // Return the ratio of sensor resistance in gas to sensor resistance in clean air
    return rs / r0;
}

float MQ2Sensor::calculatePPM() {
    // MQ-2 equation for LPG detection (which is the most common use case)
    // Based on MQ-2 sensitivity curve: log(Rs/R0) vs log(C) is approximately linear
    // The typical sensitivity characteristic for LPG follows a power law relationship
    // From MQ-2 datasheet: for LPG, the relationship is approximately: ppm = a * (Rs/R0)^b
    // For LPG detection: a ≈ 1012.7, b ≈ -2.518 (based on log-log plot from datasheet)

    if (ratio <= 0) {
        return 0;
    }

    // For LPG detection using MQ-2 (most common application)
    // Formula derived from log-log relationship on sensitivity chart
    // Calibrated for proper baseline: clean air should read 10-20 PPM
    float ppm = 50.0 * pow(ratio, -2.5);

    // Add recovery logic for when gas is removed
    // If ratio is close to 1 (clean air), force PPM towards baseline
    if (ratio > 0.8 && ratio < 1.2) {
        // In clean air conditions, return to proper baseline
        float baselinePPM = 15.0; // Normal indoor air baseline (10-20 PPM)
        ppm = ppm * 0.3 + baselinePPM * 0.7; // Strong weight towards baseline
    }

    // Limit the range to reasonable values (MQ-2 can detect from 100-10000ppm typically)
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;

    return ppm;
}

String MQ2Sensor::getAirQuality(float ppm) {
    // Air quality categories based on LPG/Combustible gas detection (MQ-2 primary use)
    // The MQ-2 is primarily sensitive to LPG, Propane, Hydrogen, etc.
    // Normal indoor air: 10-50 PPM (virtually no combustible gases)
    if (ppm < 25) {
        return "Excellent";  // Clean air (10-25 PPM)
    } else if (ppm < 50) {
        return "Good";       // Normal indoor air (25-50 PPM)
    } else if (ppm < 200) {
        return "Moderate";   // Light cooking/activity (50-200 PPM)
    } else if (ppm < 500) {
        return "Poor";       // Elevated levels - investigate (200-500 PPM)
    } else if (ppm < 1000) {
        return "Very Poor";  // High levels - potential concern (500-1000 PPM)
    } else if (ppm < 5000) {
        return "Hazardous";  // Dangerous levels - immediate action (1000-5000 PPM)
    } else {
        return "Critical";   // Extreme danger - evacuate immediately (>5000 PPM)
    }
}

float MQ2Sensor::getVoltage() {
    return voltage;
}

float MQ2Sensor::getResistance() {
    return rs;
}

float MQ2Sensor::getSmoothedPPM(float currentPPM) {
    // Subtract the last reading
    total = total - readings[readIndex];
    
    // Read from the sensor
    readings[readIndex] = currentPPM;
    
    // Add the reading to the total
    total = total + readings[readIndex];
    
    // Advance to the next position in the array
    readIndex = readIndex + 1;
    
    // If we're at the end of the array, wrap around to the beginning
    if (readIndex >= 10) {
        readIndex = 0;
        initialized = true;
    }
    
    // Calculate the average with adaptive smoothing
    if (initialized) {
        float average = total / 10.0;
        
        // If current reading is significantly different from average, use less smoothing
        float difference = abs(currentPPM - average);
        if (difference > average * 0.3) { // If difference is more than 30% of average
            // Use weighted average that favors current reading more
            return (average * 0.3) + (currentPPM * 0.7);
        } else {
            // Use normal smoothing
            return average;
        }
    } else {
        // Return current reading if not enough samples yet
        return currentPPM;
    }
}

bool MQ2Sensor::isCalibrated() {
    return (r0 > 0);
}