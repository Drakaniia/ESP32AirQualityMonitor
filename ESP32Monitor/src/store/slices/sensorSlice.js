import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentReading: null,
    historicalData: [],
    loading: false,
    error: null,
};

const sensorSlice = createSlice({
    name: 'sensor',
    initialState,
    reducers: {
        setSensorData: (state, action) => {
            state.currentReading = action.payload;
        },
        setHistoricalData: (state, action) => {
            state.historicalData = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setSensorData, setHistoricalData, setLoading, setError } = sensorSlice.actions;
export default sensorSlice.reducer;
