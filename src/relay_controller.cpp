#include "relay_controller.h"
#include "config.h"
#include <Arduino.h>

RelayController::RelayController() {
    relayPin = RELAY_PIN;
    currentState = false;
    isInitialized = false;
    lastToggleTime = 0;
    debounceDelay = 100; // 100ms debounce
}

bool RelayController::init() {
    pinMode(relayPin, OUTPUT);
    
    // Initialize relay to OFF state
    digitalWrite(relayPin, HIGH); // Most relay modules are active LOW
    currentState = false;
    
    isInitialized = true;
    Serial.println("Relay controller initialized");
    Serial.println("Relay state: OFF");
    
    return true;
}

void RelayController::setState(bool state) {
    if (!isInitialized) {
        Serial.println("Relay not initialized");
        return;
    }
    
    // Debounce protection
    unsigned long currentTime = millis();
    if (currentTime - lastToggleTime < debounceDelay) {
        return;
    }
    
    if (state != currentState) {
        currentState = state;
        
        // Most relay modules are active LOW
        if (state) {
            digitalWrite(relayPin, LOW); // Turn ON
        } else {
            digitalWrite(relayPin, HIGH); // Turn OFF
        }
        
        lastToggleTime = currentTime;
        
        Serial.printf("Relay state changed to: %s\n", currentState ? "ON" : "OFF");
    }
}

bool RelayController::getState() {
    return currentState;
}

void RelayController::toggle() {
    setState(!currentState);
}

void RelayController::turnOn() {
    setState(true);
}

void RelayController::turnOff() {
    setState(false);
}

bool RelayController::isOn() {
    return currentState;
}

bool RelayController::isOff() {
    return !currentState;
}

void RelayController::pulse(unsigned long duration) {
    if (!isInitialized) {
        Serial.println("Relay not initialized");
        return;
    }
    
    Serial.printf("Pulsing relay for %lu ms\n", duration);
    
    turnOn();
    delay(duration);
    turnOff();
    
    Serial.println("Relay pulse completed");
}

unsigned long RelayController::getLastToggleTime() {
    return lastToggleTime;
}