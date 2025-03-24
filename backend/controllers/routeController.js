import axios from 'axios';

// Export the function as optimizeRoute
export const optimizeRoute = async (req, res) => {
  try {
    const { pickups } = req.body;

    // Format pickup locations for ORS
    const locations = pickups.map(p => ({
      location: [p.location.coordinates[0], p.location.coordinates[1]]
    }));

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/optimization',
      {
        jobs: locations,
        vehicles: [{
          id: 1,
          profile: 'driving-car',
          start: [pickups[0].location.coordinates[0], pickups[0].location.coordinates[1]],
          end: [pickups[0].location.coordinates[0], pickups[0].location.coordinates[1]]
        }]
      },
      {
        headers: {
          'Authorization': process.env.REACT_APP_ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data.routes[0]);
  } catch (err) {
    res.status(500).json({ error: 'Route optimization failed' });
  }
};