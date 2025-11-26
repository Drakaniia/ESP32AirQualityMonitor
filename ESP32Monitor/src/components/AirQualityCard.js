import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-elements';

export default function AirQualityCard({ ppm, quality }) {
    const getColor = (quality) => {
        switch (quality) {
            case 'Excellent': return '#4caf50';
            case 'Good': return '#8bc34a';
            case 'Moderate': return '#ffeb3b';
            case 'Poor': return '#ff9800';
            case 'Very Poor': return '#ff5722';
            case 'Hazardous': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    const color = getColor(quality);

    return (
        <Card containerStyle={[styles.card, { borderColor: color, borderTopWidth: 4 }]}>
            <Card.Title>Air Quality Index</Card.Title>
            <Card.Divider />
            <View style={styles.content}>
                <Text h2 style={{ color }}>{ppm} PPM</Text>
                <Text h4 style={{ color }}>{quality}</Text>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        alignItems: 'center',
        paddingVertical: 10,
    },
});
