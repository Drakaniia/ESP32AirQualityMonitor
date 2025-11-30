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
- Firebase Realtime Database for data synchronization
- The ESP32 sends air quality readings to Firebase
- The web dashboard retrieves and displays the data in real-time

## Prerequisites

### For the Web Dashboard:
- Node.js (v16 or higher)
- npm or yarn
- Git
- A Firebase account

### For the ESP32 Device:
- ESP32 development board
- MQ135 or compatible air quality sensor
- Breadboard and jumper wires
- Arduino IDE or PlatformIO
- ESP32 board support installed in Arduino IDE

### For Firebase Setup:
- Google account
- Firebase account (free tier sufficient)

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

### Step 3: Set up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" and click on the web app icon
5. Copy the Firebase configuration

### Step 4: Configure Environment Variables
Create a `.env.local` file in the dashboard root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### Step 5: Run the Development Server
```bash
npm run dev
# or
yarn dev
```

The dashboard should now be running at `http://localhost:3000`

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

### Step 4: Configure WiFi Credentials
Create a `secrets.h` file in your ESP32 project with your WiFi credentials:
```cpp
#ifndef SECRETS_H
#define SECRETS_H

#define WIFI_SSID "your_wifi_network_name"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase configuration
#define FIREBASE_HOST "your-project-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your_firebase_database_secret"

#endif
```

### Step 5: Configure Firebase
1. In your Firebase project, go to Realtime Database
2. Create a new database in test mode (or configure rules appropriately)
3. The database will be accessible at `https://<project-id>.firebaseio.com`

### Step 6: Upload Code to ESP32
1. Connect your ESP32 to your computer via USB
2. Select the correct board (Tools > Board > ESP32 Dev Module)
3. Select the correct port (Tools > Port)
4. Upload the code

### Sample ESP32 Code Structure:
```cpp
#include "FirebaseESP32.h"
#include "secrets.h" // Your WiFi and Firebase credentials
#include <WiFi.h>

// Firebase configuration
FirebaseData firebaseData;
FirebaseJson json;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  
  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready()) {
    // Read sensor data
    float ppm = readAirQualitySensor();  // Your sensor reading function
    
    // Create JSON data
    json.set("device_id", "ESP32_AQ_MONITOR_01");
    json.set("ppm", ppm);
    json.set("quality", getAirQualityLevel(ppm));
    json.set("relay_state", getRelayState(ppm)); // ON/OFF based on air quality
    json.set("timestamp", getTimeStamp()); // Current timestamp
    
    // Send data to Firebase
    if (Firebase.setJSON(firebaseData, "/sensor_data", json)) {
      Serial.println("Data sent successfully");
    } else {
      Serial.println("Error sending data: " + firebaseData.errorReason());
    }
  }
  
  delay(5000); // Send data every 5 seconds
}
```

## Connecting Everything Together

### Step 1: Verify ESP32 Connection
1. Open Serial Monitor in Arduino IDE (115200 baud rate)
2. Restart ESP32 and verify it connects to WiFi
3. Check that it successfully sends data to Firebase

### Step 2: Check Firebase Database
1. Go to your Firebase Realtime Database
2. Verify that sensor data is appearing in the database

### Step 3: Run the Dashboard
1. Ensure the web dashboard is running
2. The dashboard should now display real data from your ESP32 device
3. You can also use the simulation mode in the dashboard for testing

## Running the System

### For Development:
#### Web Dashboard:
```bash
cd dashboard
npm run dev
```

#### ESP32:
- Upload the code to your ESP32 device
- Monitor the Serial output to verify successful connections

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

The system expects sensor data in this format in Firebase:
```json
{
  "device_id": "unique_device_identifier",
  "ppm": 250.5,
  "quality": "Poor",
  "relay_state": "ON",
  "timestamp": "2023-10-01T12:34:56.789Z"
}
```

## Troubleshooting

### Web Dashboard Issues:
- **Dashboard shows "Loading sensor data..." indefinitely**: 
  - Check that Firebase configuration in `.env.local` is correct
  - Verify that ESP32 is sending data to the same Firebase project
  - Check browser console for error messages

- **"Firebase not initialized" error**:
  - Ensure all Firebase environment variables are correctly set
  - Restart the development server after changing environment variables

### ESP32 Issues:
- **Cannot connect to WiFi**:
  - Verify WiFi credentials in `secrets.h`
  - Check that ESP32 is in range of the WiFi network
  - Verify WiFi network doesn't require captive portal login

- **"Error sending data to Firebase"**:
  - Check Firebase configuration in `secrets.h`
  - Verify Firebase Realtime Database rules allow writing
  - Ensure ESP32 can access the internet

- **No sensor readings**:
  - Verify sensor connections to ESP32
  - Check sensor power supply (3.3V or 5V as required)
  - Verify sensor code is correctly reading values

### Firebase Issues:
- **Rules blocking data**:
  - For development, set database rules to allow read/write:
  ```json
  {
    "rules": {
      ".read": true,
      ".write": true
    }
  }
  ```
  - For production, implement more restrictive rules

## Features

### Dashboard Features:
- Real-time air quality monitoring
- Historical data visualization
- Device status monitoring
- Relay control interface
- Alert notifications
- Authentication system
- Responsive design for all devices

### ESP32 Features:
- Continuous air quality monitoring
- WiFi connectivity with auto-reconnection
- Relay control based on air quality readings
- Data transmission to Firebase
- Low power consumption modes

## Security Considerations

- Change the default Firebase database rules for production
- Use Firebase Authentication to secure dashboard access
- Change default passwords and API keys
- Consider using Firebase Security Rules to restrict data access
- Encrypt sensitive data in transit

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
- Firebase documentation
- Contact the project maintainers