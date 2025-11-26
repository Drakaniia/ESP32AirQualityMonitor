import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    relayState: 'OFF', // 'ON' or 'OFF'
    loading: false,
    error: null,
};

const relaySlice = createSlice({
    name: 'relay',
    initialState,
    reducers: {
        setRelayState: (state, action) => {
            state.relayState = action.payload;
            state.loading = false;
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

export const { setRelayState, setLoading, setError } = relaySlice.actions;
export default relaySlice.reducer;
