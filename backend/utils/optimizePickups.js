// utils/optimizePickups.js
import { COMPANY_LOCATION } from '../config/config.js';
import { calculateDistance } from './distanceCalculator.js';

const TRUCK_SPECS = {
  'Toyota Dyna': { capacity: 3000 }, // 3 tons
  'Isuzu Elf': { capacity: 4000 }, // 4 tons
  'Mitsubishi Canter': { capacity: 3500 }, // 3.5 tons
  'Tata LPT 709/1109': { capacity: 5000 }, // 5 tons
};

const FUEL_CONSUMPTION_RATE = 0.07576; // liters per kilometer
const FUEL_PRICE_PER_LITER = 286.00; // Rs. per liter

function calculateFuelCost(distance) {
  return distance * FUEL_CONSUMPTION_RATE * FUEL_PRICE_PER_LITER;
}

function calculateTotalDistance(pickupLocation, companyLocation) {
  // Calculate distance from company to pickup and back
  const distanceToPickup = calculateDistance(
    companyLocation.latitude,
    companyLocation.longitude,
    pickupLocation.coordinates[1], // latitude
    pickupLocation.coordinates[0] // longitude
  );
  return distanceToPickup * 2; // Round trip
}

export function optimizePickups(pickups, drivers) {
  const optimizedSchedule = [];

  // Sort pickups by distance (ascending)
  pickups.sort((a, b) => a.distance - b.distance);

  // Initialize driver capacities and assigned pickups
  drivers.forEach(driver => {
    driver.currentCapacity = TRUCK_SPECS[driver.vehicleType]?.capacity || 0;
    driver.assignedPickups = [];
  });

  // Assign pickups to drivers
  pickups.forEach(pickup => {
    let bestDriver = null;
    let minCost = Infinity;

    drivers.forEach(driver => {
      if (driver.currentCapacity >= pickup.estimatedAmount) {
        const totalDistance = calculateTotalDistance(pickup.location, COMPANY_LOCATION);
        const cost = calculateFuelCost(totalDistance);
        if (cost < minCost) {
          minCost = cost;
          bestDriver = driver;
        }
      }
    });

    if (bestDriver) {
      bestDriver.assignedPickups.push(pickup);
      bestDriver.currentCapacity -= pickup.estimatedAmount;
      pickup.fuelCost = minCost;
      pickup.driver = bestDriver;
      optimizedSchedule.push(pickup);
    }
  });

  return optimizedSchedule;
}