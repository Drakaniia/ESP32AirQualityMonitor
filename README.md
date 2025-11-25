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

### Wiring Diagram

#### Comprehensive Circuit Diagram

```mermaid
graph TB
    subgraph "ESP32 Dev Board"
        ESP32[ESP32 Chip]
        GPIO21[GPIO21 - SDA]
        GPIO22[GPIO22 - SCL]
        GPIO34[GPIO34 - AOUT]
        GPIO26[GPIO26 - RELAY IN]
        VCC33["3.3V Power"]
        GND["GND"]
        VCC5["5V Power"]
    end
    
    subgraph "MQ-135 Gas Sensor"
        MQ135[MQ-135 Chip]
        MQ_VCC["VCC (5V)"]
        MQ_GND["GND"]
        MQ_AOUT["AOUT (Analog Output)"]
    end
    
    subgraph "0.96\" OLED Display (I2C)"
        OLED[SSD1306 Display]
        OLED_VCC["VCC (3.3V)"]
        OLED_GND["GND"]
        OLED_SDA["SDA (Data)"]
        OLED_SCL["SCL (Clock)"]
    end
    
    subgraph "5V Relay Module"
        RELAY[Relay Module]
        RELAY_VCC["VCC (5V)"]
        RELAY_GND["GND"]
        RELAY_IN["IN (Control)"]
    end
    
    subgraph "Power Supply"
        POWER["USB/Micro USB (5V)"]
    end
    
    %% Wiring connections
    GPIO21 --- OLED_SDA
    GPIO22 --- OLED_SCL
    GPIO34 --- MQ_AOUT
    GPIO26 --- RELAY_IN
    
    VCC33 --- OLED_VCC
    VCC5 --- MQ_VCC
    VCC5 --- RELAY_VCC
    VCC5 --- POWER
    
    GND --- MQ_GND
    GND --- OLED_GND
    GND --- RELAY_GND
    
    %% Styling
    classDef esp32 fill:#e1f5fe
    classDef sensor fill:#f3e5f5
    classDef display fill:#e8f5e8
    classDef relay fill:#fff3e0
    classDef power fill:#ffebee
    
    class ESP32,GPIO21,GPIO22,GPIO34,GPIO26,VCC33,GND,VCC5 esp32
    class MQ135,MQ_VCC,MQ_GND,MQ_AOUT sensor
    class OLED,OLED_VCC,OLED_GND,OLED_SDA,OLED_SCL display
    class RELAY,RELAY_VCC,RELAY_GND,RELAY_IN relay
    class POWER power
```

#### Pin-Level Connections

| Component | Pin/Function | ESP32 Pin |
|-----------|--------------|-----------|
| OLED Display | VCC | 3.3V |
| OLED Display | GND | GND |
| OLED Display | SDA | GPIO21 |
| OLED Display | SCL | GPIO22 |
| MQ-135 Sensor | VCC | 5V |
| MQ-135 Sensor | GND | GND |
| MQ-135 Sensor | AOUT | GPIO34 |
| Relay Module | VCC | 5V |
| Relay Module | GND | GND |
| Relay Module | IN | GPIO26 |

#### Visual Wiring Diagram

```mermaid
graph LR
    subgraph "ESP32 Air Quality Monitor Circuit"
        direction TB
        ESP32["ESP32 Dev Board"]
        
        subgraph "Power Connections"
            VCC["5V Supply"]
            GND["Ground (0V)"]
        end
        
        subgraph "Sensors & Displays"
            MQ135["MQ-135 Gas Sensor"]
            OLED["0.96\" SSD1306 OLED Display"]
            RELAY["5V Relay Module"]
        end
        
        subgraph "Load"
            LOAD["External Device<br/>(Connected via Relay)"]
        end
    end
    
    %% Power connections
    VCC --> ESP32
    VCC --> MQ135
    VCC --> RELAY
    ESP32 --> OLED
    
    GND --> ESP32
    GND --> MQ135
    GND --> OLED
    GND --> RELAY
    
    %% Signal connections
    ESP32 --- GPIO21["GPIO21<br/>(SDA)"] --- OLED
    ESP32 --- GPIO22["GPIO22<br/>(SCL)"] --- OLED
    ESP32 --- GPIO34["GPIO34<br/>(AOUT)"] --- MQ135
    ESP32 --- GPIO26["GPIO26<br/>(Relay IN)"] --- RELAY
    
    RELAY --- LOAD
    
    %% Styling
    classDef esp32 fill:#bbdefb
    classDef power fill:#ffcdd2
    classDef sensor fill:#d1c4e9
    classDef display fill:#c8e6c9
    classDef relay fill:#fff9c4
    classDef load fill:#ffecb3
    
    class ESP32 esp32
    class VCC,GND power
    class MQ135 sensor
    class OLED display
    class RELAY relay
    class LOAD load
```

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