const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  createBooking,
  verifyBookingOTP,
  updateLocation,
  endRide,
  getActiveBooking,
  getUserBookings,
  getBookingById,
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.post('/:id/verify-otp', protect, verifyBookingOTP);
router.post('/:id/location', protect, updateLocation);
router.post('/:id/end', protect, endRide);
router.get('/active', protect, getActiveBooking);
router.get('/history', protect, getUserBookings);
router.get('/:id', protect, getBookingById);

module.exports = router;
