# Air Quality Monitor - Deployment Guide

This guide will walk you through deploying the complete IoT air quality monitoring system.

## 📋 Prerequisites

- Firebase project with Blaze plan (for Firestore and Realtime Database)
- Node.js 18+ installed
- PlatformIO IDE or Arduino IDE with ESP32 support
- ESP32 development board
- MQ-135 sensor, OLED display, and relay module

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "air-quality-monitor")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firebase Services
1. In Firebase Console, go to "Build" section
2. Enable **Firestore Database**
   - Start in test mode
   - Choose a location
3. Enable **Realtime Database**
   - Start in test mode
   - Choose the same location as Firestore
4. Enable **Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider

### 3. Install and Configure Firebase CLI
1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase (opens browser for authentication):
   ```bash
   firebase login
   ```
   - Allow Gemini features (optional)
   - Allow usage reporting (optional)
   - Complete authentication in browser

3. Set up Firebase project in your directory:
   ```bash
   cd firebase
   firebase use your-project-id
   ```
   Replace `your-project-id` with your actual Firebase project ID (e.g., `air-quality-monitor-c0862`)

### 4. Deploy Firebase Rules
1. Navigate to the `firebase/` directory
2. Deploy Firestore and Realtime Database rules:
   ```bash
   firebase deploy --only firestore,database
   ```
   This will deploy:
   - Firestore security rules from `firestore.rules`
   - Realtime Database rules from `database.rules.json`

3. Verify deployment in Firebase Console:
   - Firestore → Rules tab should show your security rules
   - Realtime Database → Rules tab should show your database rules

### 5. Get Firebase Configuration
1. In Firebase Console, go to Project Settings → General
2. Under "Your apps", click Web app → Create app
3. Copy the firebaseConfig object (you'll get something like):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyAgCNERlOUnJyQsgFFGawHm9gIygUTxwQM",
     authDomain: "air-quality-monitor-c0862.firebaseapp.com",
     projectId: "air-quality-monitor-c0862",
     storageBucket: "air-quality-monitor-c0862.firebasestorage.app",
     messagingSenderId: "746914538418",
     appId: "1:746914538418:web:eb6322df4356c117affaab"
   };
   ```
4. Create `.env` file in `dashboard/` directory with these values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAgCNERlOUnJyQsgFFGawHm9gIygUTxwQM
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=air-quality-monitor-c0862.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=air-quality-monitor-c0862
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=air-quality-monitor-c0862.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=746914538418
   NEXT_PUBLIC_FIREBASE_APP_ID=1:746914538418:web:eb6322df4356c117affaab
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://air-quality-monitor-c0862-default-rtdb.firebaseio.com
   ```

## 📱 ESP32 Firmware Setup

### 1. Update Configuration
1. Open `src/config.h`
2. Update the following values:
   ```cpp
   #define WIFI_SSID "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define FIREBASE_PROJECT_ID "your-firebase-project-id"
   #define FIREBASE_API_KEY "your-firebase-api-key"
   ```

### 2. Install Dependencies (PlatformIO)
1. Open PlatformIO IDE
2. The `platformio.ini` file will automatically install required libraries:
   - Adafruit SSD1306
   - Adafruit GFX Library
   - ArduinoJson

### 3. Upload Firmware
1. Connect ESP32 to your computer
2. Select the correct COM port
3. Upload the firmware:
   ```bash
   pio run --target upload
   ```
   or use the PlatformIO IDE upload button

### 4. Monitor Serial Output
```bash
pio device monitor
```
You should see the device connecting to WiFi and initializing sensors.

## 🌐 Web Dashboard Setup

### 1. Install Dependencies
```bash
cd dashboard
npm install
```

### 2. Environment Configuration
Create `.env.local` file in the dashboard directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## 🚀 Firebase Hosting Deployment

### 1. Initialize Firebase Hosting
```bash
firebase init hosting
```
- Select the Firebase project you created
- Set public directory to `dashboard/out`
- Configure as a single-page app (yes)
- Don't overwrite index.html

### 2. Deploy Dashboard
```bash
cd dashboard
npm run build
cd ..
firebase deploy --only hosting
```

Your dashboard will be available at `https://your-project.web.app`

## 🔧 Hardware Setup

### Wiring Connections

#### OLED Display (I2C)
| OLED Pin | ESP32 Pin |
|----------|-----------|
| VCC      | 3.3V      |
| GND      | GND       |
| SDA      | GPIO21    |
| SCL      | GPIO22    |

#### MQ-135 Sensor
| MQ-135 Pin | ESP32 Pin |
|------------|-----------|
| VCC        | 5V        |
| GND        | GND       |
| AOUT       | GPIO34    |

#### Relay Module
| Relay Pin | ESP32 Pin |
|-----------|-----------|
| VCC       | 5V        |
| GND       | GND       |
| IN        | GPIO26    |

### Testing the Hardware
1. Power on the ESP32
2. OLED should display "ESP32 AQ Monitor" then "System Ready"
3. Check serial monitor for sensor readings
4. Test relay control from the dashboard

## 📊 System Verification

### 1. ESP32 Device Check
- Serial monitor shows WiFi connection
- Sensor readings appear every 5 seconds
- Data uploads to Firebase every 30 seconds
- OLED displays current air quality

### 2. Dashboard Check
- Login page works
- Dashboard displays real-time data
- Charts update with new readings
- Control panel sends commands to device
- Relay control works from dashboard

### 3. Firebase Check
- Firestore contains sensor readings in `readings` collection
- Realtime Database has device commands in `commands/esp32_01`
- Device status updates in `devices/esp32_01`

## 🔍 Troubleshooting

### Common Issues

#### ESP32 Won't Connect to WiFi
- Check WiFi credentials in config.h
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Restart ESP32 and check serial output

#### Sensor Readings are Zero
- Check MQ-135 wiring
- Ensure sensor is powered with 5V
- Allow 60 seconds for sensor warm-up
- Check analog pin (GPIO34)

#### OLED Not Displaying
- Check I2C connections (SDA GPIO21, SCL GPIO22)
- Ensure OLED is powered with 3.3V
- Try different I2C address (0x3C or 0x3D)

#### Firebase Connection Issues
- Verify Firebase project ID and API key
- Check Firebase rules allow access
- Ensure Blaze plan for Firestore/RTDB
- Check network connectivity

#### Dashboard Not Loading
- Verify Firebase configuration in .env.local
- Check browser console for errors
- Ensure Firebase Auth is enabled
- Verify deployment completed successfully

## 📱 Mobile App (PWA)

The dashboard is a Progressive Web App (PWA):
1. Open the dashboard in mobile Chrome
2. Tap "Add to Home Screen"
3. Install as a native app
4. Works offline for basic features

## 🔄 Maintenance

### Regular Tasks
- Monitor Firebase usage (Blaze plan costs)
- Check sensor calibration monthly
- Update firmware for new features
- Backup Firebase data periodically

### Scaling Considerations
- Add multiple ESP32 devices
- Implement user authentication roles
- Add data retention policies
- Set up monitoring alerts

## 📞 Support

For issues with:
- **Hardware**: Check wiring and power supply
- **Firmware**: Review serial output and configuration
- **Firebase**: Verify rules and billing status
- **Dashboard**: Check browser console and network tab

Enjoy your air quality monitoring system! 🌬️📊