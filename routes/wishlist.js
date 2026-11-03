const express = require('express');
const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Studio = require('../models/Studio');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/my', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const items = await Wishlist.find({ userEmail })
      .populate('studioId')
      .sort({ createdAt: -1 });

    const validItems = items.filter((item) => item.studioId != null);
    const ids = validItems.map((item) => item.studioId._id.toString());
    const studios = validItems.map((item) => item.studioId);

    return res.status(200).json({
      success: true,
      count: validItems.length,
      ids,
      data: studios,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist items',
      error: error.message,
    });
  }
});

router.post('/toggle', verifyToken, async (req, res) => {
  try {
    const { studioId } = req.body;
    const userEmail = req.user.email.toLowerCase();

    if (!studioId || !mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid studio ID is required',
      });
    }

    const studioExists = await Studio.findById(studioId);
    if (!studioExists) {
      return res.status(404).json({
        success: false,
        message: 'Studio workspace not found',
      });
    }

    const existing = await Wishlist.findOne({ userEmail, studioId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        isFavorited: false,
        studioId: studioId.toString(),
        message: 'Studio removed from your saved spaces',
      });
    }

    const newSaved = await Wishlist.create({
      userEmail,
      studioId,
    });

    return res.status(201).json({
      success: true,
      isFavorited: true,
      studioId: studioId.toString(),
      message: 'Studio added to your saved spaces',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        isFavorited: true,
        studioId: req.body.studioId,
        message: 'Studio already in your saved spaces',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to toggle wishlist item',
      error: error.message,
    });
  }
});

router.get('/check/:studioId', verifyToken, async (req, res) => {
  try {
    const { studioId } = req.params;
    const userEmail = req.user.email.toLowerCase();

    if (!studioId || !mongoose.Types.ObjectId.isValid(studioId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const existing = await Wishlist.findOne({ userEmail, studioId });

    return res.status(200).json({
      success: true,
      isFavorited: !!existing,
      studioId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: error.message,
    });
  }
});

module.exports = router;

