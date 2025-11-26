import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';

export default function DeviceStatusCard({ online, lastUpdate, deviceId = 'ESP32_01' }) {
    const getTimeSinceLastUpdate = () => {
        if (!lastUpdate) return 'Never';

        const now = new Date();
        const last = new Date(lastUpdate);
        const diffMs = now.getTime() - last.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const getConnectionQuality = () => {
        if (!lastUpdate) return { quality: 'Unknown', color: '#9e9e9e', strength: 0 };

        const now = new Date();
        const last = new Date(lastUpdate);
        const diffMs = now.getTime() - last.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 2) return { quality: 'Excellent', color: '#4caf50', strength: 100 };
        if (diffMins < 5) return { quality: 'Good', color: '#2196f3', strength: 75 };
        if (diffMins < 15) return { quality: 'Fair', color: '#ffc107', strength: 50 };
        if (diffMins < 30) return { quality: 'Poor', color: '#ff9800', strength: 25 };
        return { quality: 'Very Poor', color: '#f44336', strength: 0 };
    };

    const connectionQuality = getConnectionQuality();

    return (
        <Card containerStyle={styles.card}>
            <View style={styles.header}>
                <Card.Title style={styles.title}>Device Status</Card.Title>
                <View style={styles.indicatorContainer}>
                    <View style={[styles.indicator, { backgroundColor: online ? '#4caf50' : '#f44336' }]} />
                </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
                <MaterialIcons
                    name={online ? 'check-circle' : 'cancel'}
                    size={20}
                    color={online ? '#4caf50' : '#f44336'}
                />
                <Text style={[styles.statusText, { color: online ? '#4caf50' : '#f44336' }]}>
                    {online ? 'Online' : 'Offline'}
                </Text>
            </View>

            {/* Device Info */}
            <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Device ID</Text>
                    <Text style={styles.value}>{deviceId}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Last Update</Text>
                    <Text style={styles.value}>{getTimeSinceLastUpdate()}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Connection</Text>
                    <View style={styles.connectionStatus}>
                        <View style={[styles.connectionDot, { backgroundColor: online ? '#4caf50' : '#f44336' }]} />
                        <Text style={styles.value}>{online ? 'Connected' : 'Disconnected'}</Text>
                    </View>
                </View>
            </View>

            {/* Signal Quality */}
            {online && (
                <View style={styles.signalContainer}>
                    <View style={styles.signalHeader}>
                        <Text style={styles.signalLabel}>Signal Quality</Text>
                        <Text style={[styles.signalQuality, { color: connectionQuality.color }]}>
                            {connectionQuality.quality}
                        </Text>
                    </View>
                    <View style={styles.signalBarContainer}>
                        <View
                            style={[
                                styles.signalBar,
                                {
                                    width: `${connectionQuality.strength}%`,
                                    backgroundColor: connectionQuality.color
                                }
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* System Status */}
            <View style={styles.systemStatus}>
                <View style={[styles.systemIcon, { backgroundColor: online ? '#e8f5e9' : '#f5f5f5' }]}>
                    <MaterialIcons
                        name="memory"
                        size={24}
                        color={online ? '#4caf50' : '#9e9e9e'}
                    />
                </View>
                <View style={styles.systemInfo}>
                    <Text style={styles.systemTitle}>
                        {online ? 'System Active' : 'System Inactive'}
                    </Text>
                    <Text style={styles.systemSubtitle}>
                        {online ? 'Monitoring active' : 'Awaiting connection'}
                    </Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        margin: 0,
        textAlign: 'left',
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        marginBottom: 15,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    infoContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
    },
    value: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#212121',
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    signalContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    signalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    signalLabel: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
    },
    signalQuality: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    signalBarContainer: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    signalBar: {
        height: '100%',
        borderRadius: 4,
    },
    systemStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    systemIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    systemInfo: {
        flex: 1,
    },
    systemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212121',
    },
    systemSubtitle: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
});
