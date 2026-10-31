const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Studio = require('../models/Studio');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

router.get('/my', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const bookings = await Booking.find({ bookerEmail: userEmail }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
      error: error.message,
    });
  }
});

router.get('/studio/:studioId', async (req, res) => {
  try {
    const { studioId } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID',
      });
    }

    const query = {
      studioId,
      status: { $ne: 'Cancelled' },
    };

    if (date) {
      query.date = date;
    }

    const activeBookings = await Booking.find(query).select('date startTime endTime status');

    return res.status(200).json({
      success: true,
      data: activeBookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve studio booked slots',
      error: error.message,
    });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      studioId,
      date,
      startTime,
      endTime,
      totalHours,
      totalCost,
    } = req.body;

    if (!studioId || !date || !startTime || !endTime || !totalHours || totalCost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All booking fields are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const studio = await Studio.findById(studioId);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found',
      });
    }

    if (studio.ownerEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own studio listing',
      });
    }

    const newStartMin = timeToMinutes(startTime);
    const newEndMin = timeToMinutes(endTime);

    if (newStartMin >= newEndMin) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const existingBookings = await Booking.find({
      studioId,
      date,
      status: { $ne: 'Cancelled' },
    });

    const hasCollision = existingBookings.some((booking) => {
      const existingStartMin = timeToMinutes(booking.startTime);
      const existingEndMin = timeToMinutes(booking.endTime);
      return newStartMin < existingEndMin && newEndMin > existingStartMin;
    });

    if (hasCollision) {
      return res.status(409).json({
        success: false,
        message: 'This studio is already booked for the selected time slot. Please choose another time or date.',
      });
    }

    const newBooking = new Booking({
      studioId,
      studioTitle: studio.title,
      studioImage: studio.imageUrl,
      bookerEmail: req.user.email.toLowerCase(),
      bookerName: req.user.name || 'Creator',
      date,
      startTime,
      endTime,
      totalHours: Number(totalHours),
      totalCost: Number(totalCost),
      status: 'Confirmed',
    });

    const savedBooking = await newBooking.save();

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: savedBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
});

router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.bookerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only cancel your own bookings.',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
});

module.exports = router;
