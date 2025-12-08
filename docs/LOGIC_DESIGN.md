# ESP32 Air Quality Monitor - Logic Design Documentation

## Overview

This document provides a comprehensive discussion of the logic design of the ESP32 Air Quality Monitor system. The system is designed to continuously monitor air quality using an MQ-2 gas sensor, with additional environmental monitoring via a DHT22 temperature/humidity sensor. The design incorporates WiFi connectivity, IoT communication protocols, alarm systems, and a user interface display.

## System Architecture

The ESP32 Air Quality Monitor consists of several interconnected components:

- **MQ-2 Gas Sensor**: Detects combustible gases (LPG, Butane, Propane, Methane, Alcohol, Hydrogen)
- **DHT22 Sensor**: Measures temperature and humidity
- **WiFi Manager**: Handles network connectivity
- **IoT Protocol Handler**: Manages MQTT communication
- **OLED Display**: Shows real-time sensor readings and system status
- **Relay Controller**: Controls external devices based on sensor readings
- **Alarm Controller**: Controls LED and buzzer for direct user alerts
- **Configuration System**: Manages system parameters and settings

## Flow Design

### Main System Operation Flow

1. **Initialization Phase**
   - System startup and serial communication initialization
   - OLED display initialization with welcome screen
   - Alarm controller initialization (LED and buzzer)
   - Relay controller initialization
   - Sensor preheating and calibration (quick warmup process)
   - WiFi connection establishment
   - IoT protocol initialization (MQTT)
   - System ready notification

2. **Main Loop Operation**
   - Continuous sensor data collection at defined intervals
   - Data processing and air quality classification
   - Display updates with current readings
   - IoT data transmission at regular intervals
   - Command processing from IoT interface
   - Alarm and relay state management
   - Periodic connection health checks

```
Start
  |
  v
Initialize Components (WiFi, Sensors, Display, etc.)
  |
  v
Connect to WiFi
  |
  v
Initialize IoT Protocol (MQTT)
  |
  v
Main Loop:
  |
  v
Check for expired custom messages
  |
  v
Read sensor data (MQ-2, DHT22) if sampling interval reached
  |
  v
Process air quality and environmental data
  |
  v
Update alarm state based on PPM levels
  |
  v
Update display (or custom message if active)
  |
  v
Send data to MQTT broker if interval reached
  |
  v
Process incoming commands
  |
  v
Maintain MQTT connection
  |
  v
Update alarm system (LED blinking, buzzer beeping)
  |
  v
Delay and repeat
```

### Sensor Initialization Flow

1. **MQ-2 Sensor Warmup Process**
   - Set sensor pin as input
   - Perform quick 3-second warmup with visual feedback
   - Execute calibration routine in clean air
   - Calculate and store R0 (baseline resistance) value
   - Validate sensor functionality

2. **DHT22 Sensor Initialization**
   - Initialize DHT sensor library
   - Verify sensor connection and communication

### Data Processing Flow

1. **Gas Sensor Reading Process**
   - Read analog voltage from MQ-2 sensor
   - Calculate sensor resistance (Rs)
   - Determine Rs/R0 ratio
   - Convert to PPM using calibration formula
   - Classify air quality based on thresholds

2. **Environmental Sensor Reading Process**
   - Read temperature and humidity from DHT22
   - Apply calibration offsets
   - Validate readings for reasonableness
   - Store values for transmission and display

## Timing Design

### System Timing Parameters

The system operates with several critical timing intervals to balance responsiveness, power consumption, and communication efficiency:

- **Main Loop Delay**: 100ms (between loop iterations)
- **Sensor Reading Interval**: 5 seconds (configurable via MQTT commands)
- **MQTT Update Interval**: 30 seconds (30000ms)
- **Command Check Interval**: 5 seconds (handled through the same interval as MQTT)
- **Display Update**: Synchronized with sensor readings
- **Alarm Update**: Continuous (handles blinking/beeping in real-time)
- **Custom Message Timeout**: 10 seconds
- **MQTT Reconnection**: Every 10 seconds when disconnected
- **DHT Reading Delay**: 50ms between samples during averaging
- **Relay Debounce Time**: 100ms to prevent oscillation
- **MQTT Keep-Alive**: 60 seconds for connection stability

### Timing Implementation Details

1. **Main Loop Timing**
   The main loop operates with a 100ms delay to provide a responsive system while avoiding excessive CPU usage:
   ```cpp
   loop() {
       unsigned long currentMillis = millis();

       // Check for custom message timeout (every ~100ms)
       if (customMessage.length() > 0 && currentMillis - customMessageTime > 10000) {
           customMessage = "";
           customMessageTime = 0;
       }

       // Sensor reading at sampling interval (default: 5 seconds)
       if (currentMillis - lastSensorRead >= samplingInterval * 1000) {
           lastSensorRead = currentMillis;
           readSensors();         // Read MQ-2 and DHT22 sensors
           processAirQuality();   // Calculate PPM and classify quality
           updateDisplay();       // Update OLED with new readings
           updateAlarms();        // Check alarm conditions
       }

       // MQTT data transmission (every 30 seconds)
       if (currentMillis - lastMQTTUpdate >= MQTT_UPDATE_INTERVAL) {
           lastMQTTUpdate = currentMillis;
           sendSensorDataToMQTT();
           updateDeviceStatus(true);  // Maintain online status
       }

       // Process IoT commands
       iotProtocol.loop();  // Handles MQTT command processing

       // Update alarm states (for LED blinking and buzzer beeping)
       alarm.update();

       delay(100);  // Prevent CPU overuse and allow other tasks to run
   }
   ```

2. **Sampling Interval Logic**
   The sampling interval for sensor readings is configurable via IoT commands (1-300 seconds):
   - Default: 5 seconds for responsive monitoring
   - Adjustable: Based on monitoring requirements via MQTT command `{"sampling_interval": value}`
   - Higher intervals: Reduce power consumption and network traffic
   - Lower intervals: Provide more responsive monitoring
   - Validation: Ensures values stay within 1-300 second range

3. **MQTT Communication Timing**
   - Data transmission: Every 30 seconds to balance real-time data with network efficiency
   - Connection maintenance: Automatic reconnection with 10-second intervals when disconnected
   - Status updates: Periodic online/offline status transmission every 30 seconds
   - Keep-alive: 60-second MQTT keep-alive for connection stability
   - Message processing: Continuous through MQTT callback system

4. **Alarm System Timing**
   - LED blinking: 500ms on/off intervals when alarm active
   - Buzzer beeping: 500ms on/off intervals when alarm active
   - Alarm trigger: Activates when PPM ≥ 1000
   - Alarm reset: Deactivates when PPM < 500 (hysteresis to prevent oscillation)
   - Continuous monitoring: The alarm.update() method runs in each loop iteration

5. **Sensor Reading Timing**
   - DHT22 averaging: 5 consecutive readings with 50ms delay between each
   - DHT22 retry mechanism: Up to 3 attempts with 250ms delay between attempts
   - MQ-2 warmup: 3-second quick warmup during initialization
   - MQ-2 calibration: 20 sample readings during calibration process

6. **Display Update Timing**
   - Normal updates: Synchronized with sensor readings (every sampling interval)
   - Custom message refresh: Every 3 seconds if a custom message is active
   - Message timeout: 10-second automatic clearing of custom messages

7. **Connection Management Timing**
   - WiFi connection timeout: 20 seconds during initial connection
   - MQTT reconnection attempts: Every 10 seconds when connection is lost
   - Connection health checks: Continuous monitoring in main loop

## Data Handling Design

### Data Acquisition and Processing

1. **Sensor Data Acquisition**
   - **MQ-2 Gas Sensor Data**:
     - Raw ADC reading (0-4095 for 12-bit ESP32)
     - Conversion to voltage: `voltage = (ADC / 4095.0) * 3.3`
     - Resistance calculation: `Rs = ((3.3 - voltage) / voltage) * RL`
     - Ratio calculation: `ratio = Rs / R0`
     - PPM conversion: `ppm = 1012.7 * pow(ratio, -2.518)`
     - The formula is based on MQ-2 sensitivity characteristics for LPG detection
     - PPM values are clamped between 0 and 10,000 for reasonable output

   - **DHT22 Environmental Data**:
     - Temperature reading with calibration offset applied
     - Humidity reading with calibration offset and bounds checking (0-100%)
     - Averaging multiple samples (default 5) for stability
     - Retry mechanisms for invalid readings (up to 3 attempts)
     - Advanced method: `readBothWithAveragingAndRetry()` for maximum accuracy

2. **Air Quality Classification**
   The system classifies air quality based on PPM thresholds:
   - **Excellent** (< 200 PPM): Very low combustible gas concentration
   - **Good** (200-500 PPM): Low levels of combustible gases
   - **Moderate** (500-1000 PPM): Moderate levels of combustible gases
   - **Poor** (1000-2000 PPM): High levels, potential safety concern
   - **Very Poor** (2000-5000 PPM): Very high levels, immediate concern
   - **Hazardous** (> 5000 PPM): Dangerous levels of combustible gases

3. **Data Validation and Error Handling**
   - ADC readings validated against physical limits (0-4095 for ESP32 ADC)
   - Resistance calculations protected against division by zero or near zero values
   - PPM values limited to reasonable range (0-10000) to handle extreme sensor readings
   - Temperature/humidity readings validated for reasonableness
   - Invalid DHT readings handled with retry and averaging mechanisms
   - Sensor calibration validation to ensure R0 value is reasonable

4. **Data Processing Pipeline**
   The system follows a specific order of data processing:
   ```
   Raw Sensor Reading → Validation → Conversion → Calibration → Classification → Storage
   ```

5. **Data Consistency and Integrity**
   - Global variables are updated atomically where possible
   - Temperature and humidity values are cached after reading to ensure consistency
   - PPM and quality values are updated together to maintain synchronization
   - Last reading timestamps are maintained for timing consistency

### Data Transmission and Communication

1. **MQTT Data Structure**
   Sensor data is transmitted in JSON format with timestamp:
   ```json
   {
     "device_id": "esp32_01",
     "ppm": 450.2,
     "quality": "Moderate",
     "relay_state": "ON",
     "alarm_state": "INACTIVE",
     "temperature": 23.5,
     "humidity": 65.2,
     "timestamp": "2023-12-09T10:30:00Z"
   }
   ```

2. **Command Processing Pipeline**
   The system processes incoming commands through the following flow:
   - MQTT message received via callback
   - JSON deserialization with error checking
   - Command validation and parameter checking
   - Execution of appropriate action
   - Status logging and feedback

3. **Command Types and Processing**
   - `{"relay_state": "ON"|"OFF"}` - Control external devices via relay
     - Validates state parameter
     - Updates internal relay state variable
     - Controls physical relay output with debouncing
   - `{"sampling_interval": value}` - Change sensor reading frequency
     - Validates interval is between 1-300 seconds
     - Updates samplingInterval variable
     - Provides feedback in serial output
   - `{"oled_message": "text"|"CLEAR"}` - Display custom message on OLED
     - Sets custom message variable and timestamp
     - Initiates immediate display update
     - Handles special "CLEAR" command to return to normal display

4. **Data Synchronization**
   - Sensor readings are synchronized with display updates
   - MQTT transmission intervals are independent of sensor reading intervals
   - Command processing does not block sensor reading operations
   - Alarm state is updated continuously regardless of other operations

5. **Connection Management**
   - Automatic MQTT reconnection with 10-second backoff
   - Periodic device status updates (online/offline) every 30 seconds
   - Connection health monitoring through continuous loop operation
   - Graceful handling of network disconnections with local operation
   - Retransmission of data upon reconnection if network was temporarily lost

6. **Data Storage and Memory Management**
   - Sensor readings stored in global variables for access by different system components
   - Dynamic JSON document creation for transmission with 512-byte buffer
   - Memory-efficient processing with local variable scope
   - Free heap monitoring for memory usage tracking

## Sensor Initialization and Calibration

### MQ-2 Sensor Calibration Process

The MQ-2 sensor requires proper calibration to establish a baseline resistance (R0) in clean air. This is critical for accurate gas detection:

1. **Preheating Phase**
   - 3-second warmup period to stabilize sensor (reduced from standard 60 seconds for faster deployment)
   - Visual feedback during warmup process via OLED display
   - Preparation for accurate calibration after stabilization
   - Sets sensor pin to INPUT mode for analog reading

2. **Calibration Procedure**
   - Take 20 averaged readings from sensor in clean air environment
   - Apply 10ms delay between readings for stability
   - Calculate average voltage from sensor output using formula: `avgVoltage = sum(readings) / 20`
   - Compute sensor resistance using formula: `Rs = ((3.3 - voltage) / voltage) * RL`
   - Establish baseline R0 value using formula: `R0 = Rs / 1.0` (for H2 in clean air)
   - Store R0 value with validation to ensure it's in reasonable range
   - Provide detailed feedback via serial and OLED display

3. **Calibration Validation**
   - Verify R0 value is within expected range (typically 1-100 kΩ depending on environment)
   - Confirm sensor response to changing conditions during testing
   - Store calibration data persistently for use in PPM calculations
   - Display R0 value for reference and troubleshooting

4. **Quick Warmup Implementation**
   - Reduces initial warmup time from 60 seconds to 3 seconds for faster deployment
   - Maintains accuracy by using multiple sample averaging during calibration
   - Provides user feedback during warmup with progress indicators
   - Ensures sensor is ready for accurate readings as quickly as possible

5. **Safety and Accuracy Measures**
   - Checks for potential division by zero when calculating resistance
   - Includes validation for extremely low voltage readings
   - Provides feedback about calibration environment requirements
   - Maintains separate R0 value for continued accuracy over time

### DHT22 Sensor Initialization and Reliability Measures

The DHT22 sensor initialization and ongoing reliability are ensured through multiple measures:

1. **Initialization Process**
   - Initialize DHT library with pin (GPIO 14) and sensor type (DHT22)
   - Verify sensor communication with initial test reading
   - Store initial values of temperature and humidity as defaults
   - Provide initialization status feedback

2. **Reading Averaging Methods**
   - **Simple Averaging**: Take 5 consecutive readings with 50ms delay between each
   - **Advanced Averaging**: `readTemperatureWithAveraging()` and `readHumidityWithAveraging()` methods
   - Automatic rejection of NaN (Not-a-Number) readings
   - Calculation of average from only valid readings

3. **Retry Mechanism**
   - Up to 3 retry attempts for failed temperature or humidity readings
   - 250ms delay between retry attempts to allow sensor recovery
   - `readTemperatureWithRetry()` and `readHumidityWithRetry()` methods
   - Fallback to basic reading if averaging method fails

4. **Advanced Reading Method**
   - `readBothWithAveragingAndRetry()` combines multiple approaches
   - Takes multiple samples with 50ms delay between readings
   - Performs averaging of valid readings
   - Implements retry mechanism for both temperature and humidity
   - Returns status of operation success/failure

5. **Calibration Application**
   - **Temperature**: Apply offset correction (-2.0°C default) to compensate for sensor bias
   - **Humidity**: Apply offset correction (+5.0% default) and enforce bounds (0-100%)
   - Store calibrated values for consistency
   - Validation to ensure humidity remains within 0-100% range

6. **Environmental Adaptation**
   - Compensate for sensor variations based on calibration data
   - Apply environment-specific corrections based on configuration
   - Validate readings against reasonable ranges
   - Provide feedback for sensor performance monitoring

7. **Error Handling and Recovery**
   - Detection of invalid readings (NaN values)
   - Automatic retry mechanism for failed readings
   - Fallback to basic reading methods when advanced methods fail
   - Logging of failed reading attempts for troubleshooting

### Sensor Coordination and Timing

1. **Sequential Reading Process**
   - Read MQ-2 gas sensor first (analog reading)
   - Read DHT22 sensor second (requires specific timing protocol)
   - Maintain consistent timing between readings
   - Store all values before proceeding to processing

2. **Reading Frequency Coordination**
   - Both sensors read at the same sampling interval (default 5 seconds)
   - Independent processing of each sensor's data
   - Synchronized storage for transmission and display
   - Maintain timing relationships between sensor readings

3. **Validation Sequence**
   - Validate MQ-2 reading range and reasonableness
   - Validate DHT22 temperature and humidity ranges
   - Check for sensor communication errors
   - Log validation results for system monitoring

## Alarm and Relay Control Logic

### Alarm System Design

The alarm system operates independently of the relay system with dedicated features for safety and alerting:

1. **Alarm Trigger Conditions**
   - **Activation**: Alarm activates when PPM ≥ 1000 (hazardous gas level)
   - **Deactivation**: Alarm deactivates when PPM < 500 (hysteresis prevents oscillation)
   - **Dual Alerting**: Provides both visual (LED) and audible (buzzer) alerts
   - **Continuous Monitoring**: Operates continuously during system runtime
   - **Independent Operation**: Functions separately from relay control system

2. **Alarm Output Control**
   - **LED Control**: LED blinking at 500ms intervals when alarm active
   - **Buzzer Control**: Buzzer beeping at 500ms intervals when alarm active
   - **Independent Operation**: Not dependent on relay state for functionality
   - **Direct GPIO Control**: Immediate response via direct GPIO pin control
   - **Coordinated Pattern**: LED and buzzer operate in synchronized 50% duty cycle

3. **Alarm State Management**
   - **Internal Tracking**: Maintains separate alarm state variable (true/false)
   - **Visual Feedback**: Continuously updated status through both hardware and display
   - **Automatic Updates**: `alarm.update()` method called every main loop iteration
   - **Status Persistence**: Maintains alarm state across different system operations

4. **Alarm Integration with Display**
   - **Visual Indication**: Shows "ALARM!" text on OLED display when active
   - **Status Indicator**: Dedicated status indicator showing active alarm
   - **Priority Display**: Alarm status integrated into primary air quality display
   - **Real-time Updates**: Updates displayed status in real-time with sensor readings

5. **Alarm Timing and Updates**
   - **Blink Interval**: 500ms ON, 500ms OFF for both LED and buzzer
   - **Update Frequency**: Checked and updated every main loop iteration (every 100ms)
   - **Last Update Tracking**: Maintains timestamps for precise timing control
   - **Timer Management**: Uses `millis()` for non-blocking timing operations

### Relay Control Logic

The relay system provides control for external devices with safety and reliability features:

1. **Relay State Management**
   - **Independent Operation**: Functions separately from alarm system
   - **Remote Control**: Controllable via IoT commands (MQTT)
   - **Physical Control**: Direct GPIO control with debouncing (100ms)
   - **Current State Tracking**: Maintains internal state variable for consistency
   - **Hardware Mapping**: Controls relay on GPIO 26 with active-low logic

2. **Relay Control Methods**
   - **State Setting**: `setState(bool state)` for direct control with debouncing
   - **Power Control**: `turnOn()` and `turnOff()` methods for explicit commands
   - **Toggle Function**: `toggle()` method for switching current state
   - **Pulse Function**: `pulse(unsigned long duration)` for temporary activation
   - **Status Query**: `isOn()`, `isOff()`, and `getState()` for state verification

3. **Integration with Air Quality**
   - **Manual Control**: Can be controlled independently of air quality readings
   - **Automatic Options**: Configurable to respond to air quality levels via commands
   - **Manual Override**: IoT commands can override any automatic behavior
   - **Pulse Capability**: Allows temporary activation for specific durations

4. **Safety and Reliability Features**
   - **Debounce Protection**: 100ms debounce delay prevents relay oscillation
   - **Timing Enforcement**: Prevents rapid switching that could damage relay
   - **Status Feedback**: Provides logging and IoT feedback about relay operations
   - **State Verification**: Confirms relay state matches intended state
   - **Safe Initialization**: Initializes to OFF state during system startup

5. **Relay Timing and Operation**
   - **Debounce Timing**: 100ms minimum interval between relay state changes
   - **Pulse Control**: Configurable duration for temporary relay activation
   - **Command Response**: Reacts to IoT commands within 5-second command check cycle
   - **State Persistence**: Maintains commanded state until changed by new command

### Interaction Between Alarm and Relay Systems

1. **Independent Operation Design**
   - **Separate Hardware**: Alarm (LED/buzzer) and relay control separate GPIO pins
   - **Distinct Purposes**: Alarm for user alerting, relay for device control
   - **Independent Logic**: Trigger conditions and states managed separately
   - **Parallel Operation**: Both systems can function simultaneously

2. **Shared Sensor Input**
   - **Common Trigger**: Both systems can respond to MQ-2 sensor readings
   - **Divergent Thresholds**: Different PPM thresholds (alarm: 1000, deactivation: 500)
   - **Coordinated Response**: System can alert and control devices based on same data
   - **Independent Thresholds**: Each system can have different sensitivity levels

3. **Display Integration**
   - **Status Indication**: Both alarm and relay states shown on OLED display
   - **Visual Separation**: Clear distinction between alarm status and relay status
   - **Combined View**: Air quality display shows both system states simultaneously
   - **Priority Handling**: Alarm status takes priority during hazardous conditions

4. **IoT Command Coordination**
   - **Separate Commands**: Different MQTT commands for alarm and relay control
   - **Combined Status**: Single status update includes both alarm and relay states
   - **Independent Control**: Commands can control each system separately
   - **Status Reporting**: Both states reported in sensor data transmission

### System Safety Features

1. **Fail-Safe Design**
   - **Default States**: Both systems initialize to safe states during startup
   - **Error Recovery**: Automatic recovery from sensor reading failures
   - **Connection Independence**: Local operation during network outages
   - **Graceful Degradation**: System continues to function if one component fails

2. **Oscillation Prevention**
   - **Hysteresis Implementation**: Alarm activation (1000 PPM) and deactivation (500 PPM) at different thresholds
   - **Debounce Circuits**: Both digital switching (relay) and software timing (alarm)
   - **Filtering Logic**: Prevents rapid switching due to sensor noise
   - **Timing Validation**: Minimum intervals enforced for all state changes

3. **Status Monitoring**
   - **Continuous Feedback**: Real-time status updates to IoT dashboard
   - **Local Indication**: Immediate local feedback through displays and alerts
   - **System Logging**: Comprehensive logging of state changes and events
   - **Health Monitoring**: Regular checks of system component status

## Error Handling and System Robustness

### Connection Management
- Automatic reconnection to WiFi and MQTT
- Graceful handling of network outages
- Local operation during connectivity issues

### Sensor Monitoring
- Continuous validation of sensor readings
- Automatic recovery from sensor errors
- Fallback mechanisms for failed readings

### Display Management
- Custom message timeout (10 seconds)
- Priority display during critical events
- Automatic return to normal display after message timeout

## Conclusion

The ESP32 Air Quality Monitor implements a comprehensive logic design that balances real-time monitoring, data accuracy, and system reliability. The modular architecture allows for independent operation of sensing, alarming, and control functions while maintaining effective coordination between components. The timing system optimizes for both responsiveness and resource efficiency, with configurable parameters to adapt to different monitoring requirements.