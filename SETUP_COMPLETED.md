# ESP32 Air Quality Monitor - Setup Completed Guide

This document provides a complete guide to the setup that has been completed for your ESP32 Air Quality Monitor project.

## Overview

Your ESP32 Air Quality Monitor project is now fully configured with:
- ESP32 firmware configured with your WiFi and Firebase credentials
- Web dashboard configured with Firebase environment variables
- Complete setup instructions for firmware upload and dashboard deployment

## Completed Configuration

### ESP32 Configuration (src/config.h)
- **WiFi SSID**: SHEESH
- **WiFi Password**: Kenjigwapo_123
- **Firebase Project ID**: air-quality-monitor-c0862
- **Firebase API Key**: AIzaSyAgCNERlOUnJyQsgFFGawHm9gIygUTxwQM
- **Device ID**: esp32_01

### Dashboard Configuration (dashboard/.env.local)
- All Firebase environment variables configured:
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
  - NEXT_PUBLIC_FIREBASE_DATABASE_URL
  - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

## Hardware Connections

### Required Components
- ESP32 Dev Board
- MQ-135 Gas Sensor
- 0.96" OLED Display (I2C, SSD1306)
- 5V Relay Module (optional)
- Breadboard and Jumper Wires
- Micro USB Cable

### Pin Connections

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

## Uploading ESP32 Firmware

### Using PlatformIO IDE in VS Code
1. Open VS Code
2. Click "File" → "Open Folder" and select your project directory
3. Connect your ESP32 board to your computer via USB cable
4. Look for the PlatformIO icon in the left sidebar (circuit board icon)
5. Make sure the correct COM port is selected in the bottom status bar
6. To upload the firmware to your ESP32:
   - Click the arrow icon (→) in the bottom status bar, or
   - Press Ctrl+Alt+U (Windows/Linux) or Cmd+Alt+U (Mac)

### Using PlatformIO Terminal Commands
1. Press Ctrl+` (backtick) to open the terminal
2. Navigate to your project directory
3. Use this command to upload:
   ```
   pio run --target upload
   ```

## Building the Project

### Building Firmware (Without Uploading)
- Click the checkmark icon (✓) in the bottom status bar, or
- Press Ctrl+Alt+B (Windows/Linux) or Cmd+Alt+B (Mac)
- Or use terminal command: `pio run`

## Monitoring ESP32 Output

### Using Serial Monitor
- Click the plug icon (🔌) in the bottom status bar
- Set the baud rate to 115200 to see the ESP32 output
- Or use terminal command: `pio device monitor`

### What to Expect in Serial Monitor
After successful upload, you should see messages like:
```
ESP32 Air Quality Monitor Starting...
WiFi connection successful
Firebase initialized successfully
System Ready
```

## Running the Web Dashboard

### Prerequisites
- Node.js (v16 or higher) installed

### Starting the Dashboard
1. Open a terminal/command prompt
2. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
3. Install dependencies (only needed once, or if you haven't done it yet):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to: `http://localhost:3000`

## System Architecture

```
MQ-135 Sensor → ESP32 (main.cpp) → WiFi → Firebase Firestore → Web Dashboard (Next.js) → User Interface
```

### Data Flow
1. ESP32 reads sensor data every 5 seconds
2. ESP32 uploads data to Firebase Firestore every 30 seconds
3. Data includes: PPM value, air quality level, relay state, timestamp
4. Web dashboard retrieves data from Firestore in real-time
5. Dashboard displays current readings and historical charts

### Command Flow
1. Dashboard sends commands to Firebase Realtime Database
2. ESP32 checks for commands every 10 seconds
3. Commands include: relay control, sampling interval, OLED display messages

## Troubleshooting

### Common Issues

**ESP32 Won't Upload:**
- Check USB connection
- Verify correct COM port is selected
- Try different USB cable
- Check PlatformIO status bar for error messages

**ESP32 Won't Connect to WiFi:**
- Verify WiFi credentials in src/config.h are correct
- Ensure ESP32 is within range of WiFi network
- Check if WiFi network requires captive portal login

**No Data in Dashboard:**
- Verify ESP32 is uploading data (check serial monitor)
- Confirm Firebase security rules are properly deployed
- Ensure dashboard environment variables match Firebase project

**Firebase Connection Issues:**
- Check that Blaze plan is enabled for your Firebase project
- Verify all Firebase configuration values are correct
- Ensure security rules are properly set up

### Serial Monitor Debugging
- Monitor at 115200 baud rate
- Look for error messages or connection status
- Verify "Data sent to Firebase successfully" messages

### Firebase Console Check
- Use Firebase Console to verify data is being received in Firestore
- Check Realtime Database for command messages from dashboard

## Dashboard Features

### Real-time Monitoring
- Live PPM readings with color-coded quality indicators
- Device online/offline status
- Relay state indicators
- Last update timestamps

### Historical Analysis
- Interactive charts with multiple time ranges
- Average, minimum, and maximum PPM values
- Air quality trend visualization
- Data point counters

### Device Controls
- Toggle relay on/off
- Adjust sampling interval (1-60 seconds)
- Send custom messages to OLED display
- Quick action buttons for common commands

## Security

### Firebase Security
- Firestore rules restrict access to authenticated users
- Realtime Database rules control command access
- HTTPS communication with Firebase

### Data Privacy
- Only authenticated users can access dashboard
- Device data is private to your Firebase project

## Maintenance

### Regular Checks
- Monitor serial output for device health
- Check Firebase usage for billing and performance
- Verify hardware connections periodically

### Sensor Calibration
- The MQ-135 sensor should be calibrated monthly for accuracy
- Place sensor in clean air for baseline readings
- Update MQ135_R0 value in config.h if needed

## Project Structure

```
├── src/                    # ESP32 firmware source code
│   ├── main.cpp           # Main application logic
│   ├── config.h           # Configuration constants
│   ├── wifi_manager.*     # WiFi connection management
│   ├── firebase_client.*  # Firebase integration
│   ├── sensor_mq135.*     # MQ-135 sensor handling
│   ├── oled_display.*     # OLED display management
│   └── relay_controller.* # Relay control logic
├── dashboard/              # Next.js web dashboard
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Firebase configuration
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
├── firebase/              # Firebase configuration
│   ├── firestore.rules    # Firestore security rules
│   ├── database.rules.json # RTDB security rules
│   └── firebase.json      # Firebase deployment config
├── platformio.ini         # PlatformIO configuration
├── DEPLOYMENT.md          # Complete deployment guide
├── COMPREHENSIVE_SETUP.md # Detailed setup instructions
├── SETUP_COMPLETED.md     # This file
└── README.md             # Project overview
```

## Air Quality Levels

The system categorizes air quality based on PPM readings:
- **Excellent**: < 50 PPM
- **Good**: 50-100 PPM
- **Moderate**: 100-200 PPM
- **Poor**: 200-400 PPM
- **Very Poor**: 400-800 PPM
- **Hazardous**: > 800 PPM

## Next Steps

1. Connect your hardware components according to the wiring diagram
2. Upload the firmware to your ESP32 using PlatformIO
3. Start the web dashboard
4. Verify the system is working by checking serial output and dashboard
5. Monitor air quality readings in real-time

Your ESP32 Air Quality Monitor project is now completely set up and ready to use! The system will continuously monitor air quality and display the data on your web dashboard.