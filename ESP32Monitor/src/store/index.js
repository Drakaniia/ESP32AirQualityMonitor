import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import sensorReducer from './slices/sensorSlice';
import relayReducer from './slices/relaySlice';
import settingsReducer from './slices/settingsSlice';
import demoReducer from './slices/demoSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    sensor: sensorReducer,
    relay: relayReducer,
    settings: settingsReducer,
    demo: demoReducer,
});

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'settings'], // Persist auth and settings, maybe sensor data too?
    // Plan says "Local data caching", so let's persist sensor data too but maybe limit it.
    // For now, persist everything except maybe loading states which are handled in reducers.
    // Actually, let's persist everything for now.
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);
export default store;
