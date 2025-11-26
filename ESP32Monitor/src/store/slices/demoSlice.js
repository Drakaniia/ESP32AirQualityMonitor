import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isDemoMode: false,
    demoData: null,
};

const demoSlice = createSlice({
    name: 'demo',
    initialState,
    reducers: {
        enableDemoMode: (state) => {
            state.isDemoMode = true;
        },
        disableDemoMode: (state) => {
            state.isDemoMode = false;
            state.demoData = null;
        },
        setDemoData: (state, action) => {
            state.demoData = action.payload;
        },
    },
});

export const { enableDemoMode, disableDemoMode, setDemoData } = demoSlice.actions;
export default demoSlice.reducer;
