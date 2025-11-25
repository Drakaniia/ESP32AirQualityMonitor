### Wiring Diagram

#### Complete Circuit Diagram (ASCII)

```
                                    ESP32 Development Board
                        ╔═══════════════════════════════════════════╗
                        ║                                           ║
                        ║    ┌─────────────────────────────┐       ║
    ┌──────────┐        ║    │         ESP32-WROOM         │       ║
    │  OLED    │        ║    │                             │       ║
    │ SSD1306  │        ║    │  GPIO21 ○─────────┐         │       ║
    │  0.96"   │        ║    │  GPIO22 ○────────┐│         │       ║
    │   I2C    │        ║    │  GPIO34 ○───────┐││         │       ║
    └──────────┘        ║    │  GPIO26 ○──────┐│││         │       ║
         │              ║    │   3.3V  ○─────┐││││         │       ║
    VCC  │ GND          ║    │   5V    ○────┐│││││         │       ║
     │   │   SDA SCL    ║    │   GND   ○───┐││││││         │       ║
     │   │    │   │     ║    └──────────│───│││││││─────────┘       ║
     │   │    │   │     ║               │   │││││││                 ║
     │   │    │   │     ╚═══════════════│═══│││││││═════════════════╝
     │   │    │   │                     │   │││││││
     │   │    │   └─────────────────────┼───┼┼││││┘
     │   │    │                         │   │││││└────┐
     │   │    └─────────────────────────┼───┼┼│││     │
     │   │                              │   │││││     │
   ┌─┴───┴───┬───┬───┐               ┌─┴───┴┴┼││┼─┐ ┌─┴───┬───┬───┐
   │ 3.3V GND│SDA│SCL│               │ 3.3V 5V│││││ │ 5V GND│IN │NC │
   └─────────┴───┴───┘               └────────┼││││ └───────┴───┴───┘
    0.96" OLED Display                        │││││   5V Relay Module
      (I2C Interface)                         │││││
                                              │││││
                            ┌─────────────────┘││││
                            │  ┌───────────────┘│││
                            │  │  ┌─────────────┘││
                            │  │  │  ┌───────────┘│
                            │  │  │  │  ┌─────────┘
                         ┌──┴──┴──┴──┴──┴──┐
                         │ VCC GND DOUT AOUT│
                         └──────────────────┘
                           MQ-135 Gas Sensor
                          (Analog Air Quality)


                          POWER DISTRIBUTION
                          ==================

                               ESP32 (USB or VIN)
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                  3.3V               5V                GND
                    │                 │                 │
              ┌─────┴─────┐     ┌─────┴─────┐     ┌────┴────┐
              │           │     │           │     │         │
           OLED VCC   (other) Relay VCC  MQ-135  OLED GND Relay GND
                            │  MQ-135 VCC      │  MQ-135 GND
                            │                  │
```

#### Pin Connection Table

| Component | Component Pin | Wire Color (Suggested) | ESP32 Pin | Function |
|-----------|---------------|------------------------|-----------|----------|
| **OLED Display** |
| OLED | VCC | Red | 3.3V | Power Supply |
| OLED | GND | Black | GND | Ground |
| OLED | SDA | Blue | GPIO21 | I2C Data |
| OLED | SCL | Yellow | GPIO22 | I2C Clock |
| **MQ-135 Sensor** |
| MQ-135 | VCC | Red | 5V | Power Supply |
| MQ-135 | GND | Black | GND | Ground |
| MQ-135 | AOUT | Green | GPIO34 | Analog Output |
| MQ-135 | DOUT | (Not Used) | - | Digital Out (Optional) |
| **Relay Module** |
| Relay | VCC | Red | 5V | Power Supply |
| Relay | GND | Black | GND | Ground |
| Relay | IN | Orange | GPIO26 | Control Signal |
| Relay | NC/NO/COM | - | - | Load Connection |

#### Breadboard Layout Diagram

```
        Breadboard Layout (Top View)
        ============================

     j  i  h  g  f | e  d  c  b  a
    ================================  +Rail (5V)
 1  [ ][ ][ ][ ][ ]|[ ][ ][ ][ ][ ]
 2  [O][L][E][D][ ]|[ ][ ][ ][ ][ ]  ─Rail (GND)
 3  [ ]│ │ │ │    |    [ ][ ][ ][ ]
 4  [ ]│ │ │ └────┼────┘ [ ][ ][ ]
 5  [ ]│ │ └──────┼──────┘ [ ][ ]  ┌─────────────┐
 6  [ ]│ └────────┼────────┘ [ ]   │   ESP32     │
 7  [ ]└──────────┼──────────┘     │             │
 8  [ ][ ][ ][ ][ ]|[ ][ ][ ][ ]   │  ┌───────┐  │
 9  [M][Q][1][3][5]|[ ][ ][ ][ ]   │  │ USB-C │  │
10  [ ]│ │ │      |       [ ][ ]   │  └───────┘  │
11  [ ]│ │ └──────┼───────────┘    │             │
12  [ ]│ └────────┼────────────┘   │ 21 22 34 26 │
13  [ ]└──────────┼─────────────┘  │ │  │  │  │  │
14  [ ][ ][ ][ ][ ]|[ ][ ][ ][ ]   └─┼──┼──┼──┼──┘
15  [R][E][L][A][Y]|[ ][ ][ ][ ]     │  │  │  │
16  [ ]│ │ │      |       [ ][ ]    │  │  │  │
17  [ ]│ │ └──────┼───────────┘     │  │  │  │
18  [ ]│ └────────┼────────────┘    │  │  │  │
19  [ ]└──────────┼─────────────┘   │  │  │  │
20  [ ][ ][ ][ ][ ]|[ ][ ][ ][ ]    │  │  │  │
    ================================  │  │  │  │
     j  i  h  g  f | e  d  c  b  a   │  │  │  │
                                     │  │  │  │
    Connections via jumper wires: ───┘  │  │  │
    • OLED SDA (row 2) to GPIO21 ───────┘  │  │
    • OLED SCL (row 3) to GPIO22 ──────────┘  │
    • MQ135 AOUT (row 9) to GPIO34 ───────────┘
    • Relay IN (row 15) to GPIO26 ─────────────┘
```

#### Detailed Connection Notes

**Power Considerations:**
- ESP32 can be powered via USB (5V) or VIN pin (5-12V)
- 3.3V rail powers OLED only (low current)
- 5V rail powers MQ-135 sensor and relay (higher current)
- Ensure adequate USB power supply (500mA minimum)
- For production, use external 5V power supply (2A recommended)

**I2C Bus (OLED Display):**
- Uses hardware I2C (Wire library)
- Default address: 0x3C
- Pull-up resistors usually integrated on OLED module
- Keep I2C wires short (< 20cm) for reliability

**Analog Input (MQ-135):**
- GPIO34 is ADC1_CH6 (12-bit ADC, 0-4095 range)
- Sensor requires 24-48h preheat for accurate readings
- AOUT provides analog voltage proportional to gas concentration
- DOUT can be used for threshold detection (optional)

**Relay Control:**
- GPIO26 provides 3.3V logic signal
- Relay module includes opto-isolation and voltage conversion
- NO (Normally Open) and NC (Normally Closed) contacts
- COM (Common) connects to load
- Maximum switching: 10A @ 250VAC / 10A @ 30VDC

**Grounding:**
- Common ground essential for all components
- Star grounding recommended for sensitive analog readings
- Keep ground wires short and direct