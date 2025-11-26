import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Text, Card, Button, ListItem } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleNotifications, setTheme, updateSettings } from '../../store/slices/settingsSlice';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const dispatch = useDispatch();
    const settings = useSelector(state => state.settings);
    const user = useSelector(state => state.auth.user);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            dispatch(logout());
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text h4>Settings</Text>
                <Text style={styles.subtitle}>Customize your app experience</Text>
            </View>

            {/* User Info */}
            <Card containerStyle={styles.card}>
                <Card.Title>Account Information</Card.Title>
                <Card.Divider />
                <ListItem>
                    <MaterialIcons name="email" size={24} color="#3b82f6" />
                    <ListItem.Content>
                        <ListItem.Title>Email</ListItem.Title>
                        <ListItem.Subtitle>{user?.email || 'Not logged in'}</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem>
                    <MaterialIcons name="verified-user" size={24} color={user?.emailVerified ? '#4caf50' : '#ff9800'} />
                    <ListItem.Content>
                        <ListItem.Title>Verification Status</ListItem.Title>
                        <ListItem.Subtitle>{user?.emailVerified ? 'Verified' : 'Not Verified'}</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
            </Card>

            {/* Notifications */}
            <Card containerStyle={styles.card}>
                <Card.Title>Notifications</Card.Title>
                <Card.Divider />
                <ListItem>
                    <MaterialIcons name="notifications" size={24} color="#3b82f6" />
                    <ListItem.Content>
                        <ListItem.Title>Push Notifications</ListItem.Title>
                        <ListItem.Subtitle>Receive alerts for air quality changes</ListItem.Subtitle>
                    </ListItem.Content>
                    <Switch
                        value={settings.notificationsEnabled}
                        onValueChange={() => dispatch(toggleNotifications())}
                    />
                </ListItem>
            </Card>

            {/* App Preferences */}
            <Card containerStyle={styles.card}>
                <Card.Title>Preferences</Card.Title>
                <Card.Divider />
                <ListItem>
                    <MaterialIcons name="refresh" size={24} color="#3b82f6" />
                    <ListItem.Content>
                        <ListItem.Title>Data Refresh Interval</ListItem.Title>
                        <ListItem.Subtitle>{settings.refreshInterval / 1000} seconds</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <View style={styles.intervalButtons}>
                    {[3000, 5000, 10000].map(interval => (
                        <Button
                            key={interval}
                            title={`${interval / 1000}s`}
                            type={settings.refreshInterval === interval ? 'solid' : 'outline'}
                            buttonStyle={styles.intervalButton}
                            onPress={() => dispatch(updateSettings({ refreshInterval: interval }))}
                        />
                    ))}
                </View>
            </Card>

            {/* About */}
            <Card containerStyle={styles.card}>
                <Card.Title>About</Card.Title>
                <Card.Divider />
                <ListItem>
                    <MaterialIcons name="info" size={24} color="#3b82f6" />
                    <ListItem.Content>
                        <ListItem.Title>Version</ListItem.Title>
                        <ListItem.Subtitle>1.0.0</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
                <ListItem>
                    <MaterialIcons name="code" size={24} color="#3b82f6" />
                    <ListItem.Content>
                        <ListItem.Title>ESP32 Air Quality Monitor</ListItem.Title>
                        <ListItem.Subtitle>IoT Air Quality Monitoring System</ListItem.Subtitle>
                    </ListItem.Content>
                </ListItem>
            </Card>

            {/* Logout Button */}
            <View style={styles.logoutContainer}>
                <Button
                    title="Logout"
                    icon={<MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />}
                    buttonStyle={styles.logoutButton}
                    onPress={handleLogout}
                />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
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
    card: {
        borderRadius: 10,
        marginBottom: 15,
    },
    intervalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
    intervalButton: {
        paddingHorizontal: 20,
    },
    logoutContainer: {
        paddingHorizontal: 15,
        marginTop: 10,
    },
    logoutButton: {
        backgroundColor: '#f44336',
        borderRadius: 8,
        paddingVertical: 12,
    },
});
