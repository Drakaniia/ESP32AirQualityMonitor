# ESP32 Air Quality Monitor App

## 🚀 Getting Started

This guide will help you set up and run the mobile application for the ESP32 Air Quality Monitor.

### Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org/).
2.  **Expo Go App**: Install this on your mobile device to run the app.
    *   [Download for iOS](https://apps.apple.com/us/app/expo-go/id982107779)
    *   [Download for Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 📥 Installation

1.  Open your terminal or command prompt.
2.  Navigate to the project directory:
    ```bash
    cd ESP32Monitor
    ```
3.  Install the necessary dependencies:
    ```bash
    npm install
    ```

### 📱 Running the App

1.  Start the development server:
    ```bash
    npx expo start
    ```
    You will see a QR code appear in your terminal.

2.  **Connect your device**:
    *   **Android**: Open the **Expo Go** app and tap "Scan QR Code". Scan the code shown in your terminal.
    *   **iOS**: Open your default **Camera** app and scan the QR code. Tap the notification to open it in Expo Go.

### 💡 Using the App

*   **Authentication**:
    *   **Sign Up**: Create a new account using your email and password.
    *   **Login**: Access your dashboard with your credentials.
*   **Dashboard**:
    *   View real-time **Air Quality (PPM)**.
    *   Monitor **Temperature** and **Humidity**.
    *   Check the device connection status.
*   **Control**:
    *   Use the **Relay Switch** to turn your Air Purifier ON or OFF remotely.
*   **Offline Mode**:
    *   The app automatically saves the latest data. You can view the last known readings even when you don't have an internet connection.

### 🔧 Troubleshooting

*   **"Network request failed"**:
    *   Make sure your computer and mobile phone are connected to the **same Wi-Fi network**.
    *   Firewall settings on your computer might block the connection.
*   **App not loading / Stuck on splash screen**:
    *   Press `r` in the terminal to reload the app.
    *   Stop the server (Ctrl+C) and restart it with `npx expo start -c` to clear the cache.

---
*Part of the ESP32 Air Quality Monitor Project*
