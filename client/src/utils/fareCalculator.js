export function calculateFare({ baseFare, pricePerKm, pricePerMin, distanceKm, durationMinutes }) {
  const distanceFare = distanceKm * pricePerKm;
  const timeFare = durationMinutes * pricePerMin;
  return {
    baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    totalFare: Math.round((baseFare + Math.max(distanceFare, timeFare)) * 100) / 100,
    fareType: distanceFare >= timeFare ? 'distance' : 'time',
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
