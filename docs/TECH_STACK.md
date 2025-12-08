# ESP32 Air Quality Monitor - Tech Stack Documentation

## Overview

This document details the technology stack used in the ESP32 Air Quality Monitor project, which combines hardware sensors, embedded firmware, and cloud connectivity to monitor air quality in real-time.

## Hardware Stack

### Microcontroller
- **ESP32**: Primary microcontroller with integrated WiFi capabilities
  - Provides processing power for sensor readings
  - Handles WiFi connectivity and IoT communications
  - Controls all peripheral devices

### Sensors
- **MQ-2 Gas Sensor**
  - Detects combustible gases (LPG, Butane, Propane, Methane, Alcohol, Hydrogen)
  - Analog output with 12-bit ADC input on ESP32
  - Requires calibration for accurate readings

- **DHT22 Temperature/Humidity Sensor**
  - Measures ambient temperature and humidity
  - Digital communication protocol
  - ±0.5°C accuracy for temperature, ±2% for humidity

### Display and Output
- **SSD1306 OLED Display (128x64)**
  - I2C interface for low pin usage
  - Shows real-time sensor readings and system status
  - Provides local user interface without requiring mobile app

- **Relay Module**
  - Controls external devices based on sensor readings
  - Provides electrical isolation for connected devices
  - Debounce protection to prevent oscillation

- **LED and Buzzer**
  - Visual and audible alert system
  - Direct GPIO control for immediate response
  - Configurable alert thresholds

## Software Stack

### Firmware Development
- **Platform**: Arduino framework for ESP32
  - Simplified development with standard libraries
  - Cross-platform compatibility
  - Large community support

- **Build System**: PlatformIO
  - Comprehensive development environment
  - Dependency management
  - Multi-platform support

### Programming Language
- **C/C++**: Primary development language for ESP32 firmware
  - Low-level hardware control
  - Memory-efficient execution
  - Direct register access when needed

### Core Libraries
- **WiFi.h**: ESP32 native WiFi library
  - Handles WiFi connection establishment
  - Network configuration and management
  - Signal strength monitoring

- **HTTPClient.h**: HTTP communication
  - REST API communication capabilities
  - JSON data transmission
  - Web request handling

- **ArduinoJson**: JSON processing
  - Parsing incoming commands
  - Serializing sensor data
  - Configuration management

- **Adafruit_SSD1306**: OLED display control
  - Graphics and text rendering
  - I2C communication handling
  - Memory management for display buffer

- **PubSubClient**: MQTT communication
  - Publish/subscribe messaging pattern
  - Asynchronous message handling
  - Connection management and reconnection

- **WebSocketsClient**: Real-time bidirectional communication
  - Low-latency data exchange
  - Direct device-to-dashboard communication
  - Fallback to alternative protocols

- **DHT.h**: DHT sensor library
  - Digital communication protocol handling
  - Reading validation and error handling
  - Calibration support

## Communication Protocols

### Primary Communication
- **MQTT (Message Queuing Telemetry Transport)**
  - Lightweight publish/subscribe messaging
  - Ideal for IoT devices with limited resources
  - Persistent connections with automatic reconnection
  - Quality of Service (QoS) levels for reliability

### Alternative Protocols
- **WebSocket**
  - Full-duplex communication over single TCP connection
  - Lower latency than HTTP polling
  - Real-time dashboard updates

- **HTTP**
  - RESTful API communication
  - Fallback communication method
  - Standard web protocols

### Internal Communication
- **I2C**: Inter-Integrated Circuit
  - Communication with OLED display
  - Two-wire serial protocol
  - Multi-device capability on same bus

## Cloud Infrastructure

### IoT Communication
- **HiveMQ Public Broker** (`broker.hivemq.com`)
  - Free MQTT broker for prototyping
  - Supports persistent connections
  - Standard MQTT protocol implementation

### Web Dashboard Hosting
- **Vercel**: Platform for frontend hosting
  - Static site generation
  - Serverless function support
  - Global CDN distribution

### Backend Services
- **Firebase**: Real-time database and authentication
  - Real-time data synchronization
  - Authentication and user management
  - Rules-based security

## Web Dashboard Technologies

### Frontend Framework
- **Next.js**
  - React-based framework
  - Server-side rendering capabilities
  - Static site generation
  - API route support

### Programming Language
- **TypeScript**
  - Type-safe JavaScript development
  - Better IDE support and refactoring
  - Compile-time error detection

### Styling
- **CSS/Tailwind CSS**
  - Responsive design
  - Component-based styling
  - Mobile-first approach

### Runtime Environment
- **Node.js**: JavaScript runtime for server-side operations
- **Yarn**: Package manager for dependency management

## Development Tools

### Version Control
- **Git**: Distributed version control system
  - Source code management
  - Collaboration support
  - Branching and merging capabilities

### Package Management
- **Yarn**: JavaScript package manager
  - Dependency resolution
  - Security updates
  - Consistent installations

## System Architecture

### Firmware Architecture
- **Object-Oriented Design**: Modular classes for different components
  - WiFiManager class
  - MQ2Sensor class
  - IoTProtocol class
  - OLEDDisplay class
  - RelayController class
  - AlarmController class
  - DHTSensor class

### Communication Architecture
- **Event-Driven System**: Asynchronous message handling
- **State Management**: Proper state tracking for sensors and devices
- **Error Handling**: Comprehensive error checking and recovery

### Data Flow
1. Sensor readings are processed locally
2. Data is validated and classified
3. Information is displayed on local OLED
4. Data is transmitted to MQTT broker
5. Dashboard receives and visualizes data
6. Commands flow back to device through MQTT

## Key Features Enabled by Tech Stack

1. **Real-time Monitoring**: MQTT enables instant data transmission
2. **Remote Control**: Bidirectional communication for device control
3. **Local Display**: Immediate feedback without network dependency
4. **Configurable Intervals**: Adjustable sampling and transmission rates
5. **Robust Connectivity**: Multiple fallback protocols and reconnection logic
6. **Security**: Encrypted communication and validated commands
7. **Scalability**: Design supports multiple devices and sensors

This tech stack provides a robust, scalable solution for air quality monitoring with a balance of local processing and cloud connectivity.