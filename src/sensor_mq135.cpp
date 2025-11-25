#include "sensor_mq135.h"
#include "config.h"
#include <Arduino.h>
#include <math.h>

MQ135Sensor::MQ135Sensor() {
    sensorPin = MQ135_PIN;
    r0 = MQ135_R0;     // Default R0 value, will be calibrated
    rl = 10.0;         // 10kΩ load resistance
    ppm = 0;
    voltage = 0;
    rs = 0;
    ratio = 0;
}

void MQ135Sensor::init() {
    pinMode(sensorPin, INPUT);
    Serial.println("MQ-135 sensor initializing...");
    
    // Allow sensor to warm up
    Serial.println("Warming up sensor (60 seconds)...");
    for (int i = 0; i < 60; i++) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nSensor warmed up!");
    
    // Calibrate sensor
    calibrate();
    
    Serial.printf("MQ-135 sensor initialized. R0: %.2f\n", r0);
}

void MQ135Sensor::calibrate() {
    Serial.println("Calibrating MQ-135 sensor...");
    
    float sum = 0;
    int samples = 100;
    
    // Take multiple readings for calibration
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
    
    // R0 = RS in clean air (approximately 76.63 for MQ-135)
    r0 = rs / 9.83;  // Ratio for clean air
    
    Serial.printf("Calibration complete. R0: %.2f, RS: %.2f\n", r0, rs);
}

float MQ135Sensor::readPPM() {
    voltage = (analogRead(sensorPin) / 4095.0) * 3.3;
    rs = calculateResistance();
    ratio = calculateRatio();
    ppm = calculatePPM();
    
    return ppm;
}

float MQ135Sensor::calculateResistance() {
    if (voltage <= 0) {
        return 0;
    }
    
    float vrl = voltage * rl / 3.3;
    if (vrl <= 0) {
        return 0;
    }
    
    return (3.3 - voltage) / vrl * rl;
}

float MQ135Sensor::calculateRatio() {
    if (r0 <= 0) {
        return 0;
    }
    
    return rs / r0;
}

float MQ135Sensor::calculatePPM() {
    // MQ-135 equation for CO2 approximation
    // PPM = a * (RS/R0)^b
    // For CO2: a = 116.6020682, b = -2.769034857
    
    if (ratio <= 0) {
        return 0;
    }
    
    float logRatio = log10(ratio);
    float ppm = 116.6020682 * pow(10, -2.769034857 * logRatio);
    
    // Limit the range to reasonable values
    if (ppm < 0) ppm = 0;
    if (ppm > 10000) ppm = 10000;
    
    return ppm;
}

String MQ135Sensor::getAirQuality(float ppm) {
    // Air quality categories based on PPM
    if (ppm < 50) {
        return "Excellent";
    } else if (ppm < 100) {
        return "Good";
    } else if (ppm < 200) {
        return "Moderate";
    } else if (ppm < 400) {
        return "Poor";
    } else if (ppm < 800) {
        return "Very Poor";
    } else {
        return "Hazardous";
    }
}

float MQ135Sensor::getVoltage() {
    return voltage;
}

float MQ135Sensor::getResistance() {
    return rs;
}

bool MQ135Sensor::isCalibrated() {
    return (r0 > 0);
}