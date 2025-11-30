/**
 * Confirmation that test infrastructure has been set up successfully
 * The original issue was "A test folder 'C:\Users\Rowell\Documents\AirQualityMonitor123\test' does not exist."
 * This has been resolved by creating the test directory and implementing a basic unit test structure.
 */

#include <Arduino.h>
#include <unity.h>

// Include the main configuration to verify it's accessible
#include "../src/config.h"

void test_project_structure_exists(void) {
    // Verify that the project configuration constants are accessible
    TEST_ASSERT_GREATER_THAN(0, strlen(WIFI_SSID));
    TEST_ASSERT_GREATER_THAN(0, strlen(WIFI_PASSWORD));
    TEST_ASSERT_GREATER_THAN(0, MQ135_PIN);
    TEST_ASSERT_GREATER_THAN(0, SCREEN_WIDTH);
    TEST_ASSERT_GREATER_THAN(0, SCREEN_HEIGHT);
}

void test_constants_are_defined(void) {
    // Test that key constants from config.h are properly defined
    TEST_ASSERT_EQUAL_STRING("Hotspot1", WIFI_SSID);
    TEST_ASSERT_GREATER_THAN(0, MQ135_R0);
    TEST_ASSERT_GREATER_THAN(0, OLED_ADDRESS);
    TEST_ASSERT_GREATER_THAN(0, AQ_THRESHOLD_EXCELLENT);
    TEST_ASSERT_GREATER_THAN(AQ_THRESHOLD_EXCELLENT, AQ_THRESHOLD_GOOD);
}

int runUnityTests() {
    UNITY_BEGIN();
    
    RUN_TEST(test_project_structure_exists);
    RUN_TEST(test_constants_are_defined);
    
    return UNITY_END();
}

void setup() {
    // Initialize serial communication for debugging
    Serial.begin(115200);
    delay(2000);  // Wait for serial to connect
    
    Serial.println("Running Air Quality Monitor test suite...");
    
    // Run the unit tests
    runUnityTests();
    
    Serial.println("Test suite completed!");
}

void loop() {
    // Empty - tests run once in setup
}