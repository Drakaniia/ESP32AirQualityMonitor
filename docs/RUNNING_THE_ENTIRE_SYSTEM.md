# Complete Guide: Running the Entire Air Quality Monitoring System

This comprehensive guide explains how to set up, configure, and run the complete air quality monitoring system with ESP32 and the web dashboard.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Hardware Setup](#hardware-setup)
3. [Firebase Setup](#firebase-setup)
4. [ESP32 Firmware Setup](#esp32-firmware-setup)
5. [Web Dashboard Setup](#web-dashboard-setup)
6. [Running the System](#running-the-system)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB available space
- **Internet**: Stable WiFi connection for ESP32

### Software Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- [PlatformIO IDE](https://platformio.org/install) (VS Code extension)
- [Firebase CLI](https://firebase.google.com/docs/cli) (optional, for deployment)

### Hardware Prerequisites
- ESP32 Dev Board
- MQ-2 Gas Sensor
- 0.96" OLED Display (I2C, SSD1306)
- 5V Relay Module (optional)
- Breadboard and Jumper Wires
- Micro USB Cable for programming

## Hardware Setup

### Wiring Connections

#### OLED Display (I2C)
| OLED Pin | ESP32 Pin | Color (Suggested) |
|----------|-----------|-------------------|
| VCC      | 3.3V      | Red               |
| GND      | GND       | Black             |
| SDA      | GPIO21    | Blue              |
| SCL      | GPIO22    | Yellow            |

#### MQ-2 Sensor
| MQ-2 Pin | ESP32 Pin | Color (Suggested) |
|------------|-----------|-------------------|
| VCC        | 5V        | Red               |
| GND        | GND       | Black             |
| AOUT       | GPIO34    | Green             |

#### Relay Module (optional)
| Relay Pin | ESP32 Pin | Color (Suggested) |
|-----------|-----------|-------------------|
| VCC       | 5V        | Red               |
| GND       | GND       | Black             |
| IN        | GPIO26    | Orange            |

### Testing Hardware Connections
1. Connect all components as per the wiring table
2. Power on ESP32 via USB
3. Verify OLED displays "ESP32 AQ Monitor" or similar startup message
4. Check that all connections are secure

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "air-quality-monitor")
4. **Important**: Select the Blaze plan (pay-as-you-go) for real-time features
5. Complete project creation

### 2. Enable Required Services
1. Go to your Firebase project
2. Enable these services:
   - **Firestore Database**: Create database in test mode
   - **Realtime Database**: Create database in test mode
   - **Authentication**: Enable Email/Password provider
   - Go to Authentication → Sign-in method → Enable Email/Password

### 3. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "</>" to add a web app
4. Register the app with a nickname (e.g., "web-dashboard")
5. Copy the configuration object values for later use

### 4. Set Up Security Rules
1. In your project directory, navigate to `firebase/` folder
2. Copy the contents of `firestore.rules` to Firestore Rules
   - Firebase Console → Firestore Database → Rules → Edit Rules
3. Copy the contents of `database.rules.json` to Realtime Database Rules
   - Firebase Console → Realtime Database → Rules → Edit Rules
4. Click "Publish" for both rule sets

## ESP32 Firmware Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ESP32AirQualityMonitor.git
cd ESP32AirQualityMonitor
```

### 2. Install PlatformIO Dependencies
1. Open the project folder in Visual Studio Code
2. PlatformIO will automatically install required libraries:
   - Adafruit SSD1306
   - Adafruit GFX Library
   - ArduinoJson
   - Firebase ESP Client

### 3. Configure ESP32 Firmware
Edit `src/config.h` with your specific settings:

```cpp
// WiFi Configuration
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase Configuration
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
#define DEVICE_ID "esp32_01"  // Unique identifier for your device

// Hardware Pin Configuration
#define MQ2_PIN 34            // Analog pin for MQ-2 sensor
#define RELAY_PIN 26          // Digital pin for relay module (optional)
#define OLED_SDA 21           // I2C SDA pin for OLED
#define OLED_SCL 22           // I2C SCL pin for OLED

// Calibration (optional - calibrate in clean air)
#define MQ135_R0 76.63        // Clean air resistance value (calculate as needed)
```

### 4. Build and Upload Firmware
Choose one of these methods:

**Method 1: Using PlatformIO IDE in VS Code**
1. Connect ESP32 to your computer via USB
2. Open PlatformIO Home in VS Code
3. Click the "Build" button (checkmark icon)
4. Click the "Upload" button (arrow icon)

**Method 2: Using Command Line**
```bash
# Build the project
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output to verify operation
pio device monitor
```

### 5. Verify ESP32 Operation
1. Open the serial monitor (115200 baud rate)
2. Observe the startup sequence:
   - WiFi connection
   - Firebase authentication
   - Sensor readings every 5 seconds
   - Data uploads to Firebase every 30 seconds

## Web Dashboard Setup

### 1. Navigate to Dashboard Directory
```bash
cd dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create `.env.local` file in the `dashboard/` directory:

```bash
# On Windows
copy .env.example .env.local

# On macOS/Linux
cp .env.example .env.local
```

### 4. Configure Environment Variables
Edit `.env.local` with your Firebase configuration from Step 3 of Firebase Setup:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

## Running the System

### 1. Verify ESP32 is Running
1. Ensure ESP32 is powered and connected to WiFi
2. Check serial monitor output:
   ```
   [WiFi] Connected to network
   [Firebase] Authentication successful
   [Sensor] PPM: 120, Quality: Moderate
   [Firestore] Data uploaded successfully
   ```
3. Verify data is appearing in Firebase Console:
   - Firestore Database → Collections → `readings`
   - Realtime Database → Data → `devices/esp32_01`

### 2. Start the Dashboard
```bash
cd dashboard
npm run dev
```

### 3. Access the Dashboard
1. Open your browser and navigate to `http://localhost:3000`
2. Create an account or sign in using Firebase Authentication
3. Verify that:
   - Real-time data appears on the dashboard
   - Charts update with new readings
   - Device status shows as "Online"
   - Control panel allows relay control

### 4. Test Complete System Integration
1. Observe real-time sensor data flowing from ESP32 → Firebase → Dashboard
2. Use the dashboard to send commands to ESP32:
   - Toggle relay state
   - Change sampling interval
   - Send OLED display message
3. Verify ESP32 responds to dashboard commands
4. Check that status updates appear in real-time

## Complete System Operation Commands

### ESP32 Commands
```bash
# Build project
pio run

# Upload firmware to ESP32
pio run --target upload
pio run -t upload

# Monitor serial output (115200 baud)
pio device monitor

# Clean build directory
pio run --target clean
```

### Dashboard Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
npm run start

# Check dependency vulnerabilities
npm audit
```

### Firebase Commands
```bash
cd firebase

# install firebase
npm install -g firebase-tools  

# Login to Firebase CLI
firebase login

# Deploy Firestore and RTDB rules
firebase deploy --only firestore,database

# Deploy hosting (dashboard)
firebase deploy --only hosting

# Emulate locally
firebase emulators:start
```

## Production Deployment

### Deploy Dashboard to Firebase Hosting
1. Initialize Firebase hosting in dashboard directory:
   ```bash
   cd dashboard
   firebase init hosting
   ```
2. Set public directory to `out` (Next.js build output)
3. Configure as single-page app: Yes
4. Build dashboard: `npm run build`
5. Deploy: `firebase deploy --only hosting`

### Deploy to Other Platforms
For Vercel deployment, follow instructions in `VERCEL_DEPLOYMENT.md`

## Troubleshooting

### ESP32 Issues
**Problem**: ESP32 won't connect to WiFi
- **Solution**: Verify WiFi credentials in `src/config.h`, check signal strength
- **Check**: Serial monitor for specific error messages

**Problem**: No sensor readings
- **Solution**: Check MQ-2 wiring, ensure AOUT is connected to GPIO34
- **Check**: Sensor needs 24-48 hours to properly calibrate after first power-on

**Problem**: Firebase authentication fails
- **Solution**: Verify Firebase configuration in `src/config.h`
- **Check**: Ensure Blaze plan is active for your Firebase project

### Dashboard Issues
**Problem**: Dashboard shows "No data"
- **Solution**: Verify `.env.local` contains correct Firebase configuration
- **Check**: Ensure ESP32 is uploading data to Firebase

**Problem**: Authentication fails
- **Solution**: Verify email/password authentication is enabled in Firebase
- **Check**: Firebase configuration matches between ESP32 and dashboard

**Problem**: Commands from dashboard don't reach ESP32
- **Solution**: Verify device ID matches in ESP32 config and dashboard
- **Check**: ESP32 must be online and connected to Firebase

### Common Verifications
1. **Check serial monitor** for ESP32 error messages
2. **Verify hardware connections** are secure
3. **Confirm Firebase Blaze plan** is active
4. **Check all configuration files** match Firebase project settings
5. **Review Firebase security rules** allow proper access

### Debug Commands
```bash
# ESP32: Monitor serial output
pio device monitor

# Dashboard: Check for console errors
npm run dev

# Firebase: Check real-time logs
firebase functions:log
```

## System Architecture
```
Hardware (ESP32 + Sensors) 
    ↓ (WiFi/HTTPS)
Firebase Backend (Firestore + RTDB)
    ↓ (Real-time)
Web Dashboard (Next.js/React)
    ↓ (User Actions)
Commands → Firebase → ESP32 → Actions
```

## Maintenance
- Regularly monitor Firebase usage (Blaze plan costs)
- Calibrate MQ-2 sensor monthly in clean air environment
- Update ESP32 firmware as new features are released
- Backup Firebase data periodically

## Support
For additional help:
1. Review error messages in serial monitor
2. Check browser console for dashboard errors
3. Verify all configurations match Firebase project settings
4. Test individual components before full integration

Your complete air quality monitoring system should now be running with ESP32 hardware collecting data, Firebase serving as the backend, and the web dashboard providing real-time visualization and control.