import { configureStore } from '@reduxjs/toolkit';
import driversReducer from './slices/driversSlice';
import routesReducer from './slices/routesSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import pickupsReducer from './slices/pickupsSlice';
import leaveRequestsReducer from './slices/leaveRequestsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    drivers: driversReducer,
    routes: routesReducer,
    vehicles: vehiclesReducer,
    pickups: pickupsReducer,
    leaveRequests: leaveRequestsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 