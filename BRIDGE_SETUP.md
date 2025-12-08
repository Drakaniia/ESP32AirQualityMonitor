# Combustible Gas Monitor - MQTT Bridge Setup

This project allows you to connect an ESP32 combustible gas monitor to a web dashboard using MQTT as the communication protocol.

## Architecture

The system consists of:
1. ESP32 device with MQ-2 sensor
2. MQTT broker (using public broker mqtt://broker.hivemq.com)
3. MQTT to HTTP bridge (this component)
4. Web dashboard (Next.js application)

## How it Works

1. ESP32 sends sensor data to MQTT topic `airquality/esp32_01/sensor`
2. ESP32 receives commands from MQTT topic `airquality/esp32_01/command`
3. MQTT Bridge listens for device data and forwards to dashboard API
4. Dashboard sends commands to bridge API which forwards to ESP32 via MQTT

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the MQTT Bridge
```bash
npm start
```

The bridge will listen on port 3001 by default.

### 3. Run the Dashboard
In a separate terminal, navigate to the dashboard directory:
```bash
cd dashboard
npm install
npm run dev
```

### 4. Flash the ESP32
Flash the AirQualityMonitor123.ino code to your ESP32 device.

## Dashboard Controls

The dashboard allows you to:
- View real-time air quality data
- Control the relay (ON/OFF)
- Adjust sampling interval
- Send custom messages to the OLED display
- Clear the OLED display

## MQTT Topics

- `airquality/esp32_01/sensor` - Sensor data from ESP32
- `airquality/esp32_01/command` - Commands to ESP32
- `airquality/esp32_01/status` - Device status updates

## Environment Variables

You can customize the bridge configuration with these environment variables:

- `MQTT_BROKER` - MQTT broker URL (default: mqtt://broker.hivemq.com)
- `MQTT_PORT` - MQTT broker port (default: 1883)
- `MQTT_SENSOR_TOPIC` - Topic for sensor data (default: airquality/esp32_01/sensor)
- `MQTT_COMMAND_TOPIC` - Topic for commands (default: airquality/esp32_01/command)
- `MQTT_STATUS_TOPIC` - Topic for device status (default: airquality/esp32_01/status)
- `DASHBOARD_API_URL` - URL of your dashboard (default: http://localhost:3000)
- `BRIDGE_PORT` - Port for the bridge API (default: 3001)

## Troubleshooting

- Make sure the MQTT Bridge is running before the dashboard
- Check that your ESP32 can connect to WiFi and MQTT broker
- Verify that all components are using the same device ID (esp32_01)
- Check browser console and bridge logs for error messages