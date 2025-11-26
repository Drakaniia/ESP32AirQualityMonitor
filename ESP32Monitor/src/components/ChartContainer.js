import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-elements';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ChartContainer({ data }) {
    if (!data || data.length === 0) {
        return (
            <Card containerStyle={styles.card}>
                <Card.Title>PPM Trend</Card.Title>
                <Text style={styles.noData}>No data available</Text>
            </Card>
        );
    }

    // Prepare chart data - take last 10 readings
    const chartData = data.slice(-10);
    const ppmValues = chartData.map(d => d.ppm);
    const labels = chartData.map((d, i) => {
        const time = new Date(d.timestamp);
        return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
    });

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#2196f3',
        },
    };

    return (
        <Card containerStyle={styles.card}>
            <Card.Title>Air Quality Trend (Last 10 Readings)</Card.Title>
            <Card.Divider />
            <View style={styles.chartContainer}>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [
                            {
                                data: ppmValues,
                            },
                        ],
                    }}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    fromZero
                />
            </View>
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
                    <Text style={styles.legendText}>Good (&lt;200)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ffc107' }]} />
                    <Text style={styles.legendText}>Moderate (200-350)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
                    <Text style={styles.legendText}>Poor (&gt;350)</Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        marginBottom: 15,
    },
    noData: {
        textAlign: 'center',
        padding: 20,
        color: '#757575',
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    chart: {
        borderRadius: 8,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 11,
        color: '#757575',
    },
});
