const mqtt = require('mqtt');

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const SENSOR_TOPIC = process.env.MQTT_SENSOR_TOPIC || 'airquality/esp32_01/sensor';
const COMMAND_TOPIC = process.env.MQTT_COMMAND_TOPIC || 'airquality/esp32_01/command';
const STATUS_TOPIC = process.env.MQTT_STATUS_TOPIC || 'airquality/esp32_01/status';

// Dashboard API Configuration
const DASHBOARD_API_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000';

// Create MQTT client
const client = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`);

// Store for device commands
let deviceCommands = {};

client.on('connect', () => {
  console.log('MQTT Bridge connected to broker');

  // Subscribe to topics
  client.subscribe([SENSOR_TOPIC, COMMAND_TOPIC, STATUS_TOPIC], (err) => {
    if (err) {
      console.error('Error subscribing to topics:', err);
    } else {
      console.log(`Subscribed to topics: ${SENSOR_TOPIC}, ${COMMAND_TOPIC}, ${STATUS_TOPIC}`);
    }
  });
});

client.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Handle incoming MQTT messages
client.on('message', async (topic, message) => {
  console.log(`Received message on topic ${topic}:`, message.toString());
  
  try {
    if (topic === SENSOR_TOPIC) {
      // Forward sensor data to dashboard API
      const sensorData = JSON.parse(message.toString());
      await sendSensorData(sensorData);
    } else if (topic === STATUS_TOPIC) {
      // Forward device status to dashboard API
      const statusData = JSON.parse(message.toString());
      await updateDeviceStatus(statusData);
    }
  } catch (error) {
    console.error(`Error processing message from topic ${topic}:`, error);
  }
});

// Function to send sensor data to dashboard API
async function sendSensorData(data) {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/api/sensor-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      console.error('Error sending sensor data to dashboard:', response.status, await response.text());
    } else {
      console.log('Sensor data forwarded to dashboard successfully');
    }
  } catch (error) {
    console.error('Error forwarding sensor data:', error);
  }
}

// Listen for device commands from dashboard API
async function startCommandListener() {
  try {
    // Set up a simple HTTP server to receive commands from the dashboard
    const express = require('express');
    const app = express();
    const port = process.env.BRIDGE_PORT || 4001;

    app.use(express.json());

    // Endpoint for receiving commands from dashboard
    app.post('/api/send-command/:deviceId', async (req, res) => {
      try {
        const deviceId = req.params.deviceId;
        const command = req.body;

        // Store the command
        deviceCommands[deviceId] = { ...command, timestamp: Date.now() };

        // Publish command to MQTT
        const topic = COMMAND_TOPIC.replace('esp32_01', deviceId);
        client.publish(topic, JSON.stringify(command), { qos: 1 }, (err) => {
          if (err) {
            console.error('Error publishing command to MQTT:', err);
            return res.status(500).json({ error: 'Failed to send command to device' });
          }
          console.log(`Command sent to device ${deviceId} on topic ${topic}`);
        });

        res.json({ success: true, message: 'Command sent to device successfully' });
      } catch (error) {
        console.error('Error handling command:', error);
        res.status(500).json({ error: 'Failed to process command' });
      }
    });

    // Endpoint to get current device commands
    app.get('/api/device-commands/:deviceId', (req, res) => {
      const deviceId = req.params.deviceId;
      const command = deviceCommands[deviceId] || null;
      res.json({ ...command, device_id: deviceId });
    });

    app.listen(port, () => {
      console.log(`MQTT Bridge API listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error setting up command listener:', error);
  }
}

// Function to update device status to dashboard API
async function updateDeviceStatus(data) {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/api/sensor-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Error sending device status to dashboard:', response.status, await response.text());
    } else {
      console.log('Device status forwarded to dashboard successfully');
    }
  } catch (error) {
    console.error('Error forwarding device status:', error);
  }
}

// Start the command listener
startCommandListener();

console.log('MQTT to HTTP Bridge started. Listening for messages...');