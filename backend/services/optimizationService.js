import 'dotenv/config';
import { enhancedOptimizePickups } from '../utils/enhancedOptimization.js';
import { calculateOptimalRoute } from '../utils/enhancedOptimization.js';
import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import FuelPrice from '../models/FuelPrice.js';
import axios from 'axios';
import { generateAssignmentReport } from '../utils/reportGenerator.js';

const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;
if (!OPENROUTESERVICE_API_KEY) {
    console.error('WARNING: OpenRouteService API key is not configured in environment variables');
}

// Updated API endpoint and version
const OPENROUTESERVICE_URL = 'https://api.openrouteservice.org/optimization';

// Function to validate API key format
const validateApiKey = (key) => {
    // OpenRouteService API keys should be a non-empty string
    return typeof key === 'string' && key.trim().length > 0;
};

// Function to format coordinates for OpenRouteService
const formatCoordinates = (location) => {
    if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
        return null;
    }

    const [longitude, latitude] = location.coordinates;

    // Validate coordinates are within OpenRouteService bounds
    if (longitude < -180 || longitude > 180 || latitude < -85.06 || latitude > 85.06) {
        throw new Error(`Invalid coordinates: [${longitude}, ${latitude}]. Coordinates must be within bounds: longitude [-180, 180], latitude [-85.06, 85.06]`);
    }

    // Return in [longitude, latitude] format as required by OpenRouteService
    return [longitude, latitude];
};

const validateLocation = (location) => {
    if (!location || !location.type || !location.coordinates) {
        return false;
    }

    const [longitude, latitude] = location.coordinates;

    // OpenRouteService has specific bounds for coordinates
    const isValidLongitude = typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
    const isValidLatitude = typeof latitude === 'number' && latitude >= -85.06 && latitude <= 85.06;

    return location.type === 'Point' && 
           Array.isArray(location.coordinates) && 
           location.coordinates.length === 2 &&
           isValidLongitude &&
           isValidLatitude;
};

export const optimizeAndSchedulePickups = async (date) => {
    try {
        if (!date) {
            throw new Error('Date is required');
        }

        if (!OPENROUTESERVICE_API_KEY) {
            throw new Error('OpenRouteService API key is not configured');
        }

        if (!validateApiKey(OPENROUTESERVICE_API_KEY)) {
            throw new Error('Invalid OpenRouteService API key format');
        }

        // Fetch pending pickups for the specified date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const pendingPickups = await Pickup.find({ 
            status: 'pending',
            scheduledTime: { 
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('user', 'name phone');

        if (!pendingPickups || pendingPickups.length === 0) {
            throw new Error('No pending pickups found for the selected date');
        }

        // Validate pickup locations with detailed error messages
        for (const pickup of pendingPickups) {
            if (!validateLocation(pickup.location)) {
                throw new Error(`Invalid location data for pickup ID: ${pickup._id}. Location must be a GeoJSON Point with coordinates in [longitude, latitude] format within bounds: longitude [-180, 180], latitude [-85.06, 85.06]`);
            }
        }

        // Get available drivers with their vehicles
        const availableDrivers = await Driver.find({ 
            status: 'available',
            'attendance.date': {
                $gte: startOfDay,
                $lte: endOfDay
            },
            'attendance.status': 'available'
        }).populate('vehicle');

        if (!availableDrivers || availableDrivers.length === 0) {
            throw new Error('No available drivers found for the selected date');
        }

        // Validate driver locations with detailed error messages
        for (const driver of availableDrivers) {
            if (!validateLocation(driver.currentLocation)) {
                throw new Error(`Invalid location data for driver: ${driver.firstName} ${driver.lastName}. Location must be a GeoJSON Point with coordinates in [longitude, latitude] format within bounds: longitude [-180, 180], latitude [-85.06, 85.06]`);
            }
            if (!driver.vehicle) {
                throw new Error(`No vehicle assigned to driver: ${driver.firstName} ${driver.lastName}`);
            }
        }

        // Get current fuel price
        const fuelPrice = await FuelPrice.findOne().sort({ createdAt: -1 });
        if (!fuelPrice) {
            throw new Error('Fuel price not set. Please set the current fuel price.');
        }

        // Prepare jobs (pickups)
        const jobs = [];
        const vehicles = [];

        console.log('Preparing optimization request...');
        console.log('Pending pickups:', pendingPickups.map(p => ({
            id: p._id,
            location: p.location,
            scheduledTime: p.scheduledTime
        })));

        // Prepare jobs (pickups)
        for (const pickup of pendingPickups) {
            const location = formatCoordinates(pickup.location);
            if (!location) {
                throw new Error(`Invalid location data for pickup ID: ${pickup._id}`);
            }

            const scheduledTime = new Date(pickup.scheduledTime);
            const secondsSinceMidnight = Math.floor((scheduledTime.getTime() - startOfDay.getTime()) / 1000);
            
            const job = {
                id: jobs.length + 1,
                location: location,
                service: 300, // 5 minutes service time
                amount: [pickup.estimatedAmount || 0],
                time_windows: [[
                    secondsSinceMidnight,
                    secondsSinceMidnight + 3600 // 1-hour window
                ]]
            };

            console.log('Created job:', {
                ...job,
                originalPickupId: pickup._id,
                scheduledTime: pickup.scheduledTime
            });

            jobs.push(job);
        }

        console.log('Available drivers:', availableDrivers.map(d => ({
            id: d._id,
            name: `${d.firstName} ${d.lastName}`,
            location: d.currentLocation,
            vehicleCapacity: d.vehicle?.capacity
        })));

        // Prepare vehicles (drivers)
        for (const driver of availableDrivers) {
            const location = formatCoordinates(driver.currentLocation);
            if (!location) {
                throw new Error(`Invalid location data for driver: ${driver.firstName} ${driver.lastName}`);
            }

            const vehicle = {
                id: vehicles.length + 1,
                profile: 'driving-car',
                start: location,
                end: location,
                capacity: [driver.vehicle?.capacity || 1000],
                time_window: [0, 86400], // Full day availability
                skills: [], // Can be used for special pickup requirements
                breaks: [] // Can be used for driver break times
            };

            console.log('Created vehicle:', {
                ...vehicle,
                driverName: `${driver.firstName} ${driver.lastName}`,
                originalDriverId: driver._id
            });

            vehicles.push(vehicle);
        }

        const optimizationPayload = {
            jobs,
            vehicles,
            options: {
                g: true, // Return geometry
                t: 'web', // Response type
                s: 2 // Number of problem-solving iterations
            }
        };

        console.log('Optimization request payload:', JSON.stringify(optimizationPayload, null, 2));

        // Make request to OpenRouteService
        const optimizationResponse = await axios.post(
            OPENROUTESERVICE_URL,
            optimizationPayload,
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTESERVICE_API_KEY}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Optimization response:', {
            status: optimizationResponse.status,
            statusText: optimizationResponse.statusText,
            data: optimizationResponse.data
        });

        // Validate response structure
        if (!optimizationResponse.data) {
            throw new Error('Empty response from OpenRouteService API');
        }

        const { routes, unassigned } = optimizationResponse.data;

        if (!routes || !Array.isArray(routes)) {
            throw new Error('Invalid response format: missing or invalid routes array');
        }

        if (routes.length === 0) {
            if (unassigned && unassigned.length > 0) {
                const unassignedIds = unassigned.map(u => pendingPickups[u.id - 1]._id).join(', ');
                throw new Error(`Could not assign any routes. Unassigned pickups: ${unassignedIds}`);
            }
            throw new Error('No valid routes could be generated');
        }

        // Process the optimization results
        const updatedDrivers = [];
        const updatedPickups = [];
        const routeDetails = [];
        const summary = {
            totalPickups: pendingPickups.length,
            assignedPickups: 0,
            unassignedPickups: pendingPickups.length,
            totalDrivers: availableDrivers.length,
            usedDrivers: 0,
            overallMetrics: {
                totalDistance: 0,
                totalDuration: 0,
                totalFuelCost: 0,
                totalLoad: 0
            }
        };
        
        console.log('\n=== PICKUP ASSIGNMENTS ===');
        
        for (const route of routes) {
            if (!route.vehicle || !route.steps || !Array.isArray(route.steps)) {
                console.warn('Invalid route format:', route);
                continue;
            }

            const driver = availableDrivers[route.vehicle - 1];
            if (!driver) {
                console.warn(`No driver found for vehicle index ${route.vehicle - 1}`);
                continue;
            }

            console.log(`\nDriver: ${driver.firstName} ${driver.lastName} (ID: ${driver._id})`);
            console.log('Assigned Pickups:');
            
            // Extract job IDs and create detailed steps
            const routeSteps = [];
            const pickupIds = [];
            const pickupUpdates = [];
            
            for (const step of route.steps) {
                if (step.type === 'job' && step.job) {
                    const pickup = pendingPickups[step.job - 1];
                    if (pickup) {
                        pickupIds.push(pickup._id);
                        console.log(`- Pickup ID: ${pickup._id}`);
                        console.log(`  Driver ID: ${driver._id}`);
                        console.log(`  Address: ${pickup.address}`);
                        console.log(`  Customer: ${pickup.user?.name || 'N/A'}`);
                        console.log(`  Amount: ${pickup.estimatedAmount}kg`);
                        console.log(`  Type: ${pickup.pickupType}`);
                        console.log(`  Scheduled Time: ${new Date(pickup.scheduledTime).toLocaleString()}`);
                        console.log(`  Arrival Time: ${new Date(startOfDay.getTime() + (step.arrival * 1000)).toLocaleString()}`);
                        
                        const routeStep = {
                            type: 'pickup',
                            pickupId: pickup._id,
                            location: pickup.location,
                            address: pickup.address,
                            customerName: pickup.user?.name || 'N/A',
                            customerPhone: pickup.user?.phone || 'N/A',
                            estimatedAmount: pickup.estimatedAmount || 0,
                            scheduledTime: pickup.scheduledTime,
                            arrivalTime: new Date(startOfDay.getTime() + (step.arrival * 1000)).toISOString(),
                            serviceTime: step.service,
                            waitingTime: step.waiting_time,
                            load: step.load?.[0] || 0
                        };
                        
                        routeSteps.push(routeStep);

                        // Individual pickup update
                        pickupUpdates.push({
                            updateOne: {
                                filter: { _id: pickup._id },
                                update: {
                                    $set: {
                                        driver: driver._id, // Add direct driver reference
                                        assignedDriver: driver._id,
                                        status: 'assigned',
                                        routeDetails: {
                                            vehicleId: route.vehicle,
                                            driverName: `${driver.firstName} ${driver.lastName}`,
                                            driverPhone: driver.phone,
                                            vehicleType: driver.vehicle?.type,
                                            vehiclePlateNumber: driver.vehicle?.plateNumber,
                                            sequence: routeStep,
                                            assignedAt: new Date(),
                                            estimatedArrival: new Date(startOfDay.getTime() + (step.arrival * 1000))
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            }

            if (pickupIds.length === 0) {
                console.warn(`No valid pickups found for route ${route.vehicle}`);
                continue;
            }

            // Calculate route metrics
            const routeMetrics = {
                totalDuration: route.duration || 0,
                totalDistance: calculateDistance(route.duration || 0),
                totalLoad: route.amount?.[0] || 0,
                startTime: new Date(startOfDay.getTime() + (route.steps[0]?.arrival || 0) * 1000).toISOString(),
                endTime: new Date(startOfDay.getTime() + (route.steps[route.steps.length - 1]?.arrival || 0) * 1000).toISOString(),
                fuelCost: calculateFuelCost(route.duration || 0, fuelPrice.price),
                assignedAt: new Date()
            };

            // Create detailed route information
            const routeDetail = {
                routeId: route.vehicle,
                driver: {
                    id: driver._id,
                    name: `${driver.firstName} ${driver.lastName}`,
                    phone: driver.phone,
                    vehicle: {
                        type: driver.vehicle?.type || 'N/A',
                        capacity: driver.vehicle?.capacity || 0,
                        plateNumber: driver.vehicle?.plateNumber || 'N/A'
                    }
                },
                metrics: routeMetrics,
                steps: routeSteps,
                violations: route.violations || []
            };

            routeDetails.push(routeDetail);

            // Update driver's assigned pickups
            updatedDrivers.push({
                updateOne: {
                    filter: { _id: driver._id },
                    update: {
                        $set: {
                            assignedPickups: pickupIds,
                            currentRoute: {
                                ...route,
                                metrics: routeMetrics,
                                detailedSteps: routeSteps,
                                assignedAt: new Date()
                            },
                            lastAssignment: new Date()
                        }
                    }
                }
            });

            // Add all pickup updates
            updatedPickups.push(...pickupUpdates);

            // Update summary metrics
            summary.assignedPickups += routeSteps.length;
            summary.unassignedPickups -= routeSteps.length;
            summary.overallMetrics.totalDistance += routeMetrics.totalDistance;
            summary.overallMetrics.totalDuration += routeMetrics.totalDuration;
            summary.overallMetrics.totalFuelCost += routeMetrics.fuelCost;
            summary.overallMetrics.totalLoad += routeMetrics.totalLoad;

            // Update driver status
            driver.isAvailable = false;
            driver.currentRoute = {
                date: date,
                stops: routeSteps.map(step => ({
                    address: step.address,
                    arrivalTime: step.arrivalTime
                }))
            };
            await driver.save();
        }

        // Perform bulk updates with error handling
        try {
            if (updatedDrivers.length > 0) {
                const driverResult = await Driver.bulkWrite(updatedDrivers);
                console.log('Driver updates:', driverResult);
            }
            if (updatedPickups.length > 0) {
                const pickupResult = await Pickup.bulkWrite(updatedPickups);
                console.log('Pickup updates:', pickupResult);
            }
        } catch (error) {
            console.error('Error updating database:', error);
            throw new Error('Failed to update assignments in database: ' + error.message);
        }

        // Generate PDF report
        const report = await generateAssignmentReport(routeDetails, summary, date);

        return {
            success: true,
            message: 'Route optimization completed successfully',
            summary,
            routeDetails,
            report
        };

    } catch (error) {
        console.error('Optimization error:', error);
        throw new Error(`Failed to optimize routes: ${error.message}`);
    }
};

const calculateDistance = (duration) => {
    return (duration / 3600) * 40; // Convert duration (seconds) to hours and multiply by speed (40 km/h)
};

const calculateFuelCost = (duration, fuelPrice) => {
    const distance = calculateDistance(duration);
    const fuelConsumed = (distance / 100) * 10; // Assuming 10L/100km consumption
    return fuelConsumed * fuelPrice;
};

export default {
    optimizeAndSchedulePickups
}; 