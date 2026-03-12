const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Bike = require('./models/Bike');

const bikes = [
  // Electric bikes
  { name: 'Ather 450X', type: 'electric', coordinates: [77.5946, 12.9716], batteryLevel: 87, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Ola S1 Pro', type: 'electric', coordinates: [77.5850, 12.9780], batteryLevel: 62, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'TVS iQube', type: 'electric', coordinates: [77.6010, 12.9650], batteryLevel: 95, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Bajaj Chetak', type: 'electric', coordinates: [77.5780, 12.9820], batteryLevel: 44, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Hero Vida V1', type: 'electric', coordinates: [77.6100, 12.9700], batteryLevel: 73, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },
  { name: 'Simple One', type: 'electric', coordinates: [77.5900, 12.9600], batteryLevel: 55, baseFare: 15, pricePerKm: 8, pricePerMin: 2 },

  // With Gear bikes
  { name: 'Royal Enfield Classic 350', type: 'with-gear', coordinates: [77.5980, 12.9750], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Yamaha FZ-S', type: 'with-gear', coordinates: [77.5870, 12.9690], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'KTM Duke 200', type: 'with-gear', coordinates: [77.6050, 12.9800], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Bajaj Pulsar NS200', type: 'with-gear', coordinates: [77.5820, 12.9630], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'Honda CB300R', type: 'with-gear', coordinates: [77.5960, 12.9850], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },
  { name: 'TVS Apache RTR', type: 'with-gear', coordinates: [77.6080, 12.9670], batteryLevel: null, baseFare: 10, pricePerKm: 6, pricePerMin: 1.5 },

  // Gearless bikes
  { name: 'Honda Activa 6G', type: 'gearless', coordinates: [77.5930, 12.9730], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'TVS Jupiter', type: 'gearless', coordinates: [77.5810, 12.9770], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Suzuki Access 125', type: 'gearless', coordinates: [77.6030, 12.9640], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Honda Dio', type: 'gearless', coordinates: [77.5890, 12.9810], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'TVS Ntorq 125', type: 'gearless', coordinates: [77.6000, 12.9680], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
  { name: 'Yamaha Fascino', type: 'gearless', coordinates: [77.5850, 12.9620], batteryLevel: null, baseFare: 8, pricePerKm: 5, pricePerMin: 1 },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Bike.deleteMany({});
    console.log('Cleared existing bikes');

    const bikeDocs = bikes.map((bike) => ({
      name: bike.name,
      type: bike.type,
      location: {
        type: 'Point',
        coordinates: bike.coordinates,
      },
      batteryLevel: bike.batteryLevel,
      baseFare: bike.baseFare,
      pricePerKm: bike.pricePerKm,
      pricePerMin: bike.pricePerMin,
      available: true,
    }));

    await Bike.insertMany(bikeDocs);
    console.log(`Seeded ${bikeDocs.length} bikes`);

    await mongoose.connection.close();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
