const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Studio = require('../models/Studio');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/studio/:studioId', async (req, res) => {
  try {
    const { studioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const reviews = await Review.find({ studioId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve studio reviews',
      error: error.message,
    });
  }
});

router.get('/check/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const review = await Review.findOne({ bookingId });
    return res.status(200).json({
      success: true,
      reviewed: !!review,
      data: review || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check review status',
      error: error.message,
    });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { studioId, bookingId, rating, comment, productionType } = req.body;

    if (!studioId || !bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Studio ID, Booking ID, star rating, and review comment are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studioId) || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID or booking ID format',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (String(comment).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Review comment must be at least 10 characters long',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Associated booking session not found',
      });
    }

    if (booking.bookerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only review production sessions that you booked.',
      });
    }

    if (booking.status === 'Cancelled' || booking.status === 'Declined') {
      return res.status(400).json({
        success: false,
        message: 'Cannot review a cancelled or declined reservation',
      });
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a verified review for this shoot session',
      });
    }

    const newReview = new Review({
      studioId,
      bookingId,
      bookerEmail: req.user.email.toLowerCase(),
      bookerName: req.user.name || booking.bookerName || 'Verified Creator',
      rating: numericRating,
      comment: String(comment).trim(),
      productionType: productionType ? String(productionType).trim() : 'Production Shoot',
    });

    const savedReview = await newReview.save();

    const stats = await Review.aggregate([
      { $match: { studioId: new mongoose.Types.ObjectId(studioId) } },
      {
        $group: {
          _id: '$studioId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Studio.findByIdAndUpdate(studioId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Verified creator review submitted successfully',
      data: savedReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message,
    });
  }
});

module.exports = router;
