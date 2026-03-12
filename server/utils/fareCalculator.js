const haversineDistance = require('./haversine');

function calculateTotalDistance(waypoints) {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineDistance(
      waypoints[i - 1].lat, waypoints[i - 1].lng,
      waypoints[i].lat, waypoints[i].lng
    );
  }
  return total;
}

function calculateFare({ baseFare, pricePerKm, pricePerMin, distanceKm, durationMinutes }) {
  const distanceFare = distanceKm * pricePerKm;
  const timeFare = durationMinutes * pricePerMin;
  return {
    baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    totalFare: Math.round((baseFare + Math.max(distanceFare, timeFare)) * 100) / 100,
  };
}

module.exports = { calculateTotalDistance, calculateFare };
