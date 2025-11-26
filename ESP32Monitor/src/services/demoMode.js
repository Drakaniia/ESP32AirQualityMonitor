// Simulation/Demo Mode Service
export class DemoModeService {
    static generateRandomReading() {
        const ppm = Math.floor(Math.random() * (1000 - 50) + 50);
        const quality = this.getQualityFromPPM(ppm);
        const relayState = ['Poor', 'Very Poor', 'Hazardous'].includes(quality) ? 'ON' : 'OFF';

        return {
            device_id: 'DEMO_DEVICE',
            ppm,
            quality,
            relay_state: relayState,
            timestamp: new Date().toISOString(),
        };
    }

    static getQualityFromPPM(ppm) {
        if (ppm < 50) return 'Excellent';
        if (ppm < 100) return 'Good';
        if (ppm < 200) return 'Moderate';
        if (ppm < 350) return 'Poor';
        if (ppm < 500) return 'Very Poor';
        return 'Hazardous';
    }

    static generateHistoricalData(count = 20) {
        const data = [];
        const now = Date.now();

        for (let i = count - 1; i >= 0; i--) {
            const timestamp = new Date(now - i * 60000); // 1 minute intervals
            const reading = this.generateRandomReading();
            reading.timestamp = timestamp.toISOString();
            data.push(reading);
        }

        return data;
    }
}
