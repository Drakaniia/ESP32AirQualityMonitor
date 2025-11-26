import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from 'react-native-elements';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function SignupScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Signup Failed', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text h3 style={styles.title}>Create Account</Text>
            <View style={styles.form}>
                <Input
                    placeholder="Email"
                    leftIcon={{ type: 'material', name: 'email' }}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <Input
                    placeholder="Password"
                    leftIcon={{ type: 'material', name: 'lock' }}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <Input
                    placeholder="Confirm Password"
                    leftIcon={{ type: 'material', name: 'lock' }}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />
                <Button
                    title="Sign Up"
                    onPress={handleSignup}
                    loading={isSubmitting}
                    containerStyle={styles.buttonContainer}
                />
                <Button
                    title="Back to Login"
                    type="clear"
                    onPress={() => navigation.goBack()}
                    containerStyle={styles.buttonContainer}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
    },
    form: {
        width: '100%',
    },
    buttonContainer: {
        marginTop: 10,
    },
});
