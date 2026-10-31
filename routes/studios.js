const express = require('express');
const mongoose = require('mongoose');
const Studio = require('../models/Studio');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/featured', async (req, res) => {
  try {
    const featuredStudios = await Studio.find()
      .sort({ rating: -1, createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      count: featuredStudios.length,
      data: featuredStudios,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch featured studios',
      error: error.message,
    });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase();
    const myStudios = await Studio.find({ ownerEmail: userEmail }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: myStudios.length,
      data: myStudios,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user studios',
      error: error.message,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { overview: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'priceAsc') {
      sortOption = { hourlyRate: 1 };
    } else if (sortBy === 'priceDesc') {
      sortOption = { hourlyRate: -1 };
    } else if (sortBy === 'ratingDesc') {
      sortOption = { rating: -1 };
    } else if (sortBy === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const studios = await Studio.find(query).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: studios.length,
      data: studios,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch studios',
      error: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch studio details',
      error: error.message,
    });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      amenities,
      overview,
    } = req.body;

    if (!title || !category || !hourlyRate || !maxCapacity || !location || !imageUrl || !overview) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required studio details',
      });
    }

    const newStudio = new Studio({
      title,
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      maxCapacity: Number(maxCapacity),
      location,
      imageUrl,
      amenities: Array.isArray(amenities) ? amenities : [],
      overview,
      ownerEmail: req.user.email.toLowerCase(),
      ownerName: req.user.name || 'Studio Host',
      rating: 5.0,
      reviewCount: 1,
    });

    const savedStudio = await newStudio.save();

    return res.status(201).json({
      success: true,
      message: 'Studio created successfully',
      data: savedStudio,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create studio',
      error: error.message,
    });
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found',
      });
    }

    if (studio.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to modify this studio.',
      });
    }

    const updatableFields = [
      'title',
      'category',
      'hourlyRate',
      'securityDeposit',
      'maxCapacity',
      'location',
      'imageUrl',
      'amenities',
      'overview',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'hourlyRate' || field === 'securityDeposit' || field === 'maxCapacity') {
          studio[field] = Number(req.body[field]);
        } else {
          studio[field] = req.body[field];
        }
      }
    });

    const updatedStudio = await studio.save();

    return res.status(200).json({
      success: true,
      message: 'Studio updated successfully',
      data: updatedStudio,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update studio',
      error: error.message,
    });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studio ID format',
      });
    }

    const studio = await Studio.findById(id);
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio not found',
      });
    }

    if (studio.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this studio.',
      });
    }

    await Studio.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Studio deleted successfully',
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete studio',
      error: error.message,
    });
  }
});

module.exports = router;
