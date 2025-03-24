import { COMPANY_LOCATION } from '../config/config.js';
import { calculateDistance } from './distanceCalculator.js';
import { PDFDocument, rgb } from 'pdf-lib';
import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';

// Truck specifications with capacities in kilograms
const TRUCK_SPECS = {
  'Toyota Dyna': { capacity: 3000 }, // 3 tons
  'Isuzu Elf': { capacity: 4000 }, // 4 tons
  'Mitsubishi Canter': { capacity: 3500 }, // 3.5 tons
  'Tata LPT 709/1109': { capacity: 5000 }, // 5 tons
};

// Fuel consumption rate in liters per kilometer
const FUEL_CONSUMPTION_RATE = 0.07576;

// Fuel price per liter in LKR
const FUEL_PRICE_PER_LITER = 286.00;

/**
 * Calculate the fuel cost for a given distance.
 * @param {number} distance - Distance in kilometers.
 * @returns {number} - Fuel cost in LKR.
 */
function calculateFuelCost(distance) {
  return distance * FUEL_CONSUMPTION_RATE * FUEL_PRICE_PER_LITER;
}

/**
 * Calculate the total distance for a round trip from the company to the pickup location.
 * @param {Object} pickupLocation - Pickup location with coordinates.
 * @param {Object} companyLocation - Company location with latitude and longitude.
 * @returns {number} - Total distance in kilometers.
 */
function calculateTotalDistance(pickupLocation, companyLocation) {
  const distanceToPickup = calculateDistance(
    companyLocation.latitude,
    companyLocation.longitude,
    pickupLocation.coordinates[1], // latitude
    pickupLocation.coordinates[0] // longitude
  );
  return distanceToPickup * 2; // Round trip
}

/**
 * Optimize pickup assignments to drivers based on distance and capacity.
 * @param {Array} pickups - List of pickups.
 * @param {Array} drivers - List of drivers.
 * @returns {Array} - Optimized schedule with assigned pickups.
 */
export function optimizePickups(pickups, drivers) {
  if (!pickups || !drivers || pickups.length === 0 || drivers.length === 0) {
    throw new Error('Invalid or empty input data');
  }

  const optimizedSchedule = [];

  // Sort pickups by distance (ascending)
  pickups.sort((a, b) => a.distance - b.distance);

  // Initialize driver capacities and assigned pickups
  drivers.forEach((driver) => {
    driver.currentCapacity = TRUCK_SPECS[driver.vehicleType]?.capacity || 0;
    driver.assignedPickups = [];
  });

  // Assign pickups to drivers
  pickups.forEach((pickup) => {
    if (typeof pickup.estimatedAmount !== 'number' || pickup.estimatedAmount <= 0) {
      console.warn(`Invalid estimated amount for pickup ${pickup._id}`);
      return;
    }

    let bestDriver = null;
    let minCost = Infinity;

    drivers.forEach((driver) => {
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
      pickup.driver = {
        id: bestDriver._id,
        name: `${bestDriver.firstName} ${bestDriver.lastName}`,
        vehicleType: bestDriver.vehicleType,
      };
      optimizedSchedule.push(pickup);
    } else {
      console.warn(`No driver available for pickup ${pickup._id}`);
    }
  });

  return optimizedSchedule;
}

/**
 * Generate an enhanced PDF with pickup details and route map.
 * @param {Array} pickups - List of pickups.
 * @param {Array} drivers - List of drivers.
 * @param {number} fuelPrice - Current fuel price.
 * @returns {Promise<Uint8Array>} - PDF document as a byte array.
 */
export const generateEnhancedPDF = async (pickups, drivers, fuelPrice) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Add header
  page.drawText('Optimized Pickup Schedule', { x: 50, y: height - 50, size: 18, color: rgb(0, 0, 0) });

  // Add fuel price
  page.drawText(`Fuel Price: LKR ${fuelPrice.toFixed(2)}`, { x: 50, y: height - 80, size: 12, color: rgb(0, 0, 0) });

  // Add pickup details in a table
  const table = {
    x: 50,
    y: height - 120,
    rowHeight: 20,
    colWidths: [100, 100, 100, 150],
  };

  // Draw table headers
  page.drawText('Pickup ID', { x: table.x, y: table.y, size: 12, color: rgb(0, 0, 0) });
  page.drawText('Weight (kg)', { x: table.x + table.colWidths[0], y: table.y, size: 12, color: rgb(0, 0, 0) });
  page.drawText('Fuel Cost (LKR)', { x: table.x + table.colWidths[0] + table.colWidths[1], y: table.y, size: 12, color: rgb(0, 0, 0) });
  page.drawText('Driver', { x: table.x + table.colWidths[0] + table.colWidths[1] + table.colWidths[2], y: table.y, size: 12, color: rgb(0, 0, 0) });

  // Draw table rows
  let currentY = table.y - table.rowHeight;
  pickups.forEach((pickup) => {
    page.drawText(pickup._id.slice(-6), { x: table.x, y: currentY, size: 12, color: rgb(0, 0, 0) });
    page.drawText(pickup.estimatedAmount.toString(), { x: table.x + table.colWidths[0], y: currentY, size: 12, color: rgb(0, 0, 0) });
    page.drawText(pickup.fuelCost.toFixed(2), { x: table.x + table.colWidths[0] + table.colWidths[1], y: currentY, size: 12, color: rgb(0, 0, 0) });
    page.drawText(`${pickup.driver.name} (${pickup.driver.vehicleType})`, { x: table.x + table.colWidths[0] + table.colWidths[1] + table.colWidths[2], y: currentY, size: 12, color: rgb(0, 0, 0) });
    currentY -= table.rowHeight;
  });

  // Add route map placeholder
  page.drawText('Route Map Placeholder', { x: 50, y: currentY - 50, size: 12, color: rgb(0, 0, 0) });

  return await pdfDoc.save();
};