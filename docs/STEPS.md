# ESP32 Air Quality Monitor - Step-by-Step Connection Guide

This guide provides detailed steps to connect your physical ESP32 device to the web dashboard so that sensor data appears instead of the "Loading sensor data..." message.

## Overview of the Connection Process

The ESP32 connects to your web dashboard through Firebase services:
1. ESP32 connects to WiFi
2. ESP32 uploads sensor data to Firebase Firestore
3. Web dashboard retrieves data from Firebase in real-time
4. Dashboard displays the incoming data

## Prerequisites

### Hardware Required
- ESP32 Dev Board
- MQ-2 Gas Sensor
- 0.96" OLED Display (I2C SSD1306)
- 5V Relay Module (optional)
- Breadboard and Jumper Wires
- Micro USB Cable

### Software Required
- PlatformIO IDE or Arduino IDE
- Node.js (v16 or higher)
- npm or yarn

### Cloud Services
- Firebase account with a project set up

## Step 1: Hardware Assembly

### 1.1 Wire the Components According to the Schematic

Connect the components as follows:

**OLED Display (I2C)**
```
OLED Pin    →    ESP32 Pin
VCC         →    3.3V
GND         →    GND
SDA         →    GPIO21
SCL         →    GPIO22
```

**MQ-2 Sensor**
```
MQ-2 Pin    →    ESP32 Pin
VCC         →    5V
GND         →    GND
AOUT        →    GPIO34
```

**Relay Module (Optional)**
```
Relay Pin   →    ESP32 Pin
VCC         →    5V
GND         →    GND
IN          →    GPIO26
```

### 1.2 Verify Connections
- Double-check all wire connections
- Ensure the ESP32 is properly powered
- Make sure the OLED display lights up after powering on

## Step 2: Firebase Setup

### 2.1 Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter a project name (e.g., "Air Quality Monitor")
4. Accept terms and click "Continue"
5. Disable Google Analytics (or enable if you want usage data)
6. Click "Create Project"

### 2.2 Enable Required Firebase Services
1. In your project dashboard, click "Firestore Database" in the left menu
2. Click "Create Database" → "Start in test mode" → "Enable"
3. Click "Realtime Database" in the left menu
4. Click "Create Database" → "Start in test mode" → "Enable"
5. Click "Authentication" in the left menu
6. Click "Get Started" → "Email/Password" → Enable → "Save"
7. Click "Project Settings" (gear icon) → "Service Accounts"
8. Click "Generate New Private Key" → "Generate Key" (save for later if needed)

### 2.3 Configure Firebase Security Rules (for Development)
**Firestore Rules:**
1. Go to Firestore Database → Rules
2. Replace content with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

**Realtime Database Rules:**
1. Go to Realtime Database → Rules
2. Replace content with:
```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
3. Click "Publish"

## Step 3: Configure ESP32 Firmware

### 3.1 Update WiFi Credentials
1. Open the `src/config.h` file in PlatformIO/Arduino IDE
2. Find these lines:
```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```
3. Replace with your actual WiFi credentials:
```cpp
#define WIFI_SSID "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"
```

### 3.2 Update Firebase Configuration
1. In the same `src/config.h` file, find:
```cpp
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
```
2. Get Firebase credentials:
   - Go to Firebase Console → Project Settings → General
   - Copy "Project ID" and replace `your-firebase-project-id`
   - Scroll down to "Firebase SDK snippet" → "Config"
   - Copy the `apiKey` value and replace `your-firebase-api-key`
3. Save the file

### 3.3 Verify Other Configuration Settings
- Check that pin definitions match your wiring:
  - `MQ135_PIN 34` (should match your wiring)
  - `RELAY_PIN 26` (if using relay)
  - `OLED_SDA 21` and `OLED_SCL 22` (should match your wiring)

## Step 4: Upload ESP32 Firmware

### 4.1 Install Required Libraries
1. In PlatformIO, open `platformio.ini`
2. Make sure these libraries are listed in `lib_deps`:
   - adafruit/Adafruit SSD1306
   - adafruit/Adafruit GFX Library
   - bblanchon/ArduinoJson
   - Firebase-ESP-Client

### 4.2 Compile and Upload
1. Connect ESP32 to computer via USB
2. In PlatformIO, click the upload button (→) or press `Ctrl+Alt+U`
3. Wait for the upload to complete successfully

### 4.3 Monitor ESP32 Output
1. Open Serial Monitor in PlatformIO (right sidebar)
2. Set baud rate to 115200
3. Reset ESP32 and monitor the output for:
   - WiFi connection success
   - Firebase connection success
   - Sensor readings
   - "Data sent to Firebase successfully" messages

## Step 5: Configure Web Dashboard

### 5.1 Update Dashboard Firebase Configuration
1. Navigate to the `dashboard` folder
2. Open `.env.local` file (or create if it doesn't exist)
3. Add your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id-number
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

### 5.2 Install Dashboard Dependencies
1. Open terminal in the `dashboard` folder
2. Run: `npm install` or `yarn install`

### 5.3 Run the Dashboard
1. In the `dashboard` folder, run: `npm run dev`
2. Open browser to `http://localhost:3000`

## Step 6: Test the Connection

### 6.1 Verify ESP32 Connection
1. Check that ESP32 shows "System Ready" on OLED
2. In Serial Monitor, look for:
   - "WiFi connection successful"
   - "Firebase initialized"
   - Regular "Data sent to Firebase successfully" messages

### 6.2 Set Up Dashboard Login
1. Go to your running dashboard (http://localhost:3000)
2. Click "Get Started" then "Sign In"
3. Register a new account with email and password
4. Verify your email (check Firebase Auth users to confirm)

### 6.3 Check Dashboard Status
1. Log in to the dashboard
2. Navigate to Dashboard page
3. Wait for data to appear (may take up to 30 seconds)
4. You should see actual sensor readings instead of "Loading sensor data..."

## Step 7: Troubleshooting Common Issues

### Issue: "Loading sensor data..." persists
**Solutions:**
1. Check ESP32 Serial Monitor for error messages
2. Verify WiFi credentials in config.h
3. Confirm Firebase project configuration matches dashboard config
4. Ensure internet connectivity on ESP32
5. Check Firebase console for incoming data

### Issue: ESP32 cannot connect to WiFi
**Solutions:**
1. Verify WiFi SSID and password in config.h
2. Ensure ESP32 is within range of WiFi router
3. Check if WiFi requires additional authentication

### Issue: Firebase connection fails
**Solutions:**
1. Verify Firebase API key and project ID are correct
2. Check Firebase security rules allow read/write
3. Confirm internet connectivity
4. Check Firebase billing (Blaze plan required)

### Issue: Data appears in Firebase but not on dashboard
**Solutions:**
1. Verify dashboard Firebase configuration matches ESP32
2. Check browser console for JavaScript errors
3. Verify Realtime Database and Firestore paths match code expectation

## Step 8: Verify Complete Functionality

### 8.1 Confirm Full Data Flow
1. ESP32 reads sensor data
2. Data is sent to Firebase Firestore
3. Dashboard retrieves data from Firebase
4. Data is displayed on dashboard in real-time
5. OLED shows current readings

### 8.2 Test Remote Control (if relay connected)
1. Use dashboard to toggle relay
2. Verify relay physically switches on ESP32
3. Check that status updates on dashboard

## Final Verification

When everything is working correctly:
- ESP32 OLED shows current PPM readings
- Serial Monitor shows regular data uploads
- Dashboard shows live sensor data (not "Loading sensor data...")
- Dashboard shows device as online
- Historical data is available on dashboard
- Remote control functions respond appropriately

## Additional Tips

- Keep ESP32 in well-ventilated area for accurate readings
- Allow 24-48 hours for MQ-2 sensor to fully stabilize after first use
- Regularly check dashboard for data accuracy
- Monitor Firebase usage to avoid unexpected charges
- Consider securing Firebase rules for production use