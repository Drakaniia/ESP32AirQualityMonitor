const mqtt = require('mqtt');

// Configuration matching ESP32
const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const MQTT_PORT = 1883;
const COMMAND_TOPIC = 'airquality/esp32_01/command';
const SENSOR_TOPIC = 'airquality/esp32_01/sensor';
const STATUS_TOPIC = 'airquality/esp32_01/status';

console.log('=== ESP32 MQTT Connection Test ===');
console.log(`Broker: ${MQTT_BROKER}:${MQTT_PORT}`);
console.log(`Command Topic: ${COMMAND_TOPIC}`);
console.log('');

// Create MQTT client
const client = mqtt.connect(`${MQTT_BROKER}:${MQTT_PORT}`, {
    clientId: 'test_client_' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 30000,
    reconnectPeriod: 1000,
});

let connectionStartTime = Date.now();
let testResults = {
    connected: false,
    esp32Online: false,
    commandReceived: false,
    sensorDataReceived: false,
    statusReceived: false
};

client.on('connect', () => {
    const connectionTime = Date.now() - connectionStartTime;
    console.log(`✓ Connected to MQTT broker in ${connectionTime}ms`);
    testResults.connected = true;

    // Subscribe to all ESP32 topics
    client.subscribe([COMMAND_TOPIC, SENSOR_TOPIC, STATUS_TOPIC], (err) => {
        if (err) {
            console.error('✗ Error subscribing to topics:', err);
            process.exit(1);
        } else {
            console.log('✓ Subscribed to ESP32 topics');
            console.log('  -', SENSOR_TOPIC);
            console.log('  -', STATUS_TOPIC);
            console.log('  -', COMMAND_TOPIC);
            console.log('');
            
            // Start testing after subscription
            setTimeout(() => startTests(), 2000);
        }
    });
});

client.on('error', (error) => {
    console.error('✗ MQTT connection error:', error.message);
    process.exit(1);
});

client.on('offline', () => {
    console.log('✗ MQTT client went offline');
});

// Handle incoming messages
client.on('message', (topic, message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Message on ${topic}:`);
    
    try {
        const data = JSON.parse(message.toString());
        console.log('  Parsed JSON:', JSON.stringify(data, null, 2));
        
        if (topic === SENSOR_TOPIC) {
            testResults.sensorDataReceived = true;
            testResults.esp32Online = true;
            console.log('  ✓ ESP32 is sending sensor data');
            
            if (data.device_id === 'esp32_01') {
                console.log(`  ✓ Device ID: ${data.device_id}`);
                console.log(`  ✓ PPM: ${data.ppm}`);
                console.log(`  ✓ Quality: ${data.quality}`);
                console.log(`  ✓ Temperature: ${data.temperature}°C`);
                console.log(`  ✓ Humidity: ${data.humidity}%`);
            }
        } else if (topic === STATUS_TOPIC) {
            testResults.statusReceived = true;
            console.log('  ✓ ESP32 status update received');
            if (data.status === 'online') {
                testResults.esp32Online = true;
                console.log('  ✓ ESP32 reports online status');
            }
        } else if (topic === COMMAND_TOPIC) {
            // This would be echo/loopback - not expected normally
            console.log('  ⚠ Unexpected message on command topic (possible loopback)');
        }
    } catch (error) {
        console.log('  Raw message:', message.toString());
        console.log('  ✗ Failed to parse JSON:', error.message);
    }
    console.log('');
});

function startTests() {
    console.log('=== Starting Tests ===');
    
    // Test 1: Send OLED message command
    console.log('Test 1: Sending OLED message command...');
    const oledCommand = {
        oled_message: 'MQTT TEST OK',
        timestamp: Date.now()
    };
    
    client.publish(COMMAND_TOPIC, JSON.stringify(oledCommand), { qos: 1 }, (err) => {
        if (err) {
            console.log('✗ Failed to send OLED command:', err.message);
        } else {
            console.log('✓ OLED command sent successfully');
            console.log('  Check ESP32 OLED display for: "MQTT TEST OK"');
        }
    });
    
    // Test 2: Send buzzer test command
    setTimeout(() => {
        console.log('\nTest 2: Sending buzzer test command...');
        const buzzerCommand = {
            test_buzzer: true,
            timestamp: Date.now()
        };
        
        client.publish(COMMAND_TOPIC, JSON.stringify(buzzerCommand), { qos: 1 }, (err) => {
            if (err) {
                console.log('✗ Failed to send buzzer command:', err.message);
            } else {
                console.log('✓ Buzzer test command sent');
                console.log('  ESP32 should activate buzzer and LED');
            }
        });
    }, 3000);
    
    // Test 3: Send pin status check command
    setTimeout(() => {
        console.log('\nTest 3: Sending pin status check command...');
        const pinCommand = {
            check_pins: true,
            timestamp: Date.now()
        };
        
        client.publish(COMMAND_TOPIC, JSON.stringify(pinCommand), { qos: 1 }, (err) => {
            if (err) {
                console.log('✗ Failed to send pin check command:', err.message);
            } else {
                console.log('✓ Pin status check command sent');
                console.log('  Check ESP32 Serial Monitor for pin status output');
            }
        });
    }, 6000);
    
    // Test 4: Send clear command
    setTimeout(() => {
        console.log('\nTest 4: Sending clear OLED command...');
        const clearCommand = {
            oled_message: 'CLEAR',
            timestamp: Date.now()
        };
        
        client.publish(COMMAND_TOPIC, JSON.stringify(clearCommand), { qos: 1 }, (err) => {
            if (err) {
                console.log('✗ Failed to send clear command:', err.message);
            } else {
                console.log('✓ Clear OLED command sent');
                console.log('  ESP32 should clear OLED and return to normal display');
            }
        });
    }, 9000);
    
    // Show results and exit
    setTimeout(() => {
        showResults();
    }, 15000);
}

function showResults() {
    console.log('\n=== TEST RESULTS ===');
    console.log(`MQTT Connection: ${testResults.connected ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`ESP32 Online: ${testResults.esp32Online ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Sensor Data: ${testResults.sensorDataReceived ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Status Updates: ${testResults.statusReceived ? '✓ PASS' : '✗ FAIL'}`);
    
    console.log('\n=== DEBUGGING SUGGESTIONS ===');
    
    if (!testResults.connected) {
        console.log('• Check internet connection');
        console.log('• Verify MQTT broker accessibility');
        console.log('• Check firewall settings');
    } else if (!testResults.esp32Online) {
        console.log('• Check ESP32 WiFi connection');
        console.log('• Verify ESP32 MQTT configuration');
        console.log('• Check ESP32 Serial Monitor for errors');
        console.log('• Ensure ESP32 is powered and running');
    } else if (!testResults.sensorDataReceived) {
        console.log('• ESP32 may not be publishing sensor data');
        console.log('• Check MQTT_UPDATE_INTERVAL in config.h');
        console.log('• Verify sensor initialization');
    } else {
        console.log('• MQTT connection working properly');
        console.log('• If OLED messages not showing:');
        console.log('  - Check OLED wiring (SDA=21, SCL=22)');
        console.log('  - Verify OLED I2C address (0x3C)');
        console.log('  - Check OLED initialization in Serial Monitor');
        console.log('  - Ensure OLED display is powered');
    }
    
    console.log('\n=== ESP32 SERIAL MONITOR CHECKLIST ===');
    console.log('Look for these messages in ESP32 Serial Monitor:');
    console.log('• "MQTT connected successfully"');
    console.log('• "Data sent to MQTT broker successfully"');
    console.log('• "MQTT Message received on topic airquality/esp32_01/command"');
    console.log('• "OLED message: [your message]"');
    console.log('• "OLED display initialized successfully"');
    
    client.end();
    process.exit(0);
}

// Handle timeout
setTimeout(() => {
    console.log('\n✗ TEST TIMEOUT - No response within 30 seconds');
    showResults();
}, 30000);