import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Input, Button, Text } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useDispatch } from 'react-redux';
import { setUser, setLoading, setError } from '../../store/slices/authSlice';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useDispatch();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setIsSubmitting(true);
        dispatch(setLoading(true));

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            dispatch(setUser({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
            }));

            navigation.replace('Main');
        } catch (error) {
            console.error(error);
            dispatch(setError(error.message));
            Alert.alert('Login Failed', error.message);
        } finally {
            setIsSubmitting(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <View style={styles.container}>
            <MaterialIcons name="air" size={80} color="#2196f3" style={styles.logo} />
            <Text h3 style={styles.title}>Air Quality Monitor</Text>
            <Text style={styles.subtitle}>Monitor your air, breathe better</Text>

            <View style={styles.form}>
                <Input
                    placeholder="Email"
                    leftIcon={<MaterialIcons name="email" size={24} color="#757575" />}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    inputContainerStyle={styles.inputContainer}
                />
                <Input
                    placeholder="Password"
                    leftIcon={<MaterialIcons name="lock" size={24} color="#757575" />}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    inputContainerStyle={styles.inputContainer}
                />
                <Button
                    title="Login"
                    onPress={handleLogin}
                    loading={isSubmitting}
                    containerStyle={styles.buttonContainer}
                    buttonStyle={styles.loginButton}
                />
                <Button
                    title="Create Account"
                    type="outline"
                    onPress={() => navigation.navigate('Signup')}
                    containerStyle={styles.buttonContainer}
                    buttonStyle={styles.signupButton}
                    titleStyle={{ color: '#2196f3' }}
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
        backgroundColor: '#f5f5f5',
    },
    logo: {
        textAlign: 'center',
        alignSelf: 'center',
        marginBottom: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 5,
        color: '#212121',
    },
    subtitle: {
        textAlign: 'center',
        color: '#757575',
        marginBottom: 40,
        fontSize: 14,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        borderRadius: 8,
    },
    buttonContainer: {
        marginTop: 10,
    },
    loginButton: {
        backgroundColor: '#2196f3',
        borderRadius: 8,
        paddingVertical: 12,
    },
    signupButton: {
        borderColor: '#2196f3',
        borderRadius: 8,
        paddingVertical: 12,
    },
});
