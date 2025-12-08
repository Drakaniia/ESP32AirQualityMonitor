# ESP32 Air Quality Monitor

A comprehensive IoT system for real-time air quality monitoring using ESP32, MQ-135 sensor, MQTT communication, and a responsive web dashboard with Firebase Authentication.

## Features

### ESP32 Device
- **Real-time Sensing**: MQ-135 air quality sensor with PPM readings
- **Local Display**: 0.96" OLED showing current air quality and relay status
- **MQTT Communication**: Reliable MQTT-based data transmission
- **WiFi Connectivity**: Reliable WiFi connection with automatic reconnection
- **Remote Control**: MQTT-based commands for relay and display control

### Web Dashboard
- **Real-time Monitoring**: Live air quality data and device status
- **Historical Charts**: Interactive charts showing trends (24h, 7d, all-time)
- **Device Control**: Remote relay control and sampling interval adjustment
- **Custom Messages**: Send custom text to OLED display
- **Responsive Design**: Mobile-friendly PWA with install support
- **Authentication**: Secure Firebase Auth integration

### MQTT Bridge
- **Real-time Communication**: Bidirectional MQTT message handling
- **API Integration**: RESTful endpoints for dashboard communication
- **Command Relay**: Forwards commands between dashboard and ESP32
- **Error Handling**: Robust error handling and logging

## System Architecture

```
ESP32 (MQ-135 + OLED + Relay)
       │ WiFi MQTT
       ▼
MQTT Broker (broker.hivemq.com)
       │
       ▼
MQTT Bridge (Node.js)
       │ HTTP API
       ▼
Responsive Web Dashboard (Next.js / React)
       │
       ▼
Firebase Authentication
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

### 2. Firebase Setup (Authentication Only)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password or Google)
4. Get your Firebase configuration from Project Settings → General → Your apps

### 3. Project Setup
```bash
# Clone the repository
git clone https://github.com/your-username/ESP32AirQualityMonitor.git
cd ESP32AirQualityMonitor

# Install bridge dependencies
npm install mqtt express

# Install dashboard dependencies
cd dashboard
npm install
```

### 4. ESP32 Configuration
1. Open project in VS Code with PlatformIO IDE
2. Update `src/config.h` with your WiFi credentials:
```cpp
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
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
```

### 6. Run the System
```bash
# Start MQTT bridge (from project root)
BRIDGE_PORT=3002 node mqtt-bridge.js

# Start dashboard (in new terminal)
cd dashboard && npm run dev

# Visit dashboard
http://localhost:3000
```

## Project Structure

```
├── src/                    # ESP32 firmware source code
│   ├── main.cpp           # Main application logic
│   ├── config.h           # Configuration constants
│   ├── wifi_manager.*     # WiFi connection management
│   ├── iot_protocol.*     # MQTT communication
│   ├── sensor_mq2.*       # MQ-2 sensor handling
│   ├── oled_display.*     # OLED display management
│   └── relay_controller.* # Relay control logic
├── dashboard/              # Next.js web dashboard
│   ├── src/
│   │   ├── app/           # App Router pages and API routes
│   │   ├── components/    # React components
│   │   └── lib/           # Firebase configuration
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
├── firebase/              # Firebase configuration
│   ├── firestore.rules    # Firestore security rules
│   └── firebase.json      # Firebase deployment config
├── mqtt-bridge.js         # MQTT bridge server
├── package.json           # Bridge dependencies
├── platformio.ini         # PlatformIO configuration
└── dashboard/docs/SETUP_GUIDE.md # Detailed setup instructions
```

## Configuration

### ESP32 Firmware
Edit `src/config.h`:
```cpp
// WiFi Configuration
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"

// MQTT Configuration
#define MQTT_BROKER "broker.hivemq.com"
#define MQTT_PORT 1883
#define DEVICE_ID "esp32_01"  // Unique identifier for your device

// Hardware Pin Configuration
#define MQ2_PIN 34            // Analog pin for MQ-2 sensor
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
```

### MQTT Bridge (Optional)
Set environment variables to override defaults:
```bash
export MQTT_BROKER=mqtt://broker.hivemq.com
export MQTT_PORT=1883
export DASHBOARD_API_URL=http://localhost:3000
export BRIDGE_PORT=3002
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

## MQTT Topics

### Data Flow
- **Sensor Data**: `airquality/esp32_01/sensor`
- **Commands**: `airquality/esp32_01/command`
- **Status**: `airquality/esp32_01/status`

### Message Format
Sensor data includes: device_id, ppm, quality, relay_state, timestamp
Commands include: relay control actions, display messages

## Security

- Firebase Authentication for dashboard access
- MQTT broker security considerations for production
- HTTPS communication with Firebase
- Input validation and sanitization
- Environment variables for sensitive configuration

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

### MQTT Bridge Development
```bash
# Install dependencies
npm install mqtt express

# Run bridge
BRIDGE_PORT=3002 node mqtt-bridge.js
```

## Data Flow

### Uploading Data
1. ESP32 reads sensor data every 5 seconds
2. ESP32 publishes data to MQTT broker
3. MQTT bridge receives and forwards to dashboard API
4. Dashboard updates in real-time

### Receiving Commands
1. Dashboard sends commands to bridge API
2. Bridge publishes commands to MQTT broker
3. ESP32 receives and processes commands
4. ESP32 executes actions (relay control, display updates)

## Monitoring & Maintenance

### MQTT Broker
- Monitor message flow and connection status
- Check bridge console for errors
- Verify topic subscriptions

### Device Maintenance
- Calibrate MQ-135 sensor monthly
- Check wiring connections periodically
- Update firmware for new features
- Monitor device online status

## Troubleshooting

### Common Issues
- **No data in dashboard**: Check MQTT bridge is running, verify ESP32 MQTT connection
- **Cannot upload firmware**: Check USB connection, COM port, drivers
- **WiFi connection fails**: Verify credentials in config.h, ensure signal strength
- **MQTT connection fails**: Check broker URL, internet connectivity
- **Bridge errors**: Verify dashboard is running on port 3000

### Debugging
- Monitor serial output: 115200 baud rate
- Check MQTT bridge console for messages
- Verify all environment variables are set correctly
- Test MQTT broker connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under MIT License - see the LICENSE file for details.

## Support

For detailed setup instructions, refer to [dashboard/docs/SETUP_GUIDE.md](./dashboard/docs/SETUP_GUIDE.md).

If you encounter issues:
1. Check the troubleshooting section above
2. Review hardware connections
3. Monitor serial output (115200 baud)
4. Check MQTT bridge console for errors
5. Verify dashboard configuration

---

**Built with ❤️ using ESP32, MQTT, and Next.js**