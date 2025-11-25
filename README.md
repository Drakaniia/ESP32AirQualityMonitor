# ESP32 Air Quality Monitor

A comprehensive IoT system for real-time air quality monitoring using ESP32, MQ-135 sensor, and Firebase integration with a responsive web dashboard.

## Features

### ESP32 Device
- **Real-time Sensing**: MQ-135 air quality sensor with PPM readings
- **Local Display**: 0.96" OLED showing current air quality and relay status
- **Remote Control**: Firebase-based commands for relay and display control
- **WiFi Connectivity**: Reliable WiFi connection with automatic reconnection
- **Data Upload**: Automatic sensor data upload to Firebase Firestore

### Web Dashboard
- **Real-time Monitoring**: Live air quality data and device status
- **Historical Charts**: Interactive charts showing trends (24h, 7d, all-time)
- **Device Control**: Remote relay control and sampling interval adjustment
- **Custom Messages**: Send custom text to OLED display
- **Responsive Design**: Mobile-friendly PWA with install support
- **Authentication**: Secure Firebase Auth integration

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

## Hardware Requirements

### Components
- ESP32 Dev Board
- MQ-135 Gas Sensor
- 0.96" OLED Display (I2C, SSD1306)
- 5V Relay Module
- Breadboard and Jumper Wires
- Micro USB Cable


#### Pin Connection Table

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
| MQ-135 | DOUT | (Not Used) | - | Digital Out (Optional) |
| **Relay Module** |
| Relay | VCC | Red | 5V | Power Supply |
| Relay | GND | Black | GND | Ground |
| Relay | IN | Orange | GPIO26 | Control Signal |
| Relay | NC/NO/COM | - | - | Load Connection |

## Quick Start

### 1. Firebase Setup
1. Create a Firebase project with Blaze plan
2. Enable Firestore, Realtime Database, and Authentication
3. Deploy the provided Firebase rules from `firebase/` directory

### 2. ESP32 Configuration
1. Update `src/config.h` with your WiFi and Firebase credentials
2. Upload firmware using PlatformIO or Arduino IDE
3. Monitor serial output for debugging

### 3. Dashboard Setup
1. Copy `dashboard/.env.example` to `dashboard/.env.local`
2. Add Firebase configuration
3. Install dependencies: `cd dashboard && npm install`
4. Run development server: `npm run dev`

### 4. Deployment
For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

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
└── README.md             # This file
```

## Configuration

### ESP32 Firmware
Edit `src/config.h`:
```cpp
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
```

### Web Dashboard
Create `dashboard/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## Air Quality Levels

The system categorizes air quality based on PPM readings:

- **Excellent**: < 50 PPM
- **Good**: 50-100 PPM
- **Moderate**: 100-200 PPM
- **Poor**: 200-400 PPM
- **Very Poor**: 400-800 PPM
- **Hazardous**: > 800 PPM

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

- Firebase Authentication for dashboard access
- Firestore and RTDB security rules
- HTTPS communication with Firebase
- Input validation and sanitization

## Mobile Support

The dashboard is a Progressive Web App (PWA):
- Installable on mobile devices
- Offline support for basic features
- Responsive design for all screen sizes
- Native app-like experience

## Development

### ESP32 Development
```bash
# Install PlatformIO
pip install platformio

# Upload firmware
pio run --target upload

# Monitor serial output
pio device monitor
```

### Dashboard Development
```bash
cd dashboard
npm install
npm run dev    # Development server
npm run build  # Production build
npm run start  # Production server
```

## Monitoring & Maintenance

### Firebase Usage
- Monitor Firestore read/write operations
- Check RTDB usage statistics
- Set up billing alerts for Blaze plan

### Device Maintenance
- Calibrate MQ-135 sensor monthly
- Check wiring connections periodically
- Update firmware for new features
- Monitor device online status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

For common issues and solutions, see the [Troubleshooting section in DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting).

## Support

If you encounter issues:
1. Check the deployment guide
2. Review hardware connections
3. Monitor serial output
4. Check Firebase console for errors
5. Verify dashboard configuration

---

**Built with ❤️ using ESP32, Firebase, and Next.js"