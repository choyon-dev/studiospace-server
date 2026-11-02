const express = require('express');
const mongoose = require('mongoose');
const Studio = require('../models/Studio');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

router.get('/meta', async (req, res) => {
  try {
    const [categoriesAgg, hubsAgg, rateBoundsAgg, amenitiesAgg] = await Promise.all([
      Studio.aggregate([
        { $match: { category: { $exists: true, $ne: '' } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Studio.aggregate([
        { $match: { city: { $exists: true, $ne: '' } } },
        {
          $group: {
            _id: '$city',
            count: { $sum: 1 },
            state: { $first: '$state' },
            country: { $first: '$country' },
          },
        },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Studio.aggregate([
        {
          $group: {
            _id: null,
            minRate: { $min: '$hourlyRate' },
            maxRate: { $max: '$hourlyRate' },
            totalCount: { $sum: 1 },
          },
        },
      ]),
      Studio.distinct('amenities'),
    ]);

    const categories = categoriesAgg.map((item) => ({
      name: item._id,
      count: item.count,
      slug: String(item._id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    }));

    const hubs = hubsAgg.map((item) => ({
      city: item._id,
      state: item.state || '',
      country: item.country || 'United States',
      count: item.count,
      label: item.state ? `${item._id}, ${item.state}` : item._id,
    }));

    const rateBounds = rateBoundsAgg[0] || { minRate: 45, maxRate: 250, totalCount: 0 };

    return res.status(200).json({
      success: true,
      data: {
        categories,
        hubs,
        rateRange: {
          min: rateBounds.minRate || 40,
          max: rateBounds.maxRate || 300,
        },
        amenities: amenitiesAgg || [],
        totalStudios: rateBounds.totalCount || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate studio metadata',
      error: error.message,
    });
  }
});

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
    const { category, hub, search, minPrice, maxPrice, sortBy } = req.query;
    const query = {};

    if (category && category !== 'All') {
      const categorySlug = String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      query.$or = [
        { category: new RegExp(`^${category.trim()}$`, 'i') },
        { category: new RegExp(category.trim(), 'i') },
      ];
    }

    if (hub && hub !== 'All') {
      const hubRegex = new RegExp(hub.trim(), 'i');
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ city: hubRegex }, { location: hubRegex }, { state: hubRegex }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ city: hubRegex }, { location: hubRegex }, { state: hubRegex }];
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { title: searchRegex },
        { location: searchRegex },
        { city: searchRegex },
        { overview: searchRegex },
        { amenities: searchRegex },
        { 'specs.powerService': searchRegex },
        { 'specs.soundRating': searchRegex },
      ];

      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    if (minPrice || maxPrice) {
      query.hourlyRate = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.hourlyRate.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.hourlyRate.$lte = Number(maxPrice);
      }
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
    let studio = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      studio = await Studio.findById(id);
    }

    if (!studio) {
      studio = await Studio.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!studio) {
      const cleanSlug = slugify(id);
      studio = await Studio.findOne({
        $or: [
          { slug: cleanSlug },
          { title: { $regex: new RegExp(`^${cleanSlug.replace(/-/g, ' ')}$`, 'i') } },
          { title: { $regex: new RegExp(cleanSlug.replace(/-/g, '.*'), 'i') } },
        ],
      });
    }

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
      city,
      state,
      country,
      coordinates,
      osmPlaceId,
      specs,
      images,
      imageUrl,
      amenities,
      overview,
    } = req.body;

    const rawImages = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string' && img.trim().length > 0)
      : (imageUrl ? [imageUrl] : []);

    if (rawImages.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A minimum of 2 studio images are required to publish a listing.',
      });
    }

    const primaryImageUrl = rawImages[0];

    if (!title || !category || !hourlyRate || !maxCapacity || !location || !primaryImageUrl || !overview) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required basic studio information.',
      });
    }

    const rawSpecs = specs || {};
    const normalizedSpecs = {
      squareFeet: Number(rawSpecs.squareFeet) || 1200,
      ceilingHeight: String(rawSpecs.ceilingHeight || '16 ft clearance').trim(),
      floorType: String(rawSpecs.floorType || 'Seamless Polished Concrete').trim(),
      powerService: String(rawSpecs.powerService || '3-Phase 200A Camlock').trim(),
      soundRating: String(rawSpecs.soundRating || 'STC 60 Soundproof').trim(),
      hvacType: String(rawSpecs.hvacType || 'Ultra-Silent Whisper Air (NC-20)').trim(),
      freightAccess: String(rawSpecs.freightAccess || 'Ground-level loading dock').trim(),
      lightingControl: String(rawSpecs.lightingControl || '100% Blackout Capable').trim(),
      internetSpeed: String(rawSpecs.internetSpeed || '1 Gbps Dedicated Fiber (Wi-Fi 6E)').trim(),
      parkingSpaces: String(rawSpecs.parkingSpaces || 'Dedicated on-site parking').trim(),
    };

    let baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Studio.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const newStudio = new Studio({
      title,
      slug: uniqueSlug,
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
      maxCapacity: Number(maxCapacity),
      location,
      city: city || (location.split(',')[0] || '').trim(),
      state: state || '',
      country: country || 'United States',
      coordinates: coordinates || null,
      osmPlaceId: osmPlaceId || null,
      specs: normalizedSpecs,
      images: rawImages,
      imageUrl: primaryImageUrl,
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
      message: 'Studio created successfully with full technical specifications',
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
      'slug',
      'category',
      'hourlyRate',
      'securityDeposit',
      'maxCapacity',
      'location',
      'city',
      'state',
      'country',
      'coordinates',
      'osmPlaceId',
      'specs',
      'images',
      'imageUrl',
      'amenities',
      'overview',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'hourlyRate' || field === 'securityDeposit' || field === 'maxCapacity') {
          studio[field] = Number(req.body[field]);
        } else if (field === 'specs' && typeof req.body.specs === 'object') {
          studio.specs = {
            ...studio.specs.toObject(),
            ...req.body.specs,
            squareFeet: Number(req.body.specs.squareFeet) || studio.specs.squareFeet,
          };
        } else if (field !== 'images') {
          studio[field] = req.body[field];
        }
      }
    });

    if (req.body.images !== undefined) {
      const validImages = Array.isArray(req.body.images)
        ? req.body.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
        : [];
      if (validImages.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'A minimum of 2 studio images are required.',
        });
      }
      studio.images = validImages;
      studio.imageUrl = validImages[0];
    }

    if (req.body.title && !req.body.slug && !studio.slug) {
      studio.slug = slugify(req.body.title);
    }

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
