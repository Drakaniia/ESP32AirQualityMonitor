#ifndef ALERT_CONTROLLER_H
#define ALERT_CONTROLLER_H

#include <Arduino.h>
#include "relay_controller.h"

class AlertController {
private:
    int ledPin;
    int buzzerPin;
    bool isActive;
    bool isInitialized;
    bool manualOverride;  // Manual override state
    bool manualState;    // Manual ON/OFF state when override is active
    unsigned long lastBlinkTime;
    unsigned long lastBeepTime;
    unsigned long blinkInterval;
    unsigned long beepInterval;
    bool ledState;
    bool buzzerState;
    RelayController* relayController;

public:
    AlertController();
    bool init(RelayController* relay);
    void activate();
    void deactivate();
    void update();
    bool isAlertActive();
    void setPPMThreshold(float threshold);
    float getPPMThreshold();
    void checkPPMLevel(float currentPPM);
    void setManualOverride(bool override, bool state);
    void clearManualOverride();
    bool getManualOverride();
    bool getManualState();
};

#endif