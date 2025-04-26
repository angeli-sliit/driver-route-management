import { calculateDistance } from './distanceCalculator.js';
import { COMPANY_LOCATION } from '../config/config.js';

// Truck capacities in kilograms
const TRUCK_CAPACITIES = {
    'Toyota Dyna': 3000,
    'Isuzu Elf': 4000,
    'Mitsubishi Canter': 3500,
    'Tata LPT 709/1109': 5000
};

// Fuel consumption rate in liters per km
const FUEL_CONSUMPTION = {
    'Toyota Dyna': 0.12,
    'Isuzu Elf': 0.15,
    'Mitsubishi Canter': 0.13,
    'Tata LPT 709/1109': 0.18
};

// Function to check weight distribution
function checkWeightDistribution(pickup, truck) {
    if (!truck.driver.vehicle || !truck.driver.vehicle.vehicleType) {
        throw new Error('Driver vehicle information is missing');
    }

    const currentLoad = truck.pickups.reduce((sum, p) => sum + p.estimatedAmount, 0);
    const maxCapacity = TRUCK_CAPACITIES[truck.driver.vehicle.vehicleType];
    const newTotal = currentLoad + pickup.estimatedAmount;
    
    return {
        isValid: newTotal <= maxCapacity && (newTotal / maxCapacity) <= 0.9,
        remainingCapacity: maxCapacity - newTotal,
        utilizationPercentage: (newTotal / maxCapacity) * 100
    };
}

// Function to create time windows
function createTimeWindows(pickups) {
    return pickups.map(pickup => ({
        ...pickup,
        timeWindow: {
            start: new Date(pickup.scheduledTime).getTime(),
            end: new Date(new Date(pickup.scheduledTime).getTime() + 2 * 60 * 60 * 1000).getTime()
        }
    }));
}

// Enhanced optimization function
export const enhancedOptimizePickups = async (pickups, drivers, fuelPrice) => {
    try {
        const assignments = [];
        const unassignedPickups = [...pickups];
        
        // Sort pickups by priority and time window
        unassignedPickups.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return new Date(a.scheduledTime) - new Date(b.scheduledTime);
        });

        // Sort drivers by availability and current load
        const availableDrivers = drivers
            .filter(driver => driver.status === 'available' && driver.vehicle)
            .sort((a, b) => {
                if (a.vehicle.currentLoad !== b.vehicle.currentLoad) {
                    return a.vehicle.currentLoad - b.vehicle.currentLoad;
                }
                return new Date(a.availableFrom) - new Date(b.availableFrom);
            });

        for (const pickup of unassignedPickups) {
            let bestDriver = null;
            let bestScore = -Infinity;

            for (const driver of availableDrivers) {
                if (!driver.vehicle) {
                    console.error(`Driver ${driver._id} has no vehicle assigned`);
                    continue;
                }

                const vehicleType = driver.vehicle.vehicleType;
                const capacity = TRUCK_CAPACITIES[vehicleType] - driver.vehicle.currentLoad;
                
                if (capacity < pickup.estimatedAmount) {
                    continue;
                }

                const distanceToPickup = calculateDistance(
                    driver.currentLocation.coordinates[1],
                    driver.currentLocation.coordinates[0],
                    pickup.location.coordinates[1],
                    pickup.location.coordinates[0]
                );

                const fuelConsumption = FUEL_CONSUMPTION[vehicleType] * distanceToPickup;
                const fuelCost = fuelConsumption * fuelPrice;

                const weightUtilization = (pickup.estimatedAmount / TRUCK_CAPACITIES[vehicleType]) * 100;
                const remainingCapacity = TRUCK_CAPACITIES[vehicleType] - driver.vehicle.currentLoad - pickup.estimatedAmount;

                const score = calculateAssignmentScore({
                    distanceToPickup,
                    weightUtilization,
                    remainingCapacity,
                    fuelConsumption: fuelCost
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestDriver = driver;
                }
            }

            if (bestDriver) {
                assignments.push({
                    pickupId: pickup._id,
                    driverId: bestDriver._id,
                    score: bestScore
                });
                
                // Update driver's current load
                bestDriver.vehicle.currentLoad += pickup.estimatedAmount;
                
                // Remove assigned pickup
                const index = unassignedPickups.indexOf(pickup);
                if (index > -1) {
                    unassignedPickups.splice(index, 1);
                }
            }
        }

        return {
            assignments,
            unassignedPickups
        };
    } catch (error) {
        console.error('Error in enhancedOptimizePickups:', error);
        throw error;
    }
};

// Helper function to calculate assignment score
function calculateAssignmentScore({
    distanceToPickup,
    weightUtilization,
    remainingCapacity,
    fuelConsumption
}) {
    const distanceScore = 1 / (1 + distanceToPickup);
    const utilizationScore = weightUtilization <= 90 ? weightUtilization / 90 : 0;
    const capacityScore = remainingCapacity > 0 ? 1 : 0;
    const fuelScore = 1 / (1 + fuelConsumption);

    return (distanceScore * 0.3) + (utilizationScore * 0.4) + 
           (capacityScore * 0.2) + (fuelScore * 0.1);
}

// Helper function to calculate optimal route
export const calculateOptimalRoute = (pickups, driver) => {
    const route = [];
    let currentLocation = COMPANY_LOCATION;
    let remainingPickups = [...pickups];

    while (remainingPickups.length > 0) {
        let nearestIdx = 0;
        let shortestDistance = Infinity;

        for (let i = 0; i < remainingPickups.length; i++) {
            const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                remainingPickups[i].location.coordinates[1],
                remainingPickups[i].location.coordinates[0]
            );

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestIdx = i;
            }
        }

        const nextPickup = remainingPickups[nearestIdx];
        route.push(nextPickup);
        currentLocation = {
            latitude: nextPickup.location.coordinates[1],
            longitude: nextPickup.location.coordinates[0]
        };
        remainingPickups.splice(nearestIdx, 1);
    }

    return route;
};

export default {
    enhancedOptimizePickups,
    checkWeightDistribution,
    createTimeWindows
}; 