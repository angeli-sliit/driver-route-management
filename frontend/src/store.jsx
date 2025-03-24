import { configureStore } from '@reduxjs/toolkit';
import driverReducer from './features/driverSlice';

export const store = configureStore({
  reducer: {
    driver: driverReducer,
  },
});