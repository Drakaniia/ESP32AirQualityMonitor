const mqtt = require('mqtt');

// Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const MQTT_PORT = 1883;
const COMMAND_TOPIC = 'airquality/esp32_01/command';
const SENSOR_TOPIC = 'airquality/esp32_01/sensor';
const STATUS_TOPIC = 'airquality/esp32_01/status';

console.log('=== ESP32 MQTT Monitor ===');
console.log('Listening for ESP32 traffic...');
console.log('Press Ctrl+C to stop');
console.log('');

const client = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: 'monitor_' + Math.random().toString(16).substr(2, 8),
    clean: true
});

let messageCount = 0;
let lastActivity = null;

client.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
    
    client.subscribe([SENSOR_TOPIC, STATUS_TOPIC, COMMAND_TOPIC], (err) => {
        if (err) {
            console.error('✗ Subscription error:', err);
            process.exit(1);
        }
        console.log('✓ Subscribed to ESP32 topics');
        console.log('  Monitoring for activity...');
        console.log('');
        
        // Send a test command to trigger response
        setTimeout(() => {
            console.log('Sending ping command to ESP32...');
            const pingCommand = {
                oled_message: 'PING TEST',
                timestamp: Date.now()
            };
            client.publish(COMMAND_TOPIC, JSON.stringify(pingCommand));
        }, 2000);
    });
});

client.on('message', (topic, message) => {
    messageCount++;
    lastActivity = new Date();
    
    console.log(`[${lastActivity.toISOString()}] ${topic}`);
    
    try {
        const data = JSON.parse(message.toString());
        console.log(JSON.stringify(data, null, 2));
        
        if (topic === SENSOR_TOPIC) {
            console.log('→ SENSOR DATA RECEIVED - ESP32 is publishing!');
        } else if (topic === STATUS_TOPIC) {
            console.log('→ STATUS UPDATE - ESP32 is alive!');
        } else if (topic === COMMAND_TOPIC) {
            console.log('→ COMMAND ECHO - ESP32 may be subscribed to its own topic');
        }
    } catch (e) {
        console.log('Raw:', message.toString());
    }
    
    console.log('---');
});

client.on('error', (error) => {
    console.error('✗ MQTT Error:', error.message);
});

// Status report every 10 seconds
setInterval(() => {
    if (messageCount === 0) {
        console.log(`[${new Date().toISOString()}] No activity from ESP32...`);
        console.log('  • Check if ESP32 is powered on');
        console.log('  • Verify WiFi connection');
        console.log('  • Check Serial Monitor for MQTT connection status');
        console.log('  • Ensure MQTT broker is reachable from ESP32');
    } else {
        console.log(`[${new Date().toISOString()}] Activity: ${messageCount} messages received`);
        if (lastActivity) {
            console.log(`  Last activity: ${lastActivity.toISOString()}`);
        }
    }
    console.log('');
}, 10000);

process.on('SIGINT', () => {
    console.log('\n=== Summary ===');
    console.log(`Total messages received: ${messageCount}`);
    if (lastActivity) {
        console.log(`Last activity: ${lastActivity.toISOString()}`);
    }
    console.log('ESP32 Status:', messageCount > 0 ? '✓ ONLINE' : '✗ OFFLINE');
    client.end();
    process.exit(0);
});