const Bike = require('../models/Bike');

// Bike catalog for dynamic generation
const bikeCatalog = [
  // Electric
  { name: 'Ather 450X', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Ola S1 Pro', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'TVS iQube', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Bajaj Chetak', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Hero Vida V1', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Simple One', type: 'electric', baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  // With Gear
  { name: 'Royal Enfield Classic 350', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Yamaha FZ-S', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'KTM Duke 200', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Bajaj Pulsar NS200', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Honda CB300R', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'TVS Apache RTR', type: 'with-gear', baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  // Gearless
  { name: 'Honda Activa 6G', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'TVS Jupiter', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Suzuki Access 125', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Honda Dio', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'TVS Ntorq 125', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Yamaha Fascino', type: 'gearless', baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
];

// Generate a random coordinate offset (within ~500m to ~1km radius - tight cluster)
const randomOffset = () => (Math.random() - 0.5) * 0.018;

// Generate random battery level for electric bikes
const randomBattery = () => Math.floor(Math.random() * 60) + 30; // 30-90%

// Shuffle array and pick N items
const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

// Auto-generate bikes around a location
const generateBikesNearLocation = async (lng, lat) => {
  // Pick 10-14 random bikes from catalog (mix of all types)
  const count = Math.floor(Math.random() * 5) + 10; // 10-14 bikes
  const selectedBikes = pickRandom(bikeCatalog, count);

  const bikeDocs = selectedBikes.map((bike) => ({
    name: bike.name,
    type: bike.type,
    location: {
      type: 'Point',
      coordinates: [lng + randomOffset(), lat + randomOffset()],
    },
    batteryLevel: bike.type === 'electric' ? randomBattery() : null,
    baseFare: bike.baseFare,
    pricePerKm: bike.pricePerKm,
    pricePerMin: bike.pricePerMin,
    available: true,
  }));

  const inserted = await Bike.insertMany(bikeDocs);
  return inserted;
};

// GET /api/bikes - Get all available bikes (optionally near a location)
exports.getAvailableBikes = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    let bikes;

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      // Use a tight 2km radius to check if bikes exist RIGHT HERE
      const nearbyCheckRadius = 2000; // 2km in meters
      // Display radius for final results (what user sees)
      const displayRadius = (parseFloat(radius) || 3) * 1000; // default 3km

      // First check: are there bikes very close to this exact spot?
      const nearbyBikes = await Bike.find({
        available: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat],
            },
            $maxDistance: nearbyCheckRadius,
          },
        },
      });

      // If fewer than 3 bikes within 2km, generate new ones right here
      if (nearbyBikes.length < 3) {
        await generateBikesNearLocation(parsedLng, parsedLat);
      }

      // Final query: return all bikes within display radius, sorted by distance
      bikes = await Bike.find({
        available: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parsedLng, parsedLat],
            },
            $maxDistance: displayRadius,
          },
        },
      });
    } else {
      bikes = await Bike.find({ available: true }).sort({ createdAt: -1 });
    }

    res.json({ success: true, bikes });
  } catch (error) {
    next(error);
  }
};

// GET /api/bikes/:id - Get single bike
exports.getBikeById = async (req, res, next) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Bike not found' });
    }
    res.json({ success: true, bike });
  } catch (error) {
    next(error);
  }
};
