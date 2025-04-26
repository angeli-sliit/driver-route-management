import axios from 'axios';
import { ORS_API_KEY } from '../config/config.js';

// Update to the correct v2 optimization endpoint
const ORS_OPTIMIZATION_URL = 'https://api.openrouteservice.org/optimization';

const validateInput = (vehicles, jobs) => {
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    throw new Error('At least one vehicle is required');
  }
  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error('At least one job is required');
  }

  vehicles.forEach((vehicle, index) => {
    if (!vehicle.id || !vehicle.start_lon || !vehicle.start_lat) {
      throw new Error(`Invalid vehicle data at index ${index}`);
    }
  });

  jobs.forEach((job, index) => {
    if (!job.id || !job.lon || !job.lat) {
      throw new Error(`Invalid job data at index ${index}`);
    }
  });
};

export const optimizeVehicleRoutes = async (vehicles, jobs) => {
  try {
    validateInput(vehicles, jobs);

    console.log('Sending optimization request with:', {
      vehicles: vehicles.length,
      jobs: jobs.length,
      url: ORS_OPTIMIZATION_URL
    });

    const response = await axios.post(ORS_OPTIMIZATION_URL, {
      jobs: jobs.map(job => ({
        id: job.id,
        location: [parseFloat(job.lon), parseFloat(job.lat)],
        service: parseInt(job.service_time) || 300,
        amount: [parseInt(job.weight) || 1],
        skills: [] // Default empty skills array
      })),
      vehicles: vehicles.map(vehicle => ({
        id: vehicle.id,
        profile: 'driving-car',
        start: [parseFloat(vehicle.start_lon), parseFloat(vehicle.start_lat)],
        end: [parseFloat(vehicle.start_lon), parseFloat(vehicle.start_lat)], // End at start location
        capacity: vehicle.capacity.map(cap => parseInt(cap)),
        skills: vehicle.skills || [],
        time_window: vehicle.time_window || undefined
      })),
      options: {
        g: true // Include geometry in response
      }
    }, {
      headers: {
        'Authorization': `Bearer ${ORS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Received optimization response:', response.status);
    return processOptimizationResponse(response.data);
  } catch (error) {
    console.error('ORS Optimization error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          throw new Error('Invalid API key for OpenRouteService');
        case 404:
          throw new Error('OpenRouteService optimization endpoint not found. Please check the API URL.');
        case 429:
          throw new Error('Rate limit exceeded for OpenRouteService. Please try again later.');
        default:
          throw new Error(`Optimization failed: ${data?.error || error.message}`);
      }
    }
    throw error;
  }
};

const processOptimizationResponse = (data) => {
  if (!data || !data.routes) {
    throw new Error('Invalid response from optimization service');
  }

  return data.routes.map(route => ({
    vehicleId: route.vehicle,
    steps: route.steps.map(step => ({
      type: step.type,
      location: step.location,
      arrival: step.arrival,
      duration: step.duration,
      ...(step.job && { jobId: step.job })
    })),
    geometry: route.geometry,
    totalDistance: route.distance,
    totalDuration: route.duration,
    totalWeight: route.amount?.[0] || 0
  }));
};