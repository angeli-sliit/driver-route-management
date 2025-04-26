// utils/distanceCalculator.js
// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Calculate total distance for a route
export function calculateRouteDistance(route) {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const [lon1, lat1] = route[i];
    const [lon2, lat2] = route[i + 1];
    totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
  }
  return totalDistance;
}

// Calculate estimated time for a route
export function calculateEstimatedTime(distance, averageSpeed = 40) {
  return (distance / averageSpeed) * 60; // Time in minutes
}