import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-elements';
import { FontAwesome } from '@expo/vector-icons';

export default function SensorReadings({ temperature, humidity }) {
    return (
        <View style={styles.container}>
            <View style={styles.item}>
                <FontAwesome name="thermometer" color="#f44336" size={24} />
                <Text style={styles.value}>{temperature}°C</Text>
                <Text style={styles.label}>Temperature</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <FontAwesome name="tint" color="#2196f3" size={24} />
                <Text style={styles.value}>{humidity}%</Text>
                <Text style={styles.label}>Humidity</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    item: {
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: '#e0e0e0',
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    label: {
        color: '#757575',
    },
});
