# Firebase Configuration

This directory contains the Firebase configuration files for the ESP32 Air Quality Monitor project.

## Files Overview

### `firestore.rules`
Security rules for Firestore database that control access to sensor readings and device data.

### `database.rules.json`
Security rules for Realtime Database that manage device commands and control messages.

### `firestore.indexes.json`
Database indexes for optimizing Firestore queries on sensor data.

### `firebase.json`
Main Firebase project configuration file.

### `.firebaserc`
Firebase project alias configuration.

## Deployment

To deploy Firebase configuration:

```bash
cd firebase
firebase deploy --only firestore,database
```

## Security Rules

### Firestore Rules
- Allow read access to authenticated users for sensor readings
- Allow write access only from ESP32 devices
- Restrict document creation and updates based on data structure

### Realtime Database Rules
- Allow ESP32 devices to read commands
- Allow authenticated users to send commands
- Validate command structure and values

## Database Structure

### Firestore Collections
- `readings`: Sensor data with device_id, timestamp, ppm, and other metrics
- `devices`: Device status and configuration information

### Realtime Database Structure
- `commands/{deviceId}`: Real-time commands for specific devices
- `status/{deviceId}`: Device online status and last seen

## Indexes

The `firestore.indexes.json` file defines composite indexes for:
- Queries by device_id and timestamp
- Optimized for dashboard data retrieval

## Security Considerations

- Rules restrict access based on authentication status
- Data validation prevents malformed entries
- Device-specific access control for commands
- Rate limiting considerations for sensor data uploads

## Maintenance

- Monitor database usage in Firebase Console
- Update security rules as needed
- Review and optimize indexes based on query patterns
- Set up billing alerts for production usage