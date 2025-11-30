import { NextRequest, NextResponse } from 'next/server';

// In-memory store for sensor data (in production, you'd use a database)
let sensorData: any[] = [];
let currentReading: any = null;
let deviceOnline = true;
let lastUpdate = Date.now();

// Simple pub-sub mechanism for real-time updates
const subscribers: ((data: any) => void)[] = [];

export async function GET(request: NextRequest) {
  // Return current sensor data
  return NextResponse.json({
    currentReading,
    historicalData: sensorData.slice(-50), // Return last 50 readings
    deviceOnline,
    lastUpdate
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the incoming data
    if (!data.device_id || data.ppm === undefined || !data.quality || data.relay_state === undefined) {
      return NextResponse.json(
        { error: 'Invalid data format' }, 
        { status: 400 }
      );
    }
    
    // Update current reading
    const timestamp = data.timestamp || new Date().toISOString();
    currentReading = {
      ...data,
      timestamp
    };
    
    // Add to historical data
    sensorData.push(currentReading);
    
    // Keep only the last 1000 readings to prevent memory issues
    if (sensorData.length > 1000) {
      sensorData = sensorData.slice(-1000);
    }
    
    // Update device online status and last update time
    deviceOnline = true;
    lastUpdate = Date.now();
    
    // Notify any subscribers (for real-time updates if needed)
    subscribers.forEach(callback => callback(currentReading));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sensor data received successfully' 
    });
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to process sensor data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { device_id, status } = await request.json();
    
    if (!device_id) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    if (status !== undefined) {
      deviceOnline = status === 'online';
      if (status === 'offline') {
        lastUpdate = Date.now();
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      deviceOnline 
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    return NextResponse.json(
      { error: 'Failed to update device status' },
      { status: 500 }
    );
  }
}