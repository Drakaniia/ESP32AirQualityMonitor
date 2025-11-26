import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-elements';

export default function QuickStats({ historicalData }) {
    const getStats = () => {
        if (!historicalData || historicalData.length === 0) {
            return { total: 0, avg24h: 0, alerts: 0 };
        }

        const total = historicalData.length;
        const recent24h = historicalData.filter(r =>
            new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        const avg24h = recent24h.length > 0
            ? recent24h.reduce((sum, r) => sum + r.ppm, 0) / recent24h.length
            : 0;

        const alerts = historicalData.filter(r =>
            ['Poor', 'Very Poor', 'Hazardous'].includes(r.quality)
        ).length;

        return { total, avg24h, alerts };
    };

    const stats = getStats();

    return (
        <Card containerStyle={styles.card}>
            <Card.Title>Quick Stats</Card.Title>
            <Card.Divider />

            <View style={styles.statItem}>
                <Text style={styles.label}>Total Readings</Text>
                <Text style={styles.value}>{stats.total}</Text>
            </View>

            <View style={styles.statItem}>
                <Text style={styles.label}>Avg PPM (24h)</Text>
                <Text style={styles.value}>{stats.avg24h.toFixed(1)}</Text>
            </View>

            <View style={styles.statItem}>
                <Text style={styles.label}>Total Alerts</Text>
                <Text style={[styles.value, { color: stats.alerts > 0 ? '#f44336' : '#4caf50' }]}>
                    {stats.alerts}
                </Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
    },
});
