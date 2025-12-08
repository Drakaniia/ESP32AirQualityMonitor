interface SensorReading {
  device_id: string
  ppm: number
  quality: string
  relay_state: string
  timestamp: string
}

interface AlertEntry {
  id: string
  timestamp: string
  ppm: number
  quality: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  device_id: string
  relay_state: string
  isSimulated: boolean
}

export class FakeDataGenerator {
  private deviceId: string
  private currentPPM: number
  private trend: 'rising' | 'falling' | 'stable'
  private lastChangeTime: number
  private alertHistory: AlertEntry[]

  constructor(deviceId: string = 'ESP32_SIM_01') {
    this.deviceId = deviceId
    this.currentPPM = 25 // Start in normal range (10-50 PPM)
    this.trend = 'stable'
    this.lastChangeTime = Date.now()
    this.alertHistory = []
  }

  private getQualityFromPPM(ppm: number): string {
    if (ppm < 25) return 'Excellent'  // Clean air (10-25 PPM)
    if (ppm < 50) return 'Good'       // Normal indoor air (25-50 PPM)
    if (ppm < 200) return 'Moderate'  // Light cooking/activity (50-200 PPM)
    if (ppm < 500) return 'Poor'       // Elevated levels (200-500 PPM)
    if (ppm < 1000) return 'Very Poor'  // High levels (500-1000 PPM)
    return 'Hazardous'  // Dangerous levels (>1000 PPM)
  }

  private getSeverityFromQuality(quality: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (quality) {
      case 'Hazardous':
      case 'Very Poor':
        return 'critical'
      case 'Poor':
        return 'high'
      case 'Moderate':
        return 'medium'
      default:
        return 'low'
    }
  }

  private updateTrend(): void {
    const now = Date.now()
    const timeSinceLastChange = now - this.lastChangeTime

    // Change trend every 10-30 seconds
    if (timeSinceLastChange > 10000 + Math.random() * 20000) {
      const trends: Array<'rising' | 'falling' | 'stable'> = ['rising', 'falling', 'stable']
      this.trend = trends[Math.floor(Math.random() * trends.length)]
      this.lastChangeTime = now
    }
  }

  private calculateNextPPM(): number {
    this.updateTrend()

    let change = 0
    const volatility = Math.random() * 10 - 5 // Random change between -5 and +5

    switch (this.trend) {
      case 'rising':
        change = 2 + Math.random() * 8 // +2 to +10
        break
      case 'falling':
        change = -(2 + Math.random() * 8) // -2 to -10
        break
      case 'stable':
        change = volatility // Small random changes
        break
    }

    let newPPM = this.currentPPM + change

    // Keep within realistic bounds
    newPPM = Math.max(10, Math.min(2000, newPPM))

    // Occasionally create spikes
    if (Math.random() < 0.05) { // 5% chance of spike
      newPPM += Math.random() > 0.5 ? 300 : -50
      newPPM = Math.max(10, Math.min(2000, newPPM))
    }

    this.currentPPM = newPPM
    return newPPM
  }

  private shouldRelayBeOn(quality: string): string {
    // Turn on relay for poor air quality
    return ['Poor', 'Very Poor', 'Hazardous'].includes(quality) ? 'ON' : 'OFF'
  }

  generateReading(): SensorReading {
    const ppm = this.calculateNextPPM()
    const quality = this.getQualityFromPPM(ppm)
    const relayState = this.shouldRelayBeOn(quality)

    return {
      device_id: this.deviceId,
      ppm,
      quality,
      relay_state: relayState,
      timestamp: new Date().toISOString(),
    }
  }

  generateHistoricalData(count: number = 50): SensorReading[] {
    const data: SensorReading[] = []
    const now = new Date()

    for (let i = count - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000) // 1 minute intervals
      const reading = this.generateReading()
      reading.timestamp = timestamp.toISOString()
      data.push(reading)
    }

    return data
  }

  generateAlertEntry(): AlertEntry | null {
    const reading = this.generateReading()
    const severity = this.getSeverityFromQuality(reading.quality)

    // Only generate alerts for medium severity and above
    if (severity === 'low') return null

    const alert: AlertEntry = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: reading.timestamp,
      ppm: reading.ppm,
      quality: reading.quality,
      severity,
      device_id: reading.device_id,
      relay_state: reading.relay_state,
      isSimulated: true,
    }

    this.alertHistory.push(alert)

    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100)
    }

    return alert
  }

  getAlertHistory(): AlertEntry[] {
    return [...this.alertHistory].reverse() // Most recent first
  }

  clearAlertHistory(): void {
    this.alertHistory = []
  }

  // Simulate different scenarios
  setScenario(scenario: 'normal' | 'warning' | 'critical' | 'recovery'): void {
    switch (scenario) {
      case 'normal':
        this.currentPPM = 10 + Math.random() * 40 // 10-50 PPM (normal indoor air)
        this.trend = 'stable'
        break
      case 'warning':
        this.currentPPM = 200 + Math.random() * 300 // 200-500 PPM (elevated levels)
        this.trend = Math.random() > 0.5 ? 'rising' : 'stable'
        break
      case 'critical':
        this.currentPPM = 1000 + Math.random() * 500 // 1000-1500 PPM (dangerous levels)
        this.trend = Math.random() > 0.3 ? 'rising' : 'stable'
        break
      case 'recovery':
        this.currentPPM = Math.max(15, this.currentPPM - 300)
        this.trend = 'falling'
        break
    }
    this.lastChangeTime = Date.now()
  }

  getCurrentState(): {
    ppm: number
    quality: string
    trend: string
    deviceId: string
  } {
    return {
      ppm: this.currentPPM,
      quality: this.getQualityFromPPM(this.currentPPM),
      trend: this.trend,
      deviceId: this.deviceId,
    }
  }
}

export default FakeDataGenerator