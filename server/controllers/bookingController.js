const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/sendEmail');
const { calculateTotalDistance, calculateFare } = require('../utils/fareCalculator');

// POST /api/bookings - Create a booking
exports.createBooking = async (req, res, next) => {
  try {
    const { bikeId } = req.body;

    // Check for existing active booking
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['reserved', 'active'] },
    });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking',
        booking: existingBooking,
      });
    }

    // Check for unpaid completed bookings
    const unpaidBooking = await Booking.findOne({
      user: req.user._id,
      status: 'completed',
      paymentStatus: 'pending',
    });
    if (unpaidBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have an unpaid ride. Please complete payment before booking a new ride.',
        unpaidBookingId: unpaidBooking._id,
      });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Bike not found' });
    }
    if (!bike.available) {
      return res.status(400).json({ success: false, message: 'Bike is not available' });
    }

    // Generate OTP for ride start
    const { otp, otpExpiresAt } = generateOTP();

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      bike: bike._id,
      status: 'reserved',
      otp,
      otpExpiresAt,
      startLocation: {
        type: 'Point',
        coordinates: bike.location.coordinates,
      },
    });

    // Mark bike as unavailable
    bike.available = false;
    await bike.save();

    // Send OTP email
    await sendOTPEmail(req.user.email, otp, 'booking');

    const populatedBooking = await Booking.findById(booking._id).populate('bike');

    res.status(201).json({
      success: true,
      message: 'Booking created. OTP sent to your email.',
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/:id/verify-otp - Verify OTP and start ride
exports.verifyBookingOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const booking = await Booking.findById(req.params.id).populate('bike');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'reserved') {
      return res.status(400).json({ success: false, message: 'Booking is not in reserved state' });
    }
    if (!booking.otp || booking.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (new Date() > booking.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    booking.status = 'active';
    booking.startTime = new Date();
    booking.otp = null;
    booking.otpExpiresAt = null;
    await booking.save();

    res.json({
      success: true,
      message: 'Ride started!',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/:id/location - Update location during ride
exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Ride is not active' });
    }

    booking.waypoints.push({ lat, lng, timestamp: new Date() });
    await booking.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/:id/end - End ride and calculate fare
exports.endRide = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const booking = await Booking.findById(req.params.id).populate('bike');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Ride is not active' });
    }

    // Add final waypoint
    if (lat && lng) {
      booking.waypoints.push({ lat, lng, timestamp: new Date() });
    }

    const endTime = new Date();
    const durationMs = endTime - booking.startTime;
    const durationMinutes = durationMs / (1000 * 60);

    // Calculate distance from waypoints
    const totalDistance = calculateTotalDistance(booking.waypoints);

    // Calculate fare
    const fareBreakdown = calculateFare({
      baseFare: booking.bike.baseFare,
      pricePerKm: booking.bike.pricePerKm,
      pricePerMin: booking.bike.pricePerMin,
      distanceKm: totalDistance,
      durationMinutes,
    });

    booking.status = 'completed';
    booking.endTime = endTime;
    booking.endLocation = {
      type: 'Point',
      coordinates: lat && lng ? [parseFloat(lng), parseFloat(lat)] : booking.startLocation.coordinates,
    };
    booking.totalDistance = Math.round(totalDistance * 100) / 100;
    booking.totalDuration = Math.round(durationMinutes * 100) / 100;
    booking.fareBreakdown = fareBreakdown;
    await booking.save();

    // Update bike location to drop-off point
    const bike = await Bike.findById(booking.bike._id);
    if (lat && lng) {
      bike.location.coordinates = [parseFloat(lng), parseFloat(lat)];
    }
    // Don't release bike yet — wait for payment
    await bike.save();

    res.json({
      success: true,
      message: 'Ride ended',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/active - Get current active booking
exports.getActiveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      user: req.user._id,
      status: { $in: ['reserved', 'active'] },
    }).populate('bike');

    res.json({ success: true, booking: booking || null });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/history - Get user's booking history
exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.user._id,
      status: 'completed',
    })
      .populate('bike')
      .sort({ endTime: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id - Get single booking
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('bike');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
