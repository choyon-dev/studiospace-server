const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Studio title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Capacity must be at least 1 person'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'United States',
    },
    coordinates: {
      lat: { type: Number },
      lon: { type: Number },
    },
    osmPlaceId: {
      type: String,
    },
    specs: {
      squareFeet: {
        type: Number,
        required: [true, 'Square footage is required'],
        default: 1500,
        min: 50,
      },
      ceilingHeight: {
        type: String,
        required: [true, 'Ceiling height is required'],
        trim: true,
        default: '16 ft clearance',
      },
      floorType: {
        type: String,
        required: [true, 'Floor type is required'],
        trim: true,
        default: 'Seamless Polished Concrete',
      },
      powerService: {
        type: String,
        required: [true, 'Power service is required'],
        trim: true,
        default: '3-Phase 200A Camlock',
      },
      soundRating: {
        type: String,
        required: [true, 'Sound STC rating is required'],
        trim: true,
        default: 'STC 60 Soundproof',
      },
      hvacType: {
        type: String,
        required: [true, 'HVAC climate rating is required'],
        trim: true,
        default: 'Ultra-Silent Whisper Air (NC-20)',
      },
      freightAccess: {
        type: String,
        required: [true, 'Freight access is required'],
        trim: true,
        default: 'Ground-level loading dock',
      },
      lightingControl: {
        type: String,
        required: [true, 'Lighting control is required'],
        trim: true,
        default: '100% Blackout Capable',
      },
      internetSpeed: {
        type: String,
        required: [true, 'Internet connectivity is required'],
        trim: true,
        default: '1 Gbps Dedicated Fiber (Wi-Fi 6E)',
      },
      parkingSpaces: {
        type: String,
        required: [true, 'Parking details are required'],
        trim: true,
        default: 'Dedicated on-site parking',
      },
    },
    images: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      required: [true, 'Studio image URL is required'],
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    overview: {
      type: String,
      required: [true, 'Studio overview is required'],
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      trim: true,
      lowercase: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewCount: {
      type: Number,
      default: 12,
      min: [0, 'Review count cannot be negative'],
    },
    bookingMode: {
      type: String,
      enum: ['Instant', 'Request'],
      default: 'Instant',
    },
  },
  {
    timestamps: true,
  }
);

studioSchema.index({ category: 1, hourlyRate: 1, rating: -1 });
studioSchema.index({ ownerEmail: 1 });

module.exports = mongoose.model('Studio', studioSchema);
