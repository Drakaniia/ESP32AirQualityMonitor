#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>

class WiFiManager {
private:
    const char* ssid;
    const char* password;
    uint32_t connectionTimeout;
    bool isConnected;

public:
    WiFiManager();
    bool connect();
    bool reconnect();
    bool checkConnection() const;
    String getLocalIP() const;
    int getSignalStrength() const;
    void disconnect();
    bool isConnectedToWiFi() const { return isConnected; }
};

#endif
