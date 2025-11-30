import { NextRequest, NextResponse } from 'next/server';

// In-memory store for device commands
let deviceCommands: Record<string, any> = {
  'esp32_01': {
    relay_state: 'OFF',
    sampling_interval: 5,
    oled_message: '',
    last_update: Date.now()
  }
};

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  const deviceId = request.nextUrl.pathname.split('/').pop() || 'esp32_01';
  
  const command = deviceCommands[deviceId] || null;
  
  return NextResponse.json({
    ...command,
    device_id: deviceId
  });
}

export async function POST(request: NextRequest) {
  try {
    const { device_id, ...command } = await request.json();
    
    if (!device_id) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    // Update device command
    deviceCommands[device_id] = {
      ...command,
      last_update: Date.now()
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Command received successfully',
      command: deviceCommands[device_id]
    });
  } catch (error) {
    console.error('Error processing device command:', error);
    return NextResponse.json(
      { error: 'Failed to process device command' },
      { status: 500 }
    );
  }
}