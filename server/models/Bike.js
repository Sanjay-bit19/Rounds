const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bike name is required'],
  },
  type: {
    type: String,
    enum: ['electric', 'with-gear', 'gearless'],
    required: [true, 'Bike type is required'],
  },
  image: {
    type: String,
    default: '',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  pricePerKm: {
    type: Number,
    required: true,
  },
  pricePerMin: {
    type: Number,
    required: true,
  },
  baseFare: {
    type: Number,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

bikeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Bike', bikeSchema);
