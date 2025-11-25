# Relay in ESP32 Air Quality Monitor

## What is a Relay?

In the ESP32 Air Quality Monitor project, a **relay** is a hardware component that acts as an electrically controlled switch. It's a device that can turn electrical circuits on and off remotely. In the context of this dashboard application, the relay state can be either "ON" or "OFF".

## Purpose and Functionality

The relay in this air quality monitoring system serves as an **automated control mechanism** for external devices based on air quality readings.

### Automated Response
When air quality readings (like PPM levels) reach certain thresholds indicating poor air quality, the relay can automatically turn on to activate connected devices such as:
- Fans or exhaust systems
- Air purifiers
- Alarms or notification systems
- Ventilation systems

### Remote Control
The dashboard provides users with the ability to:
- Remotely control the relay state (turn it on/off) through the Control Panel
- Monitor the current relay status alongside air quality metrics
- Track when the relay has been activated based on sensor readings

### Integration with Monitoring
- The system continuously tracks and displays the relay state along with air quality metrics
- Users can see whether safety measures have been activated in real-time
- Historical data includes relay state information for analysis

### Simulation Features
The codebase includes simulation functionality where:
- The relay state is determined based on air quality levels
- Logic is implemented to turn on the relay for poor air quality conditions
- This allows for testing the system without physical hardware

## Technical Implementation

In the dashboard application, the relay is represented as a state variable with possible values:
- `"ON"` - Relay is active, connected devices are powered
- `"OFF"` - Relay is inactive, connected devices are not powered

The relay functionality is integrated throughout the application in components such as:
- Control Panel: For manual relay control
- Air Quality Card: For displaying relay status
- Safety Status: For showing system status
- Alert History: For logging relay events
- Chart Container: For visualizing relay states over time

## Use Cases

The relay enables automated responses to air quality issues:
- Automatic activation of exhaust fans when CO2 levels rise
- Turning on air purifiers during high pollution periods
- Activating alarm systems when hazardous levels are detected
- Controlling ventilation systems based on real-time air quality data