import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

const getOptimizedRoute = async (origin, destination) => {
  try {
    const response = await client.directions({
      params: {
        origin,
        destination,
        key: process.env.GOOGLE_MAPS_API_KEY, // Ensure this is set in your .env file
      },
    });
    return response.data.routes[0]; // Return the first optimized route
  } catch (error) {
    console.error('Error fetching optimized route:', error);
    throw new Error('Failed to fetch optimized route');
  }
};

export { getOptimizedRoute };