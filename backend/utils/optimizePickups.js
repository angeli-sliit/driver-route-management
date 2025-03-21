export const optimizePickups = (pickups, drivers) => {
    // Implement logic to assign pickups to drivers minimizing fuel costs
    // This is a placeholder for actual optimization logic
    return pickups.map((pickup, index) => ({
      ...pickup,
      driver: drivers[index % drivers.length]._id
    }));
  };