import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import GlassCard from './GlassCard';

export default function SafetyStatus({ reading, deviceOnline }) {
    const [showDetails, setShowDetails] = useState(false);

    const getStatusConfig = () => {
        if (!deviceOnline) {
            return {
                status: 'UNKNOWN',
                level: 'unknown',
                color: '#9e9e9e',
                bgColor: '#f5f5f5',
                icon: '❓',
                message: 'Device offline - Cannot determine safety status',
                recommendation: 'Check device connection and power supply',
                description: 'No data available from the sensor.',
                statusOrder: 0
            };
        }

        if (!reading) {
            return {
                status: 'UNKNOWN',
                level: 'unknown',
                color: '#9e9e9e',
                bgColor: '#f5f5f5',
                icon: '❓',
                message: 'No recent data available',
                recommendation: 'Waiting for sensor readings',
                description: 'The system is waiting for new sensor data.',
                statusOrder: 0
            };
        }

        switch (reading.quality) {
            case 'Excellent':
                return {
                    status: 'SAFE',
                    level: 'safe',
                    color: '#4caf50',
                    bgColor: '#e8f5e9',
                    icon: '🌿',
                    message: 'Air quality is excellent - Safe for all activities',
                    recommendation: 'Normal ventilation is sufficient',
                    description: 'The air quality is ideal. No health concerns.',
                    statusOrder: 6
                };
            case 'Good':
                return {
                    status: 'SAFE',
                    level: 'safe',
                    color: '#8bc34a',
                    bgColor: '#f1f8e9',
                    icon: '😊',
                    message: 'Air quality is good - Safe for normal activities',
                    recommendation: 'Maintain normal ventilation',
                    description: 'The air quality is satisfactory.',
                    statusOrder: 5
                };
            case 'Moderate':
                return {
                    status: 'CAUTION',
                    level: 'caution',
                    color: '#ffc107',
                    bgColor: '#fffde7',
                    icon: '⚠️',
                    message: 'Air quality is moderate',
                    recommendation: 'Consider increasing ventilation',
                    description: 'Acceptable for general population.',
                    statusOrder: 4
                };
            case 'Poor':
                return {
                    status: 'WARNING',
                    level: 'warning',
                    color: '#ff9800',
                    bgColor: '#fff3e0',
                    icon: '😷',
                    message: 'Air quality is poor',
                    recommendation: 'Increase ventilation, consider air purification',
                    description: 'Health effects may be felt by sensitive groups.',
                    statusOrder: 3
                };
            case 'Very Poor':
                return {
                    status: 'UNSAFE',
                    level: 'unsafe',
                    color: '#f44336',
                    bgColor: '#ffebee',
                    icon: '🚨',
                    message: 'Air quality is very poor',
                    recommendation: 'Minimize exposure, use air purifiers',
                    description: 'Everyone may experience health effects.',
                    statusOrder: 2
                };
            case 'Hazardous':
                return {
                    status: 'HAZARDOUS',
                    level: 'hazardous',
                    color: '#9c27b0',
                    bgColor: '#f3e5f5',
                    icon: '☣️',
                    message: 'Air quality is hazardous - Emergency conditions',
                    recommendation: 'Stay indoors, seal windows/doors, use air purifiers',
                    description: 'Serious health risks to everyone.',
                    statusOrder: 1
                };
            default:
                return {
                    status: 'UNKNOWN',
                    level: 'unknown',
                    color: '#9e9e9e',
                    bgColor: '#f5f5f5',
                    icon: '❓',
                    message: 'Unable to determine air quality status',
                    recommendation: 'Check sensor functionality',
                    description: 'Could not determine air quality level.',
                    statusOrder: 0
                };
        }
    };

    const safetyStatus = getStatusConfig();
    const safetyPercentage = (safetyStatus.statusOrder / 6) * 100;

    return (
        <Card containerStyle={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Air Quality & Safety Status</Text>
                    <Text style={styles.subtitle}>Real-time monitoring</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setShowDetails(!showDetails)}
                    style={styles.detailsButton}
                >
                    <Text style={styles.detailsButtonText}>
                        {showDetails ? 'Hide' : 'Show'} Details
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Status */}
            <View style={styles.statusContainer}>
                <View style={styles.statusContent}>
                    <Text style={styles.statusIcon}>{safetyStatus.icon}</Text>
                    <View>
                        <Text style={[styles.statusText, { color: safetyStatus.color }]}>
                            {safetyStatus.status}
                        </Text>
                        <Text style={styles.levelText}>{safetyStatus.level.toUpperCase()} LEVEL</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${safetyPercentage}%`, backgroundColor: safetyStatus.color }
                        ]}
                    />
                </View>
            </View>

            {/* Description */}
            <View style={[styles.descriptionBox, { backgroundColor: safetyStatus.bgColor }]}>
                <Text style={styles.messageText}>{safetyStatus.message}</Text>
                <Text style={styles.descriptionText}>{safetyStatus.description}</Text>
            </View>

            {/* Recommendations */}
            <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>Recommended Actions</Text>
                <View style={[styles.recommendationsBox, { backgroundColor: safetyStatus.bgColor }]}>
                    <Text style={styles.recommendationsText}>{safetyStatus.recommendation}</Text>
                </View>
            </View>

            {/* Details Section */}
            {showDetails && reading && (
                <View style={styles.detailsContainer}>
                    <Text style={styles.detailsTitle}>Sensor Data</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Current PPM:</Text>
                            <Text style={styles.detailValue}>{reading.ppm.toFixed(1)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Quality Level:</Text>
                            <Text style={styles.detailValue}>{reading.quality}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Relay Status:</Text>
                            <Text style={[styles.detailValue, { color: reading.relay_state === 'ON' ? '#4caf50' : '#9e9e9e' }]}>
                                {reading.relay_state}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Device Status:</Text>
                            <Text style={[styles.detailValue, { color: deviceOnline ? '#4caf50' : '#f44336' }]}>
                                {deviceOnline ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.lastUpdate}>
                        Last updated: {new Date(reading.timestamp).toLocaleString()}
                    </Text>
                </View>
            )}

            {/* Alert Banner */}
            <View style={[styles.alertBanner, { borderColor: safetyStatus.color }]}>
                <MaterialIcons
                    name={safetyStatus.level === 'safe' ? 'check-circle' : 'warning'}
                    size={20}
                    color={safetyStatus.color}
                />
                <Text style={styles.alertText}>
                    {safetyStatus.level === 'hazardous' ? 'Emergency Alert' :
                        safetyStatus.level === 'unsafe' ? 'Health Alert' :
                            safetyStatus.level === 'warning' ? 'Caution Advised' :
                                safetyStatus.level === 'caution' ? 'Monitor Conditions' :
                                    safetyStatus.level === 'safe' ? 'Conditions are Normal' : 'Data Unavailable'}
                </Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        marginBottom: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    detailsButton: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    detailsButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusContainer: {
        marginBottom: 15,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusIcon: {
        fontSize: 50,
        marginRight: 15,
    },
    statusText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    levelText: {
        fontSize: 11,
        color: '#757575',
        fontWeight: '600',
        marginTop: 2,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    descriptionBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    messageText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    descriptionText: {
        fontSize: 13,
        color: '#616161',
    },
    recommendationsContainer: {
        marginBottom: 15,
    },
    recommendationsTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    recommendationsBox: {
        padding: 12,
        borderRadius: 8,
    },
    recommendationsText: {
        fontSize: 13,
        color: '#424242',
    },
    detailsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 15,
        marginTop: 10,
    },
    detailsTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 10,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        width: '50%',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 12,
        color: '#757575',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    lastUpdate: {
        fontSize: 11,
        color: '#9e9e9e',
        textAlign: 'center',
        marginTop: 10,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        marginTop: 10,
    },
    alertText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
});
