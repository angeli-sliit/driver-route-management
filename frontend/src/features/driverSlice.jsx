import { createSlice } from '@reduxjs/toolkit';

const driverSlice = createSlice({
  name: 'driver',
  initialState: {
    location: null,
    status: 'available',
  },
  reducers: {
    updateLocation: (state, action) => {
      state.location = action.payload;
    },
    updateStatus: (state, action) => {
      state.status = action.payload;
    },
  },
});

export const { updateLocation, updateStatus } = driverSlice.actions;
export default driverSlice.reducer;