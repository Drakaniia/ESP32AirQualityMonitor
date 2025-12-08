#include "alert_controller.h"
#include "config.h"

AlertController::AlertController() {
    ledPin = LED_PIN;
    buzzerPin = BUZZER_PIN;
    isActive = false;
    isInitialized = false;
    manualOverride = false;
    manualState = false;
    buzzerManualOverride = false;
    buzzerManualState = false;
    ledManualOverride = false;
    ledManualState = false;
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
    
    // Test buzzer on startup
    Serial.println("Testing buzzer on startup...");
    digitalWrite(buzzerPin, HIGH);
    delay(200); // Short beep
    digitalWrite(buzzerPin, LOW);
    Serial.println("Buzzer test completed");
    
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
    
    // Check if manual overrides are active
    bool buzzerForced = false;
    bool ledForced = false;
    
    if (buzzerManualOverride) {
        digitalWrite(buzzerPin, buzzerManualState ? HIGH : LOW);
        buzzerForced = true;
    }
    
    if (ledManualOverride) {
        digitalWrite(ledPin, ledManualState ? HIGH : LOW);
        ledForced = true;
    }
    
    // If both are manually controlled, skip automatic control
    if (buzzerForced && ledForced) {
        return;
    }
    
    // If one is manually controlled, only handle the other automatically
    if (buzzerForced || ledManualOverride) {
        // Handle the non-overridden component
        if (!buzzerForced && isActive) {
            // Handle buzzer beeping
            if (currentTime - lastBeepTime >= beepInterval) {
                lastBeepTime = currentTime;
                buzzerState = !buzzerState;
                digitalWrite(buzzerPin, buzzerState ? HIGH : LOW);
            }
        } else if (!ledForced && isActive) {
            // Handle LED blinking
            if (currentTime - lastBlinkTime >= blinkInterval) {
                lastBlinkTime = currentTime;
                ledState = !ledState;
                digitalWrite(ledPin, ledState ? HIGH : LOW);
            }
        }
        return;
    }
    
    // Check legacy manual override (for backward compatibility)
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
            if (buzzerState) {
                digitalWrite(buzzerPin, HIGH);
                tone(buzzerPin, 1000); // 1kHz tone for passive buzzers
                Serial.printf("Buzzer ON: Pin HIGH + 1000Hz tone\n");
            } else {
                digitalWrite(buzzerPin, LOW);
                noTone(buzzerPin); // Stop tone
                Serial.printf("Buzzer OFF: Pin LOW + tone stopped\n");
            }
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
    buzzerManualOverride = false;
    ledManualOverride = false;
    Serial.println("Manual override cleared - returning to automatic PPM-based control");
}

void AlertController::setBuzzerManualOverride(bool override, bool state) {
    buzzerManualOverride = override;
    buzzerManualState = state;
    
    Serial.printf("=== BUZZER OVERRIDE ===\n");
    Serial.printf("Override: %s\n", override ? "TRUE" : "FALSE");
    Serial.printf("State: %s\n", state ? "TRUE" : "FALSE");
    Serial.printf("Buzzer Pin: %d\n", buzzerPin);
    
    if (override) {
        // Immediately apply buzzer state
        if (state) {
            // Try both active and passive buzzer methods
            digitalWrite(buzzerPin, HIGH);
            Serial.printf("Set pin %d to HIGH (active buzzer)\n", buzzerPin);
            
            // Also try tone for passive buzzers
            tone(buzzerPin, 1000); // 1kHz tone for passive buzzers
            Serial.printf("Set pin %d to 1000Hz tone (passive buzzer)\n", buzzerPin);
        } else {
            digitalWrite(buzzerPin, LOW);
            Serial.printf("Set pin %d to LOW\n", buzzerPin);
            noTone(buzzerPin); // Stop tone generation
            Serial.printf("Stopped tone on pin %d\n", buzzerPin);
        }
        Serial.printf("Buzzer manual override activated - buzzer forced %s\n", state ? "ON" : "OFF");
    } else {
        digitalWrite(buzzerPin, LOW);
        Serial.printf("Set pin %d to LOW (override cleared)\n", buzzerPin);
        // noTone(buzzerPin); // Stop tone generation
        Serial.println("Buzzer manual override deactivated - returning to automatic control");
    }
    Serial.printf("=== END BUZZER OVERRIDE ===\n");
}

void AlertController::setLedManualOverride(bool override, bool state) {
    ledManualOverride = override;
    ledManualState = state;
    
    Serial.printf("=== LED OVERRIDE ===\n");
    Serial.printf("Override: %s\n", override ? "TRUE" : "FALSE");
    Serial.printf("State: %s\n", state ? "TRUE" : "FALSE");
    Serial.printf("LED Pin: %d\n", ledPin);
    
    if (override) {
        // Immediately apply LED state
        digitalWrite(ledPin, state ? HIGH : LOW);
        Serial.printf("Set pin %d to %s\n", ledPin, state ? "HIGH" : "LOW");
        Serial.printf("LED manual override activated - LED forced %s\n", state ? "ON" : "OFF");
    } else {
        digitalWrite(ledPin, LOW);
        Serial.printf("Set pin %d to LOW (override cleared)\n", ledPin);
        Serial.println("LED manual override deactivated - returning to automatic control");
    }
    Serial.printf("=== END LED OVERRIDE ===\n");
}