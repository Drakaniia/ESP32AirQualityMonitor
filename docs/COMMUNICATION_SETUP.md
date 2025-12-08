# Communication Setup Guide

This guide helps you set up the complete communication flow between your ESP32 device and the Next.js dashboard.

## Architecture Overview

```
ESP32 Device → MQTT Broker → MQTT Bridge → Dashboard API → Next.js Dashboard
                    ↑
            Commands from Dashboard
```

## Setup Steps

### 1. Install and Configure MQTT Broker

#### Option A: Mosquitto (Recommended)
```bash
# Install Mosquitto
sudo apt-get install mosquitto mosquitto-clients

# Start Mosquitto service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test connection
mosquitto_pub -h localhost -t test -m "Hello MQTT"
mosquitto_sub -h localhost -t test
```

#### Option B: Docker Mosquitto
```bash
docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
```

### 2. Update Configuration Files

#### ESP32 Configuration (`src/config.h`)
```cpp
// Update MQTT_SERVER to your broker IP
#define MQTT_SERVER "192.168.1.100"  // Your computer's IP address
#define MQTT_PORT 1883
#define MQTT_DEVICE_TOPIC "airquality/esp32_01/sensor"
#define MQTT_STATUS_TOPIC "airquality/esp32_01/status"
#define MQTT_COMMAND_TOPIC "airquality/esp32_01/command"
```

#### MQTT Bridge Configuration (`mqtt-bridge.js`)
```javascript
// Update these lines to match your setup
const MQTT_BROKER = 'mqtt://192.168.1.100';  // Your computer's IP
const DASHBOARD_API_URL = 'http://localhost:3000';
```

### 3. Start the Services

#### Step 1: Start MQTT Bridge
```bash
cd /path/to/AirQualityMonitor123
npm install  # Install dependencies if not already done
node mqtt-bridge.js
```

#### Step 2: Start Dashboard
```bash
cd dashboard
npm install
npm run dev
```

#### Step 3: Upload ESP32 Code
```bash
# Using PlatformIO
pio run --target upload

# Or using Arduino IDE
# Upload the AirQualityMonitor123.ino file
```

### 4. Test Communication

#### Test MQTT Topics
```bash
# Terminal 1: Subscribe to sensor topic
mosquitto_sub -h localhost -t "airquality/esp32_01/sensor"

# Terminal 2: Subscribe to command topic
mosquitto_sub -h localhost -t "airquality/esp32_01/command"

# Terminal 3: Send test command
mosquitto_pub -h localhost -t "airquality/esp32_01/command" -m '{"relay_state":"ON"}'
```

#### Test Dashboard API
```bash
# Test sensor data endpoint
curl -X POST http://localhost:3000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "esp32_01",
    "ppm": 150.5,
    "quality": "Good",
    "relay_state": "OFF"
  }'

# Test device commands endpoint
curl http://localhost:3000/api/device-commands/esp32_01
```

### 5. Troubleshooting

#### Common Issues

1. **ESP32 can't connect to MQTT broker**
   - Check if MQTT broker is running: `sudo systemctl status mosquitto`
   - Verify IP address in config.h
   - Check network connectivity

2. **MQTT bridge can't connect to broker**
   - Verify broker IP in mqtt-bridge.js
   - Check if broker is accessible from your network

3. **Dashboard not receiving data**
   - Check if MQTT bridge is running
   - Verify dashboard API is accessible: `curl http://localhost:3000/api/sensor-data`

4. **Commands not reaching ESP32**
   - Check MQTT topic subscriptions
   - Verify ESP32 is connected to broker

#### Debug Commands

```bash
# Monitor MQTT messages
mosquitto_sub -h localhost -t "airquality/#" -v

# Check MQTT bridge logs
node mqtt-bridge.js  # Look for connection messages

# Test ESP32 serial monitor
# Open Arduino IDE Serial Monitor or use `pio device monitor`
```

### 6. Network Configuration

#### Find Your Computer's IP
```bash
# Linux/Mac
ip addr show | grep inet

# Windows
ipconfig
```

#### Firewall Configuration
Make sure these ports are open:
- 1883 (MQTT)
- 3000 (Dashboard)
- 3001 (MQTT Bridge API)

### 7. Production Considerations

For production deployment:

1. **Security**: Add MQTT authentication
2. **SSL**: Use TLS for MQTT (port 8883)
3. **Database**: Replace in-memory storage with proper database
4. **Error Handling**: Add comprehensive error handling and logging
5. **Monitoring**: Add health checks and monitoring

### 8. Alternative Setup (HTTP Only)

If MQTT is not available, you can use HTTP-only mode:

1. Change `COMM_PROTOCOL` in `config.h` to `COMM_PROTOCOL_HTTP`
2. Update dashboard URL to your server's public IP
3. Ensure ESP32 can reach your dashboard server

This mode is less efficient for real-time communication but simpler to set up.