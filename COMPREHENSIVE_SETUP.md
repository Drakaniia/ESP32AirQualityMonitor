# ESP32 Air Quality Monitor - Comprehensive Setup Guide

A comprehensive IoT system for real-time air quality monitoring using ESP32, MQ-135 sensor, and Firebase integration with a responsive web dashboard.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Hardware Requirements](#hardware-requirements)
3. [Hardware Connections](#hardware-connections)
4. [Software Requirements](#software-requirements)
5. [Firebase Setup](#firebase-setup)
6. [ESP32 Firmware Setup](#esp32-firmware-setup)
7. [Web Dashboard Setup](#web-dashboard-setup)
8. [Project Configuration](#project-configuration)
9. [Building and Uploading](#building-and-uploading)
10. [Troubleshooting](#troubleshooting)
11. [System Architecture](#system-architecture)

## Project Overview

This project consists of:
- **ESP32 Device**: Reads air quality data from MQ-135 sensor and uploads to Firebase
- **Web Dashboard**: Real-time monitoring and device control via Next.js application
- **Firebase Backend**: Stores sensor data and handles device commands

## Hardware Requirements

### Components
- ESP32 Dev Board
- MQ-135 Gas Sensor
- 0.96" OLED Display (I2C, SSD1306)
- 5V Relay Module (optional)
- Breadboard and Jumper Wires
- Micro USB Cable for programming

### Pin Connection Table

| Component | Component Pin | Wire Color (Suggested) | ESP32 Pin | Function |
|-----------|---------------|------------------------|-----------|----------|
| **OLED Display** |
| OLED | VCC | Red | 3.3V | Power Supply |
| OLED | GND | Black | GND | Ground |
| OLED | SDA | Blue | GPIO21 | I2C Data |
| OLED | SCL | Yellow | GPIO22 | I2C Clock |
| **MQ-135 Sensor** |
| MQ-135 | VCC | Red | 5V | Power Supply |
| MQ-135 | GND | Black | GND | Ground |
| MQ-135 | AOUT | Green | GPIO34 | Analog Output |
| **Relay Module** (optional) |
| Relay | VCC | Red | 5V | Power Supply |
| Relay | GND | Black | GND | Ground |
| Relay | IN | Orange | GPIO26 | Control Signal |

## Software Requirements

### Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (for PlatformIO)

### Development Tools
- **PlatformIO IDE** (VS Code extension) - for ESP32 development
- **Firebase CLI** (optional) - for Firebase deployment
- **npm** - for web dashboard development

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup process
3. Choose a project name and accept terms
4. Enable Google Analytics if desired
5. **Important**: Choose the Blaze plan (pay-as-you-go) for Firestore real-time updates

### 2. Enable Firebase Services
1. In Firebase Console, enable these services:
   - Firestore Database
   - Realtime Database
   - Authentication
   - Cloud Functions (if needed)

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "</>" to add a web app
4. Note down the configuration values (you'll need these later)

### 4. Set up Security Rules
1. Copy the rules from `firebase/firestore.rules` and `firebase/database.rules.json`
2. Apply these to your Firebase project:
   - Firestore Rules: Firebase Console → Firestore Database → Rules
   - Realtime Database Rules: Firebase Console → Realtime Database → Rules

## ESP32 Firmware Setup

### 1. Install PlatformIO IDE
1. Install VS Code if you haven't already
2. Install PlatformIO IDE extension in VS Code
   - Go to Extensions tab
   - Search for "PlatformIO IDE"
   - Install the official PlatformIO IDE extension

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/ESP32AirQualityMonitor.git
cd ESP32AirQualityMonitor
```

### 3. Install PlatformIO Dependencies
The `platformio.ini` file already contains required libraries:
- Adafruit SSD1306
- Adafruit GFX Library
- ArduinoJson

These will be automatically installed when you open the project in PlatformIO.

## Web Dashboard Setup

### 1. Install Node.js Dependencies
```bash
cd dashboard
npm install
```

### 2. Set up Environment Variables
1. Copy the example environment file:
```bash
# On Windows
copy .env.example .env.local

# On macOS/Linux
cp .env.example .env.local
```

2. Update `.env.local` with your Firebase configuration from Step 3 of Firebase Setup:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

## Project Configuration

### 1. Configure ESP32 Firmware
Edit `src/config.h` with your specific settings:

```cpp
// WiFi Configuration
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase Configuration
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
#define DEVICE_ID "esp32_01"  // Unique identifier for your device
```

### 2. Calibrate MQ-135 Sensor (Optional)
The sensor calibration value is defined as:
```cpp
#define MQ135_R0 76.63  // Clean air resistance value (calibrate as needed)
```

To calibrate:
1. Place the sensor in clean air for 24 hours
2. Upload the calibration code and read the R0 value
3. Update the value in `config.h`

## Building and Uploading

### ESP32 Firmware

#### Method 1: Using PlatformIO IDE in VS Code
1. Open the project folder in VS Code
2. Connect your ESP32 via USB
3. Click the checkmark icon in the PlatformIO toolbar to build
4. Click the arrow icon to upload to ESP32

#### Method 2: Using Command Line
```bash
# Build the project
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

### Web Dashboard

#### Development Server
```bash
cd dashboard
npm run dev
```
Visit `http://localhost:3000` to view the dashboard.

#### Production Build
```bash
cd dashboard
npm run build
npm run start
```

## System Architecture

```
ESP32 (MQ-135 + OLED + Relay)
       │ WiFi HTTPS (JSON)
       ▼
Firebase Backend:
   • Firestore DB (sensor data)
   • RTDB (device commands)
   • Firebase Auth (dashboard login)
       │
       ▼
Responsive Web Dashboard (Next.js / React)
```

### Data Flow
1. ESP32 reads sensor data every 5 seconds
2. ESP32 uploads data to Firebase Firestore every 30 seconds
3. Web dashboard retrieves data from Firestore in real-time
4. Commands from dashboard sent via Realtime Database
5. ESP32 checks for commands every 10 seconds

## Air Quality Levels

The system categorizes air quality based on PPM readings:
- **Excellent**: < 50 PPM
- **Good**: 50-100 PPM
- **Moderate**: 100-200 PPM
- **Poor**: 200-400 PPM
- **Very Poor**: 400-800 PPM
- **Hazardous**: > 800 PPM

## Troubleshooting

### ESP32 Issues
- **Can't upload**: Check USB connection, try different USB cable, ensure correct COM port
- **WiFi connection fails**: Verify credentials in `config.h`, ensure ESP32 is in range
- **No data in Firebase**: Check Firebase configuration, verify device is online

### Dashboard Issues
- **No data showing**: Ensure ESP32 is uploading data, check Firebase security rules
- **Authentication fails**: Verify Firebase configuration in `.env.local`

### Common Solutions
- Check serial monitor output for error messages
- Verify all hardware connections
- Ensure Firebase Blaze plan is active
- Confirm CORS settings if deploying to web

## Development

### Adding Features
The project is modular, with separate files for:
- `wifi_manager.*` - WiFi connectivity
- `firebase_client.*` - Firebase communication
- `sensor_mq135.*` - Sensor reading and processing
- `oled_display.*` - OLED display management
- `relay_controller.*` - Relay control

### Testing Changes
1. Make changes in the appropriate module
2. Build and upload ESP32 firmware
3. Test functionality via serial monitor
4. Verify data appears in dashboard

## Deployment

### For ESP32
- No additional deployment needed beyond uploading firmware
- Ensure stable power supply and WiFi connection

### For Web Dashboard
- Deploy to Vercel: Follow instructions in `VERCEL_DEPLOYMENT.md`
- Alternative hosting: Any Next.js-compatible hosting service

## Support

If you encounter issues:
1. Check the Troubleshooting section
2. Review hardware connections
3. Monitor serial output (115200 baud)
4. Check Firebase console for errors
5. Verify dashboard configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.