# ESP32 Air Quality Monitor - Timing Parameters Documentation

## Overview

This document details the various timing parameters implemented in the ESP32 Air Quality Monitor system. The system uses a combination of hardware and software timing to ensure accurate sensor readings, reliable communication, and appropriate response to environmental conditions.

## Main System Timing Parameters

### 1. Main Loop Timing
- **Main Loop Delay**: 100ms
  - Purpose: Prevents excessive CPU usage and allows other tasks to run
  - Implementation: `delay(100)` at the end of each main loop iteration
  - Frequency: ~10 iterations per second

### 2. Sensor Reading Intervals
- **Default Sampling Interval**: 5 seconds
  - Purpose: Balance between responsiveness and system efficiency
  - Configurable via MQTT command: `{"sampling_interval": value}` (1-300 seconds)
  - Implementation: Timer based on `millis()` function
  - Trigger: When `currentMillis - lastSensorRead >= samplingInterval * 1000`

### 3. Communication Timing
- **MQTT Update Interval**: 30 seconds (30,000ms)
  - Purpose: Regular transmission of sensor data to MQTT broker
  - Implementation: Timer based on `millis()` function
  - Trigger: When `currentMillis - lastMQTTUpdate >= MQTT_UPDATE_INTERVAL`
  
- **Command Check Interval**: 2 seconds (2,000ms) in main.cpp, 5 seconds in Arduino file
  - Purpose: Check for incoming commands from IoT interface
  - Implementation: Timer based on `millis()` function
  - Trigger: When `currentMillis - lastCommandCheck >= COMMAND_CHECK_INTERVAL`

- **MQTT Reconnection Interval**: 10 seconds
  - Purpose: Attempt to reconnect to MQTT broker when connection is lost
  - Implementation: Uses `millis()` for non-blocking timing
  - Trigger: Every 10 seconds when disconnected

- **MQTT Keep-Alive**: 60 seconds
  - Purpose: Maintain stable MQTT connection
  - Implementation: Built into PubSubClient library configuration

## Sensor-Specific Timing Parameters

### 1. MQ-2 Gas Sensor Timing
- **Initial Warmup Time**: 3 seconds
  - Purpose: Allow sensor to stabilize before calibration
  - Implementation: During initialization phase
  - Reason: Reduced from standard 60 seconds for faster deployment

- **Calibration Sample Count**: 20 readings
  - Purpose: Establish accurate baseline (R0) value
  - Implementation: Taken during calibration process
  - Delay between samples: 10ms

- **ADC Reading Interval**: Continuous during sampling
  - Purpose: Convert analog signal to digital value
  - Implementation: Real-time conversion when sensor is read

### 2. DHT22 Sensor Timing
- **DHT Reading Samples**: 5 consecutive readings (DHT_READING_SAMPLES)
  - Purpose: Improve accuracy through averaging
  - Implementation: Used in `readTemperatureWithAveraging()` and `readHumidityWithAveraging()`

- **Delay Between DHT Readings**: 50ms (DHT_READING_DELAY)
  - Purpose: Allow sensor to stabilize between readings
  - Implementation: Applied during averaging process

- **DHT Retry Attempts**: Up to 3 attempts (maxRetries)
  - Purpose: Handle invalid readings gracefully
  - Implementation: Used in `readTemperatureWithRetry()` and `readHumidityWithRetry()`
  - Delay between retries: 250ms

## Alarm and Alert Timing Parameters

### 1. Alarm Trigger Timing
- **PPM Threshold Activation**: ≥ 1000 PPM
  - Purpose: Trigger alarm when gas levels become hazardous
  - Implementation: Checked during sensor reading process

- **PPM Threshold Deactivation**: < 500 PPM (hysteresis)
  - Purpose: Prevent oscillation around threshold values
  - Implementation: Prevents alarm from rapidly turning on/off near threshold

### 2. Alert Output Timing
- **LED Blink Interval**: 500ms
  - Purpose: Create visible alert pattern when alarm is active
  - Implementation: Toggles LED state every 500ms when alarm is active

- **Buzzer Beep Interval**: 1000ms in alert_controller.cpp, 500ms in Arduino file
  - Purpose: Create audible alert pattern when alarm is active
  - Implementation: Toggles buzzer state with specified interval

- **Alert Update Frequency**: Every main loop iteration (every 100ms)
  - Purpose: Ensure continuous monitoring and response
  - Implementation: Called as `alarm.update()` in main loop

## Display and User Interface Timing Parameters

### 1. Display Update Timing
- **Normal Updates**: Synchronized with sensor readings
  - Purpose: Show current readings on OLED display
  - Implementation: Updates every sampling interval

- **Custom Message Refresh**: Every 3 seconds
  - Purpose: Maintain visibility of custom messages
  - Implementation: Periodic refresh while custom message is active

- **Custom Message Timeout**: 10 seconds
  - Purpose: Automatically clear temporary messages
  - Implementation: Uses `millis()` timer to track message display time

## Communication and Network Timing Parameters

### 1. WiFi Connection Timing
- **Connection Timeout**: 20 seconds (20,000ms)
  - Purpose: Prevent indefinite waiting during connection
  - Implementation: Uses `millis()` to track connection attempts
  - Delay between checks: 500ms (`delay(500)` in connection loop)

### 2. Device Status Updates
- **Status Update Interval**: 30 seconds (with MQTT data transmission)
  - Purpose: Maintain online presence in system
  - Implementation: Calls `updateDeviceStatus(true)` with MQTT data

## Hardware Protection Timing Parameters

### 1. Relay Debounce Timing
- **Debounce Delay**: 100ms
  - Purpose: Prevent relay damage from rapid switching
  - Implementation: `debounceDelay` in RelayController class
  - Mechanism: Prevents state changes within 100ms of previous change

### 2. Pulse Duration Timing
- **Configurable Pulse Duration**: Variable
  - Purpose: Allow temporary activation of external devices
  - Implementation: `pulse(unsigned long duration)` method in RelayController

## Timing Implementation Strategy

### Non-Blocking Timing
The system uses the `millis()` function for all timing operations to avoid blocking delays, with the exception of:
- Initial sensor warmup periods
- Delay between consecutive sensor readings for stability
- Critical hardware initialization sequences

### Timer Variables
- `lastSensorRead`: Tracks last sensor reading time
- `lastMQTTUpdate`: Tracks last MQTT data transmission
- `lastCommandCheck`: Tracks last command check
- `customMessageTime`: Tracks when custom message was set
- `lastBlinkTime`: Tracks last LED toggle for alarm
- `lastBeepTime`: Tracks last buzzer toggle for alarm
- `lastToggleTime`: Tracks last relay state change for debounce protection

### Configuration File Timing Parameters
The `config.h` file defines these timing constants:
- `SENSOR_READ_INTERVAL`: 2000ms (though not directly used in main loop)
- `MQTT_UPDATE_INTERVAL`: 30000ms (used for MQTT transmission)
- `COMMAND_CHECK_INTERVAL`: 2000ms (used for command checking)
- `DHT_READING_SAMPLES`: 5 (number of samples for averaging)

## Practical Implications

### Power Consumption vs. Responsiveness
- Shorter sampling intervals (1-5 seconds) provide more responsive monitoring but consume more power
- Longer intervals (60+ seconds) reduce power consumption but provide less frequent updates
- Default 5-second interval provides good balance between responsiveness and efficiency

### Network Traffic Management
- 30-second MQTT updates balance real-time data access with network efficiency
- Command check every 2-5 seconds ensures responsive IoT control
- Connection management prevents excessive reconnection attempts

### Sensor Accuracy
- DHT averaging with 50ms delays between readings improves accuracy
- MQ-2 warmup and calibration ensure reliable baseline establishment
- Hysteresis in alarm triggering prevents rapid on/off cycling

This timing system allows the ESP32 Air Quality Monitor to operate efficiently while providing accurate, responsive environmental monitoring with appropriate alerts and communication.