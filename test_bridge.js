const mqtt = require('mqtt');
const http = require('http');

// Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const MQTT_PORT = 1883;
const COMMAND_TOPIC = 'airquality/esp32_01/command';
const API_URL = 'http://localhost:3001/api/send-command/esp32_01';

// Create MQTT client
const client = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`);

console.log('Connecting to MQTT broker...');

client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to command topic
    client.subscribe(COMMAND_TOPIC, (err) => {
        if (err) {
            console.error('Failed to subscribe:', err);
            process.exit(1);
        }
        console.log(`Subscribed to ${COMMAND_TOPIC}`);

        // Send API request
        sendApiRequest();
    });
});

client.on('message', (topic, message) => {
    console.log(`Received message on ${topic}: ${message.toString()}`);

    try {
        const data = JSON.parse(message.toString());
        if (data.oled_message === 'TEST_MESSAGE') {
            console.log('SUCCESS: Test message received correctly via MQTT!');
            process.exit(0);
        } else {
            console.log('Received unexpected message:', data);
        }
    } catch (e) {
        console.error('Error parsing message:', e);
    }
});

function sendApiRequest() {
    console.log('Sending API request...');

    const data = JSON.stringify({
        relay_state: 'OFF',
        sampling_interval: 10,
        oled_message: 'TEST_MESSAGE',
        last_update: Date.now()
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/send-command/esp32_01',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`API Response Status: ${res.statusCode}`);

        res.on('data', (d) => {
            process.stdout.write(d);
        });

        if (res.statusCode !== 200) {
            console.error('API request failed');
            // Don't exit yet, wait a bit to see if MQTT message comes anyway (unlikely)
            setTimeout(() => {
                console.error('TIMEOUT: MQTT message not received');
                process.exit(1);
            }, 5000);
        }
    });

    req.on('error', (error) => {
        console.error('API Request Error:', error);
        process.exit(1);
    });

    req.write(data);
    req.end();
}

// Timeout
setTimeout(() => {
    console.error('TIMEOUT: Test timed out after 10 seconds');
    process.exit(1);
}, 10000);
