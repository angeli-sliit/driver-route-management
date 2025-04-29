import * as yup from 'yup';

export const driverSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  licenseNumber: yup.string().required('License number is required'),
  vehicleId: yup.string().required('Vehicle assignment is required'),
});

export const routeSchema = yup.object().shape({
  name: yup.string().required('Route name is required'),
  startLocation: yup.string().required('Start location is required'),
  endLocation: yup.string().required('End location is required'),
  distance: yup.number().positive('Distance must be positive').required('Distance is required'),
  estimatedTime: yup.number().positive('Time must be positive').required('Estimated time is required'),
});

export const pickupSchema = yup.object().shape({
  location: yup.string().required('Pickup location is required'),
  time: yup.date().required('Pickup time is required'),
  driverId: yup.string().required('Driver assignment is required'),
  vehicleId: yup.string().required('Vehicle assignment is required'),
});

export const leaveRequestSchema = yup.object().shape({
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required'),
  reason: yup.string().required('Reason is required'),
  type: yup.string().oneOf(['SICK', 'VACATION', 'PERSONAL'], 'Invalid leave type').required('Leave type is required'),
});

export const vehicleSchema = yup.object().shape({
  registrationNumber: yup.string().required('Registration number is required'),
  model: yup.string().required('Vehicle model is required'),
  capacity: yup.number().positive('Capacity must be positive').required('Capacity is required'),
  status: yup.string().oneOf(['ACTIVE', 'MAINTENANCE', 'INACTIVE'], 'Invalid status').required('Status is required'),
}); 