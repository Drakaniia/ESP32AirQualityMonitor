import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Switch } from 'react-native';
import { Text } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { esp32API } from '../../services/api';
import { setSensorData } from '../../store/slices/sensorSlice';
import { setRelayState as setRelayStateAction } from '../../store/slices/relaySlice';
import { enableDemoMode, disableDemoMode, setDemoData } from '../../store/slices/demoSlice';
import { DemoModeService } from '../../services/demoMode';
import { MaterialIcons } from '@expo/vector-icons';

import SafetyStatus from '../../components/SafetyStatus';
import AirQualityCard from '../../components/AirQualityCard';
import DeviceStatusCard from '../../components/DeviceStatusCard';
import QuickStats from '../../components/QuickStats';
import SensorReadings from '../../components/SensorReadings';
import RelayControl from '../../components/RelayControl';
import ChartContainer from '../../components/ChartContainer';

export default function DashboardScreen() {
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);
    const [localData, setLocalData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [deviceOnline, setDeviceOnline] = useState(false);
    const [demoInterval, setDemoInterval] = useState(null);

    const relayState = useSelector(state => state.relay.relayState);
    const user = useSelector(state => state.auth.user);
    const isDemoMode = useSelector(state => state.demo.isDemoMode);

    useEffect(() => {
        if (isDemoMode) {
            const initialData = DemoModeService.generateRandomReading();
            const initialHistory = DemoModeService.generateHistoricalData(20);
            setLocalData(initialData);
            setHistoricalData(initialHistory);
            setDeviceOnline(true);
            dispatch(setDemoData(initialData));

            const interval = setInterval(() => {
                const newData = DemoModeService.generateRandomReading();
                setLocalData(newData);
                setHistoricalData(prev => [...prev.slice(-19), newData]);
                dispatch(setDemoData(newData));
                dispatch(setRelayStateAction(newData.relay_state));
            }, 3000);

            setDemoInterval(interval);
            return () => {
                if (interval) clearInterval(interval);
            };
        } else {
            if (demoInterval) {
                clearInterval(demoInterval);
                setDemoInterval(null);
            }

            const unsubscribe = esp32API.subscribeToSensorData((data) => {
                if (data && data.length > 0) {
                    const latest = data[0];
                    setLocalData(latest);
                    dispatch(setSensorData(latest));
                    setHistoricalData(data);
                    if (latest.relay_state) {
                        dispatch(setRelayStateAction(latest.relay_state));
                    }
                }
            }, 50);

            const checkDeviceStatus = async () => {
                try {
                    const status = await esp32API.getDeviceStatus('esp32_01');
                    setDeviceOnline(status !== null);
                } catch (error) {
                    setDeviceOnline(false);
                }
            };

            checkDeviceStatus();
            const statusInterval = setInterval(checkDeviceStatus, 30000);

            return () => {
                unsubscribe();
                clearInterval(statusInterval);
            };
        }
    }, [dispatch, isDemoMode]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (isDemoMode) {
                const newData = DemoModeService.generateRandomReading();
                setLocalData(newData);
            } else {
                const status = await esp32API.getDeviceStatus('esp32_01');
                setDeviceOnline(status !== null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleRelay = async () => {
        const newState = relayState === 'ON' ? 'OFF' : 'ON';
        try {
            dispatch(setRelayStateAction(newState));
            if (!isDemoMode) {
                await esp32API.controlRelay('esp32_01', newState);
            }
        } catch (error) {
            console.error('Error controlling relay:', error);
        }
    };

    const toggleDemoMode = () => {
        if (isDemoMode) {
            dispatch(disableDemoMode());
            setLocalData(null);
            setHistoricalData([]);
            setDeviceOnline(false);
        } else {
            dispatch(enableDemoMode());
        }
    };

    const temperature = isDemoMode ? Math.floor(Math.random() * (35 - 15) + 15) : 25;
    const humidity = isDemoMode ? Math.floor(Math.random() * (80 - 40) + 40) : 60;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
        >
            {isDemoMode && (
                <View style={styles.demoBanner}>
                    <MaterialIcons name="science" size={20} color="#ff9800" />
                    <Text style={styles.demoText}>DEMO MODE - Showing simulated data</Text>
                </View>
            )}

            <View style={styles.header}>
                <View>
                    <Text h4 style={{ color: '#757575' }}>Welcome, {user?.email?.split('@')[0] || 'User'}</Text>
                    <Text style={styles.subtitle}>ESP32 Air Quality Monitor</Text>
                </View>
                <View style={styles.demoToggle}>
                    <Text style={styles.demoLabel}>Demo</Text>
                    <Switch
                        value={isDemoMode}
                        onValueChange={toggleDemoMode}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isDemoMode ? '#ff9800' : '#f4f3f4'}
                    />
                </View>
            </View>

            <SafetyStatus reading={localData} deviceOnline={deviceOnline || isDemoMode} />
            <AirQualityCard ppm={localData?.ppm || 0} quality={localData?.quality || 'Unknown'} />
            <DeviceStatusCard
                online={deviceOnline || isDemoMode}
                lastUpdate={localData?.timestamp}
                deviceId={isDemoMode ? 'ESP32_DEMO_01' : 'ESP32_01'}
            />
            <QuickStats historicalData={historicalData} />
            <SensorReadings temperature={temperature} humidity={humidity} />
            <ChartContainer data={historicalData} />

            <View style={styles.relayContainer}>
                <RelayControl isEnabled={relayState === 'ON'} onToggle={toggleRelay} />
            </View>

            {localData && (
                <Text style={styles.lastUpdate}>
                    Last Update: {new Date(localData.timestamp).toLocaleTimeString()}
                </Text>
            )}

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    demoBanner: {
        backgroundColor: '#fff3e0',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#ff9800',
    },
    demoText: {
        marginLeft: 8,
        color: '#ff9800',
        fontWeight: 'bold',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subtitle: {
        color: '#757575',
    },
    demoToggle: {
        alignItems: 'center',
    },
    demoLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 4,
    },
    relayContainer: {
        margin: 15,
    },
    lastUpdate: {
        textAlign: 'center',
        color: '#9e9e9e',
        marginBottom: 20,
        fontSize: 12,
    },
});
