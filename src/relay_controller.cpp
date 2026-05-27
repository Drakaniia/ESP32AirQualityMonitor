#include "relay_controller.h"
#include <Arduino.h>

// Import config values
extern const int RELAY_PIN;
extern const uint32_t RELAY_DEBOUNCE_MS;

RelayController::RelayController() 
    : relayPin(RELAY_PIN)
    , currentState(false)
    , isInitialized(false)
    , lastToggleTime(0)
    , debounceDelay(RELAY_DEBOUNCE_MS) {}

bool RelayController::init() {
    pinMode(relayPin, OUTPUT);
    digitalWrite(relayPin, HIGH);  // Active LOW relay
    currentState = false;
    isInitialized = true;
    Serial.println(F("Relay initialized: OFF"));
    return true;
}

void RelayController::setState(bool state) {
    if (!isInitialized) return;
    
    const uint32_t now = millis();
    if (now - lastToggleTime < debounceDelay) return;
    
    if (state != currentState) {
        currentState = state;
        digitalWrite(relayPin, state ? LOW : HIGH);
        lastToggleTime = now;
        Serial.printf_P(PSTR("Relay: %s\n"), state ? F("ON") : F("OFF"));
    }
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

void RelayController::pulse(uint32_t duration) {
    if (!isInitialized) return;
    turnOn();
    delay(duration);
    turnOff();
}
