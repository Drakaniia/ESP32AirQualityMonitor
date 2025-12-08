import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const commandData = await request.json();
    const deviceId = params.deviceId;

    // Store the command for the device to retrieve
    // In a real implementation, this would use a database or message queue
    // For now, we'll use the existing deviceCommands store from the route.ts file
    
    // Forward to the existing device commands endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/device-commands/${deviceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: deviceId,
        ...commandData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to forward command: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Command sent successfully',
      command: result.command
    });

  } catch (error) {
    console.error('Error in send-command API:', error);
    return NextResponse.json(
      { error: 'Failed to send command' },
      { status: 500 }
    );
  }
}