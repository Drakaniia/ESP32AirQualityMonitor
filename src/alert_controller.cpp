#include "alert_controller.h"
#include "config.h"

AlertController::AlertController() {
    ledPin = LED_PIN;
    buzzerPin = BUZZER_PIN;
    isActive = false;
    isInitialized = false;
    manualOverride = false;
    manualState = false;
    lastBlinkTime = 0;
    lastBeepTime = 0;
    blinkInterval = 500; // LED blinks every 500ms
    beepInterval = 1000; // Buzzer beeps every 1000ms
    ledState = false;
    buzzerState = false;
    relayController = nullptr;
}

bool AlertController::init(RelayController* relay) {
    relayController = relay;
    
    pinMode(ledPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);
    
    // Initialize to OFF state
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);
    
    isInitialized = true;
    Serial.println("Alert controller initialized");
    return true;
}

void AlertController::activate() {
    if (!isInitialized) {
        Serial.println("Alert controller not initialized");
        return;
    }
    
    isActive = true;
    
    // Relay should remain ON at all times - control LED/buzzer directly
    Serial.println("Alert activated - LED and buzzer will blink/beep");
}

void AlertController::deactivate() {
    if (!isInitialized) {
        Serial.println("Alert controller not initialized");
        return;
    }
    
    isActive = false;
    ledState = false;
    buzzerState = false;
    
    // Turn off LED and buzzer directly
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);
    
    // Relay should remain ON at all times - control LED/buzzer directly
    Serial.println("Alert deactivated - LED and buzzer turned OFF");
}

void AlertController::update() {
    if (!isInitialized) {
        return;
    }
    
    // Relay should remain ON at all times - control LED/buzzer directly based on alert state
    unsigned long currentTime = millis();
    
    // Check if manual override is active
    if (manualOverride) {
        // Manual override takes precedence
        digitalWrite(ledPin, manualState ? HIGH : LOW);
        digitalWrite(buzzerPin, manualState ? HIGH : LOW);
        return;
    }
    
    // Control LED/buzzer directly when alert is active
    if (isActive) {
        // Handle LED blinking
        if (currentTime - lastBlinkTime >= blinkInterval) {
            lastBlinkTime = currentTime;
            ledState = !ledState;
            digitalWrite(ledPin, ledState ? HIGH : LOW);
        }
        
        // Handle buzzer beeping
        if (currentTime - lastBeepTime >= beepInterval) {
            lastBeepTime = currentTime;
            buzzerState = !buzzerState;
            digitalWrite(buzzerPin, buzzerState ? HIGH : LOW);
        }
    } else {
        // Ensure LED and buzzer are off when alert is not active
        digitalWrite(ledPin, LOW);
        digitalWrite(buzzerPin, LOW);
    }
}

bool AlertController::isAlertActive() {
    return isActive;
}

void AlertController::checkPPMLevel(float currentPPM) {
    if (!isInitialized) {
        return;
    }
    
    // Only check PPM levels if manual override is not active
    if (!manualOverride) {
        // Activate alert when PPM reaches 1000 or higher
        if (currentPPM >= 1000) {
            activate();
        } else if (currentPPM < 900) { // Deactivate when PPM returns to normal (below 900)
            deactivate();
        }
    }
}

void AlertController::setManualOverride(bool override, bool state) {
    manualOverride = override;
    manualState = state;
    
    if (override) {
        Serial.printf("Manual override activated - LED and buzzer forced %s\n", state ? "ON" : "OFF");
    } else {
        Serial.println("Manual override deactivated - returning to automatic PPM-based control");
        // Reset alert state based on current PPM when override is disabled
        // This will be handled by the next checkPPMLevel call
    }
}

bool AlertController::getManualOverride() {
    return manualOverride;
}

bool AlertController::getManualState() {
    return manualState;
}

void AlertController::clearManualOverride() {
    manualOverride = false;
    Serial.println("Manual override cleared - returning to automatic PPM-based control");
}