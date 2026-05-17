#ifndef RELAY_CONTROLLER_H
#define RELAY_CONTROLLER_H

#include <Arduino.h>

class RelayController {
private:
    int relayPin;
    bool currentState;
    bool isInitialized;
    uint32_t lastToggleTime;
    uint32_t debounceDelay;

public:
    RelayController();
    bool init();
    void setState(bool state);
    bool getState() const { return currentState; }
    void toggle();
    void turnOn();
    void turnOff();
    bool isOn() const { return currentState; }
    bool isOff() const { return !currentState; }
    void pulse(uint32_t duration);
};

#endif
