const express = require('express');
const router = express.Router();
const { getAvailableBikes, getBikeById } = require('../controllers/bikeController');
const protect = require('../middleware/auth');

router.get('/', protect, getAvailableBikes);
router.get('/:id', protect, getBikeById);

module.exports = router;
