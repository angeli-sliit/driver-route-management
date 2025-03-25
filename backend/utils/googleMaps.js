import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export const getOptimizedRoute = async (origin, destination, waypoints) => {
  try {
    const response = await client.directions({
      params: {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        trafficModel: 'best_guess',
        departureTime: 'now',
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    return response.data.routes[0];
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw new Error('Failed to optimize route');
  }
};