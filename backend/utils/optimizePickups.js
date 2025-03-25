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

export function optimizePickups(pickups, drivers, fuelPrice) {
  // 1. Bin packing algorithm for truck assignment
  const sortedPickups = [...pickups].sort((a, b) => b.estimatedAmount - a.estimatedAmount);
  const trucks = [];

  // Create truck pool from available drivers
  const availableTrucks = drivers
    .filter(d => d.status === 'available')
    .map(d => ({
      driver: d,
      capacity: TRUCK_CAPACITIES[d.vehicleType],
      remaining: TRUCK_CAPACITIES[d.vehicleType],
      pickups: [],
      route: []
    }));

  // Assign pickups to trucks using First Fit Decreasing algorithm
  for (const pickup of sortedPickups) {
    let assigned = false;
    
    // Try to fit in existing trucks
    for (const truck of availableTrucks) {
      if (truck.remaining >= pickup.estimatedAmount) {
        truck.pickups.push(pickup);
        truck.remaining -= pickup.estimatedAmount;
        assigned = true;
        break;
      }
    }

    // If no existing truck can accommodate, skip (shouldn't happen with validation)
    if (!assigned) {
      console.warn(`Pickup ${pickup._id} (${pickup.estimatedAmount}kg) exceeds all truck capacities`);
    }
  }

  // 2. Calculate routes and costs for each truck
  return availableTrucks
    .filter(truck => truck.pickups.length > 0)
    .map(truck => {
      // Sort pickups by proximity to company
      truck.pickups.sort((a, b) => 
        calculateDistance(COMPANY_LOCATION.latitude, COMPANY_LOCATION.longitude, 
          a.location.coordinates[1], a.location.coordinates[0]) -
        calculateDistance(COMPANY_LOCATION.latitude, COMPANY_LOCATION.longitude, 
          b.location.coordinates[1], b.location.coordinates[0])
      );

      // Calculate total distance
      let totalDistance = 0;
      let previousLocation = COMPANY_LOCATION;
      
      for (const pickup of truck.pickups) {
        const distance = calculateDistance(
          previousLocation.latitude,
          previousLocation.longitude,
          pickup.location.coordinates[1],
          pickup.location.coordinates[0]
        );
        totalDistance += distance;
        previousLocation = pickup.location;
      }

      // Return to company
      totalDistance += calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        COMPANY_LOCATION.latitude,
        COMPANY_LOCATION.longitude
      );

      // Calculate fuel cost
      const fuelCost = totalDistance * FUEL_CONSUMPTION[truck.driver.vehicleType] * fuelPrice;

      return {
        driverId: truck.driver._id,
        pickups: truck.pickups.map(p => p._id),
        totalWeight: TRUCK_CAPACITIES[truck.driver.vehicleType] - truck.remaining,
        fuelCost,
        route: truck.pickups.map(p => p.location.coordinates)
      };
    });
}