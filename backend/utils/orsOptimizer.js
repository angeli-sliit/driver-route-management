import axios from 'axios';

const ORS_API_KEY = process.env.OPENROUTE_API_KEY;
const ORS_OPTIMIZATION_URL = 'https://api.openrouteservice.org/optimization';

export const optimizeVehicleRoutes = async (vehicles, jobs) => {
  try {
    const response = await axios.post(ORS_OPTIMIZATION_URL, {
      jobs: jobs.map(job => ({
        id: job.id,
        location: [job.lon, job.lat],
        service: job.service_time || 300, // Default 5 minutes per pickup
        amount: [job.weight || 1],        // Scrap weight in kg
        ...(job.time_window && { time_windows: [job.time_window] })
      })),
      vehicles: vehicles.map(vehicle => ({
        id: vehicle.id,
        profile: 'driving-car',
        start: [vehicle.start_lon, vehicle.start_lat],
        end: [vehicle.end_lon, vehicle.end_lat],
        capacity: [vehicle.capacity],
        skills: vehicle.required_skills || [],
        time_window: vehicle.working_hours
      })),
      options: {
        g: true // Include geometry in response
      }
    }, {
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return processOptimizationResponse(response.data);
  } catch (error) {
    throw new Error(`Optimization failed: ${error.response?.data?.error || error.message}`);
  }
};

const processOptimizationResponse = (data) => {
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
    totalWeight: route.amount[0]
  }));
};