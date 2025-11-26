import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, ButtonGroup } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoryScreen() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const buttons = ['All', 'Critical', 'Warnings', 'Normal'];

    // Placeholder data
    const alertData = [
        { id: '1', timestamp: new Date().toISOString(), ppm: 450, quality: 'Very Poor', severity: 'critical' },
        { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), ppm: 320, quality: 'Poor', severity: 'warning' },
        { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), ppm: 180, quality: 'Moderate', severity: 'normal' },
    ];

    const filterData = () => {
        switch (selectedIndex) {
            case 1: return alertData.filter(a => a.severity === 'critical');
            case 2: return alertData.filter(a => a.severity === 'warning');
            case 3: return alertData.filter(a => a.severity === 'normal');
            default: return alertData;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#f44336';
            case 'warning': return '#ff9800';
            case 'normal': return '#ffc107';
            default: return '#9e9e9e';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'warning': return 'warning';
            case 'normal': return 'info';
            default: return 'help';
        }
    };

    const renderAlertItem = ({ item }) => (
        <Card containerStyle={styles.alertCard}>
            <View style={styles.alertHeader}>
                <View style={styles.alertTitleContainer}>
                    <MaterialIcons
                        name={getSeverityIcon(item.severity)}
                        size={24}
                        color={getSeverityColor(item.severity)}
                    />
                    <View style={styles.alertInfo}>
                        <Text style={styles.qualityText}>{item.quality}</Text>
                        <Text style={styles.timestampText}>
                            {new Date(item.timestamp).toLocaleString()}
                        </Text>
                    </View>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                    <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.alertDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PPM Level:</Text>
                    <Text style={styles.detailValue}>{item.ppm.toFixed(1)}</Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text h4>Alert History</Text>
                <Text style={styles.subtitle}>View past air quality events</Text>
            </View>

            <ButtonGroup
                onPress={setSelectedIndex}
                selectedIndex={selectedIndex}
                buttons={buttons}
                containerStyle={styles.buttonGroup}
                selectedButtonStyle={styles.selectedButton}
                textStyle={styles.buttonText}
                selectedTextStyle={styles.selectedButtonText}
            />

            {filterData().length === 0 ? (
                <Card containerStyle={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="check-circle" size={64} color="#4caf50" />
                        <Text style={styles.emptyTitle}>No Alerts</Text>
                        <Text style={styles.emptyText}>
                            {selectedIndex === 0
                                ? 'No alert history available'
                                : `No ${buttons[selectedIndex].toLowerCase()} alerts found`}
                        </Text>
                    </View>
                </Card>
            ) : (
                <FlatList
                    data={filterData()}
                    renderItem={renderAlertItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    subtitle: {
        color: '#757575',
        marginTop: 5,
    },
    buttonGroup: {
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
    selectedButton: {
        backgroundColor: '#2196f3',
    },
    buttonText: {
        color: '#2196f3',
    },
    selectedButtonText: {
        color: '#ffffff',
    },
    list: {
        padding: 15,
    },
    alertCard: {
        borderRadius: 10,
        marginBottom: 10,
        padding: 15,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    alertTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    alertInfo: {
        marginLeft: 12,
        flex: 1,
    },
    qualityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
    },
    timestampText: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    alertDetails: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        color: '#757575',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#212121',
    },
    emptyCard: {
        borderRadius: 10,
        marginHorizontal: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 15,
        color: '#212121',
    },
    emptyText: {
        fontSize: 14,
        color: '#757575',
        marginTop: 8,
        textAlign: 'center',
    },
});
