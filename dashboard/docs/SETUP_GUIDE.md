# Air Quality Monitor System - Complete Setup Guide

This guide covers how to set up and run the complete Air Quality Monitor system, including both the ESP32 device and the web dashboard.

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Setting Up the Web Dashboard](#setting-up-the-web-dashboard)
4. [Setting Up the ESP32 Device](#setting-up-the-esp32-device)
5. [Connecting Everything Together](#connecting-everything-together)
6. [Troubleshooting](#troubleshooting)

## System Overview

The Air Quality Monitor system consists of:
- An ESP32 microcontroller with air quality sensors
- A web dashboard built with Next.js
- Firebase Authentication for user management
- MQTT bridge for device communication
- The ESP32 sends air quality readings via MQTT
- The MQTT bridge forwards data to the web dashboard
- The web dashboard displays real-time data and provides control interface

## Prerequisites

### For the Web Dashboard:
- Node.js (v16 or higher)
- npm or yarn
- Git
- Firebase account (for authentication)

### For the MQTT Bridge:
- Node.js (v16 or higher)
- npm (for mqtt and express dependencies)

### For the ESP32 Device:
- ESP32 development board
- MQ135 or compatible air quality sensor
- Breadboard and jumper wires
- Arduino IDE or PlatformIO
- ESP32 board support installed in Arduino IDE
- Internet connectivity for MQTT communication

### For MQTT Setup:
- Access to MQTT broker (default: broker.hivemq.com)
- Internet connectivity

## Setting Up the Web Dashboard

### Step 1: Clone or Download the Dashboard Code
```bash
git clone <your-dashboard-repository>
# Or download as ZIP and extract
```

### Step 2: Install Dependencies
```bash
cd dashboard
npm install
# or
yarn install
```

### Step 3: Set up Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" and click on the web app icon
5. Copy the Firebase configuration
6. Enable Authentication in Firebase console

### Step 4: Configure Environment Variables
Create a `.env.local` file in the dashboard root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### Step 5: Install Bridge Dependencies
From the project root directory, install MQTT bridge dependencies:
```bash
npm install mqtt express
```

### Step 6: Run the Development Server
```bash
npm run dev
# or
yarn dev
```

The dashboard should now be running at `http://localhost:3000`

### Step 7: Start the MQTT Bridge
In a separate terminal, from the project root:
```bash
BRIDGE_PORT=3002 node mqtt-bridge.js
```

The bridge will:
- Connect to MQTT broker
- Listen for sensor data
- Forward data to the dashboard
- Provide command interface at `http://localhost:3002`

## Setting Up the ESP32 Device

### Step 1: Install Arduino IDE or Use PlatformIO
- Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
- OR install VS Code with PlatformIO extension

### Step 2: Install ESP32 Board Support
In Arduino IDE:
1. Go to File > Preferences
2. Add `https://dl.espressif.com/dl/package_esp32_index.json` to Additional Board Manager URLs
3. Go to Tools > Board > Boards Manager
4. Search for "ESP32" and install the package by Espressif Systems

### Step 3: Install Required Libraries
In Arduino IDE Library Manager (Tools > Manage Libraries):
- Firebase Arduino by Firebase
- Adafruit Unified Sensor
- DHT sensor library (if using DHT sensor)
- WiFi Manager (optional, for easier WiFi configuration)

### Step 4: Configure ESP32
Update your ESP32 code with WiFi and MQTT configuration.

### Step 6: Upload Code to ESP32
1. Connect your ESP32 to your computer via USB
2. Select the correct board (Tools > Board > ESP32 Dev Module)
3. Select the correct port (Tools > Port)
4. Upload the code

### ESP32 Code Requirements:
- Include WiFi and MQTT libraries
- Configure WiFi credentials
- Set up MQTT client with broker connection
- Publish sensor data to MQTT topic every 5 seconds
- Subscribe to command topic for relay control
- Handle incoming commands from dashboard

## Connecting Everything Together

### Step 1: Start the MQTT Bridge
The MQTT bridge acts as a middleware between your ESP32 device and the web dashboard:
```bash
# From the project root directory
BRIDGE_PORT=3002 node mqtt-bridge.js
```
The bridge will:
- Connect to the MQTT broker (default: mqtt://broker.hivemq.com:1883)
- Listen for sensor data on topic: `airquality/esp32_01/sensor`
- Forward data to the dashboard API at `http://localhost:3000`
- Provide command interface at `http://localhost:3002`

### Step 2: Verify ESP32 Connection
1. Open Serial Monitor in Arduino IDE (115200 baud rate)
2. Restart ESP32 and verify it connects to WiFi
3. Check that it successfully connects to MQTT broker
4. Verify the bridge receives messages (check bridge console output)
5. Confirm sensor data is being published to MQTT topic

### Step 3: Run the Dashboard
1. Ensure the web dashboard is running:
```bash
cd dashboard
npm run dev
```
2. The dashboard should now display real data from your ESP32 device
3. You can also use the simulation mode in the dashboard for testing

### Step 4: Test the Complete System
1. Check that the bridge console shows received sensor messages
2. Verify the dashboard displays real-time data
3. Test relay control from the dashboard interface

## Running the System

### For Development:
#### Web Dashboard:
```bash
cd dashboard
npm run dev
```

#### MQTT Bridge:
```bash
# From project root
BRIDGE_PORT=3002 node mqtt-bridge.js
```

#### ESP32:
- Upload the code to your ESP32 device
- Monitor the Serial output to verify successful connections
- Ensure ESP32 publishes to MQTT topic: `airquality/esp32_01/sensor`

### For Production:
#### Web Dashboard Deployment:
The dashboard is configured for Vercel deployment (see `vercel.json`). To deploy:
```bash
npm install -g vercel
vercel --prod
```

#### ESP32:
- Connect the ESP32 to power and ensure it's in range of your WiFi
- The device will run continuously and send data to Firebase

## Data Format

### MQTT Message Format:
Sensor data should include: device_id, ppm, quality, relay_state, timestamp

### MQTT Topics:
- **Sensor Data**: `airquality/esp32_01/sensor`
- **Commands**: `airquality/esp32_01/command`
- **Status**: `airquality/esp32_01/status`

### Command Format:
Commands should include relay control actions

## Troubleshooting

### Web Dashboard Issues:
- **Dashboard shows "Loading sensor data..." indefinitely**: 
  - Check that the MQTT bridge is running and receiving data
  - Verify the bridge console shows received messages
  - Check browser console for error messages
  - Ensure dashboard API is accessible at `http://localhost:3000`

- **"Firebase not initialized" error**:
  - Ensure all Firebase environment variables are correctly set
  - Restart the development server after changing environment variables

### MQTT Bridge Issues:
- **"Error forwarding sensor data: fetch failed"**:
  - Ensure the web dashboard is running on port 3000
  - Check that the dashboard API endpoint `/api/sensor-data` exists
  - Verify the bridge is using the correct dashboard URL

- **"MQTT connection error"**:
  - Check internet connectivity
  - Verify MQTT broker URL is correct
  - Ensure firewall isn't blocking MQTT connections (port 1883)

### ESP32 Issues:
- **Cannot connect to WiFi**:
  - Verify WiFi credentials in configuration
  - Check that ESP32 is in range of the WiFi network
  - Verify WiFi network doesn't require captive portal login

- **MQTT connection failed**:
  - Check MQTT broker configuration in ESP32 code
  - Verify internet connectivity
  - Ensure MQTT broker is accessible (default: broker.hivemq.com)

- **No sensor readings**:
  - Verify sensor connections to ESP32
  - Check sensor power supply (3.3V or 5V as required)
  - Verify sensor code is correctly reading values
  - Check Serial Monitor for sensor output

### MQTT Issues:
- **Broker connection refused**:
  - Check internet connectivity
  - Verify broker URL is correct
  - Try alternative MQTT brokers (test.mosquitto.org, mqtt.eclipseprojects.io)

- **Messages not received**:
  - Verify topic names match exactly
  - Check ESP32 is publishing to correct topic
  - Ensure bridge is subscribed to correct topics

## Features

### Dashboard Features:
- Real-time air quality monitoring
- Historical data visualization
- Device status monitoring
- Relay control interface
- Alert notifications
- Firebase Authentication system
- Responsive design for all devices

### MQTT Bridge Features:
- Real-time message forwarding
- Bidirectional communication
- Command relay between dashboard and ESP32
- Error handling and logging
- RESTful API endpoints

### ESP32 Features:
- Continuous air quality monitoring
- WiFi connectivity with auto-reconnection
- MQTT client for data transmission
- Relay control based on air quality readings
- Command reception and processing
- Low power consumption modes

## Security Considerations

- Use Firebase Authentication for user management
- Use authenticated MQTT brokers for production
- Implement TLS/SSL for MQTT communication
- Secure the dashboard API endpoints
- Use environment variables for sensitive configuration
- Consider implementing device authentication
- Encrypt sensitive data in transit
- Monitor for unauthorized MQTT connections

## Updating the System

### Dashboard Updates:
```bash
git pull origin main
npm install
npm run dev
```

### ESP32 Updates:
- Modify the code in Arduino IDE
- Upload the updated code to ESP32
- Test the changes

## Support

For additional help, check:
- The project's GitHub issues page
- Arduino and ESP32 community forums
- MQTT documentation (mqtt.org)
- Next.js documentation
- Contact the project maintainers

## Quick Start Commands

```bash
# Install bridge dependencies
npm install mqtt express

# Configure Firebase authentication
# Set up .env.local with Firebase config

# Start dashboard
cd dashboard && npm run dev

# Start bridge (from project root)
BRIDGE_PORT=3002 node mqtt-bridge.js

# Access dashboard
http://localhost:3000
```