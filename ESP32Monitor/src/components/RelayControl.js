import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Text, Card } from 'react-native-elements';
import { FontAwesome } from '@expo/vector-icons';

export default function RelayControl({ isEnabled, onToggle, loading }) {
    return (
        <Card containerStyle={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <FontAwesome name="power-off" color={isEnabled ? '#4caf50' : '#757575'} size={20} />
                    <Text style={styles.title}>Air Purifier</Text>
                </View>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isEnabled ? '#2196f3' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={onToggle}
                    value={isEnabled}
                    disabled={loading}
                />
            </View>
            <Text style={styles.status}>
                Status: <Text style={{ fontWeight: 'bold', color: isEnabled ? '#4caf50' : '#757575' }}>
                    {isEnabled ? 'ON' : 'OFF'}
                </Text>
            </Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    status: {
        color: '#757575',
    },
});
