# ESP32 Air Quality Monitor - System Overview

The ESP32 Air Quality Monitor is a comprehensive IoT system designed for real-time air quality monitoring using ESP32 microcontroller, MQ-2 gas sensor, DHT11/DHT22 temperature/humidity sensor, MQTT communication protocol, and a responsive web dashboard with Firebase Authentication. The system consists of three main components: the ESP32 device which reads gas concentration levels using an MQ-2 sensor and environmental data using a DHT sensor, displaying information on a 0.96" OLED screen, the MQTT bridge which facilitates bidirectional communication between the device and the web dashboard, and the web dashboard built with Next.js that provides real-time monitoring, historical data visualization, and remote device control.

## Core Components

### ESP32 Device
The ESP32 device serves as the primary sensor node, featuring:
- **MQ-2 Gas Sensor**: Measures combustible gas concentration in PPM (parts per million)
- **DHT11/DHT22 Sensor**: Provides calibrated temperature and humidity readings with configurable accuracy
- **0.96" OLED Display**: Shows real-time air quality status, temperature, humidity, and relay status
- **Relay Control**: Allows remote switching of external devices based on sensor readings
- **WiFi Connectivity**: Enables reliable connection to the MQTT broker
- **MQTT Communication**: Publishes sensor data and receives commands from the dashboard

### MQTT Bridge
The Node.js-based MQTT bridge acts as an intermediary layer that:
- Subscribes to MQTT topics for real-time sensor data
- Exposes RESTful API endpoints for the web dashboard
- Facilitates bidirectional communication between the ESP32 device and web interface
- Handles command relaying from the dashboard to the device
- Provides robust error handling and logging capabilities

### Web Dashboard
The Next.js-powered web dashboard offers:
- Real-time visualization of gas concentration, temperature, and humidity
- Interactive historical charts with multiple time range options
- Remote device control capabilities (relay on/off, display messages)
- Firebase-based authentication for secure access
- Responsive design optimized for both desktop and mobile devices
- Color-coded air quality indicators based on calibrated PPM thresholds

## System Architecture

```
ESP32 (MQ-2 + DHT11/DHT22 + OLED + Relay)
       │ WiFi MQTT
       ▼
MQTT Broker (broker.hivemq.com)
       │
       ▼
MQTT Bridge (Node.js)
       │ HTTP API
       ▼
Responsive Web Dashboard (Next.js / React)
       │
       ▼
Firebase Authentication
```

## Data Flow

### Sensor Data Upload
1. ESP32 reads MQ-2 gas sensor data and DHT temperature/humidity data every configured interval
2. Device publishes calibrated sensor readings to MQTT broker
3. MQTT bridge receives and processes the data
4. Bridge forwards processed data to dashboard API endpoints
5. Dashboard updates in real-time with color-coded quality indicators

### Command Execution
1. User sends commands through dashboard interface (relay control, display messages)
2. Dashboard sends commands to MQTT bridge via API
3. Bridge publishes commands to MQTT broker
4. ESP32 subscribes to command topic and processes incoming commands
5. Device executes actions (relay switching, display updates) and reports status

## Air Quality Monitoring

### Gas Detection Levels
The system categorizes combustible gas levels based on PPM readings:

| Quality Level | PPM Range | Description |
|---------------|-----------|-------------|
| **Excellent** | < 200 PPM | Very low gas concentration |
| **Good** | 200-500 PPM | Low gas concentration |
| **Moderate** | 500-1000 PPM | Moderate gas concentration |
| **Poor** | 1000-2000 PPM | High gas concentration - safety concern |
| **Very Poor** | 2000-5000 PPM | Very high gas concentration - immediate danger |
| **Hazardous** | > 5000 PPM | Dangerous gas concentration - emergency |

### Temperature & Humidity Monitoring
The DHT11/DHT22 sensor provides environmental monitoring with the following characteristics:

| Feature | Specification |
|---------|---------------|
| **Sensor Types** | DHT11 (±2°C/±5% RH) or DHT22 (±0.5°C/±2% RH) |
| **Calibration** | Adjustable temperature and humidity offset compensation |
| **Stability** | Multi-sample averaging for reliable readings |
| **Operating Range** | Temperature: -40 to 80°C, Humidity: 0-100% RH |
| **Configurability** | Sensor type selection and calibration parameters |

## Key Features

### Real-time Monitoring

| Feature | Description |
|---------|-------------|
| **Gas Concentration** | Live readings with immediate color-coded quality indicators |
| **Environmental Data** | Calibrated temperature and humidity measurements |
| **Device Status** | Online/offline status monitoring |
| **Relay Control** | Real-time relay state indicators |
| **Timestamps** | Accurate timestamped sensor readings |

### Historical Analysis

| Feature | Description |
|---------|-------------|
| **Interactive Charts** | Multiple time ranges (24h, 7d, all-time) |
| **Trend Analysis** | Gas concentration trends with environmental context |
| **Statistical Data** | Average, minimum, and maximum value calculations |
| **Pattern Visualization** | Air quality pattern visualization |

### Device Control

| Feature | Description |
|---------|-------------|
| **Relay Control** | Remote activation/deactivation |
| **Sampling Intervals** | Adjustable intervals for gas, temperature, and humidity |
| **Display Control** | Custom message display on OLED |
| **Quick Actions** | One-click buttons for common operations |

### Security

| Feature | Description |
|---------|-------------|
| **Authentication** | Firebase Authentication for dashboard access |
| **API Security** | Secure communication between components |
| **Data Validation** | Input validation and sanitization |
| **Configuration Protection** | Environment variable protection for sensitive data |

## Technical Specifications

### Hardware Requirements

| Component | Description |
|-----------|-------------|
| **ESP32 Dev Board** | Main microcontroller unit |
| **MQ-2 Gas Sensor** | Combustible gas detection sensor |
| **DHT11 or DHT22** | Temperature and humidity sensor |
| **0.96" OLED Display** | I2C SSD1306 display for local monitoring |
| **5V Relay Module** | Optional relay for external device control |
| **Breadboard & Jumper Wires** | For prototyping connections |
| **Micro USB Cable** | For power and programming |

### Software Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **ESP32 Firmware** | Arduino framework with PlatformIO | Device firmware and sensor management |
| **MQTT Broker** | Public HiveMQ broker or custom deployment | Message routing between devices and bridge |
| **MQTT Bridge** | Node.js with MQTT.js library | Protocol translation and API layer |
| **Web Dashboard** | Next.js/React with Firebase integration | Real-time monitoring interface |
| **Authentication** | Firebase Authentication | Secure user access control |

### Communication Protocol

| Connection | Protocol | Description |
|------------|----------|-------------|
| **Device to Broker** | MQTT over WiFi | Sensor data publishing and command subscription |
| **Bridge to Broker** | MQTT | Message handling and routing |
| **Bridge to Dashboard** | RESTful HTTP API | Data forwarding and command interface |
| **Dashboard to User** | WebSockets | Real-time updates and live monitoring |

## Calibration and Configuration

The system includes configurable calibration parameters for accurate sensor readings:
- Gas sensor calibration (R0 value for MQ-2)
- Temperature offset compensation (DHT sensors)
- Humidity offset compensation (DHT sensors)
- Multi-sample averaging for stability
- Configurable thresholds for air quality categories

## Deployment and Scalability

The modular architecture enables:
- Easy deployment in various environments
- Support for multiple sensor nodes per MQTT broker
- Scalable dashboard architecture
- Configurable sampling intervals for power efficiency
- Remote management capabilities
- Real-time alerting for critical conditions

## Use Cases

This system is suitable for monitoring air quality in:
- Industrial environments
- Residential areas
- Laboratories
- Food processing facilities
- Anywhere combustible gas detection and environmental monitoring are required

## Source Code (ESP32 + Web)

The complete source code for this ESP32 Air Quality Monitor project, including both the ESP32 firmware and the web dashboard components, is available on GitHub at https://github.com/Drakaniia/ESP32AirQualityMonitor. The repository contains all necessary files for the ESP32 firmware including sensor reading logic (MQ-2 gas sensor and DHT11/DHT22 temperature/humidity sensors), MQTT communication, OLED display management, and relay control, along with the web dashboard built with Next.js that provides real-time monitoring, historical data visualization, and device control capabilities.

The combination of gas, temperature, and humidity monitoring provides comprehensive environmental awareness with real-time alerts and historical data analysis capabilities, making it a valuable tool for maintaining safe and healthy environments.