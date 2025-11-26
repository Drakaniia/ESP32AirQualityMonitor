import { db, rtdb } from './firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { ref, set, get, child } from 'firebase/database';

export const esp32API = {
    // Firestore operations (Historical Data)
    getSensorData: async (limitCount = 50) => {
        try {
            const q = query(
                collection(db, 'readings'),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching sensor data:', error);
            throw error;
        }
    },

    subscribeToSensorData: (callback, limitCount = 1) => {
        const q = query(
            collection(db, 'readings'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(data);
        }, (error) => {
            console.error('Error subscribing to sensor data:', error);
        });
    },

    getDeviceStatus: async (deviceId) => {
        try {
            const snapshot = await get(child(ref(rtdb), `devices/${deviceId}`));
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching device status:', error);
            throw error;
        }
    },

    // RTDB operations (Real-time Control)
    controlRelay: async (deviceId, state) => {
        try {
            await set(ref(rtdb, `commands/${deviceId}/relay_state`), state);
            await set(ref(rtdb, `commands/${deviceId}/last_update`), Date.now());
            return true;
        } catch (error) {
            console.error('Error controlling relay:', error);
            throw error;
        }
    },

    updateSettings: async (deviceId, settings) => {
        try {
            await set(ref(rtdb, `commands/${deviceId}`), {
                ...settings,
                last_update: Date.now()
            });
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
};
