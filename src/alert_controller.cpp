#include "alert_controller.h"
#include <Arduino.h>

// Import config values
extern const int LED_PIN;
extern const int BUZZER_PIN;
extern const float AQ_ALERT_THRESHOLD;
extern const uint32_t ALERT_BLINK_INTERVAL_MS;
extern const uint32_t ALERT_BEEP_INTERVAL_MS;

AlertController::AlertController() 
    : ledPin(LED_PIN)
    , buzzerPin(BUZZER_PIN)
    , isActive(false)
    , isInitialized(false)
    , manualOverride(false)
    , manualState(false)
    , buzzerManualOverride(false)
    , buzzerManualState(false)
    , ledManualOverride(false)
    , ledManualState(false)
    , lastBlinkTime(0)
    , lastBeepTime(0)
    , blinkInterval(ALERT_BLINK_INTERVAL_MS)
    , beepInterval(ALERT_BEEP_INTERVAL_MS)
    , ledState(false)
    , buzzerState(false)
    , relayController(nullptr) {}

bool AlertController::init(RelayController* relay) {
    relayController = relay;
    pinMode(ledPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);
    
    // Test buzzer
    Serial.println(F("Testing buzzer..."));
    digitalWrite(buzzerPin, HIGH);
    delay(200);
    digitalWrite(buzzerPin, LOW);
    
    isInitialized = true;
    Serial.println(F("Alert controller initialized"));
    return true;
}

void AlertController::activate() {
    if (!isInitialized) return;
    isActive = true;
    Serial.println(F("Alert ACTIVATED"));
}

void AlertController::deactivate() {
    if (!isInitialized) return;
    isActive = false;
    ledState = false;
    buzzerState = false;
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);
    Serial.println(F("Alert DEACTIVATED"));
}

void AlertController::update() {
    if (!isInitialized) return;
    
    const uint32_t now = millis();
    
    // Handle manual overrides first
    if (buzzerManualOverride) {
        digitalWrite(buzzerPin, buzzerManualState ? HIGH : LOW);
    }
    if (ledManualOverride) {
        digitalWrite(ledPin, ledManualState ? HIGH : LOW);
    }
    
    // Skip auto control if both manually overridden
    if (buzzerManualOverride && ledManualOverride) return;
    
    // Legacy override
    if (manualOverride) {
        digitalWrite(ledPin, manualState ? HIGH : LOW);
        digitalWrite(buzzerPin, manualState ? HIGH : LOW);
        return;
    }
    
    // Auto control when alert active
    if (isActive) {
        // LED blink
        if (!ledManualOverride && now - lastBlinkTime >= blinkInterval) {
            lastBlinkTime = now;
            ledState = !ledState;
            digitalWrite(ledPin, ledState ? HIGH : LOW);
        }
        
        // Buzzer beep
        if (!buzzerManualOverride && now - lastBeepTime >= beepInterval) {
            lastBeepTime = now;
            buzzerState = !buzzerState;
            digitalWrite(buzzerPin, buzzerState ? HIGH : LOW);
        }
    } else {
        // Ensure off when inactive
        if (!ledManualOverride) digitalWrite(ledPin, LOW);
        if (!buzzerManualOverride) digitalWrite(buzzerPin, LOW);
    }
}

void AlertController::checkPPMLevel(float ppm) {
    if (!isInitialized || manualOverride || buzzerManualOverride || ledManualOverride) return;
    
    if (ppm >= AQ_ALERT_THRESHOLD && !isActive) {
        Serial.printf_P(PSTR("PPM %.1f >= %.1f - ACTIVATING\n"), ppm, AQ_ALERT_THRESHOLD);
        activate();
    } else if (ppm < AQ_ALERT_THRESHOLD && isActive) {
        Serial.printf_P(PSTR("PPM %.1f < %.1f - DEACTIVATING\n"), ppm, AQ_ALERT_THRESHOLD);
        deactivate();
    }
}

void AlertController::setManualOverride(bool override, bool state) {
    manualOverride = override;
    manualState = state;
    Serial.printf_P(PSTR("Manual override: %s\n"), override ? F("ON") : F("OFF"));
}

void AlertController::setBuzzerManualOverride(bool override, bool state) {
    buzzerManualOverride = override;
    buzzerManualState = state;
    digitalWrite(buzzerPin, override && state ? HIGH : LOW);
    Serial.printf_P(PSTR("Buzzer override: %s, state: %s\n"), 
                    override ? F("ON") : F("OFF"),
                    state ? F("ON") : F("OFF"));
}

void AlertController::setLedManualOverride(bool override, bool state) {
    ledManualOverride = override;
    ledManualState = state;
    digitalWrite(ledPin, override && state ? HIGH : LOW);
    Serial.printf_P(PSTR("LED override: %s, state: %s\n"),
                    override ? F("ON") : F("OFF"),
                    state ? F("ON") : F("OFF"));
}

void AlertController::clearManualOverride() {
    manualOverride = false;
    buzzerManualOverride = false;
    ledManualOverride = false;
    Serial.println(F("All overrides cleared"));
}
