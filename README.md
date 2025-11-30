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
- 5V Relay Module (optional)
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
| **Relay Module** (optional) |
| Relay | VCC | Red | 5V | Power Supply |
| Relay | GND | Black | GND | Ground |
| Relay | IN | Orange | GPIO26 | Control Signal |

## Quick Start

### 1. Software Requirements
- [Visual Studio Code](https://code.visualstudio.com/)
- [PlatformIO IDE](https://platformio.org/install) (VS Code extension)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project with Blaze (pay-as-you-go) plan
3. Enable Firestore Database, Realtime Database, and Authentication
4. Get your Firebase configuration from Project Settings → General → Your apps
5. Deploy the security rules from `firebase/` directory

### 3. Project Setup
```bash
# Clone the repository
git clone https://github.com/your-username/ESP32AirQualityMonitor.git
cd ESP32AirQualityMonitor

# Install dashboard dependencies
cd dashboard
npm install
```

### 4. ESP32 Configuration
1. Open project in VS Code with PlatformIO IDE
2. Update `src/config.h` with your WiFi and Firebase credentials:
```cpp
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
```
3. Build and upload firmware: PlatformIO → Upload (or `pio run --target upload`)

### 5. Dashboard Configuration
1. Create environment file: `dashboard/.env.local`
2. Add Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 6. Run the System
1. Upload ESP32 firmware and verify it connects to Firebase
2. Start dashboard: `cd dashboard && npm run dev`
3. Visit `http://localhost:3000` to view the dashboard

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
└── README.md             # This file
```

## Configuration

### ESP32 Firmware
Edit `src/config.h`:
```cpp
// WiFi Configuration
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// Firebase Configuration
#define FIREBASE_PROJECT_ID "your-firebase-project-id"
#define FIREBASE_API_KEY "your-firebase-api-key"
#define DEVICE_ID "esp32_01"  // Unique identifier for your device

// Hardware Pin Configuration
#define MQ135_PIN 34          // Analog pin for MQ-135 sensor
#define RELAY_PIN 26          // Digital pin for relay module (optional)
#define OLED_SDA 21           // I2C SDA pin for OLED
#define OLED_SCL 22           // I2C SCL pin for OLED
```

### Web Dashboard
Create `dashboard/.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
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
# Using PlatformIO (recommended)
# Build project
pio run

# Upload firmware to ESP32
pio run --target upload

# Monitor serial output
pio device monitor

# Or install PlatformIO Core CLI directly
pip install platformio
```

### Dashboard Development
```bash
cd dashboard
npm install
npm run dev    # Development server
npm run build  # Production build
npm run start  # Production server
```

## Data Flow

### Uploading Data
1. ESP32 reads sensor data every 5 seconds
2. ESP32 uploads data to Firebase Firestore every 30 seconds
3. Data includes: PPM value, air quality level, relay state, timestamp

### Receiving Commands
1. Dashboard sends commands to Firebase Realtime Database
2. ESP32 checks for commands every 10 seconds
3. Commands include: relay control, sampling interval, OLED display messages

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

## Troubleshooting

### Common Issues
- **No data in dashboard**: Check Firebase configuration, verify ESP32 is uploading
- **Cannot upload firmware**: Check USB connection, COM port, drivers
- **WiFi connection fails**: Verify credentials in config.h, ensure signal strength
- **Dashboard shows no data**: Check Firebase security rules, verify authentication

### Debugging
- Monitor serial output: 115200 baud rate
- Check Firebase Console for database activity
- Verify all environment variables are set correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For detailed setup instructions, refer to [COMPREHENSIVE_SETUP.md](./COMPREHENSIVE_SETUP.md).
For deployment options, see [DEPLOYMENT.md](./DEPLOYMENT.md).

If you encounter issues:
1. Check the troubleshooting section above
2. Review hardware connections
3. Monitor serial output (115200 baud)
4. Check Firebase console for errors
5. Verify dashboard configuration matches Firebase settings

---

**Built with ❤️ using ESP32, Firebase, and Next.js"