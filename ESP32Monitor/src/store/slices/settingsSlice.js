import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    notificationsEnabled: true,
    refreshInterval: 5000,
    theme: 'light',
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        updateSettings: (state, action) => {
            return { ...state, ...action.payload };
        },
        toggleNotifications: (state) => {
            state.notificationsEnabled = !state.notificationsEnabled;
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
        },
    },
});

export const { updateSettings, toggleNotifications, setTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
