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
    
    // Manual overrides
    bool manualOverride;
    bool manualState;
    bool buzzerManualOverride;
    bool buzzerManualState;
    bool ledManualOverride;
    bool ledManualState;
    
    uint32_t lastBlinkTime;
    uint32_t lastBeepTime;
    uint32_t blinkInterval;
    uint32_t beepInterval;
    bool ledState;
    bool buzzerState;
    
    RelayController* relayController;

public:
    AlertController();
    bool init(RelayController* relay);
    void activate();
    void deactivate();
    void update();
    bool isAlertActive() const { return isActive; }
    void checkPPMLevel(float currentPPM);
    void setManualOverride(bool override, bool state);
    void setBuzzerManualOverride(bool override, bool state);
    void setLedManualOverride(bool override, bool state);
    void clearManualOverride();
    bool getManualOverride() const { return manualOverride; }
};

#endif
