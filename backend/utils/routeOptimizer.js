import { ORS_API_KEY } from '../config/config.js';

export const optimizeVehicleRoutes = async (assignments) => {
    try {
        const optimizedRoutes = [];

        for (const assignment of assignments) {
            const { pickupId, driverId } = assignment;
            
            // Get pickup and driver details
            const pickup = await Pickup.findById(pickupId).populate('location');
            const driver = await Driver.findById(driverId).populate('vehicle');

            if (!pickup || !driver) {
                console.error(`Missing pickup or driver data for assignment: ${assignment}`);
                continue;
            }

            // Prepare coordinates for ORS API
            const coordinates = [
                [driver.currentLocation.coordinates[0], driver.currentLocation.coordinates[1]], // Start from driver's location
                [pickup.location.coordinates[0], pickup.location.coordinates[1]] // Pickup location
            ];

            // Call ORS API for route optimization
            const response = await fetch('https://api.openrouteservice.org/directions/driving-car', {
                method: 'POST',
                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coordinates,
                    instructions: false,
                    geometry: true
                })
            });

            if (!response.ok) {
                throw new Error(`ORS API request failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Calculate fuel cost
            const distance = data.routes[0].summary.distance / 1000; // Convert to kilometers
            const fuelConsumption = driver.vehicle.fuelConsumption; // Liters per km
            const fuelCost = distance * fuelConsumption * fuelPrice;

            optimizedRoutes.push({
                driverId,
                pickupId,
                route: data.routes[0].geometry,
                distance,
                fuelCost,
                estimatedTime: data.routes[0].summary.duration
            });
        }

        return optimizedRoutes;
    } catch (error) {
        console.error('Error in optimizeVehicleRoutes:', error);
        throw error;
    }
}; 